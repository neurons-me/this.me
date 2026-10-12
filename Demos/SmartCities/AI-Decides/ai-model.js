/*! AI-Decides model 1.0.0 · the deterministic .me model and the versioned policy of the "AI decides, .me computes" demo
 * Shared by the page's Web Worker (importScripts) and the Node checks (tools/verify.mjs). Plain ES5-style, no imports.
 *
 * Real data (GTFS-Madrid-Bench, generated, base version; see data/*.json):
 *   routes[r].trips[t].win[w].base   headway_secs of the trip's w-th FREQUENCIES row
 *   services[s]                      the trip's service_id (CALENDAR row s)
 *   routes[r].trips[t].st[j]         the trip's j-th stop_time (STOP_TIMES membership)
 * Parameters we add (not in the feed):
 *   policy.factor        the decided headway multiplier (1 = the timetable). The ONE write of a headway decision.
 *   policy.minHeadway    safety floor in seconds (165): a threshold, so only some windows cross it (early cutoff)
 *   services[s].enabled  1 / 0: the operator's switch. The ONE write of a suspend / resume decision.
 * Derived (this.me formulas, explicit sums: no [] aggregate, see kernel-issues.md):
 *   win.headway  = base * policy.factor
 *   win.perHour  = 3600 / headway
 *   win.tight    = headway < policy.minHeadway
 *   trip.live    = services[s].enabled == 1
 *   st[j].served = trip.live
 *   trip.perHour = (win[1].perHour + … + win[n].perHour) / n * services[s].enabled     mean departures/hour over its windows
 *   route.perHour = sum of its trips' perHour ;  route.anyTight = OR of its windows' tight ;  city.perHour = sum of routes
 * Declaration order: facts, windows, stop_times, trips, routes, city (every formula is declared after what it reads).
 */
