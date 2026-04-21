---
title: Template variant count
type: concept
created: 2026-04-21
updated: 2026-04-21
sources: []
tags: [exercises, templates, metrics, coverage]
---

An estimated per-template metric: how many distinct exercises can this template produce? Proposed as a cheap, aggregable answer to "do we have variety for skill X?" without the cost of curating exercises individually. Surfaces in the Atelier playground and aggregates naturally per-skill.

## Why it exists

The pipeline generates exercises parametrically (see [[concepts/templates-vs-curated-exercises]]). That gives effectively unlimited reach but makes coverage **invisible**: you can't tell at a glance whether a skill has thin parametric reach or ample variety. A per-template variant count makes this sortable, filterable, heatmappable.

## What counts as "different"

The design choice that decides everything:

- **By generated `params` hash** (proposed). Honest, generator-agnostic, one-line hash. `2 + 3` and `3 + 2` count as distinct.
- **By displayed `prompt`.** Mostly same as above but collapses MCQ where only distractor sets vary.
- **By mathematically distinct problem.** Merges commutative cases. Nicer pedagogically but requires per-generator logic.

Recommendation: **unique `params` hash**. Simplest, honest, aligns with what the student actually sees.

## How to measure

### Analytical
Compute the combinatorial space from YAML params (`range(a) × range(b)` minus invalid combinations). Fast, but wrong when constraints (`requires_carry`, `exact_division`, `result_non_negative`) interact. Each generator needs its own math; drifts as generators evolve.

### Empirical (recommended)
At seed time, instantiate each template N=1000 times with seeded RNG, count unique `params` hashes. Reports:
- exact variant count for small pools,
- `≥N` for pools larger than the sample,
- **retry rate for free** — how often the constraint solver re-rolled. Independent signal of pool health.

Cost: ~30 s for the current ~300 templates. Recomputes on every `seed_templates` invocation. Natural companion to the seed-time validation work in [[#176]].

## What it does *not* measure

- **Quality.** A template with `variant_count = 10 000` can still produce boring cases (`5 vs 5` in `comparison` all day) if constraints aren't tight. Fix: tighten constraints, not curate exercises.
- **Pedagogical value.** High variance in operands ≠ high learning value.
- **Calibration.** A huge pool can still be uniformly too easy or too hard — only `Attempt` data tells you that ([[questions/exercise-quality-evaluation]] Layer 1).

So the count is a **necessary but insufficient** signal. Pair with correct-rate (Layer 1) and AI rubric alignment (Layer 3) for the full picture.

## Implementation shape

- `ExerciseTemplate.variant_estimate` — nullable int.
- `ExerciseTemplate.variant_sample_size` — the N used (so `≥N` is unambiguous).
- `ExerciseTemplate.retry_rate` — float, 0–1.
- Populated by a new `audit_templates` management command (or extension of [[#176]]).
- Surfaced in the Atelier playground detail panel as `~1 200 variantes` / `≥1 000 variantes`.
- Aggregatable per-skill via simple GROUP BY on `TemplateSkillWeight`.

## See also

- [[questions/exercise-quality-evaluation]] — the parent design question this metric serves.
- [[concepts/templates-vs-curated-exercises]] — the architectural context; this metric is the cheap alternative to curation.
- [[concepts/ceb-attendus-p6-arithmetique]] — the use-case where raw variant count isn't enough and curation wins.
