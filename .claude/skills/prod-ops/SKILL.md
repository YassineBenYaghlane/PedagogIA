---
name: prod-ops
description: Operate the collegia.be production stack — SSH into the server, tail prod logs, redeploy, restart a service, edit .env.prod, investigate a prod incident, roll back a bad deploy, or bootstrap a new VPS. Use this skill whenever the user mentions "prod", "production", "collegia.be", "the server", "deploy / redeploy / rollback", "prod logs", "check the stack", "the VPS", "Hetzner", "Caddy", "GHCR", or any variant in French ("la prod", "le serveur", "les logs", "redéployer"). Also worth using proactively when a GitHub Actions deploy run is failing, when a user-facing bug that might be prod-specific is reported, or before landing an infra PR. This is NOT the skill for the dev stack — that's `run-app`. The reason this skill exists: prod is shared state with real users; the ops flow has a few non-obvious gotchas (env_file semantics, GHCR visibility, Caddy cert dance) that waste time if rediscovered every session.
---

# Prod ops — `collegia.be`

Pointer skill, not a textbook. The full architecture lives in `docs/architecture.md` and the concept page `vault/wiki/concepts/prod-stack.md`. The first-time server setup is in `prod/bootstrap.md`. **Read those first** if you need to understand *why* something is the shape it is — this file covers *how to touch it* day-to-day.

## The shape, in one paragraph

One Hetzner cx23 at `46.225.142.212` (DNS `collegia.be`), Ubuntu 24.04. Three docker containers: `db` (internal postgres:16-alpine), `backend` (Django + Gunicorn, image `ghcr.io/yassinebenyaghlane/pedagogia-backend:latest`), `frontend` (Caddy + Vite build baked in, image `ghcr.io/yassinebenyaghlane/pedagogia-frontend:latest`, the only one with host ports 80/443). Compose file on the server: `/opt/pedagogia/docker-compose.prod.yml`. Secrets on the server: `/opt/pedagogia/.env.prod` (chmod 600, never in git). Everything else — source code, Caddyfile, Dockerfiles — lives in the repo only, baked into the images at build time. Deploys are fully automated: push to `main` → GH Actions builds both images → pushes to GHCR → SSHes in → `docker compose pull && up -d --remove-orphans`. You rarely need to touch the server by hand; when you do, SSH as `pedagogia` (uid 1000, non-root, docker group). Root login and password auth are disabled.

## SSH

```bash
ssh pedagogia@46.225.142.212
```

Your laptop key is authorized. A second key (`~/.ssh/collegia_deploy`) is also authorized for CI — don't revoke it unless you're rotating.

If you get `Permission denied (publickey)`: your key passphrase isn't in the agent. Run `ssh-add --apple-use-keychain ~/.ssh/id_ed25519` in a real terminal (not the Claude Code bash shell — it can't prompt for the passphrase).

## Observe

```bash
# Stack status (replace with actual service names)
ssh pedagogia@46.225.142.212 'docker compose -f /opt/pedagogia/docker-compose.prod.yml ps'

# Live logs for one service (db / backend / frontend)
ssh pedagogia@46.225.142.212 'docker logs pedagogia-backend-1 --tail=100 -f'

# All services, last 50 lines, following
ssh pedagogia@46.225.142.212 'docker compose -f /opt/pedagogia/docker-compose.prod.yml logs --tail=50 -f'

# Public health probe (off the server)
curl -fsSL https://collegia.be/api/health/

# Last deploy runs
gh run list --workflow=deploy.yml --limit 3
```

Container health is the fastest signal. If `docker compose ps` shows a service as `(unhealthy)`, go straight to its logs; don't guess.

## Redeploy

The normal path is **merge to `main`** — the pipeline handles the rest. Check the Deploy workflow on GitHub to confirm it succeeded.

Manual redeploy (same image tag, server-side) — useful when `.env.prod` changed but the image didn't:

```bash
ssh pedagogia@46.225.142.212 'cd /opt/pedagogia && docker compose -f docker-compose.prod.yml pull && docker compose -f docker-compose.prod.yml up -d --remove-orphans'
```

Force-pull latest GHCR image even if tag looks unchanged:

```bash
ssh pedagogia@46.225.142.212 'cd /opt/pedagogia && docker compose -f docker-compose.prod.yml pull backend frontend && docker compose -f docker-compose.prod.yml up -d'
```

## Editing `.env.prod`

The file lives **only on the server**, chmod 600, owned by `pedagogia`. Template (for reference) is `prod/.env.prod.example` in the repo.

```bash
ssh pedagogia@46.225.142.212
cd /opt/pedagogia
nano .env.prod        # or: vi .env.prod
```

**The non-obvious gotcha**: `docker compose restart <service>` does **NOT** re-read `env_file`. The container starts with its original env snapshot. To pick up new values you must recreate the container:

```bash
docker compose -f docker-compose.prod.yml up -d --force-recreate backend
# or for multiple:
docker compose -f docker-compose.prod.yml up -d --force-recreate backend frontend
```

If `--force-recreate` without arguments is needed, list the services explicitly — `up -d --force-recreate` alone on the whole stack will recreate `db` too, which is fine but wastes 10s of restart time.

## Restarting a single service

When you want the binary to restart but the env is unchanged:

```bash
ssh pedagogia@46.225.142.212 'docker compose -f /opt/pedagogia/docker-compose.prod.yml restart backend'
```

After a crash loop, `docker compose ps` will show restart counts. Grab the last 200 log lines before killing the container to preserve the diagnostic.

## Rolling back a bad deploy

CI tags every image with both `:latest` and `:sha-<commit>`. To pin the stack to a known-good commit:

