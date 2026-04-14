# CLAUDE.md

## Project Overview

PedagogIA ("L'Explorateur") is a French-language adaptive math learning app for Belgian students aged 6-12 (FWB curriculum, Fédération Wallonie-Bruxelles). It uses a skill tree (DAG) derived from the Référentiel de Mathématiques to generate exercises, track mastery, and investigate root causes of errors via AI (Claude API).

**POC scope:** Champ 3 — Arithmétique (numbers & operations), P1 to P6.

## Commands

```bash
# Frontend (cd frontend)
npm run dev           # Vite dev server
npm run build         # Production build
npm run lint          # ESLint
npm run test:e2e      # Playwright E2E (headless)
npm run test:e2e:ui   # Playwright UI runner

# Backend (cd backend)
uv run uvicorn app.main:app --reload   # FastAPI dev server
uv run pytest                          # Run tests
uv run ruff check .                    # Lint
uv run ruff format .                   # Format

# Database + backend container (from repo root)
docker compose up -d   # Postgres on 5411, backend on 8000

# Seed (cd backend)
uv run python -m app.skill_tree.seed   # Load skill tree + exercise templates into DB
```

## Architecture

### Frontend — React 19 + Vite 8 + Tailwind CSS 4

```
frontend/src/
  components/
    ui/           — Icon, Button, Card, ProgressBar, NumberPad
    screens/      — HomeScreen, ExerciseScreen, DiagnosticScreen, DrillScreen
    exercises/    — ExerciseCard, StepByStep, HintPanel, FeedbackMessage
  lib/
    generators/   — exercise generators per skill
    explanations/ — explanation generators (calcul posé, decomposition, etc.)
    curriculum/   — skill tree data, grade mappings
    utils.js      — randInt, formatNumber, etc.
  stores/         — Zustand stores (studentStore, sessionStore)
  api/            — API client (TanStack Query hooks)
  App.jsx
  main.jsx
```

### Backend — FastAPI + SQLAlchemy + Claude API

```
backend/
  app/
    main.py              — FastAPI entry point
    config.py            — settings from env vars
    models/              — SQLAlchemy models
    schemas/             — Pydantic schemas
    routers/             — API routes (students, sessions, exercises, skills)
    services/            — business logic (investigation, adaptive, exercise_gen, spaced_rep)
    skill_tree/
      tree.py            — DAG data structure + traversal
      skills.yaml        — skill tree definition (easily editable)
      exercise_templates.yaml
      seed.py            — loads YAML into DB
  tests/
  alembic/
  pyproject.toml
```

### Database — PostgreSQL 16

Key tables: `skills`, `skill_prerequisites`, `exercise_templates`, `students`, `student_skill_state`, `sessions`, `attempts`.

Skill tree authored in YAML, seeded into DB. Exercise templates as JSONB, instantiated at runtime.

## Coding Philosophy

**Simplicity above all.** Readable, modular, no overengineering.

### General rules

- **Max 400 lines per file.** If longer, split it.
- **Reuse and abstraction.** Think ahead for reusability. Don't duplicate logic.
- **No parasite comments.** No obvious comments, no file-level docstrings. Short inline comments only when logic isn't self-evident.
- **Docstrings:** only on functions, methods, and classes. Keep them short (one line if possible).
- **Imports always at the top.** Never in the middle of a file.
- **No overcomplication.** If something feels complex, simplify it. Three simple lines > one clever line.

### Python (backend)

- **PEP 8** enforced via ruff
- **Language:** English code, French domain terms (skill labels, feedback text, UI strings)
- **Tooling:** uv (package manager), ruff (linter + formatter), pytest (tests), pre-commit hooks
- **Type hints** on public functions and method signatures
- **Naming:** snake_case functions/variables, PascalCase classes, UPPER_CASE constants

### JavaScript/React (frontend)

- **No semicolons**, double quotes, arrow functions, no trailing commas
- **Language:** All UI text in French. Variable/function names in French (existing convention)
- **Naming:** PascalCase components, camelCase functions, UPPERCASE constants
- **Styling:** Tailwind utility classes first. Custom CSS only for effects (glass, shadows, gradients).
- **ESLint** enforced via pre-commit

### Testing

- Backend: **pytest** + pytest-asyncio. Test business logic (exercise instantiation, skill tree traversal, investigation). Skip trivial CRUD tests.
- Frontend: **Vitest** for pure functions (generators, utils). No UI component tests for now.
- No coverage targets. Test what matters.

### Pre-commit hooks

- **ruff check + ruff format** on Python files
- **eslint** on JS/JSX files
- Configured via `.pre-commit-config.yaml`

## Git Workflow

**GitHub Flow:** main is always deployable.

- Branch per issue: `feat/<issue-number>-short-name` (e.g., `feat/1-skill-tree`)
- Open PR, merge to main
- Issues tracked with milestones (Phase 0-4)

## Design System

Defined in `design-ceb/DESIGN.md`. Material Design 3 + glassmorphism:

- **Primary**: Azure Blue `#0059b6` | **Secondary**: Sunflower Yellow `#705900` | **Tertiary**: Mint Green `#00694b`
- Custom CSS: `.glass-card`, `.shadow-ambient`, `.gradient-soul`, `.spring-hover`, `.bg-orb`
- Design tokens as CSS custom properties in `src/index.css`
- Aesthetic: "Curator Explorer" — sophisticated, not toy-like

## Key Concepts

- **Skill tree (DAG):** backbone of the app. Skills have prerequisites, exercise templates, mastery thresholds. Stored as YAML, seeded into DB.
- **AI investigation:** on wrong answer, Claude API receives (question, answer, skill tree branch, mastery state) and reasons about which prerequisite to test next. No manual error mappings.
- **Exercise templates:** JSONB in DB with parameter ranges. Backend instantiates concrete exercises at runtime. New exercises = YAML edit + re-seed.
