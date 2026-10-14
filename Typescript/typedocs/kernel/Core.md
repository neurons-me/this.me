# Kernel Core

How a write in `this.me` reaches only the values that depend on it. Every link and number on this page is **this.me 4.2.1** (tag [`v4.2.1`](https://github.com/neurons-me/.me/tree/v4.2.1/Typescript/src); the npm 4.2.1 `dist` is built from the same `src`).

Concept first: [O(k)](https://neurons-me.github.io/.me/docs/O-k.html) · [me.explain(path)](https://neurons-me.github.io/.me/docs/Explain.html) · [Extreme Fan-Out](https://neurons-me.github.io/.me/docs/Extreme-Fan-Out.html). How a call becomes a path: [Proxy calls](../Proxy-Calls).

## Cost model

`k` is the number of derived values one write recomputes; `n` is everything else in the tree. A write costs O(k), and `explain(path).meta.k` reports `k` for the last wave.

| Piece | Source (v4.2.1) |
|---|---|
| Derivation state: `derivations`, `refSubscribers`, `refVersions`, `derivationRefVersions`, `staleDerivations`, `recomputeMode` | [kernel-state.ts L102–108](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/kernel-state.ts#L102-L108) |
| `registerDerivation`: parse refs, subscribe source → target | [derivation.ts L577–608](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/derivation.ts#L577-L608) |
| `extractExpressionRefs` | [derivation.ts L289–299](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/derivation.ts#L289-L299) |
| `subscribe` (the inverted index) | [derivation.ts L484](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/derivation.ts#L484) |
| `invalidateFromPaths`: walk subscribers, eager wave or stale marks | [derivation.ts L824–961](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/derivation.ts#L824-L961) |
| `recomputeTarget` (early cutoff) | [derivation.ts L705–710](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/derivation.ts#L705-L710) |
| `ensureTargetFresh` (lazy read) | [derivation.ts L757–812](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/derivation.ts#L757-L812) |
| `unregisterDerivation` | [derivation.ts L551–559](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/derivation.ts#L551-L559) |
| Cycles: `failCycle` | [derivation.ts L712–719](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/derivation.ts#L712-L719) |

## Inverted index

On `["="]` the kernel extracts the formula's references and records `source path → [target paths]` in `refSubscribers`. A write to a source walks only that entry:

```txt
write(source) → invalidateFromPaths([source])
              → refSubscribers[source] → targets
              → eager: recomputeTarget(target), then its own subscribers
              → lazy:  mark stale; ensureTargetFresh(target) on read
```

`recomputeTarget` returns whether the value changed. Dependents of an unchanged value are not recomputed (early cutoff, `explain().meta.changed`).

## Measured on 4.2.1

1,200 trucks, one `[i]` formula, eager mode (default). Run with `node` on npm this.me 4.2.1; box: Intel Xeon, 8 vCPU, Node v20.19.2, 2026-10-14, p50 of 30.

```ts
import ME from "this.me";
const me = new ME();
me.finance.fuel_price(24.5);
for (let i = 1; i <= 1200; i++) me.fleet.trucks[i].fuel(100 + (i % 50));
me.fleet["trucks[i]"]["="]("cost", "fuel * finance.fuel_price");

me.finance.fuel_price(99);
me.explain("fleet.trucks.600.cost").meta.k; // 1200
me.fleet.trucks[600].fuel(1);
me.explain("fleet.trucks.600.cost").meta.k; // 1
me("fleet.trucks.600.cost");               // 99
```

| Measure | 4.2.1 |
|---|---:|
| Setup (1,200 writes + formula + first read) | 149–187 ms |
| Global write `finance.fuel_price` + read, k = 1,200 | 32–34 ms |
| Local write `trucks[600].fuel` + read, k = 1 | 0.12 ms |

Larger sweeps: [Kernel benchmarks](./Benchmarks).

## Evaluator

Formulas run in a small evaluator, not `eval` or `new Function`: tokenize, precedence (shunting-yard) to RPN, evaluate. Source: [`tokenizeEvalExpression` L47–151](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/evaluator.ts#L47-L151), [`compileUncached` L228–322](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/evaluator.ts#L228-L322), [`tryEvaluateAssignExpression` L324–429](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/evaluator.ts#L324-L429). Details and outputs: [Intelligence](./Intelligence#evaluator).

## explain() and secrets

`explain(path)` ([derivation.ts L140–251](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/derivation.ts#L140-L251)) returns the expression, every input with its path, origin and status, and `meta` (`dependsOn`, `k`, `recomputed`, `changed`). Inputs read from a secret branch are returned as `●●●●` with `masked: true` ([L214–215](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/derivation.ts#L214-L215)). Example output: [Intelligence](./Intelligence#explain).

## Snapshots

[`exportSnapshot` L44–57](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/core-snapshot.ts#L44-L57) emits the memory log and the secret planes (`localSecrets`, `localNoises`, `encryptedBranches`, `keySpaces`, …). [`hydrate` L73–111](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/core-snapshot.ts#L73-L111) rebuilds from them and resets `derivations` (L95). Values come back; live formulas do not (see [Intelligence](./Intelligence#snapshots)).

## Guarantees and limits in 4.2.1

- **Memories.** Every write is appended to the memory log ([Memory](../Memory)).
- **Cycles.** `a = b + 1`, `b = a + 1` does not overflow: both values are `undefined` and `explain().meta.unresolved` is `{ reason: "cycle", cycle: [...] }`.
- **Cleanup.** Redefining a target ([L584](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/derivation.ts#L584)) or removing a subtree ([`clearDerivationsByPrefix` L1052–1066](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/derivation.ts#L1052-L1066)) calls `unregisterDerivation`, which drops its subscriptions.
- **Log growth.** Recomputed values are appended too, so a long eager stream grows the log ([#5](./Benchmarks#_5-sustained-mutation)).

## Related

[Intelligence](./Intelligence) · [Benchmarks](./Benchmarks) · [Proxy calls](../Proxy-Calls) · [Axioms](../Axioms) · [O(k)](https://neurons-me.github.io/.me/docs/O-k.html) · [me.explain(path)](https://neurons-me.github.io/.me/docs/Explain.html)
