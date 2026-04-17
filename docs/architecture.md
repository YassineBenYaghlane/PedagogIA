# Architecture

High-level map of PedagogIA in dev and in prod. Updated 2026-04-17.

## Product recap

- French-language adaptive math for FWB students (P1–P6, Champ 3 arithmétique in the POC).
- A **User** owns one or more **Student** profiles. The student picks their profile and learns via three modes: *diagnostic*, *drill* (targeted practice), *free practice* (spaced-repetition over the skill tree).
- Wrong answers trigger an **AI investigation** (Claude API) that reasons over the skill tree + mastery state to pick the next probe.

## Dev stack

```
┌──────────┐      ┌──────────┐      ┌──────────┐
│ :5173    │      │ :8000    │      │ :5411    │
│ frontend │─────▶│ backend  │─────▶│ db       │
│ Vite dev │      │ Django   │      │ postgres │
│          │ /api │ runserver│      │ 16-alpine│
└──────────┘      └──────────┘      └──────────┘
   bind-mount       bind-mount        pgdata vol
   ./frontend       ./backend
```

- `docker-compose.yml` at repo root. `.env` at repo root.
- Vite dev server proxies `/api` to `http://backend:8000` via `VITE_API_PROXY_TARGET`.
- Source is bind-mounted for hot reload.
- Backend entrypoint is `backend/start.sh` which runs `migrate` + `collectstatic` + `seed_skills` + `seed_templates` then branches on `DJANGO_DEV_SERVER` for `runserver` vs `gunicorn`.

## Prod stack — `collegia.be`

```
Internet
   │
   ▼ 80/443 (only ports open on Hetzner firewall)
┌────────────────────┐
│ frontend container │  Caddy 2-alpine
│ (Let's Encrypt TLS)│  - serves SPA from /srv
│                    │  - try_files {path} /index.html  (SPA deep links)
│                    │  - reverse_proxy /api/* /admin/* /static/* → backend:8000
└─────────┬──────────┘
          │ docker bridge (backend_net)
   ┌──────┴───────┐
   ▼              ▼
┌──────────┐  ┌──────────┐
│ backend  │  │   db     │
│ Django + │  │ postgres │
│ Gunicorn │  │ 16-alpine│
│ uid 1000 │  │ internal │
│ :8000    │  │ only     │
└──────────┘  └──────────┘
              pgdata vol (host)
```

### Host (Hetzner cx23, Ubuntu 24.04, `nbg1`)

- One VPS: `46.225.142.212` / `2a01:4f8:c0c:1dbf::1`, €3.99/mo.
- SSH on 22 is key-only (root disabled, passwords disabled).
- `pedagogia` user owns `/opt/pedagogia/`; in the `docker` group.
- `fail2ban` + `unattended-upgrades` enabled.
- Hetzner firewall allows 22/80/443/ICMP; everything else denied.
- Server only holds two mutable files: `/opt/pedagogia/docker-compose.prod.yml` and `/opt/pedagogia/.env.prod` (chmod 600). No source code; no secrets in git.

### Images (two, both built in CI, pushed to GHCR, public)

- `ghcr.io/yassinebenyaghlane/pedagogia-backend` — `prod/backend.Dockerfile`
  Python 3.12 slim + uv, Django + Gunicorn (3 workers), non-root `app` uid 1000, `no-new-privileges`. Runs `backend/start.sh`.
- `ghcr.io/yassinebenyaghlane/pedagogia-frontend` — `prod/frontend.Dockerfile`
  Multi-stage: `node:22-alpine` builds the Vite bundle → `caddy:2-alpine` with the `dist/` in `/srv` and `prod/Caddyfile` baked at `/etc/caddy/Caddyfile`. Caddy handles TLS (ACME), HSTS, security headers, SPA fallback, and reverse proxy.

Both images tagged `:latest` and `:sha-<commit>` on every push to `main`. Compose on the server pulls `:latest`.

### Compose — `prod/docker-compose.prod.yml`

Three services (`db`, `backend`, `frontend`), one bridge network (`backend_net`), three named volumes (`pgdata`, `caddy_data`, `caddy_config`). Every service has `env_file: .env.prod` — no `--env-file` flag on the CLI.

