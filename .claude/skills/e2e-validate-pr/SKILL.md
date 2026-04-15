---
name: e2e-validate-pr
description: End-to-end validation of a PR in a real browser — generate PR-specific Playwright scenarios from the diff, run them against an isolated docker compose stack (its own Postgres/Django/Vite on shifted ports), and post a screenshot-rich summary comment on the PR. Use this skill whenever the user asks to "e2e test this PR", "validate PR N", "check the PR in a browser", "run playwright on this PR", "take screenshots for PR review", or invokes `/e2e-validate-pr` — even if they don't explicitly say Playwright. Also worth using proactively right before merging a frontend-touching PR so the comment is on the PR before approval. Tests run on a single browser (Chromium) for speed and signal clarity — cross-browser coverage is handled by the existing evergreen specs in `frontend/e2e/` instead.
version: 0.2.0
---

# e2e-validate-pr

End-to-end PR validation in one command:

1. Read the PR title, body, and diff to design a short scenario list grounded in what actually changed.
2. Generate a throwaway Playwright spec for those scenarios.
3. Boot a fully isolated docker compose stack (its own DB, backend, and Vite, on ports shifted by +1 from dev) so the dev stack on 5173/8000/5411 is untouched.
4. Run the spec on **Chromium** against that stack.
5. Push the screenshots to a dated orphan branch (`e2e-runs/pr-<N>-<timestamp>`) so they render inline on the PR.
6. Post a markdown summary with the scenario table and screenshots as a PR comment.
7. Tear everything down (stack + spec + JSON reporter output), leaving only the screenshot branch and the PR comment behind.

## Why single-browser

Cross-browser regressions are caught by the evergreen specs committed under `frontend/e2e/` — those already run on chromium/firefox/webkit. The purpose of *this* skill is different: give a human reviewer a grounded, screenshot-backed summary of the PR's actual behavior before they click Approve. One browser is enough for that job, and booting three isolated docker stacks to get three near-identical screenshots of the same UI was a poor time/token tradeoff. Chromium is chosen because it matches the most common end-user browser and because Playwright's Chromium build is the lightest of the three.

## Preconditions

- `gh` CLI authenticated.
- Docker running.
- `frontend/node_modules` installed.
- Chromium installed for Playwright: `cd frontend && npx playwright install --with-deps chromium`. The orchestrator surfaces a helpful error if it's missing.

## Workflow

Follow the steps in order. If a step fails, stop and report — do not post the comment.

### 1. Resolve the PR

```bash
PR="${1:-$(gh pr view --json number --jq .number)}"
gh pr view "$PR" --json number,title,body,baseRefName,headRefName,author
gh pr diff "$PR"
```

### 2. Design a scenario plan

From the title, body, and diff, produce **3–6 scenarios** that are:
- **Observable in the browser** — routes, UI transitions, data shown on screen.
- **Specific** — "submitting a wrong answer renders the French AI feedback panel with an Explain button", not "exercise works".
- **Independent** — each scenario starts from a fresh registration so they don't share parent/children state.

Print the plan to the user before generating the spec; it's cheap to let them correct it before spinning docker.

### 3. Generate the spec

Write `frontend/e2e/.pr-runs/pr-<N>.spec.js`. Conventions live in `references/conventions.md` — read it if you're unsure about selectors, data isolation, or screenshot naming. Key points:

- One `test()` per scenario.
- Selectors: prefer `page.getByTestId(...)`. Known ids are listed in the conventions file.
- Every meaningful milestone gets a screenshot: `await page.screenshot({ path: shot(testInfo, "step-NN-label"), fullPage: true })`.
- Screenshots land in `$E2E_SHOT_DIR` (set by `run.sh`).
- UI text assertions stay in French.

### 4. Hand off to the orchestrator

```bash
bash .claude/skills/e2e-validate-pr/scripts/run.sh "$PR" frontend/e2e/.pr-runs/pr-"$PR".spec.js
```

`run.sh` is the single entry point for steps 5–9 below. It uses `set -euo pipefail` + an `EXIT` trap so the stack is always torn down, even on failure.

### 5. Checkout the PR branch

`gh pr checkout "$PR"` — the spec references are resolved against the PR's code, not `main`.

### 6. Boot the isolated stack

`scripts/stack.sh up 1` brings up docker project `pedagogia-e2e-1` on ports:

| service   | port |
|-----------|------|
| Vite      | 5174 |
| Backend   | 8001 |
| Postgres  | 5412 |

Shared named volumes (`e2e_backend_venv`, `e2e_frontend_node_modules`) are primed before boot so repeated runs skip `uv sync` and `npm install`.

The orchestrator then polls `http://localhost:8001/api/health/` and `http://localhost:5174/` until both respond (default 360s timeout, overrideable via `E2E_WAIT_TIMEOUT`).

### 7. Run Playwright on Chromium

```bash
export E2E_SHOT_DIR="$REPO_ROOT/frontend/e2e/screenshots/pr-$PR"
export E2E_PARALLEL=1             # switches baseURL to :5174 in playwright.config.js
export PLAYWRIGHT_JSON_OUTPUT_FILE="$JSON_OUT"
npx playwright test "$SPEC" \
  --project=chromium \
  --reporter=list,json \
  --output="test-results/pr-$PR"
```

`--project=chromium` is what restricts the run to one browser; `playwright.config.js` still declares firefox/webkit so you can run them manually during dev (`--project=firefox`), but the skill deliberately doesn't.

### 8. Collect results

```bash
python3 .claude/skills/e2e-validate-pr/scripts/collect_results.py \
  --pr "$PR" --shots "$SHOT_DIR" --json "$JSON_OUT" --out /tmp/pr-"$PR"-summary.md
```

Produces the PR-comment markdown: scenario list, pass/fail table for the Chromium column, and one screenshot per scenario embedded with local paths (rewritten to public URLs in the next step).

### 9. Publish screenshots + post the comment

```bash
bash .claude/skills/e2e-validate-pr/scripts/upload_screenshots.sh "$PR" "$SHOT_DIR" /tmp/pr-"$PR"-gist.json
python3 .claude/skills/e2e-validate-pr/scripts/collect_results.py \
  --pr "$PR" --shots "$SHOT_DIR" --json "$JSON_OUT" \
  --out /tmp/pr-"$PR"-summary.md --gist-map /tmp/pr-"$PR"-gist.json
gh pr comment "$PR" --body-file /tmp/pr-"$PR"-summary.md
```

Screenshots are pushed to a dated orphan branch because `gh gist create` rejects binary files. The summary's image links become `raw.githubusercontent.com` URLs so they render inline on the PR.

### 10. Tear down

The `EXIT` trap in `run.sh` runs `scripts/stack.sh down 1`, removes the generated spec, and deletes the per-run JSON reporter file. The dev stack (5173/8000/5411) is never touched.

## Output contract

The PR comment contains, in order:

- `## 🤖 E2E validation — PR #<N>`
- Numbered scenario list (mirrors the plan from step 2)
- Pass/fail table with one **Chromium** column
- Screenshots, one per scenario, labeled by scenario title
- Link to the screenshot branch
- Footer line identifying this skill

## When to skip this skill

- **Pure backend PR with no UI delta** — `uv run pytest` inside the repo is the right check.
- **Docs-only PR** — no validation needed.
- **User asked for a quick smoke test** — run `npx playwright test` against the existing evergreen specs without generating new ones.
- **User wants cross-browser sign-off** — the evergreen specs already run chromium/firefox/webkit; this skill is for PR-specific spot checks, not browser matrix coverage.
