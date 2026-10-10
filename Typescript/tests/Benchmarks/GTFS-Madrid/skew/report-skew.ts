/**
 * Aggregate results/skew/runs/*.json (written by sweep-skew.ts) into
 * results/skew/scale{N}-skew-sweep.{json,tsv,md}. Measured numbers only.
 *
 * Usage (from Typescript/): node tests/Benchmarks/GTFS-Madrid/skew/report-skew.ts [--scale=10]
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const RES = join(dirname(fileURLToPath(import.meta.url)), "..", "results", "skew");
const scale = Number(process.argv.find((a) => a.startsWith("--scale="))?.slice(8) ?? "10");
const ORDER = ["vig-original", "zipf-a0", "zipf-a0.5", "zipf-a1", "zipf-a1.5", "zipf-a2", "hub-1x50", "hub-3x75"];

type Row = { phase: string; type: string; kind: string; k: number | null; changed: number; mutationApplyMs: number; recomputeMs: number; explainBytes: number; explainMs: number; explainInputs: number; probeCount: number; id: string; field?: string; sumWidth?: number };
type Run = { variant: string; seed: string; loadMs: number; rebuildLoadMs: number; fullEvalMs: number; inventory: Record<string, number>; integrity: unknown; fanout: unknown; rows: Row[]; sizes: Record<string, number>; env?: any };

const pct = (xs: number[], p: number) => {
  const s = [...xs].sort((a, b) => a - b);
  if (!s.length) return NaN;
  const r = (p / 100) * (s.length - 1), lo = Math.floor(r), hi = Math.ceil(r);
  return s[lo] * (1 - (r - lo)) + s[hi] * (r - lo);
};
const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN);
const d = (xs: number[]) => ({ n: xs.length, mean: mean(xs), p50: pct(xs, 50), p95: pct(xs, 95), min: xs.length ? Math.min(...xs) : NaN, max: xs.length ? Math.max(...xs) : NaN });
const f = (x: number, dp = 1) => (Number.isNaN(x) ? "–" : Number.isInteger(x) ? String(x) : x.toFixed(dp));
const ols = (xs: number[], ys: number[]) => {
  const mx = mean(xs), my = mean(ys);
  let sxy = 0, sxx = 0, syy = 0;
  xs.forEach((x, i) => { sxy += (x - mx) * (ys[i] - my); sxx += (x - mx) ** 2; syy += (ys[i] - my) ** 2; });
  const b = sxx ? sxy / sxx : NaN;
  return { slope: b, intercept: my - b * mx, r: sxx && syy ? sxy / Math.sqrt(sxx * syy) : NaN, n: xs.length };
};

const runs: Run[] = readdirSync(join(RES, "runs")).filter((n) => n.startsWith(`scale${scale}-`) && n.endsWith(".json"))
  .map((n) => JSON.parse(readFileSync(join(RES, "runs", n), "utf8")));
const variants = ORDER.filter((v) => runs.some((r) => r.variant === v));
const rowsOf = (v: string, pred: (r: Row) => boolean) => runs.filter((r) => r.variant === v).flatMap((r) => r.rows.filter(pred));
const ks = (rs: Row[]) => rs.map((r) => r.k ?? 0);
const ap = (rs: Row[]) => rs.map((r) => r.mutationApplyMs);
const isSeed = (r: Row) => r.phase === "seed0";
const sel = {
  all: isSeed,
  updSvc: (r: Row) => isSeed(r) && r.type === "UPDATE" && r.kind === "service",
  create: (r: Row) => isSeed(r) && r.type === "CREATE",
  delTrip: (r: Row) => isSeed(r) && r.type === "DELETE" && r.kind === "trip",
  delRoute: (r: Row) => isSeed(r) && r.type === "DELETE" && r.kind === "route",
  cSvc: (r: Row) => r.phase === "census-service",
  cSlot: (r: Row) => r.phase === "census-slot",
  cDel: (r: Row) => r.phase === "census-trip-delete",
};

const agg: Record<string, unknown> = {};
for (const v of variants) {
  const rs = runs.filter((r) => r.variant === v);
  const rebuild = rs.map((r) => r.rebuildLoadMs + r.fullEvalMs);
  const o: Record<string, unknown> = {
    seeds: rs.map((r) => r.seed), sizes: rs[0].sizes, integrity: rs.map((r) => r.integrity),
    inventory: rs.map((r) => r.inventory),
    coldLoadMs: d(rs.map((r) => r.loadMs)), rebuildLoadMs: d(rs.map((r) => r.rebuildLoadMs)), fullEvalMs: d(rs.map((r) => r.fullEvalMs)), rebuildMs: d(rebuild),
    maxKPerSeed: rs.map((r) => Math.max(...r.rows.filter(isSeed).map((x) => x.k ?? 0))),
  };
  for (const [name, p] of Object.entries(sel)) {
    const x = rowsOf(v, p);
    o[name] = { k: d(ks(x)), applyMs: d(ap(x)), explainBytes: d(x.map((r) => r.explainBytes)), explainMs: d(x.map((r) => r.explainMs)), changed: d(x.map((r) => r.changed)) };
  }
  o.fitServiceApplyVsK = ols(ks(rowsOf(v, sel.cSvc)), ap(rowsOf(v, sel.cSvc)));
  o.fitTripDeleteApplyVsK = ols(ks(rowsOf(v, sel.cDel)), ap(rowsOf(v, sel.cDel)));
  o.slotFlips = rowsOf(v, sel.cSlot).map((r) => ({ width: r.sumWidth, applyMs: r.mutationApplyMs, explainBytes: r.explainBytes, k: r.k }));
  agg[v] = o;
}
const allSvc = runs.flatMap((r) => r.rows.filter(sel.cSvc)), allDel = runs.flatMap((r) => r.rows.filter(sel.cDel)), allSlot = runs.flatMap((r) => r.rows.filter(sel.cSlot));
const pooled = {
  serviceApplyVsK: ols(ks(allSvc), ap(allSvc)), tripDeleteApplyVsK: ols(ks(allDel), ap(allDel)),
  slotApplyVsWidth: ols(allSlot.map((r) => r.sumWidth ?? 0), ap(allSlot)),
  explainBytesVsK_service: ols(ks(allSvc), allSvc.map((r) => r.explainBytes)),
  explainBytesVsWidth_slot: ols(allSlot.map((r) => r.sumWidth ?? 0), allSlot.map((r) => r.explainBytes)),
};
writeFileSync(join(RES, `scale${scale}-skew-sweep.json`), JSON.stringify({ scale, generatedAt: new Date().toISOString(), runs: runs.length, perVariant: agg, pooled }, null, 2));

// raw per-mutation TSV (the folder .gitignore excludes *.csv, same convention as sweep-seed0.ts)
const head = "variant\tseed\tphase\ttype\tkind\tid\tfield\tk\tchanged\tprobeCount\tmutationApplyMs\trecomputeMs\texplainBytes\texplainMs\texplainInputs\tsumWidth";
const lines = runs.flatMap((r) => r.rows.map((x) => [r.variant, r.seed, x.phase, x.type, x.kind, x.id, x.field ?? "", x.k ?? "", x.changed, x.probeCount, x.mutationApplyMs.toFixed(4), x.recomputeMs.toFixed(4), x.explainBytes, x.explainMs.toFixed(4), x.explainInputs, x.sumWidth ?? ""].join("\t")));
writeFileSync(join(RES, `scale${scale}-skew-sweep.tsv`), [head, ...lines].join("\n") + "\n");

// markdown
const A = (v: string) => agg[v] as any;
const fan = existsSync(join(RES, `scale${scale}-fanout.json`)) ? JSON.parse(readFileSync(join(RES, `scale${scale}-fanout.json`), "utf8")) : [];
const madrid = existsSync(join(RES, "reference-madrid-seed-fanout.json")) ? JSON.parse(readFileSync(join(RES, "reference-madrid-seed-fanout.json"), "utf8")) : null;
const fh = (x: any) => `${x.min} / ${f(x.median)} / ${f(x.p95)} / ${x.max}`;
const md: string[] = [
  `# S1 fan-out skew: scale-${scale} results (this.me@${runs[0]?.env?.thisMe ?? "4.1.0"}, kernel unchanged)`, ``,
  ...(runs[0]?.env ? [`Run: this.me@${runs[0].env.thisMe} (dist/me.es.js sha256 ${String(runs[0].env.distSha256).slice(0, 12)}…), Node ${runs[0].env.node}, ${runs[0].env.cpu}, ${runs[0].env.memGiB} GiB, ${runs[0].env.os}; count aggregates: ${runs[0].env.aggregates}; first run ${runs[0].env.date}`, ``] : []),
  `Runs: ${runs.length} (variants × seeds). Rows per table are fixed (${JSON.stringify(runs[0]?.sizes)}). Only \`trips.service_id\` and \`stop_times.trip_id\` were reassigned.`, ``,
  `## 1. Fan-out per variant (base snapshot; identical for every seed, only the parent identities change)`, ``,
  `| variant | trips/service min / median / p95 / max | services with 0 trips | stop_times/trip min / median / p95 / max | trips with 0 stop_times | top trip share |`,
  `|---|---|---:|---|---:|---:|`,
];
if (madrid) md.push(`| Madrid seed (original, 5 services, 130 trips) | ${fh(madrid.tripsPerService)} | 0 | ${fh(madrid.stopTimesPerTrip)} | 0 | ${(madrid.stopTimesPerTrip.topShare * 100).toFixed(1)}% |`);
for (const r of fan.filter((x: any) => x.seed === null || x.seed === 0)) md.push(`| ${r.profile} | ${fh(r.tripsPerService)} | ${r.tripsPerService.zeroChildParents} | ${fh(r.stopTimesPerTrip)} | ${r.stopTimesPerTrip.zeroChildParents} | ${(r.stopTimesPerTrip.topShare * 100).toFixed(1)}% |`);
md.push(``, `## 2. k for the base→seed0 workload (same plan code as sweep-seed0.ts; pooled over seeds)`, ``,
  `| variant | N measured (per seed) | k mean | k p50 | k p95 | k max | max k per seed | UPDATE service k mean / p95 / max | DELETE trip k mean / p95 / max | DELETE route k max | CREATE k max |`,
  `|---|---|---:|---:|---:|---:|---|---|---|---:|---:|`);
for (const v of variants) { const a = A(v); md.push(`| ${v} | ${a.inventory.map((i: any) => i.planned - i.skippedEmptyProbes).join(", ")} | ${f(a.all.k.mean, 2)} | ${f(a.all.k.p50)} | ${f(a.all.k.p95)} | ${f(a.all.k.max)} | ${a.maxKPerSeed.join(", ")} | ${f(a.updSvc.k.mean, 1)} / ${f(a.updSvc.k.p95)} / ${f(a.updSvc.k.max)} | ${f(a.delTrip.k.mean, 1)} / ${f(a.delTrip.k.p95)} / ${f(a.delTrip.k.max)} | ${f(a.delRoute.k.max)} | ${f(a.create.k.max)} |`); }
md.push(``, `## 3. Time: per-mutation apply (eager wave included) vs full rebuild`, ``,
  `Rebuild = fresh \`new ME()\` + load + wire aggregates (2nd load in the same process, after the seed0 workload) + one read of every derived value; the ratio column uses the median rebuild. Apply = \`mutationApplyMs\` from measureOne (the eager recompute runs inside the write). ms, pooled over seeds.`, ``,
  `| variant | rebuild ms median (min–max over seeds) | cold first load ms median | UPDATE service apply p50 / p95 / max | CREATE apply p50 / p95 / max | DELETE trip apply p50 / p95 / max | DELETE route apply p50 | rebuild ÷ apply p50 (UPDATE / CREATE / DELETE trip) |`,
  `|---|---:|---:|---|---|---|---:|---|`);
for (const v of variants) { const a = A(v), rb = a.rebuildMs.p50; md.push(`| ${v} | ${f(rb, 0)} (${f(a.rebuildMs.min, 0)}–${f(a.rebuildMs.max, 0)}) | ${f(a.coldLoadMs.p50, 0)} | ${f(a.updSvc.applyMs.p50, 2)} / ${f(a.updSvc.applyMs.p95, 2)} / ${f(a.updSvc.applyMs.max, 2)} | ${f(a.create.applyMs.p50, 2)} / ${f(a.create.applyMs.p95, 2)} / ${f(a.create.applyMs.max, 2)} | ${f(a.delTrip.applyMs.p50, 1)} / ${f(a.delTrip.applyMs.p95, 1)} / ${f(a.delTrip.applyMs.max, 1)} | ${f(a.delRoute.applyMs.p50, 1)} | ${f(rb / a.updSvc.applyMs.p50, 0)}× / ${f(rb / a.create.applyMs.p50, 0)}× / ${f(rb / a.delTrip.applyMs.p50, 0)}× |`); }
md.push(``, `## 4. Fan-out census (targeted writes on a fresh instance; pooled over seeds)`, ``,
  `- service: one write per service that flips \`active\` (k = 1 + trips of that service).`,
  `- trip delete: \`me["-"]\` on the 10 widest + 40 seeded-random trips (k = stop_times of that trip).`,
  `- slot: \`gtfs.idx\` membership slot 0→1 on the 5 widest and 5 median trips (k = 1; the \`stopTimeCount\` sum has one term per stop_time of the trip).`, ``,
  `| variant | service k p50 / p95 / max | service apply ms p50 / max | fit apply ≈ a + b·k (service): b µs/k, r | trip-delete k p50 / max | trip-delete apply ms p50 / max | slot: widest sum width → apply ms |`,
  `|---|---|---|---|---|---|---|`);
for (const v of variants) {
  const a = A(v), sf = a.fitServiceApplyVsK;
  const wide = [...a.slotFlips].sort((x: any, y: any) => y.width - x.width)[0];
  const med = [...a.slotFlips].sort((x: any, y: any) => x.width - y.width)[0];
  md.push(`| ${v} | ${f(a.cSvc.k.p50)} / ${f(a.cSvc.k.p95)} / ${f(a.cSvc.k.max)} | ${f(a.cSvc.applyMs.p50, 2)} / ${f(a.cSvc.applyMs.max, 2)} | ${f(sf.slope * 1000, 1)}, ${f(sf.r, 2)} | ${f(a.cDel.k.p50)} / ${f(a.cDel.k.max)} | ${f(a.cDel.applyMs.p50, 1)} / ${f(a.cDel.applyMs.max, 1)} | ${wide ? `${wide.width} → ${f(wide.applyMs, 2)} (median trip ${med.width} → ${f(med.applyMs, 2)})` : "–"} |`);
}
const BUCKETS: Array<[number, number]> = [[1, 30], [31, 100], [101, 300], [301, 1000], [1001, 3000], [3001, 10000], [10001, Infinity]];
const bucketRows = (rs: Row[], x: (r: Row) => number) => BUCKETS.map(([lo, hi]) => {
  const b = rs.filter((r) => x(r) >= lo && x(r) <= hi);
  return b.length ? `| ${lo}–${hi === Infinity ? "" : hi} | ${b.length} | ${f(pct(ap(b), 50), 2)} | ${f(pct(ap(b), 95), 2)} | ${f(Math.max(...ap(b)), 1)} | ${f(pct(b.map((r) => r.explainBytes), 50), 0)} |` : "";
}).filter(Boolean);
md.push(``, `### Apply time by k (or sum width) bucket, pooled over all variants and seeds`, ``, `Medians are the robust numbers here; the max column contains the stalls discussed in the README.`, ``);
for (const [title, rs, x] of [["census service flips, bucket = k", allSvc, (r: Row) => r.k ?? 0], ["census trip DELETE, bucket = k", allDel, (r: Row) => r.k ?? 0], ["idx slot 0→1 (k = 1), bucket = sum width", allSlot, (r: Row) => r.sumWidth ?? 0]] as Array<[string, Row[], (r: Row) => number]>) {
  md.push(`**${title}**`, ``, `| bucket | n | apply ms p50 | p95 | max | explain bytes p50 |`, `|---|---:|---:|---:|---:|---:|`, ...bucketRows(rs, x), ``);
}
md.push(``, `Pooled fits over all variants and seeds: service apply ≈ ${f(pooled.serviceApplyVsK.intercept, 3)} ms + ${f(pooled.serviceApplyVsK.slope * 1000, 2)} µs·k (r = ${f(pooled.serviceApplyVsK.r, 3)}, n = ${pooled.serviceApplyVsK.n}); trip delete apply ≈ ${f(pooled.tripDeleteApplyVsK.intercept, 1)} ms + ${f(pooled.tripDeleteApplyVsK.slope * 1000, 2)} µs·k (r = ${f(pooled.tripDeleteApplyVsK.r, 3)}, n = ${pooled.tripDeleteApplyVsK.n}); slot flip apply ≈ ${f(pooled.slotApplyVsWidth.intercept, 3)} ms + ${f(pooled.slotApplyVsWidth.slope * 1000, 3)} µs·width (r = ${f(pooled.slotApplyVsWidth.r, 3)}, n = ${pooled.slotApplyVsWidth.n}).`,
  ``, `## 5. Explanation size: JSON bytes of \`explain(probe)\` right after the write`, ``,
  `| variant | seed0 all p50 / p95 / max | UPDATE service max | DELETE trip max | census service max | census trip-delete max | slot widest | explain() ms max |`,
  `|---|---|---:|---:|---:|---:|---:|---:|`);
for (const v of variants) {
  const a = A(v), wide = [...a.slotFlips].sort((x: any, y: any) => y.width - x.width)[0];
  md.push(`| ${v} | ${f(a.all.explainBytes.p50, 0)} / ${f(a.all.explainBytes.p95, 0)} / ${f(a.all.explainBytes.max, 0)} | ${f(a.updSvc.explainBytes.max, 0)} | ${f(a.delTrip.explainBytes.max, 0)} | ${f(a.cSvc.explainBytes.max, 0)} | ${f(a.cDel.explainBytes.max, 0)} | ${wide ? wide.explainBytes : "–"} | ${f(Math.max(a.all.explainMs.max, a.cSvc.explainMs.max, a.cDel.explainMs.max, a.cSlot.explainMs.max), 1)} |`);
}
md.push(``, `Pooled: explain bytes ≈ ${f(pooled.explainBytesVsK_service.intercept, 0)} + ${f(pooled.explainBytesVsK_service.slope, 1)}·k for service flips (r = ${f(pooled.explainBytesVsK_service.r, 3)}); slot flips (k = 1) ≈ ${f(pooled.explainBytesVsWidth_slot.intercept, 0)} + ${f(pooled.explainBytesVsWidth_slot.slope, 1)}·width (r = ${f(pooled.explainBytesVsWidth_slot.r, 3)}).`, ``,
  `Raw: \`runs/scale${scale}-<variant>-s<seed>.json\`, \`scale${scale}-skew-sweep.tsv\` (one line per measured mutation), \`scale${scale}-skew-sweep.json\` (aggregates).`);
writeFileSync(join(RES, `scale${scale}-skew-sweep.md`), md.join("\n") + "\n");
console.log(md.join("\n"));
