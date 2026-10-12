/*! fanout-viz 2.0.1 · .me extreme fan-out, one write → N dependents · MIT · neurons.me
 * A radial canvas illustration ported from the "Fan-Out Extreme" section of
 * https://neurons-me.github.io/Inverted-Dependency-Indexing-Beautiful-Viz.html, with the same rendering parameters:
 * lines from the centre at angle i/N·2π ± 0.0075 rad, length 55–100% of a radius of 42% of the canvas, 0.5 px wide
 * (some 1 px), teal at 0.06 alpha (some brighter); a dot on the tip of one line in 18 (gold for one in 90), none inside
 * 30% of the radius; an orange centre with a pulsing halo; a faint guide circle.
 * Animation (1.2): a ping-pong pulse, the wave grows 0 → N and shrinks back N → 0 (eased, 2.6 s each way), with the
 * k counter following it and a gentle zoom (92% → 100%) synced to it, while the starburst turns slowly (90 s a turn).
 * Unboxed: transparent canvas on the page's own background, the k counter and caption under it.
 * The original draws 9,000 lines. Here every one of the N lines is drawn (default 100,000) and the picture keeps the
 * original's density: each line gets the alpha that makes N lines add up to the original's 9,000 at 0.06
 * (1 − 0.94^(9000/N) per line), and the same number of bright lines, wide lines and dots as the original.
 * - Rendering: 8-bit canvas blending cannot add 100,000 strokes of alpha ≈ 0.005 (they round away), so the lines are
 *   accumulated once in a float buffer (exact optical depth: alpha = 1 − Π(1 − aᵢ)) and written as one image. Each
 *   frame scales that image to the wave (a radial line grown to s·L is the full picture scaled by s about the centre)
 *   and draws the ~500 dots and the centre, so a frame costs the same at any N. It animates only while on screen and
 *   the tab is visible.
 * - prefers-reduced-motion: no animation, rotation or zoom; the finished picture is drawn once.
 * - Theme: background, text and divider come from the active .GUI theme (--mui-palette-*) and are re-read when the
 *   page's theme attributes change (only the colour pass is redone); teal/gold/orange are lifted on dark backgrounds.
 * - Size: square, as wide as its container up to 520 px (works at 390 px); device-pixel ratio capped at 2.
 * landing-gui.js renders <div class="fanout-viz" data-n="100000" data-caption="…"> as this component (FanoutViz).
 * The canvas is an illustration of the shape of the work (k = N), not a measurement.
 * 2.0 adds, around the same picture:
 * - .GUI parts: the figure is the FanoutViz node; its centre (master.factor) and 128 angular slices are registered as
 *   .GUI parts (FanoutViz.Center / FanoutViz.Slice), drawn as an SVG hit layer over the canvas that turns and zooms with
 *   it, so the Grid Layout outlines them and the Inspector selects them; each slice points (provenance.semanticPath) at
 *   one real dependent of the live kernel, dep.<i>.out. Selection goes both ways (Inspector → canvas highlight).
 * - Live mode: a real this.me 4.2.1 kernel in a Web Worker (CDN, SRI-checked) with N derived values
 *   dep.<i>.out = dep.<i>.value * master.factor (10,000 by default, 100,000 on request). "Write" does a real
 *   master.factor write there; k comes from explain().meta.k and the time from the worker's clock. Explain requests
 *   (also the Inspector's, through window.FanoutKernel) are answered in the worker and shortened there: the k-long
 *   recomputed / changed lists never cross to the page, only their counts and first three paths.
 * - Pause / play (remembered in localStorage; reduced motion starts paused with the full static picture).
 */
