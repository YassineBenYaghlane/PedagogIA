#!/usr/bin/env bash
# Bring up or tear down an isolated docker compose stack for E2E parallel runs.
#
# Each stack is addressed by a small integer STACK_ID (1, 2, 3, ...).
# Ports are computed as BASE+ID so stacks never collide with each other or
# with the dev stack (ID 0 by convention).
#
# Usage:
#   stack.sh up   <STACK_ID>
#   stack.sh down <STACK_ID>
#   stack.sh url  <STACK_ID>   # prints "http://localhost:<FRONTEND_PORT>"
set -euo pipefail

ACTION="${1:?action required: up|down|url}"
ID="${2:?stack id required}"

BASE_DB=5411
BASE_BACKEND=8000
BASE_FRONTEND=5173

export POSTGRES_PORT=$((BASE_DB + ID))
export BACKEND_PORT=$((BASE_BACKEND + ID))
export FRONTEND_PORT=$((BASE_FRONTEND + ID))
export POSTGRES_DB="${POSTGRES_DB:-ceb}"
export POSTGRES_USER="${POSTGRES_USER:-ceb}"
export POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-ceb}"
export CORS_ORIGINS="[\"http://localhost:${FRONTEND_PORT}\"]"

PROJECT="pedagogia-e2e-${ID}"
REPO_ROOT="$(git rev-parse --show-toplevel)"
OVERLAY="$REPO_ROOT/.claude/skills/e2e-validate-pr/scripts/e2e.compose.yml"

ensure_shared_volumes() {
  local be_img="${E2E_BACKEND_IMAGE:-pedagogia_backend}"
  local fe_img="${E2E_FRONTEND_IMAGE:-pedagogia_frontend}"
  docker volume inspect e2e_backend_venv >/dev/null 2>&1 || docker volume create e2e_backend_venv >/dev/null
  docker volume inspect e2e_frontend_node_modules >/dev/null 2>&1 || docker volume create e2e_frontend_node_modules >/dev/null
  # Prime each volume once (serially) so parallel stack boots don't race
  # on the initial copy-from-image.
  if ! docker run --rm -v e2e_backend_venv:/app/.venv "$be_img" \
       test -x /app/.venv/bin/python >/dev/null 2>&1; then
    docker run --rm -v e2e_backend_venv:/app/.venv "$be_img" true >/dev/null 2>&1 || true
  fi
  if ! docker run --rm -v e2e_frontend_node_modules:/app/node_modules "$fe_img" \
       test -d /app/node_modules/.bin >/dev/null 2>&1; then
    docker run --rm -v e2e_frontend_node_modules:/app/node_modules "$fe_img" true >/dev/null 2>&1 || true
  fi
}

case "$ACTION" in
  up)
    cd "$REPO_ROOT"
    ensure_shared_volumes
    docker compose -p "$PROJECT" -f docker-compose.yml -f "$OVERLAY" up -d >/dev/null
    ;;
  down)
    cd "$REPO_ROOT"
    docker compose -p "$PROJECT" -f docker-compose.yml -f "$OVERLAY" down -v --remove-orphans >/dev/null 2>&1 || true
    ;;
  url)
    echo "http://localhost:${FRONTEND_PORT}"
    ;;
  *)
    echo "unknown action: $ACTION" >&2
    exit 2
    ;;
esac
