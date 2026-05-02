---
title: Product Features
type: concept
created: 2026-04-18
updated: 2026-04-18
sources: []
tags: [product, backend, frontend, overview]
---

Catalog of user-facing and system features currently shipped in PedagogIA. Grouped by surface. Each entry names the feature, what it does, and where it lives in the codebase — so that design / schema / pedagogy discussions can reference a stable list instead of re-deriving it each time.

Snapshot date: **2026-04-18**. Verify against `git log` and `gh issue list` before acting on it — features land fast.

## Learning modes

All four are backed by `apps/sessions` with `Session.mode ∈ {training, diagnostic, drill, exam}` and attempts recorded in `apps/exercises.Attempt`. Per [[concepts/reward-system]], only `training` and `drill` move `skill_xp` — `diagnostic` and `exam` award student XP but don't touch per-skill mastery.

- **Diagnostic** — IRT-scheduled walk that locates the student's current level on the skill tree. Awards XP only.
- **Drill** — student (or parent) picks a skill and practices it (`Session.target_skill`). Selection of the skill is manual; template selection within the skill is backend-driven.
- **Training / Free practice** (`mode="training"`) — selection via `apps/students/services/selection.py::pick_next_skill`, reading `skill_xp` state from `StudentSkillState`.
- **Exam** — timed-ish session with attempts; awards XP only (no mastery mutation).

## AI & pedagogy

- **AI tutor (chat libre + in-exercice)** — `apps/chat` exposes a single lifelong `Conversation` per `Student`. Two entry points: from the home (`/chat`) for free questions, and from `ExerciseCard` on a wrong attempt (`POST /api/attempts/<id>/open-chat/`) where the conversation is seeded with a Socratic opener and a `next_skill_id` derived from the legacy `apps/exercises/investigation` engine. Replies stream NDJSON (`POST /api/conversations/<id>/messages/send/`). System prompt enforces French, age-6–12 vocabulary, Socratic stance, and rejects off-school / sensitive topics. Primary model Claude Haiku 4.5, escalation to Sonnet 4.6 (`TUTOR_MODEL_*`). Parents read the log at `/dashboard/chat/<student-id>` (read-only, scoped to owned children). Natural home for [[concepts/resolution-problemes-math]].
- **Multi-strategy explanations / hints** — each skill can expose several pedagogical angles (calcul posé, décomposition, …). Delivered through `apps/exercises` + frontend `lib/hints`.
- **Exercise templates** — parameterized JSONB rows in `ExerciseTemplate`, authored in `backend/src/skill_tree/exercise_templates_p{1..6}.yaml`, instantiated at runtime. New exercises = YAML edit + `seed_templates`. Being refactored to M2M with weights (#117).

## Progress & state

- **Mastery tracking** — `StudentSkillState` stores per-(student, skill) `skill_xp` (0–30); updated by `apps/students/services/mastery.py::apply_template_attempt`. Status / mastery_level / needs_review are computed properties (see [[concepts/reward-system]]).
- **XP** — per-attempt XP ledger, `apps/students/services/xp.py::compute_xp(difficulty, n_skills)`.
- **Streaks** — daily-practice streak counter, `apps/students/services/streaks.py`.
- **Achievements** — badge-like unlocks, `apps/students/services/achievements.py` + `students.Achievement` model.
- **Skill tree visualization** — ReactFlow + dagre layout, reads `StudentSkillState` (see [[concepts/champ-3-arithmetique]] for the DAG content).
- **Session history / clickable review** — any past session can be re-opened and inspected attempt-by-attempt (landed in #109).

## Parent / account surface

- **Parent dashboard** at `/dashboard` — parent overview screen aggregating child progress (#96, #108).
- **Parent overview endpoint** `/api/parent/overview/` — source for the dashboard (#93, #95).
- **CSV / PDF exports** — session-history exports aggregating on `Attempt.skill_id`. Shape-independent of the M2M refactor.
- **Parent ↔ Student ownership scoping** — `User` (AUTH_USER_MODEL) owns one or more `Student` profiles; all student-facing endpoints enforce ownership via `apps/common` permissions.
- **Auth** — session-based (SessionAuthentication) with CSRF; Google OAuth via dj-rest-auth + allauth.
- **Rate limiting on `/api/auth/*`** — app-layer throttling (#99, #118).

## Ops-adjacent

- **Nightly encrypted Postgres backups** to Hetzner Storage Box (#64, #107). Schema-shape-independent.
- **Two-image production deploy** (`pedagogia-backend` + `pedagogia-frontend`) on [[entities/collegia-be]], see [[concepts/prod-stack]].

## See also

- [[overview]] — top-level project synthesis
- [[concepts/champ-3-arithmetique]] — POC skill scope
- [[concepts/mastery-learning]] — theory behind StudentSkillState
- [[concepts/prod-stack]] — production topology
- [[questions/nouveaux-types-exercices-ceb]] — planned exercise-type additions not yet shipped
