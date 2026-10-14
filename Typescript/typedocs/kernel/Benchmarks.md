# Kernel Benchmarks

The claim under test: a write costs O(k), where `k` is the number of derived values it recomputes, not the size of the tree. Secret paths cost more, and that cost is measured.

Concept first: [O(k)](https://neurons-me.github.io/.me/docs/O-k.html) · [Extreme Fan-Out](https://neurons-me.github.io/.me/docs/Extreme-Fan-Out.html) · [Benchmarks across kernel versions](https://neurons-me.github.io/.me/docs/Benchmarks/benchmarks.html). Data structures: [Core](./Core).

## Runs on this.me 4.2.1 (Linux box)

Every number in this section is **this.me 4.2.1**: the benchmark files at tag `v4.2.1`, run with `tsx` against the npm 4.2.1 `dist`. Box: Intel Xeon, 8 vCPU, 16 GB, Linux, Node v20.19.2, 2026-10-14. **One run per benchmark** (not a median of rounds); shared-box noise shows most in #9 and #11.

| # | File (v4.2.1) | What it measures |
|---|---|---|
| 5 | [benchmark.5.sustained-mutation](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/tests/Benchmarks/benchmark.5.sustained-mutation.test.ts) | 2,000 eager writes, 4,000 dependents each; drift over time |
| 6 | [benchmark.6.fanout-sensitivity](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/tests/Benchmarks/benchmark.6.fanout-sensitivity.test.ts) | latency vs fan-out |
| 7 | [benchmark.7.cold-warm-profiles](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/tests/Benchmarks/benchmark.7.cold-warm-profiles.test.ts) | cold read, first write, steady writes |
| 8 | [benchmark.8.explain-overhead](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/tests/Benchmarks/benchmark.8.explain-overhead.test.ts) | `explain(path)` on top of write + read |
| 9 | [benchmark.9.secret-scope-impact](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/tests/Benchmarks/benchmark.9.secret-scope-impact.test.ts) | public vs secret, lazy |
| 10 | [benchmark.10.push-vs-pull](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/tests/Benchmarks/benchmark.10.push-vs-pull.test.ts) | write vs first read, eager vs lazy |
| 11 | [benchmark.11.secret-push-vs-pull](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/tests/Benchmarks/benchmark.11.secret-push-vs-pull.test.ts) | same split, secret vs public |
| gate | [benchmark.regression-gate](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/tests/Benchmarks/benchmark.regression-gate.test.ts) | pass/fail checks |

### #6 Fan-out

One write to `master` with `fanout` dependents, eager. `k` is `explain().meta.k`; `inputs` is the formula's reference count.

| Fanout | k | inputs | p50 (ms) | p95 (ms) |
|---:|---:|---:|---:|---:|
| 10 | 10 | 2 | 0.243 | 0.877 |
| 100 | 100 | 2 | 1.58 | 3.79 |
| 500 | 500 | 2 | 9.37 | 12.42 |
| 1000 | 1000 | 2 | 18.58 | 19.25 |
| 2500 | 2500 | 2 | 54.17 | 74.29 |
| 5000 | 5000 | 2 | 124.24 | 166.25 |

Linear in k: about 19–25 µs per recomputed dependent on this box.

### #7 Cold vs warm

`cold` = first read of a computed output; `warm` = first write + read; `steady` = 80 more write + read cycles.

| Nodes | Cold (ms) | Warm (ms) | Steady avg (ms) | Steady min (ms) |
|---:|---:|---:|---:|---:|
| 100 | 0.498 | 6.02 | 2.39 | 1.61 |
| 1000 | 0.066 | 35.0 | 23.7 | 20.4 |
| 5000 | 0.058 | 135.8 | 161.1 | 129.1 |

### #8 explain() overhead

Write + read with 3,000 dependents, eager.

| Mode | p50 (ms) | p95 (ms) |
|---|---:|---:|
| baseline | 73.57 | 91.74 |
| with_explain | 75.14 | 95.99 |

p95 overhead: +4.6%.

### #9 Secret scope

600 nodes, lazy.

| Scope | p50 (ms) | p95 (ms) |
|---|---:|---:|
| public | 0.050 | 0.225 |
| secret | 0.926 | 1.748 |

Secret p95 is 7.8× public here. The cost is branch key derivation and cache, blob sealing/opening, and stealth-boundary checks.

### #10 Push vs pull

| Mode | Fanout | k | Write p95 (ms) | Read p95 (ms) |
|---|---:|---:|---:|---:|
| eager | 100 | 100 | 2.42 | 0.027 |
| eager | 1000 | 1000 | 20.39 | 0.040 |
| eager | 5000 | 5000 | 143.28 | 0.068 |
| lazy | 100 | 1 | 0.0089 | 0.038 |
| lazy | 1000 | 1 | 0.0090 | 0.037 |
| lazy | 5000 | 1 | 0.0123 | 0.065 |

Eager pays the fan-out at write time and reads are near-free. Lazy writes stay flat (stale marks only) and each read recomputes only what it asks for (k = 1).

### #11 Secret push vs pull

Lazy.

| Plane | Nodes | Write p95 (ms) | Read p95 (ms) |
|---|---:|---:|---:|
| public | 100 | 0.025 | 0.118 |
| secret | 100 | 0.124 | 0.879 |
| public | 300 | 0.021 | 0.090 |
| secret | 300 | 0.220 | 0.969 |
| public | 600 | 0.010 | 0.039 |
| secret | 600 | 0.152 | 1.666 |

Secret/public p95: write 4.9× / 10.7× / 15.5×, read 7.5× / 10.8× / 42.8× (100 / 300 / 600 nodes). The 600-node public read (0.039 ms) is the low outlier behind the 42.8×.

### #5 Sustained mutation

2,000 eager writes, 4,000 dependents each.

| p50 (ms) | p95 (ms) | p99 (ms) | max (ms) |
|---:|---:|---:|---:|
| 111.96 | 140.72 | 159.47 | 1,082.6 |

Windowed p50 rises from 98.2 ms (writes 1–200) to 125.7 ms (1801–2000); p95 drift +8.3%. `k` is constant, but recomputed values are appended to the memory log, so cost grows with history.

### Regression gate

```txt
✅ complexity_k_exact -> k=1500 (expected=1500), inputs=2, source=master
✅ complexity_k_exact -> k=4000 (expected=4000), inputs=2, source=master
✅ complexity_k_shadowed -> memories added=1 (expected=1, i.e. k=0)
✅ scaling_linear -> p50 t(500)=9.01ms t(1500)=29.50ms t(5000)=114.43ms; t(5000)/t(500)=12.70 (expected 5..15), 22.9µs/k (ceiling<=200)
✅ stealth_masking -> origin=stealth, masked=true, value=●●●●
✅ Benchmark regression gate passed.
```

### Vector stack (small, 4.2.1)

Correctness runs at small sizes, same box and kernel:

| File (v4.2.1) | Result |
|---|---|
| [benchmark.vector-corpus](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/tests/Benchmarks/benchmark.vector-corpus.ts) | 1,024 × 1536-d vectors, 601 vps, 4 columnar writes, chunks are `Float32Array`, read heap delta 14.4 MB. PASS |
| [Phase.3.0.search-exact](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/tests/Phases/Phase.3.0.search-exact.test.ts) | 4,112 × 256-d, 17 chunks, cold 1,174 ms, warm p50 3.08 ms / p95 4.99 ms, recall 1.0. PASS |
| [Phase.3.1.ivf](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/tests/Phases/Phase.3.1.ivf.test.ts) | 4,096 × 256-d, build 946 ms, p50 0.63 ms / p95 1.76 ms, recall@10 1.000, 2 chunks/query. PASS |

## Large phases on a Mac (4.2.1)

Every number in this section is **this.me 4.2.1**. Machine: Apple M2 MacBook Air, 8 GB, Node v24.13.1, V8 heap limit 2,240 MB. The run used a worktree at tag `v4.2.1` with the npm 4.2.1 `dist` (sha256 of `me.es.js` and `index.js` verified), on 2026-10-14. One run each, from log `me-4.2.1-phases-20261014-1402.log`. Times are wall clock; memory figures are from `/usr/bin/time -l`.

| Phase | Script (v4.2.1) | Result |
|---|---|---|
| 1 | [Phase.1GB.js](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/tests/Phases/Phase.1GB.js) | **Limit reached.** Stress test meant to find the ceiling: heap limit hit after 43.65 s, below the 170,869 items planned (1536 dims, chunks of 100) |
| 2 | [benchmark-100.ts](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/tests/Benchmarks/benchmark-100.ts) | 100,000 encrypted vectors, one leaf write each: 117.0 min, **14 vps**, 4.8 MB heap after GC |
| 3 | [benchmark.ivf-vs-exact.ts](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/tests/Benchmarks/benchmark.ivf-vs-exact.ts) | 100,000 vectors, two layouts, below |

### Phase 1: 1 GB batch write

| real | user | sys | max RSS | peak footprint |
|---:|---:|---:|---:|---:|
| 43.65 s | 87.21 s | 13.75 s | 1,845 MB | 1,959 MB |

Phase 1 is built to find the ceiling, and it did: the run hit the 2,240 MB V8 heap limit on the 8 GB M2 after 43.65 s and stopped with a heap out-of-memory error. The ceiling is below the 170,869 planned items. The log did not record the exact item count at the failure.

### Phase 2: 100k encrypted leaf writes

| real | vps | heap after GC | max RSS | peak footprint |
|---:|---:|---:|---:|---:|
| 7,029.82 s | 14 | 4.8 MB | 430 MB | 992 MB |

Memory stays low (writes are disk-backed), but one encrypted leaf write at a time is slow: 14 vectors/s. Batched columnar ingest in Phase 3 reaches about 1,200 vps on the same machine.

### Phase 3: IVF vs exact search, 100k

Settings: `SIZES=100000`, batch 256, 1536 dims, 3 queries, K = 10, nprobe 3, 4 chunk representatives, sigma 0.05, scope `memory.episodic`. Both layouts used IVF k = 316 lists and 391 columnar writes.

| Layout | Ingest | Build | Exact p50 / p95 | IVF p50 / p95 | Coarse p95 | Recall@10 | Chunks / query | Speedup (p95) |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| `chunk_coherent` | 82.19 s, 1,217 vps | 204.9 s | 82,057 / 88,205 ms | 1,186 / 1,420 ms | 1.66 ms | **1.000** | 6.33 | 62× |
| `legacy_fragmented` | 83.31 s, 1,200 vps | 203.8 s | 81,945 / 85,250 ms | 2,047 / 2,154 ms | 1.77 ms | **0.133** | 12.00 | 40× |

| Layout | Heap after ingest / search | RSS | real | Peak footprint |
|---|---:|---:|---:|---:|
| `chunk_coherent` | 134.5 / 189.0 MB | 333.3 MB | 540.80 s | 686 MB |
| `legacy_fragmented` | 134.4 / 189.0 MB | 315.0 MB | 542.47 s | 688 MB |

- On the chunk-coherent layout, IVF returns the same top 10 as exact search (recall 1.000) about 62× faster at p95.
- On the fragmented layout, IVF is 40× faster but finds only **13% of the true top 10 (recall@10 = 0.133)** with nprobe 3. That speed comes from missing most of the right answers; it is not a usable result for this layout at these settings.
- Building the index takes about 3.4 minutes for 100k vectors on either layout.

The Apple M2 medians for #5–#11 are on build `2a173b7` (4.0.2 + the reference fix, 2026-09-26). The per-version timeline is on [Benchmarks across kernel versions](https://neurons-me.github.io/.me/docs/Benchmarks/benchmarks.html).

## Run them

```bash
# from Typescript/ at v4.2.1, after npm run build
npx tsx tests/Benchmarks/benchmark.6.fanout-sensitivity.test.ts
npx tsx tests/Benchmarks/benchmark.regression-gate.test.ts
```

## Related

[Core](./Core) · [Intelligence](./Intelligence) · [O(k)](https://neurons-me.github.io/.me/docs/O-k.html) · [Extreme Fan-Out](https://neurons-me.github.io/.me/docs/Extreme-Fan-Out.html) · [Benchmarks across kernel versions](https://neurons-me.github.io/.me/docs/Benchmarks/benchmarks.html)
