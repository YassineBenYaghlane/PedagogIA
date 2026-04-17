---
title: CEB — Certificat d'Études de Base
type: entity
created: 2026-04-17
updated: 2026-04-17
sources: [ceb-2024, ceb-2023]
tags: [curriculum, evaluation, fwb]
---

The **Certificat d'Études de Base** — the FWB's end-of-primary certification, awarded after a common external exam (*Épreuve externe commune*) sat every June by every P6 student in the Fédération Wallonie-Bruxelles ([[entities/fwb]]). Obtaining the CEB is the standard condition for entry to secondary general education.

## How it's structured

A multi-day written exam, organized by the FWB Administration générale de l'Enseignement and identical across all networks ([[entities/pouvoirs-organisateurs]]). Consists of several booklets (*livrets*) covering:

- **Français** — Écouter, Lire, Écrire (3 booklets)
- **Éveil** — Formation historique et géographique, Initiation scientifique (2 booklets)
- **Mathématiques** — Solides et figures, Grandeurs, Nombres et opérations (3–4 booklets)

The 2024 edition totaled **152 pages across 6 ingested booklets**; 2023 ran 156 pages. See [[sources/ceb-2024]] and [[sources/ceb-2023]] for full structure per year. Each booklet is scored out of a fixed number of points — math total varies slightly year to year but **arithmetic is consistently /70 pts** (2023 as a single booklet; 2024 split into 1 + 2 = /36 + /34). Livret numbering is not stable year-to-year, so programmatic mining must identify booklets by title, not number.

## Relationship to the référentiel

The CEB tests a subset of the attendus defined in the FWB [[sources/referentiel-mathematiques]] — specifically the P6-exit attendus. It is **evaluation sommative** by nature (the référentiel and [[entities/pacte-enseignement-excellence]] otherwise prioritize [[concepts/evaluation-formative]]), but its items are publicly released every year, which makes them a goldmine for calibrating what *P6 exit-level* really means in practice.

## Why it matters for PedagogIA

- **Ground truth for P6 mastery thresholds.** Each CEB item is a concrete, canonical P6 probe. If a student answers a CEB-analog item wrong in PedagogIA, that's meaningful signal — closer to real-world consequence than an arbitrary template.
- **Template mining.** Past CEB questionnaires (released annually) are a reusable source of exercise prompts. The 2024 édition alone surfaces a dozen items almost-ready for template lift.
- **Proof of scope.** The point distribution across math strands (arithmétique ≈ 42 % of math in 2024) justifies the POC focus on [[concepts/champ-3-arithmetique]].
- **Parental trust artifact.** Belgian parents know and fear the CEB. A PedagogIA progression mapped visibly onto "what CEB 2024 asked" could be a trust anchor worth advertising.

## Past and future editions

The FWB publishes the CEB questionnaires (and sometimes corrected copies + statistical reports) yearly on enseignement.be. Earlier years (2013 onward, at least) are available. Ingesting a few older éditions would let us see **how the exam drifts**, which questions recur, and which signals are stable across years.

## See also

- [[sources/ceb-2024]]
- [[sources/ceb-2023]]
- [[entities/fwb]]
- [[entities/pacte-enseignement-excellence]]
- [[concepts/evaluation-formative]]
- [[concepts/champ-3-arithmetique]]
