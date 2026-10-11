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

| run | script | command (from `Typescript/`) | results |
|---|---|---|---|
| Affected set k at VIG scale 1 and 10. k p50 / p95 / max = 1 / 18 / 27 at both scales, same as 4.1.0. | [sweep-seed0.ts](https://github.com/neurons-me/.me/blob/main/Typescript/tests/Benchmarks/GTFS-Madrid/sweep-seed0.ts) | `node tests/Benchmarks/GTFS-Madrid/sweep-seed0.ts --scale=1`, then `--scale=10` | [results/v4.2.0/explicit/](https://github.com/neurons-me/.me/tree/main/Typescript/tests/Benchmarks/GTFS-Madrid/results/v4.2.0/explicit) |
| Fan-out skew (Zipf and hub profiles, scale 10, 22 runs). An update costs about 0.05 ms + 52 µs per affected node. The biggest wave (k = 801) is about 100× faster than a rebuild. | [generate-skew.ts](https://github.com/neurons-me/.me/blob/main/Typescript/tests/Benchmarks/GTFS-Madrid/skew/generate-skew.ts), [sweep-skew.ts](https://github.com/neurons-me/.me/blob/main/Typescript/tests/Benchmarks/GTFS-Madrid/skew/sweep-skew.ts), [report-skew.ts](https://github.com/neurons-me/.me/blob/main/Typescript/tests/Benchmarks/GTFS-Madrid/skew/report-skew.ts) | `node tests/Benchmarks/GTFS-Madrid/skew/generate-skew.ts --scale=10`, `node --expose-gc tests/Benchmarks/GTFS-Madrid/skew/sweep-skew.ts --scale=10`, `node tests/Benchmarks/GTFS-Madrid/skew/report-skew.ts --scale=10` | [results/skew/v4.2.0/](https://github.com/neurons-me/.me/tree/main/Typescript/tests/Benchmarks/GTFS-Madrid/results/skew/v4.2.0) |
| DELETE, a phase of the same skew run. Each `me["-"]` scans the whole store: about 130–146 ms at scale 10, whatever k is. Not fixed in 4.2.0. | same skew scripts | same skew run | [results/skew/v4.2.0/](https://github.com/neurons-me/.me/tree/main/Typescript/tests/Benchmarks/GTFS-Madrid/results/skew/v4.2.0) |
| The 4.2 `[]` aggregate used as the count. Same k, but every CREATE re-scans (50 ms at scale 10), so the benchmark keeps explicit sums. | [sweep-seed0.ts](https://github.com/neurons-me/.me/blob/main/Typescript/tests/Benchmarks/GTFS-Madrid/sweep-seed0.ts) | `GTFS_AGG=bracket node tests/Benchmarks/GTFS-Madrid/sweep-seed0.ts --scale=10` (and `--scale=1`) | [results/v4.2.0/bracket/](https://github.com/neurons-me/.me/tree/main/Typescript/tests/Benchmarks/GTFS-Madrid/results/v4.2.0/bracket) |

Machine: shared Linux VM (Intel Xeon, 8 vCPU, 16 GiB), Node 22.23.3, the published `this.me@4.2.0` build. 4.1.0 was re-run on the same machine the same day for comparison.

<div class="doc-cards" markdown="0">
<a class="card" href="https://neurons-me.github.io/.me/docs/Extreme-Fan-Out.html"><img src="https://suign.github.io/assets/imgs/EXTREME-FAN-OUT.jpg" alt="Extreme Fan-Out"><span class="card-kind">4.2.0 · results</span><span class="card-title">Extreme Fan-Out</span><span class="card-desc">For GTFS-Madrid-Bench authors: k vs n, fan-out skew, weaknesses, how to reproduce.</span></a>
<a class="card" href="https://github.com/neurons-me/.me/blob/main/Typescript/tests/Benchmarks/GTFS-Madrid/README.md"><img src="https://suign.github.io/assets/imgs/MADRID-GTFS-DATA-me.jpg" alt="GTFS-Madrid benchmark"><span class="card-kind">4.2.0 · source</span><span class="card-title">GTFS-Madrid README</span><span class="card-desc">Adapter, workload, every table and raw result file, 4.2.0 and 4.1.0.</span></a>
</div>

## Older runs, not re-run on 4.2.0

| run | kernel, date, machine | script | command (from `Typescript/`) | results |
|---|---|---|---|---|
| Kernel benchmarks 1–4: scaling, extended scaling, incremental, multi-dataset. Not affected by the reference bug. | 3.9.x (repo at 3.9.1), 2026-06-08, machine not recorded | [benchmark.test.ts](https://github.com/neurons-me/.me/blob/main/Typescript/tests/Benchmarks/benchmark.test.ts), [benchmark.2.test.ts](https://github.com/neurons-me/.me/blob/main/Typescript/tests/Benchmarks/benchmark.2.test.ts), [benchmark.3.test.ts](https://github.com/neurons-me/.me/blob/main/Typescript/tests/Benchmarks/benchmark.3.test.ts), [benchmark.4.test.ts](https://github.com/neurons-me/.me/blob/main/Typescript/tests/Benchmarks/benchmark.4.test.ts) | `node tests/Benchmarks/benchmark.test.ts` (one file each) | [Benchmarks 1–11](benchmarks.html) |
| Kernel benchmarks 5–11: throughput, fan-out, cold/warm, explain, secret scope, push vs pull. 5 rounds, medians. | build with the reference fix, before the 4.1.0 release (repo at 2a173b7), 2026-09-26, Apple M2, Node 24.13.1 | [benchmark.5.sustained-mutation.test.ts](https://github.com/neurons-me/.me/blob/main/Typescript/tests/Benchmarks/benchmark.5.sustained-mutation.test.ts), [benchmark.6.fanout-sensitivity.test.ts](https://github.com/neurons-me/.me/blob/main/Typescript/tests/Benchmarks/benchmark.6.fanout-sensitivity.test.ts), [benchmark.7.cold-warm-profiles.test.ts](https://github.com/neurons-me/.me/blob/main/Typescript/tests/Benchmarks/benchmark.7.cold-warm-profiles.test.ts), [benchmark.8.explain-overhead.test.ts](https://github.com/neurons-me/.me/blob/main/Typescript/tests/Benchmarks/benchmark.8.explain-overhead.test.ts), [benchmark.9.secret-scope-impact.test.ts](https://github.com/neurons-me/.me/blob/main/Typescript/tests/Benchmarks/benchmark.9.secret-scope-impact.test.ts), [benchmark.10.push-vs-pull.test.ts](https://github.com/neurons-me/.me/blob/main/Typescript/tests/Benchmarks/benchmark.10.push-vs-pull.test.ts), [benchmark.11.secret-push-vs-pull.test.ts](https://github.com/neurons-me/.me/blob/main/Typescript/tests/Benchmarks/benchmark.11.secret-push-vs-pull.test.ts) | `node tests/Benchmarks/benchmark.6.fanout-sensitivity.test.ts` (one file each) | [Benchmarks 1–11](benchmarks.html) |
| GTFS-Madrid at VIG scale 100. 4.2.0 matched it at scales 1 and 10. | 4.1.0, before 2026-10-07, see the GTFS README | [sweep-seed0.ts](https://github.com/neurons-me/.me/blob/main/Typescript/tests/Benchmarks/GTFS-Madrid/sweep-seed0.ts) | `node tests/Benchmarks/GTFS-Madrid/sweep-seed0.ts --scale=100` | [results/](https://github.com/neurons-me/.me/tree/main/Typescript/tests/Benchmarks/GTFS-Madrid/results) |
| Fire test: phases 0–8, reconstruction, secret suites, contracts, and benchmarks 1–11. | 3.9.1, 2026-06-08, machine not recorded | [fire.test.ts](https://github.com/neurons-me/.me/blob/main/Typescript/tests/fire.test.ts) | `node tests/fire.test.ts` | [Fire test output](../Tests/fire.test.html) |

<div class="doc-cards" markdown="0">
<a class="card" href="benchmarks.html"><img src="https://suign.github.io/assets/imgs/me.png" alt=".me kernel benchmarks"><span class="card-kind">3.9.x · 4.1.0-pre</span><span class="card-title">Benchmarks 1–11</span><span class="card-desc">Scaling, throughput, fan-out, cold/warm, explain overhead, secret-scope cost, push vs pull.</span></a>
<a class="card" href="../Tests/fire.test.html"><span class="card-kind">3.9.1</span><span class="card-title">Fire test</span><span class="card-desc">Full kernel validation output: phases 0–8, reconstruction, secret contracts.</span></a>
</div>

The GTFS-Madrid runs need the VIG data first; see the setup in the [GTFS README](https://github.com/neurons-me/.me/blob/main/Typescript/tests/Benchmarks/GTFS-Madrid/README.md).
