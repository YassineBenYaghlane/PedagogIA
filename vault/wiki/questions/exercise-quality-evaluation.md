---
title: How to evaluate exercise quality automatically
type: question
created: 2026-04-21
updated: 2026-04-21
sources: []
tags: [exercises, quality, evaluation, templates, ai, design]
---

**Q:** How do we automatically evaluate whether PedagogIA has "good" exercises per skill — where "good" means variety, FWB alignment, and pedagogical value?

Design-level synthesis from a 2026-04-21 discussion that started on the variety-visibility problem and broadened into the full quality question. Anchors two supporting concept pages: [[concepts/templates-vs-curated-exercises]] (the architectural debate) and [[concepts/template-variant-count]] (the variety metric).

## Reframe: "good" = aligned + calibrated

The user's initial definition — variety + FWB fit + pedagogical value — treats "good" as an **intrinsic property** of the exercise. That misses the most measurable dimension: **calibration** to the actual students using it. An exercise can score 5/5 on an AI rubric and still be bad if:

- **98 % correct rate** → trivially easy, wastes session budget, no mastery signal.
- **22 % correct rate** → too hard, demoralising, success is noise.
- **Low discrimination** → students who've mastered and students who haven't both pass (or both fail) — the item isn't measuring the skill.

Right frame: *good = aligned to the référentiel × calibrated to real students.* Alignment is subjective and needs a human or an AI rubric. Calibration is **objective and measurable from `Attempt` rows** — no model needed, just aggregation. PedagogIA already has `test_diagnostic_irt.py` so IRT (item response theory) is partly wired; it's the rigorous answer to the calibration half.

## Three-layer architecture

Cheapest first. Use AI only where scripts and stats can't.

### Layer 1 — Passive stats from `Attempt`

Free, always on once users exist. Per-template, rolling 30 days:

- Correct rate (sweet spot 70–85 %).
- Median time-to-answer.
- Top 3 wrong answers + frequencies — real-world misconceptions, goldmine for future substep scoring (#112).
- Hint / explain rate — proxy for confusion.
- Sample size (below N=30 = noise, don't display).

Materialise as `TemplateStats` view or model. Surface in the Atelier panel alongside template metadata.

**Deferred until we have users** — zero signal before traffic. Not a priority now.

### Layer 2 — Structural checks (CI + seed-time)

Rule-based, fast, deterministic. Buildable today.

- Prompt renders cleanly — no `{}` leftovers, French typographic spaces (` ` before `: ? !`).
- MCQ sanity: correct answer ∈ options, no duplicate options, distractors non-trivial.
- Comparison: answer is symbolically consistent with generated operands.
- **Degenerate-case detector**: sample 1000 instantiations; flag if `a + 0`, `a = b`, `a × 1` etc. exceed 5 % of draws.
- Readability score (Flesch-Kincaid for French or a simpler char/word heuristic) vs. target grade.

Natural companion to [[#176]] (seed-time template validation). ~150 lines.

### Layer 3 — AI rubric review (batch, triggered)

For the parts humans can't scale and scripts can't touch. Buildable today; run quarterly or on content changes.

- **FWB alignment** — does this template target the right skill at the right grade?
- **Pedagogical quality** — is framing age-appropriate? Scenario culturally reasonable for a Belgian kid?
- **Distractor quality** (MCQ) — real misconceptions or trivial noise?
- **Ambiguity** — is there exactly one reasonable answer?

Shape:
- Claude Haiku 4.5 by default, escalate to Sonnet 4.6 on borderline.
- Context: template YAML + 5 sample instantiations + référentiel excerpt ([[concepts/ceb-attendus-p6-arithmetique]], [[concepts/champ-3-arithmetique]]) + rubric.
- **Prompt caching on rubric + référentiel** → cheap after first call.
- Output: structured JSON `{alignment, age_fit, clarity, distractor_quality, ambiguity_risk, rationale}`.
- Persist as `TemplateEvaluation(template_id, model, evaluated_at, scores, rationale)` — diffable across model versions and YAML edits.
- Rough cost estimate: ~300 templates × Haiku with caching < 2 €/pass. Quarterly cadence.

## Caveats

- **AI rubrics are nondeterministic.** Scores drift across model versions. Do not gate deploys on them. Use as *prioritisation signal* ("review these 5 low-clarity templates"), not pass/fail.
- **Layer 1 is the hard signal.** IRT-style calibration from real attempts beats any rubric. Once users exist, the rubric becomes a soft prior that Layer 1 empirically validates or contradicts.
- **Variety is a partial answer.** [[concepts/template-variant-count]] solves "does the pool exist?" but not "is the pool good?" — pair with Layer 1 correct-rate.

## Priorities (2026-04-21)

| Layer | Status | Blocker |
|-------|--------|---------|
| 1 — Attempt stats | Deferred | No users yet |
| 2 — Structural checks | Ready to build | — |
| 3 — AI rubric | Ready to build | — |

Layers 2 and 3 can ship before users arrive and start producing signal the moment traffic begins. Layer 1 waits on traffic.

## See also

- [[concepts/templates-vs-curated-exercises]] — upstream architectural question this discussion resolved.
- [[concepts/template-variant-count]] — the variety metric, one leg of this evaluation.
- [[concepts/ceb-attendus-p6-arithmetique]] — référentiel anchor the AI rubric checks against.
- [[concepts/resolution-problemes-math]] — home of the existing Claude investigation engine; the AI rubric would reuse the same model policy.
- Issues #176–#180 — Tier 1 exercise-pipeline hardening filed the same day.

## Filed under

`questions/` because this is synthesis, not a source summary. Anchor for the design decision; concrete implementation splits into separate issues when work starts.
