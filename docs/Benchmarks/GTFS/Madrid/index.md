---
layout: gui-doc
title: ".me — GTFS-Madrid benchmark"
description: "GTFS-Madrid-Bench on this.me 4.2.0: affected set k as VIG grows the data, fan-out skew, DELETE cost and the 4.2 [] aggregate, each with its script, command and results."
image: https://suign.github.io/assets/imgs/MADRID-GRAPH-ME.jpg
mepath:
  - text: Docs
    url: https://neurons-me.github.io/.me/docs/
  - text: Benchmarks
    url: https://neurons-me.github.io/.me/docs/Benchmarks/
  - text: GTFS
    url: https://neurons-me.github.io/.me/docs/Benchmarks/GTFS/
crumb: Madrid
---

# GTFS-Madrid

The Madrid metro feed from [GTFS-Madrid-Bench](https://github.com/oeg-upm/gtfs-bench), scaled with its VIG generator, loaded into `.me`, and changed with the benchmark's own update archives (base → seed0). Four runs, all on this.me 4.2.0, on 2026-10-10.

Machine: shared Linux VM (Intel Xeon, 8 vCPU, 16 GiB), Node 22.23.3, the published `this.me@4.2.0` build (`dist/me.es.js` sha256 `8cc94d52…`). 4.1.0 was re-run on the same machine the same day. Every results file records its own run line.

All commands run from `Typescript/`, after the VIG data is in place (see the setup in the [GTFS-Madrid README](https://github.com/neurons-me/.me/blob/main/Typescript/tests/Benchmarks/GTFS-Madrid/README.md)).

## 1. How many values a write touches as the data grows

Each write is replayed and we count k, the derived values it recomputes. At VIG scale 1 (151 writes) and scale 10 (1,304 writes), k barely moves: p50 1, p95 18.5 then 18, max 27. Ten times the data, the same work per write. Identical to 4.1.0 for every write.

- Script: [sweep-seed0.ts](https://github.com/neurons-me/.me/blob/main/Typescript/tests/Benchmarks/GTFS-Madrid/sweep-seed0.ts)
- Results: [results/v4.2.0/explicit/](https://github.com/neurons-me/.me/tree/main/Typescript/tests/Benchmarks/GTFS-Madrid/results/v4.2.0/explicit)

```bash
ME_VERSION=4.2.0 node tests/Benchmarks/GTFS-Madrid/sweep-seed0.ts --scale=1
ME_VERSION=4.2.0 node tests/Benchmarks/GTFS-Madrid/sweep-seed0.ts --scale=10
```

## 2. What a write costs when one parent is huge

Real feeds are uneven: a few routes have most of the trips. We generate skewed versions of the scale-10 data (Zipf and single-hub profiles, 22 runs) and time updates. An update costs about 0.05 ms plus 52 µs per affected value. The biggest wave (k = 801) is still about 100× faster than rebuilding.

- Scripts: [generate-skew.ts](https://github.com/neurons-me/.me/blob/main/Typescript/tests/Benchmarks/GTFS-Madrid/skew/generate-skew.ts) (makes the data), [sweep-skew.ts](https://github.com/neurons-me/.me/blob/main/Typescript/tests/Benchmarks/GTFS-Madrid/skew/sweep-skew.ts) (runs it), [report-skew.ts](https://github.com/neurons-me/.me/blob/main/Typescript/tests/Benchmarks/GTFS-Madrid/skew/report-skew.ts) (writes the tables)
- Results: [results/skew/v4.2.0/](https://github.com/neurons-me/.me/tree/main/Typescript/tests/Benchmarks/GTFS-Madrid/results/skew/v4.2.0)

```bash
node tests/Benchmarks/GTFS-Madrid/skew/generate-skew.ts --scale=10
ME_VERSION=4.2.0 node --expose-gc tests/Benchmarks/GTFS-Madrid/skew/sweep-skew.ts --scale=10
node tests/Benchmarks/GTFS-Madrid/skew/report-skew.ts --scale=10
```

## 3. What a delete costs (known weakness)

Deletes are a phase of the same skew run, no separate command. Each `me["-"]` scans the whole store: about 130–146 ms at scale 10, whatever k is. Not fixed in 4.2.0.

- Scripts and command: the same as run 2
- Results: [results/skew/v4.2.0/](https://github.com/neurons-me/.me/tree/main/Typescript/tests/Benchmarks/GTFS-Madrid/results/skew/v4.2.0)

## 4. The 4.2 `[]` aggregate as the count

4.2.0 adds collection aggregates (`stopTimeMember[].on`). Used for the counts, k is the same, but every CREATE re-scans the collection: 50 ms at scale 10 instead of 0.21 ms with explicit sums. So the benchmark keeps explicit sums.

- Script: [sweep-seed0.ts](https://github.com/neurons-me/.me/blob/main/Typescript/tests/Benchmarks/GTFS-Madrid/sweep-seed0.ts) with `GTFS_AGG=bracket`
- Results: [results/v4.2.0/bracket/](https://github.com/neurons-me/.me/tree/main/Typescript/tests/Benchmarks/GTFS-Madrid/results/v4.2.0/bracket)

```bash
GTFS_AGG=bracket ME_VERSION=4.2.0 node tests/Benchmarks/GTFS-Madrid/sweep-seed0.ts --scale=1
GTFS_AGG=bracket ME_VERSION=4.2.0 node tests/Benchmarks/GTFS-Madrid/sweep-seed0.ts --scale=10
```

## More

<div class="doc-cards" markdown="0">
<a class="card" href="https://neurons-me.github.io/.me/docs/Extreme-Fan-Out.html"><img src="https://suign.github.io/assets/imgs/EXTREME-FAN-OUT.jpg" alt="Extreme Fan-Out"><span class="card-kind">Docs</span><span class="card-title">Extreme Fan-Out</span><span class="card-desc">For GTFS-Madrid-Bench authors: the numbers in context, the weaknesses, 4.1.0 vs 4.2.0.</span></a>
<a class="card" href="https://neurons-me.github.io/.me/Tests/gtfs-madrid-universe.html"><img src="https://suign.github.io/assets/imgs/MADRID-GTFS-DATA-me.jpg" alt="GTFS Madrid live universe"><span class="card-kind">Demo</span><span class="card-title">GTFS Madrid universe</span><span class="card-desc">A small subset live in the browser: click a node for explain(), mutate to see k.</span></a>
<a class="card" href="https://neurons-me.github.io/.me/docs/Tests/madrid-knowledge.html"><img src="https://suign.github.io/assets/imgs/SMARTCITY.jpg" alt="Madrid fares"><span class="card-kind">Demo</span><span class="card-title">Madrid fares</span><span class="card-desc">The same city as a human story: fares, abono, Sol → Atocha.</span></a>
<a class="card" href="https://neurons-me.github.io/mlearning.studio/GTFS/"><img src="https://neurons-me.github.io/mlearning.studio/GTFS/og.jpg" alt="GTFS on mlearning.studio"><span class="card-kind">Dataset</span><span class="card-title">GTFS on mlearning.studio</span><span class="card-desc">The feed format, the Madrid dataset, GTFS-Madrid-Bench links.</span></a>
<a class="card" href="https://github.com/neurons-me/.me/blob/main/Typescript/tests/Benchmarks/GTFS-Madrid/README.md"><img src="https://suign.github.io/assets/imgs/me.png" alt="GTFS-Madrid README"><span class="card-kind">Source</span><span class="card-title">GTFS-Madrid README</span><span class="card-desc">Adapter, workload, every table and results file, 4.2.0 and 4.1.0.</span></a>
</div>
