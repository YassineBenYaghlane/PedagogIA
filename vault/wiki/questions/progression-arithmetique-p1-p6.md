---
title: Progression arithmétique P1→P6 selon le référentiel FWB
type: question
created: 2026-04-17
updated: 2026-04-17
sources: [referentiel-mathematiques]
tags: [curriculum, champ-3, progression, poc-scope]
---

**Question** : *Quelle est la progression précise, année par année, de l'arithmétique (Champ 3) dans le tronc commun primaire FWB ? Comment la traduire en arête du skill tree PedagogIA ?*

Réponse construite à partir des tables d'attendus de Champ 3.1 (nombres) et 3.2 (opérations) du [[sources/referentiel-mathematiques]], pages 31–107.

## Vue d'ensemble

| Dimension | P1 | P2 | P3 | P4 | P5 | P6 |
|---|---|---|---|---|---|---|
| Plage de nombres | ≤ 20 | ≤ 100 | ≤ 1 000 | ≤ 100 000 + décimaux au millième | ≤ millions | ≤ milliards |
| Opérations | + , − | + , − , × | 4 opérations (÷ introduite) | 4 opérations, décimaux au dixième | 4 opérations complètes | maîtrise, division écrite |
| Tables × mémorisées | — | T2, T5, T10 | T2–T6, T10 | T2–T10 (complet) | T2–T10 maîtrise | T2–T10 maîtrise |
| Calcul écrit | — | — | algo + et − | algo × (multiplicateur 1 chiffre) | algo des 4 ops | algo ÷ (diviseur 1 chiffre, quotient au dixième) |
| Calcul mental | — | décomposition | + distributivité, compensation | × et ÷ spécifiques (×10, ×100, ×4, ×8, ÷10, ÷4) | × spéc. (×0,1, ×0,5, ×9, ×11, ×25) | ×0,125, ÷ décimales |
| Calculatrice | — | — | introduction (vérif +, −, ×) | usage selon situation | usage | usage avancé |
| Égalité | =, ≠ (résultat) | équivalence (12+7=19, 19=12+7, 15+5=4×5) | enchaînements opératoires, ajuster fausses égalités | équivalence jusqu'à 200 | propriétés | maîtrise |
| Décomposition | 1–20 (additive) | ≤100 additive et multiplicative (12, 24, 48…) | ≤1000 additive et multiplicative | 3–6 chiffres, entier/non-entier | lien entre décompositions de 1 et 100 | partie entière/non-entière |
| Suites / régularités | — | T2, T5, T10 régularités | suites numériques, T3, T4, T6 | T7, T8, T9, suites | régularités tables, suites | régularités dans tables ≤ 100 |

## Points de friction anticipés pour le skill tree

- **P2 est l'année charnière pour la multiplication** — apparition du symbole × et mémorisation de T2/T5/T10. Les prérequis amont (décomposition multiplicative, doubles, moitiés) doivent être solides.
- **P3 concentre beaucoup d'arêtes** : formalisation des 4 opérations, introduction de la division, premier algorithme écrit, parenthèses, fausses égalités à ajuster, calculatrice, procédures de calcul mental (décomposition / distributivité / compensation). Deux sous-blocs naturels : "opérations entières ≤1000" et "outils de calcul mental + calculatrice".
- **P4 est l'entrée des décimaux** — attendu "dixièmes, vingtièmes, centièmes, millièmes" (fractions) se couple à l'écriture décimale. Deux entrées pour le même concept : via Champ 2 (fractions partage) et Champ 3 (numération décimale).
- **P5 introduit les pourcentages** (10 %, 20 %, 25 %, 50 % d'une quantité) et ouvre les fractions > 1.
- **P6 est majoritairement synthèse** ("peu de nouveautés, c'est l'année de la synthétisation") — bonne cible pour des exercices mixtes / free practice.

## Verbes opérateurs dominants dans les attendus Champ 3

Inventoriés ici pour alimenter la génération d'exercices (cf. [[concepts/verbes-operateurs]]) :

- **Savoirs** : associer, connaitre de mémoire, reconnaitre, utiliser (le vocabulaire / les symboles).
- **Savoir-faire** : dire, lire, écrire, représenter, dénombrer, décomposer, recomposer, comparer, ordonner, situer, compter par N, placer sur une droite numérique, créer des familles, exprimer, déterminer, ajuster, appliquer un algorithme, estimer, vérifier, utiliser la calculatrice.
- **Compétences** : résoudre un problème en mobilisant des nombres et des opérations, rédiger un énoncé à partir d'un résultat ou d'un calcul.

Chaque verbe correspond à un niveau cognitif distinct — la génération doit en tenir compte (une tâche *associer* diffère d'une tâche *résoudre*).

## Implications concrètes pour PedagogIA

1. **Granularité du skill tree** — l'attendu est l'unité de base. Chaque attendu annuel de Champ 3 donne naissance à 1-3 skills selon son amplitude. Cela produit plusieurs centaines de skills sur P1–P6.
2. **Prérequis horizontaux** (même année, entre Champs 2 et 3) — les fractions vivent dans Champ 2 mais alimentent Champ 3 dès P4 via les décimaux. Le skill tree doit modéliser ce couplage.
3. **Prérequis verticaux** (année sur année) — la référentiel pose explicitement des continuités : "En X année primaire, … En Y année primaire, ..." Chaque introduction annuelle cite l'état amont. Ces phrases sont directement exploitables comme source de prérequis.
4. **Spiralarité** — un même savoir-faire (ex. *décomposer et recomposer les nombres dans la numération décimale*) revient P1–P6 en étant complexifié. Pas un nouveau skill à chaque fois — plutôt un skill avec des niveaux de maîtrise progressifs.
5. **Redoublement −50 %** — politique alignée avec notre mission (diagnostic + remédiation avant la sommative). Argument utile pour l'adoption par les POs.

## Filed under

`questions/progression-arithmetique-p1-p6` — référence quand on retravaille le skill tree ou les templates d'exercices par année.

## See also

- [[sources/referentiel-mathematiques]] — source primaire
- [[concepts/champ-3-arithmetique]] — cadre conceptuel
- [[concepts/tables-multiplication]] · [[concepts/numeration-decimale]] · [[concepts/egalite-mathematique]] · [[concepts/fractions-partage-vs-nombre]] · [[concepts/resolution-problemes-math]]
- [[concepts/approche-spiralaire]] · [[concepts/verbes-operateurs]]
