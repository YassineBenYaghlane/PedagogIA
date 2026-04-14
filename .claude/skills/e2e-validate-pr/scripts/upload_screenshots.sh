#!/usr/bin/env bash
# Publish screenshots so they render inline in GitHub PR comments.
#
# `gh gist create` refuses binary files, and GitHub's public image-upload
# endpoint isn't accessible to the CLI. Pushing the PNGs to an orphan
# branch and referencing them via raw.githubusercontent.com is the
# dependency-free path that renders inline in markdown.
#
# Writes:
#   { "<filename>": "<raw_url>", "__gist_url__": "<branch tree url>" }
# to $3 (the key name is kept for compatibility with collect_results.py).
#
# Usage: upload_screenshots.sh <PR> <SHOT_DIR> <OUT_JSON>
set -euo pipefail

PR="${1:?pr required}"
SHOT_DIR="${2:?shot dir required}"
OUT_JSON="${3:?output json path required}"

shopt -s nullglob
PNGS=( "$SHOT_DIR"/*.png )
if (( ${#PNGS[@]} == 0 )); then
  echo "{}" > "$OUT_JSON"
  exit 0
fi

NWO=$(gh repo view --json nameWithOwner --jq .nameWithOwner)
BRANCH="e2e-runs/pr-${PR}-$(date -u +%Y%m%dT%H%M%SZ)"
WORK=$(mktemp -d)
trap 'rm -rf "$WORK"' EXIT

cp "${PNGS[@]}" "$WORK/"
git -C "$WORK" -c init.defaultBranch=main init -q
git -C "$WORK" -c user.email="e2e-bot@local" -c user.name="e2e-validate-pr" add .
git -C "$WORK" -c user.email="e2e-bot@local" -c user.name="e2e-validate-pr" \
  commit -q -m "e2e screenshots for PR #$PR"
git -C "$WORK" branch -M "$BRANCH"

TOKEN=$(gh auth token)
git -C "$WORK" push -q "https://x-access-token:${TOKEN}@github.com/${NWO}.git" "$BRANCH"

TREE_URL="https://github.com/${NWO}/tree/${BRANCH}"

python3 - "$NWO" "$BRANCH" "$TREE_URL" "$OUT_JSON" "${PNGS[@]}" <<'PY'
import json, os, sys, urllib.parse
nwo, branch, tree_url, out_path, *pngs = sys.argv[1:]
mapping = {"__gist_url__": tree_url}
for p in pngs:
    name = os.path.basename(p)
    path = urllib.parse.quote(branch, safe="") + "/" + urllib.parse.quote(name)
    mapping[name] = f"https://raw.githubusercontent.com/{nwo}/{path}"
with open(out_path, "w") as f:
    json.dump(mapping, f, indent=2)
PY

echo "Pushed ${#PNGS[@]} screenshots to branch ${BRANCH}"
