---
layout: gui-doc
title: ".me — GTFS-Madrid benchmark"
description: "GTFS-Madrid-Bench on this.me 4.2.0: affected set k as VIG grows the data, fan-out skew, DELETE cost and the 4.2 [] aggregate, each with its script, command and results."
image: https://suign.github.io/assets/imgs/MADRID-GRAPH-ME.jpg
mepath:
  - text: Benchmarks
    url: https://neurons-me.github.io/.me/docs/Benchmarks/
  - text: GTFS
    url: https://neurons-me.github.io/.me/docs/Benchmarks/GTFS/
crumb: Madrid
---

# GTFS-Madrid

The Madrid metro feed from [GTFS-Madrid-Bench](https://github.com/oeg-upm/gtfs-bench), loaded into `.me` and changed with the benchmark's own update packages. Four runs, all on this.me 4.2.0, on 2026-10-10. What a write's wave is, and what **k** counts, is explained in [Extreme Fan-Out](../../../Extreme-Fan-Out.html).

Machine: shared Linux VM (Intel Xeon, 8 vCPU, 16 GiB), Node 22.23.3, the published `this.me@4.2.0` build (`dist/me.es.js` sha256 `8cc94d52…`). 4.1.0 was re-run on the same machine the same day. Every results file records its own run line.

## Data and workload {#data}

The Van Assche et al. CHANGE packages ([Zenodo 10.5281/zenodo.14038823](https://zenodo.org/records/14038823)), generated with VIG from GTFS-Madrid-Bench at scales 1 / 10 / 100. Each run loads `base`, then applies every CREATE / UPDATE / DELETE from `seed0` and measures each write. Write time is the write itself, including its propagation wave.

## How GTFS maps onto .me {#mapping}

Rows become paths (`gtfs.trips.T1.serviceId`) and foreign keys (PK-FK) become dependencies:

- `trip.live ← service.active` (through `service_id`)
- `trip.validRoute ← route.active` (`route_id`)
- `stopTime.routeId ← trip` (`trip_id`)
- one count per parent (`tripCount`, `stopTimeCount`), a sum over membership slots

An "affected relation" is a derived value reached from the written row through those edges, and **k** counts them. This is **not** an RML/RDF materializer: it measures how a change propagates after the graph exists, not how a knowledge graph is built.

## Setup {#setup}

Node ≥ 22.6 (it runs the `.ts` files directly). All commands run from `Typescript/`. Full details in the [GTFS-Madrid README](https://github.com/neurons-me/.me/blob/main/Typescript/tests/Benchmarks/GTFS-Madrid/README.md).

```bash
git clone https://github.com/neurons-me/.me.git && cd .me/Typescript
npm install
# the published build (dist/me.es.js sha256 8cc94d52…)
npm pack this.me@4.2.0 && tar xzf this.me-4.2.0.tgz
rm -rf dist && mv package/dist dist
# Zenodo CHANGE CSVs → tests/Benchmarks/GTFS-Madrid/data/scale{1,10}/{base,seed0}/
```

The scale-10 sweep takes about 1 minute, the skew sweep about 20 minutes.

## 1. How many values a write touches as the data grows {#k-vs-n}

Each write is replayed and we count k, the derived values it recomputes. At VIG scale 1 (151 writes) and scale 10 (1,304 writes), k barely moves: p50 1, p95 18.5 then 18, max 27. Ten times the data, the same work per write. Identical to 4.1.0 for every write.

| scale | stop_times | writes measured | k p50 | k p95 | k max | write p50 / p95 (ms) | DELETE p50 (ms) | kernel |
|---|---:|---:|---:|---:|---:|---|---:|---|
| 1 | 2,364 | 151 | 1 | 18.5 | 27 | 0.30 / 9.5 | 9.2 | 4.2.0 |
| 10 | 23,640 | 1,304 | 1 | 18 | 27 | 0.23 / 165 | 144 | 4.2.0 |
| 100 | 236,400 | 13,401 | 1 | 18 | 27 | not re-run | — | 4.1.0 (history) |

**n** grew 100× and **k** did not move: a write touches its FK neighbourhood, not the feed. The write p95 at scale 10 is the deletes (run 3).

- Script: [sweep-seed0.ts](https://github.com/neurons-me/.me/blob/main/Typescript/tests/Benchmarks/GTFS-Madrid/sweep-seed0.ts)
- Results: [results/v4.2.0/explicit/](https://github.com/neurons-me/.me/tree/main/Typescript/tests/Benchmarks/GTFS-Madrid/results/v4.2.0/explicit)

```bash
ME_VERSION=4.2.0 node tests/Benchmarks/GTFS-Madrid/sweep-seed0.ts --scale=1
ME_VERSION=4.2.0 node tests/Benchmarks/GTFS-Madrid/sweep-seed0.ts --scale=10
```

## 2. What a write costs when one parent is huge {#skew}

Real feeds are uneven: a few routes have most of the trips, but VIG grows the data uniformly (every trip keeps about 18 stop_times). So the skew run reassigns `trips.service_id` and `stop_times.trip_id` with Zipf (a = 0 … 2) and hub profiles at scale 10, same row counts, 3 seeds each (22 runs), and replays the same workload plus a census of the widest parents.

| profile | k max (widest parent) | UPDATE p50 (ms) | DELETE p50 (ms) | rebuild (ms) | rebuild ÷ UPDATE |
|---|---:|---:|---:|---:|---:|
| VIG | 27 | 0.53 | 140 | 5,784 | 10,932× |
| Zipf 1 | 3,051 | 0.48 | 140 | 5,163 | 10,849× |
| Zipf 2 | 14,378 | 0.20 | 146 | 4,974 | 24,578× |
| hub 50% | 11,820 | 0.32 | 137 | 4,759 | 14,713× |

Zipf 1 / 2: exponent a = 1 / 2; hub 50%: one service and one trip own half of their children.

- **k follows the parent you touch.** The median write is still k = 1; the tail is the widest parent (k max = its stop_times).
- **UPDATE cost is linear in k:** about 0.05 ms + 52 µs per recomputed value (r = 0.98, 1,100 writes). The largest wave measured (a service with 801 trips, k = 801) took 52 ms at worst, about **100× under a ~5 s rebuild**. That is the worst case; for the ordinary seed0 UPDATEs, rebuild ÷ apply p50 is 6,800–25,000×.
- **A CREATE on a giant parent costs more than k = 1 suggests.** k is 1 (the parent's count), but the count is a sum with one term per member, so re-evaluating it costs the parent's width: 0.1 ms at 18 members, 151 ms at 14,378.

- Scripts: [generate-skew.ts](https://github.com/neurons-me/.me/blob/main/Typescript/tests/Benchmarks/GTFS-Madrid/skew/generate-skew.ts) (makes the data), [sweep-skew.ts](https://github.com/neurons-me/.me/blob/main/Typescript/tests/Benchmarks/GTFS-Madrid/skew/sweep-skew.ts) (runs it), [report-skew.ts](https://github.com/neurons-me/.me/blob/main/Typescript/tests/Benchmarks/GTFS-Madrid/skew/report-skew.ts) (writes the tables)
- Results: [results/skew/v4.2.0/](https://github.com/neurons-me/.me/tree/main/Typescript/tests/Benchmarks/GTFS-Madrid/results/skew/v4.2.0)

```bash
node tests/Benchmarks/GTFS-Madrid/skew/generate-skew.ts --scale=10
ME_VERSION=4.2.0 node --expose-gc tests/Benchmarks/GTFS-Madrid/skew/sweep-skew.ts --scale=10
node tests/Benchmarks/GTFS-Madrid/skew/report-skew.ts --scale=10
```

## 3. What a delete costs (known weakness) {#delete}

**UPDATE cost follows k; DELETE cost does not.** An update costs about 52 µs per affected value (run 2). Each delete, `me["-"]`, scans the store: about 130–146 ms p50 at scale 10 whatever k is (run 2’s table: the same from k max 27 to 14,378), against 9 ms at scale 1. So a delete's cost depends on **n**, the size of the data, not on **k**. On top of that it adds about 67 µs per k. Worst measured: 1.2 s to delete the 14,378-stop_time hub trip, still under the ~5 s rebuild.

**Not fixed.** 4.2.0 did not change it (4.1.0 on the same machine: 171 ms p50 at scale 10), and 4.2.1 does not touch this code path (not re-measured). The likely cause: since 4.1.0, removing a subtree scans every subscribed path (`Object.keys(refSubscribers)`) to find what read the removed paths, and the same removal also walks every derivation and index key. Each of those is a full pass over the store, once per delete.

Deletes are a phase of the same skew run, no separate command.

- Scripts and command: the same as run 2
- Results: [results/skew/v4.2.0/](https://github.com/neurons-me/.me/tree/main/Typescript/tests/Benchmarks/GTFS-Madrid/results/skew/v4.2.0)

## 4. The 4.2 `[]` aggregate as the count {#bracket-aggregate}

4.2.0 adds collection aggregates (`stopTimeMember[].on`). Used for the counts, k is the same, but every CREATE re-scans the collection: 3.5 ms at scale 1 and 50 ms at scale 10, instead of 0.21 ms with explicit sums, and loading takes 71 s instead of 4.7 s. So it does not fix the giant-parent CREATE (run 2) yet, and the benchmark keeps explicit sums.

- Script: [sweep-seed0.ts](https://github.com/neurons-me/.me/blob/main/Typescript/tests/Benchmarks/GTFS-Madrid/sweep-seed0.ts) with `GTFS_AGG=bracket`
- Results: [results/v4.2.0/bracket/](https://github.com/neurons-me/.me/tree/main/Typescript/tests/Benchmarks/GTFS-Madrid/results/v4.2.0/bracket)

```bash
GTFS_AGG=bracket ME_VERSION=4.2.0 node tests/Benchmarks/GTFS-Madrid/sweep-seed0.ts --scale=1
GTFS_AGG=bracket ME_VERSION=4.2.0 node tests/Benchmarks/GTFS-Madrid/sweep-seed0.ts --scale=10
```

## Known limits {#known-limits}

- **`explain()` grows with k:** about 1.9 KB + 56 bytes per recomputed value. On the trip with 14,378 `stop_times` (Zipf 2) it returns about 1.6 MB. There is no pagination or summary mode yet; it is an open item.
- **Deletes scan the store** (run 3): they depend on n, not k. Open.
- **Max columns are noisy** (GC pauses); p50 and bucket medians are the robust numbers.

## More

<div class="doc-cards" markdown="0">
<a class="card" href="https://neurons-me.github.io/.me/docs/Extreme-Fan-Out.html"><img src="https://suign.github.io/assets/imgs/EXTREME-FAN-OUT.jpg" alt="Extreme Fan-Out"><span class="card-kind">Docs</span><span class="card-title">Extreme Fan-Out</span><span class="card-desc">The concept behind k: one write, 100,000 dependents, every wave traceable with explain().</span></a>
<a class="card" href="https://neurons-me.github.io/.me/Tests/gtfs-madrid-universe.html"><img src="https://suign.github.io/assets/imgs/MADRID-GTFS-DATA-me.jpg" alt="GTFS Madrid live universe"><span class="card-kind">Demo</span><span class="card-title">GTFS Madrid universe</span><span class="card-desc">A small subset live in the browser: click a node for explain(), mutate to see k.</span></a>
<a class="card" href="https://neurons-me.github.io/.me/docs/Tests/madrid-knowledge.html"><img src="https://suign.github.io/assets/imgs/SMARTCITY.jpg" alt="Madrid fares"><span class="card-kind">Demo</span><span class="card-title">Madrid fares</span><span class="card-desc">The same city as a human story: fares, abono, Sol → Atocha.</span></a>
<a class="card" href="https://neurons-me.github.io/mlearning.studio/GTFS/"><img src="https://neurons-me.github.io/mlearning.studio/GTFS/og.jpg" alt="GTFS on mlearning.studio"><span class="card-kind">Dataset</span><span class="card-title">GTFS on mlearning.studio</span><span class="card-desc">The feed format, the Madrid dataset, GTFS-Madrid-Bench links.</span></a>
<a class="card" href="https://github.com/neurons-me/.me/blob/main/Typescript/tests/Benchmarks/GTFS-Madrid/README.md"><img src="https://suign.github.io/assets/imgs/me.png" alt="GTFS-Madrid README"><span class="card-kind">Source</span><span class="card-title">GTFS-Madrid README</span><span class="card-desc">Adapter, workload, every table and results file, 4.2.0 and 4.1.0.</span></a>
<a class="card" href="https://neurons-me.github.io/mlearning.studio/datasets/madrid-gtfs/"><img src="https://suign.github.io/assets/imgs/MADRID-GRAPH-ME.jpg" alt="Madrid GTFS dataset"><span class="card-kind">Dataset</span><span class="card-title">Madrid GTFS</span><span class="card-desc">Zenodo CHANGE archives and sizes, what to extract, citations.</span></a>
</div>
