# GTFS-Madrid → .me (experimental)

Measure **dependency propagation** in `.me` (k, recomputed, changed, sourcePath, latency) under GTFS-like CREATE / UPDATE / DELETE mutations.

**Not** an RML/RDF materialization benchmark. We reuse Van Assche’s mutation *types* and GTFS Madrid data shape; an adapter maps entities into `.me` paths + derived expressions.

## Citation

Dylan Van Assche et al., *Incremental Knowledge Graph Construction from Heterogeneous Data Sources* (IncRML / Semantic Web Journal).  
Uses a change-aware extension of **GTFS-Madrid-Bench** (Chaves-Fraga et al., 2020). Mutation classes: **CREATE** (additions), **UPDATE** (modifications), **DELETE** (deletions).

- Paper: https://dylanvanassche.be/assets/pdf/swj2025-incremental-knowledge-graph-construction-from-heterogeneous-data-sources.pdf  
- Resources: https://zenodo.org/records/14038823  
- GTFS-Madrid-Bench: https://github.com/oeg-upm/gtfs-bench

## Results at a glance: this.me 4.2.1 (measured 2026-10-13 UTC)

Run line: `this.me@4.2.1` (published npm build, `dist/me.es.js` sha256 `0bd2cc60d15dfc9ff8942d390c075bbc22b4ae3a24d3cbfe581511ea84478757`), Node v22.23.3, same shared KVM VM as the 4.2.0 run. k is identical to 4.2.0 and 4.1.0 for every write.

| scale | writes | k p50 / p95 / max | write p50 / p95 | CREATE p50 | DELETE p50 | load |
|---|---:|---|---|---:|---:|---:|
| 1 | 151 | 1 / 18.5 / 27 | 0.23 / 9.4 | 0.20 | 8.9 | 494 |
| 10 | 1,304 | 1 / 18 / 27 | 0.21 / 122 | 0.20 | 119 | 4,244 |

Skew (S1, scale 10, 22 runs): UPDATE apply ≈ 0.045 ms + 35.2 µs·k (r = 0.991; 4.2.0: 52 µs), trip DELETE ≈ 111 ms + 49 µs·k (4.2.0: 135 ms + 67 µs), worst DELETE 842 ms (4.2.0: 1.2 s), CREATE on the 14,378-member sum 95 ms (4.2.0: 151 ms). Bracket `[]` counts: CREATE p50 3.3 / 42 ms at scale 1 / 10, load 63 s at scale 10. Results: `results/v4.2.1/{explicit,bracket}/`, `results/skew/v4.2.1/explicit/`. Scale 100 not re-run (4.1.0 history).

## Results at a glance (this.me 4.2.0, measured 2026-10-10; history)

Run line (also recorded inside every results file): `this.me@4.2.0` (published npm build, `dist/me.es.js` sha256 `8cc94d52…`), Node v22.23.3, shared KVM VM (Intel Xeon, 8 vCPU, 16 GiB), Linux 6.12 x64. The 4.1.0 rows were re-run on the same machine the same day; the 2026-10-07 skew results and the scale-100 sweep are 4.1.0 history (sections below).

**k vs n (base→seed0, VIG scales).** k = `explain(probe).meta.k`, the number of derived values recomputed by one write. Write time = `mutationApplyMs` (the write, including its eager propagation wave). Times in ms.

| scale | stop_times | writes | k p50 / p95 / max | write p50 / p95 4.2.0 | write p50 / p95 4.1.0 | DELETE p50 4.2.0 / 4.1.0 | CREATE p50 4.2.0 / 4.1.0 | load 4.2.0 / 4.1.0 |
|---|---:|---:|---|---|---|---|---|---|
| 1 | 2,364 | 151 | 1 / 18.5 / 27 | 0.30 / 9.5 | 0.27 / 9.5 | 9.2 / 9.3 | 0.24 / 0.22 | 476 / 457 |
| 10 | 23,640 | 1,304 | 1 / 18 / 27 | 0.23 / 165 | 0.22 / 181 | 144 / 171 | 0.21 / 0.20 | 4,730 / 4,414 |
| 100 | 236,400 | 13,401 | 1 / 18 / 27 | not re-run | 4.1.0 only (`scale1-vs-scale10-vs-scale100-summary.md`) | | | |

k is identical on 4.1.0 and 4.2.0 for every write; times are within run-to-run noise except DELETE, which is still a store scan (below).

