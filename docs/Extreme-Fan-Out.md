---
layout: gui-doc
title: Extreme Fan-Out
description: "One write, 100,000 dependents. Plus GTFS-Madrid-Bench on this.me 4.2.0: k stays flat as VIG grows the data 100×, fan-out skew, the known weaknesses, and how to reproduce."
image: https://suign.github.io/assets/imgs/EXTREME-FAN-OUT.jpg
mepath:
  - text: Docs
    url: https://neurons-me.github.io/.me/docs/
crumb: Fan-Out
---

# Extreme Fan-Out

> One write. 100,000 dependents. All of them update — because they all actually depend on what changed.

## For GTFS-Madrid-Bench authors

**What .me is, in one paragraph.** `.me` (npm `this.me`) is a reactive knowledge-graph kernel. Facts live at paths (`gtfs.trips.T1.serviceId`). A derived value is declared once with `["="]` and recomputes when one of its inputs changes. `me.explain(path)` returns the formula, its inputs, and the wave of the last write: `k` (how many derived values were recomputed), `recomputed`, `changed`, `sourcePath`. This is **not** an RML/RDF materializer. We measure how a change propagates after the graph exists, not how a knowledge graph is built.

**How GTFS maps onto it.** Rows become paths and foreign keys (PK-FK) become dependencies: `trip.live ← service.active` (through `service_id`), `trip.validRoute ← route.active` (`route_id`), `stopTime.routeId ← trip` (`trip_id`), plus one count per parent (`tripCount`, `stopTimeCount`) as a sum over membership slots. An "affected relation" is a derived value reached from the written row through those edges, and **k** counts them.

