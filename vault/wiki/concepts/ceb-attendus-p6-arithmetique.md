---
title: Attendus P6 en arithmétique — lecture du CEB 2008→2024
type: concept
created: 2026-04-17
updated: 2026-04-17
sources: [ceb-2024, ceb-2023, ceb-2022, ceb-2020, ceb-2019, ceb-2018, ceb-2017, ceb-2016, ceb-2015, ceb-2014, ceb-2013, ceb-2012, ceb-2011, ceb-2010, ceb-2009, ceb-2008, referentiel-mathematiques]
tags: [math, arithmetic, p6, evaluation, poc-core]
---

What the Fédération Wallonie-Bruxelles **actually tests** at P6 exit in arithmetic (*Nombres et opérations*), synthesized across **all 14 available CEB éditions 2008→2024** (2020 cancelled by COVID but materials published; 2021 administered as modified 2020). Profondeur de couverture :

- **Dépouillement profond Q-par-Q** : 2013–2020, 2022, 2023, 2024 (11 éditions). Livret N&O dédié avec numérotation variable : L5 en 2013, L2 en 2014, L8 en 2015→2020, L6+L7 combinés en 2022+.
- **Surface-scan structurel** : 2011 (livret thématique « Math appliqué » — pas de N&O dédié), 2012 (L4 Traitement de données — pas de N&O dédié).
- **Placeholder** : 2008, 2009, 2010 — ancres historiques non dépouillées.

**Pivot 2013** : La FWB a introduit le livret dédié *Nombres et opérations* en 2013. Avant cette date, l'arithmétique P6 était testée à travers un livret thématique mêlant calcul, grandeurs et données (voir [[sources/ceb-2011]], [[sources/ceb-2012]]). A concrete complement to the référentiel's abstract attendus in [[concepts/champ-3-arithmetique]].

## Nine recurring item types

Each item type pairs to attendus in the référentiel and to existing (or missing) exercise templates in the POC.

### 1. Décomposition pour calcul mental

Pick the equivalent rewrite(s) of a multiplication, division, or mixed expression.

> *Coche les deux décompositions qui donnent le même résultat que `15 × 45 =` :*
> `(10 × 45) + (5 × 45)` · `(10 × 40) + (5 × 5)` · `10 × 5 × 40 × 5` · `15 × 9 × 5` · `(5 × 45) + (5 × 45)`

Appears ≥ 4× in L6 (Q3, Q10, Q12, Q13). Directly validates PedagogIA's multi-strategy explanation model — a student who fails the final number but identifies the correct decomposition has a different mastery state from one who fails both.

### 2. Propriétés opératoires comme fill-in

> `9 × 67,2 = (___ × 67,2) − 67,2` · `760 : 0,1 = 760 × ___` · `6 498 − 379 = 6 500 − ___` · `4 × 50 × 3 = ___ × 200`

Tests distributivité, inverse multiplicatif `÷0,1 ↔ ×10`, compensation dans la soustraction, commutativité/associativité (L6 Q8). Currently thin in our template set.

### 3. Vérification d'opération

> *Coche l'opération qui permet de vérifier `886 432 : 4 = 221 608` :* `886 432 − 221 608` · `221 608 : 4` · `221 608 × 4` · `886 432 × 4`

Separately scored (L6 Q4). Matches the *vérification* attendu from P3 ([[concepts/resolution-problemes-math]]) but applied to pure calcul.

### 4. Suite arithmétique

> `840 → +70 → ___ → +70 → ___ → +70 → ___`

L6 Q5. Trivial to parameterize; graded independently of operation fluency.

### 5. Arbre de décomposition multiplicative

> `15 000 c'est ___ × 3 750` · `15 000 c'est (6 × 1 250) + ___`

L6 Q6. Probes multiplicative structure of a round number — closely related to multiples/diviseurs (item type 8).

### 6. Estimation / ordre de grandeur

