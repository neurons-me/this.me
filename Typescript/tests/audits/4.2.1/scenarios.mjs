// Differential probes: run under v4.2.0 and under the branch; outputs must be identical.
const { default: ME } = await import(process.argv[2]);
const out = {};
const safe = (f) => { try { const v = f(); return v === undefined ? "<undef>" : (typeof v === "number" && Number.isNaN(v)) ? "<NaN>" : v; } catch (e) { return "ERR " + String(e.message).slice(0, 80); } };
const ex = (me, p) => safe(() => { const t = me.explain(p); return JSON.stringify({ v: t.value, expr: t.expr, in: t.derivation?.inputs?.map((i) => [i.path, i.origin, i.masked, i.value, i.status]), u: t.meta?.unresolved }); });
// 1 whitespace / trim / quotes variants
{ const me = new ME(); me.t.q(3); me.t.r(4);
  for (const [n, f] of [["a", "q*2"], ["b", "q * 2"], ["c", "  q * 2  "], ["d", "q  *  2"], ["e", "(q+r)*2"], ["f", "q + r * 2"], ["g", "-q + r"], ["h", "!(q > r)"], ["i", "q >= 3 && r != 4"], ["j", "1e3 + q"], ["k", ".5 * r"]]) { me.t["="](n, f); out["ws." + n] = safe(() => me(`t.${n}`)); }
  me.x["a b"].v(7); me.x["c"].v(8); me.y["="]("dq", 'x["a b"].v + 1'); me.y["="]("sq", "x['a b'].v + 1"); me.y["="]("plain", "x.c.v + 1");
  out.q = [safe(() => me("y.dq")), safe(() => me("y.sq")), safe(() => me("y.plain"))];
  me.x["a b"].v(70); out.q2 = [safe(() => me("y.dq")), safe(() => me("y.sq"))]; }
// 2 invalid formulas, twice (second time is a memo hit)
{ const me = new ME(); me.t.q(3);
  for (const [n, f] of [["b1", "q +"], ["b2", "q ** 2"], ["b3", "alert(1)"], ["b4", "q q"], ["b5", "(q"], ["b6", "x[a > 1][]"], ["b7", "z[ ].w"], ["b8", 'z.["[]"].w'], ["b9", "1e"], ["b10", "missing + 1"]]) {
    me.t["="](n, f); me.t["="](n + "_again", f); out["bad." + n] = [safe(() => me(`t.${n}`)), safe(() => me(`t.${n}_again`)), ex(me, `t.${n}`), ex(me, `t.${n}_again`)]; } }
// 3 same text, different data, two kernels (memo never carries values)
{ const A = new ME(), B = new ME(); A.s.a(2); A.s.b(3); B.s.a(10); B.s.b(20);
  A.s["="]("c", "a * b"); B.s["="]("c", "a * b"); A.s.a(5);
  out.twoKernels = [safe(() => A("s.c")), safe(() => B("s.c"))]; }
