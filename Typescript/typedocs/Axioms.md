# Axioms: TypeScript validation

How [`tests/axioms.test.ts`](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/tests/axioms.test.ts) at **v4.2.1** checks each axiom against the kernel. Concept and live demos: [The Axioms of .me](https://neurons-me.github.io/.me/docs/Axioms.html).

## Run it

v4.2.1 has no npm script for this file. From `Typescript/` at tag `v4.2.1`: build, then run it (the test imports `../dist/index.js`). Node ≥ 22.18 or 23.6 runs `.ts` directly; on older Node use `npx tsx`.

```bash
git checkout v4.2.1 && cd Typescript
npm install && npm run build
node tests/axioms.test.ts
```

Each case gets a fresh `new ME()` ([L621](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/tests/axioms.test.ts#L621)), runs its `run(me)` assertions (`node:assert/strict`), then prints its `proofs` as `expected` / `returned` pairs (full output: run it, or see the values in each case's `proofs()`). The runner loop is [L613–637](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/tests/axioms.test.ts#L613-L637). The process exits 1 if any case fails.

## Result on npm 4.2.1

Run on 2026-10-14 with `tsx` (Node v20.19.2) against the npm this.me 4.2.1 `dist`, `dist/me.es.js` sha256 `0bd2cc60d15d…`. **13/13 passed, exit 0.**

```txt
AXIOMS SUMMARY: 13/13 passed
STATUS: ALL AXIOMS PASSED
```

## Cases

| Case (v4.2.1) | Axiom | What it asserts | Result |
|---|---|---|---|
| [A-struct-0 L101–129](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/tests/axioms.test.ts#L101-L129) | [A-struct-0](https://neurons-me.github.io/.me/docs/Axioms.html#a-struct-0--unified-callable-surface) | `me`, `me.profile` and `me.profile.name` are functions; a leaf call returns a chainable value; a path read does not throw | ✅ PASS |
| [A0 L130–165](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/tests/axioms.test.ts#L130-L165) | [A0](https://neurons-me.github.io/.me/docs/Axioms.html#a0--secret-root-stealth) | public `ledger.*` readable; `wallet` (under `_`) is `undefined`; `wallet.income` readable; the index has no `wallet` keys; an encrypted branch exists | ✅ PASS |
| [A1 L166–203](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/tests/axioms.test.ts#L166-L203) | [A1](https://neurons-me.github.io/.me/docs/Axioms.html#a1--identity-normalization-) | valid usernames accepted; `"Abella"` is normalized; invalid usernames throw; an `@` root-claim memory is recorded | ✅ PASS |
| [A2 L204–234](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/tests/axioms.test.ts#L204-L234) | [A2](https://neurons-me.github.io/.me/docs/Axioms.html#a2--path-bound-secret-scopes-_) | `profile["_"]` hides `profile`; leaves stay readable; the index has no `profile` subtree | ✅ PASS |
| [A3 L235–276](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/tests/axioms.test.ts#L235-L276) | [A3](https://neurons-me.github.io/.me/docs/Axioms.html#a3--noise-reset-) | writes before and after `wallet["~"]` carry different `effectiveSecret`; root stays stealth; post-noise leaf readable | ✅ PASS |
| [A3b L277–308](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/tests/axioms.test.ts#L277-L308) | [A3](https://neurons-me.github.io/.me/docs/Axioms.html#a3--noise-reset-) | nested secrets: both roots stealth; owner reads the leaf; `me.as(null)` (guest) cannot | ✅ PASS |
| [A3c L309–338](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/tests/axioms.test.ts#L309-L338) | [A3](https://neurons-me.github.io/.me/docs/Axioms.html#a3--noise-reset-) | nested secret plus noise on the same node: leaf written after the reset is readable by the owner, blocked for a guest | ✅ PASS |
| [A4 L339–370](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/tests/axioms.test.ts#L339-L370) | [A4](https://neurons-me.github.io/.me/docs/Axioms.html#a4--structural-pointers-__---) | `["__"]("wallet")` reads back as `{__ptr}`; reads through the pointer resolve target leaves; target root stays stealth | ✅ PASS |
| [A5 L371–403](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/tests/axioms.test.ts#L371-L403) | [A5](https://neurons-me.github.io/.me/docs/Axioms.html#a5--query-as-memory-event-) | `profile["?"]("name","city")` returns a function and records a `?` memory at `profile`; root stays stealth | ✅ PASS |
| [A6 L404–435](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/tests/axioms.test.ts#L404-L435) | [A6](https://neurons-me.github.io/.me/docs/Axioms.html#a6--tombstone-remove--) | value exists before `["-"]`; after it, the read is no longer the original cleartext | ✅ PASS |
| [A7 L436–472](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/tests/axioms.test.ts#L436-L472) | [A7](https://neurons-me.github.io/.me/docs/Axioms.html#a7--public--secret-coexistence) | after secret and noise writes, public `ledger.*` stays readable; secret root stealth; encrypted branch persists | ✅ PASS |
| [A8 L473–534](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/tests/axioms.test.ts#L473-L534) | [A8](https://neurons-me.github.io/.me/docs/Axioms.html#a8--hash-chain-integrity) | genesis `prevHash === ""`; every `prevHash` equals the previous `hash`; every hash recomputes (FNV-1a, [L91–98](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/tests/axioms.test.ts#L91-L98)) | ✅ PASS |
| [A9 L535–604](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/tests/axioms.test.ts#L535-L604) | [A9](https://neurons-me.github.io/.me/docs/Axioms.html#a9--deterministic-conflict-resolution-lww) | a later timestamp wins; two sequential writes with the same timestamp resolve by `seq` (the second wins, not the higher hash); read path and index agree | ✅ PASS |

## Kernel source exercised (v4.2.1)

| Axiom | Source |
|---|---|
| A-struct-0 | [proxy.ts `createProxy` L256–303](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/proxy.ts#L256-L303), [handleCall.ts L87–156](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/handleCall.ts#L87-L156) |
| A0, A2, A7 | [operators.ts `isSecretScopeCall` L130–141](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/operators.ts#L130-L141), [secret-context.ts `resolveBranchScope` L232–265](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/secret-context.ts#L232-L265), [core.ts `readPath` L289–393](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/core.ts#L289-L393), [core-index.ts `applyMemoryToIndex` L93–151](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/core-index.ts#L93-L151) |
| A1 | [operators.ts `normalizeAndValidateUsername` L90–100](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/operators.ts#L90-L100), [`isIdentityCall` L171–190](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/operators.ts#L171-L190) |
| A3, A3b, A3c | [operators.ts `isNoiseScopeCall` L143–154](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/operators.ts#L143-L154), [secret-context.ts `computeEffectiveSecret` L181–230](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/secret-context.ts#L181-L230), [me.ts `isStealthBlocked` L1520–1534](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/me.ts#L1520-L1534), [`as` L1581–1589](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/me.ts#L1581-L1589) |
| A4 | [operators.ts `isPointerCall` L156–169](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/operators.ts#L156-L169), [core-index.ts `resolveIndexPointerPath` L200–244](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/core-index.ts#L200-L244) |
| A5 | [operators.ts `isQueryCall` L225–261](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/operators.ts#L225-L261), [core-write.ts `postulate` query branch L1072](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/core-write.ts#L1072) |
| A6 | [operators.ts `isRemoveCall` L263–287](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/operators.ts#L263-L287), [core-write.ts remove branch L1083–1085](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/core-write.ts#L1083-L1085) |
| A8 | [core-write.ts `commitMemoryOnly` L473–508](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/core-write.ts#L473-L508) (`prevHash`), [utils.ts `hashFn` L7–14](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/utils.ts#L7-L14) |
| A9 | [core-index.ts `compareLWW` L58–78](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/core-index.ts#L58-L78), [`rebuildIndex` L163–189](https://github.com/neurons-me/.me/blob/v4.2.1/Typescript/src/core-index.ts#L163-L189) |

## Related

[The Axioms of .me](https://neurons-me.github.io/.me/docs/Axioms.html) · [Proxy calls](./Proxy-Calls) · [Operators](./Operators) · [Kernel Core](./kernel/Core) · [Identity-Bound Secrets](./Identity-Bound-Secrets)
