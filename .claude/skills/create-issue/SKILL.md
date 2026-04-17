---
name: create-issue
description: Draft and file a GitHub issue on the PedagogIA repo in the project's house style — short flat title (no type prefix), 2-3 sentences of what + 2-3 sentences of why, then an acceptance-criteria checklist. Use whenever the user asks to "create / file / add / open / draft / write a new issue", "track this as an issue", "fais-en une issue", "ouvre un ticket", or sketches a feature/bug/chore that clearly belongs in the tracker — even if they don't say "GitHub" out loud. Also use proactively after discussions that scope out a unit of work (follow-ups after merging a PR, bugs surfaced mid-conversation, ideas the user wants to park) if the user signals they want to capture it. This skill exists because the repo has a strict, minimalist issue format that Claude tends to drift away from — especially by re-adding `## Description` / `## Requirements` headers, creating a `backlog` label instead of using the Backlog milestone, or prefixing titles with `feat:` / `fix:`.
---

# Filing a PedagogIA GitHub issue

The house style is intentionally flat and scannable. One short paragraph that says **what**, one short paragraph that says **why**, then an acceptance-criteria checklist. Nothing else. Labels come from a fixed set. Milestones map to project phases. A `backlog` label does not exist — deferred work goes into the `Backlog` **milestone**.

The format is tight on purpose: issues are read at a glance from `gh issue list` and the GitHub UI, so every line has to earn its place. When in doubt, cut.

## Two modes: full vs. placeholder

Most issues are **full** — title + what/why paragraphs + acceptance criteria — using the format below.

A subset are **placeholder** issues: the user is parking a roadmap item they'll refine later, not specifying real work yet. Trigger words: "generic", "placeholder", "rough", "stub", "just a small description", "I'll refine later", "for the next phase", "create issues for X, Y, Z" given as a bare list of titles. In placeholder mode:

- Title same rules.
- Body is **one or two sentences** of what — no separate why paragraph, no `### Acceptance criteria` checklist.
- Labels are still picked from the fixed set when obvious; skip them when unclear.
- Don't pad with invented scope to fill the format. The whole point is that the user will flesh it out later.

When in doubt, ask: "full or placeholder?" Placeholder mode also skips the iterate-on-AC step in the workflow — confirm titles + milestone, then file.

## Format

### Title — short, declarative, no type prefix

Aim for under ~60 characters. Never prefix with `feat:` / `fix:` / `chore:` — the repo doesn't use conventional-commit titles.

Good:

- `Postgres automated backups (prod)`
- `Streak and daily goals`
- `Align skill tree with FWB référentiel (review findings)`
- `CSV export of student attempts`

Bad:

- `feat: add Postgres backups` — type prefix
- `Implement automated Postgres backups with offsite rotation for production use` — too long
- `Backups` — too vague

### Body — flat, two short paragraphs

1. **What** (2-3 sentences): what this issue ships, plus any key constraint or scope line. Cross-reference related issues with `#N` when it helps.
2. **Why** (2-3 sentences): what's broken, what's blocked, or who asked for it. Skip only when the what makes the why self-evident (trivial bug fixes).

Do **not** wrap these paragraphs in `## Description` / `## Requirements` / `## Context` / `## Implementation` / `## Notes`. The body is plain prose. The **only** allowed section header is `### Acceptance criteria`.

### Acceptance criteria — checklist of testable outcomes

```
### Acceptance criteria
- [ ] concrete, verifiable outcome
- [ ] another one
```

Write outcomes, not steps. Each bullet must be checkable by reading the code, hitting an endpoint, or clicking through the app. Cite concrete paths, endpoints, env vars, or commands so the issue can be verified end-to-end.

Good:

- `- [ ] apps/skills/models.py: Skill (string PK, label, grade, description, mastery_threshold)`
- `- [ ] GET /api/csrf/ sets csrftoken cookie and returns 204`
- `- [ ] Cross-parent request returns 404 (not 403) to avoid leaking IDs`
- `- [ ] uv run pytest is green in CI`

Bad:

- `- [ ] Write the skill model` — no detail, not verifiable
- `- [ ] Refactor the API` — vague
- `- [ ] Step 1: plan the migration; Step 2: write it` — steps, not outcomes

Aim for 3-8 bullets. More than ~10 usually means you have two issues.

### Exception — large infra / scope issues

