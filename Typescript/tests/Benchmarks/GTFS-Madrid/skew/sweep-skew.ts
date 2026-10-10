/**
 * S1 sweep: same base→seed0 mutation workload as sweep-seed0.ts, run on the
 * skewed dumps written by generate-skew.ts, against this.me@4.1.0 loaded from
 * Typescript/dist exactly like the existing benchmark. Kernel untouched.
 *
 * Per run (one child process per variant × seed, --expose-gc):
 *   A) seed0 workload   fresh load → buildMeasurablePlan → measureOne (unchanged code)
 *   B) rebuild baseline fresh load + wire (rebuildLoadMs) + read every derived value (fullEvalMs)
 *   C) fan-out census   on instance B: flip every service's `active` (k = 1 + trips),
 *                       idx slot 0→1 on the widest and on median trips (k = 1, sum width varies),
 *                       DELETE the 10 widest + 40 seeded-random trips (k = stop_times of that trip)
 * Every measured mutation also records explain(probe) size (JSON bytes) and explain latency.
 *
 * Usage (from Typescript/):
 *   node --expose-gc tests/Benchmarks/GTFS-Madrid/skew/sweep-skew.ts [--scale=10]
 *     [--variants=vig-original,zipf-a0,...] [--seeds=0,1,2]
 * Writes results/skew/runs/*.json; aggregate with report-skew.ts → results/skew/scale{N}-skew-sweep.{json,tsv,md}
 */
import ME from "../../../../dist/index.js";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { idxRouteCountPath, idxServiceCountPath, idxTripStopTimeCountPath, idxRouteTripCountPath, setIdxStopTimeMember, stopTimeId } from "../adapter.ts";
import { deleteTrip, updateServiceField, type Mutation } from "../workload.ts";
import { csvBool, gtfsDateToNumber, inventoryDeltas, loadSnapshot, loadSnapshotIntoMe, pathSafeId, wireCreateAggregates, type GtfsSnapshot } from "../load-real.ts";
import { buildMeasurablePlan, measureOne, type MeasuredMutation } from "../sweep-seed0.ts";
import { mulberry32 } from "./generate-skew.ts";

type CallableMe = InstanceType<typeof ME> & ((expr: string) => unknown);
const HERE = dirname(fileURLToPath(import.meta.url));
const BENCH = join(HERE, "..");
const arg = (k: string, d: string) => process.argv.find((a) => a.startsWith(`--${k}=`))?.slice(k.length + 3) ?? d;
const gc = () => (globalThis as { gc?: () => void }).gc?.();

interface Row extends MeasuredMutation { phase: string; explainBytes: number; explainMs: number; explainInputs: number; sumWidth?: number }

function measure(me: CallableMe, phase: string, m: Mutation, probes: string[], extra: { id: string; kind: string; field?: string }): Row {
  const r = measureOne(me, m, probes, extra);
  const t0 = performance.now();
  const ex = me.explain(probes[0]) as { derivation?: { inputs?: unknown[] } };
  const bytes = JSON.stringify(ex).length;
  return { ...r, phase, explainBytes: bytes, explainMs: performance.now() - t0, explainInputs: ex.derivation?.inputs?.length ?? 0 };
}

const stPath = (st: Record<string, string>) => `gtfs.stopTimes.${stopTimeId(pathSafeId(st.trip_id), Number(st.stop_sequence) || 0, st.stop_id)}.routeId`;

function loadInto(base: GtfsSnapshot, seed0: GtfsSnapshot) {
  const me = new ME() as CallableMe;
  const t0 = performance.now();
  loadSnapshotIntoMe(me, base);
  wireCreateAggregates(me, base, seed0);
  const loadMs = performance.now() - t0;
  me(idxRouteCountPath()); me(idxServiceCountPath());
  return { me, loadMs };
}

