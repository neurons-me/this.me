# Test Suite Overview

This page maps the full `tests/` directory: what exists, what each test validates, and how to run everything.

## Test Categories

| Category | Location | Purpose |
|---|---|---|
| Pre-build gate | `tests/pre-build.test.mjs` | Orchestrates release-critical checks before publish. |
| Axioms | `tests/axioms.test.ts` | Verifies invariants (stealth roots, hash-chain, LWW, pointers, operators). |
| Phases | `tests/phases.test.js` | End-to-end fire tests for feature phases 0-8. |
| Build compatibility | `tests/Builds/*` | Ensures CJS/ESM/UMD outputs behave correctly. |
| DSL contracts | `tests/contracts/dsl.contract.test.mjs` | Contract suite for selector/filter/broadcast/query behavior. |
| Benchmarks | `tests/Benchmarks/*` | Performance and complexity characterization. |
| Demos | `tests/Demos/*`, `tests/sand.ts` | Practical usage walkthroughs and exploratory scripts. |

## Run Commands

| Command | What It Runs |
|---|---|
| `npm run test:prebuild` | Build + Axioms + Phases + CJS/ESM/TS/UMD checks |
| `npm run test:contracts` | DSL contract suite |
| `npm run test:ts` | Type-check (`tsc --noEmit`) |
| `npm run test:umd` | UMD runtime compatibility test |

You can also run files directly:

```bash
node tests/axioms.test.ts
node tests/phases.test.js
node tests/contracts/dsl.contract.test.mjs
node tests/Benchmarks/benchmark.11.secret-push-vs-pull.test.ts
```

## Suggested CI Order

1. `npm run test:prebuild`
2. `npm run test:contracts`
3. Optional nightly: selected benchmarks + regression gate

## Navigation

- [Axioms & Phases](/tests/Axioms-and-Phases)
- [Build Compatibility Tests](/tests/Build-Compatibility)
- [Examples & Contracts](/tests/Examples-and-Contracts)
- [Performance & Benchmarks](/tests/Performance)
