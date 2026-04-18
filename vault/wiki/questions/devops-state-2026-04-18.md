---
title: Devops / infra state — 2026-04-18
type: question
created: 2026-04-18
updated: 2026-04-18
sources: []
tags: [infra, deployment, security, handoff]
---

**Q:** What's the current state of PedagogIA's production infrastructure, what landed recently, and what should a devops agent tackle next?

Snapshot for handoff. Code-level pointers throughout so the next agent can verify claims instead of trusting this page.

## One-liner

Prod is live on [[entities/collegia-be]], fronted by Cloudflare, locked down at the Hetzner firewall to Cloudflare IPs only, with app-layer rate limiting and encrypted nightly backups. The big remaining gap is exception/error visibility — no Sentry yet.

## What's live (code + config)

### Edge + network ([[concepts/edge-security]])

- **Cloudflare** in front of `collegia.be`. NS delegated 2026-04-18 (`augustus` + `bailey`). SSL Full (strict), Always Use HTTPS, Automatic HTTPS Rewrites.
- **WAF rate-limit rule** on `/api/auth/*` — ≈20 req/min per IP, block 10s, returns `1015` body + `server: cloudflare`.
- **Hetzner firewall** `pedagogia-web` (id `10853964`). TCP/22 + ICMP world-open; TCP/80 + TCP/443 restricted to CF IPv4/IPv6 CIDRs. Managed via `hcloud` CLI (authenticated in context `pedagogia`) — config in `prod/hetzner-firewall.sh`.
- **DNS at Cloudflare** is minimal: `A` + `AAAA` + `CNAME www`. All mail-related records (MX, SPF, DKIM, DMARC, CNAMEs for imap/pop/smtp/ftp) were cleaned up during the CF migration because mail isn't in use.

### Backend — rate limiting + real-IP ([[concepts/edge-security]])

- `backend/pedagogia/settings/base.py` — DRF `DEFAULT_THROTTLE_CLASSES` = Anon + User; `DEFAULT_THROTTLE_RATES` = `anon 60/min, user 300/min, login 10/min, register 5/h, password_reset 5/h`.
- `backend/pedagogia/settings/base.py` — `CACHES` = `DatabaseCache` (`pedagogia_cache` table), created by `manage.py createcachetable` in `backend/start.sh`. Needed so throttle state is shared across 3 gunicorn workers.
- `backend/apps/accounts/views.py` — `ThrottledLoginView`, `ThrottledRegisterView`, `ThrottledPasswordResetView`, `GoogleLogin` all set `throttle_classes = [ScopedRateThrottle]` with scope matching the rate name.
- `backend/apps/common/middleware.py` — `CloudflareRealIPMiddleware` rewrites `REMOTE_ADDR` from `CF-Connecting-IP` iff the TCP peer is a CF CIDR. CF IP ranges hardcoded in the module (IPv4+IPv6). Guarded by `TRUST_CLOUDFLARE_REAL_IP` env flag; hardcoded `True` in `settings/prod.py`, default `False` in dev.
- Tests: `backend/tests/test_throttling.py` (11th login = 429), `backend/tests/test_real_ip.py` (range membership + rewrite + spoof-prevention + throttle-isolation-per-real-IP).

### Backups

- Nightly `prod/backup.sh` at 03:00 via cron on the VPS. Postgres dump → age-encrypt → `rsync` to Hetzner Storage Box `u578869.your-storagebox.de`. Retention 7 daily + 4 weekly + 3 monthly.
- Age **private** key is in 1Password, not on the VPS. Losing it means losing the dumps.
- Restore runbook: `deploy/restore.md`.

### CI/CD

- `.github/workflows/ci.yml` — backend `ruff` + `pytest` against real Postgres 16, frontend `eslint` + `vite build`.
- `.github/workflows/deploy.yml` — on push to `main`, matrix-build both images, push `:latest` + `:sha-<commit>` to GHCR, SSH to server, `docker compose pull && up -d --remove-orphans && image prune -f`, **smoke-check from inside the SSH session** by polling the backend container's built-in healthcheck status. External smoke check was abandoned because CF bot-score 403s the GH runner.

## Recently merged (April 2026)

- **#107** — nightly encrypted Postgres backups to Hetzner Storage Box (2026-04-17)
- **#118 / #99** — app-layer rate limiting on `/api/auth/*` (2026-04-18)
- **#124 / #87** — CF-Connecting-IP real-IP middleware; then Hetzner firewall locked to CF IPs; #87 closed 2026-04-18
- **#127** — deploy smoke check moved inside SSH (2026-04-18)

## What to tackle next (recommended order)

1. **#88 Sentry for backend errors** — only thing we're really flying blind on. Free tier (5k events/mo), ~20 min to wire into `settings/prod.py`. Skip UptimeRobot for now (Cloudflare analytics covers uptime well enough at this scale).
2. **#89 Version in app** — bake `VITE_APP_VERSION` = git SHA at build time, show in footer. Trivial but useful for "what's actually running?".
3. **#100 `/admin/` hardening** — obscure path + Caddy basic-auth gate. Quick security win.
4. **#101 fail2ban** — now lower urgency since L7 throttles cover `/api/auth/*`. Still worth it for SSH brute-force protection.
5. **#102 Staging environment** — not worth until there's a second person touching prod.
6. **#126 Managed challenge non-BE** — leave parked; turn on only if logs show non-BE noise slipping through.

## Gotchas for the next devops agent

- **Cloudflare 403s GH Actions runners.** Any workflow that hits `https://collegia.be/*` from a runner fails. Route through SSH instead, or hit origin via internal Docker network.
- **Dev cache matters for throttle testing.** `LocMemCache` is per-process, so with 3 gunicorn workers in dev you'd need ~30 requests before the 10/min login limit triggers. `DatabaseCache` in base settings fixes this; `conftest.py` creates the cache table for tests.
- **Don't spoof `CF-Connecting-IP` in dev** — middleware is off by default there. To test throttle behavior set `TRUST_CLOUDFLARE_REAL_IP=1` and a `REMOTE_ADDR` in Cloudflare's range.
- **Hetzner firewall refresh** — Cloudflare IP ranges change rarely but do change. Re-run `./prod/hetzner-firewall.sh` every few months and apply via `hcloud firewall replace-rules 10853964`.
- **Mail is not configured.** DNS is clean (no MX / SPF / DKIM / DMARC). If email becomes needed, pick a provider (Resend, Mailgun, Fastmail, CF Email Routing) and add the provider-specific DNS records fresh — do not try to resurrect the LWS records.

## Filed under

- [[concepts/prod-stack]]
- [[concepts/edge-security]]
- [[entities/collegia-be]]
