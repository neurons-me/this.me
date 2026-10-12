// Extracts the raw CSV rows of ONE trip for the "Try it" panel of the How. block (data/madrid-s1-sample.json).
//   node tools/build-sample.mjs <dir with base-1-*.csv>       (GTFS-Scale-1-CHANGE, data/shared/, base version)
// The trip is routes[1].trips[1] as build-data.mjs and ai-model.js build() number them: the first route in ROUTES file
// order and its first trip in TRIPS file order. Rows are copied verbatim (text as in the file) with their 1-based line.
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "data", "madrid-s1-sample.json");
const dir = process.argv[2];
const read = (t) => { const lines = readFileSync(join(dir, `base-1-${t}.csv`), "utf8").replace(/^\uFEFF/, "").trim().split(/\r?\n/);
  return { file: `base-1-${t}.csv`, header: lines[0], keys: lines[0].split(","), lines }; };
const pick = (f, test, max) => { const rows = []; let total = 0;
  for (let i = 1; i < f.lines.length; i++) { const v = f.lines[i].split(","); if (test(v, f.keys)) { total++; if (!max || rows.length < max) rows.push({ line: i + 1, text: f.lines[i] }); } }
  return { file: f.file, header: f.header, rows, total }; };
const col = (k, name) => k.indexOf(name);
const R = read("ROUTES"), T = read("TRIPS"), F = read("FREQUENCIES"), S = read("STOP_TIMES"), C = read("CALENDAR");
const route = R.lines[1].split(",")[col(R.keys, "route_id")];
const tripRow = T.lines.slice(1).map((l) => l.split(",")).find((v) => v[col(T.keys, "route_id")] === route);
const trip = tripRow[col(T.keys, "trip_id")], service = tripRow[col(T.keys, "service_id")];
const out = { v: 1, scale: 1, path: "routes.1.trips.1", route_id: route, trip_id: trip, service_id: service,
  source: "GTFS-Madrid-Bench (Van Assche et al.), Zenodo 10.5281/zenodo.14038823, GTFS-Scale-1-CHANGE.tar.xz, data/shared/, base version",
  rows: {
    routes: pick(R, (v, k) => v[col(k, "route_id")] === route),
    trips: pick(T, (v, k) => v[col(k, "trip_id")] === trip),
    calendar: pick(C, (v, k) => v[col(k, "service_id")] === service),
    frequencies: pick(F, (v, k) => v[col(k, "trip_id")] === trip),
    stop_times: pick(S, (v, k) => v[col(k, "trip_id")] === trip, 2),
  } };
writeFileSync(OUT, JSON.stringify(out, null, 1) + "\n");
console.log(OUT, route, trip, service, Object.fromEntries(Object.entries(out.rows).map(([k, x]) => [k, x.total])));
