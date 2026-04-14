#!/usr/bin/env bash
# e2e-validate-pr orchestrator.
# Usage: run.sh <PR_NUMBER> <GENERATED_SPEC_PATH>
#
# Boots three isolated docker compose stacks (one per browser), runs the
# PR-specific Playwright spec against them in parallel, uploads screenshots
# to a gist, and posts a summary comment to the PR.
set -euo pipefail

PR="${1:?pr number required}"
SPEC="${2:?generated spec path required}"

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

SKILL_DIR="$REPO_ROOT/.claude/skills/e2e-validate-pr"
STACK="$SKILL_DIR/scripts/stack.sh"
STACK_IDS=(1 2 3)

log()  { printf '\n\033[1;34m[e2e-validate-pr]\033[0m %s\n' "$*"; }
die()  { printf '\n\033[1;31m[e2e-validate-pr ERROR]\033[0m %s\n' "$*" >&2; exit 1; }

teardown() {
  log "Tearing down parallel stacks"
  for id in "${STACK_IDS[@]}"; do
    bash "$STACK" down "$id" &
  done
  wait
}
trap teardown EXIT

# --- 1. checkout PR
log "Checking out PR #$PR"
gh pr checkout "$PR" >/dev/null

# --- 2. boot 3 isolated stacks in parallel
log "Booting ${#STACK_IDS[@]} parallel docker stacks"
for id in "${STACK_IDS[@]}"; do
  bash "$STACK" up "$id" &
done
wait

# --- 3. wait for each stack's backend + frontend
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
for id in "${STACK_IDS[@]}"; do
  project="pedagogia-e2e-${id}"
  wait_url "http://localhost:$((8000 + id))/api/health/" "$project" backend
  wait_url "http://localhost:$((5173 + id))/" "$project" frontend
done
log "All stacks ready"

# --- 4. run playwright against the 3 stacks
SHOT_DIR="$REPO_ROOT/frontend/e2e/screenshots/pr-$PR"
RESULTS_DIR="test-results/pr-$PR"
JSON_OUT="$REPO_ROOT/frontend/test-results/pr-$PR.json"
mkdir -p "$SHOT_DIR" "$(dirname "$JSON_OUT")"
export E2E_SHOT_DIR="$SHOT_DIR"
export E2E_PARALLEL=1
export PLAYWRIGHT_JSON_OUTPUT_FILE="$JSON_OUT"

cd frontend
log "Running Playwright (chromium→stack1 · firefox→stack2 · webkit→stack3)"
set +e
npx playwright test "$SPEC" \
  --reporter=list,json \
  --output="$RESULTS_DIR"
TEST_EXIT=$?
set -e
cd "$REPO_ROOT"

# --- 5. summary + gist + PR comment
SUMMARY=/tmp/pr-${PR}-summary.md
GIST_MAP=/tmp/pr-${PR}-gist.json

log "Collecting results"
python3 "$SKILL_DIR/scripts/collect_results.py" \
  --pr "$PR" --shots "$SHOT_DIR" --json "$JSON_OUT" --out "$SUMMARY"

log "Uploading screenshots"
bash "$SKILL_DIR/scripts/upload_screenshots.sh" "$PR" "$SHOT_DIR" "$GIST_MAP"

log "Rewriting summary with gist URLs"
python3 "$SKILL_DIR/scripts/collect_results.py" \
  --pr "$PR" --shots "$SHOT_DIR" --json "$JSON_OUT" \
  --out "$SUMMARY" --gist-map "$GIST_MAP"

log "Posting PR comment"
gh pr comment "$PR" --body-file "$SUMMARY"

# --- 6. cleanup ephemeral artifacts (stacks torn down by trap)
log "Cleaning generated artifacts"
rm -f "$SPEC" "$JSON_OUT"
rm -rf "frontend/$RESULTS_DIR"

if (( TEST_EXIT != 0 )); then
  log "Tests had failures — comment posted with results"
  exit "$TEST_EXIT"
fi
log "Done"
