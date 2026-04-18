---
title: Cloudflare
type: entity
created: 2026-04-18
updated: 2026-04-18
sources: []
tags: [infra, cloudflare, security, cdn, dns]
---

The CDN / WAF / DNS edge in front of [[entities/collegia-be]]. Architectural role in the perimeter: [[concepts/edge-security]] (L1 of 4).

## Account / zone state (2026-04-18)

- **Plan**: Free tier. Sufficient for current scale (one WAF rate-limit rule + Full strict TLS + HTTPS enforcement are all included).
- **Zone**: `collegia.be`.
- **Nameservers assigned**: `augustus.ns.cloudflare.com`, `bailey.ns.cloudflare.com`. Delegated from LWS (registrar) since 2026-04-18 — see `whois collegia.be` or `dig @a.nsset.be collegia.be NS`.
- **Edge IPs observed** (proxied records resolve here): `104.21.x`, `172.67.x` (IPv4); `2606:4700::` (IPv6). Not stable, not meant to be relied on — only the delegation matters.

## DNS records (minimal, post-cleanup)

| Type | Name | Content | Proxy |
|---|---|---|---|
| A | `collegia.be` | `46.225.142.212` (Hetzner origin) | Proxied |
| AAAA | `collegia.be` | `2a01:4f8:c0c:1dbf::1` | Proxied |
| CNAME | `www` | `collegia.be` | Proxied |

All legacy mail records (MX, SPF, DKIM, DMARC, `mail`/`imap`/`pop`/`smtp`/`ftp`) were removed during the CF migration because mail isn't in use. When mail is needed, add the **provider-specific** records fresh — do not resurrect the LWS values (they only worked against `mail.lws-hosting.com`).

## SSL / TLS

- **Mode**: Full (strict). Origin's Let's Encrypt cert (served by Caddy on `46.225.142.212:443`) is validated by Cloudflare on every origin fetch.
- **Always Use HTTPS**: on — HTTP→HTTPS 301 at the edge.
- **Automatic HTTPS Rewrites**: on.
- **Min TLS version**: 1.2.
- **Opportunistic Encryption**: on (default).
- Cloudflare Origin Certificates **not** used — Let's Encrypt on the origin already works. Could migrate later if LE renewal ever becomes a headache (gives a 15-year cert, no origin-side renewals).

## Security

- **WAF → Custom rules**: one active rule, rate-limit style: when `URI Path contains /api/auth/`, throttle to ≈20 req/min per IP, **block 10 s**. Trips at request 10 in tight bursts and returns body `error code: 1015` with `server: cloudflare`.
- **Bot Fight Mode** / **Security Level**: default. Aggressive enough to 403 GitHub Actions runner IP ranges — triggered PR #127 (deploy smoke check moved inside SSH).
- **Email Routing**: disabled. Briefly auto-enabled during onboarding, polluted DNS with `_dc-mx` records — cleaned up.
- **No geo-challenge yet** — parked in GH issue #126 until prod logs justify it.

## Interactions with origin

- Origin (Hetzner `pedagogia-web` firewall) accepts TCP/80+443 **only** from Cloudflare's published IPv4/IPv6 ranges (15 + 7 CIDRs). Direct-to-origin times out at L3 from any other peer.
- Cloudflare adds `CF-Connecting-IP` header to upstream requests. Django reads it via `apps.common.middleware.CloudflareRealIPMiddleware`, validated against the same CF ranges — see [[concepts/edge-security]].

## Runbooks

### Refresh CF IP ranges on the Hetzner firewall

CF publishes at `https://www.cloudflare.com/ips-v4` and `/ips-v6`. Script: `./prod/hetzner-firewall.sh` prints the blocks in the comma-separated form Hetzner Cloud Console accepts. Or apply via CLI:

```bash
./prod/hetzner-firewall.sh   # inspect
hcloud firewall replace-rules 10853964 --rules-file /tmp/cf-firewall/rules.json
```

(`hcloud` is authenticated in context `pedagogia`; firewall id `10853964`.)

### Verify the edge is actually live

```bash
curl -I https://collegia.be                    # expect server: cloudflare + cf-ray
curl -I --resolve collegia.be:443:46.225.142.212 https://collegia.be   # expect timeout
```

### Verify the WAF rate-limit rule

```bash
for i in $(seq 1 15); do
  curl -sS -o /dev/null -w "%{http_code} " -X POST https://collegia.be/api/auth/login/ \
    -H "Content-Type: application/json" -d '{"email":"x@y.z","password":"x"}'
done
# Expect ~9 × 400, then 429 onwards (body: "error code: 1015")
```

### Dashboard navigation

- **DNS → Records** — zone records, proxy toggles.
- **SSL/TLS → Overview** — TLS mode; **Edge Certificates** — Always Use HTTPS, HSTS, Min TLS version.
- **Security → WAF → Custom rules** — rate-limit rules.
- **Security → Events** — log of WAF/bot actions (useful when investigating 403/429 tickets).
- **Analytics → Traffic** — request volume, cached vs. origin, geography.

## Gotchas

- **Bot score 403s datacenter IPs.** GitHub Actions, AWS/Azure/GCP egress, Tor exit nodes all get 403. Any CI or test that hits `collegia.be` externally from a cloud runner will fail. Workaround: run the check server-side via SSH, or hit origin via internal Docker DNS.
- **Proxied MX targets don't work.** Cloudflare can only proxy HTTP(S). If mail is added later, the `mail.<domain>` A record (MX target) **must** be DNS-only (grey cloud).
- **Email Routing auto-activates.** First time a user opens the Email section Cloudflare tries to enable it and injects `_dc-mx` MX records. Skip the wizard / keep disabled unless actually used.
- **Edge rate limit stricter than DRF.** CF trips at ~10/min; Django at 10/min. In practice CF is first, so `/api/auth/login` 429s you see from outside are almost always CF (`server: cloudflare`, body `error code: 1015`), not Django (`content-type: application/json`, body `{"detail":"…"}`).

## See also

- [[concepts/edge-security]] — how CF composes with the Hetzner firewall + Django throttle
- [[entities/collegia-be]] — the origin CF sits in front of
- [[concepts/prod-stack]] — overall prod architecture
- [[questions/devops-state-2026-04-18]] — current devops/infra state snapshot
