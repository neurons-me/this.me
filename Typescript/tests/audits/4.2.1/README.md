# Audit: `perf/eval-compile-cache` against the .me axioms and phases

Released as **this.me 4.2.1**. Audited on the branch `perf/eval-compile-cache` (base `v4.2.0`, `2659ff7`), then
rebased onto main without changes to the code: `cccec95` → `51a3fea`, `610a115` → `46d844e`, `b43cb05` → `6856789`.
The 4.2.1 `dist/` is byte-identical to the audited and measured `b43cb05` build. Commits audited:

| Commit | What |
|---|---|
| `cccec95` | evaluator: tokenizer tables built once; formula text compiled once to postfix and memoized by exact text |
| `610a115` | secret-context: `resolveBranchScope` returns `null` without the scope LRU when no secret scope exists |
| `b43cb05` | **audit fixes + tests** (added during this audit, see "Changes made") |

Sources of the definitions: `Typescript/typedocs/Axioms.md` (A-struct-0, A0–A9), `tests/axioms.test.ts`
(13 ids: A-struct-0, A0, A1, A2, A3, A3b, A3c, A4, A5, A6, A7, A8, A9), `typedocs/Phases.md` +
`tests/phases.test.js` (Phases 0, 1, 2, 3, 3.1, 4, 5, 6, 7A, 7B, 8), `typedocs/kernel/Core.md`
(Phase 8 dependency mapping, Phase C hermetic evaluator, 7A/7B portability).

## What the fix touches (and only this)

1. `evaluator.ts / tryEvaluateAssignExpression`: same order of checks as 4.2.0 — trim → empty → grammar
   character class → `unsafeEval` → **(new) compile memo lookup** → evaluate postfix reading every input via
   `readPath` at evaluation time. The memo stores only the postfix token list derived from the text
   (literals parsed from the text, identifier strings, operator strings, aggregate refs parsed from the text).
   `isTokenizableExpression` and `tokenizeEvalExpression` are unchanged in behavior (tables hoisted).
2. `secret-context.ts / resolveBranchScope`: when `localSecrets` has no enumerable key, the same prefix
   lookups as the original walk are done directly (no scope cache). With any key present, the original cached
   walk runs unchanged.
3. Kernel state: new `compiledEvalMemo: Map` (per kernel, shared by kernel and proxy like the other caches),
   cleared in `bumpSecretEpoch` with `scopeCache` etc.

Not touched: write path (`postulate`, `commitValueMapping`, memories, hash chain, `seq`), read gating
(`core-read`, stealth checks), crypto (blob v3/v4, key derivation), pointers, removal/tombstones, snapshot
export/hydrate, replay, the derivation wave (topological order, cutoff, cycles), explain.

## Per axiom