```bash
ssh pedagogia@46.225.142.212
cd /opt/pedagogia
# 1. find the previous good SHA (gh run list on your laptop)
# 2. edit the compose file temporarily OR add to .env.prod:
#    BACKEND_IMAGE=ghcr.io/yassinebenyaghlane/pedagogia-backend:sha-<goodsha>
#    FRONTEND_IMAGE=ghcr.io/yassinebenyaghlane/pedagogia-frontend:sha-<goodsha>
# 3. pull + recreate:
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d --force-recreate backend frontend
```

The *real* fix is still "revert on `main` and let the pipeline redeploy". Rollback is a stopgap while you debug.

## Bootstrapping a fresh VPS

Don't improvise. The runbook is `prod/bootstrap.md` in the repo — it covers the Hetzner firewall, user creation, Docker install, SSH hardening, scp'ing the compose file, writing `.env.prod`, and first `up -d`. Follow it end-to-end.

## Caddy / TLS

Caddy manages Let's Encrypt certs automatically (tls-alpn-01 challenge). Certs live in the named volume `caddy_data` — **don't delete it** unless you want to re-issue and risk rate-limiting. If Caddy can't renew:

```bash
ssh pedagogia@46.225.142.212 'docker logs pedagogia-frontend-1 --tail=200 | grep -E "(error|ACME|challenge)"'
```

Common causes: DNS misconfigured (check `dig +short collegia.be` matches the server's IPv4/IPv6); port 80 blocked by the Hetzner firewall (it shouldn't be — check `hcloud firewall describe pedagogia-web`); `CADDY_EMAIL` missing from `.env.prod`.

## Investigating a prod incident

Mental checklist, in order:

1. **Is it up?** — `curl -fsSL https://collegia.be/api/health/`. If this succeeds, Django + DB are fine; the problem is client-side or scoped.
2. **What does the user see?** — get the exact URL and error. 502/504 → backend down. 400 `DisallowedHost` → `ALLOWED_HOSTS` misconfigured. 403 CSRF → `CSRF_TRUSTED_ORIGINS` or cookie issue. 500 → Django error, read backend logs.
3. **Stack state** — `docker compose ps` on the server.
4. **Recent deploy?** — `gh run list --workflow=deploy.yml --limit 5`. If a deploy landed just before the incident, correlate.
5. **Logs** — `docker logs pedagogia-backend-1 --tail=200` for Django, `pedagogia-frontend-1` for Caddy, `pedagogia-db-1` for Postgres.

## Admin + auth hardening

- **Admin URL** — `/admin/` returns 404 in prod. The real admin lives at `DJANGO_ADMIN_PATH` from `.env.prod` (a random slug like `mgmt-<token>/`, trailing slash required). If you forget it: `ssh pedagogia@46.225.142.212 'grep DJANGO_ADMIN_PATH /opt/pedagogia/.env.prod'`. To rotate, edit `.env.prod` and **recreate both `backend` and `frontend`** — Caddy's `@api` matcher reads `{$DJANGO_ADMIN_PATH}` at startup, so the frontend container must be recreated too (see step 10 of `prod/bootstrap.md`).
- **Auth brute-force** — no host fail2ban on this VPS (`pedagogia` has no sudo). Defence lives at the edge (Cloudflare WAF + Managed Challenge, Hetzner firewall locked to CF ranges) and in the app (DRF throttles `10/min` login, `5/hour` register). If origin-level banning ever becomes necessary, do it via the Cloudflare API — not iptables.

## Things that require explicit user confirmation

Production is shared state with real users. Never do any of these without an explicit ack in the current conversation:

- `docker compose down -v` or removing the `pgdata` volume — this **destroys the database**.
- `git push --force` / `--force-with-lease` to `main`.
- Recreating the VPS, resizing it destructively, or running `hcloud server delete`.
- Rotating `DJANGO_SECRET_KEY` (invalidates every active session).
- Flipping GHCR package visibility to private (breaks the next deploy since the server pulls anonymously).
- Anything destructive on the Hetzner firewall or DNS records.

Destructive but reversible (image prune, log truncation, recreating a single non-db container) can proceed without extra confirmation.

## Infra changes go through a PR, not SSH

Tempting when you're in the server: `nano docker-compose.prod.yml`. Don't. The source of truth is `prod/docker-compose.prod.yml` in the repo — edit there, PR it, merge, then scp the new compose file up (the deploy workflow only handles image updates, not compose-file changes). Otherwise the next CI deploy or a server rebuild will silently revert your fix.

Same for the Caddyfile: it's baked into the frontend image at build time. To change TLS or header config, edit `prod/Caddyfile` in the repo and ship through CI.

## Cheat sheet

| Intent | Command |
|---|---|
| Am I in? | `ssh pedagogia@46.225.142.212 'whoami && docker ps'` |
| Stack status | `ssh pedagogia@46.225.142.212 'docker compose -f /opt/pedagogia/docker-compose.prod.yml ps'` |
| Tail one service | `ssh pedagogia@46.225.142.212 'docker logs pedagogia-<svc>-1 --tail=100 -f'` |
| Public health | `curl -fsSL https://collegia.be/api/health/` |
| Last deploys | `gh run list --workflow=deploy.yml --limit 3` |
| Pick up new env | `ssh pedagogia@46.225.142.212 'cd /opt/pedagogia && docker compose -f docker-compose.prod.yml up -d --force-recreate <svc>'` |
| Manual redeploy | `ssh pedagogia@46.225.142.212 'cd /opt/pedagogia && docker compose -f docker-compose.prod.yml pull && docker compose -f docker-compose.prod.yml up -d --remove-orphans'` |
