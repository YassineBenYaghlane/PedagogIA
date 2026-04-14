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

case "$ACTION" in
  up)
    cd "$REPO_ROOT"
    docker compose -p "$PROJECT" up -d >/dev/null
    ;;
  down)
    cd "$REPO_ROOT"
    docker compose -p "$PROJECT" down -v --remove-orphans >/dev/null 2>&1 || true
    ;;
  url)
    echo "http://localhost:${FRONTEND_PORT}"
    ;;
  *)
    echo "unknown action: $ACTION" >&2
    exit 2
    ;;
esac