**Fan-out skew (S1, scale 10, 22 runs).** Same k as 4.1.0 for every variant (the generator and workload did not change). Highlights from `results/skew/v4.2.0/explicit/scale10-skew-sweep.md`:

- UPDATE (service flip) apply ≈ 0.05 ms + 52 µs·k (r = 0.98, n = 1,100). The largest wave, a service with 801 trips (k = 801), took 52 ms at worst, about 100× less than the ~5 s rebuild. **That ~100× is the worst case measured**, not the typical ratio. For the ordinary seed0 UPDATEs, rebuild ÷ apply p50 is 6,800–25,000× (4.1.0: 47 ms, ~110×, and 7,600–31,000×).
- CREATE (idx slot 0→1, k = 1) costs the width of the parent's sum: 0.10 ms p50 at ≤ 30 members, 151 ms at 14,378 (4.1.0: 183 ms).
- **DELETE worst case:** every `me["-"]` scans the store, about 130–146 ms p50 at scale 10 whatever k is (9 ms at scale 1), plus ~67 µs per k. The worst DELETE measured on 4.2.0 is 1.2 s (the 14,378-stop_time hub trip, k = 14,378), still under the ~5 s rebuild. On 4.1.0 (2026-10-07) the worst was a 16.3 s GC-related stall on a k = 18 DELETE (not reproduced, see caveats); no multi-second stall occurred in the 4.2.0 run.
- `explain()` size ≈ 1.9 KB + 56 B·k for service flips; 1.6 MB for the hub delete.

**4.2.0 collection aggregate `[]` (variant `GTFS_AGG=bracket`).** The `*Count` aggregates written as `gtfs.idx.trips.<t>.stopTimeMember[].on` (slots become `<slot>.on`) give the same k for every write, but each CREATE re-scans: 3.5 ms p50 at scale 1 and 50 ms at scale 10 (explicit sums: 0.21 ms), and loading scale 10 takes 71 s instead of 4.7 s. Results in `results/v4.2.0/bracket/`. The skew sweep was not run in this mode (it would take hours at that cost). Note: inside a formula, the `[]` reference had to be the absolute path; a path relative to the derived node's scope resolved as `missing-input`.

## Files

| file | what |
|---|---|
| `adapter.ts` | GTFS rows → `.me` paths and derived expressions; `gtfs.idx` membership slots and `*Count` aggregates (`GTFS_AGG=bracket` for the 4.2 `[]` form) |
| `load-real.ts` | loads `data/scale{N}/{base,seed0}` CSVs (GTFS ids → stable path-safe ids) |
| `workload.ts`, `benchmark.ts` | synthetic workload and the original benchmark entry (`--sweep-only` runs the scale-1 sweep) |
| `sweep-seed0.ts` | base→seed0 sweep; exports `buildMeasurablePlan`, `measureOne`, `dist`, `percentile` |
| `run-env.ts` | the run line (kernel version via `ME_VERSION`, dist sha256, Node, CPU, memory, OS, aggregate style) |
| `skew/generate-skew.ts`, `skew/sweep-skew.ts`, `skew/report-skew.ts` | S1 fan-out skew: generator, sweep, report |
| `results/scale1-*`, `results/scale1-vs-scale10*-summary.*` | 4.1.0 history (earlier runs; scale 100 only exists here) |
| `results/v4.2.1/{explicit,bracket}/scale{1,10}-base-seed0-sweep.*` | 4.2.1 sweeps, 2026-10-13 |
| `results/v4.2.0/{explicit,bracket}/scale{1,10}-base-seed0-sweep.*` | 4.2.0 sweeps, 2026-10-10 |
| `results/v4.1.0-same-machine/scale{1,10}-base-seed0-sweep.*` | 4.1.0 re-run on the same machine, 2026-10-10 |
| `results/skew/scale10-fanout.json`, `results/skew/reference-madrid-seed-fanout.json` | fan-out of the generated variants and of the original Madrid seed (kernel-independent) |
| `results/skew/v4.2.1/explicit/scale10-skew-sweep.{md,json,tsv}` | S1 on 4.2.1, 2026-10-13 |
| `results/skew/v4.2.0/explicit/scale10-skew-sweep.{md,json,tsv}` | S1 on 4.2.0, 2026-10-10 |
| `results/skew/v4.1.0/` | S1 on 4.1.0, 2026-10-07 (history), with `diagnostics/` (the `--trace-gc` rerun) |

