# Spec-generation conventions for `e2e-validate-pr`

When Claude writes `frontend/e2e/.pr-runs/pr-<N>.spec.js`, follow these rules
so results are stable, parseable, and cleanable.

## File shape

```js
import { test, expect } from "@playwright/test"
import { mkdirSync } from "node:fs"
import path from "node:path"

const SHOTS = process.env.E2E_SHOT_DIR || "e2e/screenshots/pr-run"
mkdirSync(SHOTS, { recursive: true })

const shot = (testInfo, label) =>
  path.join(SHOTS, `${testInfo.project.name}-${testInfo.title.replace(/\W+/g, "-")}-${label}.png`)

test.describe("PR #<N> validation", () => {
  // tests here
})
```

Each `test()` block = one scenario from the plan.

## Selectors

Prefer, in order:
1. `page.getByTestId("...")` — known ids: `register-email`, `register-password`,
   `register-submit`, `login-email`, `login-password`, `login-submit`,
   `child-name`, `child-grade`, `child-add`, `children-list`, `child-<id>`,
   `start-training`, `logout`.
2. `page.getByRole("button", { name: /regex/i })` — for named controls.
3. `page.locator("input[inputmode='decimal']")` — exercise answer input.
4. Text matchers — only as a last resort and always with `.first()` if
   multiple matches (see how `exercise.spec.js` handles "Pas tout à fait").

## Screenshots

Capture at every meaningful milestone:
```js
await page.screenshot({ path: shot(testInfo, "step-01-home"), fullPage: true })
```

Filename format: `<project>-<test-slug>-<label>.png`.
- `<project>` is Playwright's project name (chromium/firefox/webkit).
- `<test-slug>` comes from the scenario title; `collect_results.py` slugifies
  the scenario the same way, so pairing Just Works.
- `<label>` is an ordered string the scenario uses to name steps
  (`step-01-home`, `step-02-feedback`, …).

## Data isolation

Every test registers its own account so scenarios don't share parent/children state:
```js
const email = `e2e-pr<N>-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`
```

The random suffix is there because scenarios run in parallel (`fullyParallel: true` in `playwright.config.js`) and a timestamp alone can collide.

## French UI

All user-facing strings are in French. Assertions use regex with `i` flag:
```js
await expect(page.getByText(/pas tout à fait/i).first()).toBeVisible({ timeout: 15000 })
```

## Timeouts

- Network-dependent steps (AI investigation, session creation): 15s.
- Simple UI transitions: default 5s.
- Never hardcode `sleep()`.

## Anti-patterns

- Do not reuse state across `test()` blocks (each browser starts fresh).
- Do not call Anthropic / the backend from the spec — drive everything
  through the UI.
- Do not assert on skill IDs unless the UI explicitly renders them.
