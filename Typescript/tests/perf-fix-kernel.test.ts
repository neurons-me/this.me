// Kernel-level checks for the 4.2.x evaluation memo and the no-scope fast path (run against dist).
// Expected values are the ones v4.2.0 produces for the same scripts (differential run, see the audit).
import ME from "../dist/index.js";
import assert from "node:assert/strict";

let passed = 0;
let failed = 0;
// PERF_FIX_BASELINE=1 runs only the behavior checks (the ones v4.2.0 must pass too), skipping memo internals.
const BASELINE = process.env.PERF_FIX_BASELINE === "1";
function test(name: string, fn: () => void) {
  if (BASELINE && name.startsWith("[memo]")) { console.log(`  skip ${name}`); return; }
  try { fn(); passed++; console.log(`  ok  ${name}`); }
  catch (e: any) { failed++; console.log(`  FAIL ${name}\n       ${e?.message ?? e}`); }
}
const memo = (me: any): Map<string, unknown> => me.compiledEvalMemo;

test("formula values follow their inputs on memo hits (eager + lazy reads), whitespace variants agree", () => {
  const me: any = new ME();
  me.t.q(3); me.t.r(4);
  me.t["="]("a", "q*2"); me.t["="]("b", "q * 2"); me.t["="]("c", "  q * 2  "); me.t["="]("e", "(q+r)*2");
  assert.deepEqual([me("t.a"), me("t.b"), me("t.c"), me("t.e")], [6, 6, 6, 14]);
  me.t.q(10);
  assert.deepEqual([me("t.a"), me("t.b"), me("t.c"), me("t.e")], [20, 20, 20, 28]);
  me.x["a b"].v(7); me.y["="]("dq", 'x["a b"].v + 1'); me.y["="]("sq", "x['a b'].v + 1");
  assert.deepEqual([me("y.dq"), me("y.sq")], [8, 8]);
  me.x["a b"].v(70);
  assert.deepEqual([me("y.dq"), me("y.sq")], [71, 71]);
});

test("invalid formula: same value and explain on the first declaration and on a memo hit", () => {
  const me: any = new ME();
  me.t.q(3);
  for (const f of ["q +", "q ** 2", "q q", "(q", "x[a > 1][]", "z[ ].w", 'z.["[]"].w']) {
    me.t["="]("bad", f); me.t["="]("again", f);
    assert.equal(me("t.bad"), undefined); assert.equal(me("t.again"), undefined);
    assert.deepEqual(me.explain("t.again").meta?.unresolved, me.explain("t.bad").meta?.unresolved, f);
    assert.equal(me.explain("t.bad").meta?.unresolved?.reason, "evaluation-failed", f);
  }
  // "1e" is read as a (missing) path in 4.2.0; still identical on the hit
  me.t["="]("e1", "1e"); me.t["="]("e2", "1e");
  assert.deepEqual(me.explain("t.e2").meta?.unresolved?.reason, me.explain("t.e1").meta?.unresolved?.reason);
  me.t["="]("m", "missing + 1");
  assert.equal(me.explain("t.m").meta?.unresolved?.reason, "missing-input");
});

test("two kernels, same formula text, different data: no value or memo shared", () => {
  const A: any = new ME(); const B: any = new ME();
  A.s.a(2); A.s.b(3); B.s.a(10); B.s.b(20);
  A.s["="]("c", "a * b"); B.s["="]("c", "a * b"); A.s.a(5);
  assert.deepEqual([A("s.c"), B("s.c")], [15, 200]);
  if (BASELINE) return;
  assert.ok(memo(A) instanceof Map && memo(B) instanceof Map);
  assert.notEqual(memo(A), memo(B));
});

test("[memo] memo is text-only and cleared on every secret epoch (scope declared, identity switch, hydrate)", () => {
  const me: any = new ME();
  me.p.q(987654); me.p["="]("d", "q * 2");
  assert.ok(memo(me).size > 0);
  assert.ok(!JSON.stringify([...memo(me)]).includes("987654"));
  me.w["_"]("k");
  assert.equal(memo(me).size, 0, "cleared when a scope is declared");
  me.p["="]("e", "q + 1");
  me("ana", "luna");
  assert.equal(memo(me).size, 0, "cleared on identity transition");
  const me2: any = new ME(); me2.hydrate(me.exportSnapshot());
  assert.equal(memo(me2).size, 0, "fresh after hydrate");
});

