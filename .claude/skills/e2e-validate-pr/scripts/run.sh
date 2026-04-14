#!/usr/bin/env bash
# e2e-validate-pr orchestrator.
# Usage: run.sh <PR_NUMBER> <GENERATED_SPEC_PATH>
set -euo pipefail

PR="${1:?pr number required}"
SPEC="${2:?generated spec path required}"

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

log() { printf '\n\033[1;34m[e2e-validate-pr]\033[0m %s\n' "$*"; }
die() { printf '\n\033[1;31m[e2e-validate-pr ERROR]\033[0m %s\n' "$*" >&2; exit 1; }

# --- 1. checkout PR
log "Checking out PR #$PR"
gh pr checkout "$PR" >/dev/null

# --- 2. bring stack up
log "Starting docker compose stack"
docker compose up -d >/dev/null

# --- 3. wait for services
wait_for() {
  local url="$1" name="$2" deadline=$((SECONDS + 60))
  until curl -fs "$url" >/dev/null 2>&1; do
    (( SECONDS > deadline )) && die "$name not ready at $url after 60s"
    sleep 2
  done
  log "$name ready"
}
wait_for http://localhost:8000/api/health/ backend
wait_for http://localhost:5173/ frontend

# --- 4. ensure browsers installed
log "Ensuring Playwright browsers installed"
cd frontend
if ! npx playwright install --dry-run chromium firefox webkit 2>&1 | grep -q "All browsers.*already installed"; then
  npx playwright install --with-deps chromium firefox webkit
fi

# --- 5. run tests
SHOT_DIR="$REPO_ROOT/frontend/e2e/screenshots/pr-$PR"
RESULTS_DIR="test-results/pr-$PR"
mkdir -p "$SHOT_DIR"
export E2E_SHOT_DIR="$SHOT_DIR"

log "Running Playwright across chromium/firefox/webkit"
set +e
npx playwright test "$SPEC" \
  --reporter=list,json \
  --output="$RESULTS_DIR"
TEST_EXIT=$?
set -e

# Playwright writes JSON to stdout of the `json` reporter unless redirected; use env for a fixed path.
# We re-run parsing against the HTML report's results.json if needed; easiest is to ask Playwright directly:
# But by default `json` reporter prints to stdout. Route it via PLAYWRIGHT_JSON_OUTPUT_FILE (v1.40+).
: "${PLAYWRIGHT_JSON_OUTPUT_FILE:=$PWD/test-results/pr-$PR.json}"

# --- 6. collect markdown summary
cd "$REPO_ROOT"
log "Collecting results"
SUMMARY=/tmp/pr-${PR}-summary.md
GIST_MAP=/tmp/pr-${PR}-gist.json

python3 .claude/skills/e2e-validate-pr/scripts/collect_results.py \
  --pr "$PR" \
  --shots "$SHOT_DIR" \
  --json "frontend/test-results/pr-$PR.json" \
  --out "$SUMMARY" \
  --screenshot-list /tmp/pr-${PR}-shots.txt

# --- 7. upload screenshots to gist
log "Uploading screenshots to gist"
bash .claude/skills/e2e-validate-pr/scripts/upload_screenshots.sh \
  "$PR" "$SHOT_DIR" "$GIST_MAP"

# --- 8. substitute gist URLs into summary
python3 .claude/skills/e2e-validate-pr/scripts/collect_results.py \
  --pr "$PR" \
  --shots "$SHOT_DIR" \
  --json "frontend/test-results/pr-$PR.json" \
  --out "$SUMMARY" \
  --gist-map "$GIST_MAP"

# --- 9. post PR comment
log "Posting PR comment"
gh pr comment "$PR" --body-file "$SUMMARY"

# --- 10. cleanup
log "Cleaning up generated artifacts"
rm -f "$SPEC"
rm -rf "frontend/test-results/pr-$PR" "frontend/test-results/pr-$PR.json"

if (( TEST_EXIT != 0 )); then
  log "Tests had failures — comment posted with results"
  exit "$TEST_EXIT"
fi
log "Done"
