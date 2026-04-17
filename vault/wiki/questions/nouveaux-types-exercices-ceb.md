---
title: Nouveaux types d'exercices à ajouter dans PedagogIA (d'après le CEB)
type: question
created: 2026-04-17
updated: 2026-04-17
sources: [ceb-2024, ceb-2023, ceb-2022, ceb-2020, ceb-2019, ceb-2018, referentiel-mathematiques]
tags: [poc-core, p6, arithmetic, exercise-templates, product]
---

> **Update 2026-04-17 (after full 14-CEB ingest):** the catalog has grown from 16 families to **~44 distinct exercise families** ([[concepts/ceb-attendus-p6-arithmetique]]). The Tier 1–4 recommendations below remain the right roadmap (Tier 1 still highest-impact-per-effort), but new templates surface from the 2020 ingest worth flagging for a Tier 1.5: `compensation_explicit_principle` (named-principle apply), `multiple_equivalent_expressions` (`X c'est ___ , ___ , ___`), `inverse_operation_write`, `verification_negative_pick`. All four extend Tier 1's `operator_identity_fill` / `verification_pick` and target the same investigation signal (reasoning about inverse operations and identities) but with richer probes. Each is a 1-line YAML extension of an existing template, not a new UI primitive — implementation cost is minimal.

## Question

Sachant ce que le CEB teste réellement à la sortie de P6 ([[concepts/ceb-attendus-p6-arithmetique]]), quels *nouveaux types d'exercices* devrions-nous ajouter dans PedagogIA pour élargir la couverture actuelle ?

## Contexte — ce que PedagogIA couvre déjà

Templates actuels (`backend/src/skill_tree/exercise_templates_p*.yaml`), tous shapes confondus :

- `computation` — add/subtract/multiply/divide, avec support décimal
- `decomposition` — mais en *écriture chiffrée* uniquement (ex: combien font 3 millions + 200 mille + …)
- `comparison` — deux nombres, `<`/`>`/`=`
- `fill_blank` — trou dans une addition, ou suite numérique
- `missing_operator` — `a ? b = c`, coche l'opérateur
- `estimation` — arrondi du résultat d'une opération (P5 uniquement)

Skills P6 couvertes : numération milliards, calcul écrit avancé, multiplication/division décimaux, quelques tricks mentaux (×25, ×99, ×101, ÷0,1), calcul mental mixte, résolution de problèmes (très fine).

## Gap analysis vs. CEB

Les neuf types *core* ([[concepts/ceb-attendus-p6-arithmetique]] §"Nine recurring item types") apparaissent dans les deux éditions ingérées ([[sources/ceb-2023]], [[sources/ceb-2024]]). Sept types *secondaires* sont spécifiques à 2023, trois à 2024. De cette matrice, ~16 familles d'items sont réutilisables directement. Les types ci-dessous manquent totalement ou partiellement.

### Tier 1 — core-9 du CEB, coût d'implémentation faible

Chaque item est un MCQ ou un fill. Pas de nouveau moteur de rendu requis.

| # | Template à créer | Forme | Exemple (tiré du CEB) |
|---|---|---|---|
| 1 | `pick_equivalents` | MCQ multi-sélection | *Coche les décompositions qui donnent `15 × 45` : `(10×45)+(5×45)`, `15×9×5`, `(10×40)+(5×5)`, …* (2024 L6 Q3, 2023 Q25) |
| 2 | `operator_identity_fill` | Fill-in sur identité arithmétique | `760 ÷ 0,1 = 760 × __` · `6 498 − 379 = 6 500 − __` · `9 × 67,2 = (__ × 67,2) − 67,2` (2024 L6 Q8) |
| 3 | `verification_pick` | MCQ simple | *Quelle opération vérifie `886 432 ÷ 4 = 221 608` ?* → `221 608 × 4` (2024 L6 Q4) |
| 4 | `equality_trap` | Binaire `=`/`≠` | `100 − 12,5 ○ 12,5 − 100` (2023 Q17). **Probe canonique pour la commutativité soustraction** — signature nette pour Claude investigation. Voir [[concepts/egalite-mathematique]]. |
| 5 | `rang_decimal` | Deux variantes | (a) *Dans `721 546,03` le 2 représente…* · (b) *Place la virgule pour que le 2 occupe le rang des dizaines de mille dans `245681`* (2024 L7 Q5, Q9) |

### Tier 2 — investigation-riches

Ces items ne testent pas un résultat mais un *raisonnement*. Ils donnent au moteur d'investigation Claude un signal beaucoup plus exploitable ([[concepts/resolution-problemes-math]]).

| # | Template | Notes |
|---|---|---|
| 11 | `reasoning_chain_pick` | 4 chaînes de résolution candidates, une correcte ; 3 encodent des misconceptions P6 classiques (double soustraction, mauvais dividende, mauvais groupement). 2024 L7 Q13. **Template idéal pour l'investigation Claude : la réponse *est* déjà une erreur typée.** |
| 10 | `inference_from_known` | *Si `21 × 43 = 903`, alors `2,1 × 43 = ?`, `42 × 43 = ?`, `22 × 43 = ?`* (2023 Q22). Probe compacte de raisonnement multiplicatif — scaling décimal, doublement, distributivité — en un seul prompt. |

