---
title: Résolution de problèmes (compétence Champ 3)
type: concept
created: 2026-04-17
updated: 2026-04-17
sources: [referentiel-mathematiques, ceb-2024]
tags: [math, problem-solving, competence]
---

The headline **compétence** of Champ 3 in the FWB référentiel, appearing in every year from P1 to P6 under the label *"Résoudre des problèmes en mobilisant des nombres et des opérations"*. It is the thread that integrates savoirs (number concepts) and savoir-faire (operations, algorithms) into genuine transfer tasks.

## Attendus progression

| Year | Problem surface |
|---|---|
| **P1** | Traduire une situation contextualisée par un dessin, puis par une opération (+, −); effectuer; communiquer le résultat |
| **P2** | +, −, ×; rédiger une situation à partir d'un résultat (*"maman a payé 12 euros"*) |
| **P3** | 4 opérations ≤1000; vérifier la plausibilité; rédiger un énoncé à partir de la communication du résultat (*"papa a payé 60 €"*) |
| **P4** | Décimaux au dixième; expressions comme "1+1 gratuit", "le deuxième à moitié prix"; bénéfice et perte; rédiger un énoncé |
| **P5** | Énoncés plus complexes (*"prix à partir de…"*, *"jusqu'à 70 % de remise"*); vérifier par opérations réciproques |
| **P6** | Plusieurs opérations successives; rédiger un énoncé de maximum trois calculs consécutifs |

## What a complete problem attends from the student (P3+)

Explicit decomposition in the référentiel:

1. **Traduire** la situation — dessin, verbalisation, puis écriture d'opérations.
2. **Effectuer** les calculs.
3. **Communiquer** le résultat avec précision.
4. **Vérifier** la plausibilité (estimation, opérations réciproques, calculatrice).
5. **Verbaliser** la démarche.

From **P4**, students must also be able to **rédiger un énoncé** from a bare result or a calculation chain — the *reverse* task, an explicit creativity/language component.

## Canonical example — CEB 2024 livret 7 Q13

The 2024 CEB makes this competence *measurable* by showing four candidate resolution chains and asking the student to pick the correct one (see [[sources/ceb-2024]] for context). The problem: *18 boîtes de 5 paquets, 2 classes maternelles reçoivent 3 paquets chacune, les 6 classes primaires se partagent le reste équitablement — combien de paquets par classe primaire ?*

| Résolution | Chain | Correct? |
|---|---|---|
| 1 | `18×5=90` · `90−2=88` · `88:8=11` | no — confuses classes and paquets |
| 2 | `18−6=12` · `12:6=2` · `2×5=10` | no — skips the multiplicative structure |
| **3** | `18×5=90` · `90−6=84` · `84:6=14` | **yes** |
| 4 | `5×18=90` · `90−6=84` · `84−6=78` | no — subtracts instead of dividing |

Each wrong chain encodes a distinct root-cause: operation choice, grouping, or a terminal step swap. This is **exactly the investigation signal** Claude should produce when a student's final answer is wrong — not "you got it wrong" but *which step in which chain broke*. See [[concepts/ceb-attendus-p6-arithmetique]] for the full item catalog.

## Why this matters for PedagogIA

- The resolution-de-problèmes attendu is the **natural home for the Claude API investigation engine**. A student who gets an arithmetic exercise wrong may be perfectly fine on the computation but fail at translation or vérification — exactly the root-cause differentiation our app targets.
- The **vérification** step (plausibility, réciproques, calculatrice) is itself a named attendu from P3 — we can reward/score it separately.
- **Rédiger un énoncé** from P4 is a genuine creative task. We don't have a clean UI primitive for this yet — future-scope. Short-answer + AI grading is the obvious match.
- The "*situation contextualisée*" language invites **narrative framing** of exercise templates (price lists, recipes, distances, durations). Pure arithmetic drills should always be complemented by contextualized problems.

## See also

- [[concepts/champ-3-arithmetique]]
- [[concepts/champ-2-grandeurs]]
- [[concepts/egalite-mathematique]]
- [[concepts/verbes-operateurs]]
- [[sources/referentiel-mathematiques]]
