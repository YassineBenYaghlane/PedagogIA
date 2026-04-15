---
name: run-app
description: Start, stop, inspect, or reset the PedagogIA dev stack (Postgres + Django + Vite) via docker compose. Use this skill whenever the user asks to "run the app", "start the stack", "lancer / démarrer l'app", "boot the dev servers", "open the app", "stop the app", "tail logs", or "reset the DB / reseed" — even if they don't say "docker" out loud. Also worth using proactively before a manual-testing session ("check this PR in the browser", "let me click through the flow"), so the environment is in a known-good state before the user switches windows. This skill exists because running Django directly on the host (e.g. `uv run python manage.py runserver`) silently breaks the frontend: the Vite container proxies `/api` to `http://backend:8000` over the docker network, so a host-mode backend yields 502s on login / Google OAuth / attempt submission. Defaulting to docker compose prevents that entire class of confusion.
---

# Running the PedagogIA dev stack

Three moving parts — **Postgres**, **Django + gunicorn** (reloader on in dev), **Vite** — wired together by the `docker-compose.yml` at the repo root. Always treat them as one unit.

## Why docker-only

The frontend container's Vite proxy (see `frontend/vite.config.js`) points `/api` at `http://backend:8000`, which is the **docker DNS name** — resolvable only from inside the compose network. If Django runs on the host, the proxy target resolves to nothing (or a stale stopped container) and the browser gets **502 Bad Gateway** on every API call. Symptoms the user will report: "Échec de la connexion Google", logins fail, exercises won't submit.

Keep everything inside compose and this class of bug disappears.

## Operations

Run all commands from the repo root (the directory containing `docker-compose.yml`). Prefer compose service names (`backend`, `db`, `frontend`) over raw container names so the skill is portable across Compose v1/v2 naming conventions.

### Start the stack

```bash
# Kill any stray host-run Django that would shadow the container.
pkill -f "manage.py runserver" 2>/dev/null || true

# Boot the stack and wait for healthchecks to pass (Compose v2 native).
docker compose up -d --wait
```

`--wait` blocks until every service with a healthcheck reports healthy. The backend image's `start.sh` runs migrations + `seed_skills` + `seed_templates` on boot, then starts gunicorn; its healthcheck hits `/api/health/`. Vite is ready the moment its container is Up (no healthcheck).

Then verify from the host and print the URLs:

```bash
curl -sS -o /dev/null -w "backend=%{http_code}\n" http://localhost:8000/api/health/
curl -sS -o /dev/null -w "frontend=%{http_code}\n" http://localhost:5173/
```

Expect `backend=200` and `frontend=200`. URLs the user should know:

- **http://localhost:5173** — student-facing app (Vite dev server, HMR on)
- **http://localhost:8000/api/** — DRF API root
- **http://localhost:8000/api/docs/** — Swagger (drf-spectacular)
- **http://localhost:8000/admin/** — Django admin
- **localhost:5411** — Postgres (user/password `ceb`/`ceb`, db `ceb`)

### Stop the stack

```bash
docker compose down
```

Preserves the `pgdata` volume — users, students, attempts, and mastery state all survive. Good default for end-of-session or branch switches.

### Nuke + rebuild (DB schema out of sync)

Trigger this path when:
- migrations have been rewritten on a branch you just pulled,
- the model fails to start with `Related model 'X.Y' cannot be resolved`,
- the user says "the DB is broken / drop everything",
- tables exist with stale names (e.g. `accounts_parent` after a rename refactor).

```bash
docker compose down -v   # -v wipes the pgdata volume
docker compose up -d --wait
```

`start.sh` re-migrates and re-seeds on the fresh DB; expect roughly 110 skills and 117 exercise templates to land.

This is destructive — all local test data goes. Confirm with the user before running it unless they explicitly asked for a reset.

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
docker compose ps
```

## Troubleshooting quick reference

- **502 on `/api/...`, OAuth fails** — backend container isn't healthy, or a host Django is racing it. `pkill -f "manage.py runserver"`, then `docker compose up -d --wait backend`.
- **Port 5173 / 8000 / 5411 already in use** — something on the host owns it. `lsof -iTCP:5173 -sTCP:LISTEN` to identify before killing. Don't kill silently; ask the user.
- **Backend boot loops on a stale ImportError** — the reloader is caching a dead module. `docker compose restart backend`.
- **`VITE_API_PROXY_TARGET` unexpectedly points somewhere other than `http://backend:8000`** — check `.env` and `docker-compose.yml`. The docker-DNS name is what makes the proxy work.

## When it is OK to bypass docker

`docker compose exec backend python manage.py <cmd>` for one-off Django commands is fine (and preferred) — `shell`, `makemigrations`, `dbshell`, etc. Host-mode `uv run python manage.py <cmd>` is also fine for pure-Python work that never serves HTTP: running the test suite, ruff, generating migrations. Just don't run `runserver` on the host while the user is clicking around in the browser.
