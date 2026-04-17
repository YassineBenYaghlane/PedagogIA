---
title: Verbes opérateurs
type: concept
created: 2026-04-17
updated: 2026-04-17
sources: [referentiel-mathematiques]
tags: [curriculum, vocabulary, taxonomy, exercise-generation]
---

**Verbes opérateurs** = the controlled verbs the FWB uses to introduce every attendu, chosen so that the expected student behaviour is observable and calibrated to an age-appropriate cognitive level. See [[sources/referentiel-mathematiques]] §2.2.2.

## Canonical list encountered in the math référentiel

Grouped here by rough cognitive level — the référentiel does not give this grouping but does say verbs encode difficulty (*"ils gagnent en complexité avec le temps"*).

- **Recall / recognize** — *citer, nommer, associer, identifier, désigner, reconnaitre, distinguer, dire, lire, écrire*
- **Describe / express** — *énoncer, utiliser (un vocabulaire), exprimer, décrire, symboliser, représenter*
- **Apply a procedure** — *utiliser (une technique), effectuer, calculer, tracer, construire, mesurer, compter, ordonner, placer, situer, déplacer, décomposer, recomposer, fractionner, dénombrer, encadrer*
- **Choose / justify** — *choisir (et justifier), comparer, trier, classer, ajuster, estimer, vérifier*
- **Explain / argue** — *expliquer, justifier, interpréter, énoncer (une propriété)*
- **Transfer / solve** — *résoudre (des problèmes), rédiger (un énoncé), modéliser, articuler*

## Polysemy warning

The référentiel explicitly notes that a verb can mean different things in different disciplines (e.g. *situer* = "place on a map" in geography vs "place on a number line" in maths). Always read the verb **together with the full attendu**, never in isolation.

## Why this matters for PedagogIA

Verbes opérateurs are **the natural hinge between curriculum attendus and exercise templates**:

- A template's input type (MCQ, numeric, drag-order, explanation, draw, …) maps to a family of verbes opérateurs.
- *"Identifier"* suggests an MCQ or tap-to-select.
- *"Calculer"* or *"effectuer"* suggests numeric input.
- *"Décomposer"* suggests structured/multi-field input.
- *"Placer sur une bande numérique"* suggests point-on-line input.
- *"Expliquer"* / *"justifier"* suggests a short-answer or Socratic dialog — natural fit for the Claude API investigation path.
- *"Résoudre des problèmes"* suggests multi-step compétence items with a rédaction component.

A rigorous mapping verbe → input type is a TODO and a good candidate for a future question page.

## See also

- [[concepts/contenu-vs-attendu]]
- [[concepts/savoir-savoir-faire-competence]]
