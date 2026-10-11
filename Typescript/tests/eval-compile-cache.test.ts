// Unit tests for the 4.2.x compile memo (evaluator.ts) and the no-scope path of resolveBranchScope (secret-context.ts).
// They run against src directly with small fake kernels, so every property is checked in isolation.
import assert from "node:assert/strict";
import {
  tryEvaluateAssignExpression,
  _compiledEvalMemo,
  COMPILED_EVAL_MAX,
} from "../src/evaluator.ts";
import { resolveBranchScope } from "../src/secret-context.ts";

let passed = 0;
let failed = 0;
function test(name: string, fn: () => void) {
  try { fn(); passed++; console.log(`  ok  ${name}`); }
  catch (e: any) { failed++; console.log(`  FAIL ${name}\n       ${e?.message ?? e}`); }
}

// A fake kernel: values live in a flat map keyed by dotted path; reads are counted.
function fakeKernel(values: Record<string, any> = {}, opts: { unsafeEval?: boolean } = {}) {
  const k: any = {
    values: { ...values },
    reads: [] as string[],
    unsafeEval: !!opts.unsafeEval,
    readPath(p: string[]) { const key = p.join("."); k.reads.push(key); return k.values[key]; },
    getIndex(p: string[]) { return k.values[p.join(".")]; },
  };
  return k;
}
const ev = (k: any, expr: string, scope: string[] = [], aggs?: Map<string, number>) => tryEvaluateAssignExpression(k, scope, expr, aggs);

console.log("compile memo (evaluator.ts)");

test("keyed on the exact (trimmed) text: whitespace and quote variants are separate entries, all correct", () => {
  const k = fakeKernel({ q: 3, r: 4, 'x["a b"].v': 7, "x['a b'].v": 7 });
  const texts = ["q*2", "q * 2", "q  *  2", "(q+r)*2", "q + r * 2"];
  const want = [6, 6, 6, 14, 11];
  texts.forEach((t, i) => assert.deepEqual(ev(k, t), { ok: true, value: want[i] }));
  // leading/trailing whitespace is trimmed before the memo, exactly as before the memo existed
  assert.deepEqual(ev(k, "   q * 2   "), { ok: true, value: 6 });
  const memo = _compiledEvalMemo(k)!;
  for (const t of texts) assert.ok(memo.has(t), `memo has ${JSON.stringify(t)}`);
  assert.ok(!memo.has("   q * 2   "), "untrimmed text is never a key");
  assert.equal(memo.size, texts.length);
  assert.deepEqual(ev(k, 'x["a b"].v + 1'), { ok: true, value: 8 });
  assert.deepEqual(ev(k, "x['a b'].v + 1"), { ok: true, value: 8 });
  assert.ok(memo.has('x["a b"].v + 1') && memo.has("x['a b'].v + 1"));
});

test("memo never captures values, scope or reader: entries are text-only, frozen, and unchanged by evaluation", () => {
  const k = fakeKernel({ "s.a": 987654, "s.b": 3, a: 111, b: 222 });
  assert.deepEqual(ev(k, "a * b", ["s"]), { ok: true, value: 987654 * 3 });
  const memo = _compiledEvalMemo(k)!;
  const snapshot = JSON.stringify([...memo]);
  assert.ok(!snapshot.includes("987654") && !snapshot.includes("111") && !snapshot.includes("222"), "no input value in the memo");
  assert.ok(!snapshot.includes('"s"'), "no evaluation scope in the memo");
  for (const [, compiled] of memo) {
    assert.ok(compiled === null || Object.isFrozen(compiled));
    for (const t of compiled ?? []) {
      assert.ok(Object.isFrozen(t));
      assert.ok(!Object.values(t).some((v) => v === k), "no reference to the kernel");
    }
  }
  // Same text, other scope, other values: read again, every input, at evaluation time.
  k.values["s.a"] = 2;
  k.reads.length = 0;
  assert.deepEqual(ev(k, "a * b", ["s"]), { ok: true, value: 6 });
  assert.deepEqual(k.reads, ["s.a", "s.b"], "both inputs read on the memo hit");
  assert.deepEqual(ev(k, "a * b", []), { ok: true, value: 111 * 222 });
  assert.equal(JSON.stringify([...memo]), snapshot, "evaluation did not change the memo");
});

