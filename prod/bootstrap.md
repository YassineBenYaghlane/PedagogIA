# Production server bootstrap — collegia.be

One-time setup on the Hetzner VPS after the server is provisioned and the
`pedagogia` user exists. Assumes docker + compose plugin are already
installed (done in the hardening pass).

## 1. Drop the compose file on the server

From your laptop:

```bash
scp prod/docker-compose.prod.yml pedagogia@46.225.142.212:/opt/pedagogia/
```

(The `Caddyfile` is baked into the frontend image — it does NOT live on
the server.)

## 2. Write `.env.prod`

SSH to the server as `pedagogia`:

```bash
ssh pedagogia@46.225.142.212
cd /opt/pedagogia
nano .env.prod    # or vi
chmod 600 .env.prod
```

Paste the contents of `prod/.env.prod.example` from the repo, then fill
in every placeholder. Generate secrets:

```bash
# Django secret key
python3 -c "import secrets; print(secrets.token_urlsafe(64))"

# Postgres password
openssl rand -base64 32

# Random slug for DJANGO_ADMIN_PATH (hides /admin/ — see step 10)
python3 -c "import secrets; print('mgmt-' + secrets.token_urlsafe(12) + '/')"
```

## 3. GHCR image visibility

After the first successful CI run, the GHCR packages
`pedagogia-backend` and `pedagogia-frontend` default to private. Make
them public so the server can pull without auth:

1. GitHub → your profile → Packages → `pedagogia-backend` → Package settings → Change visibility → Public.
2. Repeat for `pedagogia-frontend`.

Alternative: keep them private and set up a pull token on the server
(`docker login ghcr.io -u <user> -p <PAT>`).

## 4. First pull + start

```bash
cd /opt/pedagogia
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml logs -f
```

Caddy will request a Let's Encrypt cert for `collegia.be` on the first
`https` request. Make sure DNS resolves to this server's IPv4/IPv6
before this step (check with `dig +short collegia.be`).

## 5. Sanity checks

```bash
curl -fsS https://collegia.be/api/health/
# {"status":"ok"}
```