(function (root) {
  var React = root.React; if (!React) return;
  var h = React.createElement, useEffect = React.useEffect, useRef = React.useRef;
  // Unboxed: the canvas is transparent and sits on the page's own background; only the k counter and the caption.
  var CSS = ".fov{margin:0 0 28px}" +
    ".fov-disc{margin:0 auto;max-width:100%;border-radius:50%;overflow:hidden;contain:paint}" +
    ".fov-disc{position:relative}.fov canvas{display:block;position:absolute;left:0;top:0;background:transparent;will-change:transform;transform-origin:50% 50%}" +
    ".fov-k{margin-top:2px;text-align:center;font-variant-numeric:tabular-nums;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:12.5px;letter-spacing:.02em;color:var(--mui-palette-text-secondary, #8b949e)}" +
    ".fov-cap{margin-top:4px;text-align:center;font-size:13px;color:var(--mui-palette-text-secondary, #8b949e);line-height:1.5}" +
    ".fov-cap b{color:var(--mui-palette-text-primary, currentColor)}" +
    // hit layer (the .GUI parts): invisible until hovered, selected, or the Grid Layout is on
    ".fov svg.fov-hit{position:absolute;left:0;top:0;width:100%;height:100%;overflow:visible;pointer-events:none;will-change:transform;transform-origin:50% 50%}" +
    // an outline on an SVG <g> is drawn in viewBox units (here 1 unit ≈ half the disc), so the Grid / Inspector outlines
    // are replaced by strokes on the shapes themselves
    ".fov-hit [data-gui-node-id]{outline:none!important;box-shadow:none!important}" +
    ".fov-hit path,.fov-hit circle{fill:transparent;stroke:none;pointer-events:all;cursor:pointer}" +
    ".fov-hit path:hover,.fov-hit circle:hover{fill:color-mix(in srgb, var(--gui-inspector-accent, var(--mui-palette-primary-main, #2aa)) 12%, transparent)}" +
    ".fov-hit .on>path,.fov-hit .on>circle{fill:color-mix(in srgb, var(--gui-inspector-accent, var(--mui-palette-primary-main, #2aa)) 16%, transparent);stroke:var(--gui-inspector-accent, var(--mui-palette-primary-main, #2aa));stroke-width:1.5px}" +
    ".gui-grid-overlay-active .fov-hit path,.gui-grid-overlay-active .fov-hit circle{stroke:color-mix(in srgb, var(--gui-inspector-accent, #3b82f6) 55%, transparent);stroke-width:1px}" +
    // controls + live panel
    ".fov-bar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:center;margin-top:10px}" +
    ".fov-btn{display:inline-flex;align-items:center;gap:6px;min-height:32px;padding:4px 12px;border-radius:8px;border:1px solid var(--mui-palette-divider, rgba(128,128,128,.4));background:transparent;color:var(--mui-palette-text-primary, inherit);font:inherit;font-size:13px;line-height:1.2;cursor:pointer}" +
    ".fov-btn:hover:not(:disabled){background:color-mix(in srgb, currentColor 8%, transparent)}" +
    ".fov-btn:focus-visible{outline:2px solid var(--mui-palette-primary-main, #2aa);outline-offset:2px}" +
    ".fov-btn:disabled{opacity:.5;cursor:default}.fov-btn[aria-pressed=true].fov-seg{background:color-mix(in srgb, var(--mui-palette-primary-main, #2aa) 16%, transparent);border-color:var(--mui-palette-primary-main, #2aa)}" +
    ".fov-btn svg{width:14px;height:14px;flex:none}.fov-btn small{color:var(--mui-palette-text-secondary, #8b949e);font-size:11.5px}" +
    ".fov-seg-g{display:inline-flex;gap:0}.fov-seg-g .fov-btn:first-child{border-radius:8px 0 0 8px}.fov-seg-g .fov-btn:last-child{border-radius:0 8px 8px 0;margin-left:-1px}" +
    ".fov-live{margin:14px auto 0;max-width:620px;padding-top:12px;border-top:1px solid var(--mui-palette-divider, rgba(128,128,128,.3));text-align:center;font-size:13px;line-height:1.55;color:var(--mui-palette-text-secondary, #8b949e)}" +
    ".fov-tag{display:inline-block;margin:0 6px;line-height:1.5;padding:0 7px;border-radius:999px;font-size:11px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;border:1px solid currentColor}" +
    ".fov-nw{white-space:nowrap}.fov-tag.live{margin-left:0;color:var(--mui-palette-success-main, #2e9d6e)}.fov-k .fov-tag{color:var(--mui-palette-text-secondary, #8b949e);font-family:inherit}" +
    ".fov-num{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-variant-numeric:tabular-nums;color:var(--mui-palette-text-primary, inherit)}" +
    ".fov-out{margin-top:6px;min-height:1.55em}.fov-sel{margin-top:6px;font-size:12.5px;word-break:break-word}" +
    ".fov-busy{display:inline-block;width:10px;height:10px;margin-right:6px;border-radius:50%;border:2px solid currentColor;border-right-color:transparent;vertical-align:-1px;animation:fovspin .8s linear infinite}" +
    "@keyframes fovspin{to{transform:rotate(360deg)}}@media (prefers-reduced-motion: reduce){.fov-busy{animation:none;border-right-color:currentColor;opacity:.6}}";
  function injectCss() { if (document.getElementById("fov-css")) return; var s = document.createElement("style"); s.id = "fov-css"; s.textContent = CSS; document.head.appendChild(s); }
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  var fmt = function (n) { return Math.round(n).toLocaleString("en-US"); };
  // Self-contained (it is also the worker's source): same geometry as the main thread, from the same seed.
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
  var ORIG_N = 9000;
  var SLICES = 128;   // .GUI parts: one per angular slice (plus the centre)
  var ME_URL = "https://cdn.jsdelivr.net/npm/this.me@4.2.1/dist/me.umd.js", ME_SRI = "sha384-ElnWCZOb324gqFJ2M/Fxy4CZ6Si131WIbR54iYomzEbTloUDLfBzZ05qi1nZ7+4G";

  // ── live kernel: a real this.me in a Web Worker (all kernel work stays off the main thread) ──
  // Self-contained: it is the worker's source. Messages {id, op, …} → {id, ok, …}; progress {op:"progress"}.
  function KERNEL_WORKER() {
    var me = null, N = 0, factor = 1, ready = null;
    function load(url, sri) {
      if (!ready) ready = fetch(url, { integrity: sri, mode: "cors", credentials: "omit" }).then(function (r) { if (!r.ok) throw new Error("this.me: HTTP " + r.status); return r.text(); })
        .then(function (txt) { var u = URL.createObjectURL(new Blob([txt], { type: "text/javascript" })); importScripts(u); URL.revokeObjectURL(u); if (!self.Me || !self.Me.ME) throw new Error("this.me did not load"); });
      return ready;
    }
    var first = function (a) { return Array.isArray(a) ? a.slice(0, 6) : undefined; };
    var related = function (p, focus) { return p === focus || p.indexOf(focus + ".") === 0 || focus.indexOf(p + ".") === 0; };
    // the kernel's own inspect for a path (recomputeMode, scopes, memories), shortened here: only the memories that
    // touch the path or the paths its formula reads (what the Inspector filters to anyway), no index
    function shortInspect(path) {
      var req = { scheme: "me", namespace: "self", operation: "inspect", path: path, raw: "me://self:inspect/" + path, contextRaw: null };
      var ins = (typeof me.execute === "function" ? me.execute(req) : me.inspect()) || {}, ex = me.explain(path) || {};
      var focus = [path].concat(((ex.derivation && ex.derivation.inputs) || []).map(function (x) { return String(x.path || ""); }).filter(Boolean));
      var mem = Array.isArray(ins.memories) ? ins.memories : [], keep = mem.filter(function (m) { var p = String(m && m.path || ""); return p && focus.some(function (f) { return related(p, f); }); });
      var stale = ins.staleDerivations;
      return { path: path, value: ins.value, recomputeMode: ins.recomputeMode, secretScopes: ins.secretScopes, encryptedScopes: ins.encryptedScopes, noiseScopes: ins.noiseScopes,
        staleDerivations: Array.isArray(stale) ? stale.slice(0, 20) : stale, staleDerivationsCount: Array.isArray(stale) ? stale.length : undefined,
        memories: keep.slice(-200), memoriesTotal: mem.length,
        shortened: "memories filtered in the worker to this path and the paths it reads (" + keep.length + " of " + mem.length + "); index omitted" };
    }
    // the explain() payload, shortened here: the k-long recomputed / changed lists stay in the worker
    function shortExplain(path) {
      var t = performance.now(), ex = me.explain(path) || {}, ms = performance.now() - t, m = ex.meta || {}, d = ex.derivation;
      return { path: ex.path || path, value: ex.value, expr: ex.expr,
        derivation: d ? { expression: d.expression, inputs: (d.inputs || []).slice(0, 8) } : undefined,
        meta: { dependsOn: m.dependsOn, k: m.k, sourcePath: m.sourcePath, lastComputedAt: m.lastComputedAt, recomputedAt: m.recomputedAt,
          recomputedCount: Array.isArray(m.recomputed) ? m.recomputed.length : undefined, recomputedFirst: first(m.recomputed),
          changedCount: Array.isArray(m.changed) ? m.changed.length : undefined, changedFirst: first(m.changed),
          kernel: "this.me 4.2.1 · Web Worker · N = " + N, explainMs: +ms.toFixed(2),
          shortened: "recomputed / changed (k paths each) cross from the worker as counts + first 6 paths; the full lists are not sent to the page" } };
    }
    onmessage = function (e) {
      var q = e.data, reply = function (o) { o.id = q.id; o.ok = true; postMessage(o); }, fail = function (err) { postMessage({ id: q.id, ok: false, error: String(err && err.message || err) }); };
      load(q.url, q.sri).then(function () {
        if (q.op === "build") {
          var t = performance.now(), n = q.n | 0, step = Math.max(1000, Math.round(n / 20));
          me = null; me = new self.Me.ME(); N = 0; factor = 1; me.master.factor(1);
          for (var i = 1; i <= n; i++) { me.dep[i].value(i); me.dep[i]["="]("out", "value * master.factor"); if (i % step === 0) postMessage({ op: "progress", id: q.id, done: i, n: n }); }
          N = n; return reply({ n: n, buildMs: performance.now() - t });
        }
        if (!me) throw new Error("no kernel yet");
        if (q.op === "write") {
          factor = factor >= 9 ? 2 : factor + 1;
          var t0 = performance.now(); me.master.factor(factor); var writeMs = performance.now() - t0;
          var probe = "dep." + N + ".out", t1 = performance.now(), ex = me.explain(probe), explainMs = performance.now() - t1, m = (ex && ex.meta) || {};
          return reply({ n: N, factor: factor, writeMs: writeMs, explainMs: explainMs, k: m.k, recomputedCount: Array.isArray(m.recomputed) ? m.recomputed.length : undefined, probe: probe, probeValue: ex && ex.value });
        }
        if (q.op === "explain") return reply({ payload: shortExplain(q.path) });
        if (q.op === "inspect") return reply({ payload: shortInspect(q.path) });
        throw new Error("unknown op " + q.op);
      }).catch(fail);
    };
  }
  // One kernel per page, shared by the figure and the Inspector (window.FanoutKernel.explain).
  var live = (function () {
    var w = null, seq = 0, pending = {}, subs = [], st = { phase: "idle", n: 0, buildMs: null, last: null, error: null, progress: 0, target: 10000 }, building = null;
    var emit = function () { subs.forEach(function (f) { f(st); }); };
    var set = function (o) { for (var k in o) st[k] = o[k]; emit(); };
    function worker() {
      if (w) return w;
      var url = URL.createObjectURL(new Blob(["(" + KERNEL_WORKER + ")();"], { type: "text/javascript" })); w = new Worker(url); URL.revokeObjectURL(url);
      w.onmessage = function (e) { var d = e.data, p = pending[d.id]; if (d.op === "progress") { if (p && p.onProgress) p.onProgress(d); return; } if (!p) return; delete pending[d.id]; d.ok ? p.res(d) : p.rej(new Error(d.error)); };
      w.onerror = function (e) { set({ phase: "error", error: (e && e.message) || "worker error" }); };
      return w;
    }
    function call(op, args, onProgress) {
      return new Promise(function (res, rej) { var id = ++seq; pending[id] = { res: res, rej: rej, onProgress: onProgress }; var m = { id: id, op: op, url: ME_URL, sri: ME_SRI }; for (var k in args) m[k] = args[k]; worker().postMessage(m); });
    }
    function build(n) {
      if (building && st.target === n) return building;
      set({ phase: "building", target: n, progress: 0, error: null, last: null });
      var b = building = call("build", { n: n }, function (d) { if (building === b) set({ progress: d.done / d.n }); })
        .then(function (r) { if (building === b) set({ phase: "ready", n: r.n, buildMs: r.buildMs, progress: 1 }); return r; },
              function (err) { if (building === b) { set({ phase: "error", error: err.message }); building = null; } throw err; });
      return b;
    }
    // Page-side adapter for the .GUI Inspector, which reads meta.recomputed / meta.changed as arrays (their length is
    // the count, the first six are listed): rebuild them as sparse arrays of the real length holding only the first
    // paths the worker sent. Nothing else is materialised; toJSON keeps the Inspector's JSON view to a summary.
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
    var PATH_RE = /^(master\.factor|dep\.\d+\.(out|value))$/;
    function ensure() { return st.phase === "ready" || st.phase === "writing" ? Promise.resolve() : (building || build(st.target)); }
    return {
      state: function () { return st; },
      subscribe: function (f) { subs.push(f); return function () { subs = subs.filter(function (g) { return g !== f; }); }; },
      build: build,
      write: function () {
        return ensure().then(function () { set({ phase: "writing" }); var t = performance.now();
          return call("write", {}).then(function (r) { r.roundTripMs = performance.now() - t; set({ phase: "ready", last: r }); return r; },
            function (err) { set({ phase: "error", error: err.message }); throw err; }); });
      },
      explain: function (path) {
        path = String(path || "");
        if (!PATH_RE.test(path)) return Promise.resolve({ path: path, value: undefined, meta: { note: "not a path of the live fan-out kernel (master.factor, dep.<i>.value, dep.<i>.out)" } });
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
  // What the Inspector talks to (landing-gui.js mounts with { me: window.FanoutKernel } on pages with the viz):
  // explain() and execute(self:inspect) for its own paths, answered by the worker kernel and shortened there.
  root.FanoutKernel = { explain: live.explain, execute: live.execute, __live: live };
  var ICON = {
    pause: h("svg", { viewBox: "0 0 16 16", "aria-hidden": "true" }, h("rect", { x: 3.5, y: 2.5, width: 3, height: 11, rx: 1, fill: "currentColor" }), h("rect", { x: 9.5, y: 2.5, width: 3, height: 11, rx: 1, fill: "currentColor" })),
    play: h("svg", { viewBox: "0 0 16 16", "aria-hidden": "true" }, h("path", { d: "M4.5 2.6v10.8a.6.6 0 0 0 .9.5l8.6-5.4a.6.6 0 0 0 0-1L5.4 2.1a.6.6 0 0 0-.9.5z", fill: "currentColor" })),
    write: h("svg", { viewBox: "0 0 16 16", "aria-hidden": "true" }, h("circle", { cx: 8, cy: 8, r: 2.6, fill: "currentColor" }), h("path", { d: "M8 1v3M8 12v3M1 8h3M12 8h3M3 3l2 2M11 11l2 2M13 3l-2 2M5 11l-2 2", stroke: "currentColor", strokeWidth: 1.4, strokeLinecap: "round" })),
  };
  var PAUSE_KEY = "fanout-viz.paused";
  var ms = function (x) { return x == null ? "–" : x >= 100 ? fmt(x) + " ms" : x.toFixed(1) + " ms"; };
  // the wedge of slice s (angles s/S·2π … (s+1)/S·2π, like line i at i/N·2π), in a viewBox where the disc radius is 1
  // and the lines reach 0.84 (42% of the canvas); from 0.25 out (no dots inside 30% of the radius anyway)
  function wedge(s) {
    var a0 = s / SLICES * Math.PI * 2, a1 = (s + 1) / SLICES * Math.PI * 2, r0 = .25, r1 = .86, P = function (r, a) { return (r * Math.cos(a)).toFixed(4) + " " + (r * Math.sin(a)).toFixed(4); };
    return "M" + P(r0, a0) + "L" + P(r1, a0) + "A" + r1 + " " + r1 + " 0 0 1 " + P(r1, a1) + "L" + P(r0, a1) + "A" + r0 + " " + r0 + " 0 0 0 " + P(r0, a0) + "Z";
  }
  var WEDGES = null;
  function nodeStore() { return root["GUI-NODES-STORE"] || null; }
   // the original's line count; densities, bright/wide lines and dots are kept at its numbers

  function FanoutViz(props) {
    var N = Math.max(1, Math.min(200000, +props.n || 100000));
    var rootId = props["data-gui-node-id"] || "fanout-viz";
    var wrapRef = useRef(null), canvasRef = useRef(null), kRef = useRef(null), discRef = useRef(null), linesRef = useRef(null), hitRef = useRef(null);
    var reduceNow = !!(root.matchMedia && root.matchMedia("(prefers-reduced-motion: reduce)").matches);
    var useState = React.useState;
    var pausedInit = function () { if (reduceNow) return true; try { return root.localStorage.getItem(PAUSE_KEY) === "1"; } catch (e) { return false; } };
    var ps = useState(pausedInit), paused = ps[0], setPaused = ps[1];
    var ls = useState(live.state()), lst = ls[0], setLst = ls[1];
    var ss = useState(-1), sel = ss[0], setSel = ss[1];
    var xs = useState(null), selEx = xs[0], setSelEx = xs[1];
    // the animation reads these (refs, so toggling never re-runs the canvas effect)
    var ctl = useRef({ paused: paused, optIn: false, sel: -1, redraw: null });
    ctl.current.paused = paused; ctl.current.sel = sel;
    if (!WEDGES) { WEDGES = []; for (var w0 = 0; w0 < SLICES; w0++) WEDGES.push(wedge(w0)); }
    var kernelN = lst.n || lst.target || 10000;
    // slice s → the live kernel's dependent at the same angular position, and the drawn line there
    var depOf = function (s, n) { return Math.min(n, Math.floor((s + .5) / SLICES * n) + 1); };
    var lineOf = function (s) { return Math.min(N - 1, Math.round((s + .5) / SLICES * N)); };
    var sliceId = function (s) { return rootId + "/slice-" + String(s).padStart(3, "0"); };

    // live kernel state → React (rare: build / write / progress)
    useEffect(function () { var off = live.subscribe(function (s) { setLst(Object.assign({}, s)); }); return off; }, []);

    // .GUI parts: the centre and the 128 slices, registered under the figure's own node (provenance → real paths).
    // A kernel-size change re-registers in place (registerNode merges by id); they are removed only on unmount.
    var partIds = useRef(null);
    useEffect(function () { return function () { var store = nodeStore(); if (store && partIds.current) partIds.current.forEach(function (id) { store.actions.unregisterNode(id); }); partIds.current = null; }; }, [rootId]);
    useEffect(function () {
      var store = nodeStore(); if (!store || !store.actions) return;
      var rec = function (seg, type, prov, rp) { var id = rootId + "/" + seg;
        return { id: id, path: rootId + "." + seg, type: type, part: seg, parentId: rootId, provenance: prov, spec: { type: type, props: rp, provenance: prov }, resolvedProps: rp }; };
      var recs = [rec("center", "FanoutViz.Center", { semanticPath: "master.factor", source: "live kernel (this.me 4.2.1, Web Worker)", note: "The value written. Every dependent reads it." }, { role: "the write", path: "master.factor" })];
      for (var s = 0; s < SLICES; s++) {
        var a0 = s / SLICES * 360, dep = depOf(s, kernelN), l0 = Math.round(s / SLICES * N), l1 = Math.round((s + 1) / SLICES * N) - 1;
        recs.push(rec("slice-" + String(s).padStart(3, "0"), "FanoutViz.Slice", { semanticPath: "dep." + dep + ".out", source: "live kernel (this.me 4.2.1, Web Worker)",
          note: "Slice " + (s + 1) + " of " + SLICES + ": lines " + fmt(l0) + "–" + fmt(l1) + " of the " + fmt(N) + " drawn (illustration); sampled dependent dep." + dep + ".out of the live kernel (N = " + fmt(kernelN) + ")." },
          { slice: s + 1, of: SLICES, angle: a0.toFixed(1) + "°–" + (a0 + 360 / SLICES).toFixed(1) + "°", linesDrawn: fmt(l0) + "–" + fmt(l1), sampledPath: "dep." + dep + ".out", kernelN: kernelN }));
      }
      var first = !partIds.current, i = 0, raf = 0;
      partIds.current = recs.map(function (r) { return r.id; });
      if (first) { recs.forEach(function (r) { store.actions.registerNode(r); }); return; }
      // a kernel-size change while the pulse runs: update 16 parts per frame (each update copies the store and
      // notifies .GUI), so no single frame pays for all 129
      var step = function () { raf = 0; for (var j = 0; j < 16 && i < recs.length; j++, i++) store.actions.registerNode(recs[i]); if (i < recs.length) raf = requestAnimationFrame(step); };
      step();
      return function () { if (raf) { cancelAnimationFrame(raf); for (; i < recs.length; i++) store.actions.registerNode(recs[i]); } };
    }, [rootId, kernelN, N]);

    // selection both ways: store → canvas highlight + live readout; a click on a slice (Inspector off) → store
    useEffect(function () {
      var store = nodeStore(); if (!store) return;
      var last = null, pre = rootId + "/slice-";
      var sync = function () {
        var id = store.getState().selectedNodeId; if (id === last) return; last = id;
        setSel(id && id.indexOf(pre) === 0 ? +id.slice(pre.length) : id === rootId + "/center" ? -2 : -1);
      };
      sync(); return store.subscribe(sync);
    }, [rootId]);
    useEffect(function () {
      if (ctl.current.redraw) ctl.current.redraw();
      if (sel === -1) { setSelEx(null); return; }
      var path = sel === -2 ? "master.factor" : "dep." + depOf(sel, kernelN) + ".out", alive = true;
      setSelEx({ path: path, loading: true });
      live.explain(path).then(function (p) { if (alive) setSelEx({ path: path, p: p }); }, function (e) { if (alive) setSelEx({ path: path, error: e.message }); });
      return function () { alive = false; };
    }, [sel, kernelN, lst.last]);
    var onHit = function (e) {
      var g = e.target && e.target.closest && e.target.closest("[data-gui-node-id]"); if (!g) return;
      var store = nodeStore(), id = g.getAttribute("data-gui-node-id");
      if (store) store.actions.selectNode(store.getState().selectedNodeId === id ? null : id);
    };

    // build the default 10k kernel once the figure is on screen (in the worker; the page never waits on it)
    useEffect(function () {
      var el = wrapRef.current; if (!el) return;
      var go = function () { if (live.state().phase === "idle") live.build(10000).catch(function () {}); };
      if (!root.IntersectionObserver) { go(); return; }
      var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { go(); io.disconnect(); } }, { rootMargin: "200px" }); io.observe(el);
      return function () { io.disconnect(); };
    }, []);

    useEffect(function () {
      injectCss();
      var wrap = wrapRef.current, cv = canvasRef.current, ctx = cv && cv.getContext("2d");
      if (!wrap || !ctx) return;
      var reduce = root.matchMedia ? root.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
      var R = rng(20261011), ang = new Float64Array(N), len = new Float64Array(N);   // same sequence as RASTER
      for (var i = 0; i < N; i++) { ang[i] = i / N * Math.PI * 2 + (R() - .5) * .015; len[i] = .55 + R() * .45; }
      var cosA = new Float64Array(N), sinA = new Float64Array(N);
      for (var i2 = 0; i2 < N; i2++) { cosA[i2] = Math.cos(ang[i2]); sinA[i2] = Math.sin(ang[i2]); }
      var ratio = N / ORIG_N;
      var brightEvery = Math.max(1, Math.round(7 * ratio)), wideEvery = Math.max(1, Math.round(13 * ratio));
      var dotEvery = Math.max(1, Math.round(18 * ratio)), goldEvery = dotEvery * 5;
      // optical depth per line (−ln(1 − alpha)) × width: base lines carry the original's 0.06 spread over N lines
      var baseA = 1 - Math.pow(1 - .06, 1 / ratio);
      var dBase = -Math.log(1 - baseA), dBright = -Math.log(1 - .2) - (-Math.log(1 - .06));
      // Two stacked layers in a circular mask: `off` holds the 100,000 lines (painted once per size / theme), `cv` the dots,
      // centre and guide circle (repainted each frame, ~500 arcs). The wave, zoom and turn are compositor transforms:
      // lines layer rotate·scale(g·z) (a radial line grown to g·L is the bitmap scaled by g), dots layer rotate·scale(z).
      var off = linesRef.current, offCtx = off && off.getContext("2d"); if (!offCtx) return;
      var depth = null, depthW = 0, size = 0, dpr = 1, col = null, colKey = "", raf = 0, visible = true, T = 0, lastTs = 0, lastK = -1;
      var probe = document.createElement("canvas").getContext("2d");
      var norm = function (c, fb) { probe.fillStyle = fb; try { probe.fillStyle = c || fb; } catch (e) {} return probe.fillStyle; };
      var rgbOf = function (c) { var m = /^#([0-9a-f]{6})$/i.exec(c); if (m) { var v = parseInt(m[1], 16); return [v >> 16 & 255, v >> 8 & 255, v & 255]; } var r = /rgba?\(([^)]+)\)/.exec(c); return r ? r[1].split(",").slice(0, 3).map(Number) : [0, 0, 0]; };
      function readColors() {
        var cs = getComputedStyle(wrap);
        // the page's own background (the viz is unboxed), for the dark/light palette choice
        var bodyBg = getComputedStyle(document.body).backgroundColor, bg = norm(/rgba?\([^)]*,\s*0\)$|transparent/.test(bodyBg) ? cs.getPropertyValue("--mui-palette-background-default").trim() : bodyBg, "#111"), fg = norm(cs.getPropertyValue("--mui-palette-text-primary").trim(), "#eee");
        var key = bg + "|" + fg; if (key === colKey) return false; colKey = key;
        var c = rgbOf(bg), dark = (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) < 128, f = rgbOf(fg);
        // the original's palette (teal #0A7C6B, gold #E8B22E, coral #FF6B4A, guide ink at 0.06), lifted on dark backgrounds
        col = { dark: dark, teal: dark ? [38, 170, 148] : [4, 108, 92], gold: dark ? "#f0c04a" : "#e09f00",
          // light backgrounds wash thin lines out: deeper teal, more line density, firmer and slightly larger dots
          gain: dark ? .75 : 2.1, dotA: dark ? .55 : .85, dotR: dark ? 1.1 : 1.35, goldR: dark ? 2.2 : 2.6, coral: dark ? "#ff7b5c" : "#ff6b4a",
          guide: "rgba(" + f.join(",") + "," + (dark ? .1 : .06) + ")" };
        return true;
      }
      // The lines, accumulated in floating point: per line a DDA along its major axis, coverage split between the two
      // pixels across it (antialiased), weighted by optical depth × width. About 30M steps at 1040 px, so it runs in a
      // Web Worker (off the main thread; the dots and centre animate meanwhile) and falls back to running inline.
      // Done once per size; a theme change only recolours.
      var job = 0, worker = null;
      function rasterize() {
        var W = Math.round(size * dpr), id = ++job, args = [W, N, wideEvery, brightEvery, dBase, dBright];
        var done = function (buf) { if (id !== job) return; depth = buf; depthW = W; colorize(); frame();
          if (performance.measure) try { performance.measure("fanout-viz render", { start: t0 }); } catch (e) {} };
        var t0 = performance.now();
        if (!worker && root.Worker && root.Blob && root.URL) try {
          var src = "var R=" + rng + ";var raster=" + RASTER + ";onmessage=function(e){var d=raster.apply(null,[R].concat(e.data.a));postMessage({id:e.data.id,d:d},[d.buffer]);};";
          var url = URL.createObjectURL(new Blob([src], { type: "text/javascript" })); worker = new Worker(url); URL.revokeObjectURL(url);
          worker.onmessage = function (e) { if (e.data.id === job) done(e.data.d); };
          worker.onerror = function () { worker = false; done(RASTER.apply(null, [rng].concat(args))); };
        } catch (e) { worker = false; }
        if (worker) worker.postMessage({ id: id, a: args }); else done(RASTER.apply(null, [rng].concat(args)));
      }
      function colorize() {
        if (!depth) return;
        var W = depthW; off.width = off.height = W;
        // gain (col.gain): the line density. 1.35 matched the original side by side on light, but read too faint on the
        // page's own background once unboxed, so light uses 2.1; dark backgrounds glow, so less there.
        var img = offCtx.createImageData(W, W), px = img.data, tl = col.teal, gain = col.gain;
        for (var j = 0, n = W * W; j < n; j++) { var dd = depth[j]; if (dd <= 0) continue; var q = j * 4; px[q] = tl[0]; px[q + 1] = tl[1]; px[q + 2] = tl[2]; px[q + 3] = 255 * (1 - Math.exp(-dd * gain)); }
        offCtx.putImageData(img, 0, 0);
      }
      // The loop (seconds of animation time T): the wave grows 0 → N, holds, shrinks N → 0, holds (ping-pong), eased;
      // the zoom follows the same pulse (92% → 100%); the whole starburst turns slowly (one turn in 90 s). All of it is a
      // transform of the precomputed bitmap (see frame); dots and centre ride along. The picture is a disc of radius 42%
      // of the canvas inside a circular mask of radius 50%, so the turn never clips it nor shows the square's corners.
      var GROW = 2.6, HOLD_FULL = .8, HOLD_EMPTY = .5, PERIOD = 2 * GROW + HOLD_FULL + HOLD_EMPTY, TURN = 90;
      var ease = function (x) { return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
      function pulse(t) {
        var q = t % PERIOD;
        if (q < GROW) return ease(q / GROW);
        if (q < GROW + HOLD_FULL) return 1;
        if (q < 2 * GROW + HOLD_FULL) return 1 - ease((q - GROW - HOLD_FULL) / GROW);
        return 0;
      }
      // still = reduced motion and the reader has not pressed play: the full picture, no turn, no zoom.
      // Paused freezes T, so the frozen frame (and the hit layer, which shares its transform) stays put.
      var C = ctl.current, hit = hitRef.current;
      var isStill = function () { return reduce.matches && !C.optIn; };
      function frame() {
        var still = isStill(), g = still ? 1 : pulse(T), z = still ? 1 : .92 + .08 * g, rot = still ? 0 : T / TURN * Math.PI * 2;
        var W = cv.width, c = W / 2, f = W * .42, u = W / 800;
        ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, W, W);
        off.style.transform = still ? "" : "rotate(" + rot.toFixed(4) + "rad) scale(" + (g * z).toFixed(4) + ")";
        off.style.visibility = depth && depthW === W && g > 0 ? "visible" : "hidden";
        ctx.beginPath(); ctx.strokeStyle = col.guide; ctx.lineWidth = u; ctx.arc(c, c, f / z, 0, Math.PI * 2); ctx.stroke();   // stays put under the zoom
        cv.style.transform = still ? "" : "rotate(" + rot.toFixed(4) + "rad) scale(" + z.toFixed(4) + ")";
        if (hit) hit.style.transform = cv.style.transform;
        ctx.setTransform(1, 0, 0, 1, c, c);
        // the ~500 dots in two batched paths (teal, gold), one fill each
        for (var pass = 0; pass < 2; pass++) {
          var r = (pass ? col.goldR : col.dotR) * u; ctx.beginPath(); ctx.fillStyle = pass ? col.gold : "rgba(" + col.teal.join(",") + "," + col.dotA + ")";
          for (var i = 0; i < N; i += dotEvery) {
            if ((i % goldEvery === 0) !== (pass === 1)) continue;
            var l = len[i] * f * g; if (l < f * .3) continue;
            var x = cosA[i] * l, y = sinA[i] * l; ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, Math.PI * 2);
          }
          ctx.fill();
        }
        // the selected slice: its sampled dependent's line and dot, emphasised (the hit layer outlines the wedge)
        if (C.sel >= 0) {
          var li = Math.min(N - 1, Math.round((C.sel + .5) / SLICES * N)), ll = len[li] * f * g;
          ctx.beginPath(); ctx.strokeStyle = col.coral; ctx.globalAlpha = .9; ctx.lineWidth = 1.5 * u; ctx.moveTo(0, 0); ctx.lineTo(cosA[li] * ll, sinA[li] * ll); ctx.stroke();
          ctx.beginPath(); ctx.fillStyle = col.coral; ctx.arc(cosA[li] * ll, sinA[li] * ll, 4 * u, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
        }
        var p = still || C.paused ? 1 : 1 + Math.sin(T * 3.6) * .18;
        ctx.beginPath(); ctx.fillStyle = col.coral; ctx.arc(0, 0, 9 * u, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.strokeStyle = col.coral; ctx.globalAlpha = .28; ctx.lineWidth = 2.5 * u; ctx.arc(0, 0, 20 * u * p, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.fillStyle = "#fff"; ctx.globalAlpha = .7; ctx.arc(-2 * u, -2 * u, 2.2 * u, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        var k = Math.round(N * g);
        if (k !== lastK && kRef.current) { lastK = k; kRef.current.firstChild.textContent = "k = " + fmt(k) + " / " + fmt(N); }
      }
      function layout() {
        var w = Math.floor(Math.min(520, wrap.clientWidth - 2)); if (w < 120) return false;
        var d = Math.min(2, root.devicePixelRatio || 1), changed = readColors();
        if (w === size && d === dpr) { if (changed) colorize(); return changed; }
        size = w; dpr = d; cv.width = cv.height = Math.round(w * d); cv.style.width = cv.style.height = w + "px"; off.style.width = off.style.height = w + "px"; if (discRef.current) discRef.current.style.width = discRef.current.style.height = w + "px";
        rasterize(); return true;
      }
      var nFrames = 0;
      function loop(ts) {
        raf = 0; if (!visible || document.hidden || isStill() || C.paused) { lastTs = 0; return; }
        T += lastTs ? Math.min(.05, (ts - lastTs) / 1000) : 0; lastTs = ts;   // time-based; a paused tab resumes where it was
        if (++nFrames % 45 === 0 && readColors()) colorize();
        frame(); raf = requestAnimationFrame(loop);
      }
      function start() { if (isStill() || C.paused) { frame(); return; } if (!raf) raf = requestAnimationFrame(loop); }
      C.redraw = function () { if (raf) return; start(); };
      var rto = 0;
      function redraw() { clearTimeout(rto); rto = setTimeout(function () { if (layout() || isStill() || !raf) frame(); }, 120); }
      // starting paused (remembered from an earlier visit): freeze on the full picture, not the empty start of the pulse
      if (C.paused) T = GROW + HOLD_FULL / 2;
      layout(); frame(); start();
      var ro = root.ResizeObserver ? new ResizeObserver(redraw) : null; if (ro) ro.observe(wrap);
      var io = root.IntersectionObserver ? new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) start(); }, { threshold: .1 }) : null; if (io) io.observe(wrap);
      var mo = new MutationObserver(function () { if (readColors()) { colorize(); frame(); } });
      [document.documentElement, document.body].forEach(function (n) { mo.observe(n, { attributes: true }); });
      var onVis = function () { if (!document.hidden) start(); };
      document.addEventListener("visibilitychange", onVis);
      var onRm = function () { if (isStill()) { if (raf) cancelAnimationFrame(raf); raf = 0; lastTs = 0; frame(); } else start(); };
      if (reduce.addEventListener) reduce.addEventListener("change", onRm);
      return function () { C.redraw = null; job++; if (worker) worker.terminate(); clearTimeout(rto); if (raf) cancelAnimationFrame(raf); if (ro) ro.disconnect(); if (io) io.disconnect(); mo.disconnect(); document.removeEventListener("visibilitychange", onVis); if (reduce.removeEventListener) reduce.removeEventListener("change", onRm); };
    }, [N]);
    var togglePause = function () {
      var next = !paused; ctl.current.paused = next; if (!next) ctl.current.optIn = true;   // play under reduced motion = the reader's opt-in
      try { root.localStorage.setItem(PAUSE_KEY, next ? "1" : "0"); } catch (e) {}
      setPaused(next); if (ctl.current.redraw) ctl.current.redraw();
    };
    var busy = lst.phase === "building" || lst.phase === "writing";
    var pick = function (n) { if (busy || (lst.phase === "ready" && lst.n === n)) return; live.build(n).catch(function () {}); };
    var L = lst.last, label = "Illustration: one write at the centre spreads to " + fmt(N) + " dependents, one thin line each.";
    var status = lst.phase === "building" ? h("span", null, h("span", { className: "fov-busy", "aria-hidden": "true" }), "Building ", h("span", { className: "fov-num" }, fmt(lst.target)), " derived values in the worker… ", h("span", { className: "fov-num" }, Math.round(lst.progress * 100) + "%"))
      : lst.phase === "writing" ? h("span", null, h("span", { className: "fov-busy", "aria-hidden": "true" }), "Writing master.factor; ", h("span", { className: "fov-num" }, fmt(lst.n)), " dependents recomputing in the worker…")
      : lst.phase === "error" ? h("span", null, "Live kernel unavailable: " + lst.error)
      : lst.phase === "idle" ? h("span", null, "Starting the live kernel…")
      : L ? h("span", null, "master.factor = ", h("span", { className: "fov-num" }, L.factor), " → k = ", h("span", { className: "fov-num", "data-fov": "k" }, L.k == null ? "?" : fmt(L.k)), " (explain().meta.k) in ",
          h("span", { className: "fov-num", "data-fov": "write-ms" }, ms(L.writeMs)), " · explain ", h("span", { className: "fov-num" }, ms(L.explainMs)), " · built ", h("span", { className: "fov-num" }, fmt(lst.n)), " in ", h("span", { className: "fov-num", "data-fov": "build-ms" }, ms(lst.buildMs)))
      : h("span", null, "Ready: ", h("span", { className: "fov-num" }, fmt(lst.n)), " derived values built in ", h("span", { className: "fov-num", "data-fov": "build-ms" }, ms(lst.buildMs)), ". Press Write.");
    var selLine = null;
    if (selEx) {
      var P = selEx.p, m = P && P.meta || {}, ins = P && P.derivation && P.derivation.inputs || [];
      selLine = h("div", { className: "fov-sel", "aria-live": "polite" }, h("b", null, sel === -2 ? "Centre" : "Slice " + (sel + 1) + "/" + SLICES), " → ", h("span", { className: "fov-num" }, selEx.path),
        selEx.loading ? " …" : selEx.error ? " · " + selEx.error : [" = ", h("span", { key: "v", className: "fov-num" }, String(P.value)),
          ins.length ? " · reads " + ins.map(function (x) { return x.path + " = " + x.value; }).join(", ") : "",
          m.k != null ? " · last wave k = " + fmt(m.k) : "", " · open the Inspector for its explain()"]);
    }
    // the hit layer only re-renders when the selection changes (not on build progress / results)
    var hitLayer = React.useMemo(function () {
      return h("svg", { className: "fov-hit", ref: hitRef, viewBox: "-1 -1 2 2", "aria-hidden": "true", onClick: onHit },
        WEDGES.map(function (d, s) { return h("g", { key: s, "data-gui-node-id": sliceId(s), "data-gui-component": "FanoutViz.Slice", className: s === sel ? "on" : undefined },
          h("path", { d: d, vectorEffect: "non-scaling-stroke" })); }),
        h("g", { "data-gui-node-id": rootId + "/center", "data-gui-component": "FanoutViz.Center", className: sel === -2 ? "on" : undefined }, h("circle", { cx: 0, cy: 0, r: .07, vectorEffect: "non-scaling-stroke" })));
    }, [sel, rootId]);
    return h("figure", { className: "fov", ref: wrapRef, "data-gui-node-id": props["data-gui-node-id"], style: { margin: "0 0 28px" } },
      h("div", { className: "fov-disc", ref: discRef },
        h("canvas", { ref: linesRef, "aria-hidden": "true" }), h("canvas", { ref: canvasRef, role: "img", "aria-label": label }), hitLayer),
      h("div", { className: "fov-k", ref: kRef, "aria-hidden": "true" }, h("span", null, "k = 0 / " + fmt(N)), " ", h("span", { className: "fov-tag" }, "illustration")),
      h("figcaption", { className: "fov-cap" }, h("b", null, props.caption || "1 write → " + fmt(N) + " dependents"), " · the drawing shows the shape of the work, one line per derived value that reads the value written: all of them recompute, and nothing else does."),
      // data-gui-inspector-control: the Inspector's click-to-select lets these controls work while it is open
      h("div", { className: "fov-bar", "data-gui-inspector-control": "true" },
        h("button", { type: "button", className: "fov-btn", "aria-label": paused ? "Play the animation" : "Pause the animation", "data-fov": "pause", onClick: togglePause },
          paused ? ICON.play : ICON.pause, paused ? "Play" : "Pause")),
      h("div", { className: "fov-live", "aria-busy": busy ? "true" : "false", "data-gui-inspector-control": "true" },
        h("div", null, h("span", { className: "fov-tag live" }, "live"), "Measured on this device: a real this.me 4.2.1 kernel in a Web Worker, ",
          h("span", { className: "fov-num fov-nw" }, "dep.<i>.out = dep.<i>.value × master.factor"), " for N dependents."),
        h("div", { className: "fov-bar" },
          h("button", { type: "button", className: "fov-btn", disabled: busy || lst.phase === "error", "data-fov": "write", onClick: function () { live.write().catch(function () {}); } }, ICON.write, "Write master.factor"),
          h("span", { className: "fov-seg-g", role: "group", "aria-label": "Live kernel size" },
            h("button", { type: "button", className: "fov-btn fov-seg", "aria-pressed": lst.target === 10000 ? "true" : "false", disabled: busy, "data-fov": "n10k", onClick: function () { pick(10000); } }, "10k"),
            h("button", { type: "button", className: "fov-btn fov-seg", "aria-pressed": lst.target === 100000 ? "true" : "false", disabled: busy, "data-fov": "n100k", title: "Builds 100,000 derived values: takes a few seconds to build and a few to run, all in the background worker", onClick: function () { pick(100000); } }, "100k", h("small", null, "takes a few seconds")))),
        h("div", { className: "fov-out", role: "status", "aria-live": "polite", "data-fov": "status" }, status),
        selLine));
  }
  root.FanoutViz = FanoutViz;
})(typeof window !== "undefined" ? window : this);