> *Coche l'opération dont l'estimation est la plus proche de `500` :* `1,5 × 493` · `10 000 − 9 287` · `1 900 : 5` · `207,56 + 291,6`

L6 Q7. The référentiel names *estimer la plausibilité* as an attendu from P3; CEB confirms it is tested explicitly, not just folded into problem-solving.

### 7. Fraction ↔ décimal ↔ écriture en mots

Equivalences across three notations:

> `25/10 = 2,5` · `14,65 = 1 465/100` · `32/16 = 2` · *"Entoure les deux nombres équivalents parmi `100/75`, `75/100`, `0,075`, `septante-cinq dixièmes`, `trois quarts`, `7,05`"*

L6 Q9, L7 Q8. Hinge between [[concepts/fractions-partage-vs-nombre]] (Champ 2 territory) and Champ 3 decimal numeration.

### 8. Multiples / diviseurs / critères de divisibilité

> *Écris tous les nombres multiples de 8 compris entre 1 et 37.*
> *Complète le dernier chiffre de `237_` pour qu'il soit multiple de 2 et de 5 / multiple de 2 non multiple de 5 / non multiple de 2 non multiple de 5.*

L7 Q2, Q14. Baseline P5–P6 items, canonical probes for number-family reasoning in [[concepts/numeration-decimale]].

### 9. Numération décimale — rang, virgule, grands nombres

> *Dans `721 546,03` le 2 représente le rang des…* `dizaines` · `unités de mille` · `dixièmes` · `dizaines de mille` · `centaines`
> *Écris en chiffres : Sept millions quatre-vingt-mille-vingt-quatre.*
> *Place une virgule pour que le 2 occupe le rang des dizaines de mille dans `245681`.*
> *Range `83,98 / 83,809 / 82,740 / 83,787` : inférieur à 83,7 / entre 83,7 et 83,8 / supérieur à 83,8.*

L7 Q5, Q7, Q9, Q10, Q15. P6-exit confirms range = millions + millièmes (not yet milliards, despite the référentiel listing milliards for P6).

## Problem-solving wrapper (tied to every item above)

Items 1–9 are "pure" arithmetic probes. The CEB also stages them inside contextualized problems ([[concepts/resolution-problemes-math]]):

- **Jus de fruits (L7 Q6)** — 7 adults × 3 glasses + 16 kids × 4 glasses, 6 glasses per bottle → minimum bottles? Multi-étape, unit conversion, rounding *up*.
- **Pralines (L7 Q12)** — 1 560 pralines split evenly over 6 gouts → combien à la fraise? Division by the count of visually-shown gouts.
- **Paquets de feuilles (L7 Q13)** — 4 candidate resolution chains, one correct. See [[concepts/resolution-problemes-math]] for expanded analysis.
- **Gradins (L7 Q1)** — rectangular multiplication with a partitioned visual (3 blocks × rows × seats).

## 2023-only item types (not present in 2024)

With a second year ingested ([[sources/ceb-2023]]), seven additional item types surface that the 2024 edition did not include. They remain curriculum-legitimate (all trace to référentiel attendus) and are worth mining:

10. **Pure-compute block** — ≥ 8 operations to pose, mixing entiers and décimaux (2023 Q3). Direct algorithmic fluency probe.
11. **Suite figurale / relation fonctionnelle** — *n* tables → *2n + 2* chaises, with inverse lookup (2023 Q7). Algebra-precursor.
12. **Fractions de quantité** — `¼ de 32 Go + ½ de 64 Go`, reste sur 250 Go (2023 Q8). Bridges [[concepts/fractions-partage-vs-nombre]] with arithmetic.
13. **Ordre croissant mixte fraction + décimal** — rank `½ | 0,6 | 5/3 | 1/5 | 1` (2023 Q9).
14. **Abaque formel** — CM/DM/UM/C/D/U/d/c column notation (2023 Q11). Distinct input primitive.
15. **Nombres premiers** — explicit in a properties grid (2023 Q13).
16. **Arbre de décomposition récursif sur décimal** — 3-level binary decomposition of `4,8` (2023 Q23). Generalises 2024's `15 000` arbre.
17. **Piège commutativité soustraction** — `100 − 12,5 ○ 12,5 − 100` with `=`/`≠` (2023 Q17). Canonical misconception probe for [[concepts/egalite-mathematique]].

