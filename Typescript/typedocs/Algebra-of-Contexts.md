# Algebra of Contexts

Where the algebra of spaces (path, refinement, plural, derivation, secret audience) lives in the [v4.2.1 TypeScript source](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/package.json), which test proves each part, and what npm this.me 4.2.1 returns. Concept: [Algebra of Contexts](https://neurons-me.github.io/.me/docs/Algebra-of-Contexts.html) (also [Syntax: Algebra first](https://neurons-me.github.io/.me/docs/Syntax.html#algebra-first)). Theory: [Digital Space Algebra](https://neurons-me.github.io/digital-space-algebra/), [Encrypted Audiences](https://suign.github.io/EncryptedAudiences.html).

## Map

| Concept | Source (v4.2.1) | Test (v4.2.1) |
|---|---|---|
| Space ⊇ subspace: a path is a list of segments | [proxy.ts `createProxy` L256–303](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/proxy.ts#L256-L303), [core.ts `readPath` L289–393](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/core.ts#L289-L393) | [dsl.contract L37–45](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/tests/contracts/dsl.contract.test.mjs#L37-L45) |
| Selected subspace `x[pred]` | [core-read.ts `evaluateFilterPath` L247–272](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/core-read.ts#L247-L272) | [dsl.contract L223–236](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/tests/contracts/dsl.contract.test.mjs#L223-L236) |
| Plural `x[]` (count) and `x[].f` (sum) | [aggregate.ts `evaluateAggregate` L110–197](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/aggregate.ts#L110-L197) | [aggregate-path.test.ts](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/tests/aggregate-path.test.ts) |
| Derivation `=` over members `[i]` | [derivation.ts `registerDerivation` L577–608](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/derivation.ts#L577-L608) | [derivation-wave.test.ts](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/tests/derivation-wave.test.ts) |
| Secret scope: readable audience `{self}` | [secret-context.ts `resolveBranchScope` L232–265](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/secret-context.ts#L232-L265), [me.ts `as` L1581–1589](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/me.ts#L1581-L1589) | [axioms.test.ts A0/A2](./Axioms) |
| Explain with masked secret inputs | [derivation.ts `explain` L140–251](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/derivation.ts#L140-L251), mask L214–215 | [dsl.contract L325–348](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/tests/contracts/dsl.contract.test.mjs#L325-L348) |
| Deriving from a secret: no keyless leak | same plus [core-write.ts `postulate` L983–1101](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/core-write.ts#L983-L1101) | [derived-from-secret.test.ts L185–216](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/tests/Security/derived-from-secret.test.ts#L185-L216) |
| Audiences: OR / AND coalitions, minus, reseal | [audience.ts `canonicalize` L86–89](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/audience.ts#L86-L89), [`minus` L101–107](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/audience.ts#L101-L107), [`sealAudience` L207–226](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/audience.ts#L207-L226), [`openAudience` L229–247](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/audience.ts#L229-L247) | [audience-algebra.test.ts L77–207](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/tests/Security/audience-algebra.test.ts#L77-L207) |
| Namespace: `me://handle.space[selector]/path` | [me-uri.ts `parseMeUri` L284–332](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/me-uri.ts#L284-L332) | [me-uri.test.ts](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/tests/me-uri.test.ts) |

## Outputs on npm 4.2.1

`node` against the npm this.me 4.2.1 `dist`, 2026-10-14.

```ts
import ME, { parseMeUri } from "this.me";
const me = new ME();

me.profile.contact.email("abella@neurons.me");
me("profile.contact.email");          // "abella@neurons.me"

me.friends[1].age(17); me.friends[2].age(34); me.friends[3].age(21);
me("friends[age > 18].age");          // { "2": 34, "3": 21 }
me("friends[]");                      // 3
me("friends[].age");                  // 72

me.friends["[i]"]["="]("adult", "age >= 18");
me("friends[1].adult");               // false
me.friends[1].age(19);
me("friends[1].adult");               // true
me.explain("friends.1.adult").meta.k; // 1

me.wallet["_"]("vault-key");
me.wallet.hidden.note("private");
me("wallet");                         // undefined
me("wallet.hidden.note");             // "private"
me.as(null)("wallet.hidden.note");    // undefined  (guest)

me.wallet.balance(500);
me["="]("budget", "wallet.balance * 0.1");
me.explain("budget").value;           // 50
me.explain("budget").derivation.inputs;
// [{ path: "wallet.balance", value: "●●●●", origin: "stealth", masked: true, … }]

parseMeUri("me://suign.neurons.me[macbook]/profile.name");
// { href: "me://suign.neurons.me[surface:macbook]/profile.name",
//   handle: "suign", space: "neurons.me",
//   selector: { kind: "surface", value: "surface:macbook" },
//   path: "profile.name", segments: ["profile", "name"] }
```

## Test runs on 4.2.1

| Test (v4.2.1) | Runs against | Result |
|---|---|---|
| `tests/contracts/dsl.contract.test.mjs` | npm 4.2.1 `dist` | Phase 6 contract suite passed |
| `tests/aggregate-path.test.ts` | npm 4.2.1 `dist` | 165 passed, 0 failed |
| `tests/derivation-wave.test.ts` | npm 4.2.1 `dist` | all wave cases passed |
| `tests/Security/derived-from-secret.test.ts` | npm 4.2.1 `dist` | 11 passed, 0 failed |
| `tests/me-uri.test.ts` | v4.2.1 `src/me-uri.ts` | passed |
| `tests/Security/audience-algebra.test.ts` | v4.2.1 `src/audience.ts` | 16 passed, 0 failed (laws L1–L9 plus AND/OR cases) |

`audience.ts` is in the v4.2.1 source but not exported by the npm 4.2.1 package, so audiences are only reachable from source.

Derived-from-secret, the cases that matter here:

```txt
✅ 5. GUARANTEE: a keyless party declaring a derivation over the secret gets nothing computed from it
✅ 6. GUARANTEE: mixing the secret with a public value (price * fuel) reveals nothing to a keyless party
✅ 8. GUARANTEE: an owner-declared derivation produces no new secret-derived values once the key is gone
```

## Related

[Algebra of Contexts (concept)](https://neurons-me.github.io/.me/docs/Algebra-of-Contexts.html) · [Digital Space Algebra](https://neurons-me.github.io/digital-space-algebra/) · [Proxy calls](./Proxy-Calls) · [Axioms: TypeScript validation](./Axioms) · [Kernel Core](./kernel/Core) · [Plurality Is Grammar](./Plurality-Is-Grammar) · [Syntax](https://neurons-me.github.io/.me/docs/Syntax.html) · [me.explain(path)](https://neurons-me.github.io/.me/docs/Explain.html)
