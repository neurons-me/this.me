# Proxy Calls

How `me.whatever(what)` works in the TypeScript kernel, this.me **4.2.1**: one callable object, a JavaScript `Proxy`, turns property access into a path and a call into a write or a read.

Concept first: [me.whatever(what)](https://neurons-me.github.io/.me/docs/me-whatever-what.html) (writing and reading paths) · [me.explain(path)](https://neurons-me.github.io/.me/docs/Explain.html) (why a value has its value). This page maps that onto the source.

## Source map

All links are pinned to tag `v4.2.1` (the commit published to npm as this.me 4.2.1).

| File | Role | Where |
|---|---|---|
| `proxy.ts` | Builds the path from property access; decides member vs path | [`createProxy` L256–303](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/proxy.ts#L256-L303) · [member check L287–292](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/proxy.ts#L287-L292) · [`normalizeArgs` L32–36](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/proxy.ts#L32-L36) |
| `handleCall.ts` | Routes a call: root read, seed, root postulate, path write | [`handleCall` L87–156](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/handleCall.ts#L87-L156) |
| `core-write.ts` | Every write | [`postulate` L983–1101](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/core-write.ts#L983-L1101) · [`declareDerivation` L1129–1137](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/core-write.ts#L1129-L1137) |
| `core.ts` | Reads | [`readPath` L289–393](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/core.ts#L289-L393) |
| `operators.ts` | Detects operator calls such as `["="]` | [`isEvalCall` L196–223](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/operators.ts#L196-L223) |
| `derivation.ts` | Formulas, dependencies, invalidation, explain | [`explain` L140–251](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/derivation.ts#L140-L251) · [`registerDerivation` L577–608](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/derivation.ts#L577-L608) · [`invalidateFromPaths` L824–961](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/derivation.ts#L824-L961) |
| `me.ts` | The `ME` class and its members | [`class ME` L254](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/me.ts#L254) · [`inspect` / `explain` L474–484](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/me.ts#L474-L484) · [`readPath` L1548–1554](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/me.ts#L1548-L1554) |

## The example

Run against this.me 4.2.1 (npm):

```ts
import ME from "this.me";
const me = new ME();

me.colony.pantry.seeds(40);
me.colony.pantry.honey(12);
me.colony["="]("food", "pantry.seeds + pantry.honey");
me("colony.food");          // → 52
me.colony.pantry.seeds(45);
me("colony.food");          // → 57
me.explain("colony.food");  // → below
```

```json
{
  "path": "colony.food",
  "value": 57,
  "expr": "pantry.seeds + pantry.honey",
  "derivation": {
    "expression": "pantry.seeds + pantry.honey",
    "inputs": [
      { "label": "pantry.seeds", "path": "colony.pantry.seeds", "value": 45, "origin": "public", "masked": false, "status": "resolved" },
      { "label": "pantry.honey", "path": "colony.pantry.honey", "value": 12, "origin": "public", "masked": false, "status": "resolved" }
    ]
  },
  "meta": {
    "dependsOn": ["colony.pantry.seeds", "colony.pantry.honey"],
    "k": 1,
    "recomputed": ["colony.food"],
    "changed": ["colony.food"],
    "sourcePath": "colony.pantry.seeds"
  }
}
```

(`lastComputedAt` / `recomputedAt` timestamps omitted.)

## 1. Property access builds a path

`me` is a function wrapped in a `Proxy` ([L256–303](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/proxy.ts#L256-L303)). Its `get` trap ([L283–298](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/proxy.ts#L283-L298)) checks, in order:

1. a symbol → returned from the target;
2. `"!"` → the runtime plane, `createRuntimeProxy` ([L216](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/proxy.ts#L216));
3. `prop in self` → **a member** of the kernel instance: methods are returned bound to the caller scope ([L287–292](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/proxy.ts#L287-L292));
4. anything else → a new proxy one segment deeper: `[...path, prop]` ([L296–297](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/proxy.ts#L296-L297)).

So `me.colony.pantry.seeds` is a proxy holding `["colony", "pantry", "seeds"]`; nothing is read or written yet.

**The member check runs at every depth**, not only on the root: every proxy shares the same `self`. `me.colony.explain` is the `explain` method, not the path `colony.explain`:

```ts
typeof me.colony.explain;                      // → "function"
me.colony.explain("colony.food").value;        // → 57
```

Members are the `ME` instance API ([me.ts L474–919](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/me.ts#L474-L919)): `explain`, `inspect`, `execute`, `exportSnapshot`, `hydrate`, `learn`, `setRecomputeMode`, … plus inherited names such as `toString`. Any other name is a path.

## 2. A call is routed by `handleCall`

Calling a proxy runs its function body ([L261–280](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/proxy.ts#L261-L280)) → [`handleCall`](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/handleCall.ts#L87-L156):

| Call | Route | Lines |
|---|---|---|
| `me("a.b")`, `me("a")`, `me("_x")` | read: `readPath` | [L89–111](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/handleCall.ts#L89-L111) |
| `me("ana", "luna")` | seed identity (who + secret) | [L113–125](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/handleCall.ts#L113-L125) |
| `me()` | root proxy | [L128–130](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/handleCall.ts#L128-L130) |
| `me(expression)` | root postulate | [L133–137](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/handleCall.ts#L133-L137) |
| `me.a.b(v)` | write at `a.b`, returns a proxy for chaining | [L141–155](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/handleCall.ts#L141-L155) |

Arguments go through [`normalizeArgs`](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/proxy.ts#L32-L36): none → `undefined`, one → the value, several → an array. That is why `me.a.b()` is a write of `undefined`, not a read.

## 3. Write: `me.colony.pantry.seeds(45)`

1. `handleCall` (non-root) → `self.postulate(path, 45)` ([me.ts L1342](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/me.ts#L1342-L1344)).
2. [`postulate`](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/core-write.ts#L983-L1101): operator checks; a plain value is normalized and committed — [`commitValueMapping`](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/core-write.ts#L837-L956) → [`commitMemoryOnly`](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/core-write.ts#L473) (hash-chained memory) → [`applyMemoryToIndex`](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/core-index.ts#L93-L151).
3. [`invalidateFromPaths`](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/derivation.ts#L824-L961) recomputes dependents: here `colony.food` (`k = 1`, `sourcePath = "colony.pantry.seeds"` above).
4. `handleCall` returns a proxy on the same branch ([L147–155](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/handleCall.ts#L147-L155)).

## 4. Read: `me("colony.food")`

1. Root call with one string: [`classifyPathExpression`](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/path-expr.ts#L149) (aggregate strings go to `readPathExpression`); a dotted path goes to `readPath` ([L97–110](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/handleCall.ts#L97-L110)).
2. [`ME.readPath`](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/me.ts#L1548-L1554): stealth check for the caller scope ([L1520](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/me.ts#L1520)).
3. [`Core.readPath`](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/core.ts#L289-L393): transforms → selections → lazy refresh (`ensureTargetFresh`) → filters → secret branch scope → index / pointers.

## 5. Formula: `me.colony["="]("food", "pantry.seeds + pantry.honey")`

1. `"="` is not a member, so the path is `["colony", "="]`; the call passes `["food", "pantry.seeds + pantry.honey"]`.
2. [`isEvalCall`](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/operators.ts#L196-L223) recognises the operator inside [`postulate`](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/core-write.ts#L1030-L1070).
3. [`declareDerivation`](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/core-write.ts#L1129-L1137): [`registerDerivation`](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/derivation.ts#L577-L608) (inputs `colony.pantry.seeds`, `colony.pantry.honey`) → `computeDerivation` → `postulate(colony.food, 52, "=")`.
4. The chain continues on `colony`, the scope, because the leaf was an operator ([L148–149](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/handleCall.ts#L148-L149)).

## 6. `me.explain("colony.food")`

`explain` is a member (step 1) → [`ME.explain`](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/me.ts#L482-L484) → [`Derivation.explain`](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/derivation.ts#L140-L251): the value, `expr`, `derivation.inputs` (masked when an input is under a secret the caller can't see) and `meta` from the last recompute wave.

## Rust

Rust has no `Proxy`. Members are methods on `Kernel` and a path is always an argument, so a path can never shadow a member: `kernel.postulate("a.b", v)`, `kernel.read("a.b")`, `kernel.explain("a.b")`. Strings become paths through [`IntoPath`](https://github.com/neurons-me/.me/blob/rust-v0.3.3/Rust/src/kernel/path.rs#L118-L145) (`rust-v0.3.3`); `postulate` is at [mod.rs L633–639](https://github.com/neurons-me/.me/blob/rust-v0.3.3/Rust/src/kernel/mod.rs#L633-L639). See the [Rust API](https://neurons-me.github.io/.me/Rust/docs/API.html#paths-and-plural-selectors).

## Tests

[`dsl.contract.test.mjs`](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/tests/contracts/dsl.contract.test.mjs) at v4.2.1:

- [boot + basic set/get](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/tests/contracts/dsl.contract.test.mjs#L37-L45)
- [callable proxy survives hydrate](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/tests/contracts/dsl.contract.test.mjs#L46-L70)
- [runtime escape plane `me["!"]`](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/tests/contracts/dsl.contract.test.mjs#L275-L312)
- [explain() masks stealth inputs](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/tests/contracts/dsl.contract.test.mjs#L325-L349)
- [explain() exposes expr and recompute wave metadata](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/tests/contracts/dsl.contract.test.mjs#L350-L366)

## See also

[Runtime Surface](./Runtime-Surface) · [Operators](./Operators) · [Syntax](./Syntax) · [API: ME class](./api/classes/ME.html) · [me.whatever(what)](https://neurons-me.github.io/.me/docs/me-whatever-what.html) · [me.explain(path)](https://neurons-me.github.io/.me/docs/Explain.html)