Per-run JSON (`results/skew/runs/`, ~14 MB per sweep) is gitignored; the `.tsv` next to each report has one line per measured write.

## Cross-branch dependencies (what worked)

`.me` resolves each formula identifier **relative to the derived node’s scope first, then from the root** (`refCandidatePaths` / `tryResolveEvalTokenValue`).

So from `gtfs.trips.T1`, the expression `gtfs.services.S1.active`:

1. tries `gtfs.trips.T1.gtfs.services.S1.active` (miss)
2. falls back to root `gtfs.services.S1.active` (hit)

That absolute dotted form is the supported cross-branch edge. `explain().meta.sourcePath` then names the **original mutation path**.

Synthetic edges in this mini:

| Derived | Formula | Mutation source |
|---------|---------|-----------------|
| `gtfs.services.S1.active` | `(mon\|\|…\|\|sun) && startDate>0 && endDate>=startDate` | UPDATE day/date fields |
| `gtfs.trips.T1.live` | `gtfs.services.S1.active` | UPDATE day/date → active |
| `gtfs.stopTimes.T1_*_<stopId>.routeId` | `gtfs.trips.T1.routeId` | UPDATE trip.routeId |
| `gtfs.trips.T1.validRoute` | `gtfs.routes.R1.active` | DELETE route via `me["-"]` → ABSENCE |
| `gtfs.idx.routes.R.tripCount` | sum(`tripMember.*`) | CREATE trip flips membership 0→1 |
| `gtfs.idx.trips.T.stopTimeCount` | sum(`stopTimeMember.*`) | CREATE stopTime flips membership 0→1 |
| `gtfs.idx.routeCount` / `serviceCount` | sum(members) | CREATE route/service |


### CREATE honesty (idx membership, not natural GTFS CREATE)

**CREATE has no prior dependency edge** in a plain GTFS entity graph: a brand-new route/trip/stopTime is not yet referenced by any derived formula, so a naïve insert would show **k = 0**. This benchmark therefore **models creation via explicit membership / index slots** under `gtfs.idx` (pre-seeded `0` for seed-only ids, `1` for base members) with parent `*Count` sum aggregates. Flipping a slot `0→1` when a member enters the set produces a **measurable invalidation wave**. Report CREATE k as that membership/aggregate wave — **not** as “natural GTFS CREATE k=1”. Semantics are intentional and documented; they are not a claim that IncRML/GTFS CREATE inherently has k=1.

### DELETE: ABSENCE vs `false`

- `active=false` (tombstone): formula still resolves → derived value is **`false`**; `sourcePath` = `gtfs.routes.R1.active`.
- Real `me["-"]("gtfs.routes.R1")`: subtree removed → formula input missing → derived value is **`undefined`** with `explain().meta.unresolved = { reason: "missing-input", inputs: [...] }`. Wave `sourcePath` names a removed route key (e.g. `gtfs.routes.R1.active`).

**stopTime keys:** `stopTimeId(trip, seq, stopId)` includes stopId so omitted/duplicate `stop_sequence` in CHANGE dumps do not collapse rows (would undercount k).

**Limitation:** `=` formulas only yield `number | boolean` (not strings). Synthetic `routeId` uses numeric codes (`1` = R1, `2` = R2). String GTFS ids stay on label fields (`routeLabel`, `label`).

No mirror/copy fields (`serviceActive`, `tripRouteId`) — dependents subscribe to the real source paths.

## Data

Put dumps under `data/` (gitignored). **Do not download multi-GB sets until needed.**

Packages from Van Assche Zenodo `10.5281/zenodo.14038823` (prefer CHANGE, not ALL):

| package | compressed | extract layout |
|---------|------------|----------------|
| `GTFS-Scale-1-CHANGE.tar.xz` | ~3.4 MB | `data/scale1/{base,seed0}/…` |
| `GTFS-Scale-10-CHANGE.tar.xz` | ~96 MB | `data/scale10/{base,seed0}/…` |
| `GTFS-Scale-100-CHANGE.tar.xz` | ~1.14 GB | `data/scale100/{base,seed0}/…` (extract ONLY base+seed0 needed tables; skip SHAPES) |

Extract only needed CSVs (`base-N-*`, `seed0-N-*` for ROUTES/TRIPS/STOP_TIMES/CALENDAR/CALENDAR_DATES) → rename to GTFS names under:

- `data/scale{N}/base/{routes,trips,stop_times,calendar,calendar_dates}.txt`
- `data/scale{N}/seed0/...`

- Loader: `load-real.ts` maps string GTFS ids → stable numeric codes (`stableNumericId`, not row index).
- Path keys use `pathSafeId` → `n<numeric>` because pure-digit / zero-padded hex segments are tokenized as numbers inside `=` formulas and break dotted cross-branch refs. Original GTFS id is kept on `.gtfsId`.

- Real smoke (auto if present): one calendar `monday` UPDATE base→seed0, measures `explain` wave; writes `results/scale1-smoke-summary.json`.

## Sweep base→seed0 (all honest mutations)

```bash
# from Typescript/
node tests/Benchmarks/GTFS-Madrid/sweep-seed0.ts --scale=1
node tests/Benchmarks/GTFS-Madrid/sweep-seed0.ts --scale=10
node tests/Benchmarks/GTFS-Madrid/sweep-seed0.ts --scale=100
# or via benchmark (scale-1):
node tests/Benchmarks/GTFS-Madrid/benchmark.ts --sweep-only
```

Diffs `data/scale{N}/base` vs `seed0`, measures mutations that map to derived edges:
day/date → `service.active` → `trip.live`, `trip.routeId` → `stopTime.routeId`,
route/trip `me["-"]` → ABSENCE, and CREATE via `gtfs.idx` membership + `*Count` aggregates
(pre-seeded 0 for seed-only ids; CREATE flips 0→1 — real wave; see CREATE honesty above).
Writes `results/scale{N}-base-seed0-sweep.{json,md,tsv}`. Set `ME_VERSION=<x.y.z>` so the run line names the kernel. Timing: `loadMs` (separate) | `mutationApplyMs` (the write, including its eager propagation wave) | `recomputeMs` (despite the name: the read-back of the probe paths after the write, not the recompute itself).

## S1: controlled fan-out skew (fixed row count)

**Question.** The scale-1 → 10 → 100 sweep left k flat (p50 = 1, p95 ≈ 18, max = 27). VIG explains why: it multiplies rows and distinct values by the same factor and fills FK columns uniformly, so every service has 26 trips and every trip 18–19 stop_times at every scale. S1 keeps the row count fixed and changes only the FK distribution, to see how k, apply time and `explain()` size respond to fan-out skew.

**Data.** Scale 10 of the Zenodo CHANGE package (130 routes, 50 services, 1,300 trips, 23,640 stop_times; 1,304 measurable base→seed0 mutations). Scale 10 is the smallest scale with enough parents for a Zipf tail (50 services, 1,300 trips; scale 1 has only 5 services). One scale-10 run takes about 1 minute here, against roughly 85 minutes for one scale-100 sweep, so 22 runs (7 variants × 3 seeds + the unmodified dump) fit in about 25 minutes.

**Generator** (`skew/generate-skew.ts`). It rewrites `trips.service_id` and `stop_times.trip_id` of `data/scale10/{base,seed0}` and leaves every other table and column alone.

- **Zipf α ∈ {0, 0.5, 1, 1.5, 2}.** Parent rank r gets a share proportional to r^−α. Counts use largest-remainder rounding, so totals are exact and α = 0 gives exactly 26 trips per service and 18–19 stop_times per trip, like VIG.
- **Hub variants.** `hub-1x50`: one service owns 50% of the trips and one trip owns 50% of the stop_times. `hub-3x75`: three parents each own 25%.
- **Determinism.** mulberry32, one stream per FK, seeds 0, 1 and 2. The seed fixes which parent gets which rank; the shape of the distribution does not depend on the seed. The same seed gives the same parent ranking for every α, so across α only the degree changes, not the identity of the hub.
- **Integrity.** Every FK points to an existing parent (checked again by the sweep: 0 dangling FKs in every base). `stop_sequence` is renumbered 1..n inside each new trip, so stop_time keys stay unique (0 duplicates). Parents left without children are reported.
- **Same workload.** seed0 gets the same mapping, keyed by `trip_id` and by the stop_time row key, so base→seed0 yields the same 1,304 mutations as the unmodified dump.
- **Cross-check.** The standalone Python version prepared for GTFS-Madrid-Bench `utils/` produces byte-identical output for all 21 variant/seed combinations.