// 4 secret scope flip, root _, as(null), explain masking
{ const me = new ME(); me.p.q(3); me.p["="]("d", "q * 2"); out.flip0 = [safe(() => me("p.d")), safe(() => me.as(null)("p.d"))];
  me.fin["_"]("k1"); me.fin.price(2); me.p["="]("c", "q * fin.price");
  out.flip1 = [safe(() => me("fin")), safe(() => me("fin.price")), safe(() => me.as(null)("fin.price")), safe(() => me("p.c")), safe(() => me.as(null)("p.c")), ex(me, "p.c")];
  me.fin.price(3); out.flip2 = [safe(() => me("p.c")), ex(me, "p.c")];
  const snap = me.exportSnapshot(); const me2 = new ME(); me2.hydrate(snap);
  out.snap = [safe(() => me2("fin")), safe(() => me2("fin.price")), safe(() => me2("p.c")), safe(() => me2.as(null)("fin.price")), safe(() => me2("p.d"))];
  const me3 = new ME(); me3.replayMemories(me.inspect().memories);
  out.replay = [safe(() => me3("fin")), safe(() => me3("fin.price")), safe(() => me3("p.c")), safe(() => me3.as(null)("fin.price")), safe(() => me3("p.d"))];
  me["-"]("fin"); out.removed = [safe(() => me("fin.price")), safe(() => me("p.c")), safe(() => me("p.d")), ex(me, "p.c")]; }
{ const me = new ME(); me.a(1); me["="]("b", "a + 1"); out.root0 = [safe(() => me("a")), safe(() => me("b"))];
  me["_"]("root-secret"); me.c(5); me["="]("d", "c * 2");
  out.root1 = [safe(() => me("a")), safe(() => me("b")), safe(() => me("c")), safe(() => me("d")), safe(() => me.as(null)("c")), safe(() => me.as(null)("d")), safe(() => me.as(null)("a")), ex(me, "d")];
  const me2 = new ME(); me2.hydrate(me.exportSnapshot()); out.root2 = [safe(() => me2("c")), safe(() => me2("d")), safe(() => me2.as(null)("c"))]; }
// 5 nested secret + noise (A3b/A3c shapes) with a formula over the secret
{ const me = new ME(); me.root["_"]("r"); me.root.child["_"]("c"); me.root.child.leaf(4); me.root.child["~"]("n"); me.root.child.leaf2(6);
  me.pub["="]("s", "root.child.leaf + 1");
  out.nested = [safe(() => me("root.child.leaf")), safe(() => me("root.child.leaf2")), safe(() => me("pub.s")), safe(() => me.as(null)("pub.s")), ex(me, "pub.s")]; }
// 6 pointers in formulas
{ const me = new ME(); me.w.v(10); me.card["__"]("w"); me.k["="]("x", "card.v * 2"); out.ptr = [safe(() => me("k.x"))]; me.w.v(11); out.ptr.push(safe(() => me("k.x"))); }
// 7 aggregates [] through the memo
{ const me = new ME(); for (let i = 1; i <= 4; i++) me.items[i].n(i); me.sum["="]("t", "items[].n"); me.sum["="]("t2", "items[].n * 2");
  out.agg = [safe(() => me("sum.t")), safe(() => me("sum.t2")), safe(() => me("items[].n")), ex(me, "sum.t")]; me.items[2].n(20); out.agg.push(safe(() => me("sum.t")), safe(() => me("sum.t2")));
  const B = new ME(); B.items[1].n(100); B.sum["="]("t", "items[].n"); out.agg.push(safe(() => B("sum.t"))); }
// 8 broadcast + filtered broadcast (phases 2/3.1)
{ const me = new ME(); for (let i = 1; i <= 3; i++) { me.fleet.trucks[i].km(1000 * i); me.fleet.trucks[i].fuel(100 + i); }
  me.fleet["trucks[i]"]["="]("eff", "km / fuel"); out.bc = [1, 2, 3].map((i) => safe(() => me(`fleet.trucks[${i}].eff`))); me.fleet.trucks[2].km(5); out.bc.push(safe(() => me("fleet.trucks[2].eff"))); }
// 9 inherited-key paths (pre-existing quirk must be unchanged)
for (const k of ["toString", "valueOf", "constructor"]) { const me = new ME(); out["inh." + k] = [safe(() => { me.replayMemories([{ path: `${k}.x`, operator: null, expression: 7, value: 7 }]); return me(`${k}.x`); }), safe(() => me.as(null)(`${k}.x`))]; }
// 10 eviction: > 4096 distinct formula texts in one kernel, then re-read early ones
{ const me = new ME(); me.e.v(2); for (let i = 0; i < 4200; i++) me.e["="](`f${i}`, `v * ${i}`); me.e.v(3);
  out.evict = [0, 1, 2000, 4095, 4096, 4199].map((i) => safe(() => me(`e.f${i}`))); }
console.log(JSON.stringify(out, null, 1));