### Tier 3 — pont fractions ↔ décimaux

PedagogIA n'a actuellement **zéro template fraction** en P5/P6, alors que le CEB les évalue explicitement et que [[concepts/fractions-partage-vs-nombre]] pointe ce rang comme charnière Champ 2 → Champ 3.

| # | Template | Exemple |
|---|---|---|
| 6 | `order_set` | *Range par ordre croissant : `½`, `0,6`, `5/3`, `1/5`, `1`* (2023 Q9). Généralise `comparison` (2 → N). |
| 7 | `equivalence_triplet` | *Entoure les équivalents de `0,75` parmi `75/100`, `trois quarts`, `0,075`, `septante-cinq dixièmes`* (2024 L7 Q8). Tests la triple équivalence fraction ↔ décimal ↔ mots (incluant la numération belge — [[sources/ceb-2024]] §"Distinctively Belgian numération"). |
| 14 | `fraction_of_quantity` | *`¼ de 32 Go + ½ de 64 Go`, reste sur 250 Go ?* (2023 Q8). Multi-étape, mêle fraction-opérateur et soustraction avec unités. |
| 8 | `divisibility_fill` | *Complète `237_` pour qu'il soit multiple de 2 non multiple de 5* (2024 L7 Q14) ; *écris tous les multiples de 8 entre 1 et 37* (2024 L7 Q2). |

### Tier 4 — nouvelles primitives d'entrée (coût UI plus élevé)

| # | Template | Exemple | Coût UI |
|---|---|---|---|
| 9 | `decomposition_tree` | *`15 000 = 6 × 1 250 + __`* (2024 L6 Q6) ; arbre binaire récursif sur `4,8` (2023 Q23). | Rendu d'arbre. |
| 12 | `scale_grid` | *Complète la ligne : `35 × 0,07 = ? · ×0,7 = ? · ×7 = ? · ×70 = ? · ×700 = ?`* (2024 L6 Q12). | Tableau multi-colonnes. |
| 13 | `functional_pattern` | *1 table → 4 chaises, 2 → 6, 3 → 8. Chaises pour 7 tables ? Tables pour 20 chaises ?* (2023 Q7). | Optionnel : visuel figural. Précurseur à l'algèbre `y = 2n + 2`. |
| 15 | `abaque_read` | Lecture d'un tableau de colonnes CM/DM/UM/C/D/U/d/c (2023 Q11). | Rendu d'abaque. |

## Priorisation recommandée

1. **Tier 1 d'abord** (#1–#5). Tous des core-9, tous MCQ/fill, aucune nouvelle primitive UI. Couverture attendus P6 augmente de ~5 item families en une itération.
2. **Tier 2 ensuite** (#11, #10). C'est *là* que le moteur d'investigation Claude devient réellement utile : la donnée d'entrée n'est plus "wrong final number" mais "wrong reasoning chain" ou "wrong scaling rule".
3. **Tier 3** (#6, #7, #14, #8). Comble le trou fractions/décimaux que le CEB évalue lourdement.
4. **Tier 4** (#9, #12, #13, #15) une fois que les primitives UI (arbre, grille, abaque) sont jugées prioritaires — elles ouvrent aussi la porte à des types d'exercices hors CEB.

## Implications sur l'arbre de compétences

Les neuf leaves P6 déjà listées dans [[concepts/ceb-attendus-p6-arithmetique]] §"Signal for the skill tree" (decomposition_distributive_multiplication, compensation_et_proprietes_operatoires, verification_par_operation_reciproque, etc.) correspondent exactement aux Tier 1–2 ci-dessus. Autrement dit : **ajouter ces templates ≡ faire vivre ces leaves**. Aujourd'hui les skills `maitrise_*` de P6 agrègent trop — elles ne peuvent pas diagnostiquer si l'élève échoue sur la *distributivité* vs la *commutativité* vs la *vérification*.

## Notes de design (à trancher côté UI)

- Les MCQ multi-sélection (#1) nécessitent une logique "au moins 2 correctes" — à ajouter au scorer.
- `equality_trap` (#4) doit afficher **deux** expressions et demander `=`/`≠` — probablement un nouveau shape plutôt qu'un cas spécial de `comparison`.
- Les `fraction_*` templates (#6, #7, #14) imposent d'étendre le parser de réponses pour accepter `3/4`, `0,75`, `trois quarts`, `septante-cinq dixièmes` comme formes équivalentes. Le parser numération belge (déjà flagué pour *septante*/*nonante*) doit être fait en parallèle.
- `reasoning_chain_pick` (#11) demande un rendu multi-ligne par choix : chaque "chaîne" est elle-même 2–4 lignes d'arithmétique posée.

## Filed under

`questions/` — décision produit / roadmap templates P6.

## See also

- [[concepts/ceb-attendus-p6-arithmetique]]
- [[sources/ceb-2024]]
- [[sources/ceb-2023]]
- [[concepts/champ-3-arithmetique]]
- [[concepts/resolution-problemes-math]]
- [[concepts/fractions-partage-vs-nombre]]
- [[concepts/egalite-mathematique]]
- [[questions/progression-arithmetique-p1-p6]]