**Sweep** (`skew/sweep-skew.ts`). Uses the `this.me` build in `Typescript/dist` exactly as `sweep-seed0.ts` does (4.1.0 on 2026-10-07, 4.2.0 on 2026-10-10); the kernel is unchanged. `sweep-seed0.ts` now exports `buildMeasurablePlan`, `measureOne`, `dist` and `percentile` and runs `main()` only when executed directly; its behaviour is otherwise unchanged (the scale-1 run reproduces the committed k values). Each variant × seed runs in its own process:

1. **seed0 workload.** Fresh load, then the plan from `buildMeasurablePlan`, measured with `measureOne`: k = `explain(probe[0]).meta.k`, apply time = `mutationApplyMs`. The recompute is eager, so the wave runs inside the write.
2. **Rebuild baseline.** A second fresh `new ME()` plus load and wiring of the aggregates, then one read of every derived value (27,720 paths).
3. **Fan-out census** on that instance, because the seed0 delta hits hubs only by chance:
   - one write per service that flips `active` (k = 1 + trips of that service);
   - a `gtfs.idx` slot flip 0→1 on the 5 widest and 5 median trips (CREATE-equivalent, k = 1);
   - `me["-"]` on the 10 widest trips plus 40 seeded-random trips.

   Every measured write also records the JSON size and latency of `explain(probe[0])`.

### How to run

```bash
# from Typescript/. Needs Node ≥ 22.6 (type stripping for .ts) and Typescript/dist (the published build: npm pack this.me@4.2.0, copy package/dist).
# Prefix the sweep with ME_VERSION=4.2.0 so the run line names the kernel.
# Data: Zenodo GTFS-Scale-10-CHANGE → data/scale10/{base,seed0}/{routes,trips,stop_times,calendar,calendar_dates}.txt
node tests/Benchmarks/GTFS-Madrid/skew/generate-skew.ts --scale=10            # ~10 s, writes data/skew/scale10/<variant>/s<seed>/
node --expose-gc tests/Benchmarks/GTFS-Madrid/skew/sweep-skew.ts --scale=10   # ~25 min, writes results/skew/runs/*.json
node tests/Benchmarks/GTFS-Madrid/skew/report-skew.ts --scale=10              # writes results/skew/scale10-skew-sweep.{md,json,tsv} (moved to results/skew/v<version>/ when committed)
# options: generate --alphas=0,1 --hubs=1:0.5 --seeds=0 ; sweep --variants=zipf-a1,hub-1x50 --seeds=0 ; one run: sweep --run=zipf-a1/0
```

`Typescript/dist` for these runs was the published npm package `this.me@4.1.0` (its `dist/` copied into `Typescript/dist`, which is gitignored), not a local build.

### Results on this.me 4.1.0 (history: scale 10, measured 2026-10-07)

The 4.2.0 numbers are summarized under "Results at a glance" and in `results/skew/v4.2.0/explicit/`. k is identical; times below are 4.1.0.

Full tables are in `results/skew/v4.1.0/scale10-skew-sweep.md`; `scale10-skew-sweep.tsv` there has one line per measured write (the per-run `runs/*.json`, ~14 MB, are not committed).

**Fan-out of the base snapshot.** It is the same for every seed. Percentiles are linearly interpolated.

| variant | trips/service min / median / p95 / max | services with 0 trips | stop_times/trip min / median / p95 / max | trips with 0 stop_times |
|---|---|---:|---|---:|
| Madrid seed (original; 5 services, 130 trips) | 2 / 32 / 32 / 32 | 0 | 2 / 20 / 33 / 33 | 0 |
| VIG scale 10 (unmodified) | 26 / 26 / 26 / 26 | 0 | 18 / 18 / 19 / 19 | 0 |
| zipf-a0 | 26 / 26 / 26 / 26 | 0 | 18 / 18 / 19 / 19 | 0 |
| zipf-a0.5 | 14 / 20 / 55.4 / 102 | 0 | 9 / 13 / 41 / 335 | 0 |
| zipf-a1 | 6 / 11.5 / 85.2 / 289 | 0 | 2 / 5 / 46 / 3,051 | 0 |
| zipf-a1.5 | 1 / 4 / 90.3 / 558 | 0 | 0 / 1 / 17 / 9,246 | 516 |
| zipf-a2 | 0 / 1 / 71.4 / 800 | 10 | 0 / 0 / 3 / 14,378 | 1,091 |
| hub-1x50 | 13 / 13 / 14 / 650 | 0 | 9 / 9 / 10 / 11,820 | 0 |
| hub-3x75 | 6 / 7 / 181.9 / 325 | 0 | 4 / 5 / 5 / 5,910 | 0 |

