// Can kernel B tell, by timing, which formula texts kernel A has compiled? (same process)
const { default: ME } = await import(process.argv[2]);
const M = 400, R = 15; const ratios = [];
for (let r = 0; r < R; r++) {
  const tag = `${r}x${Math.random().toString(36).slice(2, 6)}`;
  const A = new ME(); A.s.v(1);
  const seen = [], fresh = [];
  for (let i = 0; i < M; i++) { seen.push(`v * ${i} + ${r}1 - v * 2 + v / 3 + ${i % 7}`); fresh.push(`v * ${i} + ${r}2 - v * 2 + v / 3 + ${i % 7}`); }
  for (const f of seen) A.s["="]("f" + tag + seen.indexOf(f), f);
  const B = new ME(); B.s.v(2);
  const time = (list, pfx) => { const t = []; list.forEach((f, i) => { const s = performance.now(); B.s["="](pfx + i, f); t.push(performance.now() - s); }); t.sort((a, b) => a - b); return t[t.length >> 1]; };
  // interleave order to cancel warm-up
  const a = r % 2 ? time(seen, "a") : time(fresh, "b"); const b = r % 2 ? time(fresh, "b") : time(seen, "a");
  const tSeen = r % 2 ? a : b, tFresh = r % 2 ? b : a; ratios.push(tSeen / tFresh);
}
ratios.sort((x, y) => x - y);
console.log(JSON.stringify({ medianRatioSeenOverFresh: +ratios[ratios.length >> 1].toFixed(3), min: +ratios[0].toFixed(3), max: +ratios.at(-1).toFixed(3) }));
