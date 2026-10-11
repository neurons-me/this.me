/*! fanout-viz 1.1.0 · .me extreme fan-out, one write → N dependents · MIT · neurons.me
 * A radial canvas illustration ported from the "Fan-Out Extreme" section of
 * https://neurons-me.github.io/Inverted-Dependency-Indexing-Beautiful-Viz.html, with the same rendering parameters:
 * lines from the centre at angle i/N·2π ± 0.0075 rad, length 55–100% of a radius of 42% of the canvas, 0.5 px wide
 * (some 1 px), teal at 0.06 alpha (some brighter); a dot on the tip of one line in 18 (gold for one in 90), none inside
 * 30% of the radius; an orange centre with a pulsing halo; a faint guide circle; the lines grow outward 0 → 100% and
 * hold (+1.2% per frame, restart at 135%).
 * The original draws 9,000 lines. Here every one of the N lines is drawn (default 100,000) and the picture keeps the
 * original's density: each line gets the alpha that makes N lines add up to the original's 9,000 at 0.06
 * (1 − 0.94^(9000/N) per line), and the same number of bright lines, wide lines and dots as the original.
 * - Rendering: 8-bit canvas blending cannot add 100,000 strokes of alpha ≈ 0.005 (they round away), so the lines are
 *   accumulated once in a float buffer (exact optical depth: alpha = 1 − Π(1 − aᵢ)) and written as one image. Each
 *   frame scales that image to the wave (a radial line grown to s·L is the full picture scaled by s about the centre)
 *   and draws the ~500 dots and the centre, so a frame costs the same at any N. It animates only while on screen and
 *   the tab is visible.
 * - prefers-reduced-motion: no animation; the finished picture is drawn once.
 * - Theme: background, text and divider come from the active .GUI theme (--mui-palette-*) and are re-read when the
 *   page's theme attributes change (only the colour pass is redone); teal/gold/orange are lifted on dark backgrounds.
 * - Size: square, as wide as its container up to 520 px (works at 390 px); device-pixel ratio capped at 2.
 * landing-gui.js renders <div class="fanout-viz" data-n="100000" data-caption="…"> as this component (FanoutViz).
 * It is an illustration of the shape of the work (k = N), not a measurement.
 */