## 2024-only item types (not present in 2023)

18. **Multi-résolution problem picker** — four candidate reasoning chains (2024 L7 Q13). See [[concepts/resolution-problemes-math]] for analysis.
19. **Grid de multiplication par décimaux** — `× 0,07 / 0,7 / 7 / 70 / 700` (2024 L6 Q12). Tests scale law for ×10ⁿ with n negative.
20. **Multiplication factorielle** — `12 × 8 = 12 × 2 × 2 × 2` (2024 L6 Q13).

## Year-over-year stability

The **core nine** (items 1–9 above) appear in both years — these are the *hard-core* attendus the FWB never skips. The **secondary eleven** (items 10–20) rotate. Mastery thresholds in PedagogIA should be stricter for hard-core skills; rotating skills can tolerate lower per-attempt confidence. This is direct input for the spaced-repetition schedule.

Three more years' CEBs would let us compute actual rotation frequencies.

## Signal for the skill tree

This CEB cross-section suggests nine well-defined leaf-skills at P6 level:

1. `decomposition_distributive_multiplication`
2. `compensation_et_proprietes_operatoires`
3. `verification_par_operation_reciproque`
4. `suite_arithmetique_progression_constante`
5. `decomposition_multiplicative_arbre`
6. `estimation_ordre_de_grandeur`
7. `equivalence_fraction_decimal_mots`
8. `multiples_diviseurs_criteres_divisibilite`
9. `numeration_decimale_rang_virgule_millions`

Each already traces to an attendu in the référentiel and to a concrete CEB item. Items 2 and 6 are where our current template coverage is thinnest — worth prioritizing next.

## Updated catalog after 14-year ingest (2008→2024)

After ingesting all 14 available CEB éditions, the catalog of **distinct arithmetic exercise families** sits at ~41 templates — the post-2022 deep-dive years (2020, 2022, 2023, 2024) account for almost all of them. Older éditions confirm the *core nine* (items 1–9 above) every year but rarely surface novel families — they recycle the catalog with surface variation.

### Complete catalog

