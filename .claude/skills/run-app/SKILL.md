---
name: run-app
description: Start, stop, inspect, or reset the PedagogIA dev stack (Postgres + Django + Vite) via docker compose. Use this skill whenever the user asks to "run the app", "start the stack", "lancer / démarrer l'app", "boot the dev servers", "open the app", "stop the app", "tail logs", or "reset the DB / reseed" — even if they don't say "docker" out loud. Also use it whenever work happens inside a `.claude/worktrees/<name>/` worktree: parallel instances MUST run on shifted ports with suffixed cookies, and this skill encodes the convention so two worktrees don't fight over 5173/8000/5411 or overwrite each other's session cookie in the browser. Also worth using proactively before a manual-testing session ("check this PR in the browser", "let me click through the flow"). This skill exists because (a) running Django directly on the host silently breaks the Vite → backend proxy (502s on login / OAuth / submit), and (b) booting a second instance with the default `.env` collides with the one already running.
---

# Running the PedagogIA dev stack

Three moving parts — **Postgres**, **Django + gunicorn** (reloader on in dev), **Vite** — wired together by the `docker-compose.yml` at the repo root. Always treat them as one unit.

## Two things that go wrong if you skip this skill

1. **Host-mode Django shadows the container.** The Vite container's proxy (`frontend/vite.config.js`) points `/api` at `http://backend:8000` — a **docker DNS name**, resolvable only from inside the compose network. A host-run `manage.py runserver` yields 502s on every API call ("Échec de la connexion Google", logins fail, exercises won't submit).
2. **Two instances collide.** The main repo and every worktree all reference the same `docker-compose.yml`. Without per-instance `.env`, both try to bind `5173/8000/5411` and both write the cookie `sessionid` on `localhost` — so logging in on one instance logs you out of the other. The fix is shifted ports **and** suffixed cookie names, not just one or the other.

Keep everything inside compose, one `.env` per checkout, and this entire class of bug disappears.

## Operations