(function (root) {
  var React = root.React; if (!React) return;
  var h = React.createElement, useEffect = React.useEffect, useRef = React.useRef;
  var CSS = ".fov{margin:0 0 28px}.fov-box{position:relative;border:1px solid var(--mui-palette-divider, rgba(127,127,127,.25));border-radius:14px;overflow:hidden;background:var(--mui-palette-background-paper, transparent)}" +
    ".fov-head{display:flex;flex-wrap:wrap;gap:6px 10px;align-items:center;justify-content:space-between;padding:10px 14px;border-bottom:1px solid var(--mui-palette-divider, rgba(127,127,127,.25));font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--mui-palette-text-secondary, #8b949e)}" +
    ".fov-k{font-variant-numeric:tabular-nums;letter-spacing:.04em;text-transform:none;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:12px;color:var(--mui-palette-text-primary, currentColor)}" +
    ".fov canvas{display:block;margin:0 auto;max-width:100%}" +
    ".fov-cap{margin-top:8px;text-align:center;font-size:13px;color:var(--mui-palette-text-secondary, #8b949e);line-height:1.5}" +
    ".fov-cap b{color:var(--mui-palette-text-primary, currentColor)}";
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
  var ORIG_N = 9000;   // the original's line count; densities, bright/wide lines and dots are kept at its numbers

  function FanoutViz(props) {
    var N = Math.max(1, Math.min(200000, +props.n || 100000));
    var wrapRef = useRef(null), canvasRef = useRef(null), kRef = useRef(null);
    useEffect(function () {
      injectCss();
      var wrap = wrapRef.current, cv = canvasRef.current, ctx = cv && cv.getContext("2d");
      if (!wrap || !ctx) return;
      var reduce = root.matchMedia ? root.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
      var R = rng(20261011), ang = new Float64Array(N), len = new Float64Array(N);   // same sequence as RASTER
      for (var i = 0; i < N; i++) { ang[i] = i / N * Math.PI * 2 + (R() - .5) * .015; len[i] = .55 + R() * .45; }
      var ratio = N / ORIG_N;
      var brightEvery = Math.max(1, Math.round(7 * ratio)), wideEvery = Math.max(1, Math.round(13 * ratio));
      var dotEvery = Math.max(1, Math.round(18 * ratio)), goldEvery = dotEvery * 5;
      // optical depth per line (−ln(1 − alpha)) × width: base lines carry the original's 0.06 spread over N lines
      var baseA = 1 - Math.pow(1 - .06, 1 / ratio);
      var dBase = -Math.log(1 - baseA), dBright = -Math.log(1 - .2) - (-Math.log(1 - .06));
      var off = document.createElement("canvas"), offCtx = off.getContext("2d");
      var depth = null, depthW = 0, size = 0, dpr = 1, col = null, colKey = "", raf = 0, visible = true, s = 0, tick = 0, lastK = -1;
      var probe = document.createElement("canvas").getContext("2d");
      var norm = function (c, fb) { probe.fillStyle = fb; try { probe.fillStyle = c || fb; } catch (e) {} return probe.fillStyle; };
      var rgbOf = function (c) { var m = /^#([0-9a-f]{6})$/i.exec(c); if (m) { var v = parseInt(m[1], 16); return [v >> 16 & 255, v >> 8 & 255, v & 255]; } var r = /rgba?\(([^)]+)\)/.exec(c); return r ? r[1].split(",").slice(0, 3).map(Number) : [0, 0, 0]; };
      function readColors() {
        var cs = getComputedStyle(wrap);
        var bg = norm(cs.getPropertyValue("--mui-palette-background-paper").trim(), "#111"), fg = norm(cs.getPropertyValue("--mui-palette-text-primary").trim(), "#eee");
        var key = bg + "|" + fg; if (key === colKey) return false; colKey = key;
        var c = rgbOf(bg), dark = (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) < 128, f = rgbOf(fg);
        // the original's palette (teal #0A7C6B, gold #E8B22E, coral #FF6B4A, guide ink at 0.06), lifted on dark backgrounds
        col = { dark: dark, teal: dark ? [38, 170, 148] : [10, 124, 107], gold: dark ? "#f0c04a" : "#e8b22e", coral: dark ? "#ff7b5c" : "#ff6b4a",
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
        var done = function (buf) { if (id !== job) return; depth = buf; depthW = W; colorize(); frame(reduce.matches ? 1 : s);
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
        // gain: the original's lines are composited in 8 bits at display scale and read a little darker than the exact
        // sum; 1.35 matches it side by side on light. Dark backgrounds glow, so less there.
        var img = offCtx.createImageData(W, W), px = img.data, tl = col.teal, gain = col.dark ? .75 : 1.35;
        for (var j = 0, n = W * W; j < n; j++) { var dd = depth[j]; if (dd <= 0) continue; var q = j * 4; px[q] = tl[0]; px[q + 1] = tl[1]; px[q + 2] = tl[2]; px[q + 3] = 255 * (1 - Math.exp(-dd * gain)); }
        offCtx.putImageData(img, 0, 0);
      }
      function frame(s) {
        var W = cv.width, c = W / 2, f = W * .42, u = W / 800, g = Math.min(1, s);
        ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, W, W);
        ctx.beginPath(); ctx.strokeStyle = col.guide; ctx.lineWidth = u; ctx.arc(c, c, f, 0, Math.PI * 2); ctx.stroke();
        if (g > 0 && depth && depthW === W) ctx.drawImage(off, c - c * g, c - c * g, W * g, W * g);   // lines grown to g of their length
        for (var i = 0; i < N; i += dotEvery) {
          var l = len[i] * f * g; if (l < f * .3) continue;
          var gold = i % goldEvery === 0, a = ang[i];
          ctx.beginPath(); ctx.fillStyle = gold ? col.gold : "rgba(" + col.teal.join(",") + ",.55)"; ctx.arc(c + Math.cos(a) * l, c + Math.sin(a) * l, (gold ? 2.2 : 1.1) * u, 0, Math.PI * 2); ctx.fill();
        }
        var p = reduce.matches ? 1 : 1 + Math.sin(tick * .06) * .18;
        ctx.beginPath(); ctx.fillStyle = col.coral; ctx.arc(c, c, 9 * u, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.strokeStyle = col.coral; ctx.globalAlpha = .28; ctx.lineWidth = 2.5 * u; ctx.arc(c, c, 20 * u * p, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.fillStyle = "#fff"; ctx.globalAlpha = .7; ctx.arc(c - 2 * u, c - 2 * u, 2.2 * u, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
        var k = Math.round(N * g);
        if (k !== lastK && kRef.current) { lastK = k; kRef.current.textContent = "k = " + fmt(k) + " / " + fmt(N); }
      }
      function layout() {
        var w = Math.floor(Math.min(520, wrap.clientWidth - 2)); if (w < 120) return false;
        var d = Math.min(2, root.devicePixelRatio || 1), changed = readColors();
        if (w === size && d === dpr) { if (changed) colorize(); return changed; }
        size = w; dpr = d; cv.width = cv.height = Math.round(w * d); cv.style.width = cv.style.height = w + "px";
        rasterize(); return true;
      }
      function loop() {
        raf = 0; if (!visible || document.hidden || reduce.matches) return;
        tick++; s += .012; if (s > 1.35) s = 0;   // the original's wave: grow to 100%, hold, restart
        if (tick % 45 === 0 && readColors()) colorize();
        frame(s); raf = requestAnimationFrame(loop);
      }
      function start() { if (reduce.matches) { s = 1; frame(1); return; } if (!raf) raf = requestAnimationFrame(loop); }
      var rto = 0;
      function redraw() { clearTimeout(rto); rto = setTimeout(function () { if (layout() || reduce.matches || !raf) frame(reduce.matches ? 1 : s); }, 120); }
      layout(); s = reduce.matches ? 1 : 0; frame(s); start();
      var ro = root.ResizeObserver ? new ResizeObserver(redraw) : null; if (ro) ro.observe(wrap);
      var io = root.IntersectionObserver ? new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) start(); }, { threshold: .1 }) : null; if (io) io.observe(wrap);
      var mo = new MutationObserver(function () { if (readColors()) { colorize(); frame(reduce.matches ? 1 : s); } });
      [document.documentElement, document.body].forEach(function (n) { mo.observe(n, { attributes: true }); });
      var onVis = function () { if (!document.hidden) start(); };
      document.addEventListener("visibilitychange", onVis);
      var onRm = function () { if (reduce.matches) { if (raf) cancelAnimationFrame(raf); raf = 0; s = 1; frame(1); } else start(); };
      if (reduce.addEventListener) reduce.addEventListener("change", onRm);
      return function () { job++; if (worker) worker.terminate(); clearTimeout(rto); if (raf) cancelAnimationFrame(raf); if (ro) ro.disconnect(); if (io) io.disconnect(); mo.disconnect(); document.removeEventListener("visibilitychange", onVis); if (reduce.removeEventListener) reduce.removeEventListener("change", onRm); };
    }, [N]);
    var label = "Illustration: one write at the centre spreads to " + fmt(N) + " dependents, one thin line each.";
    return h("figure", { className: "fov", ref: wrapRef, "data-gui-node-id": props["data-gui-node-id"], style: { margin: "0 0 28px" } },
      h("div", { className: "fov-box" },
        h("div", { className: "fov-head" }, h("span", null, "Extreme fan-out · 1 write"), h("span", { className: "fov-k", ref: kRef, "aria-hidden": "true" }, "k = 0 / " + fmt(N))),
        h("canvas", { ref: canvasRef, role: "img", "aria-label": label })),
      h("figcaption", { className: "fov-cap" }, h("b", null, props.caption || "1 write → " + fmt(N) + " dependents"), " · every line is one derived value that reads the value written; all of them recompute, and nothing else does."));
  }
  root.FanoutViz = FanoutViz;
})(typeof window !== "undefined" ? window : this);
