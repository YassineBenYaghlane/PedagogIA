# CLAUDE.md

## Project Overview

PedagogIA is a French-language adaptive math learning app for Belgian students aged 6-12 (FWB curriculum, Fédération Wallonie-Bruxelles). It uses a skill tree (DAG) derived from the Référentiel de Mathématiques to generate exercises, track mastery, and investigate root causes of errors via AI (Claude API).

A user account owns one or more student profiles; the student picks their profile and learns through diagnostic sessions, drills (targeted practice), and free practice guided by spaced repetition.

**POC scope:** Champ 3 — Arithmétique (numbers & operations), P1 to P6.

## Commands

```bash
# Full stack (from repo root) — Postgres + Django + Vite
docker compose up -d

# Backend (cd backend) — Django 5 + DRF
uv run python manage.py runserver            # Dev server on :8000
uv run python manage.py migrate
uv run python manage.py seed_skills          # Load skill tree from YAML
uv run python manage.py seed_templates       # Load exercise templates (P1–P6)
uv run pytest                                # pytest-django
uv run ruff check .                          # Lint
uv run ruff format .                         # Format

# Frontend (cd frontend) — React 19 + Vite 8
npm run dev
npm run build
npm run lint
npm run test:e2e        # Playwright headless
npm run test:e2e:ui     # Playwright UI runner
```

API docs: `/api/docs/` (drf-spectacular Swagger). Health: `/api/health/`.

## Production

Live at `https://collegia.be` (Hetzner cx23, `nbg1`). Two-image split (`pedagogia-backend` + `pedagogia-frontend`) built in CI and pushed to GHCR; server pulls `:latest` and restarts via SSH on every push to `main`. Caddy owns TLS + SPA + reverse proxy. Full map in [`docs/architecture.md`](docs/architecture.md); server bootstrap in [`prod/bootstrap.md`](prod/bootstrap.md).

## Architecture

### Backend — Django 5 + DRF + Claude API

```
backend/
  manage.py
  pedagogia/
    settings/{base,dev,prod}.py
    urls.py                 — /api/auth, /api/skills, /api/exercises, /api/students, /api/sessions
  apps/
    accounts/               — Parent (AUTH_USER_MODEL), dj-rest-auth + allauth Google OAuth
    skills/                 — Skill, SkillPrerequisite (seeded from YAML)
    exercises/              — ExerciseTemplate, Attempt; diagnostic/, drill/, investigation, services
    students/               — Student (scoped to parent); services/{mastery, selection}
    sessions/               — Session, links attempts to a student + mode
    common/                 — shared permissions (IsParentOwner, etc.)
  src/
    skill_tree/             — tree.py (DAG) + skills.yaml + exercise_templates_p{1..6}.yaml
    services/exercise_gen.py
  tests/                    — pytest-django: auth, API, investigation, mastery, selection, scoping…
  pyproject.toml            — uv, Django 5.1, DRF, dj-rest-auth, allauth, anthropic, drf-spectacular
```

Auth is **session-based** (SessionAuthentication) with CSRF; the frontend calls `/api/csrf/` before mutating requests. Google OAuth via allauth social adapter.

### Frontend — React 19 + Vite 8 + Tailwind CSS 4

```
frontend/
  src/
    components/
      ui/          — Icon, SkillNode
      exercises/   — ExerciseCard, FeedbackMessage, HintPanel
      screens/     — Welcome, Login, Register, GoogleCallback, ChildPicker,
                     SkillTree, Diagnostic, DiagnosticResult, Drill, Exercise
    lib/           — constants, googleOAuth, skillTreeLayout (dagre), hints, utils
    stores/        — Zustand: authStore, sessionStore, diagnosticStore, drillStore
    api/           — client (fetch + CSRF), diagnostic, drill, exercises
    App.jsx / main.jsx / index.css
  e2e/             — Playwright specs (auth, exercise, smoke)
```

Routing with `react-router` v7. Skill tree visualisation uses `@xyflow/react` (ReactFlow) + `dagre` layout. Server state via TanStack Query; client state via Zustand.

### Database — PostgreSQL 16

Key tables: `accounts_parent`, `students_student`, `skills_skill`, `skills_skillprerequisite`, `exercises_exercisetemplate`, `exercises_attempt`, `sessions_session`. Skill tree authored in YAML, seeded into DB. Exercise templates stored as JSONB and instantiated at runtime.

## Coding Philosophy

**Simplicity above all.** Readable, modular, no overengineering.

### General rules

- **Max 400 lines per file.** If longer, split it.
- **Reuse and abstraction.** Don't duplicate logic.
- **No parasite comments.** No obvious comments, no file-level docstrings. Short inline comments only when logic isn't self-evident.
- **Docstrings** only on functions, methods, classes — one line if possible.
- **Imports at the top.** Never in the middle of a file.
- Three simple lines > one clever line.