The original Madrid seed is only mildly skewed: its largest trip has 1.8× the mean number of stop_times. Already at α = 0.5, the largest trip has 18× the mean (335 vs 18.2).

**k for the base→seed0 workload** (3 seeds pooled):

| variant | N per seed | k mean | p50 | p95 | max | max k per seed | UPDATE service k max | DELETE trip k max |
|---|---|---:|---:|---:|---:|---|---:|---:|
| VIG scale 10 | 1304 | 4.33 | 1 | 18 | 27 | 27 | 27 | 19 |
| zipf-a0 | 1304 | 4.33 | 1 | 18 | 27 | 27, 27, 27 | 27 | 19 |
| zipf-a0.5 | 1304 | 4.33 | 1 | 18 | 335 | 126, 335, 126 | 52 | 335 |
| zipf-a1 | 1304 | 4.54 | 1 | 10 | 3,051 | 436, 3051, 436 | 73 | 3,051 |
| zipf-a1.5 | 1213, 1206, 1218 | 5.33 | 1 | 4 | 9,246 | 499, 9246, 499 | 71 | 9,246 |
| zipf-a2 | 1119, 1115, 1116 | 6.30 | 1 | 1 | 14,378 | 294, 14378, 294 | 51 | 14,378 |
| hub-1x50 | 1304 | 5.68 | 1 | 9 | 11,820 | 15, 11820, 15 | 15 | 11,820 |
| hub-3x75 | 1304 | 3.33 | 1 | 5 | 5,910 | 10, 5910, 10 | 8 | 5,910 |

**How k responds to skew:**

- α = 0 reproduces the unmodified VIG run exactly: mean 4.33, p50 1, p95 18, max 27.
- With skew, the mean barely moves (4.3 → 6.3), p50 stays 1 (CREATE is always k = 1), and **p95 falls** (18 → 1 at α = 2), because most parents become small.
- **max grows with the largest fan-out**: k max equals the size of the largest parent the workload touches. It is 27 under VIG and reaches 14,378 at α = 2 (the hub trip, deleted in seed0 for seed 1).
- k follows degree, not n: row counts are identical in every variant.
- DELETE route stays k = 10 because `route_id` was not skewed (control).
- seed0 never updated the largest service, so UPDATE-service k max in the workload (≤ 73) is far below the largest service. The census measures the largest services directly: service k max = 103 / 290 / 559 / 801 / 651 / 326 for α 0.5 / 1 / 1.5 / 2 / hub-1x50 / hub-3x75.
- In the zipf-a1.5 and zipf-a2 rows, N drops because DELETEs of trips that no longer have stop_times have no probe and are skipped. That is the existing sweep's rule.

**Time.** Rebuild (median over seeds) is 5.0–5.8 s per variant. Apply time, pooled over all variants:

| write | k / width | apply ms p50 (p95) |
|---|---|---|
| service flip (census) | k 1–30 | 0.73 (1.71) |
| | k 31–100 | 2.41 (4.86) |
| | k 101–300 | 8.72 (16.4) |
| | k 301–1000 | 30.2 (48.5) |
| trip DELETE (census) | k 1–30 | 156 (251) |
| | k 101–300 | 168 (210) |
| | k 1001–3000 | 284 (349) |
| | k 3001–10000 | 567 (1,831) |
| | k > 10000 | 1,193 (6,603) |
| idx slot flip (k = 1) | sum width ≤ 30 | 0.11 (0.25) |
| | width 301–1000 | 8.9 (15.6) |
| | width 1001–3000 | 18.4 (27.1) |
| | width > 10000 | 169 (182) |

