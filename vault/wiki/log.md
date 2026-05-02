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

## [2026-04-17] ingest | Référentiel de Mathématiques (FWB, 2022)

First real source ingested: the 157-page FWB *Référentiel de Mathématiques* for the tronc commun M1→S3 (`raw/référentiel de Mathématiques (ressource 17239).pdf`). This is the curriculum anchor for the entire PedagogIA POC. Touched 21 wiki pages:

- Source: `sources/referentiel-mathematiques`.
- Entities (5): `fwb`, `pacte-enseignement-excellence`, `socles-de-competences`, `caroline-desir`, `pouvoirs-organisateurs`.
- Concepts (13): `tronc-commun`, `contenu-vs-attendu`, `savoir-savoir-faire-competence`, `approche-spiralaire`, `verbes-operateurs`, `evaluation-formative`, `champ-3-arithmetique` (deep), `champ-1-geometrie`/`champ-2-grandeurs`/`champ-4-donnees` (thin), `numeration-decimale`, `tables-multiplication`, `egalite-mathematique`, `fractions-partage-vs-nombre`, `proportionnalite-directe`, `resolution-problemes-math`.
- Question: `questions/progression-arithmetique-p1-p6` (year-by-year arithmetic table + skill-tree implications).
- Refreshed `overview.md` with first real synthesis, and fully populated `index.md`.

Flagged as `> Unresolved:` — the "Tableaux synoptiques" section in the PDF (p156) is just a placeholder linking to an external resource on enseignement.be. To fetch separately if/when we want the visual progression grids.

## [2026-04-17] ingest | CEB 2024 Questionnaires

Second source ingested: the 152-page 2024 *Certificat d'Études de Base* questionnaire booklet (`raw/CEB_2024_Questionnaires.pdf`) — the FWB external exam every P6 student sits each June. Focus narrowed per user request to **arithmetic only** (livrets 6 + 7, *Nombres et opérations*, 70 pts combined); other math booklets (Solides et figures, Grandeurs) scanned but not deeply synthesized, and French/éveil booklets skipped as out-of-POC. Touched 8 wiki pages:

- Source: `sources/ceb-2024`.
- Entity: `entities/ceb`.
- Concept: `concepts/ceb-attendus-p6-arithmetique` (new — nine P6-exit item types with example stems + skill-tree leaf suggestions).
- Updates: `concepts/champ-3-arithmetique` (added CEB sub-concept link + source), `concepts/numeration-decimale` (added P6 CEB probes + Belgian numération note on *septante*/*nonante*/*quatre-vingts*), `concepts/resolution-problemes-math` (added livret 7 Q13 multi-résolution example as canonical investigation signal).
- Refreshed `overview.md` (two-source synthesis; flagged three under-covered template types: propriétés opératoires as fill-in, estimation standalone, multi-résolution probing), `index.md` (ceb-2024 + ceb + ceb-attendus-p6-arithmetique).

## [2026-04-17] ingest | CEB 2023 Questionnaires (arithmetic only)

Third source ingested: the 156-page 2023 CEB questionnaire (`raw/CEB_2023_Questionnaires.pdf`) — scoped to the arithmetic booklet (Livret 8, /70 pts, 25 items) per user focus. Key structural finding: 2023 bundles *Nombres et opérations* into one booklet while 2024 splits it into two — **livret numbering is not stable year-to-year**, so programmatic mining must key on booklet title. Touched 6 wiki pages:

- Source: `sources/ceb-2023` (cross-year delta table; 2023-only items explicitly listed).
- Updates: `entities/ceb` (noted numbering instability), `concepts/ceb-attendus-p6-arithmetique` (added items 10–20, year-over-year stability section, rotation-rate guidance for spaced repetition), `overview.md` (three-source synthesis), `index.md` (+ ceb-2023), this log.

Key signal for PedagogIA: the 2023 delta surfaces **seven untested-in-2024 item types** (suite figurale, fractions de quantité, ordre croissant mixte, abaque formel, nombres premiers, arbre récursif sur décimal, piège commutativité soustraction). All are référentiel-legitimate and good targets for P6 template expansion. Ingesting 2–3 more CEB years would let us compute actual item rotation frequencies — useful input for the mastery-decay schedule.

## [2026-04-17] query | Nouveaux types d'exercices à ajouter dans PedagogIA

