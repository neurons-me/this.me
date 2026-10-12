/*! fanout-viz 3.0.1 · .me extreme fan-out, driven by a real this.me kernel · MIT · neurons.me
 * Every line is one real dependent of a live this.me 4.2.1 kernel running in a Web Worker (CDN, SRI-checked), at angle
 * i/N; nothing on the canvas is decorative.
 * - Model (in the worker), per dependent i = 1…N (10,000 by default, 100,000 on request):
 *     dep.i.value, dep.i.limit            facts (seeded: value 10–99, limit = value × 1.2…4.8)
 *     dep.i.level = value * master.factor  recomputes and changes on every write
 *     dep.i.hot   = level > limit          recomputes on every write, changes only when the level crosses the limit
 *     dep.i.alarm = hot == true            recomputes only when hot changed (early cutoff)
 *   A write moves master.factor a small seeded step (1.2…4.8), so k = 2N + m recomputed, N + 2m changed, m = hot flips.
 * - After each write the worker reads the wave (explain().meta.recomputed in the kernel's real order, meta.changed) and
 *   sends the page only positions and indices (Uint32Arrays): which hots changed, which alarms recomputed, and whether
 *   the levels came in index order. The page REPLAYS that order at the write's measured duration (uniform pace inside
 *   the write; the kernel 4.2.1 has no progress hook): the radar sweep is the levels in index order, then the gold dots
 *   (hot flips) and pink dots (alarms) appear in their real order. Labelled as a replay.
 * - Stats come from the worker: k recomputed vs changed, m, ms per write, p50/p95 over the last 20, writes/s, drift, and a
 *   heap estimate (a worker's heap is not readable by the page: N × 6.1 KB + log entries × 225 B, calibrated on V8).
 * - Stress mode writes back to back in the worker (Stop between writes) and resets the kernel when the estimated heap
 *   passes ~300 MB, or, for a kernel already larger than that when built (100k), when the log alone passes ~300 MB.
 * - .GUI: the figure, its centre (master.factor), 128 angular slices and a "selected dependent" part are registered;
 *   clicking a line selects that dependent (angle-bucket hit test), arrows step to its neighbours, and the Inspector's
 *   Explain is answered by the worker (shortened there; counts reach the page, never the k-long lists).
 * - Small screens (max-width 600px, or a coarse pointer with navigator.deviceMemory <= 4) get no 100k option: the
 *   button is hidden and any 100k request falls back to 10k (a 100k kernel needs ~0.7–0.9 GB in the worker).
 * - Pause / play (localStorage); reduced motion starts paused, no rotation, a write shows its final state at once.
 */