test("unsafeEval check still precedes the memo (no hit, no entry)", () => {
  const safeK = fakeKernel({ q: 3 });
  assert.deepEqual(ev(safeK, "q * 2"), { ok: true, value: 6 });
  const unsafeK = fakeKernel({ q: 3 }, { unsafeEval: true });
  assert.deepEqual(ev(unsafeK, "q * 2"), { ok: false });
  assert.equal(_compiledEvalMemo(unsafeK), undefined, "an unsafeEval kernel never compiles");
  // flipping the flag on a kernel that already has the entry still refuses
  safeK.unsafeEval = true;
  assert.deepEqual(ev(safeK, "q * 2"), { ok: false });
  safeK.unsafeEval = false;
});

test("grammar check still precedes the memo: rejected text is never a key", () => {
  const k = fakeKernel({ q: 3 });
  for (const t of ["q ** 2;", "q; 1", "`q`", "q?.x", "{q}", "q, 1"]) assert.deepEqual(ev(k, t), { ok: false });
  assert.equal(_compiledEvalMemo(k), undefined);
  // Text inside the character class but outside the grammar is data, never code: `alert` is a path read, and the
  // malformed postfix fails, on the first call and on the hit.
  (globalThis as any).alert = () => { throw new Error("executed"); };
  k.reads.length = 0;
  assert.deepEqual(ev(k, "alert(1)"), { ok: false });
  assert.deepEqual(ev(k, "alert(1)"), { ok: false });
  assert.ok(k.reads.every((r: string) => r === "alert"));
  delete (globalThis as any).alert;
});

test("invalid formulas fail the same way on the first call and on a memo hit", () => {
  const k = fakeKernel({ q: 3 });
  for (const t of ["q +", "q ** 2", "q q", "(q", "q)", "1e", "!", "* q", "x[a > 1][]", "q = 1"]) {
    assert.deepEqual(ev(k, t), { ok: false }, `first ${t}`);
    assert.deepEqual(ev(k, t), { ok: false }, `hit ${t}`);
  }
  // missing input: not a compile failure, the value is read and missing each time
  assert.deepEqual(ev(k, "missing + 1"), { ok: false });
  k.values.missing = 1;
  assert.deepEqual(ev(k, "missing + 1"), { ok: true, value: 2 });
});

test("aggregate tokens go through the memo; their values always come from the caller", () => {
  const k = fakeKernel({ q: 2 });
  assert.deepEqual(ev(k, "items[].n * q", [], new Map([["items[].n", 10]])), { ok: true, value: 20 });
  assert.deepEqual(ev(k, "items[].n * q", [], new Map([["items[].n", 7]])), { ok: true, value: 14 });
  assert.deepEqual(ev(k, "items[].n * q"), { ok: false }, "no value from the caller, no value");
  const compiled = _compiledEvalMemo(k)!.get("items[].n * q")!;
  assert.ok(compiled.some((t: any) => t.kind === "aggregate" && t.ref.text === "items[].n"));
  assert.ok(!JSON.stringify(compiled).includes("10") && !JSON.stringify(compiled).includes('"7"'));
});

test("eviction: bounded per kernel, cleared when full, evicted texts recompile correctly", () => {
  const k = fakeKernel({ v: 3 });
  const N = COMPILED_EVAL_MAX + 200;
  for (let i = 0; i < N; i++) assert.deepEqual(ev(k, `v * ${i}`), { ok: true, value: 3 * i });
  const memo = _compiledEvalMemo(k)!;
  assert.ok(memo.size <= COMPILED_EVAL_MAX, `size ${memo.size}`);
  assert.ok(!memo.has("v * 0"), "early entry evicted");
  assert.deepEqual(ev(k, "v * 0"), { ok: true, value: 0 });
  assert.deepEqual(ev(k, "v * 1"), { ok: true, value: 3 });
  assert.deepEqual(ev(k, `v * ${N - 1}`), { ok: true, value: 3 * (N - 1) });
});