| Axiom | Requires (repo definition) | Path touched? | Why it holds | Evidence |
|---|---|---|---|---|
| **A-struct-0** Unified callable surface | `me` is callable and infinitely chainable | No (proxy untouched). New state field `compiledEvalMemo` is copied onto the proxy like `scopeCache`; `me.compiledEvalMemo` is a Map, not a path | Property access/apply unchanged; the field name cannot collide with user paths any more than existing cache fields | axioms A-struct-0 ✅; perf-fix-kernel (memo reachable, chained writes) ✅ |
| **A0** Secret root stealth | secret subtree readable by full path, root invisible | Indirect: `resolveBranchScope` (used by index writes/reads of scoped paths) | With a scope declared the original walk runs unchanged; with none the answer is the same as the walk's for every path (proven over 16 path shapes × 3 map prototypes, incl. inherited keys like `toString`) | axioms A0 ✅; unit "identical to the original walk…" ✅; kernel "fast path flips at the first scope" (`me("fin")` undefined, `me("fin.price")`=2) ✅ |
| **A1** Identity normalization `@` | identity normalized/validated before commit | No | Not on the evaluator or scope path | axioms A1 ✅ |
| **A2** Path-bound secret scopes `_` | secrecy bound to a path, not global | Indirect (same as A0) | Fast path only when *no* path is bound; flips on the first `_` (enumerable key appears); also flips back after the scope is removed | axioms A2 ✅; unit "flips … and back when removed" ✅; kernel flip + removal ✅ |
| **A3** Noise reset `~` | secret derivation resettable at a boundary | No (`localNoises` never read by the changed code) | Noise handling is in the secret chain, untouched | axioms A3 ✅; differential `nested` (secret + noise + formula) identical ✅ |
| **A3b** Nested secret owner reads | owner reads nested secret leaf; guest (`as(null)`) gets undefined | Indirect | Scopes exist → original walk; memo clears on each `_` | axioms A3b ✅; differential `nested` ✅ |
| **A3c** Nested secret + same-node noise | owner readable, guest undefined | Indirect | Same as A3b | axioms A3c ✅ |
| **A4** Structural pointers `__`/`->` | pointers stay data; deref when traversed | Evaluator: `__ptr.` identifiers | Identifiers are cached as strings only; deref (`getIndex` + `readPath`) still happens at every evaluation | axioms A4 ✅; differential `ptr` (20 → 22 after retarget value change) ✅; pointer-target-invalidation tests ✅ |
| **A5** Query as memory event `?` | queries recorded as memories | No | Query path untouched | axioms A5 ✅ |
| **A6** Tombstone remove `-` | deletion auditable, irreversible at read | Indirect: after removing a scoped subtree, `localSecrets` can become empty → fast path | Fast path is answer-equivalent; readers of removed paths become `missing-input` as in 4.2.0 | axioms A6 ✅; kernel "after snapshot … `me['-']('fin')`" (`missing-input`) ✅ |
| **A7** Public + secret coexistence | private ops never leak into public view | Indirect + evaluator | Memo holds no values (asserted: a 987654 input never appears in it), is per kernel, cleared on secret epoch; explain still masks stealth inputs (`●●●●`) | axioms A7 ✅; unit "memo never captures values…" ✅; kernel explain masking ✅ |
| **A8** Hash chain integrity | tamper-evident memory chain | No | Memories, hashes, `prevHash` untouched; same values written (differential identical) | axioms A8 ✅; security §4 crypto/format 18/18 ✅ |
| **A9** Deterministic LWW | `seq` then hash decides | No | Write ordering untouched; memo is deterministic (pure function of text) | axioms A9 ✅; security "sequential writes, live vs rebuilt index (A9)" 10/10 ✅ |

## Per phase

| Phase | Requires | Path touched? | Why it holds | Evidence |
|---|---|---|---|---|
| **0** Identity + secret scope | `me("finance")` undefined, leaf readable | Indirect (scope fast path flips at first `_`) | See A0/A2 | phases 0 ✅ |
| **1** Structural selectors `[]` | numeric/string keys first-class | No | — | phases 1 ✅ |
| **2** `[i]` broadcast + `=` | one rule across collection | Evaluator (each instance evaluates via memo) | Same text per instance hits the memo; inputs read per instance scope | phases 2 ✅; differential `bc` (incl. after a write) ✅ |
| **3 / 3.1** Logical filters, filtered broadcast | predicates select subsets | Filter predicates do not use `tryEvaluateAssignExpression` (separate parser); filtered broadcast formulas do | Same as phase 2 | phases 3, 3.1 ✅ |
| **4** Range + multi-select | — | No | — | phases 4 ✅ |
| **5** Transform projection (read-only) | — | No | — | phases 5 ✅ |
| **6** Cross-scope contract integrity | public formula over a secret input resolves, stealth preserved | Evaluator + scope fast path flip | Formula over `fin.price` gives 6 → 9 after write; explain origin `stealth`, masked | phases 6 ✅; contracts suite ✅; kernel flip test ✅ |
| **7A** Temporal rehydration (replay) | replayed kernel identical incl. stealth | Indirect: replay resets `localSecrets` to `{}` then re-adds; hydrate bumps epoch (memo cleared) | Fast path ↔ walk switch is driven by the live map, not cached state | phases 7A ✅; kernel "after snapshot hydrate and memory replay" ✅; differential `replay` ✅ |
| **7B** Atomic snapshot rehydration | public, encrypted branches, secrets, noises preserved | Indirect | Snapshot format untouched (memo is not exported); `hydrate` → `bumpSecretEpoch` → memo empty | phases 7B ✅; kernel "memo … fresh after hydrate" ✅; differential `snap`, `root2` ✅ |
| **8** Incremental recompute + explain | precise deps, only affected recompute, explain with masking, invalid tokens stay declarative | Evaluator (the recompute body) | Dependency index, wave and cutoff untouched; invalid formulas: same `{ok:false}` on first call and on hit, same `explain().meta.unresolved` | phases 8 ✅; derivation-wave/refs ✅; unit "invalid formulas fail the same way" ✅; kernel invalid-formula test ✅; regression gate ✅ |
| **Phase C** (Core.md) Hermetic evaluator | tokenize → shunting-yard → RPN; no JS execution; only `readPath` resolvers | Evaluator | Same pipeline, now memoized after the grammar check and after `unsafeEval`; `alert(1)` is still a path read (`alert`) and fails, never executed | unit "grammar check still precedes the memo", "unsafeEval check still precedes the memo" ✅ |