### Python (backend)

- **PEP 8** enforced via ruff (line-length 100, select E/F/I/W)
- **Language:** English code, French domain terms (skill labels, feedback, UI strings)
- **Tooling:** uv, ruff, pytest-django, pre-commit
- **Type hints** on public functions and method signatures
- **Naming:** snake_case, PascalCase classes, UPPER_CASE constants
- Thin DRF views; business logic in `services/` or app-level modules (`investigation.py`, `diagnostic.py`, `drill.py`)

### JavaScript/React (frontend)

- **No semicolons**, double quotes, arrow functions, no trailing commas
- **UI text in French.** Variable/function names in French where it already is the convention
- **Naming:** PascalCase components, camelCase functions, UPPERCASE constants
- **Styling:** Tailwind utilities first; custom CSS only for effects (glass, shadows, gradients)
- **ESLint** enforced via pre-commit

### Testing

- Backend: **pytest-django**. Test business logic (selection, mastery, investigation, exercise gen) and API auth/scoping. Skip trivial CRUD.
- Frontend: **Playwright** E2E for auth + exercise flow. No unit tests for now.
- No coverage targets — test what matters.

### Pre-commit hooks

- ruff check + ruff format on Python
- eslint on JS/JSX
- Config: `.pre-commit-config.yaml`

## Git Workflow

**GitHub Flow:** main is always deployable.

- Branch per issue: `feat/<issue-number>-short-name`
- Open PR → merge to main
- Issues: one-liner context + why, then acceptance criteria checklist

## Design System

**Le Jardin de PédagogIA.** Reference preview: `design/JARDIN.html` + `design/jardin-screens/`. Migration tracked in #65.

Metaphor: a calm botanical greenhouse. Each skill is a plant, each session a care ritual, each mastered skill a *floraison*. Four plant states: *en sommeil · à arroser · en croissance · floraison*.

- **Palette** — `bone #FFFFFF` surface · `chalk #F6F8F3` page · `mist #ECF1E7` secondary · `sage #6FA274` primary · `sage-deep #3F6F4A` accent · `sage-leaf #C7E0B5` halos · `sky #B8DCEA` hints/IA · `sky-deep #4F8BAC` links · `bark #2B3A2E` text · `stem #5C6B5F` secondary text · `honey #E8C66A` XP (rare) · `rose #E8A6A1` soft error (never bright red)
- **Type** — Display *Fraunces* (italic for display accents) · UI *Inter* 14–16px · numerals *JetBrains Mono* tabular
- **Primitives** — `.greenhouse`, `.paper-grid`, `.water`, `.tag`, `.chip`, `.pill`, `.pot`, `.specimen`, `.navlink` (see `src/index.css`); components in `frontend/src/components/ui/`
- **Screen vocabulary** — ① Serre (Welcome) · ② Carnets (ChildPicker) · ③ Carte (SkillTree) · ④ Établi (Exercise) · ⑤ Jardinier (feedback/investigation) · ⑥ Herbier (progress) · ⑦ Floraison (celebration)
- **Principles** — 60% white / 25% pale green / 15% accent · SVG only (no emojis in UI) · 200ms transitions, soft shadows · no mascot, no claymorphism, no indigo/violet, no bright red

## Key Concepts

- **Skill tree (DAG):** backbone of the app. Skills have prerequisites, exercise templates, mastery thresholds. Authored in YAML, seeded into DB.
- **Learning modes:**
  - *Diagnostic* — locates the student's current level on the tree
  - *Drill* — targeted practice on a chosen skill
  - *Free practice* — selection driven by mastery state + spaced repetition
- **AI investigation:** on wrong answers, Claude API receives (question, answer, skill tree branch, mastery state) and reasons about which prerequisite to probe next. Primary model is Claude Haiku 4.5, escalation to Sonnet 4.6 (see `INVESTIGATION_MODEL_*` in settings). No manual error mappings.
- **Multi-strategy explanations:** several pedagogical angles (calcul posé, décomposition, etc.) picked per skill.
- **Exercise templates:** JSONB with parameter ranges. Backend instantiates concrete exercises at runtime. New exercises = YAML edit + `seed_templates`.
- **User / Student model:** `User` is the auth model (apps.accounts.User); students are profiles scoped to a user. All student-facing endpoints enforce ownership.

## Open work (high-level)

Open issues focus on UX/gamification (XP & ranks, badges, streaks, knowledge map, age-adaptive UI), data export & session history, and PWA/offline support. Production is live; follow-ups tracked as infra issues. Check `gh issue list` for the current state.
