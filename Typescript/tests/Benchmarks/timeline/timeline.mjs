// Kernel timeline harness: one fresh process per build per round.
// usage: node timeline.mjs <path/to/Typescript/dist/index.js>
// prints one JSON line {metric: ms, "metric:k": dependents recomputed, ...}
//
// Each scenario copies the loop of the benchmark file named in its comment
// (tests/Benchmarks/benchmark.<n>.*.test.ts at v4.2.0), at one size, on a
// fresh ME instance. Same code for every build, so builds are comparable to
// each other; absolute values can differ a little from the full benchmark
// files (those run more sizes first, so the JIT is warmer).
const dist = process.argv[2];
if (!dist) { console.error("usage: node timeline.mjs <dist/index.js>"); process.exit(2); }
const { default: ME } = await import(new URL(dist, "file://" + process.cwd() + "/").href);

const pct = (a, p) => { const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.max(0, Math.ceil((p / 100) * s.length) - 1))]; };
const avg = (a) => a.reduce((x, y) => x + y, 0) / a.length;
const kOf = (me, path) => { try { const k = me.explain(path)?.meta?.k; return typeof k === "number" ? k : null; } catch { return null; } };
const mode = (me, m) => { if (typeof me.setRecomputeMode === "function") me.setRecomputeMode(m); };
const out = {};
const put = (k, v) => { out[k] = v == null ? null : +v.toFixed(4); };

// steady single write + first write (shape of benchmark #3, wide broadcast [i] formulas), N=2000
{
  const N = 2000, W = 400; const me = new ME();
  for (let i = 1; i <= N; i++) { me.x[i].value(10); me.x[i].factor(5); }
  me.x["[i]"]["="]("y", "value * factor"); me.x["[i]"]["="]("overThreshold", "y >= 100");
  me(`x[${N}].y`);
  let s = performance.now(); me.x[N].factor(10); me(`x[${N}].y`); put("first_write", performance.now() - s);
  const t = []; for (let w = 0; w < W; w++) { const i = 1 + ((w * 7919) % N); s = performance.now(); me.x[i].factor(w % 2 ? 10 : 5); me(`x[${i}].y`); t.push(performance.now() - s); }
  put("single_write", pct(t.slice(50), 50));
  const p = []; for (let w = 0; w < W; w++) { s = performance.now(); me.plain[w % 50](w); p.push(performance.now() - s); }
  put("plain_write", pct(p.slice(50), 50));
}
// eager fan-out, 2,000 deps, write only (Extreme Fan-Out shape)
{
  const me = new ME(); me.master(1);
  for (let i = 0; i < 2000; i++) { me.dep[i].value(i); me.dep[i]["="]("result", "value * master"); }
  me("dep.999.result");
  const t = []; for (let w = 0; w < 60; w++) { const s = performance.now(); me.master(w + 2); t.push(performance.now() - s); }
  put("fanout2000_write", pct(t, 50)); out["fanout2000_write:k"] = kOf(me, "dep.999.result");
}
// benchmark #6 fan-out sensitivity: write + read, p50 over 120
for (const F of [1000, 5000]) {
  const me = new ME(); me.master(1);
  for (let i = 1; i <= F; i++) { me.dep[i].value(10 + (i % 5)); me.dep[i]["="]("result", "value * master"); }
  me(`dep[${F}].result`);
  const t = []; for (let i = 0; i < 120; i++) { const s = performance.now(); me.master((i % 11) + 1); me(`dep[${F}].result`); t.push(performance.now() - s); }
  put(`b6_${F}`, pct(t, 50)); out[`b6_${F}:k`] = kOf(me, `dep.${F}.result`);
}
// benchmark #7 cold/warm profiles, 1,000 nodes: steady average over 80
{
  const n = 1000; const me = new ME();
  for (let i = 1; i <= n; i++) me.data[i].base(100 + (i % 9));
  me.rate(0.16); me.data["[i]"]["="]("total", "base + (base * rate)");
  me(`data[${n}].total`);
  me.rate(0.2); me(`data[${n}].total`);
  const t = []; for (let i = 0; i < 80; i++) { const s = performance.now(); me.rate(0.16 + ((i % 5) * 0.01)); me(`data[${n}].total`); t.push(performance.now() - s); }
  put("b7_1000_steady", avg(t)); out["b7_1000_steady:k"] = kOf(me, `data.${n}.total`);
}
// benchmark #10 push vs pull, eager, fan-out 1,000: write only p50 over 150
{
  const F = 1000; const me = new ME(); mode(me, "eager"); me.master(1);
  for (let i = 1; i <= F; i++) { me.dep[i].value(i); me.dep[i]["="]("result", "value * master"); }
  me(`dep[${F}].result`);
  const w = []; for (let i = 0; i < 150; i++) { const s = performance.now(); me.master((i % 97) + 2); w.push(performance.now() - s); me(`dep[${F}].result`); }
  put("b10_eager_1000_write", pct(w, 50)); out["b10_eager_1000_write:k"] = kOf(me, `dep.${F}.result`);
}
// benchmark #9 secret-scope impact, lazy, 600 nodes: write + read p50 over 120
for (const plane of ["public", "secret"]) {
  const n = 600; const me = new ME(); mode(me, "lazy");
  if (plane === "public") { me.factor(2); for (let i = 1; i <= n; i++) { me.pub[i].value(100 + (i % 11)); me.pub[i]["="]("out", "value * factor"); } me(`pub[${n}].out`); }
  else { me.secure["_"]("bench-secret-2026"); me.secure.factor(2); for (let i = 1; i <= n; i++) { me.secure.data[i].value(100 + (i % 11)); me.secure.data[i]["="]("out", "value * secure.factor"); } me(`secure.data[${n}].out`); }
  const t = []; for (let i = 0; i < 120; i++) { const s = performance.now(); if (plane === "public") { me.factor((i % 7) + 1); me(`pub[${n}].out`); } else { me.secure.factor((i % 7) + 1); me(`secure.data[${n}].out`); } t.push(performance.now() - s); }
  put(`b9_${plane}`, pct(t, 50));
}
// benchmark #11 secret push vs pull, lazy, 600 nodes, secret plane: first read after write, p50 over 120
{
  const n = 600; const me = new ME(); mode(me, "lazy");
  me.secure["_"]("bench-secret-2026"); me.secure.factor(1);
  for (let i = 1; i <= n; i++) { me.secure.data[i].value(100 + (i % 17)); me.secure.data[i]["="]("out", "value * secure.factor"); }
  me(`secure.data[${n}].out`);
  const r = []; for (let i = 0; i < 120; i++) { me.secure.factor((i % 97) + 2); const s = performance.now(); me(`secure.data[${n}].out`); r.push(performance.now() - s); }
  put("b11_secret_read", pct(r, 50));
}
console.log(JSON.stringify(out));
