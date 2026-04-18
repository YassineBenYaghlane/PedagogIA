#!/usr/bin/env bash
# e2e-validate-pr orchestrator.
# Usage: run.sh <PR_NUMBER> <GENERATED_SPEC_PATH>
#
# Boots one isolated docker compose stack (stack id 1, ports 8001/5174/5412),
# runs the PR-specific Playwright spec against it on Chromium, pushes the
# screenshots to a dated orphan branch, and posts a summary comment to the PR.
# The stack is torn down on exit (even on failure).
set -euo pipefail

PR="${1:?pr number required}"
SPEC="${2:?generated spec path required}"

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

SKILL_DIR="$REPO_ROOT/.claude/skills/e2e-validate-pr"
STACK="$SKILL_DIR/scripts/stack.sh"
STACK_ID="${E2E_STACK_ID:-1}"

log()  { printf '\n\033[1;34m[e2e-validate-pr]\033[0m %s\n' "$*"; }
die()  { printf '\n\033[1;31m[e2e-validate-pr ERROR]\033[0m %s\n' "$*" >&2; exit 1; }

teardown() {
  log "Tearing down stack $STACK_ID"
  bash "$STACK" down "$STACK_ID" || true
}
trap teardown EXIT

# --- 1. checkout PR
log "Checking out PR #$PR"
gh pr checkout "$PR" >/dev/null

# --- 2. boot the isolated stack
log "Booting docker stack $STACK_ID (ports 8001/5174/5412)"
bash "$STACK" up "$STACK_ID"

# --- 3. wait for backend + frontend to be responsive
WAIT_TIMEOUT="${E2E_WAIT_TIMEOUT:-360}"
wait_url() {
  local url="$1" project="$2" component="$3" deadline=$((SECONDS + WAIT_TIMEOUT))
  until curl -fs "$url" >/dev/null 2>&1; do
    if (( SECONDS > deadline )); then
      log "$project $component not ready at $url after ${WAIT_TIMEOUT}s — recent logs:"
      docker compose -p "$project" logs --tail 40 "$component" 2>&1 || true
      die "$project $component did not become ready"
    fi
    sleep 3
  done
}
PROJECT="pedagogia-e2e-${STACK_ID}"
wait_url "http://localhost:$((8000 + STACK_ID))/api/health/" "$PROJECT" backend
wait_url "http://localhost:$((5173 + STACK_ID))/" "$PROJECT" frontend
log "Stack ready"

# --- 4. run playwright on chromium only
SHOT_DIR="$REPO_ROOT/frontend/e2e/screenshots/pr-$PR"
RESULTS_DIR="test-results/pr-$PR"
JSON_OUT="$REPO_ROOT/frontend/test-results/pr-$PR.json"
mkdir -p "$SHOT_DIR" "$(dirname "$JSON_OUT")"
export E2E_SHOT_DIR="$SHOT_DIR"
export E2E_PARALLEL=1
export PLAYWRIGHT_JSON_OUTPUT_FILE="$JSON_OUT"

cd frontend
log "Running Playwright on Chromium against stack $STACK_ID"
set +e
npx playwright test "$SPEC" \
  --project=chromium \
  --reporter=list,json \
  --output="$RESULTS_DIR"
TEST_EXIT=$?
set -e
cd "$REPO_ROOT"

# --- 5. summary + screenshot branch + PR comment
SUMMARY=/tmp/pr-${PR}-summary.md
GIST_MAP=/tmp/pr-${PR}-gist.json

log "Collecting results"
python3 "$SKILL_DIR/scripts/collect_results.py" \
  --pr "$PR" --shots "$SHOT_DIR" --json "$JSON_OUT" --out "$SUMMARY"

log "Publishing screenshots to an orphan branch"
bash "$SKILL_DIR/scripts/upload_screenshots.sh" "$PR" "$SHOT_DIR" "$GIST_MAP"

log "Rewriting summary with public screenshot URLs"
python3 "$SKILL_DIR/scripts/collect_results.py" \
  --pr "$PR" --shots "$SHOT_DIR" --json "$JSON_OUT" \
  --out "$SUMMARY" --gist-map "$GIST_MAP"

log "Posting PR comment"
gh pr comment "$PR" --body-file "$SUMMARY"

# --- 6. cleanup ephemeral artifacts (stack torn down by trap)
log "Cleaning generated artifacts"
rm -f "$SPEC" "$JSON_OUT"
rm -rf "frontend/$RESULTS_DIR"

if (( TEST_EXIT != 0 )); then
  log "Tests had failures — comment posted with results"
  exit "$TEST_EXIT"
fi
log "Done"