## Specific checks requested

| Check | Result | Test |
|---|---|---|
| Memo keyed on exact text incl. whitespace/quotes | ✅ `q*2`, `q * 2`, `q  *  2` separate keys; leading/trailing whitespace trimmed *before* lookup (as before: the old code tokenized the trimmed text); `x["a b"]` vs `x['a b']` separate, both correct | unit test 1; kernel test 1 |
| Memo never captures values, scope, reader | ✅ entries are frozen, contain no input value, no scope, no kernel reference; unchanged by evaluation; every input read again on a hit | unit test 2 |
| `unsafeEval` precedes hits | ✅ an unsafeEval kernel never compiles; flipping the flag on a kernel with a cached entry still refuses | unit test 3 |
| Fast path flips at first scope, after snapshot/replay, root `_` | ✅ incl. `{}`/null-prototype/JSON maps and inherited names | unit tests 9–11; kernel tests 5–7 |
| `as(null)` / guest reads | ✅ identical to 4.2.0 in every probe (secret leaf undefined, root-`_` paths undefined; public formulas visible) | kernel 5, 7; differential |
| Invalid-formula error unchanged | ✅ value `undefined`, same `unresolved` (`evaluation-failed`, `rejected-path-form`, `missing-input`) first time and on hit | unit 5; kernel 2; differential `bad.*` |
| Eviction correctness | ✅ 4,296 distinct texts in one kernel: size ≤ 4096, evicted texts recompile, all values right before and after a write | unit 7; kernel 9; differential `evict` |
| Multiple ME instances | ✅ separate memos (per kernel); same text with different data gives each kernel its own value; one kernel filling/clearing its memo doesn't touch another | unit 8; kernel 3 |
| Aggregates `[]` via memo | ✅ aggregate token parsed once; value always from the caller per evaluation; `[]` sums update after writes; another kernel gets its own sum | unit 6; kernel 8 |
| Cross-kernel leak (incl. timing) | **Found and fixed** (see below) | timing experiment |

## Findings and changes made (commit `b43cb05`)

1. **Timing side channel across kernels (real, fixed).** The original `cccec95` memo was module-global.
   In one process, kernel B declaring formulas whose text kernel A had already compiled ran measurably faster:
   median time ratio seen/unseen **0.80** (3 runs: 0.803 / 0.807 / 0.795; 4.2.0 baseline 0.97–1.00).
   So B could probe which formula texts (which may name secret paths) A uses. **Fix:** the memo is per kernel
   (`compiledEvalMemo` in kernel state) and is cleared on every secret epoch (scope declared/removed, identity
   transition, hydrate, lock). After the fix: 0.964 / 0.985 / 0.966 / 1.01, indistinguishable from 4.2.0.
   No values were ever shared (results were always correct); only timing.
2. **Fast path was not exactly equivalent (real divergence, fixed).** `localSecrets` is a plain `{}`, and the
   original walk uses truthy lookups, so inherited names count: in 4.2.0, a replayed/learned write at
   `toString.x` (also `valueOf`, `constructor`, …) is treated as being under a scope. `610a115` returned
   `null` there, and other code that *did* see the scope then threw `No secret context active for "toString.x"`.
   **Fix:** the no-scope path now does the same prefix lookups as the walk (inherited keys included), just
   without the LRU. Result is identical for every path (unit test vs the verbatim original walk).
   The underlying 4.2.0 quirk (Object.prototype names act as scopes) is **pre-existing and left unchanged**;
   worth a separate issue (`Object.create(null)` / own-property checks), since changing it is a semantic change.
3. **Same-kernel identity transitions.** Clearing the memo on `bumpSecretEpoch` also means a new identity in
   the same kernel cannot time-probe formulas compiled under the previous identity.
