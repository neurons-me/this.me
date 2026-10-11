# Kernel timeline

The data behind the "Cost across kernel versions" chart on the Kernel benchmarks page
([docs/Benchmarks/benchmarks.md](../../../../docs/Benchmarks/benchmarks.md)): the same handful of benchmarks measured on
every kernel build in release order, on one machine, in interleaved rounds, so a line moving up or down is the kernel and
not the machine.

| file | what it is |
|---|---|
| `timeline.mjs` | the harness: `node timeline.mjs <path/to/Typescript/dist/index.js>` prints one JSON line of medians for one build. Each scenario copies the loop of a benchmark file (#3 shape, Extreme Fan-Out, #6, #7, #9, #10, #11) at one size on a fresh `ME`. The same file runs on every build. |
| `run-timeline.sh` | runs `timeline.mjs` on several builds, `R` rounds, each round in a shuffled order, one fresh `node` per run; appends to a `raw.jsonl` |
| `builds.json` | the builds in release order: id, commit, version, label, kind (`release`, `commit`, `unreleased`), date, subject, and the npm version whose `dist/me.es.js` is byte-identical, when there is one |
| `annotations.json` | the steps worth explaining: build, commits, title, plain-language reason |
| `timeline.py` | `build` (raw runs → `docs/Benchmarks/data/kernel-timeline.json`), `append` (add one build, checked against anchors), `annotate` (reload annotations only), `steps` (print the change between consecutive builds) |
| `add-version.sh` | builds a commit's `dist/` in a worktree and appends it, re-measuring two anchor builds in the same run |
| `raw/` | the raw runs the JSON was built from |

## Series

| key | benchmark | what one sample is | k |
|---|---|---|---|
| `fanout2000_write` | Extreme Fan-Out | one write to `master`, 2,000 dependents (`value * master`), write only; p50 of 60 | 2,000 |
| `b6_1000`, `b6_5000` | #6 | write + read, p50 of 120 | 1,000 / 5,000 |
| `b7_1000_steady` | #7 | `[i]` broadcast formula over 1,000 nodes, steady write + read, mean of 80 | 1,000 |
| `b10_eager_1000_write` | #10 | eager mode, fan-out 1,000, write only, p50 of 150 | 1,000 |
| `b9_public`, `b9_secret` | #9 | lazy, 600 nodes, write + read on the public plane / a secret branch, p50 of 120 | |
| `b11_secret_read` | #11 | lazy, 600 nodes, secret plane, first read after a write, p50 of 120 | |
| `single_write` | #3 shape | `[i]` formulas over 2,000 nodes: write one input + read, p50 of 350 after 50 warm-up writes | |
| `plain_write` | #3 shape | write to a path no formula reads, p50 of 350 | |
| `first_write` | 1–4 style | the first write after building 2,000 nodes: one sample per run | |

`first_write` is the number benchmarks 1–4 report (one write right after the build). It is dominated by first-write
warm-up (the first formula compile and JIT on a fresh kernel), not by the cost of a write, so the chart hides it by
default and marks it ⚠; `single_write` is the per-write cost.

**Comparable builds.** 3.9.1 resolves references wrongly in the 5–11 shapes and recomputes nothing there, so its
fan-out, #7, #9, #10 and #11 values are stored with `"comparable": false` and not drawn; those lines start at
2a173b7 (4.0.2 + the reference fix, the build behind the published 5–11 numbers). A value whose recorded `k`
differs from the expected k is also marked not comparable. The relative view divides by each line's first comparable
build.

Numbers from `timeline.mjs` are close to, but not the same as, the full benchmark files: those run several sizes in
one process first (warmer JIT). Compare builds inside the timeline, not timeline values with the tables.

## Rebuild from scratch (all builds, same machine)

```bash
# one dist per build (any way you like; e.g. git worktree add --detach /tmp/b/<sha> <sha> && npm run build there)
Typescript/tests/Benchmarks/timeline/run-timeline.sh raw.jsonl 6 \
  1bc5227=/tmp/b/1bc5227/Typescript/dist/index.js 2a173b7=/tmp/b/2a173b7/Typescript/dist/index.js ...
python3 Typescript/tests/Benchmarks/timeline/timeline.py build --raw raw.jsonl \
  --out docs/Benchmarks/data/kernel-timeline.json --machine "<cpu, RAM>" --node "Node <version>"
```

About 35 s per build per round on an 8-vCPU Xeon VM (14 builds × 6 rounds ≈ 50 min).

## Add a version

1. Add the build to `builds.json`, in release order (`kind: "release"` once it is on npm; `"unreleased"` for a branch,
   drawn as a dashed segment).
2. Run, from the repo root:

   ```bash
   Typescript/tests/Benchmarks/timeline/add-version.sh <id> 6
   ```

   It builds `dist/` for the new commit and for two anchors (2a173b7 and the newest release already in the file) in
   worktrees under `$TL_WORK` (default `/tmp/me-timeline-builds`; `TL_NODE_MODULES=<path>` symlinks an existing
   `node_modules` instead of `npm ci`), runs them interleaved, and calls
   `timeline.py append`. The append only writes if every anchor's median on the main series is within ±15% of the
   stored value; otherwise the machine is not comparable to the stored run, nothing is written, and the whole timeline
   has to be re-run (above). Use the default 6 rounds: a dry run with 1 round (2026-10-10, same machine, dists
   byte-identical to the stored ones) moved the 2a173b7 steady single write from 0.055 to 0.093 ms and was refused.
3. If the new build moves a line, add an entry to `annotations.json` (`at`, `commits`, `title`, `text`) and run
   `timeline.py annotate --json docs/Benchmarks/data/kernel-timeline.json` (numbers untouched). `timeline.py steps --json …` prints the change
   between consecutive builds and marks with `*` the steps where the min–max ranges do not overlap.