Run all commands from the directory containing `docker-compose.yml` (the repo root, or the worktree root if you're in one — each worktree has its own copy). Prefer compose service names (`backend`, `db`, `frontend`) over raw container names so the skill is portable across Compose v1/v2 naming conventions. The compose project name auto-derives from the directory name, so `.claude/worktrees/exercises/` runs as project `exercises` with containers `exercises_backend_1` etc. — that already isolates containers and volumes between checkouts; the `.env` just handles the parts Docker can't (host ports, browser cookies).

### Before starting — probe for collisions

Always run this first. It takes a second and tells you whether you need a fresh `.env`.

```bash
# What compose projects are currently up on this machine?
docker compose ls

# What's claiming the default triple?
for p in 5173 8000 5411; do lsof -nP -iTCP:$p -sTCP:LISTEN 2>/dev/null | tail -n +2; done
```

Decision tree:
- **No other project is up, no listener on the default ports, and the current directory is the repo root** → use the default `.env` (copy from `.env.example` if missing) and skip to "Start the stack".
- **Another compose project is already up, OR you're inside a `.claude/worktrees/<name>/` checkout** → make sure the current directory has its own `.env` with a shifted port triple and suffixed cookies (see next section), then start.

### Parallel instances: shifted ports + suffixed cookies

Each checkout that needs to run concurrently must have a `.env` file with these fields overridden. Port shifts should be consistent — all three ports offset by the same `N` — so there's one mental number per instance. Cookie name suffixes must be unique per instance so the browser keeps sessions separate when you have multiple instances open in different tabs.

**Allocation convention** (as of this writing):

| Instance | PG | Backend | Frontend | Cookie suffix |
|---|---|---|---|---|
| main repo (`/PedagogIA/`) | 5411 | 8000 | 5173 | *(none)* |
| `worktrees/exercises/` | 5412 | 8001 | 5174 | `_ex` |
| `worktrees/exam/` | 5413 | 8002 | 5175 | `_exam` |

To add a new instance, run the bundled helper — it scans existing `.env` files, picks the next free offset, copies the main repo's `.env` (so secrets stay in place), and rewrites the six per-instance fields plus the derived URLs (`DATABASE_URL`, `CORS_ORIGINS`, `VITE_API_URL`, OAuth callbacks):

```bash
# From the checkout that needs its own .env (a worktree, or the main repo after a reset):
"$(git rev-parse --git-common-dir)/../.claude/skills/run-app/scripts/new-instance.sh"

# Refuses to clobber an existing .env unless you pass --force.
```

It prints the chosen offset `N`, the three ports, and the cookie suffix (derived from the directory name — `_exercises`, `_exam`, etc.). If you need to inspect what offsets are already taken without writing anything:

```bash
for f in "$(git rev-parse --git-common-dir)/.."/.env \
         "$(git rev-parse --git-common-dir)/.."/.claude/worktrees/*/.env; do
  [ -f "$f" ] && echo "== $f ==" && grep -E "_PORT|COOKIE_NAME" "$f"
done
```

If you're writing a `.env` by hand instead (because the script is unavailable or you want a custom suffix), the minimum overrides vs. the main `.env` are:

```dotenv
POSTGRES_PORT=<5411 + N>
BACKEND_PORT=<8000 + N>
FRONTEND_PORT=<5173 + N>
DATABASE_URL=postgresql://ceb:ceb@localhost:<5411 + N>/ceb
CORS_ORIGINS=["http://localhost:<5173 + N>"]
VITE_API_URL=http://localhost:<8000 + N>
GOOGLE_OAUTH_CALLBACK_URL=http://localhost:<5173 + N>/auth/google/callback
VITE_GOOGLE_OAUTH_CALLBACK_URL=http://localhost:<5173 + N>/auth/google/callback
VITE_CSRF_COOKIE_NAME=csrftoken_<suffix>
SESSION_COOKIE_NAME=sessionid_<suffix>
CSRF_COOKIE_NAME=csrftoken_<suffix>
```

All three cookie names matter: `CSRF_COOKIE_NAME` is Django's outgoing cookie, `SESSION_COOKIE_NAME` is Django's session cookie, `VITE_CSRF_COOKIE_NAME` is what the frontend reads back before mutating requests. Suffix all three or CSRF verification will fail in confusing ways. The OAuth callback URLs must also shift, otherwise Google redirects back to a port nothing is listening on — and the URL has to be registered in Google Cloud Console, so in practice most dev uses a single-instance allowlist and OAuth only works on the main repo's instance.

### Start the stack

```bash
# Kill any stray host-run Django that would shadow the container.
pkill -f "manage.py runserver" 2>/dev/null || true

# Boot the stack.
docker compose up -d
```

`--wait` is not supported on every Compose version the team uses — don't rely on it. Poll `/api/health/` instead, using the port from the local `.env`:

```bash
# Read the port this checkout is configured for.
set -a; . ./.env; set +a

# Wait for backend to report healthy (start.sh runs migrations + seed_skills + seed_templates first).
for i in {1..30}; do
  code=$(curl -sS -o /dev/null -w "%{http_code}" "http://localhost:${BACKEND_PORT}/api/health/" 2>/dev/null)
  [ "$code" = "200" ] && break
  sleep 2
done

# Verify both surfaces.
curl -sS -o /dev/null -w "backend=%{http_code}\n"  "http://localhost:${BACKEND_PORT}/api/health/"
curl -sS -o /dev/null -w "frontend=%{http_code}\n" "http://localhost:${FRONTEND_PORT}/"
```

Expect `backend=200` and `frontend=200`. Print the URLs back to the user using the values from `.env` (don't hardcode — the whole point of this skill is that ports vary per instance):

- **http://localhost:${FRONTEND_PORT}** — student-facing app (Vite dev server, HMR on)
- **http://localhost:${BACKEND_PORT}/api/** — DRF API root
- **http://localhost:${BACKEND_PORT}/api/docs/** — Swagger (drf-spectacular)
- **http://localhost:${BACKEND_PORT}/admin/** — Django admin
- **localhost:${POSTGRES_PORT}** — Postgres (user/password `ceb`/`ceb`, db `ceb`)

### Stop the stack

```bash
docker compose down
```

Preserves the `pgdata` volume — users, students, attempts, and mastery state all survive. Good default for end-of-session or branch switches. Each project has its own volume, so stopping one instance does not affect others.

### Nuke + rebuild (DB schema out of sync)

Trigger this path when:
- migrations have been rewritten on a branch you just pulled,
- the backend fails to start with `Related model 'X.Y' cannot be resolved`,
- the user says "the DB is broken / drop everything",
- tables exist with stale names (e.g. `accounts_parent` after a rename refactor).

```bash
docker compose down -v   # -v wipes this project's pgdata volume (not other instances')
docker compose up -d
```

`start.sh` re-migrates and re-seeds on the fresh DB; expect roughly 110 skills and 157 exercise templates to land.

This is destructive — all local test data for **this instance** goes. Confirm with the user before running it unless they explicitly asked for a reset.

### Reset DB only (containers stay up)

Faster when containers are healthy and only the data is stale:

```bash
docker compose exec db psql -U ceb -d postgres -c "DROP DATABASE ceb;"
docker compose exec db psql -U ceb -d postgres -c "CREATE DATABASE ceb OWNER ceb;"
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py seed_skills
docker compose exec backend python manage.py seed_templates
```

The gunicorn reloader may need a nudge to reconnect cleanly — if queries 500 after reset, `docker compose restart backend`.

### Tail logs

```bash
# All services, follow mode, last 100 lines
docker compose logs -f --tail 100

# One service at a time (most common while debugging)
docker compose logs -f --tail 100 backend
docker compose logs -f --tail 100 frontend
docker compose logs -f --tail 100 db
```

`-f` blocks the shell, so launch it with `run_in_background: true` (the Bash tool flag) and tell the user you'll monitor output. Stop the tail when they're done investigating.

### Status at a glance

```bash
docker compose ps           # this project
docker compose ls           # all projects on the machine (useful when debugging port collisions)
```

## Troubleshooting quick reference

- **502 on `/api/...`, OAuth fails** — backend container isn't healthy, or a host Django is racing it. `pkill -f "manage.py runserver"`, then `docker compose up -d backend` and wait on `/api/health/`.
- **"bind: address already in use" on boot** — another compose project already owns that port. `docker compose ls` to find it, then either stop it or shift this instance's `.env` to a free port triple (see "Parallel instances" above).
- **Logging into one instance logs you out of another** — cookie names weren't suffixed. Check `VITE_CSRF_COOKIE_NAME` / `SESSION_COOKIE_NAME` / `CSRF_COOKIE_NAME` in the `.env`; all three must be suffixed, and the suffix must differ from every other running instance. Restart the backend + frontend after changing these.
- **CSRF failures after adding a new instance** — usually one of the three cookie envs was missed. The frontend reads `VITE_CSRF_COOKIE_NAME`; Django writes `CSRF_COOKIE_NAME`. They must refer to the same cookie.
- **Backend boot loops on a stale ImportError** — the reloader is caching a dead module. `docker compose restart backend`.
- **`VITE_API_PROXY_TARGET` unexpectedly points somewhere other than `http://backend:8000`** — check `.env` and `docker-compose.yml`. The in-compose target is always `http://backend:8000` regardless of the host-side `BACKEND_PORT`; only the host-exposed port shifts.

## When it is OK to bypass docker

`docker compose exec backend python manage.py <cmd>` for one-off Django commands is fine (and preferred) — `shell`, `makemigrations`, `dbshell`, etc. Host-mode `uv run python manage.py <cmd>` is also fine for pure-Python work that never serves HTTP: running the test suite, ruff, generating migrations. Just don't run `runserver` on the host while the user is clicking around in the browser.
