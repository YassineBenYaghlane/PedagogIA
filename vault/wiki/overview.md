---
title: Overview
type: overview
created: 2026-04-17
updated: 2026-04-17
tags: [project, synthesis]
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

## Current state

Wiki bootstrapped on 2026-04-17. First filings are infra-flavored: [[concepts/prod-stack]] and [[entities/collegia-be]]. Production went live the same day at `https://collegia.be` on a Hetzner cx23, Docker two-image split behind Caddy, CI/CD via GH Actions → GHCR → SSH. Structure and conventions defined in [[../CLAUDE|CLAUDE.md]].

## Open threads

- Google OAuth prod setup (tracked as issue #91).
- Pedagogical sources: no FWB / didactique material ingested yet — drop into `raw/` and ingest as material accumulates.