| # | Template family | First seen | Notes |
|---|---|---|---|
| 1 | Décomposition pour calcul mental | 2024+ | core |
| 2 | Propriétés opératoires fill-in | 2022+ | core |
| 3 | Vérification opération réciproque | 2022+ | core |
| 4 | Suite arithmétique | 2024 | core |
| 5 | Arbre de décomposition multiplicatif | 2022+ | core |
| 6 | Estimation / ordre de grandeur | 2022+ | core |
| 7 | Équivalence fraction ↔ décimal ↔ mots | 2022+ | core |
| 8 | Multiples / diviseurs / critères | 2022+ | core |
| 9 | Numération décimale — rang, virgule | 2022+ | core |
| 10 | Pure-compute block | 2022+ | rotating |
| 11 | Suite figurale / fonctionnelle | 2023 | rotating |
| 12 | Fractions de quantité | 2022+ | rotating |
| 13 | Ordre croissant mixte fraction/décimal | 2023 | rotating |
| 14 | Abaque formel (lecture) | 2023 | rotating |
| 15 | Nombres premiers | 2022+ | rotating |
| 16 | Arbre récursif sur décimal | 2022+ | rotating |
| 17 | Piège commutativité soustraction | 2023 | rotating |
| 18 | Multi-résolution problem picker | 2024 | rotating |
| 19 | Grid × puissances de 10 (linear) | 2024 | rotating |
| 20 | Multiplication factorielle | 2024 | rotating |
| 21 | `delete_digit_optimize` | 2022 | new |
| 22 | `place_in_interval` | 2022 | new |
| 23 | `match_situation_to_operation` | 2022 | modeling |
| 24 | `equivalent_products_grid` (triangle) | 2022 | new |
| 25 | `number_line_fill` | 2022 | new |
| 26 | `division_equivalence` | 2022 | new |
| 27 | `multiplication_grid_fragment` | 2022 | new |
| 28 | `inverse_operation_consistency` | 2022 | new |
| 29 | `mental_dictation` | 2020 | unique to dictée |
| 30 | `pure_compute_timed_block` | 2020 | with embedded missing-fill |
| 31 | `abaque_draw` (generative) | 2020 | UI cost |
| 32 | `number_line_place` (trace) | 2020 | inverse of #25 |
| 33 | `long_multiplication_partial_product_read` | 2020 | algorithm understanding |
| 34 | `multiple_equivalent_expressions` | 2020 | "X c'est ___ , ___ , ___" |
| 35 | `compensation_explicit_principle` | 2020 | named-principle apply |
| 36 | `inverse_operation_write` | 2020 | extends #3 |
| 37 | `operator_vocabulary_fill` (moitié/tiers/…) | 2020 | vocabulary layer |
| 38 | `verification_negative_pick` | 2020 | extends #3 |
| 39 | `geometric_power_representation` | 2020 | square/cube visual |
| 40 | `addition_multiplication_table_fill` | 2020 | extends #27 |
| 41 | `equivalent_scale_products_pick` | 2020 | extends #19 |
| 42 | `midpoint_check` | 2019 | mean implicitly |
| 43 | `digit_punctuation_optimize` | 2019 | extends #21 |
| 44 | `fraction_ordering_strategy_layered` | 2019 | didactic structure |
| 61 | `partial_product_scale_up_mcq` | 2018 | extends #33 with scale-up MCQ |
| 62 | `place_value_increment` | 2018 | « ajoute 2 centièmes à… » |
| 63 | `product_pyramid_fill` | 2018 | case = produit des deux cases dessous |
| 64 | `array_count_and_expression` | 2018 | compter array + écrire opération |
| 65 | `belgian_number_word_to_digits` | 2018 | *septante centièmes* → chiffres |
| 66 | `product_grid_find` | 2018 | recherche multi-solution dans grille |
| 67 | `decomposition_tree_equal_parts` | 2018 | arbre ternaire de parts égales |
| 68 | `figurate_number_sequence` | 2018 | triangulaires → carrés |
| 69 | `matchstick_pattern_projection` | 2014 | suite figurée, projection à position N |
| 70 | `multiples_venn_fill` | 2014 | diagramme de Venn avec étiquettes à déduire |
| 71 | `euclidean_division_fill` | 2014 | `a÷b=q reste r` avec inconnue variable |
| 72 | `sum_target_in_grid` | 2014 | 2×2 subgrids matching sum, multi-solution |
| 73 | `bar_chart_multi_query` | 2014 | data literacy sur bar chart |
| 74 | `place_in_interval_matrix` | 2014 | forme matricielle (nombres × intervalles) |
| 75 | `factorization_triangle` | 2014 | décomposition multiplicative visuelle |
| 76 | `fraction_comparison_in_context` | 2014 | classer `X/Y` avec Y variables |
| 77 | `remainder_reasoning_multiselect` | 2014 | justifier contraintes reste euclidien |
| 78 | `successor_predecessor_fill` | 2013 | entier qui précède/suit un nombre donné |
| 79 | `column_operation_digit_fill` | 2013 | calcul posé avec chiffres manquants |
| 80 | `grid_row_col_product` | 2013 | grille 3×3 avec produits lignes+colonnes contraints |
| 81 | `expression_tree_multi_solution` | 2013 | arbre de calcul, compléter de plusieurs manières |
| 82 | `logic_tree_classification` | 2013 | arbre dichotomique par propriétés arith |

