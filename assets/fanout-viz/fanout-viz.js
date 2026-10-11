/*! fanout-viz 1.0.0 · .me extreme fan-out, one write → N dependents · MIT · neurons.me
 * A radial canvas illustration ported from the "Fan-Out Extreme" section of
 * https://neurons-me.github.io/Inverted-Dependency-Indexing-Beautiful-Viz.html (one centre node, thin teal lines,
 * teal and orange dots, the write spreading outward). Here every one of the N lines is drawn (default 100,000).
 * - Performance: the full bloom is rendered once to an offscreen canvas (one batched path per style); each animation
 *   frame only clips that image to the wave radius and draws the centre, so a frame costs the same at any N.
 *   It animates only while on screen and the tab is visible.
 * - prefers-reduced-motion: no animation; the finished bloom is drawn once.
 * - Theme: background, text and divider come from the active .GUI theme (--mui-palette-* custom properties) and are
 *   re-read when the page's theme attributes change; the teal/orange hues are lifted on dark backgrounds.
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

  function FanoutViz(props) {
    var N = Math.max(1, Math.min(200000, +props.n || 100000));
    var wrapRef = useRef(null), canvasRef = useRef(null), kRef = useRef(null);
    useEffect(function () {
      injectCss();
      var wrap = wrapRef.current, cv = canvasRef.current, ctx = cv && cv.getContext("2d");
      if (!wrap || !ctx) return;
      var reduce = root.matchMedia ? root.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
      // geometry: angle + relative length per line, deterministic; sorted lengths give k for a wave radius
      var R = rng(20261011), ang = new Float32Array(N), len = new Float32Array(N);
      for (var i = 0; i < N; i++) { ang[i] = i / N * Math.PI * 2 + (R() - .5) * .015; len[i] = .55 + R() * .45; }
      var sorted = Float32Array.from(len).sort();
      var reached = function (s) { var lo = 0, hi = N; while (lo < hi) { var m = (lo + hi) >> 1; if (sorted[m] <= s) lo = m + 1; else hi = m; } return lo; };
      var off = document.createElement("canvas"), offCtx = off.getContext("2d");
      var size = 0, dpr = 1, col = null, colKey = "", raf = 0, visible = true, s = 0, tick = 0, lastK = -1;
      var probe = document.createElement("canvas").getContext("2d");
      var norm = function (c, fb) { probe.fillStyle = fb; try { probe.fillStyle = c || fb; } catch (e) {} return probe.fillStyle; };
      var rgbOf = function (c) { var m = /^#([0-9a-f]{6})$/i.exec(c); if (m) { var v = parseInt(m[1], 16); return [v >> 16 & 255, v >> 8 & 255, v & 255]; } var r = /rgba?\(([^)]+)\)/.exec(c); return r ? r[1].split(",").slice(0, 3).map(Number) : [0, 0, 0]; };
      function readColors() {
        var cs = getComputedStyle(wrap);
        var bg = norm(cs.getPropertyValue("--mui-palette-background-paper").trim(), "#111"), fg = norm(cs.getPropertyValue("--mui-palette-text-primary").trim(), "#eee");
        var key = bg + "|" + fg; if (key === colKey) return false; colKey = key;
        var c = rgbOf(bg), dark = (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) < 128;
        col = { bg: bg, fg: fg, dark: dark, teal: dark ? "45,212,191" : "10,124,107", orange: dark ? "#ff8a66" : "#ff6b4a", gold: dark ? "#f0c450" : "#e8b22e" };
        return true;
      }
      function renderBloom() {   // the full picture, once per size / theme
        off.width = off.height = Math.round(size * dpr);
        var o = offCtx, c = size * dpr / 2, rad = c * .92;
        o.setTransform(1, 0, 0, 1, 0, 0); o.clearRect(0, 0, off.width, off.height);
        // Line density near the centre is N / (2πr): a radial gradient whose alpha grows with r keeps 100,000
        // overlapping lines from saturating the middle, and scales with N so the picture is the same at any N.
        var dens = Math.min(1, 9000 / N), thin = (col.dark ? .07 : .09) * dens, bright = (col.dark ? .2 : .24) * dens, lw = Math.max(.35, .5 * dpr);
        var batch = function (pick, alpha, width) {
          var g = o.createRadialGradient(c, c, 0, c, c, rad);
          g.addColorStop(0, "rgba(" + col.teal + "," + alpha * .08 + ")"); g.addColorStop(.35, "rgba(" + col.teal + "," + alpha * .5 + ")"); g.addColorStop(1, "rgba(" + col.teal + "," + Math.min(1, alpha * 1.6) + ")");
          o.beginPath(); o.strokeStyle = g; o.lineWidth = width;
          for (var i = 0; i < N; i++) if (pick(i)) { var a = ang[i], l = len[i] * rad; o.moveTo(c, c); o.lineTo(c + Math.cos(a) * l, c + Math.sin(a) * l); }
          o.stroke();
        };
        batch(function (i) { return i % 7 !== 0; }, thin, lw);
        batch(function (i) { return i % 7 === 0; }, bright, lw * 1.6);
        var dots = function (step, fill, r, skip) {
          o.beginPath(); o.fillStyle = fill;
          for (var i = 0; i < N; i += step) { if (skip && skip(i)) continue; var a = ang[i], l = len[i] * rad; var x = c + Math.cos(a) * l, y = c + Math.sin(a) * l; o.moveTo(x + r, y); o.arc(x, y, r, 0, Math.PI * 2); }
          o.fill();
        };
        var step = Math.max(1, Math.round(N / 5500));
        dots(step, "rgba(" + col.teal + ",.6)", 1.1 * dpr, function (i) { return i % (step * 15) === 0; });
        dots(step * 15, col.orange, 1.7 * dpr);
        dots(step * 45, col.gold, 2.1 * dpr);
      }
      function frame(s) {
        var c = size * dpr / 2, rad = c * .92, W = cv.width;
        ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, W, W);
        ctx.beginPath(); ctx.strokeStyle = "rgba(" + col.teal + "," + (col.dark ? .14 : .12) + ")"; ctx.lineWidth = dpr; ctx.arc(c, c, rad, 0, Math.PI * 2); ctx.stroke();
        var r = Math.min(1, s) * rad;
        if (r > 0) { ctx.save(); ctx.beginPath(); ctx.arc(c, c, r, 0, Math.PI * 2); ctx.clip(); ctx.drawImage(off, 0, 0); ctx.restore(); }
        if (s > 0 && s < 1) { ctx.beginPath(); ctx.strokeStyle = "rgba(" + col.teal + ",.5)"; ctx.lineWidth = 1.5 * dpr; ctx.arc(c, c, r, 0, Math.PI * 2); ctx.stroke(); }
        var p = reduce.matches ? 1 : 1 + Math.sin(tick * .06) * .18;
        ctx.beginPath(); ctx.fillStyle = col.orange; ctx.arc(c, c, 8 * dpr, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.strokeStyle = col.orange; ctx.globalAlpha = .35; ctx.lineWidth = 2.5 * dpr; ctx.arc(c, c, 19 * dpr * p, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1;
        var k = reached(Math.min(1, s));
        if (k !== lastK && kRef.current) { lastK = k; kRef.current.textContent = "k = " + fmt(k) + " / " + fmt(N); }
      }
      function layout() {
        var w = Math.floor(Math.min(520, wrap.clientWidth - 2)); if (w < 120) return false;
        var d = Math.min(2, root.devicePixelRatio || 1);
        var changed = readColors();
        if (w === size && d === dpr && !changed) return false;
        size = w; dpr = d; cv.width = cv.height = Math.round(w * d); cv.style.width = cv.style.height = w + "px";
        renderBloom(); return true;
      }
      function loop() {
        raf = 0; if (!visible || document.hidden || reduce.matches) return;
        tick++; s += .01; if (s > 1.7) s = 0;   // ~1.7 s spreading, ~1 s holding the full bloom
        if (tick % 45 === 0 && readColors()) renderBloom();
        frame(s); raf = requestAnimationFrame(loop);
      }
      function start() { if (reduce.matches) { s = 1; frame(1); return; } if (!raf) raf = requestAnimationFrame(loop); }
      function redraw() { if (layout() || reduce.matches || !raf) frame(reduce.matches ? 1 : s); }
      layout(); s = reduce.matches ? 1 : 0; frame(s); start();
      var ro = root.ResizeObserver ? new ResizeObserver(redraw) : null; if (ro) ro.observe(wrap);
      var io = root.IntersectionObserver ? new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) start(); }, { threshold: .1 }) : null; if (io) io.observe(wrap);
      var mo = new MutationObserver(function () { if (readColors()) { renderBloom(); frame(reduce.matches ? 1 : s); } });
      [document.documentElement, document.body].forEach(function (n) { mo.observe(n, { attributes: true }); });
      var onVis = function () { if (!document.hidden) start(); };
      document.addEventListener("visibilitychange", onVis);
      var onRm = function () { if (reduce.matches) { if (raf) cancelAnimationFrame(raf); raf = 0; s = 1; frame(1); } else start(); };
      if (reduce.addEventListener) reduce.addEventListener("change", onRm);
      return function () { if (raf) cancelAnimationFrame(raf); if (ro) ro.disconnect(); if (io) io.disconnect(); mo.disconnect(); document.removeEventListener("visibilitychange", onVis); if (reduce.removeEventListener) reduce.removeEventListener("change", onRm); };
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
