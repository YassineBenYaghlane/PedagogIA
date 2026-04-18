---
title: Edge security layers
type: concept
created: 2026-04-18
updated: 2026-04-18
sources: []
tags: [infra, security, cloudflare, rate-limit, deployment]
---

How the production perimeter is structured. Four layers compose from L3 to L7 so each catches what the others can't. Implemented across GitHub issues #87, #99, #124; all merged by 2026-04-18.

## The four layers, outside→in

```
Internet
   │
   ▼
┌────────────────────────────────────────────────────────────────┐
│ L1 — Cloudflare edge                                           │
│  • TLS termination (Full strict: origin cert still validated)  │
│  • "Always Use HTTPS" + HTTPS rewrites                         │
│  • WAF rate-limit rule on /api/auth/*  (≈20 req/min → 1015)    │
│  • DDoS absorption, bot score                                  │
│  • Proxied DNS (104.x / 172.67.x edge IPs, not Hetzner)        │
└───────────────────────────┬────────────────────────────────────┘
                            │ CF-Connecting-IP: <real client>
                            ▼
┌────────────────────────────────────────────────────────────────┐
│ L2 — Hetzner Cloud firewall (pedagogia-web)                    │
│  • TCP/80 + TCP/443  → only Cloudflare IPv4/IPv6 ranges        │
│  • TCP/22 (SSH)      → 0.0.0.0/0                               │
│  • ICMP              → 0.0.0.0/0                               │
│  Direct-to-origin HTTP(S) is dropped at L3 before Caddy sees it│
└───────────────────────────┬────────────────────────────────────┘
                            ▼
┌────────────────────────────────────────────────────────────────┐
│ L3 — Caddy (frontend container)                                │
│  • SPA try_files, reverse_proxy /api → backend:8000            │
│  • Security headers (HSTS, XFO, COOP, CSP via Permissions-Pol) │
└───────────────────────────┬────────────────────────────────────┘
                            ▼
┌────────────────────────────────────────────────────────────────┐
│ L4 — Django + DRF (backend container)                          │
│  • CloudflareRealIPMiddleware: trust CF-Connecting-IP IFF      │
│    REMOTE_ADDR is in a Cloudflare CIDR. Untrusted peers keep   │
│    their own REMOTE_ADDR (can't spoof the header).             │
│  • DRF throttles: anon 60/min, user 300/min, login 10/min,     │
│    register 5/h, password_reset 5/h                            │
│  • Backed by DatabaseCache so throttle state is shared across  │
│    gunicorn workers                                            │
└────────────────────────────────────────────────────────────────┘
```

## Why each layer exists

- **L1 rate-limit** — kills distributed brute-force bursts before they hit the origin. Cheap at the edge, saves origin CPU. Coarse: per-IP, ≈20/min across all `/api/auth/*`.
- **L2 firewall** — makes L1 mandatory. Without it, an attacker who knows the Hetzner IP (`46.225.142.212`) could curl straight to Caddy and bypass Cloudflare entirely. After the lockdown (2026-04-18), direct-to-origin times out at TCP handshake.
- **L4 throttle** — defense in depth. If Cloudflare is ever misconfigured or bypassed (internal network, debug tunnel), Django still rate-limits. Also stricter and per-scope: `login` gets 10/min specifically.
- **L4 middleware** — without it the throttle collapses to ≈a dozen buckets keyed on Cloudflare edge IPs, and legit users sharing an edge with an attacker get false 429s. With it, each real client gets its own bucket.

## Why the middleware is safe

`CloudflareRealIPMiddleware` only trusts `CF-Connecting-IP` when the TCP peer is in one of Cloudflare's published ranges (15 IPv4 + 7 IPv6 CIDRs, refreshed from `https://www.cloudflare.com/ips-v4` and `/ips-v6`). An attacker hitting a non-CF peer (SSH tunnel, internal network, bypassed firewall) has their fake header ignored and is throttled on their real IP. The header is spoof-proof from outside because L2 drops non-CF peers on 80/443 entirely.

Guarded by `TRUST_CLOUDFLARE_REAL_IP` — **on in prod** (`settings/prod.py` hardcodes `True`), **off in dev**, controllable via env for tests.

## What this does NOT give us

- No per-country blocking — see [[questions/devops-state-2026-04-18]] for the parked geo-challenge follow-up (#126).
- No uptime monitoring from outside Cloudflare — Cloudflare's analytics is the current signal.
- No Django exception visibility (Sentry not wired yet — #88).
- No fail2ban-style SSH jail — #101, deferred.
- Admin hardening (`/admin/` obscure path / auth gate) — #100, open.

## Operational runbooks

- **Refresh the Cloudflare IP list** (rare, every few months): run `./prod/hetzner-firewall.sh` locally, copy the IPv4+IPv6 blocks into Hetzner Cloud Console → Firewalls → `pedagogia-web` → edit TCP/80 + TCP/443 rules. OR use `hcloud firewall replace-rules 10853964 --rules-file rules.json` from a host with the `hcloud` CLI authenticated in the `pedagogia` context.
- **Test the lockdown**: `curl --resolve collegia.be:443:46.225.142.212 https://collegia.be/api/health/` should time out. Via Cloudflare (`curl https://collegia.be/api/health/`) should 200.
- **Test the edge rate-limit**: 20+ rapid POSTs to `/api/auth/login/` with bad creds should flip from `400` to `429` with body `error code: 1015` and `server: cloudflare`.
- **Test the Django throttle** (if edge is bypassed): same burst with `TRUST_CLOUDFLARE_REAL_IP=0` on a dev box, returns DRF-style `429` with JSON body and `Retry-After`.

## Gotcha: GH Actions post-deploy smoke check

Cloudflare's bot score 403s requests from GitHub Actions runner IP ranges. The original deploy workflow hit `https://collegia.be/api/health/` from the runner and got `403` even when prod was fine. Fix landed 2026-04-18 (PR #127): smoke check now runs *inside* the SSH session, polling the backend container's built-in healthcheck status. No external hop, no Cloudflare.

## See also

- [[entities/cloudflare]] — CF account config (zone, WAF rule, TLS mode, dashboard runbooks)
- [[concepts/prod-stack]] — the overall prod shape (containers, network, CI/CD)
- [[entities/collegia-be]] — live instance specifics (IPs, image refs, DNS)
- [[questions/devops-state-2026-04-18]] — current devops/infra status snapshot for handoff