test("memo is per kernel: one kernel's compiles are invisible to another", () => {
  const A = fakeKernel({ a: 2, b: 3 });
  const B = fakeKernel({ a: 10, b: 20 });
  assert.deepEqual(ev(A, "a * b + 0"), { ok: true, value: 6 });
  assert.equal(_compiledEvalMemo(B), undefined, "B has no memo before it compiles");
  assert.deepEqual(ev(B, "a * b + 0"), { ok: true, value: 200 });
  assert.notEqual(_compiledEvalMemo(A), _compiledEvalMemo(B));
  assert.deepEqual(ev(A, "a * b + 0"), { ok: true, value: 6 });
  // B filling and clearing its memo does not touch A's
  for (let i = 0; i < COMPILED_EVAL_MAX + 1; i++) ev(B, `a + ${i}`);
  assert.ok(_compiledEvalMemo(A)!.has("a * b + 0"));
});

console.log("resolveBranchScope without secret scopes (secret-context.ts)");

// The original walk, verbatim, as the reference.
function referenceWalk(localSecrets: any, path: any[]): any[] | null {
  let best: any[] | null = null;
  if (localSecrets[""]) best = [];
  for (let i = 1; i <= path.length; i++) {
    const p = path.slice(0, i);
    if (localSecrets[p.join(".")]) best = p;
  }
  return best;
}
const fakeScopes = (localSecrets: any) => ({ localSecrets, scopeCache: new Map(), secretEpoch: 0 }) as any;

test("identical to the original walk for every path when no scope is declared (incl. inherited keys, null segments)", () => {
  const paths: any[][] = [
    [], ["a"], ["a", "b", "c"], ["toString"], ["toString", "x"], ["a", "toString"], ["constructor", "y", "z"],
    ["hasOwnProperty"], ["__proto__"], ["valueOf", "1"], ["1", "2"], [null, "a"], [undefined], ["a", null, "b"], [""], ["", "x"],
  ];
  for (const ls of [{}, Object.create(null), JSON.parse("{}")]) {
    for (const p of paths) {
      const s = fakeScopes(ls);
      assert.deepEqual(resolveBranchScope(s, p as any), referenceWalk(ls, p), `${JSON.stringify(p)} on ${Object.getPrototypeOf(ls) ? "{}" : "null-proto"}`);
      assert.equal(s.scopeCache.size, 0, "no cache churn on the no-scope path");
    }
  }
});

test("flips to the scoped answer the moment the first scope (or the root _) is declared, and back when removed", () => {
  const ls: Record<string, string> = {};
  const s = fakeScopes(ls);
  assert.equal(resolveBranchScope(s, ["wallet", "income"]), null);
  ls["wallet"] = "k1";
  assert.deepEqual(resolveBranchScope(s, ["wallet", "income"]), ["wallet"]);
  assert.equal(resolveBranchScope(s, ["profile", "name"]), null);
  ls[""] = "root";
  assert.deepEqual(resolveBranchScope({ ...s, secretEpoch: 1 }, ["profile", "name"]), []);
  delete ls["wallet"]; delete ls[""];
  assert.equal(resolveBranchScope(s, ["wallet", "income"]), null);
  // root _ alone
  assert.deepEqual(resolveBranchScope(fakeScopes({ "": "root" }), ["a", "b"]), []);
});

test("returned arrays are fresh copies (callers may mutate them)", () => {
  const ls = Object.create(null);
  const p = ["a", "b"];
  const s = fakeScopes(Object.assign(Object.create({ a: "inherited" }), ls));
  const r = resolveBranchScope(s, p)!;
  assert.deepEqual(r, ["a"]);
  r.push("mutated");
  assert.deepEqual(p, ["a", "b"]);
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
