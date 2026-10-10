/**
 * S1 — controlled fan-out skew at a FIXED row count.
 *
 * Rewrites two PK-FK columns of a VIG/Zenodo GTFS-Madrid dump:
 *   trips.service_id   → calendar.service_id
 *   stop_times.trip_id → trips.trip_id   (stop_sequence renumbered 1..n per trip)
 * with Zipf(alpha) parent popularity (alpha = 0 → exact VIG-style uniform
 * fan-out) or a "hub" profile (h parents share s of all children).
 * Row counts, parents and every other column are untouched.
 *
 * Deterministic: mulberry32 PRNG, seeded per FK. The algorithm is mirrored
 * byte-for-byte by the standalone Python tool prepared for gtfs-bench utils/.
 *
 * The seed0 CHANGE dump gets the SAME mapping (by trip_id / stop_time row
 * identity), so the base→seed0 diff keeps exactly the same mutation set.
 *
 * Usage (from Typescript/):
 *   node tests/Benchmarks/GTFS-Madrid/skew/generate-skew.ts [--scale=10]
 *     [--alphas=0,0.5,1,1.5,2] [--hubs=1:0.5,3:0.75] [--seeds=0,1,2]
 * Output: data/skew/scale{N}/<variant>/s<seed>/{base,seed0}/*.txt + fanout.json
 *         results/skew/scale{N}-fanout.json
 */
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const BENCH = join(HERE, "..");
type Table = { header: string[]; rows: string[][] };