- **UPDATE propagation is linear in k.** Pooled fit: apply ≈ 0.03 ms + 58 µs·k (r = 0.95, n = 1,100); per-variant slopes are 51–71 µs per recomputed node. The largest wave measured (k = 801) took 47 ms, about 110× less than a rebuild; that is the worst case (the widest service), not the typical ratio. For the seed0 UPDATEs, rebuild ÷ apply p50 is 7,600–31,000×.
- **DELETE has a fixed cost of about 150–190 ms whatever k is.** In 4.1.0, `removeSubtree` scans every key of `refSubscribers` and the derivation table, so each `me["-"]` costs O(store). On top of that it adds roughly 0.1 ms per k (pooled fit 167 ms + 144 µs·k, r = 0.62). A typical DELETE is about 30× cheaper than a rebuild. Deleting the 11,820-stop_time hub trip took 0.97–1.08 s in 3 of 4 measurements, still below the ~5.8 s rebuild; the fourth took 8.3 s (see stalls below). Worst DELETE in this run: 16.3 s, a stall on a k = 18 DELETE (see caveats). 4.2.0 keeps the store scan (130–146 ms p50); its worst DELETE was 1.2 s.
- **k is not work.** A CREATE-equivalent slot flip is always k = 1, but the parent `stopTimeCount` is an explicit sum with one term per stop_time. Its cost grows with the sum width: 0.11 ms at width ≤ 30, 138–161 ms at width 11,820 and 178–183 ms at width 14,378. k alone underestimates the cost of wide aggregates.

**`explain()` size.** JSON bytes of `explain(probe[0])` right after the write:

- **Service flips:** 1,734 + 56·k bytes (r = 1.000), because `meta.recomputed` lists every recomputed path. That is about 47 KB at k = 801.
- **Trip DELETE:** the hub delete (k = 14,378) gives 1.6–1.8 MB.
- **Slot flip:** k = 1, but `derivation.inputs` lists every term of the sum. That is 4.8–5.5 MB at width 14,378, and the `explain()` call itself took up to 350 ms (one outlier took 1.4 s).
- **seed0 workload (unskewed):** median explanation size stays about 2.2–2.7 KB in every variant.

### What is and isn't measured

- **Measured:**
  - k = `explain().meta.k`, the number of derived nodes evaluated in the wave, counted transitively; `changed` is also recorded;
  - wall-clock `mutationApplyMs` (eager wave included);
  - probe read-back after the write (`recomputeMs`; the name is historical, the wave itself runs inside `mutationApplyMs`), raw data only;
  - rebuild = second load in the process + one read of all derived values;
  - `explain()` JSON size and latency.
- **Not measured:**
  - memory per variant;
  - a lazy-mode comparison;
  - `trips.route_id` skew (DELETE route stays at k = 10);
  - `trip.service_id` UPDATEs (they would need formula rebinding in the adapter);
  - scale 1 or 100 under skew;
  - realistic GTFS timetables. VIG times are opaque tokens, and α ≥ 1.5 leaves trips with no stop_times, which real GTFS forbids.
- **Workload coverage.** The seed0 workload touches hubs only by chance: seed 1 hit the top trip for every variant, seeds 0 and 2 did not, and no seed updated the top service. The census rows exist to cover the hubs. The census DELETEs a sample of 50 trips, not all 1,300, because each DELETE costs about 160 ms regardless of k.
- **CREATE semantics** stay the `gtfs.idx` slot model described above.

### Hardware and timing caveats

- **Machine (4.1.0 run, 2026-10-07; the 4.2.0 run used the same VM):** shared KVM VM ("Intel Xeon Processor", 8 vCPU, 15 GiB RAM, Linux 6.12), Node v22.23.3, one process per run with `--expose-gc --max-old-space-size=6144`. Other workloads were running on the host, and no CPU pinning or repetition beyond the 3 seeds was done.
- **The cold first load** varied from 4.7 s to 32 s for the same data. That is why the baseline is the second load in the process.
- **Stalls.** A few writes show multi-second stalls that have nothing to do with k:
  - a k = 18 DELETE took 16.3 s and a k = 17 DELETE took 10.9 s (other DELETEs with the same k took about 160 ms);
  - a k = 1 slot flip took 6.0 s;
  - the 8.3 s hub delete mentioned above.

  Re-running zipf-a0 / seed 1 with `--trace-gc` did not reproduce the 16 s stall: max DELETE was 637 ms and the largest GC pause 426 ms. The rerun is in `results/skew/v4.1.0/diagnostics/`. Treat max columns as noisy and p50 and the bucket medians as the robust numbers.
- **Size of the outputs.** `results/skew/runs/` (about 14 MB per sweep) and `data/` are gitignored.

## Run (synthetic, no data)

From `Typescript/`:

```bash
node tests/Benchmarks/GTFS-Madrid/benchmark.ts
```

Requires `dist/` built (`npm run build`).
