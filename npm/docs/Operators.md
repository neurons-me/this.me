# Operators & Logic in `.me`

This document explains how `.me` interprets:

- `()` calls (writes, reads, operator invocations)
- `[]` selectors (indexing, broadcast, filters, ranges, transforms)
- kernel operators (`@`, `_`, `~`, `__`, `->`, `=`, `?`, `-`, `+`)

## Mental Model
`new ME()` returns a callable proxy:

- Property access builds a semantic path: `me.wallet.balance`
- Calling `()` executes a semantic action on that path.

Examples:

```ts
me.profile.name("Abella");   // write
me("profile.name");          // read by string path
me.wallet["_"]("secret-key"); // operator call on a path
```

## `()` Semantics
## 1) Write

```ts
me.a.b.c(123);
```

Writes `123` at path `a.b.c`.

## 2) Read (string path)

```ts
me("a.b.c");
```

Reads resolved value from path.

## 3) Operator call

```ts
me.path["="]("total", "price * qty");
me.path["?"](["a.b", "c.d"]);
me.path["-"]();
```

Operator behavior depends on the final token (`=`, `?`, `-`, etc.).

## `[]` Selector Semantics
## 1) Fixed key/index

```ts
me.items[1].price(10);
me("items[1].price"); // 10
```

## 2) Broadcast iterator `[i]`

```ts
me.items["[i]"]["="]("total", "price * qty");
```

Applies derivation to each existing member under `items`.

## 3) Logical filter

```ts
me("items[price > 100 && qty >= 2].price");
```

Returns only matching children.

## 4) Range

```ts
me("items[10..20].price");
```

Selects contiguous numeric keys.

## 5) Multi-select

```ts
me("items[[1,3,8]].price");
```

Selects sparse keys.

## 6) Transform selector

```ts
me("items[x => x.price * 0.9]");
```

Projection-style read transform.

## Operator Reference
## `@` Identity claim

```ts
me["@"]("Abella");
```

- Validates and normalizes username.
- Stores identity ref at target path (root or scoped).

## `_` Secret scope

```ts
me.wallet["_"]("my-secret");
me.wallet.balance(500);
```

- Declares secret scope at `wallet`.
- Scope root becomes stealth:

```ts
me("wallet"); // undefined
me("wallet.balance"); // 500
```

## `~` Noise scope

```ts
me.wallet["~"]("new-seed");
```

Resets inheritance chain for effective secret derivation below that scope.

## `__` / `->` Pointer

```ts
me.profile.card["->"]("wallet");
me("profile.card");         // { __ptr: "wallet" }
me("profile.card.balance"); // resolves through pointer
```

## `=` Derivation / assignment logic

```ts
me.order["="]("total", "subtotal + tax");
```

Creates tracked derivation (`dependsOn`) and stores evaluated result when resolvable.

Supported expression tokens include:

- numbers
- path identifiers (`a.b`, `price`, `wallet.balance`)
- arithmetic: `+ - * / %`
- comparison: `< <= > >= == !=`
- boolean: `&& || !`
- parentheses: `( ... )`

If expression is invalid/unresolvable, it remains declarative text (not arbitrary JS execution).

## `?` Query/collect

```ts
me.report["?"](["order.total", "order.tax"], (total, tax) => ({ total, tax }));
```

- Collects values from paths.
- Optional transform function receives collected values.
- Can return directly at root or assign at scoped path.

## `-` Remove

```ts
me.wallet.hidden["-"]("notes");
// or
me.wallet.hidden.notes["-"]();
```

Removes subtree and records auditable tombstone memory.

## `+` Define operator (kernel-level)

```ts
me["+"]("!", "custom");
```

Registers operator kind in runtime registry. Intended for advanced/kernel usage.

## Logic Resolution Notes
- Public paths resolve from derived index.
- Secret paths resolve from encrypted secret storage with stealth root behavior.
- Pointers can redirect path resolution.
- In lazy mode, derived targets may recompute on read if dependency versions changed.

## Practical Mini-Flow
```ts
const me = new ME();

me["@"]("Abella");
me.wallet["_"]("vault");
me.wallet.income(1000);
me.wallet.expenses.rent(400);
me.wallet["="]("net", "income - expenses.rent");

me("wallet");      // undefined (stealth root)
me("wallet.net");  // 600
console.log(me.explain("wallet.net"));
```

This combines identity, secret scoping, derivation logic, and explainability in one path-centric flow.
