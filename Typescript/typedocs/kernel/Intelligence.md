# O(k) Intelligence

Recompute, evaluation and provenance in `this.me` **4.2.1**. Every example below was run with `node` against npm this.me 4.2.1; the comments are its real output. Source links point at tag [`v4.2.1`](https://github.com/neurons-me/.me/tree/v4.2.1/Typescript/src).

Concept first: [O(k)](https://neurons-me.github.io/.me/docs/O-k.html) · [me.explain(path)](https://neurons-me.github.io/.me/docs/Explain.html) · [Axioms](https://neurons-me.github.io/.me/docs/Axioms.html). Data structures: [Core](./Core).

| Module (v4.2.1) | Role |
|---|---|
| [derivation.ts](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/derivation.ts) | register, invalidate, recompute, `explain` |
| [evaluator.ts](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/evaluator.ts) | tokenizer and RPN evaluator |
| [core-write.ts](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/core-write.ts) | `postulate`, `replayMemories` ([L361–421](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/core-write.ts#L361-L421)) |
| [core-read.ts](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/core-read.ts) | reads, selectors, filters |
| [core-snapshot.ts](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/core-snapshot.ts) | `exportSnapshot`, `hydrate`, `importSnapshot` |

## Incremental recompute

```ts
import ME from "this.me";
const me = new ME();
me.finance.fuel_price(24.5);
me.fleet.trucks[1].fuel(200);
me.fleet.trucks[2].fuel(350);
me.fleet["trucks[i]"]["="]("cost", "fuel * finance.fuel_price");
me("fleet.trucks[1].cost"); // 4900
me("fleet.trucks[2].cost"); // 8575

me.finance.fuel_price(25);
me("fleet.trucks[1].cost"); // 5000
me("fleet.trucks[2].cost"); // 8750

me.fleet.trucks[3].fuel(100);
me("fleet.trucks[3].cost"); // 2500  ([i] also applies to children added later)
```

The write to `finance.fuel_price` goes through [`invalidateFromPaths` L824–961](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/derivation.ts#L824-L961): `refSubscribers["finance.fuel_price"]` names the two costs, and each is recomputed by [`recomputeTarget` L705–710](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/derivation.ts#L705-L710). In lazy mode (`setRecomputeMode("lazy")`, [core-dispatch.ts L11](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/core-dispatch.ts#L11)) the write only marks them stale; [`ensureTargetFresh` L757–812](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/derivation.ts#L757-L812) recomputes one when it is read.

## Evaluator

No `eval`, no `new Function`. Before anything runs, the expression must match a character whitelist, and the kernel's `unsafeEval` flag ([kernel-state.ts L114](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/kernel-state.ts#L114)) turns the evaluator off:

```ts
// evaluator.ts L334–335 (v4.2.1)
if (!/^[A-Za-z0-9_\s+\-*/%().<>=!&|\[\]"']+$/.test(raw)) return { ok: false };
if (self.unsafeEval) return { ok: false };
```

Then [`tokenizeEvalExpression` L47–151](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/evaluator.ts#L47-L151) and [`compileUncached` L228–322](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/evaluator.ts#L228-L322) (precedence table L232) produce RPN, cached per expression up to `COMPILED_EVAL_MAX` ([L199](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/evaluator.ts#L199)). Operators: `+ - * / %`, `> >= < <= == !=`, `&& || !`, parentheses.

```ts
me["="]("x", "2 + 3 * 4");             // me("x") → 14
me["="]("y", "(2 + 3) * 4");           // me("y") → 20
me["="]("z", "x > 10 && y % 3 == 2");  // me("z") → true

me.profile.age(21);
me.profile["="]("adult", "age >= 18"); // me("profile.adult") → true
me.profile["="]("bad", "1 + console.log(1)");
me("profile.bad");                     // undefined
```

`console.log` is not code here; it is read as a path that does not exist:

```json
{
  "path": "profile.bad",
  "derivation": {
    "expression": "1 + console.log(1)",
    "inputs": [{ "label": "console.log", "path": "console.log", "origin": "public", "masked": false, "status": "missing" }]
  },
  "meta": { "dependsOn": ["console.log"], "unresolved": { "reason": "missing-input", "inputs": ["profile.console.log"] } }
}
```

## explain

[`explain` L140–251](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/derivation.ts#L140-L251). A secret branch (`["_"]`) still feeds the formula; its value is masked in the trace ([L214–215](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/derivation.ts#L214-L215)).

```ts
const me = new ME();
me.finance["_"]("k-2026");
me.finance.fuel_price(24.5);
me.fleet.trucks[2].fuel(350);
me.fleet.trucks[2]["="]("cost", "fuel * finance.fuel_price");
me.explain("fleet.trucks.2.cost");
```

```json
{
  "path": "fleet.trucks.2.cost",
  "value": 8575,
  "expr": "fuel * finance.fuel_price",
  "derivation": {
    "expression": "fuel * finance.fuel_price",
    "inputs": [
      { "label": "fuel", "path": "fleet.trucks.2.fuel", "value": 350, "origin": "public", "masked": false, "status": "resolved" },
      { "label": "finance.fuel_price", "path": "finance.fuel_price", "value": "●●●●", "origin": "stealth", "masked": true, "status": "masked" }
    ]
  },
  "meta": { "dependsOn": ["fleet.trucks.2.fuel", "finance.fuel_price"], "lastComputedAt": 1792006834327 }
}
```

After a write, `meta` also carries the wave: `k`, `recomputed`, `changed`, `sourcePath`.

## Cycles

```ts
const me = new ME();
me["="]("b", "c + 1");
me["="]("c", "b + 1");
me("b"); // undefined
me("c"); // undefined
me.explain("b").meta.unresolved; // { reason: "cycle", cycle: ["b", "c"] }
```

Both members are committed as `undefined` by [`failCycle` L712–719](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/derivation.ts#L712-L719); nothing throws and the stack does not overflow.

## Snapshots

```ts
const snapshot = me.exportSnapshot();
Object.keys(snapshot);
// formatVersion, memories, localSecrets, localNoises, encryptedBranches,
// keySpaces, operators, identityRoot, migrationV4, migrationV4Values

const me2 = new ME();
me2.importSnapshot(snapshot);
me2("fleet.trucks.2.cost"); // 8575
me2.fleet.trucks[2].fuel(400);
me2("fleet.trucks.2.cost"); // 8575  (value restored, formula not live)
```

[`hydrate` L73–111](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/core-snapshot.ts#L73-L111) resets `derivations` (L95) and replays the memories; a `=` memory comes back as its value. A snapshot restores state, not the derivation graph: declare formulas again after import to make them live.

## Tests (v4.2.1)

```bash
npm run test:derivations   # refs, waves, pointer invalidation
npm run test:perf-fix      # compile cache, kernel perf fixes
npm run test:contracts     # DSL contract, incl. explain masks
```

## Related

[Core](./Core) · [Benchmarks](./Benchmarks) · [Operators](../Operators) · [Proxy calls](../Proxy-Calls) · [me.explain(path)](https://neurons-me.github.io/.me/docs/Explain.html) · [O(k)](https://neurons-me.github.io/.me/docs/O-k.html)