test("fast path flips at the first scope: stealth root, owner reads, guest reads, explain masking", () => {
  const me: any = new ME();
  me.p.q(3); me.p["="]("d", "q * 2");
  assert.deepEqual([me("p.d"), me.as(null)("p.d")], [6, 6]);
  me.fin["_"]("k1"); me.fin.price(2); me.p["="]("c", "q * fin.price");
  assert.equal(me("fin"), undefined);
  assert.equal(me("fin.price"), 2);
  assert.equal(me.as(null)("fin.price"), undefined);
  assert.equal(me("p.c"), 6);
  const inputs = me.explain("p.c").derivation.inputs.map((i: any) => [i.path, i.origin, i.masked]);
  assert.deepEqual(inputs, [["p.q", "public", false], ["fin.price", "stealth", true]]);
  me.fin.price(3);
  assert.equal(me("p.c"), 9);
});

test("after snapshot hydrate and memory replay the scoped answers hold (same as 4.2.0)", () => {
  const me: any = new ME();
  me.p.q(3); me.p["="]("d", "q * 2");
  me.fin["_"]("k1"); me.fin.price(3); me.p["="]("c", "q * fin.price");
  for (const other of [(() => { const x: any = new ME(); x.hydrate(me.exportSnapshot()); return x; })(),
                       (() => { const x: any = new ME(); x.replayMemories(me.inspect().memories); return x; })()]) {
    assert.equal(other("fin"), undefined);
    assert.equal(other.as(null)("fin.price"), undefined);
    assert.equal(other("p.c"), 9);
    assert.equal(other("p.d"), 6);
  }
  me["-"]("fin");
  assert.equal(me("fin.price"), undefined);
  assert.equal(me.explain("p.c").meta?.unresolved?.reason, "missing-input");
  assert.equal(me("p.d"), 6);
});

test("root _ : scope over everything after it, guest sees nothing, snapshot keeps it", () => {
  const me: any = new ME();
  me.a(1); me["="]("b", "a + 1");
  assert.deepEqual([me("a"), me("b")], [1, 2]);
  me["_"]("root-secret"); me.c(5); me["="]("d", "c * 2");
  assert.deepEqual([me("c"), me("d")], [5, 10]);
  assert.deepEqual([me.as(null)("c"), me.as(null)("d"), me.as(null)("a")], [undefined, undefined, undefined]);
  const me2: any = new ME(); me2.hydrate(me.exportSnapshot());
  assert.equal(me2("d"), 10);
  assert.equal(me2.as(null)("c"), undefined);
});

test("aggregates [] parsed through the memo; values per kernel and per write", () => {
  const me: any = new ME();
  for (let i = 1; i <= 4; i++) me.items[i].n(i);
  me.sum["="]("t", "items[].n"); me.sum["="]("t2", "items[].n * 2");
  assert.deepEqual([me("sum.t"), me("sum.t2")], [10, 20]);
  me.items[2].n(20);
  assert.deepEqual([me("sum.t"), me("sum.t2")], [28, 56]);
  const B: any = new ME(); B.items[1].n(100); B.sum["="]("t", "items[].n");
  assert.equal(B("sum.t"), 100);
});

test("eviction: more distinct formula texts than the memo bound, all correct before and after", () => {
  const me: any = new ME();
  me.e.v(2);
  for (let i = 0; i < 4200; i++) me.e["="](`f${i}`, `v * ${i}`);
  if (!BASELINE) assert.ok(memo(me).size <= 4096);
  me.e.v(3);
  for (const i of [0, 1, 2000, 4095, 4096, 4199]) assert.equal(me(`e.f${i}`), 3 * i);
});

test("inherited-key paths behave exactly as in 4.2.0 (no-scope path keeps the walk's lookups)", () => {
  for (const k of ["toString", "valueOf", "constructor"]) {
    const me: any = new ME();
    me.replayMemories([{ path: `${k}.x`, operator: null, expression: 7, value: 7 }]);
    assert.equal(me(`${k}.x`), 7, k);
    assert.equal(me.as(null)(`${k}.x`), undefined, k);
  }
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