Open `https://collegia.be/` in a browser. You should get the SPA with a
valid cert. Try a deep link like `https://collegia.be/connexion` and
refresh — it should render (Caddy's `try_files` fallback).

## 6. Google OAuth

In Google Cloud Console → Credentials → the OAuth 2.0 client:

- Authorized JavaScript origin: `https://collegia.be`
- Authorized redirect URI: `https://collegia.be/auth/google/callback`

## 7. Ongoing deploys

Push to `main` → GH Actions builds both images → pushes to GHCR → SSHes
here → `pull && up -d --remove-orphans`. No manual steps after this.

## 8. Lock ports 80/443 to Cloudflare

Once Cloudflare is in front of `collegia.be` (orange cloud on the A/AAAA records, SSL mode Full strict), restrict origin HTTP/HTTPS to Cloudflare's IP ranges so direct-to-Hetzner requests get dropped at L3.

```bash
./prod/hetzner-firewall.sh
```

Copy the output into Hetzner Cloud Console → Firewalls → `collegia` → Inbound Rules:

- TCP/80  — Source IPs: paste the IPv4 + IPv6 blocks from the script
- TCP/443 — Source IPs: paste the IPv4 + IPv6 blocks from the script
- TCP/22  — leave as is (SSH must stay open)
- ICMP    — leave as is

Cloudflare updates its ranges occasionally (rare). Re-run the script every few months and refresh the two rules.

## 9. Nightly Postgres backups

Backups go to the Hetzner Storage Box `pedagogia-backups` (`u578869.your-storagebox.de`, `fsn1`), encrypted with [age](https://age-encryption.org). Retention 7 daily + 4 weekly + 3 monthly. Restore runbook: [`deploy/restore.md`](../deploy/restore.md). Runs via user cron (no sudo required — the `pedagogia` account doesn't have passwordless sudo).

```bash
# On the VPS, as pedagogia:
ssh-keygen -t ed25519 -f ~/.ssh/storagebox_ed25519 -N "" -C "pedagogia-vps-backup"
# Register the public key with the Storage Box via `hcloud storage-box update --ssh-key ...` from the laptop.

mkdir -p ~/bin ~/backups
cd /tmp && curl -fsSL https://github.com/FiloSottile/age/releases/download/v1.2.0/age-v1.2.0-linux-amd64.tar.gz \
  | tar -xz && mv age/age age/age-keygen ~/bin/ && rm -rf age

# Append to /opt/pedagogia/.env.prod:
#   STORAGE_BOX_HOST=u578869.your-storagebox.de
#   STORAGE_BOX_USER=u578869
#   BACKUP_AGE_RECIPIENT=<age public key from 1Password>

# scp backup.sh from repo to /opt/pedagogia/backup.sh, chmod +x.

# Install cron entry:
(crontab -l 2>/dev/null; echo "0 3 * * * /opt/pedagogia/backup.sh >> /home/pedagogia/backup.log 2>&1") | crontab -

# Verify with a manual run:
/opt/pedagogia/backup.sh
```

Age private key is **not** stored on the VPS — it lives in 1Password ("collegia — storage box + backup keys"). Losing it means the existing dumps become unrecoverable. Losing the VPS does not affect dumps; losing Hetzner Falkenstein does not affect the server.

## 10. Hide the Django admin behind a random slug

`DJANGO_ADMIN_PATH` in `.env.prod` controls where the admin is mounted. Set it to a random slug — the default `/admin/` then 404s for anyone fishing:

```bash
# Already generated in step 2 if you followed along; otherwise:
python3 -c "import secrets; print('mgmt-' + secrets.token_urlsafe(12) + '/')"
```

Set `DJANGO_ADMIN_PATH` in `/opt/pedagogia/.env.prod`, including the trailing slash (Caddy's `@api` matcher uses the value to reverse-proxy `/<slug>/*` to Django). Then recreate the backend **and** frontend containers — `docker compose restart` does not re-read `env_file`:

```bash
docker compose -f docker-compose.prod.yml up -d --force-recreate backend frontend
```

Bookmark the new URL locally — it's only in `.env.prod`, not in any code. If you ever forget it, SSH in and `grep DJANGO_ADMIN_PATH /opt/pedagogia/.env.prod`.

Verify:

```bash
curl -o /dev/null -s -w "%{http_code}\n" https://collegia.be/admin/
# 404
curl -o /dev/null -s -w "%{http_code}\n" https://collegia.be/<slug>/
# 302 — redirect to the admin login page
```

## 11. Auth brute-force protection

There is no host fail2ban on this VPS (the `pedagogia` user has no sudo). Brute-force protection is layered at the edge and in the app:

- **Cloudflare** in front of `collegia.be` — WAF rules + Managed Challenge for non-Belgian traffic block the bulk of automated auth abuse before it reaches origin.
- **Hetzner firewall** (step 8) — only Cloudflare IP ranges can reach ports 80/443, so direct-to-origin credential stuffing is impossible.
- **DRF throttling** in `settings/base.py` — `10/min` on `/api/auth/login/` and `5/hour` on `/api/auth/registration/` returns 429 to repeat offenders.

If origin-level IP banning becomes necessary later, the right tool is Cloudflare's API (list rules + rate-limiting) rather than host-level iptables — this VPS intentionally stays hands-off.

## 12. Managed Challenge for non-Belgian traffic (#126)

The audience lives in Belgium (FWB curriculum). Non-BE traffic is almost all noise — credential stuffing, opportunistic scans, botnets. A Cloudflare WAF Custom Rule issues a Managed Challenge for non-BE visitors scoped to `/api/auth/*`, so a real parent travelling still passes invisibly but automated abuse eats a JS challenge.

**Before enabling**: in the Cloudflare dashboard → Analytics → Security Events, filter the last 7 days by country. If non-BE human traffic is a handful of hits, activate. If it's a real segment, hold off.

**Create the rule** — Cloudflare dashboard → Security → WAF → Custom rules → Create rule:

- Name: `non-BE challenge on auth`
- Expression (edit as expression, not builder):
  ```
  (ip.geoip.country ne "BE" and starts_with(http.request.uri.path, "/api/auth/"))
  ```
- Action: **Managed Challenge**
- Deploy

**Verified-bot bypass** — Cloudflare's Managed Challenge already lets Googlebot / Bingbot through via the verified-bot exemption; no extra rule needed. If you want to be explicit, add `and not cf.client.bot` to the expression.

**Verify** — from a non-BE VPN, `curl -i https://collegia.be/api/auth/login/` should return the CF challenge interstitial (HTTP 403 with `cf-mitigated: challenge`). From a BE IP, it goes through to Django normally.

**Rollback** — if you over-block: WAF → Custom rules → toggle the rule off. Effect is immediate.

## 13. Monitoring (#88)

Two independent layers. Neither lives on the VPS — both free tiers, dashboard-based.

### 13a. Error tracking — Sentry

Backend and frontend both ship with Sentry SDKs that are **no-ops unless the DSN env var is set**, so turning on monitoring is purely a config change (no code).

1. Create a Sentry org + two projects: `pedagogia-backend` (Django) and `pedagogia-frontend` (React). Free tier covers ~5k events/month.
2. For each project, grab the DSN (Project Settings → Client Keys).
3. **Backend**: append `SENTRY_DSN=<backend dsn>` to `/opt/pedagogia/.env.prod`, then `docker compose -f docker-compose.prod.yml up -d --force-recreate backend`.
4. **Frontend**: the DSN is baked in at build time via the `VITE_SENTRY_DSN` GitHub Actions secret. In the repo → Settings → Secrets and variables → Actions → add `VITE_SENTRY_DSN` with the frontend project's DSN. Next push to `main` triggers a new build that embeds it.
5. Verify: trigger a test error — backend via `curl https://collegia.be/api/boom/` (after a throwaway view) or by raising in the Django shell; frontend via the browser console `throw new Error("sentry test")`. Both events should appear in the Sentry dashboards within ~30s.

Alert channel: Sentry → Alerts → route to email or Slack. Default "issue created" rule is enough to start.

### 13b. Uptime — UptimeRobot (or BetterStack)

Outside-Cloudflare check so we catch CF outages, origin outages, and expired certs.

1. Create an UptimeRobot account (free tier: 50 monitors, 5-min interval).
2. Add a **HTTP(s)** monitor on `https://collegia.be/api/health/`, interval 5 min, keyword `"ok"` (the health endpoint returns `{"status":"ok"}`).
3. Add an alert contact (email + optional SMS). Default "down for 5 min" trigger is fine.
4. Optional: add a second monitor on the frontend SPA (`https://collegia.be/`) to catch Caddy failures that don't affect the backend.

Verify: pause the backend container with `docker compose -f docker-compose.prod.yml stop backend` on the VPS for 6 min, watch the alert arrive. Then `start backend` and check the resolve email. **Don't forget to restart** — pausing during a real user session is disruptive.
