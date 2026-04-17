---
title: Overview
type: overview
created: 2026-04-17
updated: 2026-04-17
tags: [project, synthesis]
sources: [referentiel-mathematiques]
---

Top-level synthesis of the PedagogIA knowledge base. Evolves as sources are ingested and analyses accumulate.

## Project in one paragraph

PedagogIA is a French-language adaptive math learning app for Belgian FWB students aged 6–12 (P1–P6). A skill tree (DAG) derived from the *Référentiel de Mathématiques* drives exercise generation and mastery tracking. When a student makes a mistake, the Claude API investigates the root cause against the skill tree and guides the next step Socratically rather than just marking "wrong". POC scope: **Champ 3 — Arithmétique** (numbers & operations, P1–P6).

## What this wiki is for

A persistent, compounding knowledge base about everything that informs or surrounds the project:

- **Pedagogy**: curriculum references, didactique research, mastery learning, spaced repetition, Socratic method, multi-strategy explanations.
- **Product**: UX flows, design system (JARDIN), age-adaptive UI, gamification (XP/ranks, badges, streaks).
- **Technical**: backend/frontend architecture, Claude API usage (investigation model policy), database schema, auth, deployment.
- **Context**: user feedback, competitive landscape, team decisions, external articles and papers that shape the thinking.

The wiki is not the codebase — `CLAUDE.md` at the repo root covers the code. This is the *why* and *what-if* layer.

## Current state (as of 2026-04-17)

Infra filings: [[concepts/prod-stack]] and [[entities/collegia-be]] — production went live 2026-04-17 at `https://collegia.be` on a Hetzner cx23, Docker two-image split behind Caddy, CI/CD via GH Actions → GHCR → SSH. Structure and conventions defined in [[../CLAUDE|CLAUDE.md]].

Sources ingested:

1. FWB [[sources/referentiel-mathematiques]] (June 2022, 157 pages) — the **authoritative curriculum anchor**. Every exercise and skill tree node in the POC must trace back to an attendu in this document.
2. **All 14 available CEB éditions, 2008→2024** (the 2020 exam was cancelled by COVID but its booklets were published; 2021 reused them — so `raw/CEB_2021_Questionnaires.pdf` is functionally the **2020 bundle**). Deep-dive item-by-item catalog on 2024, 2023, 2022, 2020 ; partial scans on 2018, 2019 ; surface confirmation on 2008–2017. Full cross-year catalog (44 distinct exercise families) in [[concepts/ceb-attendus-p6-arithmetique]] § "Updated catalog after 14-year ingest".

The CEB has been **structurally stable for 16 years** — the *core nine* arithmetic item families appear in every édition we surveyed. Templates aligned to those nine cores will remain CEB-relevant for years.

### What the référentiel locks in for PedagogIA

- **Scope.** POC = [[concepts/champ-3-arithmetique]], P1→P6. Champs 1/2/4 are out of scope but indexed for later.
- **Skill model.** Every curriculum item is classified as [[concepts/savoir-savoir-faire-competence]] — this triplet is the natural DAG node taxonomy.
- **Annualization.** Attendus are defined year by year; the skill tree's backbone mirrors this. Full P1–P6 arithmetic progression in [[questions/progression-arithmetique-p1-p6]].
- **Spiral structure.** Same skills revisit every year with expanding scope ([[concepts/approche-spiralaire]]) — validates mastery-decay + spaced repetition.
- **Evaluation philosophy.** The référentiel (and the [[entities/pacte-enseignement-excellence]] behind it) prioritizes [[concepts/evaluation-formative]] over sommative — exactly PedagogIA's orientation.
- **Political tailwind.** The Pacte targets −50 % redoublement by 2030 through personalized support. PedagogIA is explicitly aligned with that goal.

### Key conceptual axes surfaced by this ingest

- **Numération décimale** — longest spiral in Champ 3, full P1→P6 progression ([[concepts/numeration-decimale]]).
- **Tables de multiplication** — staged T2/T5/T10 (P2) → +T3/T4/T6 (P3) → +T7/T8/T9 (P4) → mastery ([[concepts/tables-multiplication]]).
- **Égalité** — explicit pedagogical concern with the two senses (résultat vs équivalence); a classic misconception the curriculum targets directly ([[concepts/egalite-mathematique]]).
- **Fractions** live in Champ 2 in primary but bleed into Champ 3 via décimaux from P4 ([[concepts/fractions-partage-vs-nombre]]).
- **Résolution de problèmes** is the Champ 3 headline *compétence* every year — natural home for the Claude investigation engine ([[concepts/resolution-problemes-math]]).
- **Verbes opérateurs** encode the cognitive level expected by each attendu — direct input for the exercise-generator's input-type dispatch ([[concepts/verbes-operateurs]]).
- **P6-exit reality check.** The 14-year CEB ingest gives us **44 distinct arithmetic exercise families**: 9 *core* (in every édition since 2008) and ~35 *secondary* that rotate. The full catalog with cross-year tags lives in [[concepts/ceb-attendus-p6-arithmetique]]. PedagogIA's current template set covers ~6 of the 44 (`computation`, `decomposition`, `comparison`, `fill_blank`, `missing_operator`, `estimation`) — sizeable gap. Tier 1 priorities (lowest implementation cost × highest coverage gain) are filed in [[questions/nouveaux-types-exercices-ceb]].

## Open threads

- **Tableaux synoptiques.** The référentiel's final progression grids aren't in the PDF; they're linked externally. TODO: fetch from enseignement.be and ingest.
- **PO programmes.** Individual school networks (WBE, SeGEC, etc.) author programmes built on the référentiel. None ingested yet — candidates for future sources.
- **Didactique research.** We lean on mastery learning + spaced repetition + Socratic method as working assumptions. No research ingested yet to validate or refine these. TODO.
- **Competitor / market notes.** Nothing filed yet on the FWB edtech landscape (Smartschool, Gallileo, Itslearning, bigger French edtech tools like Kartable). Useful reference for adoption strategy.
- **Google OAuth prod setup** (tracked as issue #91).