Compared current PedagogIA exercise template shapes (`computation`, `decomposition`, `comparison`, `fill_blank`, `missing_operator`, `estimation`) against the 16 CEB item families synthesized in [[concepts/ceb-attendus-p6-arithmetique]]. Identified 15 missing types, grouped in four tiers by implementation cost × coverage gain. Tier 1 (MCQ/fill, core-9 CEB items — `pick_equivalents`, `operator_identity_fill`, `verification_pick`, `equality_trap`, `rang_decimal`) recommended as next shipping batch. Tier 2 (`reasoning_chain_pick`, `inference_from_known`) flagged as highest-value investigation signal for Claude. Tier 3 addresses the zero-fraction gap in P5/P6 templates. Filed as `questions/nouveaux-types-exercices-ceb`, indexed.

## [2026-04-17] ingest | CEB 2008→2022 (full backlog)

Ingested **all 14 remaining CEB éditions** in `vault/raw/` to enrich the arithmetic item-type catalog. Deep dives on 2022, 2020, 2019, 2018; surface scans on 2017→2008 (catalog saturated, only structural confirmation needed). 2020 was the densest year (13 new types) — the cancelled-by-COVID édition had been planned with a /80 booklet (vs the usual /70), allowing more item families to fit. 2022 added 8 more types focused on novel input primitives (triangle products, number-line fill, division equivalence, multiplication grid fragment). 2019 added 3 (midpoint check, virgule-placement optimization, layered fraction ordering). 2018 confirmed timed pure-compute and surfaced percentage-as-Champ-3-calc.

Important naming flag uncovered: `raw/CEB_2021_Questionnaires.pdf` actually bundles the 2020 booklets (the 2020 exam was cancelled and 2021 used the same materials). Future ingests should refer to that file as the **CEB 2020 bundle**.

Touched 17 wiki pages: `sources/ceb-2008`, `2009`, `2010`, `2011`, `2012`, `2013`, `2014`, `2015`, `2016`, `2017`, `2018`, `2019`, `2020`, `2022` (new) ; updated `concepts/ceb-attendus-p6-arithmetique` with the full 44-item catalog table + cross-year stability analysis ; refreshed `index.md` with all new sources; this log.

The arithmetic test bench has been **structurally stable for 16 years** — strong design signal for PedagogIA: templates aligned to the *core nine* will remain CEB-relevant for years.

## [2026-04-17] query | État du dépouillement CEB

Audit du corpus CEB filé sous `wiki/sources/` : 8 éditions dépouillées en profondeur (2015–2017, 2019, 2020, 2022–2024), 2 partielles (2014, 2018), 6 placeholders sans extraction arithmétique (2008–2013). Le catalogue d'items dans `concepts/ceb-attendus-p6-arithmetique` provient quasi-exclusivement du niveau 1. Filed `questions/ingest-gap-ceb-2008-2018` avec plan de priorisation (finir 2014+2018, puis pass rapide 2008–2013).

## [2026-04-17] ingest | CEB 2018 deep-verify (Q2–Q19)

Passage profond sur le Livret 8 Nombres et opérations 2018. 18 nouvelles questions inventoriées (Q2–Q19), 8 nouvelles familles d'items identifiées : `partial_product_scale_up_mcq` (Q4), `place_value_increment` (Q7), `product_pyramid_fill` (Q9), `array_count_and_expression` (Q10), `belgian_number_word_to_digits` (Q13 — *septante centièmes*, unique dans le corpus), `product_grid_find` (Q14 multi-solution), `decomposition_tree_equal_parts` (Q15), `figurate_number_sequence` (Q17 — triangulaires/carrés). Le catalogue `concepts/ceb-attendus-p6-arithmetique` passe à ~52 familles. Confirmations cross-year : `fraction_ordering_layered` pre-dates 2019, `match_situation_to_operation` présent aussi en 2018 Q19. Touché : `sources/ceb-2018` (réécrit de 41→~90 lignes), `concepts/ceb-attendus-p6-arithmetique` (items 61–68).

## [2026-04-17] note | CEB 2014 — renumérotation des livrets

Tentative de dépouillement arithmétique 2014 : le **Livret 8 du CEB 2014 = Grandeurs** (/40, vendredi 20 juin), **pas** Nombres et opérations comme dans 2018→2024. Convention de numérotation changée entre 2014 et 2018. Le booklet arithmétique pur n'a pas été localisé dans `raw/CEB_2014_Questionnaires.pdf` après balayage de ~80 pages (zones restantes à explorer : 7-44, 65-69, 110-125, 146-fin). Flag `> ⚠ Conflict:` ajouté sur `sources/ceb-2014`.