function integrity(s: GtfsSnapshot) {
  const svc = new Set(s.calendar.map((r) => r.service_id)), trips = new Set(s.trips.map((r) => r.trip_id));
  const keys = new Set(s.stopTimes.map((r) => `${r.trip_id}|${Number(r.stop_sequence) || 0}|${r.stop_id}`));
  return {
    tripsWithMissingService: s.trips.filter((t) => !svc.has(t.service_id)).length,
    stopTimesWithMissingTrip: s.stopTimes.filter((r) => !trips.has(r.trip_id)).length,
    duplicateStopTimeKeys: s.stopTimes.length - keys.size,
  };
}

function runOne(variant: string, seed: string, scale: number) {
  const dir = variant === "vig-original" ? join(BENCH, "data", `scale${scale}`) : join(BENCH, "data", "skew", `scale${scale}`, variant, `s${seed}`);
  const base = loadSnapshot(join(dir, "base")), seed0 = loadSnapshot(join(dir, "seed0"));
  const inventory = inventoryDeltas(base, seed0);
  const plan = buildMeasurablePlan(base, seed0, inventory);
  const tripsBySvc = new Map<string, string[]>(), stBySvcTrip = new Map<string, Record<string, string>[]>();
  for (const t of base.trips) (tripsBySvc.get(t.service_id) ?? tripsBySvc.set(t.service_id, []).get(t.service_id)!).push(t.trip_id);
  for (const st of base.stopTimes) (stBySvcTrip.get(st.trip_id) ?? stBySvcTrip.set(st.trip_id, []).get(st.trip_id)!).push(st);

  // A) seed0 workload (identical plan construction to sweep-seed0.ts)
  let { me, loadMs } = loadInto(base, seed0);
  const rows: Row[] = [];
  let skippedEmpty = 0;
  for (const step of plan) {
    const probes = step.probePaths(me, base, seed0);
    if (probes.length === 0) { skippedEmpty++; continue; }
    rows.push(measure(me, "seed0", step.mutation, probes, { id: step.delta.id, kind: step.delta.kind, field: step.delta.field }));
  }
  (me as unknown) = null; gc();

  // B) rebuild baseline
  const b = loadInto(base, seed0); me = b.me;
  const derived: string[] = [];
  for (const s of base.calendar) derived.push(`gtfs.services.${pathSafeId(s.service_id)}.active`);
  for (const t of base.trips) {
    const id = pathSafeId(t.trip_id);
    derived.push(`gtfs.trips.${id}.live`, `gtfs.trips.${id}.validRoute`);
    if (stBySvcTrip.has(t.trip_id)) derived.push(idxTripStopTimeCountPath(id));
  }
  for (const r of base.routes) derived.push(idxRouteTripCountPath(pathSafeId(r.route_id)));
  for (const st of base.stopTimes) derived.push(stPath(st));
  const tEval = performance.now();
  for (const p of derived) { try { me(p); } catch { /* absent */ } }
  const fullEvalMs = performance.now() - tEval;

  // C1) every service: one write that flips `active`
  for (const s of base.calendar) {
    const sid = pathSafeId(s.service_id);
    const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].some((d) => csvBool(s[d]));
    const sd = gtfsDateToNumber(s.start_date), ed = gtfsDateToNumber(s.end_date);
    const dates = (sd > 0 ? sd : 1) > 0 && (ed > 0 ? ed : 1) >= (sd > 0 ? sd : 1);
    const m = days && dates ? updateServiceField(sid, "startDate", 0) : !days && dates ? updateServiceField(sid, "monday", true) : null;
    if (!m) continue;
    const probes = [`gtfs.services.${sid}.active`, ...(tripsBySvc.get(s.service_id) ?? []).map((t) => `gtfs.trips.${pathSafeId(t)}.live`)];
    rows.push(measure(me, "census-service", m, probes, { id: s.service_id, kind: "service", field: days ? "startDate" : "monday" }));
  }
  // C2) idx slot 0→1 (CREATE-equivalent) on the 5 widest and 5 median-width trips
  const bySize = [...stBySvcTrip.entries()].sort((x, y) => y[1].length - x[1].length || (x[0] < y[0] ? -1 : 1));
  const mid = Math.floor(bySize.length / 2);
  for (const [trip, sts] of [...bySize.slice(0, 5), ...bySize.slice(Math.max(5, mid - 2), Math.max(5, mid - 2) + 5)]) {
    const tid = pathSafeId(trip), st = sts[0];
    const stId = stopTimeId(tid, Number(st.stop_sequence) || 0, st.stop_id);
    setIdxStopTimeMember(me, tid, stId, 0); me(idxTripStopTimeCountPath(tid));
    const m: Mutation = { type: "CREATE", label: `idx slot 0→1 ${trip}`, apply: (x) => setIdxStopTimeMember(x, tid, stId, 1) };
    rows.push({ ...measure(me, "census-slot", m, [idxTripStopTimeCountPath(tid)], { id: trip, kind: "stopTimeSlot" }), sumWidth: sts.length });
  }
  // C3) DELETE the 10 widest trips + 40 seeded-random trips (each me["-"] costs O(store) in 4.1.0, so not all 1300)
  const baseTripIds = new Set(base.trips.map((t) => t.trip_id));
  const pool = bySize.filter(([t]) => baseTripIds.has(t));
  const rest = pool.slice(10);
  const rng = mulberry32(0x5eed);
  for (let i = rest.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [rest[i], rest[j]] = [rest[j], rest[i]]; }
  for (const [trip, sts] of [...pool.slice(0, 10), ...rest.slice(0, 40)]) {
    rows.push(measure(me, "census-trip-delete", deleteTrip(pathSafeId(trip)), sts.map(stPath), { id: trip, kind: "trip" }));
  }

  const fan = existsSync(join(dir, "fanout.json")) ? JSON.parse(readFileSync(join(dir, "fanout.json"), "utf8")) : null;
  return {
    variant, seed, scale, node: process.version, dataDir: dir, fanout: fan,
    integrity: { base: integrity(base), seed0: integrity(seed0) },
    sizes: { routes: base.routes.length, trips: base.trips.length, stopTimes: base.stopTimes.length, services: base.calendar.length },
    inventory: { total: inventory.length, measurable: inventory.filter((d) => d.measurable).length, planned: plan.length, skippedEmptyProbes: skippedEmpty },
    loadMs, rebuildLoadMs: b.loadMs, fullEvalMs, derivedRead: derived.length, rows,
  };
}