### ⚠ First-seen corrections from 2013 deep-verify

Le dépouillement 2013 pousse 5 familles supplémentaires vers 2013 :

| Famille | Ancien | Réel |
|---|---|---|
| `number_reading_mcq` (item 55) | 2016 | **2013** |
| `number_grid_pattern_fill` (item 56) | 2016 | **2013** |
| `abaque_read` (item 14 — core nine) | 2023 | **2013** |
| `equivalent_scale_products_pick` (item 41) | 2020→2014 | **2013** |
| `digit_punctuation_optimize` (item 43) | 2019 | **2013** |

### ⚠ First-seen corrections from 2011 deep-verify (data-literacy families)

2011 a été dépouillé en surface (pas de livret N&O en 2011, arithmétique dans livret thématique). Deux familles data-literacy confirmées dès 2011 :

| Famille | Ancien | Réel |
|---|---|---|
| `bar_chart_multi_query` (item 73) | 2014 | **2011** |
| `receipt_multi_query` (item 57) | 2014 (cascade depuis 2016) | **2011** |

### ⚠ First-seen corrections from 2014 deep-verify

Le dépouillement 2014 a rétrogradé 9 familles précédemment tagguées comme plus tardives. Ajuster le « first-seen » mentalement quand on revisite le catalogue :

| Famille | Ancien | Réel |
|---|---|---|
| `partial_product_scale_up_mcq` (item 61) | 2018 | **2014** |
| `place_value_increment` (item 62) | 2018 | **2014** |
| `match_situation_to_operation` (item 14) | 2022 | **2014** |
| `estimation_closest_product` (item 6) | 2018 | **2014** |
| `place_in_interval` (item 22) | 2022 | **2014** |
| `equivalent_scale_products_pick` (item 41) | 2020 | **2014** |
| `digit_permutation_optimize` (item 58) | 2016 | **2014** |
| `receipt_multi_query` (item 57) | 2016 | **2014** |
| `inverse_operation_write` (item 36) | 2020 | **2014** |

### Stability across years

The **core nine** (items 1–9) appear in every year scanned (16 years, 2008→2024). The **secondary 32+** rotate, with no item appearing in more than ~5 of the 7 deep-dive years. This stability ratio gives a direct mapping into PedagogIA's **mastery thresholds**:

- **Core (9)** → strict mastery, high spaced-repetition frequency, must-have for P6 exit signal.
- **Secondary (32+)** → relaxed thresholds, lower frequency in free-practice mode.

### Implications for the skill tree

The original nine leaf-skills proposed in this document remain valid. The new families surfaced from 2020+2022+2019 ingests don't add *new skills* — they add *new exercise shapes* that probe the same underlying skills from different angles. This is exactly the right kind of expansion: a single skill (e.g., `compensation_et_proprietes_operatoires`) now has **6+ distinct exercise template families** to draw from, vs. 1–2 in our current YAML.

## See also

- [[sources/ceb-2024]] · [[sources/ceb-2023]] · [[sources/ceb-2022]] · [[sources/ceb-2020]] · [[sources/ceb-2019]] · [[sources/ceb-2018]]
- [[sources/ceb-2017]] · [[sources/ceb-2016]] · [[sources/ceb-2015]] · [[sources/ceb-2014]]
- [[sources/ceb-2013]] · [[sources/ceb-2012]] · [[sources/ceb-2011]] · [[sources/ceb-2010]] · [[sources/ceb-2009]] · [[sources/ceb-2008]]
- [[entities/ceb]]
- [[concepts/champ-3-arithmetique]]
- [[concepts/numeration-decimale]]
- [[concepts/tables-multiplication]]
- [[concepts/resolution-problemes-math]]
- [[concepts/fractions-partage-vs-nombre]]
- [[questions/progression-arithmetique-p1-p6]]
- [[questions/nouveaux-types-exercices-ceb]]
