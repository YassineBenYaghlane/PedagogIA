---
title: Égalité mathématique (résultat vs équivalence)
type: concept
created: 2026-04-17
updated: 2026-04-17
sources: [referentiel-mathematiques]
tags: [math, arithmetic, algebra, misconception]
---

The `=` symbol carries **two distinct meanings** that the FWB référentiel makes a deliberate effort to teach separately, because students' early intuition — "= means the result comes next" — is a well-documented obstacle to later algebraic reasoning.

## The two senses

- **Égalité en termes de résultat** — `a + b = c` where `c` is "the answer". This is what students naturally pick up in P1.
- **Égalité en termes d'équivalence** — both sides of `=` are two writings of the *same number*. The order doesn't have to be (operation → result). This is essential for later algebra.

## Progression P1 → P6

- **P1** — introduction of `=` and `≠`, used purely in the "résultat" sense (addition/soustraction ≤20). First conceptual seed: "de part et d'autre d'une égalité, les deux écritures différentes représentent un même nombre".
- **P2** — explicit introduction of the *équivalence* sense. Examples attended: `12 + 7 = 19`, **and also `19 = 12 + 7`**, **and `12 + 7 = 20 − 1`**, **and `15 + 5 = 4 × 5`**. Very deliberate attempt to break the "equals-means-next" model.
- **P3** — égalité dans des **enchaînements opératoires** (e.g. `12 × 5 = (12 × 10) : 2 = 120 : 2 = 60`). Students asked to **ajuster les fausses égalités** (e.g. `12 + 23 = 35 + 2 = 37` ⇒ to be split into two correct equalities).
- **P4** — équivalence jusqu'à 200 (`190 = 62 + 128`, `152 + 17 = 190 − 21`, `52 × 3 = 200 − 44`), with correct enchainments.
- **P5** — expressions et signes de l'égalité dans des calculs plus complexes.
- **P6** — maîtrise; prépare l'équivalence algébrique en S1.

The référentiel explicitly says: *"la compréhension qu'ont les élèves de l'égalité s'affine également progressivement. Dès la première primaire, ils apprennent à cerner que, de part et d'autre d'une égalité, les deux écritures différentes représentent un même nombre. … Il est donc nécessaire de revenir sur les différents sens de l'égalité, même dans les dernières années de l'école primaire."*

## Classic misconception to detect

A student who writes `12 + 7 = 20 − 1 = 19` **as a single chain** is applying the "result" model, not the equivalence model. The référentiel calls these "*fausses égalités*" — the P3 attendu *ajuster les fausses égalités pour qu'elles deviennent vraies* is literally pointed at this bug.

## Why this matters for PedagogIA

- A natural **investigation pattern** for the Claude API: when a student fails on a problem involving enchainements, probe for the égalité misconception. "Est-ce que `12 + 7` et `20 − 1` représentent le même nombre ?" is a Socratic first step.
- Exercise templates should include both senses from P2 on — not just `a + b = ?` but also `? = a + b` and `a + b = c − 1`.
- **Hint strategy**: reformulate as "les deux côtés de `=` sont deux noms du même nombre".

## See also

- [[concepts/champ-3-arithmetique]]
- [[concepts/resolution-problemes-math]]
- [[sources/referentiel-mathematiques]]