(function (root) {
  var React = root.React; if (!React) return;
  var h = React.createElement, useEffect = React.useEffect, useRef = React.useRef, useState = React.useState;
  var CSS = ".fov{margin:0 0 28px}" +
    ".fov-disc{margin:0 auto;max-width:100%;border-radius:50%;overflow:hidden;contain:paint;position:relative;outline:none}" +
    ".fov-disc:focus-visible{box-shadow:0 0 0 2px var(--mui-palette-primary-main, #2aa)}" +
    ".fov canvas{display:block;position:absolute;left:0;top:0;background:transparent;will-change:transform;transform-origin:50% 50%}" +
    ".fov-k{margin-top:4px;text-align:center;font-variant-numeric:tabular-nums;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:12.5px;letter-spacing:.02em;color:var(--mui-palette-text-secondary, #8b949e)}" +
    ".fov-cap{margin:6px auto 0;max-width:640px;text-align:center;font-size:13px;color:var(--mui-palette-text-secondary, #8b949e);line-height:1.5}" +
    ".fov-cap b{color:var(--mui-palette-text-primary, currentColor)}" +
    ".fov-dot{display:inline-block;width:8px;height:8px;border-radius:50%;margin:0 4px 0 8px;vertical-align:0}" +
    ".fov svg.fov-hit{position:absolute;left:0;top:0;width:100%;height:100%;overflow:visible;pointer-events:none;will-change:transform;transform-origin:50% 50%}" +
    ".fov-hit [data-gui-node-id]{outline:none!important;box-shadow:none!important}" +
    ".fov-hit path,.fov-hit circle{fill:transparent;stroke:none;pointer-events:all;cursor:pointer}" +
    ".fov-hit circle.fov-mark{pointer-events:none}.fov-hit circle.fov-mark[data-armed]{pointer-events:all}" +
    ".fov-hit .on>path,.fov-hit .on>circle{stroke:var(--gui-inspector-accent, var(--mui-palette-primary-main, #2aa));stroke-width:1.5px}" +
    ".fov-hit .on>path{fill:color-mix(in srgb, var(--gui-inspector-accent, var(--mui-palette-primary-main, #2aa)) 10%, transparent)}" +
    ".gui-grid-overlay-active .fov-hit path,.gui-grid-overlay-active .fov-hit circle{stroke:color-mix(in srgb, var(--gui-inspector-accent, #3b82f6) 55%, transparent);stroke-width:1px}" +
    ".fov-bar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:center;margin-top:10px}" +
    ".fov-btn{display:inline-flex;align-items:center;gap:6px;min-height:32px;padding:4px 12px;border-radius:8px;border:1px solid var(--mui-palette-divider, rgba(128,128,128,.4));background:transparent;color:var(--mui-palette-text-primary, inherit);font:inherit;font-size:13px;line-height:1.2;cursor:pointer}" +
    ".fov-btn:hover:not(:disabled){background:color-mix(in srgb, currentColor 8%, transparent)}" +
    ".fov-btn:focus-visible{outline:2px solid var(--mui-palette-primary-main, #2aa);outline-offset:2px}" +
    ".fov-btn:disabled{opacity:.5;cursor:default}.fov-btn[aria-pressed=true].fov-seg,.fov-btn.fov-stop{background:color-mix(in srgb, var(--mui-palette-primary-main, #2aa) 16%, transparent);border-color:var(--mui-palette-primary-main, #2aa)}" +
    ".fov-btn svg{width:14px;height:14px;flex:none}.fov-btn small{color:var(--mui-palette-text-secondary, #8b949e);font-size:11.5px}" +
    ".fov-seg-g{display:inline-flex;gap:0}.fov-seg-g .fov-btn:first-child{border-radius:8px 0 0 8px}.fov-seg-g .fov-btn:last-child{border-radius:0 8px 8px 0;margin-left:-1px}.fov-seg-g .fov-btn:only-child{border-radius:8px;margin-left:0}" +
    ".fov-live{margin:12px auto 0;max-width:680px;padding-top:12px;border-top:1px solid var(--mui-palette-divider, rgba(128,128,128,.3));text-align:center;font-size:13px;line-height:1.6;color:var(--mui-palette-text-secondary, #8b949e)}" +
    ".fov-tag{display:inline-block;margin:0 6px;padding:0 7px;line-height:1.5;border-radius:999px;font-size:11px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;border:1px solid currentColor;font-family:inherit}" +
    ".fov-tag.live{color:var(--mui-palette-success-main, #2e9d6e)}.fov-tag.rep{color:var(--mui-palette-text-secondary, #8b949e)}" +
    ".fov-num{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-variant-numeric:tabular-nums;color:var(--mui-palette-text-primary, inherit)}" +
    ".fov-out{margin-top:6px}.fov-out>div{min-height:1.6em}.fov-sel{margin-top:6px;font-size:12.5px;word-break:break-word}.fov-nw{white-space:nowrap}" +
    ".fov-warn{color:var(--mui-palette-warning-main, #b7791f)}" +
    ".fov-busy{display:inline-block;width:10px;height:10px;margin-right:6px;border-radius:50%;border:2px solid currentColor;border-right-color:transparent;vertical-align:-1px;animation:fovspin .8s linear infinite}" +
    "@keyframes fovspin{to{transform:rotate(360deg)}}@media (prefers-reduced-motion: reduce){.fov-busy{animation:none;border-right-color:currentColor;opacity:.6}}";
  function injectCss() { if (document.getElementById("fov-css")) return; var s = document.createElement("style"); s.id = "fov-css"; s.textContent = CSS; document.head.appendChild(s); }
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  var fmt = function (n) { return Math.round(n).toLocaleString("en-US"); };
  var ms = function (x) { return x == null ? "–" : x >= 100 ? fmt(x) + " ms" : x.toFixed(1) + " ms"; };
  // Self-contained (it is also the raster worker's source): line i at angle i/N·2π ± 0.0075 rad, length 55–100% of 42%.
  function RASTER(rng, W, N, wideEvery, brightEvery, dBase, dBright) {
    var R = rng(20261011), depth = new Float32Array(W * W), c = W / 2, f = W * .42, u = W / 800;
    for (var i = 0; i < N; i++) {
      var a = i / N * Math.PI * 2 + (R() - .5) * .015, L = (.55 + R() * .45) * f, dx = Math.cos(a), dy = Math.sin(a);
      var wpx = Math.min(1, (i % wideEvery === 0 ? 1 : .5) * u), d = dBase * wpx + (i % brightEvery === 0 ? dBright * wpx : 0);
      var ax = dx < 0 ? -dx : dx, ay = dy < 0 ? -dy : dy, major = ax > ay ? ax : ay, steps = Math.floor(L * major), wgt = d / major;
      // samples sit on pixel centres along the major axis (start half a step out), so the minor-axis split is exact
      var sx = dx / major, sy = dy / major, x = c - sx * .5, y = c - sy * .5, k, lo, t, p;
      if (ax >= ay) for (k = 0; k < steps; k++) { x += sx; y += sy; lo = Math.floor(y - .5); t = y - .5 - lo; if (lo >= 0 && lo < W - 1) { p = lo * W + Math.floor(x); depth[p] += wgt * (1 - t); depth[p + W] += wgt * t; } }
      else for (k = 0; k < steps; k++) { x += sx; y += sy; lo = Math.floor(x - .5); t = x - .5 - lo; if (lo >= 0 && lo < W - 1) { p = Math.floor(y) * W + lo; depth[p] += wgt * (1 - t); depth[p + 1] += wgt * t; } }
    }
    return depth;
  }
  var ORIG_N = 9000;   // the original illustration's line count; the line density is kept at its look for any N
  var SLICES = 128;
  var ME_URL = "https://cdn.jsdelivr.net/npm/this.me@4.2.1/dist/me.umd.js", ME_SRI = "sha384-ElnWCZOb324gqFJ2M/Fxy4CZ6Si131WIbR54iYomzEbTloUDLfBzZ05qi1nZ7+4G";
  var SMALL_Q = "(max-width: 600px)";
  function smallDevice() {
    if (!root.matchMedia) return false;
    if (root.matchMedia(SMALL_Q).matches) return true;
    var mem = root.navigator && root.navigator.deviceMemory;
    return !!(root.matchMedia("(pointer: coarse)").matches && typeof mem === "number" && mem <= 4);
  }
  var KIND_LEVEL = 0, KIND_HOT = 1, KIND_ALARM = 2;

  // ── the live kernel: a real this.me in a Web Worker (all kernel work stays off the main thread) ──
  function KERNEL_WORKER() {
    var me = null, N = 0, f = 2, R = null, entries = 0, writes = [], firstTen = [], nWrites = 0, resets = 0, ready = null, stressing = false, stressT0 = 0, stressN = 0;
    var BYTES_PER_DEP = 6250, BYTES_PER_ENTRY = 225, LIMIT = 300 * 1048576;   // heap estimate, calibrated on V8 (Node 22)
    function load(url, sri) {
      if (!ready) ready = fetch(url, { integrity: sri, mode: "cors", credentials: "omit" }).then(function (r) { if (!r.ok) throw new Error("this.me: HTTP " + r.status); return r.text(); })
        .then(function (txt) { var u = URL.createObjectURL(new Blob([txt], { type: "text/javascript" })); importScripts(u); URL.revokeObjectURL(u); if (!self.Me || !self.Me.ME) throw new Error("this.me did not load"); });
      return ready;
    }
    function mulberry(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
    function build(n, id) {
      var t = performance.now(), step = Math.max(500, Math.round(n / 20)), r = mulberry(4210 + n);
      me = null; me = new self.Me.ME(); N = 0; f = 2; R = mulberry(77 + n); me.master.factor(f);
      for (var i = 1; i <= n; i++) {
        var v = 10 + Math.floor(r() * 90), d = me.dep[i]; d.value(v); d.limit(Math.round(v * (1.2 + r() * 3.6) * 100) / 100);
        d["="]("level", "value * master.factor"); d["="]("hot", "level > limit"); d["="]("alarm", "hot == true");
        if (i % step === 0) postMessage({ op: "progress", id: id, done: i, n: n });
      }
      N = n; entries = 0; writes = []; firstTen = []; nWrites = 0;
      return performance.now() - t;
    }
    var idxOf = function (k) { var i = 0; for (var c = 4; c < k.length; c++) { var d = k.charCodeAt(c) - 48; if (d < 0 || d > 9) break; i = i * 10 + d; } return i; };
    var pct = function (a, q) { var s = a.slice().sort(function (x, y) { return x - y; }); return s.length ? s[Math.min(s.length - 1, Math.floor(q * s.length))] : null; };
    function heap() { var built = N * BYTES_PER_DEP, log = entries * BYTES_PER_ENTRY; return { built: built, log: log, total: built + log, over: built > LIMIT ? log > LIMIT : built + log > LIMIT, rule: built > LIMIT ? "log" : "total" }; }
    function write() {
      var from = f; f = f + (R() < .5 ? -1 : 1) * (.1 + R() * .2); if (f < 1.2) f = 2.4 - f; if (f > 4.8) f = 9.6 - f; f = Math.round(f * 1000) / 1000;
      var t0 = performance.now(); me.master.factor(f); var writeMs = performance.now() - t0;
      // the wave, read after the write: the kernel's real recompute order and changed set; only indices go to the page
      var t1 = performance.now(), m = me.explain("dep.1.level").meta, rec = m.recomputed || [], chg = m.changed || [], ch = new Set(chg);
      var levels = 0, hots = 0, mono = true, last = 0, hc = [], al = [];
      for (var j = 0; j < rec.length; j++) {
        var key = rec[j], e = key.charCodeAt(key.length - 1), i = idxOf(key);
        if (e === 108) { levels++; if (i < last) mono = false; last = i; }                        // ….level
        else if (e === 116) { hots++; if (ch.has(key)) hc.push(j, i); }                            // ….hot
        else if (e === 109) al.push(j, i);                                                         // ….alarm
      }
      var analysisMs = performance.now() - t1;
      entries += chg.length + 1; nWrites++; writes.push(writeMs); if (writes.length > 20) writes.shift(); if (firstTen.length < 10) firstTen.push(writeMs);
      var hp = heap(), p50 = pct(writes, .5), drift = firstTen.length === 10 && nWrites >= 20 ? pct(writes.slice(-10), .5) / pct(firstTen, .5) - 1 : null;
      return { n: N, from: from, factor: f, writeMs: writeMs, analysisMs: analysisMs, k: m.k, E: rec.length, changed: chg.length, levels: levels, hots: hots, mono: mono,
        m: hc.length / 2, alarms: al.length / 2, hotCh: new Uint32Array(hc), alarmRec: new Uint32Array(al),
        stats: { nWrites: nWrites, p50: p50, p95: pct(writes, .95), window: writes.length, drift: drift, heapMB: hp.total / 1048576, logMB: hp.log / 1048576, guard: hp.over, rule: hp.rule, resets: resets } };
    }
    function post(r, extra) { for (var k in extra) r[k] = extra[k]; postMessage(Object.assign({ op: "wave" }, r), [r.hotCh.buffer, r.alarmRec.buffer]); }
    var first = function (a) { return Array.isArray(a) ? a.slice(0, 6) : undefined; };
    var related = function (p, focus) { return p === focus || p.indexOf(focus + ".") === 0 || focus.indexOf(p + ".") === 0; };
    function shortExplain(path) {
      var t = performance.now(), ex = me.explain(path) || {}, dt = performance.now() - t, m = ex.meta || {}, d = ex.derivation;
      return { path: ex.path || path, value: ex.value, expr: ex.expr,
        derivation: d ? { expression: d.expression, inputs: (d.inputs || []).slice(0, 8) } : undefined,
        meta: { dependsOn: m.dependsOn, k: m.k, sourcePath: m.sourcePath, lastComputedAt: m.lastComputedAt, recomputedAt: m.recomputedAt,
          recomputedCount: Array.isArray(m.recomputed) ? m.recomputed.length : undefined, recomputedFirst: first(m.recomputed),
          changedCount: Array.isArray(m.changed) ? m.changed.length : undefined, changedFirst: first(m.changed),
          kernel: "this.me 4.2.1 · Web Worker · N = " + N, explainMs: +dt.toFixed(2),
          shortened: "recomputed / changed (k paths each) cross from the worker as counts + first 6 paths; the full lists are not sent to the page" } };
    }
    function shortInspect(path) {
      var req = { scheme: "me", namespace: "self", operation: "inspect", path: path, raw: "me://self:inspect/" + path, contextRaw: null };
      var ins = (typeof me.execute === "function" ? me.execute(req) : me.inspect()) || {}, ex = me.explain(path) || {};
      var focus = [path].concat(((ex.derivation && ex.derivation.inputs) || []).map(function (x) { return String(x.path || ""); }).filter(Boolean));
      var mem = Array.isArray(ins.memories) ? ins.memories : [], keep = mem.filter(function (q) { var p = String(q && q.path || ""); return p && focus.some(function (g) { return related(p, g); }); });
      var stale = ins.staleDerivations;
      return { path: path, value: ins.value, recomputeMode: ins.recomputeMode, secretScopes: ins.secretScopes, encryptedScopes: ins.encryptedScopes, noiseScopes: ins.noiseScopes,
        staleDerivations: Array.isArray(stale) ? stale.slice(0, 20) : stale, staleDerivationsCount: Array.isArray(stale) ? stale.length : undefined,
        memories: keep.slice(-200), memoriesTotal: mem.length,
        shortened: "memories filtered in the worker to this path and the paths it reads (" + keep.length + " of " + mem.length + "); index omitted" };
    }
    function dependent(i) {
      var p = "dep." + i + ".";
      return { i: i, value: me(p + "value"), limit: me(p + "limit"), level: me(p + "level"), hot: me(p + "hot"), alarm: me(p + "alarm"), factor: f, hotExplain: shortExplain(p + "hot") };
    }
    function stressLoop() {
      if (!stressing) return;
      var r = write(), reset = false;
      stressN++; var wps = stressN / ((performance.now() - stressT0) / 1000);
      if (r.stats.guard) { reset = true; resets++; }
      post(r, { stress: { writes: stressN, wps: wps, reset: reset, resets: resets } });
      if (reset) { var b = build(N, 0); postMessage({ op: "reset", n: N, buildMs: b, resets: resets }); }
      setTimeout(stressLoop, 0);   // yield: Stop, Explain and Inspector requests are answered between writes
    }
    onmessage = function (e) {
      var q = e.data, reply = function (o) { o.id = q.id; o.ok = true; postMessage(o); }, fail = function (err) { postMessage({ id: q.id, ok: false, error: String(err && err.message || err) }); };
      if (q.op === "stop") { stressing = false; return reply({}); }
      load(q.url, q.sri).then(function () {
        if (q.op === "build") { stressing = false; resets = 0; var b = build(q.n | 0, q.id); return reply({ n: N, buildMs: b }); }
        if (!me) throw new Error("no kernel yet");
        if (q.op === "write") { var r = write(); post(r, {}); return reply({}); }
        if (q.op === "stress") { if (!stressing) { stressing = true; stressT0 = performance.now(); stressN = 0; setTimeout(stressLoop, 0); } return reply({}); }
        if (q.op === "explain") return reply({ payload: shortExplain(q.path) });
        if (q.op === "inspect") return reply({ payload: shortInspect(q.path) });
        if (q.op === "dependent") return reply({ payload: dependent(q.i | 0) });
        throw new Error("unknown op " + q.op);
      }).catch(fail);
    };
  }

  // One kernel per page, shared by the figure and the Inspector (window.FanoutKernel).
  var live = (function () {
    var w = null, seq = 0, pending = {}, subs = [], waveSubs = [], building = null;
    var st = { phase: "idle", n: 0, target: 10000, buildMs: null, progress: 0, error: null, wave: null, stress: null, resets: 0, lastReset: null };
    var emit = function () { subs.forEach(function (f) { f(st); }); };
    var set = function (o) { for (var k in o) st[k] = o[k]; emit(); };
    function worker() {
      if (w) return w;
      var url = URL.createObjectURL(new Blob(["(" + KERNEL_WORKER + ")();"], { type: "text/javascript" })); w = new Worker(url); URL.revokeObjectURL(url);
      w.onmessage = function (e) {
        var d = e.data;
        if (d.op === "progress") { var p = pending[d.id]; if (p && p.onProgress) p.onProgress(d); else if (st.phase === "stressing") set({ progress: d.done / d.n }); return; }
        if (d.op === "wave") {
          var summary = {}; for (var k in d) if (k !== "hotCh" && k !== "alarmRec") summary[k] = d[k];
          set({ wave: summary, stress: d.stress || (st.phase === "stressing" ? st.stress : null), phase: st.phase === "stressing" ? "stressing" : st.phase });
          waveSubs.forEach(function (f) { f(d); }); return;
        }
        if (d.op === "reset") { set({ resets: d.resets, lastReset: { at: st.wave ? st.wave.stats.nWrites : 0, buildMs: d.buildMs } }); return; }
        var q = pending[d.id]; if (!q) return; delete pending[d.id]; d.ok ? q.res(d) : q.rej(new Error(d.error));
      };
      w.onerror = function (e) { set({ phase: "error", error: (e && e.message) || "worker error" }); };
      return w;
    }
    function call(op, args, onProgress) {
      return new Promise(function (res, rej) { var id = ++seq; pending[id] = { res: res, rej: rej, onProgress: onProgress }; var m = { id: id, op: op, url: ME_URL, sri: ME_SRI }; for (var k in args) m[k] = args[k]; worker().postMessage(m); });
    }
    function build(n) {
      if (n > 10000 && smallDevice()) n = 10000;   // small screens / low-memory touch devices: 10k only
      if (building && st.target === n) return building;
      set({ phase: "building", target: n, progress: 0, error: null, wave: null, stress: null, resets: 0, lastReset: null });
      var b = building = call("build", { n: n }, function (d) { if (building === b) set({ progress: d.done / d.n }); })
        .then(function (r) { if (building === b) { building = null; set({ phase: "ready", n: r.n, buildMs: r.buildMs, progress: 1 }); } return r; },
              function (err) { if (building === b) { building = null; set({ phase: "error", error: err.message }); } throw err; });
      return b;
    }
    function ensure() { return st.n && st.phase !== "building" && st.phase !== "error" ? Promise.resolve() : (building || build(st.target)); }
    // Page-side adapter for the .GUI Inspector, which reads meta.recomputed / meta.changed as arrays (length = count,
    // the first six listed): sparse arrays of the real length holding only the first paths the worker sent.
    function waveList(count, firstPaths) {
      if (typeof count !== "number") return undefined;
      var a = new Array(count); (firstPaths || []).forEach(function (p, i) { a[i] = p; });
      Object.defineProperty(a, "toJSON", { value: function () { return { count: count, first: firstPaths || [], note: "full list stays in the worker" }; } });
      return a;
    }
    function adapt(p) {
      var m = p && p.meta; if (!m) return p;
      if (m.recomputedCount != null) m.recomputed = waveList(m.recomputedCount, m.recomputedFirst);
      if (m.changedCount != null) m.changed = waveList(m.changedCount, m.changedFirst);
      return p;
    }
    var PATH_RE = /^(master\.factor|dep\.\d+\.(value|limit|level|hot|alarm))$/;
    return {
      state: function () { return st; },
      subscribe: function (f) { subs.push(f); return function () { subs = subs.filter(function (g) { return g !== f; }); }; },
      onWave: function (f) { waveSubs.push(f); return function () { waveSubs = waveSubs.filter(function (g) { return g !== f; }); }; },
      build: build,
      write: function () {
        return ensure().then(function () { set({ phase: "writing" }); return call("write", {}).then(function () { set({ phase: "ready" }); }, function (err) { set({ phase: "error", error: err.message }); throw err; }); });
      },
      stress: function () { return ensure().then(function () { set({ phase: "stressing", stress: { writes: 0, wps: 0, resets: 0 } }); return call("stress", {}); }); },
      stop: function () { return call("stop", {}).then(function () { if (st.phase === "stressing") set({ phase: "ready" }); }); },
      dependent: function (i) { return ensure().then(function () { return call("dependent", { i: i }); }).then(function (r) { r.payload.hotExplain = adapt(r.payload.hotExplain); return r.payload; }); },
      explain: function (path) {
        path = String(path || "");
        if (!PATH_RE.test(path)) return Promise.resolve({ path: path, value: undefined, meta: { note: "not a path of the live fan-out kernel (master.factor, dep.<i>.value|limit|level|hot|alarm)" } });
        return ensure().then(function () { return call("explain", { path: path }); }).then(function (r) { return adapt(r.payload); });
      },
      // only the Inspector's self:inspect request is answered (recomputeMode etc. from the real kernel); anything else is refused
      execute: function (req) {
        var path = String(req && req.path || "");
        if (!req || req.operation !== "inspect" || !PATH_RE.test(path)) return Promise.reject(new Error("the fan-out kernel only answers self:inspect for its own paths"));
        return ensure().then(function () { return call("inspect", { path: path }); }).then(function (r) { return r.payload; });
      },
    };
  })();
  // What the Inspector talks to (landing-gui.js mounts with { me: window.FanoutKernel } on pages with the viz).
  root.FanoutKernel = { explain: live.explain, execute: live.execute, __live: live };
  var ICON = {
    pause: h("svg", { viewBox: "0 0 16 16", "aria-hidden": "true" }, h("rect", { x: 3.5, y: 2.5, width: 3, height: 11, rx: 1, fill: "currentColor" }), h("rect", { x: 9.5, y: 2.5, width: 3, height: 11, rx: 1, fill: "currentColor" })),
    play: h("svg", { viewBox: "0 0 16 16", "aria-hidden": "true" }, h("path", { d: "M4.5 2.6v10.8a.6.6 0 0 0 .9.5l8.6-5.4a.6.6 0 0 0 0-1L5.4 2.1a.6.6 0 0 0-.9.5z", fill: "currentColor" })),
    write: h("svg", { viewBox: "0 0 16 16", "aria-hidden": "true" }, h("circle", { cx: 8, cy: 8, r: 2.6, fill: "currentColor" }), h("path", { d: "M8 1v3M8 12v3M1 8h3M12 8h3M3 3l2 2M11 11l2 2M13 3l-2 2M5 11l-2 2", stroke: "currentColor", strokeWidth: 1.4, strokeLinecap: "round" })),
    stress: h("svg", { viewBox: "0 0 16 16", "aria-hidden": "true" }, h("path", { d: "M1 8h3l2-5 3 10 2-5h4", fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round", strokeLinejoin: "round" })),
    stop: h("svg", { viewBox: "0 0 16 16", "aria-hidden": "true" }, h("rect", { x: 3.5, y: 3.5, width: 9, height: 9, rx: 1.5, fill: "currentColor" })),
  };
  var PAUSE_KEY = "fanout-viz.paused";
  // the wedge of slice s (angles s/S·2π … (s+1)/S·2π, like dependent i at i/N·2π), in a viewBox where the disc radius
  // is 1 and the lines reach 0.84 (42% of the canvas)
  function wedge(s) {
    var a0 = s / SLICES * Math.PI * 2, a1 = (s + 1) / SLICES * Math.PI * 2, r0 = .25, r1 = .86, P = function (r, a) { return (r * Math.cos(a)).toFixed(4) + " " + (r * Math.sin(a)).toFixed(4); };
    return "M" + P(r0, a0) + "L" + P(r1, a0) + "A" + r1 + " " + r1 + " 0 0 1 " + P(r1, a1) + "L" + P(r0, a1) + "A" + r0 + " " + r0 + " 0 0 0 " + P(r0, a0) + "Z";
  }
  var WEDGES = null;
  function nodeStore() { return root["GUI-NODES-STORE"] || null; }
  var depOf = function (s, n) { return Math.min(n, Math.floor((s + .5) / SLICES * n) + 1); };
  var F = .84;   // line reach in disc-radius units (42% of the canvas / 50%)

  function FanoutViz(props) {
    var rootId = props["data-gui-node-id"] || "fanout-viz", depId = rootId + "/dependent";
    var wrapRef = useRef(null), discRef = useRef(null), rotRef = useRef(null), baseRef = useRef(null), waveRef = useRef(null), dotsRef = useRef(null), overRef = useRef(null), hitRef = useRef(null), markRef = useRef(null), markGRef = useRef(null), kRef = useRef(null);
    var reduceNow = !!(root.matchMedia && root.matchMedia("(prefers-reduced-motion: reduce)").matches);
    var pausedInit = function () { if (reduceNow) return true; try { return root.localStorage.getItem(PAUSE_KEY) === "1"; } catch (e) { return false; } };
    var ps = useState(pausedInit), paused = ps[0], setPaused = ps[1];
    var sm = useState(smallDevice), small = sm[0], setSmall = sm[1];
    useEffect(function () {
      if (!root.matchMedia) return; var qs = [root.matchMedia(SMALL_Q), root.matchMedia("(pointer: coarse)")], on = function () { setSmall(smallDevice()); };
      qs.forEach(function (q) { if (q.addEventListener) q.addEventListener("change", on); }); return function () { qs.forEach(function (q) { if (q.removeEventListener) q.removeEventListener("change", on); }); };
    }, []);
    var ls = useState(live.state()), lst = ls[0], setLst = ls[1];
    var ss = useState({ kind: "none" }), sel = ss[0], setSel = ss[1];          // none | slice {s} | center | dep {i}
    var xs = useState(null), selInfo = xs[0], setSelInfo = xs[1];
    var ctl = useRef({ paused: paused, optIn: false, selDep: 0, redraw: null, geo: null, flags: null, rot: 0 });
    ctl.current.paused = paused;
    if (!WEDGES) { WEDGES = []; for (var w0 = 0; w0 < SLICES; w0++) WEDGES.push(wedge(w0)); }
    var N = lst.n || lst.target || 10000;
    var selDep = sel.kind === "dep" ? sel.i : sel.kind === "slice" ? depOf(sel.s, N) : 0;
    ctl.current.selDep = selDep;
    var sliceId = function (s) { return rootId + "/slice-" + String(s).padStart(3, "0"); };

    useEffect(function () { return live.subscribe(function (s) { setLst(Object.assign({}, s)); }); }, []);

    // ── .GUI parts: centre, 128 slices, the selected dependent (provenance → real kernel paths) ──
    var partIds = useRef(null);
    useEffect(function () { return function () { var store = nodeStore(); if (store && partIds.current) partIds.current.forEach(function (id) { store.actions.unregisterNode(id); }); partIds.current = null; }; }, [rootId]);
    var rec = function (seg, type, prov, rp) { var id = rootId + "/" + seg;
      return { id: id, path: rootId + "." + seg, type: type, part: seg, parentId: rootId, provenance: prov, spec: { type: type, props: rp, provenance: prov }, resolvedProps: rp }; };
    var SRC = "live kernel (this.me 4.2.1, Web Worker)";
    var depRecord = function (i, n) { return rec("dependent", "FanoutViz.Dependent", { semanticPath: "dep." + i + ".hot", source: SRC,
      note: "Dependent " + fmt(i) + " of " + fmt(n) + ": facts dep." + i + ".value and .limit; derived .level = value * master.factor, .hot = level > limit, .alarm = hot == true. Explain shows .hot." },
      { index: i, of: n, angle: (i / n * 360).toFixed(3) + "°", paths: ["dep." + i + ".level", "dep." + i + ".hot", "dep." + i + ".alarm"] }); };
    useEffect(function () {
      var store = nodeStore(); if (!store || !store.actions) return;
      var recs = [rec("center", "FanoutViz.Center", { semanticPath: "master.factor", source: SRC, note: "The value written. Every dependent's level reads it." }, { role: "the write", path: "master.factor" })];
      for (var s = 0; s < SLICES; s++) {
        var a0 = s / SLICES * 360, dep = depOf(s, N), i0 = Math.floor(s / SLICES * N) + 1, i1 = Math.floor((s + 1) / SLICES * N);
        recs.push(rec("slice-" + String(s).padStart(3, "0"), "FanoutViz.Slice", { semanticPath: "dep." + dep + ".hot", source: SRC,
          note: "Slice " + (s + 1) + " of " + SLICES + ": dependents " + fmt(i0) + "–" + fmt(i1) + " of " + fmt(N) + " (one line each); sampled dependent dep." + dep + "." },
          { slice: s + 1, of: SLICES, angle: a0.toFixed(1) + "°–" + (a0 + 360 / SLICES).toFixed(1) + "°", dependents: fmt(i0) + "–" + fmt(i1), sampledPath: "dep." + dep + ".hot", kernelN: N }));
      }
      recs.push(depRecord(1, N));
      var first = !partIds.current, i = 0, raf = 0;
      partIds.current = recs.map(function (r) { return r.id; });
      if (first) { recs.forEach(function (r) { store.actions.registerNode(r); }); return; }
      // a kernel-size change while animating: 16 parts per frame (each update copies the store and notifies .GUI)
      var step = function () { raf = 0; for (var j = 0; j < 16 && i < recs.length; j++, i++) store.actions.registerNode(recs[i]); if (i < recs.length) raf = requestAnimationFrame(step); };
      step();
      return function () { if (raf) { cancelAnimationFrame(raf); for (; i < recs.length; i++) store.actions.registerNode(recs[i]); } };
    }, [rootId, N]);
    // select dependent i: the part points at it first, so a click that lands on the marker selects the right path
    var selectDep = function (i, viaStore) {
      var store = nodeStore(); if (!store) return; i = ((i - 1) % N + N) % N + 1;
      store.actions.registerNode(depRecord(i, N)); ctl.current.pendingDep = i;
      if (viaStore) store.actions.selectNode(depId);
      setSel({ kind: "dep", i: i });
    };
    // selection both ways: store → canvas highlight + readout
    useEffect(function () {
      var store = nodeStore(); if (!store) return;
      var last = null, pre = rootId + "/slice-";
      var sync = function () {
        var stt = store.getState(), id = stt.selectedNodeId; if (id === last) return; last = id;
        if (id === depId) { var r = stt.records[depId], i = r && r.resolvedProps && r.resolvedProps.index; setSel({ kind: "dep", i: i || ctl.current.pendingDep || 1 }); }
        else if (id && id.indexOf(pre) === 0) setSel({ kind: "slice", s: +id.slice(pre.length) });
        else if (id === rootId + "/center") setSel({ kind: "center" });
        else setSel({ kind: "none" });
      };
      sync(); return store.subscribe(sync);
    }, [rootId, depId]);
    // the selected dependent's real values + its last-wave status
    useEffect(function () {
      if (ctl.current.redraw) ctl.current.redraw();
      if (!selDep) { setSelInfo(null); return; }
      var alive = true; setSelInfo({ i: selDep, loading: true });
      live.dependent(selDep).then(function (p) { if (alive) setSelInfo({ i: selDep, p: p, flags: ctl.current.flags }); }, function (e) { if (alive) setSelInfo({ i: selDep, error: e.message }); });
      return function () { alive = false; };
    }, [selDep, N, lst.wave && lst.wave.stats && lst.wave.stats.nWrites, lst.resets]);

    // build the default 10k kernel once the figure is near the screen, then one real write (all in the worker)
    useEffect(function () {
      var el = wrapRef.current; if (!el) return;
      var go = function () { if (live.state().phase === "idle") live.build(10000).then(function () { return live.write(); }).catch(function () {}); };
      if (!root.IntersectionObserver) { go(); return; }
      var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { go(); io.disconnect(); } }, { rootMargin: "200px" }); io.observe(el);
      return function () { io.disconnect(); };
    }, []);
    // ── the canvas: base (all N lines, dim), wave (the same lines, lit by the replayed sweep), dots (added as the replay
    // reaches them), over (guide, centre, selection). All in one rotating layer, with the hit SVG, in a circular mask.
    useEffect(function () {
      injectCss();
      var wrap = wrapRef.current, base = baseRef.current, wave = waveRef.current, dots = dotsRef.current, over = overRef.current, rot = rotRef.current;
      var bctx = base && base.getContext("2d"), wctx = wave && wave.getContext("2d"), dctx = dots && dots.getContext("2d"), ctx = over && over.getContext("2d");
      if (!wrap || !bctx || !wctx || !dctx || !ctx) return;
      var C = ctl.current, reduce = root.matchMedia ? root.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
      var isStill = function () { return reduce.matches && !C.optIn; };
      var R = rng(20261011), ang = new Float64Array(N), len = new Float64Array(N);   // same sequence as RASTER
      for (var i = 0; i < N; i++) { ang[i] = i / N * Math.PI * 2 + (R() - .5) * .015; len[i] = .55 + R() * .45; }
      var cosA = new Float64Array(N), sinA = new Float64Array(N);
      for (var i2 = 0; i2 < N; i2++) { cosA[i2] = Math.cos(ang[i2]); sinA[i2] = Math.sin(ang[i2]); }
      var ratio = N / ORIG_N, brightEvery = Math.max(1, Math.round(7 * ratio)), wideEvery = Math.max(1, Math.round(13 * ratio));
      var baseA = 1 - Math.pow(1 - .06, 1 / ratio), dBase = -Math.log(1 - baseA), dBright = -Math.log(1 - .2) - (-Math.log(1 - .06));
      var depth = null, depthW = 0, size = 0, dpr = 1, col = null, colKey = "", raf = 0, visible = true, T = 0, lastTs = 0;
      // hit test (angle bucket): dependent i (1-based) whose line passes nearest the point (local angle th, radius r in
      // disc units) and reaches it; the jitter is ±0.0075 rad, so ±W neighbours cover every candidate
      var W = Math.ceil(.0075 / (2 * Math.PI) * N) + 2;
      C.geo = { N: N, hit: function (th, r) {
        if (r < .05 || r > F + .02) return 0; var i0 = Math.round(th / (2 * Math.PI) * N), best = 0, bd = 1e9;
        for (var j = i0 - W; j <= i0 + W; j++) { var k = ((j % N) + N) % N; if (len[k] * F < r - .01) continue; var d = Math.abs(ang[k] - th) % (2 * Math.PI); if (d > Math.PI) d = 2 * Math.PI - d; if (d < bd) { bd = d; best = k + 1; } }
        return best; }, point: function (i, r) { var k = i - 1, l = r == null ? len[k] * F : Math.min(r, len[k] * F); return [cosA[k] * l, sinA[k] * l]; } };
      var probe = document.createElement("canvas").getContext("2d");
      var norm = function (c, fb) { probe.fillStyle = fb; try { probe.fillStyle = c || fb; } catch (e) {} return probe.fillStyle; };
      var rgbOf = function (c) { var m = /^#([0-9a-f]{6})$/i.exec(c); if (m) { var v = parseInt(m[1], 16); return [v >> 16 & 255, v >> 8 & 255, v & 255]; } var r = /rgba?\(([^)]+)\)/.exec(c); return r ? r[1].split(",").slice(0, 3).map(Number) : [0, 0, 0]; };
      function readColors() {
        var cs = getComputedStyle(wrap), bodyBg = getComputedStyle(document.body).backgroundColor;
        var bg = norm(/rgba?\([^)]*,\s*0\)$|transparent/.test(bodyBg) ? cs.getPropertyValue("--mui-palette-background-default").trim() : bodyBg, "#111"), fg = norm(cs.getPropertyValue("--mui-palette-text-primary").trim(), "#eee");
        var key = bg + "|" + fg; if (key === colKey) return false; colKey = key;
        var c = rgbOf(bg), dark = (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) < 128, f = rgbOf(fg);
        col = { dark: dark, teal: dark ? [38, 170, 148] : [4, 108, 92], gain: dark ? .75 : 2.1, baseAlpha: dark ? .26 : .2,
          gold: dark ? "#f0c04a" : "#e09f00", pink: dark ? "#f472b6" : "#c2185b", coral: dark ? "#ff7b5c" : "#ff6b4a", sel: dark ? "#ffffff" : "#111827",
          dotR: dark ? 1.5 : 1.6, guide: "rgba(" + f.join(",") + "," + (dark ? .1 : .06) + ")" };
        base.style.opacity = col.baseAlpha; wrap.style.setProperty("--fov-gold", col.gold); wrap.style.setProperty("--fov-pink", col.pink);
        return true;
      }
      var job = 0, worker = null;
      function rasterize() {
        var Wd = Math.round(size * dpr), id = ++job, args = [Wd, N, wideEvery, brightEvery, dBase, dBright];
        var done = function (buf) { if (id !== job) return; depth = buf; depthW = Wd; colorize(); redrawDots(); frame(); };
        if (!worker && root.Worker && root.Blob && root.URL) try {
          var src = "var R=" + rng + ";var raster=" + RASTER + ";onmessage=function(e){var d=raster.apply(null,[R].concat(e.data.a));postMessage({id:e.data.id,d:d},[d.buffer]);};";
          var url = URL.createObjectURL(new Blob([src], { type: "text/javascript" })); worker = new Worker(url); URL.revokeObjectURL(url);
          worker.onmessage = function (e) { if (e.data.id === job) done(e.data.d); };
          worker.onerror = function () { worker = false; done(RASTER.apply(null, [rng].concat(args))); };
        } catch (e) { worker = false; }
        if (worker) worker.postMessage({ id: id, a: args }); else done(RASTER.apply(null, [rng].concat(args)));
      }
      function colorize() {
        if (!depth) return; var Wd = depthW; base.width = base.height = wave.width = wave.height = Wd;
        var img = bctx.createImageData(Wd, Wd), px = img.data, tl = col.teal, gain = col.gain;
        for (var j = 0, n = Wd * Wd; j < n; j++) { var dd = depth[j]; if (dd <= 0) continue; var q = j * 4; px[q] = tl[0]; px[q + 1] = tl[1]; px[q + 2] = tl[2]; px[q + 3] = 255 * (1 - Math.exp(-dd * gain)); }
        bctx.putImageData(img, 0, 0); wctx.clearRect(0, 0, Wd, Wd); wctx.drawImage(base, 0, 0);
      }
      // ── the replayed wave: events 0…E-1 in the kernel's real order (levels, hots, alarms), paced uniformly over the
      // measured write duration. Levels arrive in index order (checked per wave: mono), so the lit sector is exact.
      var wv = null, P = 0, rp = 0, hd = 0, ad = 0;
      function setFlags(d) { var fl = new Uint8Array(N + 1); for (var j = 1; j < d.hotCh.length; j += 2) fl[d.hotCh[j]] |= 1; for (var j2 = 1; j2 < d.alarmRec.length; j2 += 2) fl[d.alarmRec[j2]] |= 2; C.flags = fl; }
      var offWave = live.onWave(function (d) {
        if (d.n !== N) return;
        wv = d; P = 0; rp = 0; hd = 0; ad = 0; setFlags(d); dctx.setTransform(1, 0, 0, 1, 0, 0); dctx.clearRect(0, 0, dots.width, dots.height);
        if (isStill() || C.paused || !visible || document.hidden) P = d.E;   // no motion: the final state at once
        drawNewDots(); frame(); start();
      });
      function drawNewDots() {
        if (!wv || !col) return; var Wd = dots.width, c = Wd / 2, f = Wd * .42, u = Wd / 800;
        dctx.setTransform(1, 0, 0, 1, c, c);
        // gold at the line's tip (its hot flipped); pink just beyond it (its alarm recomputed, the next step of the chain)
        var batch = function (arr, from, color, r, out) { var n = arr.length / 2, k = from; if (k >= n || arr[2 * k] >= P) return k; dctx.beginPath(); dctx.fillStyle = color;
          for (; k < n && arr[2 * k] < P; k++) { var i = arr[2 * k + 1] - 1, l = len[i] * f + out, x = cosA[i] * l, y = sinA[i] * l; dctx.moveTo(x + r, y); dctx.arc(x, y, r, 0, Math.PI * 2); } dctx.fill(); return k; };
        hd = batch(wv.hotCh, hd, col.gold, col.dotR * 1.25 * u, 0); ad = batch(wv.alarmRec, ad, col.pink, col.dotR * u, 5.5 * u);
        dctx.setTransform(1, 0, 0, 1, 0, 0);
      }
      function redrawDots() { dctx.setTransform(1, 0, 0, 1, 0, 0); dctx.clearRect(0, 0, dots.width, dots.height); hd = 0; ad = 0; drawNewDots(); }
      var lastMask = "", lastK = -1, kNum = kRef.current && kRef.current.querySelector("[data-k]");
      function frame() {
        var still = isStill(), r = still ? 0 : T / 90 * Math.PI * 2; C.rot = r;
        if (rot) rot.style.transform = still ? "" : "rotate(" + r.toFixed(4) + "rad)";
        // the lit sector: the levels replayed so far (index order), as a conic mask on the wave layer
        var lit = !wv ? 0 : wv.mono ? Math.min(P, wv.levels) / N : (P >= wv.E ? 1 : 0), mask = lit >= 1 ? "none" : "conic-gradient(from 90deg, #000 " + (lit * 360).toFixed(3) + "deg, transparent " + (lit * 360).toFixed(3) + "deg)";
        if (!wv) mask = "conic-gradient(#0000 0 0)";
        if (mask !== lastMask) { lastMask = mask; wave.style.maskImage = wave.style.webkitMaskImage = mask; }
        if (col) drawNewDots();
        var Wd = over.width, c = Wd / 2, f = Wd * .42, u = Wd / 800;
        ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, Wd, Wd); if (!col) return;
        ctx.beginPath(); ctx.strokeStyle = col.guide; ctx.lineWidth = u; ctx.arc(c, c, f, 0, Math.PI * 2); ctx.stroke();
        ctx.setTransform(1, 0, 0, 1, c, c);
        if (C.selDep > 0 && C.selDep <= N) {   // the selected dependent: its line, and a ring at its tip
          var k = C.selDep - 1, ll = len[k] * f;
          ctx.beginPath(); ctx.strokeStyle = col.sel; ctx.globalAlpha = .85; ctx.lineWidth = 1.4 * u; ctx.moveTo(0, 0); ctx.lineTo(cosA[k] * ll, sinA[k] * ll); ctx.stroke();
          ctx.beginPath(); ctx.lineWidth = 1.6 * u; ctx.arc(cosA[k] * ll, sinA[k] * ll, 5 * u, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1;
        }
        var replaying = wv && P < wv.E, pz = still || C.paused || !replaying ? 1 : 1 + Math.sin(T * 9) * .2;
        ctx.beginPath(); ctx.fillStyle = col.coral; ctx.arc(0, 0, 9 * u, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.strokeStyle = col.coral; ctx.globalAlpha = .28; ctx.lineWidth = 2.5 * u; ctx.arc(0, 0, 20 * u * pz, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.fillStyle = "#fff"; ctx.globalAlpha = .7; ctx.arc(-2 * u, -2 * u, 2.2 * u, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        var kk = wv ? Math.min(wv.E, Math.floor(P)) : 0;
        if (kk !== lastK && kNum) { lastK = kk; kNum.textContent = wv ? "k = " + fmt(kk) + " / " + fmt(wv.E) : "k = –"; }
      }
      function layout() {
        var w = Math.floor(Math.min(520, wrap.clientWidth - 2)); if (w < 120) return false;
        var d = Math.min(2, root.devicePixelRatio || 1), changed = readColors();
        if (w === size && d === dpr) { if (changed) { colorize(); redrawDots(); } return changed; }
        size = w; dpr = d; var px = Math.round(w * d);
        [dots, over].forEach(function (cv) { cv.width = cv.height = px; });
        [base, wave, dots, over].forEach(function (cv) { cv.style.width = cv.style.height = w + "px"; });
        if (discRef.current) discRef.current.style.width = discRef.current.style.height = w + "px";
        if (rot) rot.style.width = rot.style.height = w + "px";
        rasterize(); return true;
      }
      function loop(ts) {
        raf = 0; if (!visible || document.hidden || isStill() || C.paused) { lastTs = 0; return; }
        var dt = lastTs ? Math.min(.05, (ts - lastTs) / 1000) : 0; lastTs = ts; T += dt;
        if (wv && P < wv.E) { rp += dt; P = Math.min(wv.E, rp * 1000 / Math.max(1, wv.writeMs) * wv.E); }
        frame(); raf = requestAnimationFrame(loop);
      }
      function start() { if (isStill() || C.paused) { if (wv && P < wv.E) { P = wv.E; } frame(); return; } if (!raf) raf = requestAnimationFrame(loop); }
      C.redraw = function () { if (raf) return; start(); };
      var nF = 0, rto = 0;
      function redraw() { clearTimeout(rto); rto = setTimeout(function () { if (layout() || isStill() || !raf) frame(); }, 120); }
      layout(); frame(); start();
      var ro = root.ResizeObserver ? new ResizeObserver(redraw) : null; if (ro) ro.observe(wrap);
      var io = root.IntersectionObserver ? new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) start(); }, { threshold: .1 }) : null; if (io) io.observe(wrap);
      var mo = new MutationObserver(function () { if (readColors()) { colorize(); redrawDots(); frame(); } });
      [document.documentElement, document.body].forEach(function (n) { mo.observe(n, { attributes: true }); });
      var onVis = function () { if (!document.hidden) start(); }; document.addEventListener("visibilitychange", onVis);
      var onRm = function () { if (isStill()) { if (raf) cancelAnimationFrame(raf); raf = 0; lastTs = 0; start(); } else start(); };
      if (reduce.addEventListener) reduce.addEventListener("change", onRm);
      // pointer → dependent (angle-bucket hit test, undoing the current rotation). The marker follows the pointer onto
      // the line under it, so a mouse press and release both land on the "selected dependent" part and the click (ours
      // or the Inspector's) selects it; the part is pointed at the right path on press, before the click.
      var disc = discRef.current;
      var place = function (e) {
        var m = markRef.current; if (!m || !C.geo) return 0;
        var b = disc.getBoundingClientRect(), half = b.width / 2, dx = e.clientX - b.left - half, dy = e.clientY - b.top - half, r = Math.hypot(dx, dy) / half;
        var th = Math.atan2(dy, dx) - C.rot; th = ((th % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
        var i = C.geo.hit(th, r);
        if (!i) { m.removeAttribute("data-armed"); disc.style.cursor = ""; return 0; }
        var p = C.geo.point(i, r); m.setAttribute("cx", p[0].toFixed(4)); m.setAttribute("cy", p[1].toFixed(4)); m.setAttribute("data-armed", ""); disc.style.cursor = "pointer";
        return i;
      };
      var onMove = function (e) { if (e.pointerType === "mouse") place(e); };
      var onDown = function (e) { var i = place(e); if (i) selectDep(i, e.pointerType !== "mouse"); };
      disc.addEventListener("pointermove", onMove);
      disc.addEventListener("pointerdown", onDown);
      return function () { disc.removeEventListener("pointerdown", onDown); disc.removeEventListener("pointermove", onMove); offWave(); C.redraw = null; job++; if (worker) worker.terminate(); clearTimeout(rto); if (raf) cancelAnimationFrame(raf); if (ro) ro.disconnect(); if (io) io.disconnect(); mo.disconnect(); document.removeEventListener("visibilitychange", onVis); if (reduce.removeEventListener) reduce.removeEventListener("change", onRm); };
    }, [N]);
    var togglePause = function () {
      var next = !paused; ctl.current.paused = next; if (!next) ctl.current.optIn = true;   // play under reduced motion = the reader's opt-in
      try { root.localStorage.setItem(PAUSE_KEY, next ? "1" : "0"); } catch (e) {}
      setPaused(next); if (ctl.current.redraw) ctl.current.redraw();
    };
    var onHit = function (e) {
      var g = e.target && e.target.closest && e.target.closest("[data-gui-node-id]"); if (!g || !hitRef.current || !hitRef.current.contains(g)) return;
      var store = nodeStore(), id = g.getAttribute("data-gui-node-id");
      if (store) store.actions.selectNode(id === depId || store.getState().selectedNodeId !== id ? id : null);
    };
    var onKey = function (e) {
      var step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1, PageDown: 100, PageUp: -100 }[e.key];
      if (e.key === "Home") { e.preventDefault(); selectDep(1, true); return; }
      if (e.key === "End") { e.preventDefault(); selectDep(N, true); return; }
      if (!step) return; e.preventDefault();
      var cur = selDep || 1; selectDep(cur + step * (e.shiftKey ? 10 : 1), true);
      var m = markRef.current, g = markGRef.current; if (m && ctl.current.geo) { var p = ctl.current.geo.point(((cur + step * (e.shiftKey ? 10 : 1) - 1) % N + N) % N + 1); m.setAttribute("cx", p[0].toFixed(4)); m.setAttribute("cy", p[1].toFixed(4)); m.removeAttribute("data-armed"); }
    };
    var busy = lst.phase === "building" || lst.phase === "writing", stressing = lst.phase === "stressing";
    var pick = function (n) { if (busy || stressing || (lst.n === n && lst.phase !== "error")) return; live.build(n).then(function () { return live.write(); }).catch(function () {}); };
    var Wv = lst.wave, S = Wv && Wv.stats, num = function (x, k) { return h("span", { className: "fov-num", key: k }, x); };
    var line1 = lst.phase === "building" ? h("span", null, h("span", { className: "fov-busy", "aria-hidden": "true" }), "Building ", num(fmt(lst.target)), " dependents (3 derived values each) in the worker… ", num(Math.round(lst.progress * 100) + "%"))
      : lst.phase === "error" ? h("span", { className: "fov-warn" }, "Live kernel unavailable: " + lst.error)
      : lst.phase === "idle" ? h("span", null, "Starting the live kernel…")
      : !Wv ? h("span", null, lst.phase === "writing" ? [h("span", { key: 0, className: "fov-busy", "aria-hidden": "true" }), "First write…"] : "Ready.")
      : h("span", null, "write #", num(fmt(S.nWrites), 1), ": master.factor ", num(Wv.from, 2), " → ", num(Wv.factor, 3), " · k = ", num(fmt(Wv.k), 4), " recomputed (", num(fmt(Wv.levels), 5), " level + ", num(fmt(Wv.hots), 6), " hot + ", num(fmt(Wv.alarms), 7),
          " alarm) · ", num(fmt(Wv.changed), 8), " changed · m = ", num(fmt(Wv.m), 9), " hot flipped · ", num(fmt(Wv.levels - Wv.alarms), 10), " alarms skipped (early cutoff)");
    var line2 = !Wv ? null : h("span", null, num(ms(Wv.writeMs), 1), " this write · p50 ", num(ms(S.p50), 2), " · p95 ", num(ms(S.p95), 3), " (last ", S.window, ") · heap ≈ ", num(fmt(S.heapMB) + " MB", 4), " (estimate) · built ", num(fmt(lst.n), 5), " in ", num(ms(lst.buildMs), 6));
    var st = lst.stress, line3 = stressing || (st && st.writes) ? h("span", null, stressing ? h("span", { className: "fov-busy", "aria-hidden": "true" }) : null, "stress: ", num(fmt(st ? st.writes : 0), 1), " writes · ", num((st ? st.wps : 0).toFixed(2), 2), " writes/s",
        S && S.drift != null ? [" · drift ", num((S.drift >= 0 ? "+" : "") + Math.round(S.drift * 100) + "%", 3), " (p50 last 10 vs first 10 since build)"] : null,
        lst.resets ? [" · ", h("b", { key: "r" }, "kernel reset (log size)"), " ×", num(lst.resets, 4)] : null,
        " · sustained writes slow down as the log grows; the reset starts a fresh kernel") : null;
    var info = null;
    if (selInfo) {
      var P = selInfo.p, fl = selInfo.flags && selInfo.flags[selInfo.i] || 0, hx = P && P.hotExplain && P.hotExplain.meta || {};
      info = h("div", { className: "fov-sel", "aria-live": "polite", "data-fov": "sel" }, h("b", null, "dep." + selInfo.i), selInfo.loading ? " …" : selInfo.error ? " · " + selInfo.error : [
        ": value ", num(P.value, 1), " × master.factor ", num(P.factor, 2), " = level ", num(typeof P.level === "number" ? String(+P.level.toFixed(4)) : String(P.level), 3), " · limit ", num(P.limit, 4), " → hot ", num(String(P.hot), 5), " · alarm ", num(String(P.alarm), 6),
        Wv ? [" · last write: hot ", fl & 1 ? h("b", { key: "a" }, "flipped") : "unchanged", ", alarm ", fl & 2 ? h("b", { key: "b" }, "recomputed") : "skipped (early cutoff)"] : null,
        hx.k != null ? " · wave k = " + fmt(hx.k) : "", " · ←/→ neighbours, Inspector: Explain"]);
    }
    var hitLayer = React.useMemo(function () {
      return h("svg", { className: "fov-hit", ref: hitRef, viewBox: "-1 -1 2 2", "aria-hidden": "true", onClick: onHit },
        WEDGES.map(function (d, s) { return h("g", { key: s, "data-gui-node-id": sliceId(s), "data-gui-component": "FanoutViz.Slice", className: sel.kind === "slice" && sel.s === s ? "on" : undefined },
          h("path", { d: d, vectorEffect: "non-scaling-stroke" })); }),
        h("g", { "data-gui-node-id": rootId + "/center", "data-gui-component": "FanoutViz.Center", className: sel.kind === "center" ? "on" : undefined }, h("circle", { cx: 0, cy: 0, r: .07, vectorEffect: "non-scaling-stroke" })),
        h("g", { ref: markGRef, "data-gui-node-id": depId, "data-gui-component": "FanoutViz.Dependent", className: sel.kind === "dep" ? "on" : undefined }, h("circle", { ref: markRef, className: "fov-mark", cx: 0, cy: 0, r: .03, vectorEffect: "non-scaling-stroke" })));
    }, [sel.kind, sel.s, rootId, N]);
    var label = "Live: " + fmt(N) + " real dependents of master.factor, one line each; gold dots are hot flags that changed in the last write, pink dots the alarms it recomputed.";
    return h("figure", { className: "fov", ref: wrapRef, "data-gui-node-id": props["data-gui-node-id"], style: { margin: "0 0 28px" } },
      h("div", { className: "fov-disc", ref: discRef, tabIndex: 0, role: "group", "aria-label": label + " Click a line or use the arrow keys to select a dependent.", onKeyDown: onKey },
        h("div", { ref: rotRef, style: { position: "absolute", left: 0, top: 0, transformOrigin: "50% 50%", willChange: "transform" } },
          h("canvas", { ref: baseRef, "aria-hidden": "true" }), h("canvas", { ref: waveRef, "aria-hidden": "true" }), h("canvas", { ref: dotsRef, "aria-hidden": "true" }), h("canvas", { ref: overRef, "aria-hidden": "true" }), hitLayer)),
      h("div", { className: "fov-k", ref: kRef, "data-fov": "k" }, h("span", { "data-k": "" }, "k = –"), h("span", { className: "fov-tag rep" }, "replay"),
        h("span", null, "in real order at the measured duration" + (Wv ? " (" + ms(Wv.writeMs) + ")" : ""))),
      h("figcaption", { className: "fov-cap" }, h("b", null, "Each line is one real dependent"), " of master.factor in a live this.me kernel (", num(fmt(N)), " dependents, angle i/N). After a write, the sweep replays the kernel's real recompute order at the write's measured duration:",
        h("span", { className: "fov-nw" }, h("span", { className: "fov-dot", style: { background: "var(--fov-gold, #e09f00)" } }), "hot flipped"), h("span", { className: "fov-nw" }, h("span", { className: "fov-dot", style: { background: "var(--fov-pink, #c2185b)" } }), "alarm recomputed"), " — the alarms whose hot did not change are skipped (early cutoff)."),
      h("div", { className: "fov-live", "aria-busy": busy || stressing ? "true" : "false", "data-gui-inspector-control": "true" },
        h("div", null, h("span", { className: "fov-tag live", style: { marginLeft: 0 } }, "live"), "Measured on this device: this.me 4.2.1 in a Web Worker. Per dependent: ",
          h("span", { className: "fov-num fov-nw" }, "level = value * master.factor"), " · ", h("span", { className: "fov-num fov-nw" }, "hot = level > limit"), " · ", h("span", { className: "fov-num fov-nw" }, "alarm = hot == true"), "."),
        h("div", { className: "fov-bar" },
          h("button", { type: "button", className: "fov-btn", "aria-label": paused ? "Play the animation" : "Pause the animation", "data-fov": "pause", onClick: togglePause }, paused ? ICON.play : ICON.pause, paused ? "Play" : "Pause"),
          h("button", { type: "button", className: "fov-btn", disabled: busy || stressing || lst.phase === "error" || !lst.n, "data-fov": "write", onClick: function () { live.write().catch(function () {}); } }, ICON.write, "Write master.factor"),
          h("button", { type: "button", className: "fov-btn" + (stressing ? " fov-stop" : ""), disabled: busy || lst.phase === "error" || !lst.n, "data-fov": "stress", "aria-pressed": stressing ? "true" : "false",
            onClick: function () { (stressing ? live.stop() : live.stress()).catch(function () {}); } }, stressing ? ICON.stop : ICON.stress, stressing ? "Stop" : "Stress"),
          h("span", { className: "fov-seg-g", role: "group", "aria-label": "Live kernel size" },
            h("button", { type: "button", className: "fov-btn fov-seg", "aria-pressed": lst.target === 10000 ? "true" : "false", disabled: busy || stressing, "data-fov": "n10k", onClick: function () { pick(10000); } }, "10k"),
            small ? null : h("button", { type: "button", className: "fov-btn fov-seg", "aria-pressed": lst.target === 100000 ? "true" : "false", disabled: busy || stressing, "data-fov": "n100k", title: "Builds 100,000 dependents (300,000 derived values) in the background worker: about 10–20 s to build and several seconds per write", onClick: function () { pick(100000); } }, "100k", h("small", null, "slow: ~10–20 s build")))),
        h("div", { className: "fov-out", role: "status", "aria-live": "polite", "data-fov": "status" }, h("div", null, line1), line2 ? h("div", null, line2) : null, line3 ? h("div", { "data-fov": "stress-line" }, line3) : null),
        info));
  }
  root.FanoutViz = FanoutViz;
})(typeof window !== "undefined" ? window : this);
