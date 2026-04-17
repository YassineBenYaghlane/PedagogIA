---
title: Log
type: overview
created: 2026-04-17
updated: 2026-04-17
---

Append-only chronological record. Every entry starts with `## [YYYY-MM-DD] <verb> | <title>`.

## [2026-04-17] bootstrap | Wiki created

Initialized the PedagogIA LLM wiki at `~/vault/pedagogia/`. Wrote `CLAUDE.md` (schema & workflows), `README.md` (human quick reference), and empty skeletons for `wiki/index.md`, `wiki/overview.md`, and category folders (`sources/`, `entities/`, `concepts/`, `questions/`). Ready to ingest sources.

## [2026-04-17] ingest | Production architecture (collegia.be)

First technical ingest. Filed [[concepts/prod-stack]] (two-image Docker split, Caddy front for TLS+SPA+API proxy, Hetzner cx23, CI/CD via GH Actions → GHCR → SSH, security baseline) and [[entities/collegia-be]] (live instance at `46.225.142.212`, current images, DNS at LWS, deploy SSH setup). Source: the repo's new `docs/architecture.md` and `prod/` directory (PR #85 + #90). Updated `index.md` and `overview.md` to reflect the new pages; no contradictions with prior claims (wiki was effectively empty).
