#!/bin/bash
# Add one kernel build to docs/Benchmarks/data/kernel-timeline.json.
#
#   1. Describe the build in builds.json (id, sha, version, label, kind, date, subject), in release order.
#   2. From the repo root:  Typescript/tests/Benchmarks/timeline/add-version.sh <id> [rounds] [anchor ids...]
#
# It builds dist/ for the new commit and for the anchors (default: 2a173b7 and the newest release already in the
# file), each in its own git worktree under $TL_WORK (default /tmp/me-timeline-builds), runs run-timeline.sh on all
# of them interleaved, and calls `timeline.py append`, which only writes when the anchors still match the stored
# medians (±15%). If they do not (other machine, other load), re-run every build in builds.json the same way and
# use `timeline.py build` instead; the README has the command.
# Set TL_NODE_MODULES to an existing Typescript/node_modules to symlink it instead of running npm ci per build;
# TL_JSON / TL_RAW override the data file and the raw output (e.g. for a dry run on a copy).
set -euo pipefail
ID=$1; R=${2:-6}; shift $(( $# >= 2 ? 2 : 1 )); ANCH=("$@")
HERE="$(cd "$(dirname "$0")" && pwd)"; REPO="$(git -C "$HERE" rev-parse --show-toplevel)"
JSON=${TL_JSON:-$REPO/docs/Benchmarks/data/kernel-timeline.json}; WORK=${TL_WORK:-/tmp/me-timeline-builds}; mkdir -p "$WORK"
sha_of() { python3 -c "import json,sys; print({b['id']:b['sha'] for b in json.load(open('$HERE/builds.json'))['builds']}['$1'])"; }
if [ ${#ANCH[@]} -eq 0 ]; then
  ANCH=(2a173b7 "$(python3 -c "import json; print([b['id'] for b in json.load(open('$JSON'))['builds'] if b['kind']=='release'][-1])")")
fi
build() { # <sha> -> path of dist/index.js
  local d="$WORK/$1"
  [ -d "$d" ] || git -C "$REPO" worktree add -q --detach "$d" "$1"
  if [ ! -e "$d/Typescript/node_modules" ]; then
    if [ -n "${TL_NODE_MODULES:-}" ]; then ln -s "$TL_NODE_MODULES" "$d/Typescript/node_modules"; else (cd "$d/Typescript" && npm ci --no-audit --no-fund >&2); fi
  fi
  [ -f "$d/Typescript/dist/index.js" ] || (cd "$d/Typescript" && npx vite build --config vite.config.ts >&2)
  echo "$d/Typescript/dist/index.js"
}
ARGS=()
for id in "$ID" "${ANCH[@]}"; do ARGS+=("$id=$(build "$(sha_of "$id")")"); done
RAW=${TL_RAW:-$HERE/raw/$(date +%F)-$ID.jsonl}; mkdir -p "$(dirname "$RAW")"
"$HERE/run-timeline.sh" "$RAW" "$R" "${ARGS[@]}"
python3 "$HERE/timeline.py" append --raw "$RAW" --json "$JSON" --build "$ID"
