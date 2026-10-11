---
layout: gui-doc
title: ".me — Benchmarks"
description: "What was measured on the .me kernel, on which version, when and on which machine: GTFS-Madrid re-run on this.me 4.2.0, kernel benchmarks 1–11 from earlier builds."
image: https://suign.github.io/assets/imgs/me.png
mepath:
  - text: Docs
    url: https://neurons-me.github.io/.me/docs/
crumb: Benchmarks
---

# Benchmarks

What was measured, on which kernel version, when, and on which machine. The machines differ between runs, so compare shapes and ratios (growth with k, flat or not), not absolute milliseconds across rows.

## Re-run on this.me 4.2.0 (2026-10-10)

| run | what it shows | result on 4.2.0 |
|---|---|---|
| GTFS-Madrid, VIG scale 1 and 10 (base → seed0, 151 and 1,304 writes) | the affected set k as the data grows | k p50 / p95 / max = 1 / 18 / 27 at both scales, identical to 4.1.0 for every write |
| GTFS-Madrid S1 fan-out skew (Zipf and hub profiles, scale 10, 22 runs) | cost when a parent is giant | UPDATE ≈ 0.05 ms + 52 µs·k; the worst wave (k = 801) is ~100× under a rebuild |
| Same, DELETE | known weakness | each `me["-"]` scans the store: ~130–146 ms at scale 10 whatever k is (not fixed in 4.2.0) |
| Same, 4.2 `[]` aggregates | the new collection aggregate as the count | same k, but each CREATE re-scans (50 ms at scale 10); the benchmark keeps explicit sums |

Machine: shared Linux VM (Intel Xeon, 8 vCPU, 16 GiB), Node 22.23.3, the published `this.me@4.2.0` build. 4.1.0 was re-run on the same machine the same day for comparison.

<div class="doc-cards" markdown="0">
<a class="card" href="https://neurons-me.github.io/.me/docs/Extreme-Fan-Out.html"><img src="https://suign.github.io/assets/imgs/EXTREME-FAN-OUT.jpg" alt="Extreme Fan-Out"><span class="card-kind">4.2.0 · results</span><span class="card-title">Extreme Fan-Out</span><span class="card-desc">For GTFS-Madrid-Bench authors: k vs n, fan-out skew, weaknesses, how to reproduce.</span></a>
<a class="card" href="https://github.com/neurons-me/.me/blob/main/Typescript/tests/Benchmarks/GTFS-Madrid/README.md"><img src="https://suign.github.io/assets/imgs/MADRID-GTFS-DATA-me.jpg" alt="GTFS-Madrid benchmark"><span class="card-kind">4.2.0 · source</span><span class="card-title">GTFS-Madrid README</span><span class="card-desc">Adapter, workload, every table and raw result file, 4.2.0 and 4.1.0.</span></a>
</div>

## Older runs, not re-run on 4.2.0

| benchmarks | kernel | measured | machine | note |
|---|---|---|---|---|
| Kernel 1–4 (scaling, extended scaling, incremental, multi-dataset) | 3.9.x (repo at 3.9.1) | 2026-06-08 | not recorded | not affected by the reference-resolution bug; never re-run on 4.x |
| Kernel 5–11 (throughput, fan-out, cold/warm, explain, secret scope, push vs pull) | the build with the reference fix, before its 4.1.0 release (repo at 2a173b7) | 2026-09-26 | Apple M2, 8 GB, macOS, Node 24.13.1 | re-measured after the fix, 5 rounds, medians |
| GTFS-Madrid scale 100 | 4.1.0 | before 2026-10-07 | see the GTFS README | 4.2.0 matched it at scales 1 and 10 |
| Fire test (phases 0–8, contracts) | 3.9.1 | 2026-06-08 | not recorded | output not re-recorded since |

<div class="doc-cards" markdown="0">
<a class="card" href="benchmarks.html"><img src="https://suign.github.io/assets/imgs/me.png" alt=".me kernel benchmarks"><span class="card-kind">3.9.x · 4.1.0-pre</span><span class="card-title">Benchmarks 1–11</span><span class="card-desc">Scaling, throughput, fan-out, cold/warm, explain overhead, secret-scope cost, push vs pull.</span></a>
<a class="card" href="../Tests/fire.test.html"><span class="card-kind">3.9.1</span><span class="card-title">Fire test</span><span class="card-desc">Full kernel validation output: phases 0–8, reconstruction, secret contracts.</span></a>
</div>

To re-run benchmarks 1–11 on the current build, from `Typescript/`: `node tests/fire.test.ts` (phases, benchmarks 1–11 and contracts), or one file at a time, e.g. `node tests/Benchmarks/benchmark.6.fanout-sensitivity.test.ts`.
