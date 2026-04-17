---
title: Numération décimale
type: concept
created: 2026-04-17
updated: 2026-04-17
sources: [referentiel-mathematiques, ceb-2024]
tags: [math, arithmetic, progression]
---

The place-value system (base 10) that structures how students read, write, represent, decompose, and compare numbers. One of the most load-bearing threads of [[concepts/champ-3-arithmetique]] — revisited in every year of the tronc commun via the [[concepts/approche-spiralaire]].

## Progression — numération only (P1 → P6)

| Year | Range | New ranks introduced | Key attendus (extracts) |
|---|---|---|---|
| **P1** | ≤20 | unités, dizaines | *17 c'est 1 D et 7 U* · lire, dire, écrire ≤20 |
| **P2** | ≤100 | centaine évoquée via 100 | *76 c'est 7 D et 6 U* · représenter ≤100 en dizaines et unités |
| **P3** | ≤1 000 | centaine | *764 c'est 7 C et 6 D et 4 U* · noms des rangs (U, D, C) · pair/impair · multiple/diviseur |
| **P4** | ≤100 000 + décimaux ≤1/1000 | milliers, dixièmes, centièmes, millièmes | noms des classes (unités simples, mille) · abaque · écriture décimale · *12 = 12,0* |
| **P5** | ≤ millions + décimaux ≤1/1000 | millions | noms des classes complets · ranger, placer, encadrer décimaux |
| **P6** | ≤ milliards + décimaux ≤1/1000 | milliards | synthèse; *12,006 < 12,6*; placer un nombre avec ou sans virgule, limité au millième |

## What the référentiel expects in *every* year

For each number range, students must be able to:

1. **Dire / lire / écrire** the number in chiffres and en mots.
2. **Représenter** with counting material, schemes, place-value blocks, or an abaque.
3. **Dénombrer** collections by 1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000… (progression).
4. **Décomposer et recomposer** additively and multiplicatively.
5. **Comparer, ordonner, situer** using `<`, `>`, `=`; place on a droite graduée / bande numérique / tableau.
6. **Créer des familles de nombres et relever des régularités** (P2+).

## Why this matters for PedagogIA

- Numération is the **longest branch of the skill tree**: it appears six times, once per year, with expanding range but consistent structure.
- **Exercise templates can be parametric over the range**: one "decompose this number" template serves P1 (≤20), P2 (≤100), P3 (≤1000) by tuning the parameter. This is already roughly how our YAML-based templates work.
- Decimals from P4 onward demand their own input primitive — we have a comma-separator numpad for this already (see [[entities/pouvoirs-organisateurs]] — irrelevant; stop).

## What the CEB actually tests at P6

The 2024 CEB caps concrete probes at **millions + millièmes**, not milliards — even though the référentiel lists milliards for P6. Items observed in [[sources/ceb-2024]] (livret 7):

- Identifier le rang d'un chiffre dans un nombre à virgule (`721 546,03` → le 2 représente le rang des…).
- Placer la virgule pour qu'un chiffre occupe un rang donné.
- Écrire en chiffres des grands nombres dictés en mots (*Sept millions quatre-vingt-mille-vingt-quatre*).
- Ranger des décimaux à trois chiffres après la virgule dans des intervalles (`inférieur à 83,7` / `entre 83,7 et 83,8` / `supérieur à 83,8`).
- Équivalences entre notations fractionnaires, décimales et en mots (`75/100 = trois quarts`; `septante-cinq dixièmes = 7,5`).

Belgian numération words — **septante** (70), **nonante** (90), but **quatre-vingts** (80, not *octante*) — are normalized in both the référentiel and the CEB. Our number-word parser must accept both Belgian and standard French forms. See the filing note in [[sources/ceb-2024]].

Full item catalog: [[concepts/ceb-attendus-p6-arithmetique]].

## See also

- [[concepts/champ-3-arithmetique]]
- [[concepts/tables-multiplication]]
- [[concepts/resolution-problemes-math]]
- [[concepts/ceb-attendus-p6-arithmetique]]