- `db`: no host port (reachable only from `backend_net`).
- `backend`: no host port either; `frontend` reverse-proxies to `backend:8000` inside the network.
- `frontend`: the only service with host ports (`80`, `443/tcp`, `443/udp` for HTTP/3).

### Traffic flow

1. Browser → `https://collegia.be/` → Caddy terminates TLS.
2. If path matches `/api/*`, `/admin/*`, `/static/*` → reverse-proxy to `backend:8000`.
3. Otherwise → serve static file from `/srv`, falling back to `/index.html` for SPA routes.
4. Django reads `X-Forwarded-Proto` via `SECURE_PROXY_SSL_HEADER` to know the scheme; issues secure cookies.

### Security baseline

- TLS: Let's Encrypt via Caddy (tls-alpn-01), auto-renewed. www.collegia.be 308 → apex.
- Caddy headers: HSTS 1y + preload, X-Frame DENY, X-Content-Type-Options nosniff, Referrer-Policy same-origin, Permissions-Policy denies camera/mic/geo/FLoC, Cross-Origin-Opener-Policy same-origin, `Server` stripped.
- Django (`backend/pedagogia/settings/prod.py`): `DEBUG=False`, required secrets validated at boot, `ALLOWED_HOSTS` scoped, `CSRF_TRUSTED_ORIGINS` scoped, `SESSION_COOKIE_SECURE` + `CSRF_COOKIE_SECURE` + `SameSite=Lax`, `SESSION_COOKIE_HTTPONLY`, `X_FRAME_OPTIONS=DENY`.
- Containers: non-root, `no-new-privileges:true`, no privileged mode.
- Secrets: generated fresh per env, never in git, `.env.prod` chmod 600, GHCR image contains zero secrets (everything from runtime env).

### CI/CD

- `.github/workflows/ci.yml` — on every PR + push to main: backend `ruff` + `pytest` (against a Postgres 16 service), frontend `eslint` + `vite build`.
- `.github/workflows/deploy.yml` — on push to main: matrix-build both images, push to GHCR, SSH to server, `docker compose pull && up -d --remove-orphans && image prune -f`, smoke-check `/api/health/`.
- All third-party actions pinned by commit SHA. Only `GITHUB_TOKEN` (ephemeral) is used to push to GHCR.
- GitHub secrets required: `SSH_HOST`, `SSH_USER`, `SSH_PRIVATE_KEY`, `DOMAIN`. No long-lived PATs.

### Bootstrapping a new server

See `prod/bootstrap.md`. Short version: `scp prod/docker-compose.prod.yml` to `/opt/pedagogia/`, write `.env.prod` from `prod/.env.prod.example`, `docker compose up -d`. First request to `https://<domain>/` triggers Caddy's ACME flow — make sure DNS points to the box beforehand.

## Data model (core tables)

```
accounts_user ──┐
                ├─ students_student ──┬─ sessions_session ── exercises_attempt
                                      │
                              skills_skill ─── skills_skillprerequisite
                                 │
                              exercises_exercisetemplate (JSONB params)
```

- Skill tree authored in `backend/src/skill_tree/skills.yaml`, seeded into DB.
- Exercise templates authored in `backend/src/skill_tree/exercise_templates_p{1..6}.yaml`, stored as JSONB, instantiated at runtime.
- Attempts link to a student + session + skill + template.

## Dependencies on external services

| Service | Purpose | Where configured |
|---|---|---|
| Anthropic Claude API | AI investigation on wrong answers | `ANTHROPIC_API_KEY`, `INVESTIGATION_MODEL_*` in `.env.prod` |
| Google OAuth | social login | `GOOGLE_CLIENT_ID/SECRET` in `.env.prod`, redirect URI must be authorized in Google Console |
| Let's Encrypt | TLS certs | Caddy owns this, `CADDY_EMAIL` in `.env.prod` |
| GHCR | container registry | public packages, no pull auth on the server |

## Out of scope of the POC architecture

Automated DB backups, staging environment, blue/green deploys, Sentry, UptimeRobot, Cloudflare. All are single-PR additions later.
