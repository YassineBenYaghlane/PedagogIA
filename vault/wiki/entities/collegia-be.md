---
title: collegia.be
type: entity
created: 2026-04-17
updated: 2026-04-17
sources: []
tags: [infra, deployment, prod]
---

The live production deployment of PedagogIA. Pattern it instantiates: [[concepts/prod-stack]].

## Summary

Single Hetzner VPS hosting the PedagogIA POC under the domain `collegia.be`. Went live 2026-04-17. First production environment for the project.

## Current state (2026-04-17)

- **Host**: Hetzner Cloud cx23 (`collegia-prod`), `nbg1`, Ubuntu 24.04, €3.99/mo.
- **IPv4**: `46.225.142.212`
- **IPv6**: `2a01:4f8:c0c:1dbf::1`
- **Firewall**: Hetzner `pedagogia-web` (22/80/443/ICMP).
- **SSH users**: `pedagogia` (operator, operations), plus a CI deploy key (GH Actions). Root disabled, password auth disabled.
- **Images**:
  - `ghcr.io/yassinebenyaghlane/pedagogia-backend:latest`
  - `ghcr.io/yassinebenyaghlane/pedagogia-frontend:latest`
  Both public (GHCR package visibility set).
- **DNS**: apex + `www` A/AAAA at LWS → Hetzner IPs (TTL 6h).
- **TLS**: Let's Encrypt via Caddy (tls-alpn-01). Auto-renews.
- **Mail**: LWS keeps `mail.collegia.be` and `A mail` + `CNAME imap/pop/smtp/ftp`. Unrelated to the app; left alone.

## GitHub integration

- Repo: `YassineBenYaghlane/PedagogIA` (public).
- Actions secrets: `SSH_HOST`, `SSH_USER`, `SSH_PRIVATE_KEY`, `DOMAIN`. No PATs; GHCR pushes use `GITHUB_TOKEN`.
- Deploy workflow SSHes as `pedagogia@46.225.142.212` on every push to `main`.

## Relationships

- Implements: [[concepts/prod-stack]]
- Depends on: Anthropic Claude API, Google OAuth, Let's Encrypt, GHCR
- Runbook: `prod/bootstrap.md` in the repo

## Open threads

- Google OAuth redirect URIs not yet added in Google Console (tracked in GitHub issue #91).
- Postgres automated backups: not yet configured.
- Sentry / UptimeRobot / Cloudflare: explicitly deferred.

## See also

- [[concepts/prod-stack]]
- [[overview]]
