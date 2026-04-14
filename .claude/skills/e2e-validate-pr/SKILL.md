---
name: e2e-validate-pr
description: Validate a PR end-to-end with Playwright across multiple browsers and post a screenshot-rich summary to the PR. Trigger when the user says "e2e test this PR", "validate PR N", "run e2e on the PR", "check the PR in a browser", or invokes /e2e-validate-pr.
version: 0.1.0
---

# e2e-validate-pr

Single-command E2E validation for a PR: generate PR-specific Playwright tests from the diff, run them across **Chromium + Firefox + WebKit** in parallel, upload screenshots to a GitHub Gist, and post a markdown summary as a PR comment.

## Scope

- **Runs locally.** No CI assumed. Stack is `docker compose`.
- **PR-specific tests** are generated from the diff; existing `frontend/e2e/*.spec.js` are NOT re-run (those are pre-merge regressions).
- **Screenshots** live in a Gist, referenced by raw URL so they render inline in the PR comment.
- Generated specs are **ephemeral** — cleaned up after the run.

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

### 3. Bring the stack up

```
docker compose up -d
```

Wait for readiness (60s timeout each):
- Backend: `curl -fs http://localhost:8000/api/health/` returns 200.
- Frontend: `curl -fs http://localhost:5173/` returns 200.

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

### 6. Run across three browsers in parallel

```
cd frontend
npx playwright test e2e/.pr-runs/pr-<N>.spec.js \
  --reporter=list,json \
  --output=test-results/pr-<N>
```

The `playwright.config.js` declares three projects (chromium/firefox/webkit) with `fullyParallel: true`, so the N scenarios run 3× concurrently.

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

```
rm -rf frontend/e2e/.pr-runs/pr-<N>.spec.js frontend/test-results/pr-<N>
```

Leave the docker stack running (the user may want to keep inspecting).

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
