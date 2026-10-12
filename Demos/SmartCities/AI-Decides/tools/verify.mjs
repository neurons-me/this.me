// Node check of the AI-Decides model (same code as the page's worker): builds the kernel from data/madrid-s{1,10}.json,
// applies the policy's decisions and a suspension, and checks every derived value against plain JS on the real data.
//   node tools/verify.mjs [scale=1] [path to this.me dist es build]
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
const require = createRequire(import.meta.url);
const M = require("../ai-model.js");
const scale = +(process.argv[2] || 1), mePath = process.argv[3] || "/tmp/fov/mepkg/package/dist/me.es.js";
const ME = (await import(mePath)).default;
const data = JSON.parse(readFileSync(new URL(`../data/madrid-s${scale}.json`, import.meta.url)));
const E = M.Engine(ME, data); const out = { scale, derived: E.idx.derived, buildMs: Math.round(E.buildMs), readMs: Math.round(E.readMs) };
let bad = 0; const check = (label) => {   // plain JS of the same model on the same data vs the kernel's values
  const f = E.me("policy.factor"), fl = E.me("policy.minHeadway"); let city = 0;
  E.idx.routes.forEach((rr, r) => { let rp = 0, any = false;
    for (let t = 0; t < rr.trips; t++) { const x = E.idx.trips[rr.trip0 + t], en = E.me(`services.${x.s}.enabled`); let s = 0;
      data.routes[r].trips[t].h.forEach((hs, w) => { const hw = hs * f, ph = 3600 / hw; s += ph; if (hw < fl) any = true;
        if (E.st.headway[x.win0 + w] !== hw || E.st.tight[x.win0 + w] !== (hw < fl ? 1 : 0)) bad++; });
      const tph = x.wins ? s / x.wins * en : 0; if (Math.abs(E.st.tripPh[rr.trip0 + t] - tph) > 1e-9) bad++; if (E.st.live[rr.trip0 + t] !== (en === 1 ? 1 : 0)) bad++; rp += tph; }
    if (Math.abs(E.st.routePh[r] - rp) > 1e-6) bad++; if (E.st.routeAny[r] !== (any ? 1 : 0)) bad++; city += rp; });
  if (Math.abs(E.st.city - city) > 1e-6) bad++;
  return label;
};
check("built");
const waves = [];
const W = (label, w) => { check(label); waves.push({ label, n: w.n, write: `${w.write}: ${w.from} → ${w.to}`, ms: +w.writeMs.toFixed(1), k: w.k, kMeta: w.kMeta, changed: w.changed,
  tight: `${w.cutoff.tightFlip}/${w.cutoff.tightRec}`, anyTight: `${w.cutoff.anyFlip}/${w.cutoff.anyRec}`, served: `${w.cutoff.servedCh}/${w.cutoff.servedRec}`, routes: w.routes.length, readMs: +w.readMs.toFixed(1) }); };
const p = E.propose("am-peak"); out.proposal = { factor: p.factor, tightShare: p.tightShare, reason: p.reason, inputsHash: p.inputsHash };
W("am-peak", E.apply("am-peak"));
const sv = data.services.findIndex((s) => s.days.includes("1")) + 1;
W("suspend " + sv, E.setService(sv, false));
W("event", E.apply("event"));
W("undo", E.undo()); W("undo", E.undo());
W("timetable", E.apply("timetable"));
const ch = E.chain("routes.1.trips.1.win.1.tight"); out.chain = { decision: ch.decision && { n: ch.decision.n, by: ch.decision.by, scenario: ch.decision.scenario }, write: ch.write, wave: ch.wave, change: ch.change };
out.waves = waves; out.mismatches = bad; out.decisions = E.decisions().length;
console.log(JSON.stringify(out, null, 1));
if (bad) process.exit(1);
