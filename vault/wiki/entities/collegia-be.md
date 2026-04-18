---
title: collegia.be
type: entity
created: 2026-04-17
updated: 2026-04-18
sources: []
tags: [infra, deployment, prod]
---

The live production deployment of PedagogIA. Pattern it instantiates: [[concepts/prod-stack]]. Edge/security story: [[concepts/edge-security]].

## Summary

Single Hetzner VPS hosting the PedagogIA POC under the domain `collegia.be`, fronted by Cloudflare. Went live 2026-04-17; moved behind Cloudflare 2026-04-18. First production environment for the project.

## Current state (2026-04-18)

- **Host**: Hetzner Cloud cx23 (`collegia-prod`, server id `127264302`), `nbg1`, Ubuntu 24.04, €3.99/mo.
- **IPv4**: `46.225.142.212` — no longer reachable directly on 80/443, only via Cloudflare.
- **IPv6**: `2a01:4f8:c0c:1dbf::1`
- **Firewall**: Hetzner `pedagogia-web` (id `10853964`). TCP/22 + ICMP world-open; TCP/80 + TCP/443 restricted to Cloudflare's 15 IPv4 + 7 IPv6 ranges.
- **CDN / edge**: [[entities/cloudflare]], nameservers `augustus.ns.cloudflare.com` + `bailey.ns.cloudflare.com`. Full (strict) TLS, "Always Use HTTPS" on, WAF rate-limit rule on `/api/auth/*`.
- **SSH users**: `pedagogia` (operator, operations), plus a CI deploy key (GH Actions). Root disabled, password auth disabled.
- **Images**:
  - `ghcr.io/yassinebenyaghlane/pedagogia-backend:latest`
  - `ghcr.io/yassinebenyaghlane/pedagogia-frontend:latest`
  Both public (GHCR package visibility set).
- **DNS** (at Cloudflare since 2026-04-18): just three records — `A collegia.be → 46.225.142.212` (proxied), `AAAA collegia.be → 2a01:4f8:c0c:1dbf::1` (proxied), `CNAME www → collegia.be` (proxied). All mail/FTP/IMAP/SPF/DKIM/DMARC records removed (no mail in use; will be re-added provider-specific when needed).
- **TLS**: Let's Encrypt via Caddy on the origin (tls-alpn-01). Cloudflare validates origin cert (Full strict). Auto-renews.
- **Backups**: nightly at 03:00 via `prod/backup.sh`, age-encrypted dump to Hetzner Storage Box `u578869.your-storagebox.de`. Retention 7d + 4w + 3m. Restore runbook: `deploy/restore.md`. Age private key in 1Password.
- **Mail**: none. LWS mailbox not in use; all DNS mail records cleaned up 2026-04-18.

## Registrar

LWS (ligne web services) still holds the domain registration for `collegia.be` but no longer runs DNS for it. Nameservers are delegated to Cloudflare.

## GitHub integration

- Repo: `YassineBenYaghlane/PedagogIA` (public).
- Actions secrets: `SSH_HOST`, `SSH_USER`, `SSH_PRIVATE_KEY`, `DOMAIN`. No PATs; GHCR pushes use `GITHUB_TOKEN`.
- Deploy workflow SSHes as `pedagogia@46.225.142.212` on every push to `main`.

## Relationships

- Implements: [[concepts/prod-stack]]
- Depends on: Anthropic Claude API, Google OAuth, Let's Encrypt, GHCR
- Runbook: `prod/bootstrap.md` in the repo

## Open threads (2026-04-18)

- **#88 Production monitoring** — Sentry for backend exceptions = highest value, uptime = marginal given Cloudflare.
- **#100 `/admin/` hardening** — obscure path + Caddy basic-auth or IP allowlist. Quick win, not done.
- **#101 fail2ban** — lower urgency now that #99 (DRF throttle) + #87 (CF rate-limit) cover `/api/auth/*` at L7. Still nice to have for SSH.
- **#89 Version in app** — bake git SHA as build-arg, show in footer.
- **#102 Staging environment** — deferred until team > 1.
- **#126 Managed challenge non-BE traffic** — deferred; turn on only if prod logs show non-BE noise slipping past the rate-limit.

## See also

- [[entities/cloudflare]] — the edge in front of this host
- [[concepts/prod-stack]]
- [[concepts/edge-security]]
- [[questions/devops-state-2026-04-18]]
- [[overview]]