function main() {
  const scale = Number(arg("scale", "10"));
  const outRuns = join(BENCH, "results", "skew", "runs");
  mkdirSync(outRuns, { recursive: true });
  const one = arg("run", "");
  if (one) {
    const [variant, seed] = one.split("/");
    const res = runOne(variant, seed, scale);
    writeFileSync(join(outRuns, `scale${scale}-${variant}-s${seed}.json`), JSON.stringify(res));
    console.log(`${variant} s${seed}: rows=${res.rows.length} loadMs=${res.loadMs.toFixed(0)} rebuild=${res.rebuildLoadMs.toFixed(0)}+${res.fullEvalMs.toFixed(0)}`);
    return;
  }
  const variants = arg("variants", "vig-original,zipf-a0,zipf-a0.5,zipf-a1,zipf-a1.5,zipf-a2,hub-1x50,hub-3x75").split(",");
  const seeds = arg("seeds", "0,1,2").split(",");
  for (const v of variants) for (const s of v === "vig-original" ? ["orig"] : seeds) {
    const t0 = Date.now();
    const r = spawnSync(process.execPath, ["--expose-gc", "--max-old-space-size=6144", fileURLToPath(import.meta.url), `--scale=${scale}`, `--run=${v}/${s}`], { stdio: "inherit" });
    if (r.status !== 0) { console.error(`run ${v}/${s} failed (${r.status})`); process.exitCode = 1; }
    console.log(`  (${((Date.now() - t0) / 1000).toFixed(1)} s wall)`);
  }
  console.log(`Runs in ${outRuns}; aggregate with skew/report-skew.ts`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