**Data and workload.** The Van Assche et al. CHANGE packages ([Zenodo 10.5281/zenodo.14038823](https://zenodo.org/records/14038823)), generated with VIG from GTFS-Madrid-Bench at scales 1 / 10 / 100. Each run loads `base`, then applies every CREATE / UPDATE / DELETE from `seed0` and measures each write.

### k vs n as VIG grows the data

| scale | stop_times | writes measured | k p50 | k p95 | k max | write p50 / p95 (ms) | DELETE p50 (ms) | kernel |
|---|---:|---:|---:|---:|---:|---|---:|---|
| 1 | 2,364 | 151 | 1 | 18.5 | 27 | 0.30 / 9.5 | 9.2 | 4.2.0 |
| 10 | 23,640 | 1,304 | 1 | 18 | 27 | 0.23 / 165 | 144 | 4.2.0 |
| 100 | 236,400 | 13,401 | 1 | 18 | 27 | not re-run | — | 4.1.0 (history) |

**n** grew 100× and **k** did not move: a write touches its FK neighbourhood, not the feed. Write time is the write itself, including its propagation wave.

### Fan-out skew (VIG grows uniformly, so we skewed it)

VIG keeps every trip at about 18 stop_times. The skew run reassigns `trips.service_id` and `stop_times.trip_id` with Zipf (a = 0 … 2) and hub profiles at scale 10, same row counts, 3 seeds each, and replays the same workload plus a census of the widest parents.

| profile | k max (widest parent) | UPDATE p50 (ms) | DELETE p50 (ms) | rebuild (ms) | rebuild ÷ UPDATE |
|---|---:|---:|---:|---:|---:|
| VIG | 27 | 0.53 | 140 | 5,784 | 10,932× |
| Zipf 1 | 3,051 | 0.48 | 140 | 5,163 | 10,849× |
| Zipf 2 | 14,378 | 0.20 | 146 | 4,974 | 24,578× |
| hub 50% | 11,820 | 0.32 | 137 | 4,759 | 14,713× |

Zipf 1 / 2: exponent a = 1 / 2; hub 50%: one service and one trip own half of their children.

- **k now follows the parent you touch.** The median write is still k = 1; the tail is the widest parent (k max = its stop_times).
- **UPDATE cost is linear in k:** about 0.05 ms + 52 µs per recomputed value (r = 0.98, 1,100 writes). The largest wave measured (a service with 801 trips, k = 801) took 52 ms at worst, about **100× under a ~5 s rebuild**. That is the worst case. For the ordinary seed0 UPDATEs, rebuild ÷ apply p50 is 6,800–25,000×.
- **explain() grows with k:** about 1.9 KB + 56 bytes per recomputed value; 1.6 MB for the 14,378-stop_time trip.

### Known weaknesses (measured on 4.2.0)

- **DELETE scans the store.** Each `me["-"]` costs about 130–146 ms p50 at scale 10 whatever k is (9 ms at scale 1, so it grows with n), plus about 67 µs per k. Worst measured: 1.2 s to delete the 14,378-stop_time hub trip, still under the ~5 s rebuild. 4.2.0 did not change this (4.1.0 on the same machine: 171 ms p50 at scale 10).
- **A CREATE on a giant parent costs more than k = 1 suggests.** k is 1 (the parent's count), but the count is a sum with one term per member, so re-evaluating it costs the parent's width: 0.1 ms at 18 members, 151 ms at 14,378.
- **4.2.0's collection aggregate `[]` does not fix that yet.** Writing the counts as `…stopTimeMember[].on` gives the same k, but every CREATE then re-scans: 3.5 ms at scale 1, 50 ms at scale 10, and loading takes 71 s instead of 4.7 s. The benchmark keeps the explicit sums.
- **Max columns are noisy** (GC pauses); p50 and bucket medians are the robust numbers.

### Reproduce

Node ≥ 22.6 (it runs the `.ts` files directly). The skew sweep takes about 20 minutes, the scale-10 sweep about 1 minute.

```bash
git clone https://github.com/neurons-me/.me.git && cd .me/Typescript
npm install
# the published build (dist/me.es.js sha256 8cc94d52…)
npm pack this.me@4.2.0 && tar xzf this.me-4.2.0.tgz
rm -rf dist && mv package/dist dist
# Zenodo CHANGE CSVs → tests/Benchmarks/GTFS-Madrid/data/scale{1,10}/{base,seed0}/
ME_VERSION=4.2.0 node tests/Benchmarks/GTFS-Madrid/sweep-seed0.ts --scale=10
node tests/Benchmarks/GTFS-Madrid/skew/generate-skew.ts --scale=10
ME_VERSION=4.2.0 node --expose-gc tests/Benchmarks/GTFS-Madrid/skew/sweep-skew.ts --scale=10
node tests/Benchmarks/GTFS-Madrid/skew/report-skew.ts --scale=10
```

Measured 2026-10-10 on `this.me@4.2.0` (the published npm build, `dist/me.es.js` sha256 `8cc94d52…`), Node 22.23.3, Linux x64, Intel Xeon 8 vCPU, 16 GiB. Every results file records its own run line. The 4.1.0 runs are kept in the README as history. Each run with its script, command and results folder: [GTFS-Madrid benchmark](Benchmarks/GTFS/Madrid/).

<div class="doc-cards" markdown="0">
<a class="card" href="https://neurons-me.github.io/.me/docs/Benchmarks/GTFS/Madrid/"><img src="https://suign.github.io/assets/imgs/MADRID-GRAPH-ME.jpg" alt="GTFS-Madrid benchmark page"><span class="card-kind">Benchmark · 4.2.0</span><span class="card-title">GTFS-Madrid benchmark</span><span class="card-desc">The four 4.2.0 runs, each with its script, command and results folder.</span></a>
<a class="card" href="https://github.com/neurons-me/.me/blob/main/Typescript/tests/Benchmarks/GTFS-Madrid/README.md"><img src="https://suign.github.io/assets/imgs/EXTREME-FAN-OUT.jpg" alt="GTFS-Madrid benchmark"><span class="card-kind">Benchmark</span><span class="card-title">GTFS-Madrid README</span><span class="card-desc">Adapter, workload, every table and raw result file, 4.2.0 and 4.1.0.</span></a>
<a class="card" href="https://neurons-me.github.io/mlearning.studio/GTFS/"><img src="https://neurons-me.github.io/mlearning.studio/GTFS/og.jpg" alt="GTFS on mlearning.studio"><span class="card-kind">Dataset</span><span class="card-title">GTFS on mlearning.studio</span><span class="card-desc">The feed format, the Madrid entry, GTFS-Madrid-Bench links.</span></a>
<a class="card" href="https://neurons-me.github.io/mlearning.studio/datasets/madrid-gtfs/"><img src="https://suign.github.io/assets/imgs/MADRID-GRAPH-ME.jpg" alt="Madrid GTFS dataset"><span class="card-kind">Dataset</span><span class="card-title">Madrid GTFS</span><span class="card-desc">Zenodo CHANGE archives and sizes, what to extract, citations.</span></a>
<a class="card" href="https://neurons-me.github.io/.me/Tests/gtfs-madrid-universe.html"><img src="https://suign.github.io/assets/imgs/MADRID-GTFS-DATA-me.jpg" alt="GTFS Madrid live universe"><span class="card-kind">Demo</span><span class="card-title">GTFS Madrid universe</span><span class="card-desc">A small subset live in the browser: click a node for explain(), mutate to see k.</span></a>
<a class="card" href="https://neurons-me.github.io/.me/docs/Tests/madrid-knowledge.html"><img src="https://suign.github.io/assets/imgs/SMARTCITY.jpg" alt="Madrid fares"><span class="card-kind">Demo</span><span class="card-title">Madrid fares</span><span class="card-desc">The same city as a human story: fares, abono, Sol → Atocha.</span></a>
</div>

---

## The 100,000-dependent demo

The opposite of Hemisphere Scale. There, k was tiny and the graph was huge. Here, k is intentionally enormous: every single node in the graph depends on one root value. Change the root — measure how long it takes to recompute all 100,000 leaves.

[`.me Docs`](https://neurons-me.github.io/.me/docs/) · [Extreme Fan-Out Source Code](https://github.com/neurons-me/.me/blob/main/Typescript/tests/Demos/Root_Fanout_100k.ts)

### The Tiny Mental Model

```ts
me.master.factor(1)

// 100,000 nodes, each derived from the same root
me.dep[i]["="]("out", "value * master.factor")

// one write
me.master.factor(2)
// → all 100,000 `out` values recompute
```

O(k) is honest — if k is 100,000, the cost is 100,000. The point is: the graph never recomputes more than k.

---

### What The Demo Builds

| Part | Path | What it means |
|---|---|---|
| Root | `master.factor` | The one value everything depends on |
| Leaves | `dep[i].value` | Each node's own base value |
| Derived | `dep[i].out` | `value * master.factor` — live for all 100k |

---

### Step 1: Wire 100,000 Dependents

```ts
me.master.factor(1)

for (let i = 1; i <= 100_000; i++) {
  me.dep[i].value(i)
  me.dep[i]["="]("out", "value * master.factor")
}
```

Every node declares its derivation at setup time. The dependency graph is built once.

Initial state:

```ts
me("dep[1].out")       // 1
me("dep[100000].out")  // 100000
```

---

### Step 2: Mutate the Root

```ts
me.master.factor(2)
```

All 100,000 leaves recompute:

```ts
me("dep[1].out")       // 2
me("dep[100000].out")  // 200000
```

---

### Explainability

The cascade is fully traceable:

```ts
me.explain("dep[100000].out")
// → {
//     expr: "value * master.factor",
//     dependsOn: ["dep.100000.value", "master.factor"],
//     k: 100000,
//     sourcePath: "master.factor",
//     recomputed: ["dep.1.out", "dep.2.out", ..., "dep.100000.out"]
//   }
```

`k: 100000` — the graph recomputed exactly as many nodes as depended on `master.factor`. No more, no less.

---

### Build It Yourself

```bash
cd Typescript
npm install
node tests/Demos/Root_Fanout_100k.ts
```

Override N:

```bash
FANOUT_N=50000 node tests/Demos/Root_Fanout_100k.ts
```

To run every demo:

```bash
npm run test:demos:run-all
```

---

### The Big Idea

Fan-out is not a pathological case. It is the natural shape of broadcast: one configuration value, one price, one policy — many things that depend on it.

`.me` handles it without special-casing. The same O(k) guarantee that makes Hemisphere Scale cheap also makes Extreme Fan-Out correct: the graph recomputes everything that needs to change, and nothing that does not.

```text
1 root mutation → k=100,000 → mutation time measured in milliseconds
```

---
