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

Frontmatter + mention « Not exhaustively scanned » + 1-2 paragraphes de contexte. Aucun item arithmétique extrait :

- [[sources/ceb-2008]]
- [[sources/ceb-2009]]
- [[sources/ceb-2010]]
- [[sources/ceb-2011]]
- [[sources/ceb-2012]]
- [[sources/ceb-2013]]

## Implication

Le catalogue de ~60 familles d'items dans [[concepts/ceb-attendus-p6-arithmetique]] est construit **quasi-exclusivement à partir du Niveau 1** (2015 → 2024). Les pré-2014 servent d'ancres historiques (« stabilité sur 16 ans ») mais n'ont pas été vérifiés par inspection.

## Proposition de priorisation

1. ~~**Finir d'abord 2014 + 2018**~~ — **fait (2026-04-17)**. 2014 a rétrogradé 9 familles de 2–8 ans, confirmant 10 ans de stabilité continue (2014→2024).
2. **Pass unique 2013 → 2008** — l'hypothèse de stabilité est renforcée ; un balayage rapide devrait confirmer que les 9 familles *core* sont présentes, et peut-être surfaçer quelques rétrogradations supplémentaires vers 2008–2013.
3. **Optionnel** — si la question *« le bassin de familles s'est-il élargi entre 2008 et 2014 ? »* devient load-bearing pour la roadmap PedagogIA, faire un dépouillement profond pré-2014. Très probable que beaucoup de familles descendent encore plus bas.

## Filed under

`wiki/questions/ingest-gap-ceb-2008-2018.md`

## See also

- [[concepts/ceb-attendus-p6-arithmetique]]
- [[entities/ceb]]
- [[questions/nouveaux-types-exercices-ceb]]
