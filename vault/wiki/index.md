---
title: Index
type: overview
created: 2026-04-17
updated: 2026-04-17
---

Catalog of every wiki page. Updated on every ingest. Keep lines ≤150 chars.

## Overview
- [[overview]] — top-level synthesis of the PedagogIA project and its knowledge base

## Sources
- [[sources/referentiel-mathematiques]] — FWB *Référentiel de Mathématiques* (tronc commun M1→S3, 2022) — POC's curriculum spine
- [[sources/ceb-2024]] — CEB 2024 Questionnaires (6 livrets, juin 2024) — what FWB actually tests at P6 exit
- [[sources/ceb-2023]] — CEB 2023 Questionnaires (juin 2023) — arithmetic only; year-over-year comparison with 2024
- [[sources/ceb-2022]] — CEB 2022 (juin 2022) — adds 8 new arithmetic item families (delete-zero, place-in-interval, match situation→op, equivalent products grid, number-line fill, division equivalence, mult-grid fragment, inverse-op consistency)
- [[sources/ceb-2020]] — CEB 2020 (cancelled, COVID; published anyway) — densest year, 13 new item types incl. compensation principles, abaque-draw, number-line-place, multiple equivalent expressions
- [[sources/ceb-2019]] — CEB 2019 — adds midpoint check, digit-punctuation optimize, fraction-ordering layered
- [[sources/ceb-2018]] — CEB 2018 deep-verify — Q2–Q19 full inventory, 8 new families (product pyramid, array count, septante vocab, product grid, decomposition tree, figurate seq…)
- [[sources/ceb-2017]] — CEB 2017 — surface scan, confirms structural stability
- [[sources/ceb-2016]] — CEB 2016 — Grandeurs items relevant to fraction/proportion templates
- [[sources/ceb-2015]] — CEB 2015 — pre-référentiel era, item types stable
- [[sources/ceb-2014]] — CEB 2014 deep-verify — Livret 2 Nombres et op. (/40), 9 new families + 9 corrections first-seen vers 2014
- [[sources/ceb-2013]] — CEB 2013 deep-verify — Livret 5 N&O (/25) — **année du pivot**, première séparation arithmétique ; 5 new families + 5 backdatings
- [[sources/ceb-2012]] — CEB 2012 — ère pré-séparation, Livret 4 Traitement de données (math appliqué mixte)
- [[sources/ceb-2011]] — CEB 2011 — Livret 4 thème « Baladins du Tiroir », 2 familles data-literacy confirmées 2011+
- [[sources/ceb-2010]] — CEB 2010 — pré-séparation, typographie terse (anchor historique)
- [[sources/ceb-2009]] — CEB 2009 — pré-séparation, anchor historique
- [[sources/ceb-2008]] — CEB 2008 — pré-séparation, édition la plus ancienne disponible (post-réforme 2006)

## Entities
- [[entities/fwb]] — Fédération Wallonie-Bruxelles, Belgian French-speaking education authority
- [[entities/ceb]] — Certificat d'Études de Base, FWB end-of-primary external exam
- [[entities/pacte-enseignement-excellence]] — FWB reform program; umbrella of the new référentiels, target −50 % redoublement by 2030
- [[entities/socles-de-competences]] — legacy FWB curriculum, being phased out 2022→2028
- [[entities/caroline-desir]] — Ministre de l'Éducation, signed the math référentiel
- [[entities/pouvoirs-organisateurs]] — PO / FPO, school networks; author programmes from référentiels
- [[entities/collegia-be]] — the live production deployment on Hetzner (IPs, images, GH wiring)
- [[entities/cloudflare]] — CDN/WAF/DNS edge in front of collegia.be: zone config, WAF rule, TLS mode, runbooks

## Concepts
- [[concepts/tronc-commun]] — FWB common curriculum M1→S3, 8 learning domains
- [[concepts/contenu-vs-attendu]] — teacher-facing content vs student-facing outcome; attendus are the evaluation target
- [[concepts/savoir-savoir-faire-competence]] — 3-tier classification of every curriculum item; directly maps to a skill-tree taxonomy
- [[concepts/approche-spiralaire]] — same skill revisited across years; validates spaced repetition
- [[concepts/verbes-operateurs]] — controlled verb taxonomy encoding cognitive level; hinge between attendus and input types
- [[concepts/evaluation-formative]] — formative over summative; Pacte's primary orientation
- [[concepts/champ-3-arithmetique]] — POC core; arithmetic → algebra progression M3→S3
- [[concepts/champ-1-geometrie]] — solides et figures (out-of-POC, thin)
- [[concepts/champ-2-grandeurs]] — grandeurs, fractions, proportionnalité (partial overlap with POC)
- [[concepts/champ-4-donnees]] — statistique (out-of-POC, thin)
- [[concepts/numeration-decimale]] — place-value progression P1→P6; longest branch of the skill tree
- [[concepts/tables-multiplication]] — T2→T10 introduction schedule P2→P4; mental-calc tricks
- [[concepts/egalite-mathematique]] — `=` en résultat vs équivalence; classic misconception to detect
- [[concepts/fractions-partage-vs-nombre]] — fraction-partage (primaire, Champ 2) → fraction-nombre (secondaire, Champ 3)
- [[concepts/proportionnalite-directe]] — thread P1→S3; tableau/graphe in primary, `y=a·x` in S2
- [[concepts/resolution-problemes-math]] — Champ 3 headline compétence; natural home for Claude investigation
- [[concepts/ceb-attendus-p6-arithmetique]] — nine P6-exit arithmetic item types, cross-referenced from CEB 2024
- [[concepts/prod-stack]] — how prod is wired: Cloudflare → Hetzner firewall → Caddy → Django; CI/CD; security baseline
- [[concepts/edge-security]] — Cloudflare WAF + Hetzner firewall + DRF throttle + CF real-IP middleware, as four composing layers
- [[concepts/product-features]] — catalog of shipped features (modes, AI, progress, parent surface, ops) — 2026-04-18 snapshot

## Questions
- [[questions/progression-arithmetique-p1-p6]] — year-by-year arithmetic progression table + skill-tree implications
- [[questions/nouveaux-types-exercices-ceb]] — 15 types d'exercices à ajouter dans PedagogIA pour couvrir les attendus CEB P6, priorisés en 4 tiers
- [[questions/ingest-gap-ceb-2008-2018]] — état du dépouillement des 16 CEB : 8 profonds, 2 partiels, 6 placeholders — plan de priorisation
- [[questions/frontend-ux-audit-2026-04-18]] — 56-finding punch list across 11 screens × 5 viewports; 4 P0 / 36 P1 / 16 P2 + native-app readiness
- [[questions/devops-state-2026-04-18]] — current infra/devops state, what's live, what to tackle next; handoff page for the next devops agent