4. Entries are now `Object.freeze`d (array and tokens) to make "text-only, immutable" enforced, not just
   conventional. Aggregate `ref` objects inside tokens are frozen shallowly (only `.text` is read).
5. Tests added: `tests/eval-compile-cache.test.ts` (11 unit tests, src-level, fake kernels incl. the verbatim
   original walk as oracle) and `tests/perf-fix-kernel.test.ts` (10 kernel tests on dist; with
   `PERF_FIX_BASELINE=1` it runs the 9 behavior tests against v4.2.0, which pass there too). New script
   `test:perf-fix`, included in `npm test`.

## Differential check (branch vs v4.2.0)

[`scenarios.mjs`](scenarios.mjs): 40+ probes (whitespace/quote variants, 10 invalid
formulas ×2 with explain, two kernels, scope flip, snapshot, replay, removal, root `_` + snapshot, nested
secret + noise, pointers, aggregates, broadcast, inherited-key paths, 4,200-formula eviction), values and
explain JSON. Output of v4.2.0 and the final branch: **byte-identical**
([`scenarios.v4.2.0.json`](scenarios.v4.2.0.json) = [`scenarios.v4.2.1.json`](scenarios.v4.2.1.json)).
Run: `node tests/audits/4.2.1/scenarios.mjs <path/to/Typescript/dist/index.js>`.

## Suite results on the final branch (b43cb05, Oct 10 2026, ~22:40 CST)

| Suite | Result |
|---|---|
| `tests/axioms.test.ts` | 13/13 passed, ALL AXIOMS PASSED |
| `tests/phases.test.js` | Phases 0, 1, 2, 3, 3.1, 4, 5, 6, 7A, 7B, 8 ✅, ALL PHASES PASSED |
| `tests/fire.test.ts` | ALL FIRETEST TASKS PASSED |
| Regression gate | passed |
| `npm test` (tsc, readme, derivations, **perf-fix**, aggregates 165 + 77, paths, demos, UMD, contracts, identity-bound secrets, security battery all sections, phase 2, phase 3) | exit 0 |
| KNOWN FAIL lines (#5 numeric segment after dot ×2, #6 path identity ×2) | same 4 as v4.2.0 (checked on the 4.2.0 worktree) |

## Performance after the audit fixes (interleaved medians, same box)

| Benchmark | 4.2.0 | original fix (global memo) | final branch |
|---|---|---|---|
| one write, 2,000 eager dependents | 50.1 ms | 30.4 ms | 33.0 ms (−34%) |
| #6 p50, 1,000 / 5,000 dependents | 24.7 / 150.6 ms | — | 17.0 / 100.6 ms (0.69× / 0.67×) |
| #10 eager mutation p50, 1,000 / 5,000 | 24.7 / 155.0 ms | — | 15.9 / 103.9 ms |
| #10 lazy read p50, 1,000 | 0.024 ms | — | 0.018 ms |
| 2,000 dependents with a secret scope present | 52–58 ms | — | 41–46 ms |
| worst case: a new `_` scope before every write (memo cleared each time) | 54–56 ms | — | 49–54 ms (never slower) |

The per-kernel memo and exact walk cost ~2.5 ms of the 20 ms gain on the 2,000-dependent write.

## Residual risks

- **Memo size per kernel**: up to 4,096 compiled texts held per kernel (cleared when full / on secret epoch).
  Workloads with more unique formula texts than that just recompile (correct, slower, not slower than 4.2.0).
- **Shallow freeze of aggregate refs**: nothing mutates them today; a future evaluator change that mutated
  `ref` would need deep freeze.
- **Epoch clearing**: any future code that changes `localSecrets` without calling `bumpSecretEpoch` does not
  affect correctness of the memo (it holds no scope data); it only affects the scope cache, as before.
- **Pre-existing quirk** (not introduced, not fixed): Object.prototype names (`toString`, `constructor`, …)
  as first path segment act as secret scopes in `resolveBranchScope`'s walk.

Evidence in this folder: [`scenarios.mjs`](scenarios.mjs) and its two outputs, [`timing-leak.mjs`](timing-leak.mjs)
(`node tests/audits/4.2.1/timing-leak.mjs <dist/index.js>`) and [`timing-leak.txt`](timing-leak.txt)
(rows `global-memo` = the first version of the fix, `per-kernel`/`branch` = 4.2.1).
Machine: Xeon 8 vCPU VM, Node 22.23.3.
