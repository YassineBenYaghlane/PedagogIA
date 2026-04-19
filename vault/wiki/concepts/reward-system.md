---
title: Reward System — XP and skill_xp
type: concept
created: 2026-04-19
updated: 2026-04-19
sources: []
tags: [pedagogy, gamification, mastery, selection]
---

PedagogIA uses **two distinct currencies** to reward the student. They serve different purposes and are updated under different rules.

## The two currencies

| currency | scope | purpose |
|---|---|---|
| **student XP** | per student (global) | extrinsic motivation, ranks, streaks, celebration |
| **skill_xp** | per `(student, skill)` | intrinsic progression, maps directly to mastery of that skill |

The separation matters: a student can rack up plenty of XP by doing compound exercises (diagnostic, exam) without any one skill progressing toward mastery. Conversely, drilling a single skill fills its `skill_xp` fast but yields modest XP per attempt. Both loops coexist.

## When each is awarded

| mode | student XP | skill_xp |
|---|---|---|
| **drill** (one chosen skill) | ✅ on correct | ✅ on correct |
| **training** (similar to drill) | ✅ on correct | ✅ on correct |
| **diagnostic** | ✅ on correct | ❌ |
| **exam** | ✅ on correct | ❌ |

Wrong attempts award nothing. Diagnostic and exam are **assessment contexts** — they measure the student's state but don't move the mastery needle. Only drill and training count toward skill_xp.

## Student XP formula

```
xp = base(difficulty) × multiplier(n_skills)
```

`base(difficulty)`:
- easy (d=1) → **10**
- medium (d=2) → **20**
- hard (d=3) → **30**

`multiplier(n_skills)`:
- 1 skill → **1.0**
- 2 skills → **1.4**
- 3+ skills → **1.8** (flat cap — removes the incentive to pack arbitrary skills into a template)

Resulting grid (XP per correct attempt):

| | 1 skill | 2 skills | 3+ skills |
|---|---|---|---|
| easy   | 10 | 14 | 18 |
| medium | 20 | 28 | 36 |
| hard   | 30 | 42 | 54 |

Multi-skill exercises pay more (they're harder) but still sub-linear — twice the skills is not twice the reward.

## skill_xp — 0-to-30 progression

Per `(student, skill)`, a single float counter from 0.0 to 30.0. Each correct attempt in drill/training mode adds credit to the skill_xp of every skill linked to the template. Credit is capped at 30.

### Status bands

| skill_xp | status | plant state (JARDIN) |
|---|---|---|
| = 0 | `not_started` | *en sommeil* |
| > 0 and < 10 | `learning_easy` | *à arroser* |
| 10 – 20 | `learning_medium` | *en croissance* (early) |
| 20 – 30 | `learning_hard` | *en croissance* (late) |
| = 30 | `mastered` | *floraison* |

An additional **`needs_review` overlay** flips on when `skill_xp < 20` and the skill hasn't been practiced for 30+ days. Rationale: at skill_xp ≥ 20 the student already has enough mastery to unlock downstream skills, so forgetting is a smaller concern. Below 20, stale skills get surfaced for review. *(Deliberate POC simplification — revisit with real usage data.)*

## Tier-gated selection

The selector serves exercises at a difficulty matching the student's current skill_xp band:

| skill_xp | serves difficulty |
|---|---|
| < 10 | 1 (easy) |
| 10 – 20 | 2 (medium) |
| 20 – 30 | 3 (hard) |
| = 30 | out of drill pool → review queue |

This produces **organic tier progression** — the student can't skip ahead, because the only way to hit the medium band is to first fill the easy band. No explicit tier flags needed; the single counter drives everything.

Diagnostic and exam modes ignore tier gating entirely — they're allowed to pull any template regardless of the student's current band.

## Multi-skill weighting

A template can cover more than one skill, each with a **weight** (summing to 1.0 per template):

- **Mono-skill drill**: one skill at weight 1.0. Each correct drill moves skill_xp by +1.
- **Multi-skill training**: e.g. skill A at 0.7, skill B at 0.3. A correct attempt moves A by +0.7 and B by +0.3.

This means drills stay the fastest path to mastery. Multi-skill exercises also progress each linked skill, but fractionally — appropriate, since the exercise only partially tests any one skill.

## The design trade

Collapsing three per-tier counters into a single `skill_xp` value means we no longer hold a hard guarantee that mastery = exactly "10 easy + 10 medium + 10 hard" correct answers. In principle, a skill could reach 30 mostly via multi-skill exposure at higher difficulties. In practice it's rare: direct drills are weight-1 and tier-matched, so they dominate the counter for any skill the student actively works on. Accepted as a POC simplification in exchange for a much simpler model.

## See also

- [[concepts/evaluation-formative]] — why we measure state without punishing failure
- [[concepts/approche-spiralaire]] — why skills are revisited; rationale for the `needs_review` overlay
- [[concepts/resolution-problemes-math]] — multi-skill exercises live in this space
- [[concepts/ceb-attendus-p6-arithmetique]] — compound tasks that naturally become multi-skill templates
