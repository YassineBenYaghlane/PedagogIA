---
name: e2e-validate-pr
description: Validate a PR end-to-end with Playwright across multiple browsers and post a screenshot-rich summary to the PR. Trigger when the user says "e2e test this PR", "validate PR N", "run e2e on the PR", "check the PR in a browser", or invokes /e2e-validate-pr.
version: 0.1.0
---

# e2e-validate-pr

Single-command E2E validation for a PR: generate PR-specific Playwright tests from the diff, run them against **three isolated Docker stacks** (one per browser: Chromium / Firefox / WebKit), push screenshots to a dated orphan branch in the repo, and post a markdown summary (with inline screenshots) as a PR comment.

## Scope

- **Runs locally.** No CI assumed.
- **Parallel isolation**: each browser gets its own `docker compose` project on its own ports (frontend 5174/5175/5176, backend 8001/8002/8003, postgres 5412/5413/5414). The dev stack on 5173/8000/5411 stays untouched.
- **PR-specific tests** are generated from the diff; existing `frontend/e2e/*.spec.js` are NOT re-run.
- **Screenshots** are pushed to a dated orphan branch `e2e-runs/pr-<N>-<timestamp>` and referenced via `raw.githubusercontent.com` URLs so they render inline in the PR comment. (`gh gist create` rejects binaries; branch push is the dependency-free alternative.)
- Stacks and generated specs are **ephemeral** — stacks are torn down on exit (even on failure) and the spec is deleted.

## Preconditions

- `gh` CLI authenticated.
- Docker running.
- `frontend/node_modules` installed.
- Playwright browsers installed. First run: `cd frontend && npx playwright install --with-deps chromium firefox webkit`. The orchestrator detects missing browsers and installs them automatically.

## Workflow

Follow these steps in order. If a step fails, stop and report the failure — do not post the comment.

### 1. Resolve target PR

If the user provided a number: `PR=$1`.
Else: `PR=$(gh pr view --json number --jq .number)` (current branch).

Fetch context:
```
gh pr view "$PR" --json number,title,body,baseRefName,headRefName,author
gh pr diff "$PR"
```

### 2. Checkout the PR branch

```
gh pr checkout "$PR"
```

### 3. Boot three isolated stacks (handled by `run.sh`)

`scripts/stack.sh up <N>` spins up an isolated stack with project name
`pedagogia-e2e-<N>` and ports offset by `<N>` from the dev stack. The
orchestrator boots stacks 1, 2, 3 in parallel and waits for each
backend's `/api/health/` and frontend's `/` to respond (120s timeout).

### 4. Design a test plan

Using the PR title, body, and diff as context, produce an ordered checklist of **3–6 scenarios** tied to what changed. Each scenario must be:
- Observable in the browser (routes, UI changes, data flows)
- Independent (no shared state between scenarios)
- Specific ("wrong answer → AI feedback panel renders French message", not "exercise works")

Print the plan to the user before generating specs.

### 5. Generate Playwright specs

Write to `frontend/e2e/.pr-runs/pr-<N>.spec.js`. Conventions (see `references/conventions.md`):
- One `test()` per scenario.
- Use `page.getByTestId()` for selectors; existing testids like `register-email`, `child-add`, `start-training`, `logout` are available.
- Capture `page.screenshot({ path: \`${SHOTS}/<browser>-<scenario>-<step>.png\`, fullPage: true })` at key milestones.
- Screenshots go to `frontend/e2e/screenshots/pr-<N>/` — the path is per-run, per-browser via Playwright's `project.use.contextOptions` if needed.
- All UI text assertions in French.

### 6. Run across three browsers against three stacks

```
cd frontend
E2E_PARALLEL=1 npx playwright test e2e/.pr-runs/pr-<N>.spec.js \
  --reporter=list,json \
  --output=test-results/pr-<N>
```

`playwright.config.js` reads `E2E_PARALLEL=1` and pins each browser project
to its own stack (chromium→:5174, firefox→:5175, webkit→:5176). With
`fullyParallel: true`, scenarios within each browser also run concurrently.
Data isolation is full — each stack has its own Postgres.

### 7. Collect results

```
python3 .claude/skills/e2e-validate-pr/scripts/collect_results.py \
  --pr "$PR" \
  --results frontend/test-results/pr-<N> \
  --json frontend/test-results.json \
  > /tmp/pr-<N>-summary.md
```

`collect_results.py` reads the JSON reporter output, groups pass/fail by (scenario × browser), and emits the markdown body + a newline-separated list of screenshot paths.

### 8. Upload screenshots

```
bash .claude/skills/e2e-validate-pr/scripts/upload_screenshots.sh "$PR" \
  frontend/test-results/pr-<N>
```

Creates a single gist with all PNGs, writes raw URLs to `/tmp/pr-<N>-gist.json` keyed by filename.

### 9. Post the PR comment

Substitute gist URLs into the summary markdown, then:
```
gh pr comment "$PR" --body-file /tmp/pr-<N>-summary.md
```

### 10. Clean up

Tear down the 3 parallel stacks (`run.sh` does this via an `EXIT` trap, so
it runs even on failure):

```
for id in 1 2 3; do
  bash .claude/skills/e2e-validate-pr/scripts/stack.sh down "$id"
done
rm -rf frontend/e2e/.pr-runs/pr-<N>.spec.js frontend/test-results/pr-<N>
```

The dev stack (ports 5173/8000/5411) is never touched.

## Orchestrator

`scripts/run.sh` executes steps 1–3, 6–10. Steps 4–5 (test plan design + spec generation) stay in Claude's main loop because they need LLM judgment on the diff. The script accepts the generated spec path as an argument.

Typical invocation by Claude:
```
bash .claude/skills/e2e-validate-pr/scripts/run.sh <PR_NUMBER> <spec_path>
```

## Output contract

The PR comment MUST contain:
- Title with PR number
- Scenarios list (numbered)
- Results table (scenario rows × browser columns, ✅/❌)
- At least one screenshot per scenario from the chromium run (golden path)
- Link to the gist for full artifact access
- Footer identifying the skill

## When to skip this skill

- PR changes only backend code with no observable UI effect — rely on `uv run pytest` instead.
- Docs-only PRs — no validation needed.
- When the user explicitly asks for a "smoke test" — run `npx playwright test` against existing specs without generating new ones.