## [2026-04-17] ingest | CEB 2014 deep-verify (Nombres et opérations = Livret 2)

Trouvé le **Livret 2 Nombres et opérations 2014** aux pages PDF 8–25 (pas Livret 8 comme en 2018+). Inventaire Q1–Q19 complet, /40 pts. 9 nouvelles familles ajoutées au catalogue (items 69–77) : `matchstick_pattern_projection` (Q1), `multiples_venn_fill` (Q3), `euclidean_division_fill` (Q4), `sum_target_in_grid` (Q5), `bar_chart_multi_query` (Q6), `place_in_interval_matrix` (Q13), `factorization_triangle` (Q14), `fraction_comparison_in_context` (Q16), `remainder_reasoning_multiselect` (Q18).

**Impact majeur cross-year** : 9 familles précédemment tagguées comme « 2016/2018/2020/2022-first » sont en fait déjà présentes en 2014 — Q7 `partial_product_scale_up_mcq`, Q8 `place_value_increment`, Q9 `match_situation_to_operation`, Q10 `estimation_closest_product`, Q11 `place_in_interval`, Q12 `equivalent_scale_products_pick`, Q15 `digit_permutation_optimize`, Q17 `receipt_multi_query`, Q19 `inverse_operation_write`. La stabilité structurelle est donc **10 ans continus** (2014→2024), encore plus forte que les dépouillements précédents ne le suggéraient.

Touché : `sources/ceb-2014` (réécrit de 32→~100 lignes avec inventaire complet et table first-seen corrections), `concepts/ceb-attendus-p6-arithmetique` (items 69–77 + table first-seen corrections, lead updated), `wiki/index.md`.

## [2026-04-17] ingest | CEB 2008–2013 batch — découverte du pivot 2013

Balayage des 6 CEB placeholders pré-2014. **Découverte majeure** : le CEB a introduit un **livret dédié *Nombres et opérations* en 2013 seulement**. Avant (2008–2012), l'arithmétique P6 était testée à travers un livret thématique (« Math appliqué » en 2011, « Traitement de données » en 2012) mêlant calcul, grandeurs et données.

**2013 Livret 5 N&O /25** — dépouillement profond : inventaire Q1–Q15, 5 nouvelles familles (items 78–82) : `successor_predecessor_fill`, `column_operation_digit_fill`, `grid_row_col_product`, `expression_tree_multi_solution`, `logic_tree_classification`. Cinq corrections first-seen vers 2013 : `number_reading_mcq`, `number_grid_pattern_fill`, `abaque_read`, `equivalent_scale_products_pick`, `digit_punctuation_optimize` (notamment `abaque_read` poussé de 2023 à 2013 = 10 ans).

**2012 Livret 4 Traitement de données /25** et **2011 Livret 4 Math appliqué** — surface-scan structurel. Confirment `bar_chart_multi_query` et `receipt_multi_query` dès 2011. Deux familles pré-2013 potentiellement « disparues » post-2013 : `distance_matrix_query` (tableau triangulaire des distances) et `seating_logic_puzzle` (placement sous contraintes logiques) — absentes du corpus moderne, à flagger si on élargit le scope.

**2008, 2009, 2010** — confirmés pré-séparation par analogie ; non dépouillés en détail (rationale dans `sources/ceb-2008`).

**Impact structural** : le catalogue [[concepts/ceb-attendus-p6-arithmetique]] passe à 82 familles. Stabilité de 13 ans pour les familles data-literacy (2011→2024), 11 ans pour l'arithmétique pure post-séparation (2013→2024). Touché : `sources/ceb-2013` (réécrit ~80 lignes), `sources/ceb-2012`, `sources/ceb-2011`, `sources/ceb-2010`, `sources/ceb-2009`, `sources/ceb-2008`, `concepts/ceb-attendus-p6-arithmetique` (items 78–82 + 7 backdatings), `questions/ingest-gap-ceb-2008-2018`.

## [2026-04-18] note | Product features catalog

