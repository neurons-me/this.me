## Benchmark Overview
This benchmark suite exists to validate one claim: `.me` recomputation cost is driven by dependency path size (`k`), not total graph size (`n`).

## What We Have Achieved
Current benchmarks already demonstrate the core behavior in four complementary ways:

1. `benchmark.test.ts` (Algorithmic Scaling)
- Grows dataset size from small to large collections.
- Mutates one shared dependency and measures recompute latency.
- Uses `explain(path)` to confirm effort remains tied to dependency count, not dataset size.

2. `benchmark.2.test.ts` (Flat Collection Stress)
- Scales a broadcast rule over up to 10k nodes.
- Confirms fixed effort (`2` dependencies: local value + shared factor) for targeted verification reads.

3. `benchmark.3.tests.ts` (Setup vs Reaction Separation)
- Separates heavy setup cost (proxy + data construction) from mutation reaction cost.
- Validates the important runtime property: after warmup and indexing, single-leaf mutation reaction remains surgical.

4. `benchmark.4.test.ts` (Multi-Dataset Stress Lab)
- Tests three topologies: deep nesting, wide broadcast, and financial-style formulas.
- Confirms `explain(path)` tracks dependencies across different structures and reports reactive status.

Additionally, the Phase 8 fire test validates explainability + privacy behavior:
- `explain(path)` exposes derivation inputs.
- Inputs under secret scopes are still auditable but masked (`origin: "stealth"`, `masked: true`, value `●●●●`).

## What We Will Prove Next
The next benchmark wave will move from “works” to “provably stable under pressure”:

1. Throughput Under Sustained Mutation
- Run long mutation streams (thousands of updates) and track p50/p95/p99 latency.
- Goal: show no latency drift as total graph history grows.

2. Fan-Out Sensitivity Curves
- Increase number of dependents per shared source in controlled steps.
- Goal: quantify when recompute cost scales with fan-out and keep that behavior explicit and predictable.

3. Cold vs Warm Runtime Profiles
- Measure first-read (cold), post-warmup, and steady-state performance separately.
- Goal: isolate index-construction cost from true reactive recompute cost.

4. Explain Overhead Budget
- Compare mutation latency with and without `explain(path)` collection.
- Goal: prove observability remains low-overhead and production-safe.

5. Secret-Scope Performance Impact
- Benchmark equivalent formulas in public vs secret branches.
- Goal: measure encryption/masking overhead and verify bounded slowdown.

6. Regression Gates for CI
- Convert benchmark expectations into threshold checks.
- Goal: fail fast when latency, effort, or masking behavior regresses.

## Proof Criteria
We consider the benchmark program successful when:

- Recompute effort remains proportional to dependency path complexity (`k`).
- Large `n` growth does not cause linear recompute degradation for single-target reads.
- Explain traces remain correct and privacy-preserving under secret scopes.
- Performance envelopes (latency percentiles) stay within defined CI thresholds.
