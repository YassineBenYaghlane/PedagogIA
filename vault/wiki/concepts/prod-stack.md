---
title: Production stack
type: concept
created: 2026-04-17
updated: 2026-04-17
sources: []
tags: [infra, deployment, docker, security]
---

How PedagogIA runs in production. Answers *"how is prod wired?"* without re-reading the Dockerfiles. Live instance: [[entities/collegia-be]]. Full repo-side map: `docs/architecture.md`.

## Shape

Two-image split on a single small VPS, everything inside Docker, Caddy in front.

```
Internet ──443/80─▶ frontend (Caddy)  ──internal:8000─▶ backend (Gunicorn)
                        │                                  │
                        │ serves SPA via try_files         │ Django
                        │ reverse-proxies /api /admin      │ DRF + dj-rest-auth
                        │ Let's Encrypt TLS                │
                        └────────────────────┐             │
                                             ▼             ▼
                                          db (postgres:16, internal only)
```

- **`pedagogia-frontend`** — `caddy:2-alpine` with the Vite build baked into `/srv` + `prod/Caddyfile` at `/etc/caddy/Caddyfile`. Owns TLS (ACME via tls-alpn-01), HSTS, security headers, SPA `try_files {path} /index.html`, reverse_proxy of `/api/*` + `/admin/*` + `/static/*` → `backend:8000`. Only service with host ports (80, 443/tcp, 443/udp).
- **`pedagogia-backend`** — `python:3.12-slim` + `uv`, Django + Gunicorn (3 workers, sync), non-root `app` uid 1000, `no-new-privileges`, runs `backend/start.sh` (which does `migrate` + `collectstatic` + `seed_skills` + `seed_templates` then `exec gunicorn`).
- **`db`** — `postgres:16-alpine`, internal-only (no host port). Named volume `pgdata` on the host.

All three share one docker bridge network (`backend_net`). Every service has `env_file: .env.prod` so there's no `--env-file` flag on CLI commands.

## Why two images, not one

Rejected designs:

- Single image where Django+WhiteNoise serves both API and SPA. Needed a Django SPA-fallback view to make deep links refresh without 404s — coupling the frontend routes to a Django URL pattern. Rejected: messy boundary.
- Separate Caddy container as a pure proxy, with the SPA dist shared from the backend image via a volume. Rejected: volume seeding only works on first attach, so deploys wouldn't refresh the dist without wiping the volume.

Current split (frontend image = Caddy + dist) puts SPA routing where it belongs (Caddy), keeps backend purely an API, and both images are independently versioned and immutable.

## CI/CD

- `.github/workflows/ci.yml` — PR + push to main: backend `ruff` + `pytest` (against a real Postgres 16 service), frontend `eslint` + `vite build`.
- `.github/workflows/deploy.yml` — push to main: matrix-build both images, push `:latest` + `:sha-<commit>` to GHCR, SSH to server, `docker compose pull && up -d --remove-orphans && image prune -f`, smoke-check `/api/health/` via HTTPS.
- Third-party actions **pinned by commit SHA** (Dependabot bumps them safely). Only `GITHUB_TOKEN` (ephemeral, scoped `packages: write`) pushes to GHCR — no long-lived PAT.
- GH secrets: `SSH_HOST`, `SSH_USER`, `SSH_PRIVATE_KEY`, `DOMAIN`.

## Server baseline

- Hetzner cx23 (cost_optimized, 2c/4GB/40GB, €3.99/mo) in `nbg1`, Ubuntu 24.04.
- Hetzner firewall: 22, 80, 443, ICMP only. Everything else denied at network boundary.
- SSH: key-only, root login disabled, password auth disabled.
- `pedagogia` user (uid 1000) owns `/opt/pedagogia/`; member of `docker` group.
- `fail2ban` + `unattended-upgrades` enabled.
- Server holds only two mutable files: `/opt/pedagogia/docker-compose.prod.yml` + `/opt/pedagogia/.env.prod` (chmod 600). No source code, no secrets in git.

## Security baseline

- **TLS**: Caddy auto-obtains and auto-renews Let's Encrypt certs (tls-alpn-01). `www.<domain>` 308 → apex.
- **Headers** (Caddy): HSTS 1y + preload, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: same-origin`, `Permissions-Policy` denies camera/mic/geolocation/FLoC, `Cross-Origin-Opener-Policy: same-origin`, `Server` stripped.
- **Django** (`backend/pedagogia/settings/prod.py`): `DEBUG=False`, required secrets validated at boot, `ALLOWED_HOSTS` scoped (domain + `localhost` for in-container healthcheck), `CSRF_TRUSTED_ORIGINS` scoped, `SESSION_COOKIE_SECURE`, `CSRF_COOKIE_SECURE`, `SESSION_COOKIE_HTTPONLY`, `SameSite=Lax`, `X_FRAME_OPTIONS=DENY`, `SECURE_PROXY_SSL_HEADER=("HTTP_X_FORWARDED_PROTO","https")`. Gunicorn trusts forwarded headers only from localhost (narrow default).
- **Containers**: non-root (uid 1000), `no-new-privileges:true`, no privileged mode, read-only where feasible.
- **Secrets**: generated per-env (`secrets.token_urlsafe(64)` for Django, `openssl rand -base64 32` for Postgres), never in git, `.env.prod` chmod 600 on the server, zero secrets baked into images.

## Out of scope (follow-ups)

Automated Postgres backups, staging environment, Sentry, UptimeRobot, Cloudflare (origin hiding + DDoS + CDN), rate limiting on `/api/auth/login`, email verification before real users, blue/green deploys. All are single-PR additions once the POC validates.

## Common ops

Mutating prod is rare (the pipeline does it); when you need to, SSH as `pedagogia@<server>` and `cd /opt/pedagogia`. To pick up new `.env.prod` values: `docker compose -f docker-compose.prod.yml up -d --force-recreate <service>` (`restart` alone doesn't re-read `env_file`). To wipe state: `docker compose down -v` (destroys `pgdata` — only after backing up).

## See also

- [[entities/collegia-be]] — the live production deployment
- [[overview]] — top-level project synthesis