Added [[concepts/product-features]] — shipped-feature inventory grouped by surface (learning modes, AI & pedagogy, progress & state, parent surface, ops-adjacent). Cross-references `Session.mode` choices in `apps/sessions/models.py` and services under `apps/students/services/` (mastery, xp, streaks, achievements). Intended as a stable anchor for schema/design discussions (notably the upcoming #119 backend refactor) rather than a changelog — dates feature-by-feature in the page itself. Touched: `concepts/product-features.md` (new), `index.md`.

## [2026-04-18] note | Frontend UX & responsiveness audit

Filed [[questions/frontend-ux-audit-2026-04-18]] — point-in-time audit of 11 screens × 5 viewports (375/390/834/1194/1440), 56 findings (4 P0 / 36 P1 / 16 P2) plus a "native-app readiness" punch list. Method: booted dev stack via `run-app`, created `audit@test.com` + student Léa, ran a one-off Playwright spec for screenshots, statically reviewed every screen + design primitive. Headline: no `<AppShell>` primitive (root cause of duplicated header bugs), no safe-area-inset, no iOS-zoom-prevention on inputs, skill tree unusable on phone (grade buttons truncate, search overflows). Index updated; no entity/concept page created — this is point-in-time analysis, not durable knowledge. Screenshots lived under `/tmp/audit-screenshots/` and were not preserved.

## [2026-04-18] note | UX audit follow-through — #120 shipped, #121–#123 queued, e2e skill bugs surfaced

Turned [[questions/frontend-ux-audit-2026-04-18]] into 4 GitHub issues under the **Phase 5: UX rework + content depth** milestone — #120 (shared `<AppShell>` + mobile rendering basics), #121 (skill tree usable on phone), #122 (touch-friendly empty/disabled/hover states), #123 (RN/PWA-port scaffolding). #120 shipped as PR #125 (squash-merged → 9cf3424): introduced `frontend/src/components/layout/{AppShell,TopBar,Page,TopBarActions}.jsx`, migrated all 11 screens off `min-h-screen`, added safe-area-inset + 16 px input baseline + `autocomplete`/`inputmode` on Login & Register. Verified at 375 / 834 / 1440 — header-stacking bug on `/children` and `/dashboard` is gone, single-child Pot centers, Welcome title wraps to 2 lines.

PR #128 also landed: replaced the leftover Vite-template `README.md` with a real PedagogIA intro and ingested two wiki pages ([[concepts/product-features]] + [[questions/frontend-ux-audit-2026-04-18]]).

**Queued for next session** — three `e2e-validate-pr` skill bugs surfaced during validation, not yet tracked in GitHub: (a) `run.sh` hardcodes `STACK_ID=1` (collides whenever a worktree runs) — should auto-discover free offset like `run-app/scripts/new-instance.sh`, (b) `frontend/playwright.config.js` pins chromium baseURL to port 5174 regardless of which stack the orchestrator booted (currently shadow-patched to honor `E2E_STACK_ID`), (c) the shared `e2e_frontend_node_modules` volume goes stale against `package.json` (missing `@fontsource/fraunces` + `@dnd-kit` broke Vite mid-run). Two of the three are already fix-on-disk in the working tree; file as one issue when picked up.

## [2026-04-18] note | Cloudflare edge + Hetzner firewall lockdown + rate limiting

Closed out three interlocking infra issues in one session. **#99 / #118** — DRF `ScopedRateThrottle` on `/api/auth/login,registration,password/reset,google/*` (10/min, 5/h, 5/h), with `DatabaseCache` so throttle state is shared across gunicorn workers (`LocMemCache` silently failed with 3 workers in dev — caught during manual burst test). **#87 / #124** — Cloudflare in front of `collegia.be`: NS delegation from LWS → `augustus`/`bailey`, Full (strict) TLS, "Always Use HTTPS", WAF rate-limit rule on `/api/auth/*`; then Hetzner firewall `pedagogia-web` locked to Cloudflare IPv4+IPv6 ranges on TCP/80+443 via `hcloud firewall replace-rules`. Django side got `CloudflareRealIPMiddleware` that only trusts `CF-Connecting-IP` when the TCP peer is a Cloudflare CIDR, so the throttle keys on real client IPs without being spoofable from direct-to-origin. DNS cleaned up during CF migration (dropped MX/SPF/DKIM/DMARC/`mail`/`imap`/`pop`/`smtp`/`ftp`; kept `A`/`AAAA`/`www`). **#127** — deploy smoke check moved inside the SSH session polling the backend container healthcheck, because Cloudflare 403s GH runner IPs. Filed [[concepts/edge-security]] + [[questions/devops-state-2026-04-18]] and refreshed [[concepts/prod-stack]] + [[entities/collegia-be]]. Follow-up issue #126 (managed challenge for non-BE) filed, parked.

## [2026-04-18] note | Cloudflare entity page

Filed [[entities/cloudflare]] — account/zone state for `collegia.be`, DNS record table, TLS + WAF settings, runbooks for refreshing CF IP ranges on the Hetzner firewall + verifying the edge + dashboard navigation + gotchas (bot-score 403s on datacenter IPs, proxied MX limitation, Email Routing auto-activation). Cross-linked from [[concepts/edge-security]], [[entities/collegia-be]], and the index.

## [2026-04-18] note | Release process filed

Formalised PedagogIA's release policy: every merge to `main` is a release with a human-chosen semver tag. Filed [[concepts/release-process]] with the bump heuristics, the merge→tag flow, and where the version surfaces (`/api/health/`, Serre footer, GHCR image tag, Sentry release). Paired with the #89 PR that wires `APP_VERSION` / `VITE_APP_VERSION` through the build and adds `release.yml` for auto GitHub Releases on `v*` tag push. Claude must ask the user for the target version before merging any PR into main.

## [2026-04-19] note | Reward system design — XP and skill_xp

Filed [[concepts/reward-system]] capturing the two-currency model decided during the #117 rework scoping. Student XP (`base(difficulty) × multiplier(n_skills)`, cap at 1.8 for 3+ skills) is awarded in all modes on correct answers. Per-skill `skill_xp` (single 0–30 counter, replaces the earlier tiered `correct_easy/medium/hard` sketch) is only awarded in drill/training modes; diagnostic and exam give XP only. Status bands derived from skill_xp (`not_started`, `learning_easy`, `learning_medium`, `learning_hard`, `mastered`) drive selection — the selector serves difficulty matching the band, giving organic tier progression from a single counter. `needs_review` is a time-based overlay that only flips on below skill_xp = 20. Schema-agnostic page — separate from the Django migration work that will implement it.

## [2026-04-21] query | Exercise quality evaluation — architecture

Filed [[questions/exercise-quality-evaluation]] after a design discussion that started on "how do I see if we have variety per skill?" and broadened into the full quality question. Two supporting concept pages landed with it: [[concepts/templates-vs-curated-exercises]] (records why a proposed curated-Exercise-table schema change was rejected — six challenges, reframed as "curate only for assessment-grade content") and [[concepts/template-variant-count]] (the empirical per-template variant metric that replaces the curated-first motivation for most skills). Main synthesis reframes "good" as *aligned + calibrated*, laying out a three-layer plan — Layer 1 `Attempt` stats (deferred: needs users), Layer 2 structural CI checks, Layer 3 AI rubric review (Haiku default, Sonnet escalation, référentiel in prompt cache). Caveat on AI rubrics: nondeterministic, don't gate deploys — use as prioritisation signal only. Paired with Tier 1 issues #176–#180 filed same day. Updated `index.md` under Concepts (2 new) and Questions (1 new).

## [2026-04-21] query | Recap of templates + quality-evaluation view

User asked to be reminded of their view on exercise templates and quality evaluation. Read [[concepts/templates-vs-curated-exercises]], [[concepts/template-variant-count]], and [[questions/exercise-quality-evaluation]]; answered with a three-part recap (templates-only with curation reserved for assessment-grade items; "good" = aligned + calibrated; three-layer evaluation with Layer 1 deferred until users). No page changes — existing synthesis was complete.

## [2026-05-01] refactor | AI investigation → conversational tutor

Replaced the one-shot `feedback_for(attempt)` flow with a persistent conversational tutor (`apps/chat`). Single lifelong `Conversation` per `Student`; two entry points (free chat at `/chat`, in-exercice via `POST /api/attempts/<id>/open-chat/` which seeds the chat with a Socratic opener and surfaces `next_skill_id` from the legacy investigation engine). Replies stream NDJSON. Renamed `INVESTIGATION_MODEL_*` settings → `TUTOR_MODEL_*`. Parents read the log read-only at `/dashboard/chat/<student-id>`. Updated [[concepts/product-features]] (replaced "AI investigation on wrong answer" bullet by the tutor entry). Tracked as [#192](https://github.com/YassineBenYaghlane/PedagogIA/issues/192).
