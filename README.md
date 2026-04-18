# PedagogIA

French-language adaptive math learning for Belgian FWB students (P1–P6). A parent account owns one or more student profiles; each student learns through diagnostic, drill, and free-practice modes, backed by a skill-tree DAG and AI-driven investigation of wrong answers.

- Live: <https://collegia.be>
- Project conventions: [`CLAUDE.md`](CLAUDE.md)
- Runtime & deploy architecture: [`docs/architecture.md`](docs/architecture.md)
- Production ops: [`prod/bootstrap.md`](prod/bootstrap.md)

## Quickstart

```bash
docker compose up -d          # Postgres + Django + Vite
open http://localhost:5173
```

Backend on `:8000` (Django + DRF), frontend on `:5173` (Vite), Postgres on `:5411`. API docs at `/api/docs/`.

See [`CLAUDE.md`](CLAUDE.md) for full command reference (tests, lint, seed, etc.).

## Database schema

PostgreSQL 16. Tables are grouped by Django app; app label differs from module name for `sessions` (Django label is `learning_sessions` to avoid colliding with `django.contrib.sessions`).

```mermaid
erDiagram
    accounts_user ||--o{ students_student : owns
    students_student ||--o{ students_studentskillstate : "mastery per skill"
    students_student ||--o{ students_studentachievement : earns
    students_student ||--o{ learning_sessions_session : plays
    learning_sessions_session ||--o{ exercises_attempt : records
    skills_skill ||--o{ skills_skillprerequisite : "is dependent"
    skills_skill ||--o{ skills_skillprerequisite : "is prerequisite"
    skills_skill ||--o{ exercises_exercisetemplate : "has templates"
    skills_skill ||--o{ students_studentskillstate : tracked
    skills_skill ||--o{ exercises_attempt : targeted
    exercises_exercisetemplate ||--o{ exercises_attempt : instantiated
```

### `accounts_user` — parent account (AUTH_USER_MODEL)

| Column | Type | Notes |
|---|---|---|
| `id` | bigserial PK | |
| `email` | varchar, unique | login identifier |
| `display_name` | varchar(100) | |
| `password` | varchar | Django-hashed |
| `is_active`, `is_staff`, `is_superuser` | bool | |
| `date_joined`, `last_login` | timestamptz | |

### `students_student` — child profile scoped to a parent

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | FK → `accounts_user` ON DELETE CASCADE | |
| `display_name` | varchar(100) | |
| `grade` | varchar(2) | `P1`…`P6` |
| `created_at` | timestamptz | |
| `xp` | int ≥ 0 | gamification |
| `rank` | varchar(24) | default `curieux` |
| `current_streak`, `best_streak` | int ≥ 0 | |
| `last_activity_date` | date, null | |
| `daily_goal` | smallint ≥ 0 | default 5 |

### `students_studentskillstate` — per-student mastery + SRS state

| Column | Type | Notes |
|---|---|---|
| `id` | bigserial PK | |
| `student_id` | FK → `students_student` CASCADE | |
| `skill_id` | FK → `skills_skill` CASCADE | |
| `status` | varchar(16) | `not_started` / `in_progress` / `mastered` / `needs_review` |
| `mastery_level` | float | 0.0–1.0 |
| `consecutive_correct`, `total_attempts` | int ≥ 0 | |
| `last_practiced_at`, `next_review_at` | timestamptz, null | spaced-repetition schedule |
| `review_interval_hours` | int ≥ 0 | default 24 |
| `updated_at` | timestamptz | |

Unique `(student_id, skill_id)`.

### `students_studentachievement` — badges / milestones

| Column | Type | Notes |
|---|---|---|
| `id` | bigserial PK | |
| `student_id` | FK → `students_student` CASCADE | |
| `code` | varchar(48) | achievement identifier |
| `earned_at` | timestamptz | |
| `context` | jsonb | free-form payload |

Unique `(student_id, code)`.

### `skills_skill` — curriculum node (authored in `backend/src/skill_tree/skills.yaml`)

| Column | Type | Notes |
|---|---|---|
| `id` | varchar(80) PK | YAML slug, e.g. `ADD-01` |
| `label` | varchar(200) | French display name |
| `grade` | varchar(4) | `P1`…`P6` |
| `description` | text | |
| `mastery_threshold` | smallint | default 3 |

### `skills_skillprerequisite` — DAG edges between skills

| Column | Type | Notes |
|---|---|---|
| `id` | bigserial PK | |
| `skill_id` | FK → `skills_skill` CASCADE | |
| `prerequisite_id` | FK → `skills_skill` CASCADE | |

Unique `(skill_id, prerequisite_id)`. Check `skill_id ≠ prerequisite_id`.

### `exercises_exercisetemplate` — parametric exercise authored in YAML

| Column | Type | Notes |
|---|---|---|
| `id` | varchar(120) PK | YAML slug |
| `skill_id` | FK → `skills_skill` CASCADE | **primary skill drilled** |
| `difficulty` | smallint | check 1–3 |
| `input_type` | varchar(20) | `number` / `mcq` / `symbol` / `decomposition` / `point_on_line` / `drag_order` |
| `template` | jsonb | parameter ranges + answer shape |

### `exercises_attempt` — one student answer to one instantiated exercise

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `session_id` | FK → `learning_sessions_session` CASCADE | |
| `skill_id` | FK → `skills_skill` PROTECT | skill the attempt targeted |
| `template_id` | FK → `exercises_exercisetemplate` PROTECT | |
| `input_type` | varchar(20) | snapshotted from template |
| `exercise_params` | jsonb | concrete params used at instantiation |
| `student_answer`, `correct_answer` | varchar(200) | |
| `is_correct` | bool | |
| `responded_at` | timestamptz | `auto_now_add` |

PROTECT on `skill_id` / `template_id` preserves attempt history even if a skill or template is removed.

### `learning_sessions_session` — wraps a contiguous series of attempts

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `student_id` | FK → `students_student` CASCADE | |
| `mode` | varchar(20) | `learn` / `diagnostic` / `drill` / `exam` |
| `started_at` | timestamptz | |
| `ended_at` | timestamptz, null | |

## Notes for contributors

- Skills and exercise templates live in YAML (`backend/src/skill_tree/`) and are seeded via `seed_skills` + `seed_templates`. Edit YAML, then re-seed — never hand-edit the DB.
- `Student` profiles are always scoped to their owning `User`; all student-facing endpoints enforce ownership via `common.permissions.IsParentOwner`.
- Session authentication + CSRF. Frontend calls `/api/csrf/` before any mutating request.
