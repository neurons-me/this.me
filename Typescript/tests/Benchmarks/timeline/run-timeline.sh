#!/bin/bash
# Run timeline.mjs on several builds, interleaved: in each round every build runs
# once, in a shuffled order (seeded by the round number), each in a fresh node process.
# usage: run-timeline.sh <raw.jsonl> <rounds> <label>=<path/to/Typescript/dist/index.js> ...
# appends one line per run: {"label":..,"round":..,"at":..,"m":{...metrics}}
set -e
H="$(cd "$(dirname "$0")" && pwd)/timeline.mjs"
OUT=$1; R=$2; shift 2; BUILDS=("$@")
for r in $(seq 1 "$R"); do
  for b in $(printf '%s\n' "${BUILDS[@]}" | shuf --random-source=<(yes "$r")); do
    label=${b%%=*}; dist=${b#*=}
    m=$(node "$H" "$dist")
    printf '{"label":"%s","round":%d,"at":"%s","m":%s}\n' "$label" "$r" "$(date -Iseconds)" "$m" >> "$OUT"
  done
  echo "round $r done $(date +%T)"
done
echo DONE
