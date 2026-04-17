#!/usr/bin/env bash
# Write a per-instance .env with shifted ports and suffixed cookies so this
# checkout can run docker compose in parallel with other running instances.
#
# Picks the lowest free offset N by scanning the main repo's .env and every
# worktree's .env under .claude/worktrees/. Seeds from the main repo's .env
# (to preserve secrets) and falls back to .env.example if missing.
#
# Usage:
#   scripts/new-instance.sh            # refuses if .env already exists
#   scripts/new-instance.sh --force    # overwrite existing .env

set -euo pipefail

FORCE=0
for arg in "$@"; do
  case "$arg" in
    --force|-f) FORCE=1 ;;
    -h|--help)
      sed -n '2,14p' "$0" | sed 's/^# \{0,1\}//'
      exit 0 ;;
    *) echo "unknown arg: $arg (use --force or --help)" >&2; exit 2 ;;
  esac
done

GIT_COMMON=$(git rev-parse --git-common-dir)
MAIN_REPO=$(cd "$GIT_COMMON/.." && pwd)
CHECKOUT=$(git rev-parse --show-toplevel)
TARGET_ENV="$CHECKOUT/.env"

if [ -f "$TARGET_ENV" ] && [ "$FORCE" != 1 ]; then
  echo "$TARGET_ENV already exists. Re-run with --force to overwrite." >&2
  exit 1
fi

USED=()
shopt -s nullglob
for f in "$MAIN_REPO/.env" "$MAIN_REPO"/.claude/worktrees/*/.env; do
  [ -f "$f" ] || continue
  [ "$f" = "$TARGET_ENV" ] && continue
  port=$(grep -E '^FRONTEND_PORT=' "$f" | tail -n1 | cut -d= -f2 | tr -d '\r' || true)
  [ -n "${port:-}" ] && USED+=("$((port - 5173))")
done
shopt -u nullglob

N=0
while [[ " ${USED[*]:-} " == *" $N "* ]]; do
  N=$((N + 1))
done

DIR_NAME=$(basename "$CHECKOUT")
if [ "$CHECKOUT" = "$MAIN_REPO" ]; then
  SUFFIX=""
else
  SUFFIX=$(printf '%s' "$DIR_NAME" | tr -c 'a-zA-Z0-9' '_' | cut -c1-12 | sed 's/_*$//')
fi

if [ -f "$MAIN_REPO/.env" ] && [ "$MAIN_REPO/.env" != "$TARGET_ENV" ]; then
  SRC="$MAIN_REPO/.env"
elif [ -f "$MAIN_REPO/.env.example" ]; then
  SRC="$MAIN_REPO/.env.example"
else
  echo "No source .env or .env.example found in $MAIN_REPO" >&2
  exit 1
fi
cp "$SRC" "$TARGET_ENV"

POSTGRES_PORT=$((5411 + N))
BACKEND_PORT=$((8000 + N))
FRONTEND_PORT=$((5173 + N))

# Rewrite the default ports baked into derived URLs (DATABASE_URL, CORS_ORIGINS,
# VITE_API_URL, GOOGLE_OAUTH_CALLBACK_URL, etc.) before touching raw port vars.
# Matching `localhost:PORT` avoids false positives on bare port numbers.
sed -i '' -E "s|localhost:5173|localhost:${FRONTEND_PORT}|g" "$TARGET_ENV"
sed -i '' -E "s|localhost:8000|localhost:${BACKEND_PORT}|g" "$TARGET_ENV"
sed -i '' -E "s|localhost:5411|localhost:${POSTGRES_PORT}|g" "$TARGET_ENV"

set_kv() {
  local key="$1" val="$2"
  if grep -qE "^${key}=" "$TARGET_ENV"; then
    sed -i '' -E "s|^${key}=.*|${key}=${val}|" "$TARGET_ENV"
  else
    printf '\n%s=%s\n' "$key" "$val" >> "$TARGET_ENV"
  fi
}

set_kv POSTGRES_PORT "$POSTGRES_PORT"
set_kv BACKEND_PORT  "$BACKEND_PORT"
set_kv FRONTEND_PORT "$FRONTEND_PORT"

if [ -n "$SUFFIX" ]; then
  set_kv VITE_CSRF_COOKIE_NAME "csrftoken_${SUFFIX}"
  set_kv SESSION_COOKIE_NAME   "sessionid_${SUFFIX}"
  set_kv CSRF_COOKIE_NAME      "csrftoken_${SUFFIX}"
fi

echo "Wrote $TARGET_ENV (offset N=$N):"
echo "  POSTGRES_PORT=$POSTGRES_PORT"
echo "  BACKEND_PORT=$BACKEND_PORT"
echo "  FRONTEND_PORT=$FRONTEND_PORT"
if [ -n "$SUFFIX" ]; then
  echo "  cookie suffix: _${SUFFIX}"
else
  echo "  cookie suffix: (none — this is the main repo)"
fi