export function readTable(path: string): Table {
  const lines = readFileSync(path, "utf8").replace(/^\uFEFF/, "").split(/\r?\n/).filter((l) => l.length > 0);
  return { header: lines[0].split(","), rows: lines.slice(1).map((l) => l.split(",")) };
}
function writeTable(path: string, t: Table): void {
  writeFileSync(path, [t.header, ...t.rows].map((r) => r.join(",")).join("\n") + "\n");
}

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = ((t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t) >>> 0;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const fkSeed = (seed: number, salt: number) => (Math.imul(seed, 0x9e3779b1) + salt) >>> 0;
function shuffle<T>(xs: T[], rng: () => number): T[] {
  for (let i = xs.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [xs[i], xs[j]] = [xs[j], xs[i]];
  }
  return xs;
}

export type Profile = { kind: "zipf"; alpha: number } | { kind: "hub"; hubs: number; share: number };
export const profileName = (p: Profile) =>
  p.kind === "zipf" ? `zipf-a${p.alpha}` : `hub-${p.hubs}x${Math.round(p.share * 100)}`;

/** Children per parent rank: largest-remainder rounding of N·w_r/W (ties → lower rank). */
export function quotas(n: number, parents: number, p: Profile): number[] {
  const w: number[] = [];
  for (let r = 0; r < parents; r++) {
    if (p.kind === "zipf") w.push(p.alpha === 0 ? 1 : Math.pow(r + 1, -p.alpha));
    else w.push(r < p.hubs ? p.share / p.hubs : (1 - p.share) / (parents - p.hubs));
  }
  let W = 0;
  for (const x of w) W += x;
  const exact = w.map((x) => (n * x) / W);
  const q = exact.map(Math.floor);
  let left = n - q.reduce((a, b) => a + b, 0);
  const order = exact.map((e, r) => ({ r, rem: e - q[r] })).sort((a, b) => b.rem - a.rem || a.r - b.r);
  for (let i = 0; left > 0; i++, left--) q[order[i].r]++;
  return q;
}

/** New parent id for each child (by child row index). */
export function assign(parentIds: string[], nChildren: number, p: Profile, rng: () => number): string[] {
  const ranked = shuffle([...parentIds], rng);
  const q = quotas(nChildren, ranked.length, p);
  const slots: string[] = [];
  q.forEach((c, r) => { for (let i = 0; i < c; i++) slots.push(ranked[r]); });
  const order = shuffle([...Array(nChildren).keys()], rng);
  const out = new Array<string>(nChildren);
  order.forEach((child, i) => { out[child] = slots[i]; });
  return out;
}

export function fanout(parentIds: string[], fk: string[]) {
  const c = new Map(parentIds.map((id) => [id, 0]));
  let orphans = 0;
  for (const id of fk) c.has(id) ? c.set(id, c.get(id)! + 1) : orphans++;
  const s = [...c.values()].sort((a, b) => a - b);
  const pct = (p: number) => {
    const rank = (p / 100) * (s.length - 1), lo = Math.floor(rank), hi = Math.ceil(rank);
    return s[lo] * (1 - (rank - lo)) + s[hi] * (rank - lo);
  };
  return {
    parents: s.length, children: fk.length, orphans, zeroChildParents: s.filter((x) => x === 0).length,
    min: s[0], median: pct(50), p95: pct(95), max: s[s.length - 1], mean: fk.length / s.length,
    topShare: s[s.length - 1] / fk.length,
  };
}

const col = (t: Table, name: string) => {
  const i = t.header.indexOf(name);
  if (i < 0) throw new Error(`missing column ${name}`);
  return i;
};
const seqNum = (s: string) => Number(s) || 0;

export function skewDump(base: Record<string, Table>, seed0: Record<string, Table>, p: Profile, seed: number) {
  const { trips, stop_times: st, calendar } = base;
  const [tSvc, tTrip] = [col(trips, "service_id"), col(trips, "trip_id")];
  const [sTrip, sSeq, sStop] = [col(st, "trip_id"), col(st, "stop_sequence"), col(st, "stop_id")];
  const serviceIds = calendar.rows.map((r) => r[col(calendar, "service_id")]);
  const tripIds = trips.rows.map((r) => r[tTrip]);

  // 1) trips.service_id
  const newSvc = assign(serviceIds, trips.rows.length, p, mulberry32(fkSeed(seed, 1)));
  const svcByTrip = new Map<string, string>();
  const outTrips = trips.rows.map((r, i) => { svcByTrip.set(r[tTrip], newSvc[i]); const c = [...r]; c[tSvc] = newSvc[i]; return c; });

  // 2) stop_times.trip_id + stop_sequence renumbered 1..n inside each new trip
  const newTrip = assign(tripIds, st.rows.length, p, mulberry32(fkSeed(seed, 2)));
  const byTrip = new Map<string, number[]>();
  newTrip.forEach((t, i) => { if (!byTrip.has(t)) byTrip.set(t, []); byTrip.get(t)!.push(i); });
  const newSeq = new Array<number>(st.rows.length);
  const maxSeq = new Map<string, number>();
  for (const [t, idx] of byTrip) {
    idx.sort((a, b) => seqNum(st.rows[a][sSeq]) - seqNum(st.rows[b][sSeq]) || a - b);
    idx.forEach((rowIdx, k) => { newSeq[rowIdx] = k + 1; });
    maxSeq.set(t, idx.length);
  }
  const rowKey = (r: string[], tc: number, sc: number, pc: number) => `${r[tc]}|${r[sc]}|${r[pc]}`;
  const normKey = (trip: string, seq: string, stop: string) => `${trip}|${seqNum(seq)}|${stop}`;
  const moved = new Map<string, [string, string]>();
  const used = new Set<string>();
  const outSt = st.rows.map((r, i) => {
    const c = [...r]; c[sTrip] = newTrip[i]; c[sSeq] = String(newSeq[i]);
    moved.set(rowKey(r, sTrip, sSeq, sStop), [c[sTrip], c[sSeq]]);
    used.add(normKey(c[sTrip], c[sSeq], c[sStop]));
    return c;
  });

  // 3) seed0: same mapping for rows that exist in base; seed-only rows keep their FK
  const t0 = seed0.trips, s0 = seed0.stop_times;
  const [t0Svc, t0Trip] = [col(t0, "service_id"), col(t0, "trip_id")];
  const [s0Trip, s0Seq, s0Stop] = [col(s0, "trip_id"), col(s0, "stop_sequence"), col(s0, "stop_id")];
  const seedTrips = t0.rows.map((r) => { const c = [...r]; const m = svcByTrip.get(r[t0Trip]); if (m) c[t0Svc] = m; return c; });
  let seedOnlyBumped = 0;
  const seedSt = s0.rows.map((r) => {
    const c = [...r];
    const m = moved.get(rowKey(r, s0Trip, s0Seq, s0Stop));
    if (m) { [c[s0Trip], c[s0Seq]] = m; return c; }
    if (used.has(normKey(c[s0Trip], c[s0Seq], c[s0Stop]))) {
      const next = Math.max(maxSeq.get(c[s0Trip]) ?? 0, seqNum(c[s0Seq])) + 1;
      maxSeq.set(c[s0Trip], next); c[s0Seq] = String(next); seedOnlyBumped++;
    }
    used.add(normKey(c[s0Trip], c[s0Seq], c[s0Stop]));
    return c;
  });

  const report = {
    profile: profileName(p), seed,
    tripsPerService: fanout(serviceIds, newSvc),
    stopTimesPerTrip: fanout(tripIds, newTrip),
    seedOnlyStopTimesResequenced: seedOnlyBumped,
  };
  return {
    base: { ...base, trips: { header: trips.header, rows: outTrips }, stop_times: { header: st.header, rows: outSt } },
    seed0: { ...seed0, trips: { header: t0.header, rows: seedTrips }, stop_times: { header: s0.header, rows: seedSt } },
    report,
  };
}

const FILES = ["routes", "trips", "stop_times", "calendar", "calendar_dates"];
function loadDir(dir: string): Record<string, Table> {
  return Object.fromEntries(FILES.map((f) => [f, readTable(join(dir, `${f}.txt`))]));
}

function main() {
  const arg = (k: string, d: string) => process.argv.find((a) => a.startsWith(`--${k}=`))?.split("=")[1] ?? d;
  const scale = Number(arg("scale", "10"));
  const profiles: Profile[] = [
    ...arg("alphas", "0,0.5,1,1.5,2").split(",").filter(Boolean).map((a) => ({ kind: "zipf", alpha: Number(a) }) as Profile),
    ...arg("hubs", "1:0.5,3:0.75").split(",").filter(Boolean).map((h) => ({ kind: "hub", hubs: Number(h.split(":")[0]), share: Number(h.split(":")[1]) }) as Profile),
  ];
  const seeds = arg("seeds", "0,1,2").split(",").map(Number);
  const src = join(BENCH, "data", `scale${scale}`);
  const base = loadDir(join(src, "base")), seed0 = loadDir(join(src, "seed0"));
  const col0 = (t: Table, c: string) => t.rows.map((r) => r[col(t, c)]);
  const reports: unknown[] = [{
    profile: "vig-original", seed: null,
    tripsPerService: fanout(col0(base.calendar, "service_id"), col0(base.trips, "service_id")),
    stopTimesPerTrip: fanout(col0(base.trips, "trip_id"), col0(base.stop_times, "trip_id")),
  }];
  for (const p of profiles) for (const seed of seeds) {
    const out = skewDump(base, seed0, p, seed);
    const dir = join(BENCH, "data", "skew", `scale${scale}`, profileName(p), `s${seed}`);
    for (const v of ["base", "seed0"] as const) {
      mkdirSync(join(dir, v), { recursive: true });
      for (const f of FILES) {
        const t = (out[v] as Record<string, Table>)[f];
        if (f === "trips" || f === "stop_times") writeTable(join(dir, v, `${f}.txt`), t);
        else copyFileSync(join(src, v, `${f}.txt`), join(dir, v, `${f}.txt`));
      }
    }
    writeFileSync(join(dir, "fanout.json"), JSON.stringify(out.report, null, 2));
    reports.push(out.report);
    const r = out.report;
    console.log(`${r.profile.padEnd(12)} s${seed}  trips/service min/med/p95/max=${r.tripsPerService.min}/${r.tripsPerService.median}/${r.tripsPerService.p95}/${r.tripsPerService.max} zero=${r.tripsPerService.zeroChildParents}  stop_times/trip=${r.stopTimesPerTrip.min}/${r.stopTimesPerTrip.median}/${r.stopTimesPerTrip.p95}/${r.stopTimesPerTrip.max} zero=${r.stopTimesPerTrip.zeroChildParents}`);
  }
  const resDir = join(BENCH, "results", "skew");
  mkdirSync(resDir, { recursive: true });
  writeFileSync(join(resDir, `scale${scale}-fanout.json`), JSON.stringify(reports, null, 2));
  console.log(`Wrote ${join(resDir, `scale${scale}-fanout.json`)}`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
