/*! fanout-viz 3.1.1 · .me extreme fan-out, driven by a real this.me kernel · MIT · neurons.me
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
    ".fov{container-type:inline-size}.fov-dash{display:grid;grid-template-columns:minmax(0,1fr);gap:14px;align-items:start}" +
    "@container (min-width: 760px){.fov-dash{grid-template-columns:minmax(0,1fr) 320px}.fov-panel{position:sticky;top:72px;max-height:calc(100vh - 88px);overflow:auto;overscroll-behavior:contain}}" +
    ".fov-vcol{min-width:0}.fov-short{margin:6px auto 0;text-align:center;font-size:13px;line-height:1.5;color:var(--mui-palette-text-secondary, #8b949e)}" +
    ".fov-legend{display:inline-flex;flex-wrap:wrap;gap:4px 12px;justify-content:center;align-items:center}.fov-legend .fov-dot{margin:0 5px 0 0}" +
    ".fov-info{display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;margin-left:4px;padding:0;border:0;border-radius:50%;background:transparent;color:var(--mui-palette-text-secondary, #8b949e);cursor:help;vertical-align:-4px}" +
    ".fov-info:hover,.fov-info:focus-visible{color:var(--mui-palette-primary-main, #2aa);outline:none;background:color-mix(in srgb, currentColor 12%, transparent)}.fov-info svg{width:14px;height:14px}" +
    ".fov-panel{contain:layout paint;border:1px solid var(--mui-palette-divider, rgba(128,128,128,.3));border-radius:12px;background:var(--mui-palette-background-paper, transparent);font-size:13px;color:var(--mui-palette-text-primary, inherit);overflow:hidden}" +
    "@container (max-width: 759px){.fov-panel{border-radius:16px 16px 12px 12px;box-shadow:0 -6px 18px rgba(0,0,0,.08)}.fov-phead::before{content:'';position:absolute;left:50%;top:5px;width:36px;height:4px;margin-left:-18px;border-radius:2px;background:var(--mui-palette-divider, rgba(128,128,128,.4))}.fov-phead{padding-top:14px}}" +
    ".fov-phead{position:relative;display:flex;align-items:center;gap:6px;padding:8px 8px 8px 12px}.fov-ptitle{flex:1;min-width:0;display:flex;align-items:center;gap:6px;font-weight:600;white-space:nowrap;overflow:hidden}" +
    ".fov-pmini{font-weight:400;color:var(--mui-palette-text-secondary, #8b949e);font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:11.5px;overflow:hidden;text-overflow:ellipsis}" +
    ".fov-ibtn{display:inline-flex;align-items:center;justify-content:center;width:30px;height:30px;padding:0;border-radius:8px;border:1px solid transparent;background:transparent;color:inherit;cursor:pointer}" +
    ".fov-ibtn:hover:not(:disabled){background:color-mix(in srgb, currentColor 10%, transparent)}.fov-ibtn:focus-visible{outline:2px solid var(--mui-palette-primary-main, #2aa);outline-offset:1px}.fov-ibtn:disabled{opacity:.45;cursor:default}.fov-ibtn svg{width:15px;height:15px}" +
    ".fov-chev{transition:transform .15s}.fov-chev.up{transform:rotate(180deg)}@media (prefers-reduced-motion: reduce){.fov-chev{transition:none}}" +
    ".fov-sec{border-top:1px solid var(--mui-palette-divider, rgba(128,128,128,.25))}.fov-shead{display:flex;width:100%;align-items:center;gap:6px;padding:7px 12px;border:0;background:transparent;color:inherit;font:inherit;font-size:12px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;cursor:pointer;text-align:left}" +
    ".fov-shead:hover{background:color-mix(in srgb, currentColor 5%, transparent)}.fov-shead:focus-visible{outline:2px solid var(--mui-palette-primary-main, #2aa);outline-offset:-2px}.fov-shead span{flex:1}.fov-shead small{font-weight:400;text-transform:none;letter-spacing:0;color:var(--mui-palette-text-secondary, #8b949e);font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}" +
    ".fov-sbody{padding:2px 12px 10px}.fov-row{display:flex;justify-content:space-between;align-items:baseline;gap:10px;padding:2px 6px;margin:0 -6px;border-radius:6px;line-height:1.55}.fov-row>span:first-child{color:var(--mui-palette-text-secondary, #8b949e);min-width:0}" +
    ".fov-row.hl{cursor:default}.fov-row.hl:hover,.fov-row.hl:focus-visible{background:color-mix(in srgb, var(--mui-palette-primary-main, #2aa) 12%, transparent);outline:none}" +
    ".fov-row .fov-num{text-align:right;white-space:nowrap;min-width:8ch;flex:none}.fov-v:empty::before{content:'–';opacity:.5}.fov-ctl{display:flex;flex-wrap:wrap;gap:6px}.fov-ctl .fov-btn{min-height:30px;padding:3px 10px}.fov-note{margin-top:4px;color:var(--mui-palette-text-secondary, #8b949e);font-size:12px;line-height:1.45}" +
    ".fov-chips{display:flex;flex-wrap:wrap;gap:4px;margin-top:4px}.fov-chip{padding:1px 8px;border-radius:999px;border:1px solid var(--mui-palette-divider, rgba(128,128,128,.4));background:transparent;color:inherit;font:inherit;font-size:11.5px;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;cursor:pointer}.fov-chip:hover,.fov-chip:focus-visible{border-color:var(--mui-palette-primary-main, #2aa);outline:none}" +
    ".fov-go{display:flex;gap:6px;align-items:center;margin-top:6px}.fov-go input{width:96px;min-height:28px;padding:2px 8px;border-radius:8px;border:1px solid var(--mui-palette-divider, rgba(128,128,128,.4));background:transparent;color:inherit;font:inherit;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:12px}" +
    ".fov-formula{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:12px;line-height:1.7}" +
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
        m: hc.length / 2, alarms: al.length / 2, firstHot: (function () { var o = []; for (var q = 1; q < hc.length && o.length < 8; q += 2) o.push(hc[q]); return o; })(), hotCh: new Uint32Array(hc), alarmRec: new Uint32Array(al),
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
    info: h("svg", { viewBox: "0 0 16 16", "aria-hidden": "true" }, h("circle", { cx: 8, cy: 8, r: 6.6, fill: "none", stroke: "currentColor", strokeWidth: 1.3 }), h("rect", { x: 7.3, y: 7, width: 1.4, height: 4.6, rx: .7, fill: "currentColor" }), h("circle", { cx: 8, cy: 4.9, r: .9, fill: "currentColor" })),
    chev: h("svg", { viewBox: "0 0 16 16", "aria-hidden": "true" }, h("path", { d: "M4 6l4 4 4-4", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round" })),
    panel: h("svg", { viewBox: "0 0 16 16", "aria-hidden": "true" }, h("rect", { x: 1.8, y: 2.8, width: 12.4, height: 10.4, rx: 1.6, fill: "none", stroke: "currentColor", strokeWidth: 1.3 }), h("path", { d: "M10 3v10", stroke: "currentColor", strokeWidth: 1.3 })),
    prev: h("svg", { viewBox: "0 0 16 16", "aria-hidden": "true" }, h("path", { d: "M10 3.5L5.5 8 10 12.5", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round" })),
    next: h("svg", { viewBox: "0 0 16 16", "aria-hidden": "true" }, h("path", { d: "M6 3.5L10.5 8 6 12.5", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round" })),
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
  var F = .84;
  // [key, title, kernel path the section reads (for Explain), open by default]
  var PANEL_SECTIONS = [["controls", "Controls", null, true], ["write", "This write", "master.factor", true], ["timing", "Timing", null, true],
    ["stress", "Stress", null, false], ["model", "Model", null, false], ["selected", "Selected dependent", null, true]];
  var PANEL_KEY = "fanout-viz.panel";
  function loadPanel() { var d = { open: !(root.matchMedia && root.matchMedia(SMALL_Q).matches), sec: {} }; PANEL_SECTIONS.forEach(function (x) { d.sec[x[0]] = x[3]; });
    try { var v = JSON.parse(root.localStorage.getItem(PANEL_KEY) || "null"); if (v && typeof v === "object") { if (typeof v.open === "boolean") d.open = v.open; for (var k in v.sec) if (k in d.sec) d.sec[k] = !!v.sec[k]; } } catch (e) {}
    return d; }
  function savePanel(v) { try { root.localStorage.setItem(PANEL_KEY, JSON.stringify(v)); } catch (e) {} }   // line reach in disc-radius units (42% of the canvas / 50%)

  // info popover: the .GUI Tooltip (MUI) on a small button; memoized, so a wave's re-render skips it
  var InfoTip = React.memo(function InfoTip(p) {
    var GA = (root.GUI && root.GUI.Atoms) || {};
    var btn = h("button", { type: "button", className: "fov-info", "aria-label": p.label || "More information", "data-gui-inspector-control": "true" }, ICON.info);
    return GA.Tooltip ? h(GA.Tooltip, { title: p.tip, arrow: true, size: "sm", enterTouchDelay: 0, leaveTouchDelay: 6000, describeChild: true, placement: "top" }, btn) : h("span", { title: p.tip }, btn);
  });
  function FanoutViz(props) {
    var rootId = props["data-gui-node-id"] || "fanout-viz", depId = rootId + "/dependent";
    var wrapRef = useRef(null), vizColRef = useRef(null), hlRef = useRef(null), hl2Ref = useRef(null), panelRef = useRef(null), discRef = useRef(null), rotRef = useRef(null), baseRef = useRef(null), waveRef = useRef(null), dotsRef = useRef(null), overRef = useRef(null), hitRef = useRef(null), markRef = useRef(null), markGRef = useRef(null), kRef = useRef(null);
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
    var ctl = useRef({ paused: paused, optIn: false, selDep: 0, redraw: null, geo: null, flags: null, rot: 0 });
    ctl.current.paused = paused;
    if (!WEDGES) { WEDGES = []; for (var w0 = 0; w0 < SLICES; w0++) WEDGES.push(wedge(w0)); }
    var N = lst.n || lst.target || 10000;
    var selDep = sel.kind === "dep" ? sel.i : sel.kind === "slice" ? depOf(sel.s, N) : 0;
    ctl.current.selDep = selDep;
    var sliceId = function (s) { return rootId + "/slice-" + String(s).padStart(3, "0"); };

    // React re-renders only on structural changes (phase, size, first wave, a reset…); the per-write numbers are written
    // straight into the panel's DOM by the painter below, so a stress run does not re-render the dashboard
    var structKey = function (s) { return [s.phase, s.n, s.target, s.error, s.resets, s.wave ? 1 : 0, s.stress ? 1 : 0, s.phase === "building" ? Math.round(s.progress * 20) : 0].join("|"); };
    useEffect(function () { var key = structKey(live.state()); return live.subscribe(function (s) { var k = structKey(s); if (k !== key) { key = k; setLst(Object.assign({}, s)); } }); }, []);

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
      // the dashboard panel and its sections are .GUI parts too (Grid and Inspector see them)
      var pr = rec("panel", "FanoutViz.Panel", { semanticPath: "master.factor", source: SRC, note: "Control panel: reads the same worker kernel as the figure." }, { sections: PANEL_SECTIONS.map(function (x) { return x[0]; }) });
      recs.push(pr);
      PANEL_SECTIONS.forEach(function (x) { var r = rec("panel-" + x[0], "FanoutViz.Panel.Section", x[2] ? { semanticPath: x[2], source: SRC, note: x[1] } : { source: SRC, note: x[1] }, { section: x[1] }); r.parentId = pr.id; recs.push(r); });
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
    // the panel painter: stat values → textContent of [data-v] nodes, at most ~4×/s (setTimeout + rAF), only for
    // nodes that exist (collapsed sections and a closed panel render none) and only while the panel is on screen
    var painter = useRef(null), selP = useRef({ i: 0, p: null, err: null, w: -1 });
    useEffect(function () {
      var last = 0, timer = 0, raf = 0, onScreen = true, io = null, fetching = 0;
      var M = function (x) { return x == null ? "–" : x; };
      function values(s) {
        var w = s.wave, S = w && w.stats, t = s.stress, v = {};
        v.mini = w ? "k " + fmt(w.k) + " · " + ms(w.writeMs) : s.phase === "building" ? Math.round(s.progress * 100) + "%" : "";
        if (w) {
          v.wnum = "#" + S.nWrites; v.factor = w.from + " → " + w.factor; v.k = fmt(w.k); v.kparts = fmt(w.levels) + " level + " + fmt(w.hots) + " hot + " + fmt(w.alarms) + " alarm";
          v.changed = fmt(w.changed); v.m = fmt(w.m); v.alarms = fmt(w.alarms); v.skipped = fmt(w.levels - w.alarms);
          v.tsum = ms(w.writeMs); v.twrite = ms(w.writeMs); v.tpct = ms(S.p50) + " · " + ms(S.p95); v.twin = "last " + S.window; v.twave = ms(w.analysisMs); v.treplay = ms(w.writeMs);
          v.drift = S.drift != null ? (S.drift >= 0 ? "+" : "") + Math.round(S.drift * 100) + "%" : "–"; v.heap = fmt(S.heapMB) + " MB"; v.log = fmt(S.logMB) + " MB";
        }
        v.tbuild = ms(s.buildMs); v.resets = "×" + (s.resets || 0);
        v.ssum = s.phase === "stressing" ? "running" : t && t.writes ? fmt(t.writes) + " writes" : ""; v.swrites = fmt(t ? t.writes : 0); v.swps = (t ? t.wps : 0).toFixed(2);
        var sp = selP.current, P = sp.p, fl = (ctl.current.flags && ctl.current.flags[sp.i]) || 0;
        if (P) { v.sval = M(P.value); v.slim = M(P.limit); v.slevl = "level = value × " + P.factor; v.slev = typeof P.level === "number" ? String(+P.level.toFixed(4)) : String(P.level); v.shot = String(P.hot); v.salarm = String(P.alarm);
          v.slast = w ? "Last write: hot " + (fl & 1 ? "flipped" : "unchanged") + ", alarm " + (fl & 2 ? "recomputed" : "skipped (early cutoff)") + "." : ""; }
        else if (sp.err) v.slast = sp.err;
        return v;
      }
      function fetchSel(i, nW) {   // the selected dependent's live values, re-read once per write (only while its section is open)
        var tok = ++fetching; selP.current.w = nW;
        live.dependent(i).then(function (p) { if (tok !== fetching) return; selP.current = { i: i, p: p, err: null, w: nW, t: selP.current.t }; schedule(); },
          function (e) { if (tok !== fetching) return; selP.current = { i: i, p: null, err: e.message, w: nW }; schedule(); });
      }
      function paint() {
        raf = 0; var el = panelRef.current; if (!el) return; if (!onScreen) { stale = true; return; } stale = false; last = performance.now();
        var s = live.state(), w = s.wave, nW = w ? w.stats.nWrites * 1000 + (s.resets || 0) : -1, v = values(s);
        var nodes = el.querySelectorAll("[data-v]");
        for (var q = 0; q < nodes.length; q++) { var n = nodes[q], x = v[n.getAttribute("data-v")]; if (x != null && n.textContent !== x) n.textContent = x; }
        var chips = el.querySelectorAll("[data-chip]"), fh = (w && w.firstHot) || [];
        for (var c = 0; c < chips.length; c++) { var ch = chips[c], j = +ch.getAttribute("data-chip"), di = fh[j];
          if (di) { var t = "dep." + di; if (ch.textContent !== t) { ch.textContent = t; ch.setAttribute("data-i", di); ch.setAttribute("aria-label", "Select " + t + " (its hot flipped)"); } if (ch.hidden) ch.hidden = false; } else if (!ch.hidden) ch.hidden = true; }
        var si = ctl.current.selDep;
        if (si && el.querySelector("[data-v=sval]") && (selP.current.i !== si || (selP.current.w !== nW && performance.now() - (selP.current.t || 0) > 1000))) { selP.current.t = performance.now(); if (selP.current.i !== si) selP.current = { i: si, p: null, err: null, w: -1 }; fetchSel(si, nW); }
      }
      var stale = false;
      // ≤ 4 paints/s; ≤ 2/s while stress writes back to back (the numbers change every write anyway)
      function schedule() { if (timer || raf) return; var wait = Math.max(0, (live.state().phase === "stressing" ? 500 : 250) - (performance.now() - last)); timer = setTimeout(function () { timer = 0; raf = requestAnimationFrame(paint); }, wait); }
      painter.current = { schedule: schedule, now: function () { if (timer) { clearTimeout(timer); timer = 0; } if (!raf) raf = requestAnimationFrame(paint); } };
      var off = live.subscribe(schedule);
      if (root.IntersectionObserver && wrapRef.current) { io = new IntersectionObserver(function (es) { onScreen = es[0].isIntersecting; if (onScreen && stale) schedule(); }); io.observe(wrapRef.current); }
      return function () { off(); if (io) io.disconnect(); clearTimeout(timer); if (raf) cancelAnimationFrame(raf); painter.current = null; };
    }, []);
    useEffect(function () { if (painter.current) painter.current.now(); });   // after any render: fill nodes that just mounted
    useEffect(function () { if (ctl.current.redraw) ctl.current.redraw(); }, [selDep, N]);

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
      var wrap = wrapRef.current, hl = hlRef.current, hl2 = hl2Ref.current, base = baseRef.current, wave = waveRef.current, dots = dotsRef.current, over = overRef.current, rot = rotRef.current;
      var hctx = hl && hl.getContext("2d"), h2ctx = hl2 && hl2.getContext("2d"), bctx = base && base.getContext("2d"), wctx = wave && wave.getContext("2d"), dctx = dots && dots.getContext("2d"), ctx = over && over.getContext("2d");
      if (!wrap || !bctx || !wctx || !dctx || !ctx || !hctx || !h2ctx) return;
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
        var done = function (buf) { if (id !== job) return; depth = buf; depthW = Wd; colorize(); redrawDots(); drawHl(); frame(); };
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
        drawNewDots(); drawHl(); frame(); start();
      });
      // hover highlight from the panel: the last wave's hot and alarm sets are precomputed on two overlay canvases (in
      // idle time after each wave); hovering only toggles which overlay shows and dims the rest, no drawing
      var hlDirty = true, idle = 0;
      var ric = root.requestIdleCallback || function (f) { return setTimeout(f, 60); }, cic = root.cancelIdleCallback || clearTimeout;
      function buildHl() {
        hlDirty = false; [hctx, h2ctx].forEach(function (x) { x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, hl.width, hl.height); });
        if (!wv || !col) return;
        var Wd = hl.width, c = Wd / 2, f = Wd * .42, u = Wd / 800, r = col.dotR * 2.1 * u;
        var drawSet = function (x, arr, color, out) { x.setTransform(1, 0, 0, 1, c, c); x.beginPath(); x.fillStyle = color;
          for (var k = 1; k < arr.length; k += 2) { var i = arr[k] - 1, l = len[i] * f + out * u, px = cosA[i] * l, py = sinA[i] * l; x.moveTo(px + r, py); x.arc(px, py, r, 0, Math.PI * 2); }
          x.fill(); x.setTransform(1, 0, 0, 1, 0, 0); };
        drawSet(hctx, wv.hotCh, col.gold, 0); drawSet(h2ctx, wv.alarmRec, col.pink, 5.5);
      }
      function drawHl() { hlDirty = true; cic(idle); if (C.hlKind === "hot" || C.hlKind === "alarm" || C.hlKind === "changed") buildHl(); else idle = ric(function () { idle = 0; if (hlDirty) buildHl(); }); showHl(); }
      function showHl() {
        var kind = C.hlKind, on = !!(kind && wv && col);
        if (on && hlDirty && kind !== "lines") buildHl();
        hl.style.visibility = on && (kind === "hot" || kind === "changed") ? "visible" : "hidden"; hl2.style.visibility = on && (kind === "alarm" || kind === "changed") ? "visible" : "hidden";
        dots.style.opacity = on && kind !== "changed" ? ".15" : ""; wave.style.opacity = on && kind !== "lines" && kind !== "changed" ? ".45" : "";
      }
      C.highlight = function (kind) { if (C.hlKind === kind) return; C.hlKind = kind; showHl(); };
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
        var host = vizColRef.current || wrap, w = Math.floor(Math.min(520, host.clientWidth - 2)); if (w < 120) return false;
        var d = Math.min(2, root.devicePixelRatio || 1), changed = readColors();
        if (w === size && d === dpr) { if (changed) { colorize(); redrawDots(); drawHl(); } return changed; }
        size = w; dpr = d; var px = Math.round(w * d);
        [dots, hl, hl2, over].forEach(function (cv) { cv.width = cv.height = px; });
        [base, wave, dots, hl, hl2, over].forEach(function (cv) { cv.style.width = cv.style.height = w + "px"; });
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
      var ro = root.ResizeObserver ? new ResizeObserver(redraw) : null; if (ro) { ro.observe(wrap); if (vizColRef.current) ro.observe(vizColRef.current); }
      var io = root.IntersectionObserver ? new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) start(); }, { threshold: .1 }) : null; if (io) io.observe(wrap);
      var mo = new MutationObserver(function () { if (readColors()) { colorize(); redrawDots(); drawHl(); frame(); } });
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
      return function () { disc.removeEventListener("pointerdown", onDown); disc.removeEventListener("pointermove", onMove); offWave(); cic(idle); C.redraw = null; C.highlight = null; job++; if (worker) worker.terminate(); clearTimeout(rto); if (raf) cancelAnimationFrame(raf); if (ro) ro.disconnect(); if (io) io.disconnect(); mo.disconnect(); document.removeEventListener("visibilitychange", onVis); if (reduce.removeEventListener) reduce.removeEventListener("change", onRm); };
    }, [N]);
    var C = ctl.current, GA = (root.GUI && root.GUI.Atoms) || {};
    var togglePause = function () {
      var next = !paused; C.paused = next; if (!next) C.optIn = true;   // play under reduced motion = the reader's opt-in
      try { root.localStorage.setItem(PAUSE_KEY, next ? "1" : "0"); } catch (e) {}
      setPaused(next); if (C.redraw) C.redraw();
    };
    var onHit = function (e) {
      var g = e.target && e.target.closest && e.target.closest("[data-gui-node-id]"); if (!g || !hitRef.current || !hitRef.current.contains(g)) return;
      var store = nodeStore(), id = g.getAttribute("data-gui-node-id");
      if (store) store.actions.selectNode(id === depId || store.getState().selectedNodeId !== id ? id : null);
    };
    var moveMarker = function (i) { var m = markRef.current; if (m && C.geo) { var p = C.geo.point(i); m.setAttribute("cx", p[0].toFixed(4)); m.setAttribute("cy", p[1].toFixed(4)); m.removeAttribute("data-armed"); } };
    var goDep = function (i) { i = ((i - 1) % N + N) % N + 1; selectDep(i, true); moveMarker(i); };
    var onKey = function (e) {
      var step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1, PageDown: 100, PageUp: -100 }[e.key];
      if (e.key === "Home") { e.preventDefault(); goDep(1); return; }
      if (e.key === "End") { e.preventDefault(); goDep(N); return; }
      if (!step) return; e.preventDefault(); goDep((selDep || 1) + step * (e.shiftKey ? 10 : 1));
    };
    // the panel's state (open, sections) survives reloads
    var pv = useState(loadPanel), panel = pv[0], setPanel = pv[1];
    var updPanel = function (fn) { setPanel(function (p) { var n = { open: p.open, sec: Object.assign({}, p.sec) }; fn(n); savePanel(n); return n; }); };
    var uid = useRef("fov" + Math.random().toString(36).slice(2, 7)).current;
    var hl = function (kind, extra) {   // hovering / focusing a stat highlights its set on the figure
      var on = function () { if (C.highlight) C.highlight(kind); }, off = function () { if (C.highlight) C.highlight(null); };
      return Object.assign({ className: "fov-row hl", tabIndex: 0, onMouseEnter: on, onMouseLeave: off, onFocus: on, onBlur: off, "data-fov-hl": kind }, extra || {});
    };
    useEffect(function () { return function () { if (C.highlight) C.highlight(null); }; }, []);
    var explainDep = function () {   // open the .GUI Inspector on the selected dependent and run its Explain
      var store = nodeStore(), i = selDep; if (!store || !i) return;
      store.actions.registerNode(depRecord(i, N)); store.actions.setInspectorEnabled(true); store.actions.selectNode(depId);
      var tries = 0, t = setInterval(function () {
        var aside = document.querySelector('aside[data-gui-inspector-control="true"]'), b = aside && [].find.call(aside.querySelectorAll("button"), function (x) { return /^explain$/i.test(x.textContent.trim()); });
        if (b) { clearInterval(t); b.click(); } else if (++tries > 30) clearInterval(t);
      }, 100);
    };
    var busy = lst.phase === "building" || lst.phase === "writing", stressing = lst.phase === "stressing";
    var pick = function (n) { if (busy || stressing || (lst.n === n && lst.phase !== "error")) return; live.build(n).then(function () { return live.write(); }).catch(function () {}); };
    var Wv = lst.wave;   // structural only: whether a wave exists; its numbers are painted into [data-v] nodes
    var num = function (x, k) { return h("span", { className: "fov-num", key: k }, x); };
    var V = function (key) { return h("span", { className: "fov-num fov-v", "data-v": key }); };   // React never owns its text
    var Info = function (tip, label, k) { return h(InfoTip, { key: k, tip: tip, label: label }); };
    var Btn = function (o, icon, text) {   // .GUI Button (MUI) when available; same look as the native fallback
      var active = !!o.active, p = Object.assign({ type: "button", "data-gui-inspector-control": "true" }, o); delete p.active; o = { active: active };
      if (GA.Button) return h(GA.Button, Object.assign(p, { variant: "outlined", size: "small", startIcon: icon, color: o.active ? "primary" : "inherit",
        sx: { textTransform: "none", minHeight: 30, py: .25, px: 1.25, borderRadius: "8px", fontSize: 13, lineHeight: 1.2, borderColor: o.active ? undefined : "divider", bgcolor: o.active ? "action.selected" : undefined, "& .MuiButton-startIcon svg": { width: 14, height: 14 } } }), text);
      return h("button", Object.assign(p, { className: "fov-btn" }), icon, text);
    };
    var row = function (label, vkey, props, k) { return h("div", Object.assign({ key: k }, props || { className: "fov-row" }), h("span", null, label), V(vkey)); };
    var sw = function (c) { return h("span", { className: "fov-dot", style: { background: "var(--fov-" + c + ")", margin: "0 6px 0 0" } }); };
    var section = function (key, title, sumKey, body) {
      var open = panel.sec[key], bid = uid + "-" + key;
      return h("section", { className: "fov-sec", key: key, "data-gui-node-id": rootId + "/panel-" + key, "data-gui-component": "FanoutViz.Panel.Section", "data-fov-sec": key },
        h("button", { type: "button", className: "fov-shead", "aria-expanded": open ? "true" : "false", "aria-controls": bid, "data-gui-inspector-control": "true", onClick: function () { updPanel(function (p) { p.sec[key] = !p.sec[key]; }); } },
          h("span", null, title), typeof sumKey === "string" && sumKey.charAt(0) === "=" ? h("small", null, sumKey.slice(1)) : sumKey ? h("small", { "data-v": sumKey }) : null,
          h("span", { className: "fov-chev" + (open ? " up" : ""), style: { flex: "none", display: "inline-flex" } }, ICON.chev)),
        open ? h("div", { className: "fov-sbody", id: bid }, body) : null);
    };
    var statusLine = lst.phase === "building" ? h("div", { className: "fov-note" }, h("span", { className: "fov-busy", "aria-hidden": "true" }), "Building ", num(fmt(lst.target)), " dependents in the worker… ", num(Math.round(lst.progress * 100) + "%"))
      : lst.phase === "error" ? h("div", { className: "fov-note fov-warn" }, "Live kernel unavailable: " + lst.error)
      : lst.phase === "idle" ? h("div", { className: "fov-note" }, "Starting the live kernel…")
      : lst.phase === "writing" ? h("div", { className: "fov-note" }, h("span", { className: "fov-busy", "aria-hidden": "true" }), "Writing master.factor…")
      : stressing ? h("div", { className: "fov-note" }, h("span", { className: "fov-busy", "aria-hidden": "true" }), "Stress: writing back to back in the worker.") : null;
    var onChip = function (e) { var i = +e.currentTarget.getAttribute("data-i"); if (i) goDep(i); };
    var chipsEl = function () { var a = []; for (var j = 0; j < 8; j++) a.push(h("button", { type: "button", key: j, className: "fov-chip", "data-chip": j, hidden: true, onClick: onChip }));
      return h("div", { className: "fov-chips", "data-gui-inspector-control": "true" }, a); };
    var TIP = {
      replay: "The sweep replays the kernel's real recompute order (explain().meta.recomputed: every level in index order, then every hot, then the alarms) over the write's measured duration (see Timing), at an even pace inside the write. this.me 4.2.1 has no progress hook, so it is a replay of the real order, not a live stream.",
      lines: "Dependent i sits at angle i/N (N = " + fmt(N) + "). Each one has two facts (value, limit) and three derived values; its line lights up when the replay reaches its level.",
      cutoff: "Gold: hot = level > limit flipped in this write. Pink: alarm = hot == true recomputed, only behind those flips. Every other alarm is skipped (early cutoff): its input did not change.",
      k: "Every derived value the write recomputed: all levels and hots (they read master.factor), plus the alarms behind a hot that changed.",
      changed: "Recomputed values whose value really changed (all levels, the flipped hots and their alarms).",
      heap: "A worker's heap is not readable by the page: estimated as N × 6.1 KB + log entries × 225 B (calibrated on V8).",
      guard: "Stress resets the kernel when the estimated heap passes ~300 MB (for a 100k kernel, already larger when built: when the log alone does). Every write appends to the kernel's log, so sustained writes drift slower; the reset starts a fresh kernel.",
      drift: "p50 of the last 10 writes vs the first 10 since this kernel was built (shown after 20 writes).",
      pct: "Over the last 20 writes of this kernel.",
    };
    var sizeBtns = h("span", { className: "fov-ctl", role: "group", "aria-label": "Live kernel size" },
      Btn({ "aria-pressed": lst.target === 10000 ? "true" : "false", active: lst.target === 10000, disabled: busy || stressing, "data-fov": "n10k", onClick: function () { pick(10000); } }, null, "10k"),
      small ? null : Btn({ "aria-pressed": lst.target === 100000 ? "true" : "false", active: lst.target === 100000, disabled: busy || stressing, "data-fov": "n100k", title: "Builds 100,000 dependents (300,000 derived values) in the worker: about 10–20 s, then several seconds per write", onClick: function () { pick(100000); } }, null, "100k · slow"));
    var pauseBtn = Btn({ "aria-label": paused ? "Play the animation" : "Pause the animation", "data-fov": "pause", onClick: togglePause }, paused ? ICON.play : ICON.pause, paused ? "Play" : "Pause");
    var writeBtn = Btn({ disabled: busy || stressing || lst.phase === "error" || !lst.n, "data-fov": "write", onClick: function () { live.write().catch(function () {}); } }, ICON.write, "Write");
    var stressBtn = Btn({ disabled: busy || lst.phase === "error" || !lst.n, active: stressing, "data-fov": "stress", "aria-pressed": stressing ? "true" : "false", onClick: function () { (stressing ? live.stop() : live.stress()).catch(function () {}); } }, stressing ? ICON.stop : ICON.stress, stressing ? "Stop" : "Stress");
    var selBody = !selDep ? [h("div", { key: 0, className: "fov-note" }, "Click a line, use ←/→ on the figure, or pick a dependent whose hot flipped:"), h("div", { key: 1 }, chipsEl())]
      : [h("div", { key: "h", className: "fov-row" }, h("b", { "data-fov": "sel-name" }, "dep." + selDep)),
        row("value", "sval", null, "v"), row("limit", "slim", null, "l"), h("div", { key: "lv", className: "fov-row" }, h("span", { "data-v": "slevl" }), V("slev")),
        row(h("span", null, sw("gold"), "hot = level > limit"), "shot", null, "ho"), row(h("span", null, sw("pink"), "alarm = hot == true"), "salarm", null, "al"),
        h("div", { key: "w", className: "fov-note", "data-v": "slast" }),
        h("div", { key: "c", className: "fov-ctl", style: { marginTop: 8 } },
          Btn({ "aria-label": "Previous dependent", "data-fov": "prev", onClick: function () { goDep(selDep - 1); } }, ICON.prev, null),
          Btn({ "aria-label": "Next dependent", "data-fov": "next", onClick: function () { goDep(selDep + 1); } }, ICON.next, null),
          Btn({ "data-fov": "explain", onClick: explainDep, title: "Open the .GUI Inspector on dep." + selDep + ".hot and run explain() in the worker" }, null, "Explain in Inspector"))];
    var goBox = h("form", { className: "fov-go", "data-gui-inspector-control": "true", onSubmit: function (e) { e.preventDefault(); var v = parseInt(e.target.elements[0].value, 10); if (v >= 1 && v <= N) goDep(v); } },
      h("label", { htmlFor: uid + "-go", className: "fov-note", style: { margin: 0 } }, "Go to dep."), h("input", { id: uid + "-go", type: "number", min: 1, max: N, inputMode: "numeric", placeholder: "1–" + fmt(N), "data-fov": "go" }),
      Btn({ type: "submit" }, null, "Select"));
    var noWave = h("div", { className: "fov-note" }, "No write yet.");
    var panelEl = h("aside", { className: "fov-panel", ref: panelRef, "data-gui-node-id": rootId + "/panel", "data-gui-component": "FanoutViz.Panel", "aria-label": "Live kernel panel", "data-fov": "panel", "data-open": panel.open ? "true" : "false" },
      h("div", { className: "fov-phead" },
        h("div", { className: "fov-ptitle" }, GA.Chip ? h(GA.Chip, { label: "LIVE", size: "small", color: "success", variant: "outlined", sx: { height: 20, fontSize: 10.5, fontWeight: 700, letterSpacing: ".05em" } }) : h("span", { className: "fov-tag live", style: { margin: 0 } }, "live"),
          h("span", null, "Live kernel"), h("span", { className: "fov-pmini", "data-v": "mini" })),
        h("button", { type: "button", className: "fov-ibtn", "aria-label": paused ? "Play the animation" : "Pause the animation", "data-gui-inspector-control": "true", "data-fov": "pause-mini", onClick: togglePause }, paused ? ICON.play : ICON.pause),
        h("button", { type: "button", className: "fov-ibtn", "aria-label": "Write master.factor", disabled: busy || stressing || lst.phase === "error" || !lst.n, "data-gui-inspector-control": "true", "data-fov": "write-mini", onClick: function () { live.write().catch(function () {}); } }, ICON.write),
        h("button", { type: "button", className: "fov-ibtn", "aria-label": panel.open ? "Close the panel" : "Open the panel", "aria-expanded": panel.open ? "true" : "false", "aria-controls": uid + "-body", "data-gui-inspector-control": "true", "data-fov": "panel-toggle",
          onClick: function () { updPanel(function (p) { p.open = !p.open; }); } }, h("span", { className: "fov-chev" + (panel.open ? " up" : ""), style: { display: "inline-flex" } }, ICON.chev))),
      panel.open ? h("div", { id: uid + "-body", "aria-busy": busy || stressing ? "true" : "false", "data-fov": "status" },
        section("controls", "Controls", null, [h("div", { key: 0, className: "fov-ctl" }, pauseBtn, writeBtn, stressBtn), h("div", { key: 1, style: { marginTop: 6 } }, sizeBtns), h("div", { key: 2, role: "status", "aria-live": "polite" }, statusLine)]),
        section("write", "This write", Wv ? "wnum" : null, !Wv ? noWave : [
          row("master.factor", "factor", null, 0),
          row(h("span", null, "k recomputed", Info(TIP.k, "About k", "i")), "k", hl("lines"), 1),
          h("div", { key: 2, className: "fov-note", style: { marginTop: 0, textAlign: "right" }, "data-v": "kparts" }),
          row(h("span", null, "changed", Info(TIP.changed, "About changed", "i")), "changed", hl("changed"), 3),
          row(h("span", null, sw("gold"), "m · hot flipped"), "m", hl("hot"), 4),
          row(h("span", null, sw("pink"), "alarms recomputed"), "alarms", hl("alarm"), 5),
          row(h("span", null, "alarms skipped", Info(TIP.cutoff, "About early cutoff", "i")), "skipped", null, 6),
          h("div", { key: 7, className: "fov-note" }, "Flipped, e.g.:"), h("div", { key: 8 }, chipsEl())]),
        section("timing", "Timing", Wv ? "tsum" : null, !Wv ? noWave : [
          row("this write", "twrite", null, 0), row(h("span", null, "p50 · p95", Info(TIP.pct, "About p50 and p95", "i")), "tpct", null, 1),
          row("window", "twin", null, 2), row("reading the wave", "twave", null, 3), row("built " + fmt(lst.n || N) + " in", "tbuild", null, 4),
          row(h("span", null, "replay", Info(TIP.replay, "About the replay", "i")), "treplay", null, 5)]),
        section("stress", "Stress", "ssum", [
          h("div", { key: 0, className: "fov-ctl" }, stressBtn),
          row("writes", "swrites", null, 1), row("writes/s", "swps", null, 2),
          row(h("span", null, "drift", Info(TIP.drift, "About drift", "i")), "drift", null, 3),
          row(h("span", null, "heap ≈", Info(TIP.heap, "About the heap estimate", "i")), "heap", null, 4), row("log ≈", "log", null, 5),
          row(h("span", null, "kernel reset (log size)", Info(TIP.guard, "About the memory guard", "i")), "resets", null, 6),
          h("div", { key: 7, className: "fov-note", "data-fov": "stress-line" }, "Sustained writes slow down as the log grows; a reset starts a fresh kernel.")]),
        section("model", "Model", "=this.me 4.2.1", [
          h("div", { key: 0, className: "fov-formula" }, h("div", null, "dep.i.level = value * master.factor"), h("div", null, "dep.i.hot = level > limit"), h("div", null, "dep.i.alarm = hot == true")),
          h("div", { key: 1, className: "fov-note" }, "A real this.me 4.2.1 kernel in a Web Worker, N = " + fmt(N) + ". Each write moves master.factor a small seeded step.", Info(TIP.lines, "About the lines", "i"))]),
        section("selected", "Selected dependent", selDep ? "=dep." + selDep : null, [h("div", { key: 0 }, selBody), h("div", { key: 1 }, goBox)])) : null);
    var hitLayer = React.useMemo(function () {
      return h("svg", { className: "fov-hit", ref: hitRef, viewBox: "-1 -1 2 2", "aria-hidden": "true", onClick: onHit },
        WEDGES.map(function (d, s) { return h("g", { key: s, "data-gui-node-id": sliceId(s), "data-gui-component": "FanoutViz.Slice", className: sel.kind === "slice" && sel.s === s ? "on" : undefined },
          h("path", { d: d, vectorEffect: "non-scaling-stroke" })); }),
        h("g", { "data-gui-node-id": rootId + "/center", "data-gui-component": "FanoutViz.Center", className: sel.kind === "center" ? "on" : undefined }, h("circle", { cx: 0, cy: 0, r: .07, vectorEffect: "non-scaling-stroke" })),
        h("g", { ref: markGRef, "data-gui-node-id": depId, "data-gui-component": "FanoutViz.Dependent", className: sel.kind === "dep" ? "on" : undefined }, h("circle", { ref: markRef, className: "fov-mark", cx: 0, cy: 0, r: .03, vectorEffect: "non-scaling-stroke" })));
    }, [sel.kind, sel.s, rootId, N]);
    var label = "Live: " + fmt(N) + " real dependents of master.factor, one line each; gold dots are hot flags that changed in the last write, pink dots the alarms it recomputed.";
    return h("figure", { className: "fov", ref: wrapRef, "data-gui-node-id": props["data-gui-node-id"], style: { margin: "0 0 28px" } },
      h("div", { className: "fov-dash" },
        h("div", { className: "fov-vcol", ref: vizColRef },
          h("div", { className: "fov-disc", ref: discRef, tabIndex: 0, role: "group", "aria-label": label + " Click a line or use the arrow keys to select a dependent.", onKeyDown: onKey },
            h("div", { ref: rotRef, style: { position: "absolute", left: 0, top: 0, transformOrigin: "50% 50%", willChange: "transform" } },
              h("canvas", { ref: baseRef, "aria-hidden": "true" }), h("canvas", { ref: waveRef, "aria-hidden": "true" }), h("canvas", { ref: dotsRef, "aria-hidden": "true" }), h("canvas", { ref: hlRef, "aria-hidden": "true", style: { visibility: "hidden" } }), h("canvas", { ref: hl2Ref, "aria-hidden": "true", style: { visibility: "hidden" } }), h("canvas", { ref: overRef, "aria-hidden": "true" }), hitLayer)),
          h("div", { className: "fov-k", ref: kRef, "data-fov": "k" }, h("span", { "data-k": "" }, "k = –"), h("span", { className: "fov-tag rep" }, "replay"), Info(TIP.replay, "About the replay")),
          h("figcaption", { className: "fov-short" }, "Each line is a real dependent of master.factor.", Info(TIP.lines, "About the lines"), " ",
            h("span", { className: "fov-legend" }, h("span", { className: "fov-nw" }, sw("gold"), "hot flipped"), h("span", { className: "fov-nw" }, sw("pink"), "alarm recomputed"), Info(TIP.cutoff, "About the colours and early cutoff")))),
        panelEl));
  }
  root.FanoutViz = FanoutViz;
})(typeof window !== "undefined" ? window : this);
