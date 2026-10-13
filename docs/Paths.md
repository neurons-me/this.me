---
layout: gui-doc
title: "me.whatever(what)"
description: "How a path is written and read in this.me 4.2.1: me.a.b(value) declares, me(\"a.b\") reads, chaining, bracket indexes, which names are kernel methods, and why me.a.b() with no argument is not a read. From the kernel source."
mepath:
  - text: Docs
    url: https://neurons-me.github.io/.me/docs/
canonical: https://suign.github.io/MeWhateverWhat.html
crumb: me.whatever(what)
---

# me.whatever(what)

Writing with `me.a.b(value)`, reading with `me("a.b")`.

> Every property access on `me` extends a path. Calling it with a value declares; calling the root with the path string reads.

Kernel: **this.me 4.2.1** ([npm](https://www.npmjs.com/package/this.me)). Source: [`createProxy` in proxy.ts](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/proxy.ts#L256-L303), [`handleCall` in handleCall.ts](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/handleCall.ts#L87-L156), [`postulate` in core-write.ts](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/core-write.ts#L983).

## Write and read

```ts
import { ME } from "this.me";
const me = new ME() as any;

me.fleet.trucks[1].fuel(80);          // write: path fleet.trucks.1.fuel = 80
me("fleet.trucks.1.fuel");            // read → 80
me("fleet.trucks[1].fuel");           // read → 80 (same path)
```

- `me.a.b` builds the path `["a", "b"]`; nothing is read or written until it is called ([createProxy](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/proxy.ts#L256-L303)).
- `me.a.b(value)` declares `value` at `a.b` (`postulate(path, value)`), recomputes what depends on it, and returns a proxy on the same path, so calls chain.
- `me("a.b")` reads. At the root, a single string that is a dotted path, a single label, or starts with `_`, `~` or `@` is routed to the read ([handleCall](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/handleCall.ts#L88-L111)). `trucks[1]` and `trucks.1` name the same segment.

## A call with no argument is not a read

```ts
me.a.b(5);
me.a.b();          // returns a proxy, and declares undefined at a.b
me("a.b");         // → undefined
```

On a non-root path, `handleCall` passes the arguments to `postulate` whatever they are; with none, the expression is `undefined` ([handleCall.ts](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/handleCall.ts#L141-L155)). To read, use `me("a.b")`.

## Chaining

```ts
me.d.e(2).f(3);    // d.e = 2, then d.e.f = 3
me("d.e.f");       // → 3
```

A write returns a proxy on the path it wrote (an operator leaf returns its scope instead), so the next segment continues from there.

## Derived values

```ts
me.fleet["="]("total", "trucks[1].fuel + trucks[2].fuel");
me("fleet.total");                    // the derived value, read like any path
me.explain("fleet.total");            // its formula, inputs and last wave
```

`["="]` declares a formula on a path; reading it is the same `me(path)`. [me.explain(path)](./Explain.html) shows why it has its value.

## Names that are not paths

The proxy first checks whether the property exists on the kernel instance ([proxy.ts](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/proxy.ts#L285-L295)): if it does, you get that member, not a path. Public examples: `me.explain`, `me.inspect`, `me.execute`, `me.exportSnapshot`, `me.hydrate`, `me.setRecomputeMode`, `me.getRecomputeMode`, `me.prove`, `me.learn`. Inherited object names (`toString`, `constructor`) are also members. `me["!"]` enters the runtime plane.

Any other name is a path. There is no instance method called `subscribe`, for example: `me.subscribe("x")` writes the fact `subscribe = "x"`.

## Root calls

| Call | What it does |
|---|---|
| `me("a.b")` | Reads the path. |
| `me()` | Returns the root proxy. |
| `me("ana", "luna")` | Two strings, the first a bare label: seeds the identity (who + secret). |
| `me(expression)` | Anything else: a root postulate. |

## See also

[me.explain(path)](./Explain.html) · [Primitives](./Primitives.html) (the two verbs: declare and resolve) · [me:// URI grammar](./me-uri.html) · [Syntax](./Syntax.html) · [Axioms](./Axioms.html) (A-struct-0: one callable, chainable value)
