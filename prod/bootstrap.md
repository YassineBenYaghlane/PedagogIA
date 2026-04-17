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

## 8. Nightly Postgres backups

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