Big deployment / migration / re-architecture issues (see #22 *Production deployment*) may group bullet lists under **bold inline labels** (`**Scope**`, `**Infrastructure**`, `**Runtime**`, `**CI/CD**`, `**Monitoring**`, `**Out of scope**`) *before* the acceptance criteria. These are bold text, **not** `##` markdown headers — they keep the issue flat visually while chunking a long spec.

Use this only when a normal two-paragraph body genuinely can't hold the scope. A feature issue (streaks, CSV export, a new screen) should never need it.

## Labels

Pick **zero or a few** from the fixed set below. Don't pad — `enhancement` on every new feature is noise since the area label (`backend` / `frontend` / `ux`) already says more.

Area labels (the ones that actually get used):

- **`backend`** — Django, DRF, Python, management commands
- **`frontend`** — React, Vite, JSX, Tailwind
- **`database`** — PostgreSQL schema, migrations, seed data
- **`infra`** — Docker, CI/CD, deployment, hosting, backups
- **`skill-tree`** — `skills.yaml`, DAG, curriculum alignment
- **`ai`** — Claude API, investigation engine, prompt work
- **`ux`** — gamification, visual design, age-adaptive UI
- **`refactor`** — rewrite or restructure with no behavior change
- **`bug`** — something is broken

Standard GitHub labels (`documentation`, `duplicate`, `enhancement`, `good first issue`, `help wanted`, `invalid`, `question`, `wontfix`) exist but are rarely used on this repo — only apply if they genuinely fit.

**Never** create a `backlog` label. If one reappears, delete it. Deferred work → Backlog **milestone**.

## Milestones

Every planned issue belongs in a milestone. Deferred work → `Backlog`.

- `Phase 0: Foundations` (#1) — skill tree DAG, exercise templates, Django rewrite *(mostly closed)*
- `Phase 1: Core Learning Loop` (#2) — student profiles, exercise screen, AI investigation, mastery *(mostly closed)*
- `Phase 2: Diagnostic + Drill` (#3) — practice modes, spaced repetition, multi-strategy explanations
- `Phase 3: Engagement + UX` (#4) — gamification, knowledge map, age-adaptive UI, audio
- `Phase 4: Production` (#5) — PWA, data export, VPS deployment, session history
- `Phase 5: UX rework + content depth` (#7) — Celestial/Savant Explorer identity, IRT diagnostic, exercise type registry
- `Backlog` (#6) — nice-to-have, not scheduled

If the user doesn't specify a milestone, infer from scope; when ambiguous, **ask** rather than guess. Assigning the wrong phase shuffles the roadmap.

## Workflow

1. **Draft title + body first, show it to the user.** Don't call `gh issue create` before the user sees the draft. Titles and acceptance criteria are what's worth iterating on — land them before filing.
2. **Ask about labels and milestone** when they're not obvious. Don't invent labels outside the fixed set.
3. **File the issue with `gh`**, passing the body via a HEREDOC so markdown, backticks, and newlines survive intact:

   ```bash
   gh issue create \
     --title "short flat title" \
     --label "backend,database" \
     --milestone "Phase 1: Core Learning Loop" \
     --body "$(cat <<'EOF'
   One-line what, with references to related issues if relevant (#N).

   Short why paragraph — what's broken / blocked / who asked.

   ### Acceptance criteria
   - [ ] first outcome
   - [ ] second outcome
   - [ ] third outcome
   EOF
   )"
   ```

4. **Report the resulting URL** to the user.
5. **Don't auto-create the branch.** The user creates `feat/<issue-number>-short-name` when they start work, per GitHub Flow. Filing and starting are separate steps.

## Anti-patterns

- **Type prefix in the title** (`feat: `, `fix: `, `chore: `) — this repo doesn't use them.
- **Section headers in the body** (`## Description`, `## Requirements`, `## Context`, `## Implementation`, `## Notes`). Flat prose only; the sole header is `### Acceptance criteria`.
- **Creating a `backlog` label.** Use the Backlog milestone (#6). If a `backlog` label exists, delete it.
- **Acceptance criteria as a paragraph** instead of `- [ ]` bullets.
- **Inventing new labels** (`feature`, `p1`, `tech-debt`, etc.). Stick to the fixed set or ask first.
- **Padding `enhancement`** on every new feature — the area label already conveys it.
- **Missing the why.** One sentence is enough, but skipping it entirely is only OK for self-explanatory bug fixes.
- **Acceptance criteria written as implementation steps** instead of observable outcomes.

## Worked example

User: *"We should file an issue to add a CSV export of a student's attempts so parents can look at raw data."*

Draft shown to the user before filing:

```
Title: CSV export of student attempts

Body:
Add an endpoint + frontend action that downloads a student's Attempt history as CSV (skill, template, correct/incorrect, timestamp). Scope is one owned child at a time, no aggregation across students.

Parents have asked for raw data they can open in Excel. The PDF report planned in #21 is lossy — CSV gives them the primary source to slice themselves.

### Acceptance criteria
- [ ] GET /api/students/{id}/attempts.csv returns CSV with columns: skill_id, template_id, is_correct, responded_at
- [ ] Ownership enforced — parent can only export their own children (cross-parent → 404)
- [ ] "Exporter CSV" button on the session history screen
- [ ] Test: apps/students/tests/test_export.py covers happy path + cross-parent 404

Labels: backend, frontend
Milestone: Phase 4: Production
```

After the user confirms (or tweaks), file it with `gh issue create` using the HEREDOC form above and return the URL.
