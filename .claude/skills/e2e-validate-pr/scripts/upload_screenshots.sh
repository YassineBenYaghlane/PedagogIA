#!/usr/bin/env bash
# Upload screenshots in a directory to a single GitHub Gist and write
# { "<filename>": "<raw_url>", "__gist_url__": "<gist_html_url>" } to $3.
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

DESC="E2E validation artifacts for PR #$PR"
GIST_URL=$(gh gist create --desc "$DESC" "${PNGS[@]}")
GIST_ID="${GIST_URL##*/}"

python3 - "$GIST_ID" "$GIST_URL" "$OUT_JSON" "${PNGS[@]}" <<'PY'
import json, subprocess, sys
gist_id, gist_url, out_path, *pngs = sys.argv[1:]
raw = subprocess.check_output(["gh", "api", f"gists/{gist_id}"], text=True)
data = json.loads(raw)
mapping = {"__gist_url__": gist_url}
for fname, meta in data.get("files", {}).items():
    mapping[fname] = meta.get("raw_url")
with open(out_path, "w") as f:
    json.dump(mapping, f, indent=2)
PY

echo "Uploaded ${#PNGS[@]} screenshots to $GIST_URL"
