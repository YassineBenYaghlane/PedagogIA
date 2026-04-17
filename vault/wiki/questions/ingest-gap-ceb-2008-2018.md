---
title: Quels CEBs reste-t-il à ingérer en profondeur ?
type: question
created: 2026-04-17
updated: 2026-04-17
sources: [ceb-2008, ceb-2009, ceb-2010, ceb-2011, ceb-2012, ceb-2013, ceb-2014, ceb-2018]
tags: [ingest-gap, curriculum, math, evaluation, arithmetic, backlog]
---

## Question

Parmi les 16 éditions CEB filées sous `wiki/sources/`, lesquelles ont été **réellement dépouillées** sur la partie math (Livret 8 *Nombres et opérations*), et lesquelles ne sont que des pages-squelette ?

## Réponse — trois niveaux d'ingestion

### Niveau 1 — dépouillement profond (inventaire Q-par-Q + familles catalogues)

Ces pages ont un inventaire complet des questions du livret arithmétique et alimentent directement [[concepts/ceb-attendus-p6-arithmetique]] :

- [[sources/ceb-2020]] (145 lignes, 12 nouvelles familles — année la plus dense)
- [[sources/ceb-2022]] (142)
- [[sources/ceb-2023]] (90)
- [[sources/ceb-2024]] (66)
- [[sources/ceb-2019]] (62)
- [[sources/ceb-2017]] (69)
- [[sources/ceb-2016]] (68)
- [[sources/ceb-2015]] (70)

### Niveau 2 — spot-check partiel

~~Pages intermédiaires où quelques items marquants ont été notés mais pas d'inventaire Q-par-Q :~~

- ~~[[sources/ceb-2018]]~~ → **finalisé 2026-04-17** : Q2–Q19 inventoriés, 8 nouvelles familles (items 61–68).
- ~~[[sources/ceb-2014]]~~ → **finalisé 2026-04-17** : Livret 2 Nombres et opérations trouvé (pages PDF 8–25), 9 nouvelles familles (items 69–77), 9 corrections first-seen rétroactives vers 2014.

2014 et 2018 sont désormais au **Niveau 1**.

### Niveau 3 — placeholder (ancrage historique seulement)

~~Frontmatter + mention « Not exhaustively scanned » + 1-2 paragraphes de contexte. Aucun item arithmétique extrait :~~ **Fait (2026-04-17)** — découverte du pivot 2013 :

- ~~[[sources/ceb-2013]]~~ → **Niveau 1** : dépouillement Q1–Q15 complet, 5 nouvelles familles (items 78–82), 5 corrections first-seen vers 2013.
- ~~[[sources/ceb-2012]]~~, ~~[[sources/ceb-2011]]~~ → **Niveau 2 (surface-scan)** : pas de livret dédié N&O avant 2013 ; arithmétique testée dans un livret thématique (« Traitement de données » 2012, « Math appliqué Baladins » 2011). Deux familles pré-2013 disparues post-2013 : `distance_matrix_query`, `seating_logic_puzzle`.
- ~~[[sources/ceb-2008]]~~, ~~[[sources/ceb-2009]]~~, ~~[[sources/ceb-2010]]~~ → **Niveau 3 maintenu** : confirmés pré-séparation par analogie, PDF très légers (1,3–1,6 MB), dépouillement profond low-value.

## Implication

Le catalogue de ~60 familles d'items dans [[concepts/ceb-attendus-p6-arithmetique]] est construit **quasi-exclusivement à partir du Niveau 1** (2015 → 2024). Les pré-2014 servent d'ancres historiques (« stabilité sur 16 ans ») mais n'ont pas été vérifiés par inspection.

## Proposition de priorisation — clôturée

1. ~~**Finir 2014 + 2018**~~ — **fait**. 9 familles rétrogradées vers 2014.
2. ~~**Pass 2013 → 2008**~~ — **fait**. Découverte du pivot 2013 (première année avec livret N&O dédié). 5 familles supplémentaires rétrogradées vers 2013. 2011–2012 confirmés pré-séparation (livret thématique). 2008–2010 laissés en Niveau 3 (rationale dans `sources/ceb-2008`).
3. **Optionnel, futur** — si la question *« quelles familles existent en 2008 mais pas aujourd'hui ? »* devient load-bearing, dépouiller 2008–2010 en détail pour extraire les familles potentiellement disparues (cf. `distance_matrix_query`, `seating_logic_puzzle` observées en 2011).

## Résumé final

Corpus CEB : **13 éditions Niveau 1** (dépouillement Q-par-Q), **2 éditions Niveau 2** (surface-scan : 2011, 2012), **3 éditions Niveau 3** (ancrage historique : 2008, 2009, 2010). Catalogue [[concepts/ceb-attendus-p6-arithmetique]] : ~82 familles. Stabilité structurelle documentée : **13 ans continus** pour data-literacy (2011→2024), **11 ans** pour arithmétique post-séparation (2013→2024), **16 ans** pour les *core nine* par inférence (2008→2024).

## Filed under

`wiki/questions/ingest-gap-ceb-2008-2018.md`

## See also

- [[concepts/ceb-attendus-p6-arithmetique]]
- [[entities/ceb]]
- [[questions/nouveaux-types-exercices-ceb]]