(function (root) {
  var POLICY = { id: "fair-headway", version: 1, label: "policy:fair-headway@1" };
  var FLOOR = 165;
  // Scenarios are what the reader asks for; there is no demand data in the feed, so they are labelled as scenarios.
  var SCENARIOS = [
    { id: "am-peak", label: "Weekday AM peak", ask: "Shorten waits for the morning peak.", kind: "cut", maxCut: 0.15, maxTight: 0.25 },
    { id: "event", label: "Event tonight", ask: "A big event ends late: run as often as is safe.", kind: "cut", maxCut: 0.25, maxTight: 0.6 },
    { id: "save", label: "Off-peak, save energy", ask: "Quiet hours: stretch every headway 10%.", kind: "set", factor: 1.1 },
    { id: "timetable", label: "Back to the timetable", ask: "Undo every headway change.", kind: "set", factor: 1 }
  ];
  function fnv(str) { var h = 0x811c9dc5; for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return ("0000000" + h.toString(16)).slice(-8); }
  function headways(data) { var a = []; data.routes.forEach(function (r) { r.trips.forEach(function (t) { t.h.forEach(function (x) { a.push(x); }); }); }); return a; }
  var r2 = function (x) { return Math.round(x * 100) / 100; };
  var pct = function (x) { return Math.round(x * 1000) / 10 + "%"; };
  // The decider. Pure: same scenario + same data + same floor = same proposal (and the same inputsHash).
  // "Fair": one factor for every line (no line is favoured); "safe": the share of frequency windows that would go
  // below the floor stays within the scenario's limit. It picks the largest cut (in 1% steps) that keeps that promise.
  function propose(scenario, data, floor, current) {
    var H = headways(data), W = H.length, fl = floor == null ? FLOOR : floor;
    var share = function (f) { var n = 0; for (var i = 0; i < W; i++) if (H[i] * f < fl) n++; return n / W; };
    var factor, reason, tried = [];
    if (scenario.kind === "set") {
      factor = scenario.factor;
      reason = factor === 1 ? "Back to the published headways (factor 1.00) on every line."
        : "Stretch every headway by " + Math.round((factor - 1) * 100) + "% on every line (same for all). " + pct(share(factor)) + " of windows below the " + fl + " s floor.";
    } else {
      factor = 1; var lim = scenario.maxTight, best = 1;
      for (var c = 1; c <= Math.round(scenario.maxCut * 100); c++) { var f = r2(1 - c / 100), s = share(f); tried.push([f, s]); if (s <= lim) best = f; else break; }
      factor = best; var s1 = share(factor), next = tried.filter(function (x) { return x[0] < factor; })[0];
      reason = "Cut every line's headway by " + Math.round((1 - factor) * 100) + "% (the same for every line). That puts " + pct(s1) + " of the " + W.toLocaleString("en-US") +
        " frequency windows below the " + fl + " s floor; this scenario allows " + pct(lim) + "." +
        (next ? " Cutting " + Math.round((1 - next[0]) * 100) + "% would put " + pct(next[1]) + " below." : " The scenario's cap is " + Math.round(scenario.maxCut * 100) + "%.");
    }
    var inputs = { policy: POLICY.label, scenario: scenario.id, floor: fl, maxCut: scenario.maxCut, maxTight: scenario.maxTight, setFactor: scenario.factor, windows: W, headwaySum: H.reduce(function (a, b) { return a + b; }, 0), scale: data.scale };
    return { by: POLICY.label, scenario: scenario.id, scenarioLabel: scenario.label, ask: scenario.ask, factor: factor, from: current, reason: reason,
      rule: "largest uniform cut in 1% steps with share(windows below floor) <= limit", tightShare: share(factor), inputs: inputs, inputsHash: fnv(JSON.stringify(inputs)), noop: current === factor };
  }
  // Declares the whole model on a this.me kernel. Returns the index the page and the worker use (global order:
  // routes → trips → windows, the same order the paths are declared in).
  function build(me, data, onProgress) {
    var nDer = 0, R = data.routes, S = data.services, idx = { routes: [], trips: [], wins: 0, stops: 0 };
    me.policy.factor(1); me.policy.minHeadway(FLOOR); me.policy.decision(0); me.policy.count(0);
    S.forEach(function (s, i) { me.services[i + 1].enabled(1); me.services[i + 1].days(s.days); });
    var tg = 0, wg = 0, sg = 0, total = 0; R.forEach(function (r) { r.trips.forEach(function (t) { total += t.h.length + t.st; }); });
    var tick = Math.max(2000, Math.round(total / 20)), done = 0, beat = function (n) { done += n; if (onProgress && Math.floor((done - n) / tick) !== Math.floor(done / tick)) onProgress(done / total); };
    R.forEach(function (r, ri) {
      var rr = { id: r.id, trip0: tg, trips: r.trips.length }; idx.routes.push(rr);
      r.trips.forEach(function (t, ti) {
        var T = me.routes[ri + 1].trips[ti + 1]; T.service(t.s);
        idx.trips.push({ r: ri, t: ti, id: t.id, s: t.s, win0: wg, wins: t.h.length, st0: sg, st: t.st, dir: t.dir });
        t.h.forEach(function (hs, wi) { var Wn = T.win[wi + 1]; Wn.base(hs); Wn["="]("headway", "base * policy.factor"); Wn["="]("perHour", "3600 / headway"); Wn["="]("tight", "headway < policy.minHeadway"); nDer += 3; });
        wg += t.h.length; sg += t.st; tg++; beat(t.h.length);
      });
    });
    // stop_times before any sum (see kernel-issues.md, the declaration-order item)
    idx.trips.forEach(function (x) { var p = "routes[" + (x.r + 1) + "].trips[" + (x.t + 1) + "]", T = me.routes[x.r + 1].trips[x.t + 1];
      T["="]("live", "services[" + x.s + "].enabled == 1"); nDer++;
      for (var j = 1; j <= x.st; j++) { T.st[j]["="]("served", p + ".live"); nDer++; } beat(x.st); });
    idx.trips.forEach(function (x) { var p = "routes[" + (x.r + 1) + "].trips[" + (x.t + 1) + "]", terms = [];
      for (var w = 1; w <= x.wins; w++) terms.push(p + ".win[" + w + "].perHour");
      me.routes[x.r + 1].trips[x.t + 1]["="]("perHour", terms.length ? "(" + terms.join(" + ") + ") / " + terms.length + " * services[" + x.s + "].enabled" : "0 * services[" + x.s + "].enabled"); nDer++; });
    idx.routes.forEach(function (rr, ri) { var trips = [], tight = [];
      for (var k = 0; k < rr.trips; k++) { var x = idx.trips[rr.trip0 + k], p = "routes[" + (ri + 1) + "].trips[" + (x.t + 1) + "]"; trips.push(p + ".perHour"); for (var w = 1; w <= x.wins; w++) tight.push(p + ".win[" + w + "].tight"); }
      me.routes[ri + 1]["="]("perHour", trips.length ? trips.join(" + ") : "0"); me.routes[ri + 1]["="]("anyTight", tight.length ? tight.join(" || ") : "false"); nDer += 2; });
    me.city["="]("perHour", idx.routes.map(function (x, i) { return "routes[" + (i + 1) + "].perHour"; }).join(" + ")); nDer++;
    idx.wins = wg; idx.stops = sg; idx.derived = nDer;
    return idx;
  }
  // path → [type, global index] (0 city, 1 route, 2 trip, 3 window, 4 stop_time, 5 policy, 6 service, -1 other)
  function locate(path, idx, tripOf) {
    var p = String(path).split(".");
    if (p[0] === "city") return [0, 0];
    if (p[0] === "policy") return [5, 0];
    if (p[0] === "services") return [6, (+p[1] || 1) - 1];
    if (p[0] !== "routes") return [-1, 0];
    var r = +p[1] - 1; if (p.length === 3) return [1, r];
    var tg = tripOf(r, +p[3] - 1); if (tg < 0) return [-1, 0];
    if (p[4] === "win") return [3, idx.trips[tg].win0 + (+p[5] - 1)];
    if (p[4] === "st") return [4, idx.trips[tg].st0 + (+p[5] - 1)];
    return [2, tg];
  }

  // ── the engine: one kernel, the decisions, the waves. Used as is by the Web Worker and by tools/verify.mjs. ──
  var now = function () { return typeof performance !== "undefined" ? performance.now() : Date.now(); };
  function Engine(MeCtor, data, onProgress) {
    var me = new MeCtor(), t0 = now(), idx = build(me, data, onProgress), buildMs = now() - t0;
    var tripOf = function (r, t) { var rr = idx.routes[r]; return rr && t >= 0 && t < rr.trips ? rr.trip0 + t : -1; };
    var W = idx.wins, T = idx.trips.length, Rn = idx.routes.length;
    var st = { headway: new Float64Array(W), perHour: new Float32Array(W), tight: new Uint8Array(W), live: new Uint8Array(T), tripPh: new Float64Array(T), routePh: new Float64Array(Rn), routeAny: new Uint8Array(Rn), city: 0, factor: 1, enabled: new Uint8Array(data.services.length) };
    var tp = function (x) { return "routes." + (x.r + 1) + ".trips." + (x.t + 1); };
    function readAll() {
      var t = now();
      idx.trips.forEach(function (x, g) { var p = tp(x);
        for (var w = 0; w < x.wins; w++) { var q = p + ".win." + (w + 1), k = x.win0 + w; st.headway[k] = me(q + ".headway"); st.perHour[k] = me(q + ".perHour"); st.tight[k] = me(q + ".tight") ? 1 : 0; }
        st.live[g] = me(p + ".live") ? 1 : 0; st.tripPh[g] = me(p + ".perHour"); });
      for (var r = 0; r < Rn; r++) { st.routePh[r] = me("routes." + (r + 1) + ".perHour"); st.routeAny[r] = me("routes." + (r + 1) + ".anyTight") ? 1 : 0; }
      st.city = me("city.perHour"); st.factor = me("policy.factor");
      for (var s = 0; s < st.enabled.length; s++) st.enabled[s] = me("services." + (s + 1) + ".enabled");
      return now() - t;
    }
    var readMs0 = readAll();
    var copy = function () { return { headway: st.headway.slice(), perHour: st.perHour.slice(), tight: st.tight.slice(), live: st.live.slice(), tripPh: st.tripPh.slice(), routePh: st.routePh.slice(), routeAny: st.routeAny.slice(), city: st.city }; };
    var count = 0, log = [], snaps = {}, KEEP = 30;   // snaps[n]: the values read from the kernel just before decision n's write
    var fact = function (n, k, v) { if (v !== undefined && v !== null) me.decisions[n][k](v); };
    function record(d) {   // the decision as facts in the kernel (none of them has a dependent: k = 0 each)
      var n = ++count; d.n = n; d.at = new Date().toISOString();
      ["kind", "by", "at", "scenario", "ask", "reason", "rule", "inputsHash", "write", "from", "to", "undoOf"].forEach(function (k) { fact(n, k, d[k]); });
      me.policy.decision(n); me.policy.count(n); return n;
    }
    function decide(d) {
      var n = record(d), prev = copy(); snaps[n] = prev; if (snaps[n - KEEP]) delete snaps[n - KEEP]; var path = d.write, parts = path.split("."), wroteAt = Date.now();
      me.decisions[n].wroteAt(wroteAt);
      var a = now();
      if (parts[0] === "policy") me.policy.factor(d.to); else me.services[+parts[1]].enabled(d.to);   // THE write
      var writeMs = now() - a;
      // the wave, read after the write (this.me 4.2.1 has no progress hook): city.perHour is behind every write we make
      var b = now(), m = me.explain("city.perHour").meta || {}, valid = m.sourcePath === path && m.recomputedAt >= wroteAt;
      var rec = valid ? m.recomputed || [] : [], chg = valid ? m.changed || [] : [], chSet = new Set(chg);
      var order = new Uint32Array(rec.length), cnt = [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0]];
      var cut = { tightRec: 0, tightFlip: 0, anyRec: 0, anyFlip: 0, servedRec: 0, servedCh: 0, liveRec: 0 };
      var chWin = new Uint8Array(W), chTrip = new Uint8Array(T), chRoute = new Uint8Array(Rn), chStops = new Uint16Array(T);
      for (var i = 0; i < rec.length; i++) {
        var key = rec[i], L = locate(key, idx, tripOf), ty = L[0], gi = L[1], ch = chSet.has(key), leaf = key.slice(key.lastIndexOf(".") + 1);
        order[i] = (ty < 0 ? 7 : ty) * 67108864 + gi;
        if (ty >= 0 && ty <= 4) { cnt[ty][0]++; if (ch) cnt[ty][1]++; }
        if (leaf === "tight") { cut.tightRec++; if (ch) { cut.tightFlip++; chWin[gi] |= 2; } }
        else if (ty === 3 && ch) chWin[gi] |= 1;
        else if (leaf === "anyTight") { cut.anyRec++; if (ch) { cut.anyFlip++; chRoute[gi] |= 2; } }
        else if (ty === 1 && ch) chRoute[gi] |= 1;
        else if (leaf === "served") { cut.servedRec++; if (ch) { cut.servedCh++; } var tg = 0; for (var q = T - 1; q >= 0; q--) if (idx.trips[q].st0 <= gi) { tg = q; break; } if (ch) chStops[tg]++; }
        else if (leaf === "live") { cut.liveRec++; if (ch) chTrip[gi] |= 2; }
        else if (ty === 2 && ch) chTrip[gi] |= 1;
      }
      var analysisMs = now() - b, readMs = readAll();
      // changed values grouped by route (before → after read from the kernel, before and after the write)
      var routes = [];
      for (var r = 0; r < Rn; r++) {
        var rr = idx.routes[r], w0 = idx.trips[rr.trip0].win0, last = idx.trips[rr.trip0 + rr.trips - 1], w1 = last.win0 + last.wins, hb = 0, ha = 0, flips = 0, wch = 0, tch = 0, sch = 0, nl = 0;
        for (var w = w0; w < w1; w++) { hb += prev.headway[w]; ha += st.headway[w]; if (chWin[w] & 2) flips++; if (chWin[w]) wch++; }
        for (var t = rr.trip0; t < rr.trip0 + rr.trips; t++) { if (chTrip[t]) tch++; sch += chStops[t]; if (!st.live[t]) nl++; }
        if (wch || tch || sch || chRoute[r]) routes.push({ r: r, id: rr.id, headway: [hb / Math.max(1, w1 - w0), ha / Math.max(1, w1 - w0)], perHour: [prev.routePh[r], st.routePh[r]],
          flips: flips, anyTight: [prev.routeAny[r], st.routeAny[r]], wins: wch, trips: tch, stops: sch, notLive: nl, tripsTotal: rr.trips });
      }
      var wave = { n: n, kind: d.kind, write: path, from: d.from, to: d.to, writeMs: writeMs, analysisMs: analysisMs, readMs: readMs, valid: valid, k: rec.length, kMeta: valid ? m.k : 0, changed: chg.length,
        counts: cnt, cutoff: cut, routes: routes, city: [prev.city, st.city], order: order, chWin: chWin, chTrip: chTrip, chRoute: chRoute, chStops: chStops };
      me.decisions[n].outcome.k(wave.k); me.decisions[n].outcome.changed(wave.changed); me.decisions[n].outcome.ms(Math.round(writeMs * 10) / 10);
      log.push({ n: n, kind: d.kind, by: d.by, at: d.at, scenario: d.scenario, scenarioLabel: d.scenarioLabel, reason: d.reason, write: path, from: d.from, to: d.to, k: wave.k, changed: wave.changed, ms: writeMs, undoOf: d.undoOf, inputsHash: d.inputsHash });
      return wave;
    }
    var api = {
      me: me, idx: idx, data: data, st: st, buildMs: buildMs, readMs: readMs0, log: log,
      decisions: function () { return log.slice(); },
      propose: function (scenarioId) { var sc = SCENARIOS.filter(function (x) { return x.id === scenarioId; })[0]; if (!sc) throw new Error("unknown scenario " + scenarioId); return propose(sc, data, me("policy.minHeadway"), me("policy.factor")); },
      apply: function (scenarioId) { var p = api.propose(scenarioId);
        return decide({ kind: "headway", by: p.by, scenario: p.scenario, scenarioLabel: p.scenarioLabel, ask: p.ask, reason: p.reason, rule: p.rule, inputsHash: p.inputsHash, write: "policy.factor", from: me("policy.factor"), to: p.factor }); },
      setService: function (s, on, by) { var cur = me("services." + s + ".enabled"), sv = data.services[s - 1], trips = idx.trips.filter(function (x) { return x.s === s; }).length;
        return decide({ kind: "service", by: by || "operator (you)", scenario: on ? "resume" : "suspend", scenarioLabel: (on ? "Resume" : "Suspend") + " service " + s,
          ask: (on ? "Resume" : "Suspend") + " service " + s + " (" + trips + " trips).", reason: (on ? "Manual: run service " : "Manual: stop service ") + s + " (service_id " + sv.id + ", " + trips + " trips) " + (on ? "again." : "until further notice."),
          rule: "manual operator action", inputsHash: fnv(JSON.stringify(["service", s, on, data.scale])), write: "services." + s + ".enabled", from: cur, to: on ? 1 : 0 }); },
      undo: function () {
        var undone = {}; log.forEach(function (x) { if (x.undoOf) undone[x.undoOf] = 1; });
        for (var i = log.length - 1; i >= 0; i--) { var x = log[i]; if (x.undoOf || undone[x.n]) continue;
          var cur = me(x.write);
          return decide({ kind: x.kind, by: "you (undo)", scenario: "undo", scenarioLabel: "Undo #" + x.n, ask: "Undo decision #" + x.n + ".", reason: "Undo #" + x.n + " (" + x.scenarioLabel + "): " + x.write + " back to " + x.from + ".",
            rule: "undo: write the previous value", inputsHash: fnv(JSON.stringify(["undo", x.n, x.inputsHash])), write: x.write, from: cur, to: x.from, undoOf: x.n }); }
        return null; },
      undoable: function () { var undone = {}; log.forEach(function (x) { if (x.undoOf) undone[x.undoOf] = 1; }); for (var i = log.length - 1; i >= 0; i--) { var x = log[i]; if (!x.undoOf && !undone[x.n]) return x.n; } return 0; },
      // explain chain for any path: node → the write that last recomputed it → the decision behind that write → its wave → the change
      chain: function (path) {
        var ex = me.explain(path) || {}, m = ex.meta || {}, isFact = ex.expr == null, src = isFact ? path : m.sourcePath, at = isFact ? Infinity : m.recomputedAt, n = 0;
        for (var i = count; i >= 1 && !n; i--) if (me("decisions." + i + ".write") === src && me("decisions." + i + ".wroteAt") <= at) n = i;
        var D = null; if (n) { D = { n: n }; ["kind", "by", "at", "scenario", "ask", "reason", "rule", "inputsHash", "write", "from", "to", "undoOf", "wroteAt"].forEach(function (k) { D[k] = me("decisions." + n + "." + k); });
          D.outcome = { k: me("decisions." + n + ".outcome.k"), changed: me("decisions." + n + ".outcome.changed"), ms: me("decisions." + n + ".outcome.ms") }; }
        // before: the value read from the kernel just before that decision's write (kept for the last 30 decisions)
        var before, L = locate(path, idx, tripOf), leaf = path.slice(path.lastIndexOf(".") + 1), S0 = n && snaps[n];
        if (S0 && L[0] >= 0) before = L[0] === 0 ? S0.city : L[0] === 1 ? (leaf === "anyTight" ? !!S0.routeAny[L[1]] : S0.routePh[L[1]])
          : L[0] === 2 ? (leaf === "live" ? !!S0.live[L[1]] : S0.tripPh[L[1]]) : L[0] === 3 ? (leaf === "tight" ? !!S0.tight[L[1]] : leaf === "headway" ? S0.headway[L[1]] : leaf === "perHour" ? S0.perHour[L[1]] : undefined)
          : L[0] === 4 ? (function () { for (var q = T - 1; q >= 0; q--) if (idx.trips[q].st0 <= L[1]) return !!S0.live[q]; })() : undefined;
        if (L[0] === 3 && leaf === "perHour" && before !== undefined) before = 3600 / S0.headway[L[1]];   // exact (the Float32 copy is for drawing)
        var inWave = Array.isArray(m.changed) ? m.changed.indexOf(path) >= 0 : null;
        return { path: path, value: ex.value, expr: ex.expr, isFact: isFact, inputs: ((ex.derivation && ex.derivation.inputs) || []).slice(0, 6).map(function (x) { return { path: x.path, value: x.value }; }),
          inputsTotal: ((ex.derivation && ex.derivation.inputs) || []).length, write: src ? { path: src, at: isFact ? undefined : m.recomputedAt } : null, decision: D,
          wave: isFact ? null : { k: m.k, recomputed: Array.isArray(m.recomputed) ? m.recomputed.length : undefined, changed: Array.isArray(m.changed) ? m.changed.length : undefined },
          change: { before: before, after: ex.value, kept: !!S0, changedInThatWave: inWave } };
      }
    };
    return api;
  }
  var M = { Engine: Engine, POLICY: POLICY, FLOOR: FLOOR, SCENARIOS: SCENARIOS, propose: propose, build: build, locate: locate, fnv: fnv, VERSION: "1.0.0" };
  root.AIDecidesModel = M;
  if (typeof module !== "undefined" && module.exports) module.exports = M;
})(typeof self !== "undefined" ? self : typeof globalThis !== "undefined" ? globalThis : this);
