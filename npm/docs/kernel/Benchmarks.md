## Benchmark Overview
This suite validates a single systems claim:

- Public-path recomputation should be bounded by dependency complexity (`k`), not dataset size (`n`).
- Secret-path overhead must be measurable, bounded, and continuously improved without changing DSL semantics.

## Benchmark Matrix
| Benchmark | File | What It Proves |
|---|---|---|
| #5 Sustained Mutation | `tests/Benchmarks/benchmark.5.sustained-mutation.test.ts` | Throughput stability over long mutation streams; p95 drift over time windows. |
| #6 Fan-Out Sensitivity | `tests/Benchmarks/benchmark.6.fanout-sensitivity.test.ts` | Latency behavior as fan-out grows, with constant derivation complexity `k`. |
| #7 Cold vs Warm | `tests/Benchmarks/benchmark.7.cold-warm-profiles.test.ts` | Separation of cold setup cost vs warm and steady-state runtime. |
| #8 Explain Overhead | `tests/Benchmarks/benchmark.8.explain-overhead.test.ts` | Observability overhead of `explain(path)` vs baseline mutation/read loops. |
| #9 Secret-Scope Impact | `tests/Benchmarks/benchmark.9.secret-scope-impact.test.ts` | Public vs secret latency envelope under equivalent workloads. |
| #10 Push vs Pull | `tests/Benchmarks/benchmark.10.push-vs-pull.test.ts` | Isolation of write-only (`push`) and first-read-after-write (`pull`) in eager vs lazy modes. |
| #11 Secret Push vs Pull | `tests/Benchmarks/benchmark.11.secret-push-vs-pull.test.ts` | Secret/public split of push vs pull; confirms secret-path cost structure after chunking/cache refactors. |
| Regression Gate | `tests/Benchmarks/benchmark.regression-gate.test.ts` | CI pass/fail checks for p95 latency, `k` complexity bound, and stealth masking correctness. |

## Latest Results (Local Baseline)
Machine: `Suis-MacBook-Air`  
Run context: local, March 2026

### #5 Throughput Under Sustained Mutation
| Metric | Value (ms) |
|---|---:|
| p50 | 0.0041 |
| p95 | 0.0077 |
| p99 | 0.0132 |
| max | 0.2680 |

Windowed p95 drift: `-65.79%` (end window vs start window).

Interpretation:
- No upward drift under sustained updates.
- Throughput remains stable as history grows.

### #6 Fan-Out Sensitivity Curves
| Fanout | k | p50 (ms) | p95 (ms) | p99 (ms) |
|---:|---:|---:|---:|---:|
| 10 | 2 | 0.0098 | 0.0185 | 0.0919 |
| 100 | 2 | 0.0059 | 0.0105 | 0.0158 |
| 500 | 2 | 0.0057 | 0.0091 | 0.0144 |
| 1000 | 2 | 0.0043 | 0.0068 | 0.0181 |
| 2500 | 2 | 0.0040 | 0.0056 | 0.0114 |
| 5000 | 2 | 0.0034 | 0.0038 | 0.0072 |

Interpretation:
- `k` stays constant at `2`.
- Latency stays in micro-to-low-millisecond range across fanout values.

### #7 Cold vs Warm Runtime Profiles
| Nodes | Cold (ms) | Warm (ms) | Steady Avg (ms) | Steady Min (ms) | Steady Max (ms) |
|---:|---:|---:|---:|---:|---:|
| 100 | 0.1899 | 0.0948 | 0.0161 | 0.0077 | 0.3110 |
| 1000 | 0.0082 | 0.0137 | 0.0044 | 0.0041 | 0.0067 |
| 5000 | 0.0095 | 0.0096 | 0.0047 | 0.0036 | 0.0109 |

Interpretation:
- Cold penalty is isolated.
- Warm/steady paths are consistently fast.

### #8 Explain Overhead Budget
| Mode | p50 (ms) | p95 (ms) | p99 (ms) |
|---|---:|---:|---:|
| baseline | 0.0055 | 0.0101 | 0.0173 |
| with_explain | 0.0092 | 0.0138 | 0.0244 |

`p95` overhead: `36.63%`.

Interpretation:
- `explain(path)` adds bounded overhead while preserving traceability.
- Absolute overhead remains sub-millisecond, making it production-safe for real-time auditing.

### #9 Secret-Scope Performance Impact
| Scope | p50 (ms) | p95 (ms) | p99 (ms) |
|---|---:|---:|---:|
| public | 0.0071 | 0.0150 | 0.1111 |
| secret | 0.2492 | 0.2968 | 0.5470 |

Secret `p95` slowdown vs public: `1878.33%`.

Interpretation:
- Secret path remains slower than public by design cost (crypto + boundary logic), but now sits in sub-millisecond p95 absolute range for this scenario.

### #10 Push vs Pull (Eager vs Lazy)
Selected rows (fanout = 5000):

| Mode | Fanout | k | Mutation p95 (ms) | Read p95 (ms) |
|---|---:|---:|---:|---:|
| eager | 5000 | 2 | 0.0017 | 0.0022 |
| lazy | 5000 | 2 | 0.0028 | 0.0027 |

Interpretation:
- Both modes are now low-latency.
- Lazy/eager semantics are selectable without destabilizing performance envelopes.

### #11 Secret Push vs Pull (Chunked Secret Storage)
| Plane | Nodes | Mutation p95 (ms) | Read p95 (ms) |
|---|---:|---:|---:|
| public | 100 | 0.0056 | 0.0121 |
| secret | 100 | 0.0216 | 0.3438 |
| public | 300 | 0.0027 | 0.0045 |
| secret | 300 | 0.0122 | 0.1566 |
| public | 600 | 0.0027 | 0.0041 |
| secret | 600 | 0.0117 | 0.2653 |

Slowdown ratios (secret/public p95):

| Nodes | Mutation slowdown x | Read slowdown x |
|---:|---:|---:|
| 100 | 3.86x | 28.41x |
| 300 | 4.52x | 34.80x |
| 600 | 4.33x | 64.71x |

Interpretation:
- Chunking and cache reduced secret mutation slowdown to single-digit multiples.
- Read slowdown remains higher than write slowdown, but absolute read p95 remains sub-millisecond.

## Regression Gate Status
Latest gate output:

- `latency_p95`: ✅ `0.0125ms` (threshold `20ms`)
- `complexity_k`: ✅ `k=2` (threshold `<=4`)
- `stealth_masking`: ✅ `origin=stealth`, `masked=true`, `value=●●●●`

## What Is Proven Now
- Public-path performance is stable and effectively bounded by small `k`.
- Lazy/eager recompute modes are operational and benchmarked.
- Explainability overhead is measurable and bounded.
- Secret-path cost is no longer monolithic; chunked secret storage materially improved write-side scaling.
- Privacy and semantic invariants remain intact (`test:prebuild` green).

## Next Optimization Frontier
- Further reduce secret read p95 under high node counts by:
- increasing chunk locality for hot-read paths,
- optional multi-read amortization benchmarks (`reads_per_mutation`),
- and tuning chunk size/hash-bucket parameters with empirical thresholds.
