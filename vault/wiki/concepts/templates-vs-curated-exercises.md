---
title: Templates vs. curated exercises
type: concept
created: 2026-04-21
updated: 2026-04-21
sources: []
tags: [exercises, templates, architecture, design-decisions]
---

The architectural choice between **parametric templates** (generators with random instantiation) and **pre-saved curated exercises** (concrete instances reviewed by a teacher). PedagogIA uses templates as the primary source; this page records the rationale after a 2026-04-21 design review where a curated-first model was proposed and rejected.

## Current design

`ExerciseTemplate` (JSONB `template` field) is the only first-class exercise model. At selection time, `generate_exercise(skill_id, difficulty)` picks a template, `instantiate()` samples random params within YAML-defined ranges, and the answer is bundled into a signed token so the client never sees it. Attempt logs store the concrete parametrisation on `Attempt.exercise_params`. See the pipeline walkthrough in conversation (2026-04-21).

## The proposal that was rejected

Introduce an `Exercise` table of concrete, teacher-validated instances. Selection order: `Exercise` pool first, fall back to `Template` when exhausted.

**Motivation (user's words):** "it's currently a bit difficult to see if we have a variety of exercises by skill."

## Why it was rejected

1. **Wrong problem, wrong solution.** The pain was *visibility*, not data model. Schema change doesn't help see what we have; tooling does. Addressed instead by [[concepts/template-variant-count]] + the Atelier playground.

2. **Curation is a content-ops bottleneck.** Champ 3, P1→P6 ≈ 100 skills × 3 difficulties = 300 cells. 10 reviewed exercises per cell = 3 000 teacher reviews before a curated-first system pays off. No teacher labor budgeted for this; no review UI built.

3. **Parametric reach disappears.** A `computation` template with `a_min: 100, a_max: 999` covers ~800 k distinct pairs. Curating 50 replacements gives 50. Drills burn through 20–30 questions per session; curated pools empty fast.

4. **Quality cliff.** When the curated pool empties mid-session and fallback kicks in, the "feel" of the questions changes — students notice. Rotation logic to avoid this (e.g. 30-day reuse windows) doubles complexity and interacts non-trivially with spaced repetition.

5. **Attempts already persist instances.** Every `Attempt` row stores the concrete parametrisation. "Show me what was asked last month for skill X" is a one-query report on existing data — no schema change needed.

6. **Variety ≠ curation.** The underlying "is this template producing boring examples?" concern is solved by tightening constraints in YAML (e.g. degenerate-case detection in Layer 2 of [[questions/exercise-quality-evaluation]]), not by swapping generation for hand-crafted items.

## The cut that *does* make sense

The proposal conflates two genuinely distinct use-cases:

- **Drill / free practice.** Student needs *varied repetition*. Parametric generation is the right tool.
- **Assessment / diagnostic / exam.** Needs *specific, curated* items (benchmark fidelity, CEB-Core-9 style). Curation matters here.

Right answer: **keep templates as the base; introduce curated items only for assessment-grade content.** Issue [[#110]] (Core-9 CEB templates) already points this way via `fixed_items` patterns inside templates. No separate `Exercise` table needed — a nullable `CuratedItem` FK or an `is_assessment_grade` flag on templates covers it when the time comes.

## Decision markers

- Templates remain the single source.
- Variety visibility solved by [[concepts/template-variant-count]] + Atelier playground.
- Quality evaluation follows the three-layer plan in [[questions/exercise-quality-evaluation]].
- Curation revisited only in the context of assessment-grade content, scoped under [[#110]] and its follow-ups.

## See also

- [[questions/exercise-quality-evaluation]] — the broader quality question this decision feeds into.
- [[concepts/template-variant-count]] — the cheap metric replacing the curated-first motivation.
- [[concepts/ceb-attendus-p6-arithmetique]] — where curation *does* win, in assessment context.
- [[concepts/product-features]] — current state of exercise generation in the shipped product.
