#!/usr/bin/env bash
set -euo pipefail

# Nightly Postgres backup to Hetzner Storage Box, encrypted with age.
# Invoked by cron (or pedagogia-backup.service under systemd).
# Loads env from /opt/pedagogia/.env.prod and prepends ~/bin to PATH.

ENV_FILE=${ENV_FILE:-/opt/pedagogia/.env.prod}
[ -r "$ENV_FILE" ] && set -a && . "$ENV_FILE" && set +a
export PATH="$HOME/bin:$PATH"

: "${POSTGRES_DB:?}"
: "${POSTGRES_USER:?}"
: "${STORAGE_BOX_HOST:?}"
: "${STORAGE_BOX_USER:?}"
: "${BACKUP_AGE_RECIPIENT:?}"

COMPOSE_FILE=${COMPOSE_FILE:-/opt/pedagogia/docker-compose.prod.yml}
LOCAL_DIR=${LOCAL_DIR:-/home/pedagogia/backups}
SSH_KEY=${SSH_KEY:-/home/pedagogia/.ssh/storagebox_ed25519}
RETENTION_DAILY=${RETENTION_DAILY:-7}
RETENTION_WEEKLY=${RETENTION_WEEKLY:-4}
RETENTION_MONTHLY=${RETENTION_MONTHLY:-3}

TS=$(date -u +%Y%m%dT%H%M%SZ)
BASENAME="pedagogia-${TS}.dump.age"
DUMP="$LOCAL_DIR/pedagogia-${TS}.dump"
ENC="$LOCAL_DIR/$BASENAME"
mkdir -p "$LOCAL_DIR"

cleanup() { rm -f "$DUMP" "$ENC"; }
trap cleanup EXIT

echo "[$(date -u +%FT%TZ)] dump start"
docker compose -f "$COMPOSE_FILE" exec -T db \
  pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc > "$DUMP"
echo "[$(date -u +%FT%TZ)] dump done ($(stat -c%s "$DUMP") bytes)"

age -r "$BACKUP_AGE_RECIPIENT" -o "$ENC" "$DUMP"
rm "$DUMP"
echo "[$(date -u +%FT%TZ)] encrypted ($(stat -c%s "$ENC") bytes)"

BUCKETS=(daily)
[ "$(date -u +%u)" = "7" ] && BUCKETS+=(weekly)
[ "$(date -u +%d)" = "01" ] && BUCKETS+=(monthly)

SFTP="sftp -i $SSH_KEY -P 23 -o StrictHostKeyChecking=accept-new -o BatchMode=yes ${STORAGE_BOX_USER}@${STORAGE_BOX_HOST}"

{
  for b in "${BUCKETS[@]}"; do echo "-mkdir $b"; done
  for b in "${BUCKETS[@]}"; do echo "put $ENC $b/$BASENAME"; done
  echo bye
} | $SFTP
echo "[$(date -u +%FT%TZ)] uploaded to: ${BUCKETS[*]}"

prune_bucket() {
  local bucket=$1 keep=$2
  local listing
  listing=$(printf "cd %s\nls -1\nbye\n" "$bucket" | $SFTP 2>/dev/null \
    | grep -E '^pedagogia-[0-9TZ]+\.dump\.age$' | sort || true)
  local total; total=$(printf "%s\n" "$listing" | grep -c . || true)
  if [ "$total" -le "$keep" ]; then return; fi
  local victims
  victims=$(printf "%s\n" "$listing" | head -n "$((total - keep))")
  {
    for v in $victims; do echo "rm $bucket/$v"; done
    echo bye
  } | $SFTP
  echo "[$(date -u +%FT%TZ)] pruned $bucket: $(echo "$victims" | wc -l | tr -d ' ') file(s)"
}

prune_bucket daily   "$RETENTION_DAILY"
prune_bucket weekly  "$RETENTION_WEEKLY"
prune_bucket monthly "$RETENTION_MONTHLY"

echo "[$(date -u +%FT%TZ)] backup complete"
