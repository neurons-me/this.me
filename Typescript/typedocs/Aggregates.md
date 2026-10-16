# Collection Aggregates (`x[]`, `x[].f`)

An empty `[]` after a collection path is an aggregate over its members: `robots[]` is the **count**,
`robots[].battery` the **sum** of field `battery`. Aggregates work in `me(path)`, in `me.explain(path)` and in
formula text, and a formula that holds one is recomputed when the collection changes.

Kernel: **this.me 4.2.1**. Every output on this page was run against the npm package `this.me@4.2.1`.
Language-neutral guide with runnable examples: [Collection aggregates](https://neurons-me.github.io/.me/docs/Aggregates.html).

## Source at v4.2.1

| File | What it holds |
|---|---|
| [`src/path-expr.ts`](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/path-expr.ts#L41-L67) | `AggregateOp`, `AggregateRef`, `RejectReason`, `PathExprClass`; [`classifyPathExpression`](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/path-expr.ts#L149) parses a string into plain / literal / aggregate / rejected. |
| [`src/aggregate.ts`](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/aggregate.ts#L110-L197) | `evaluateAggregate`: walks the public view of the collection, turns booleans into 1 / 0 ([L177](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/aggregate.ts#L177)), picks the domain ([L185](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/aggregate.ts#L185)), sums with [`exactSum`](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/aggregate.ts#L57-L63). |
| [`src/aggregate-index.ts`](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/aggregate-index.ts) | Change tracking: one pseudo path per collection, [`aggregateKey(C)`](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/aggregate-index.ts#L14-L17) = `C + ".\u0000[]"`, bumped by [`flushAggregateChanges`](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/aggregate-index.ts#L66-L91) when the public index changes under `C`. |
| [`src/derivation.ts`](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/derivation.ts#L34-L56) | `AggregateContext`, `AggregateResult`, and the explain entry of an aggregate input. |
| [`src/types.ts`](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/types.ts#L615-L641) | `MEDerivationUnresolved` and `MEDerivationRecord.aggregates`; the `aggregate` block of [`MEExplainResult`](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/types.ts#L701-L747). |

## The parsed reference

```ts
// src/path-expr.ts (v4.2.1)
export type AggregateOp = "count" | "sum";

export interface AggregateRef {
  /** The reference as written (after `[i]` substitution), e.g. `robots[3].batteries[].charge`. */
  text: string;
  /** Storage segments of the collection, e.g. ["robots", "3", "batteries"]. */
  collection: SemanticPath;
  /** Field path inside each member, or null for a count. */
  field: SemanticPath | null;
  op: AggregateOp;
}

export type RejectReason =
  | "nested-aggregate"          // x[].y[]  (more than one `[]`)
  | "operator-as-segment"       // z.[].w, [] , .[]
  | "whitespace-selector"       // z[ ].w
  | "selector-on-collection"    // x[a>1][], x[1..2][], x[[1,3]][], x[c => c.f][]
  | "invalid-field"             // x[].f[2], x[]x, x[].
  | "empty-collection-path"     // "[]" with nothing before it
  | "invalid-collection-path"   // a name with whitespace, a quoted selector after a dot, "a..b[]"
  | "dotted-literal-selector";  // z.["[]"].w — the canonical literal is z["[]"].w
```

`C[]` parses to `op: "count"` with `field: null`; `C[].f` to `op: "sum"` with `field: ["f"]`. A rejected form makes the
formula `undefined` with `meta.unresolved` = `{ reason: "evaluation-failed", detail: "rejected-path-form" }`.

## The result

```ts
// src/derivation.ts (v4.2.1)
export type AggregateContext = "public-view" | "authorized";

export interface AggregateResult {
  value: number | undefined;
  /** "resolved" | "absent" | "incomplete" | "deferred" | "non-finite" | "cycle" | "unsupported" */
  status: string;
  reason?: string;
  members: number | null;
  terms: number | null;
  domain: "number" | "boolean" | null;
  problems?: { count: number; sample: Array<{ path: string; kind: string }> };
}
```

- `value` is always a `number` or `undefined`, also for a boolean field: `true` counts as 1, `false` as 0.
- `domain` is `"boolean"` when every term was a boolean, `"number"` otherwise, `null` with no terms.
- An empty or missing collection is `status: "absent"`, value `undefined` (not `0`).
- A member without the field, or with a value that is neither a number nor a boolean, makes the result
  `"incomplete"` and `undefined`: there are no partial sums.
- The sum adds every term as an exact integer in units of 2^-1074 (BigInt) and rounds once, ties to even.

## Typing in your code

`ME` has an index signature (`[key: string]: any`), so path calls and `me(path)` are `any`. `explain` is typed:
`me.explain(path)` returns `MEExplainResult`. That type is not re-exported from the package root, so derive it from
the method:

```ts
import { ME } from "this.me";

type Explain = ReturnType<ME["explain"]>;
type ExplainInput = NonNullable<Explain["derivation"]>["inputs"][number];
type AggregateInfo = NonNullable<ExplainInput["aggregate"]>;

const me = new ME();
const m = me as any;
m.robots[1].battery(80); m.robots[1].ok(true);
m.robots[2].battery(50); m.robots[2].ok(false);
m.fleet["="]("oks", "robots[].ok");

const count: number | undefined = m("robots[]");
const ex: Explain = me.explain("fleet.oks");
const agg: AggregateInfo | undefined =
  ex.derivation?.inputs.find((i) => i.kind === "aggregate")?.aggregate;
const op: "count" | "sum" | undefined = agg?.op;
const domain: "number" | "boolean" | null | undefined = agg?.domain;
if (ex.meta.unresolved?.reason === "incomplete") {
  const status: string = ex.meta.unresolved.causes[0].status;
}
console.log(count, ex.value, op, domain, agg?.members, agg?.terms);
// 2 1 sum boolean 2 2
```

This file compiles with `tsc --strict` (TypeScript 5) against `this.me@4.2.1` and prints the line above.
`ex.meta.unresolved` is a discriminated union on `reason`: in the `"incomplete"` branch `causes` is required.

The `aggregate` block of an explain input:

```ts
// src/types.ts, MEExplainResult["derivation"]["inputs"][number] (v4.2.1)
kind?: "aggregate";
aggregate?: {
  collection: string;
  field: string | null;
  op: "count" | "sum";
  context: "public-view" | "authorized";
  coverage: "public-view" | "authorized";
  status: string;
  reason?: string;
  members: number | null;
  terms: number | null;
  domain: "number" | "boolean" | null;
};
```

## Examples (this.me 4.2.1)

```ts
import { ME } from "this.me";
const me = new ME() as any;

me.robots[1].battery(80); me.robots[1].ok(true);
me.robots[2].battery(50); me.robots[2].ok(true);
me.robots[3].battery(20); me.robots[3].ok(false);
me.robots[4].battery(90); me.robots[4].ok(true);

me("robots[]");                // 4
me("robots[].battery");        // 240
me("robots[].ok");             // 3

me.fleet["="]("avg", "robots[].battery / robots[]");
me("fleet.avg");               // 60

me.fleet["="]("oks", "robots[].ok");
me.explain("fleet.oks").derivation.inputs[0].aggregate;
// {"collection":"robots","field":"ok","op":"sum","context":"public-view","coverage":"public-view",
//  "status":"resolved","members":4,"terms":4,"domain":"boolean"}
me.explain("fleet.oks").meta.dependsOn;    // ["robots[].ok"]

me.robots[3].ok(true);
me("fleet.oks");               // 4
me.explain("fleet.oks").meta.sourcePath;   // "robots.3.ok"

me.robots[5].battery(70);      // robot 5 has no ok
me("fleet.oks");               // undefined
me.explain("fleet.oks").derivation.inputs[0].aggregate.problems;
// {"count":1,"sample":[{"path":"robots.5.ok","kind":"missing"}]}
```

Collection paths are bound from the root, even inside a scoped formula: under `fleet`, write
`fleet.squad[].hp`, not `squad[].hp` (that one is `undefined`). To count members that pass a test, declare the test
per member with `[i]` and sum it:

```ts
me.fleet.threshold(60);
me.robots["[i]"]["="]("canTake", "battery > fleet.threshold && ok");
me.fleet["="]("available", "robots[].canTake");
```

`sum(...)`, `count(...)`, `[*]`, ternaries, `(bool) * 1`, a selector before `[]` (`robots[battery > 40][]`) and a
second `[]` all give `undefined`.

## Cost

Each formula holding `C[]` / `C[].f` subscribes to `aggregateKey(C)`. A write that changes the public index under `C`
bumps that key, so every aggregate formula on `C` is recomputed and each one walks all members. With 1000 members
and one `r[].hi` aggregate, 200 member writes took 783.4 ms on Node 20 (3.92 ms per write).

## Tests

- [`tests/aggregate-path.test.ts`](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/tests/aggregate-path.test.ts) (165 passed on v4.2.1)
- [`tests/aggregate-eval.test.ts`](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/tests/aggregate-eval.test.ts) (77 passed)
- [`tests/Security/root-secret-aggregate-paths.test.ts`](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/tests/Security/root-secret-aggregate-paths.test.ts) (14 passed)
- [`tests/aggregate/exact-sum-ref.mjs`](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/tests/aggregate/exact-sum-ref.mjs)

`npm run test:aggregates` runs the first two.

See also: [Syntax](./Syntax.md) · [Operators & Logic](./Operators.md)
