/*! kernel-timeline 1.0.0 · .me kernel cost across versions · MIT · neurons.me
 * A small SVG line chart with no dependencies besides the page's React (window.React, already loaded for .GUI).
 * Reads one JSON file (docs/Benchmarks/data/kernel-timeline.json: builds in release order, per-series medians,
 * annotations) and draws one line per benchmark: relative to the series' first comparable build (= 1.0) or in ms
 * (log scale). Colours are the active .GUI theme tokens (--mui-palette-*), so dark/light and theme changes follow.
 * Hover / tap / arrow keys on a version show its ms (min–max over rounds) and the commit; numbered markers are the
 * annotated steps; legend chips toggle lines; "Table" shows the same numbers as a table.
 * landing-gui.js renders <div class="kernel-timeline" data-src="..."> as this component (registry: KernelTimeline).
 */
(function (root) {
  var React = root.React; if (!React) return;
  var h = React.createElement, useState = React.useState, useEffect = React.useEffect, useRef = React.useRef, useMemo = React.useMemo;
  var V = function (n, fb) { return "var(--mui-palette-" + n + ", " + fb + ")"; };
  var FG = V("text-primary", "currentColor"), FG2 = V("text-secondary", "#8b949e"), GRID = V("divider", "rgba(127,127,127,.25)"), PAPER = V("background-paper", "#161b22");
  var mix = function (a, p, b) { return "color-mix(in srgb, " + a + " " + p + "%, " + b + ")"; };
  // Categorical hues for the lines, each mixed 25% toward the theme's text colour: distinct from each other in every
  // .GUI theme, lighter on dark backgrounds and darker on light ones (the theme's own primary/info/success are often
  // too close to tell 8 lines apart). UI chrome (grid, text, focus, markers) uses the theme tokens directly.
  var ACC = V("primary-main", "#58a6ff");
  var HUES = [ACC, V("warning-main", "#d29922"), V("success-main", "#3fb950"), V("error-main", "#ff7b72"), V("secondary-main", "#d2a8ff"), V("info-main", "#79c0ff")];
  var COLORS = ["#3b82f6", "#f59e0b", "#10b981", "#ef4444", "#a855f7", "#06b6d4", "#ec4899", "#84cc16", "#f97316", "#64748b", "#eab308"].map(function (c) { return mix(c, 75, FG); });
  var DASH = [null, "6 3", null, null, null, null, "6 3", null, "2 3", "2 3", "6 3"];
  var CSS = ".kt{position:relative;margin:0 0 28px;color:" + FG + ";font-size:14px}" +
    ".kt-bar{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin:0 0 10px}.kt-bar .kt-sp{flex:1}" +
    ".kt-seg{display:inline-flex;border:1px solid " + GRID + ";border-radius:8px;overflow:hidden}" +
    ".kt button{font:inherit;font-size:12.5px;line-height:1.2;color:" + FG2 + ";background:transparent;border:0;padding:6px 10px;cursor:pointer}" +
    ".kt button:focus-visible{outline:2px solid " + HUES[0] + ";outline-offset:-2px}" +
    ".kt-seg button[aria-pressed=true]{color:" + FG + ";background:" + mix(FG, 10, "transparent") + ";font-weight:700}" +
    ".kt-tbl-btn{border:1px solid " + GRID + "!important;border-radius:8px}" +
    ".kt-legend{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 6px}" +
    ".kt-legend button{display:inline-flex;align-items:center;gap:6px;border:1px solid " + GRID + ";border-radius:999px;padding:4px 10px 4px 8px;font-size:12px;color:" + FG + "}" +
    ".kt-legend button[aria-pressed=false]{color:" + FG2 + ";opacity:.55}.kt-legend button[aria-pressed=false] .kt-sw{background:transparent!important}" +
    ".kt-sw{width:10px;height:10px;border-radius:50%;border:2px solid;flex:none}" +
    ".kt-plot{position:relative;border:1px solid " + GRID + ";border-radius:12px;padding:6px 4px 0;touch-action:pan-y}" +
    ".kt svg{display:block;width:100%;overflow:visible}.kt svg text{fill:" + FG2 + ";font-size:11px;font-family:inherit}" +
    ".kt svg .kt-rel{fill:" + FG + ";font-weight:700}.kt svg:focus{outline:none}.kt svg:focus-visible{outline:2px solid " + HUES[0] + ";outline-offset:2px;border-radius:8px}" +
    ".kt-tip{position:absolute;z-index:3;top:8px;width:min(280px,calc(100% - 16px));box-sizing:border-box;padding:10px 12px;border-radius:10px;border:1px solid " + GRID + ";background:" + PAPER + ";box-shadow:0 8px 24px rgba(0,0,0,.28);font-size:12.5px;line-height:1.45;pointer-events:none}" +
    ".kt-tip b{color:" + FG + "}.kt-tip .kt-muted{color:" + FG2 + "}.kt-tip table{border-collapse:collapse;width:100%;margin-top:6px}.kt-tip td{padding:1px 0;vertical-align:top}.kt-tip td+td{text-align:right;padding-left:8px;white-space:nowrap;font-variant-numeric:tabular-nums}" +
    ".kt-tip.kt-flow{position:static;width:auto;margin:6px 8px 8px;box-shadow:none;pointer-events:auto}" +
    ".kt-tip .kt-note{margin-top:6px;padding-top:6px;border-top:1px solid " + GRID + "}" +
    ".kt-ann{list-style:none;margin:12px 0 0;padding:0;display:grid;gap:8px}.kt-ann li{display:flex;gap:10px;align-items:flex-start;line-height:1.5;font-size:13.5px;border-radius:8px;padding:2px 4px}" +
    ".kt-ann li.on{background:" + mix(HUES[0], 12, "transparent") + "}" +
    ".kt-ann .kt-n{flex:none;width:20px;height:20px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;color:" + PAPER + ";background:" + FG + ";margin-top:1px}" +
    ".kt-ann code,.kt-tip code{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:.88em}" +
    ".kt-foot{margin-top:10px;font-size:12px;color:" + FG2 + ";line-height:1.5}.kt-foot a{color:" + HUES[0] + "}" +
    ".kt-tbl{overflow-x:auto;margin-top:12px;border:1px solid " + GRID + ";border-radius:10px}.kt-tbl table{border-collapse:collapse;width:100%;font-size:12px;font-variant-numeric:tabular-nums}" +
    ".kt-tbl th,.kt-tbl td{padding:5px 8px;border-bottom:1px solid " + GRID + ";text-align:right;white-space:nowrap}.kt-tbl th:first-child,.kt-tbl td:first-child{text-align:left;position:sticky;left:0;background:" + PAPER + "}.kt-tbl th{color:" + FG2 + ";font-weight:700}";

  function injectCss() { if (document.getElementById("kt-css")) return; var s = document.createElement("style"); s.id = "kt-css"; s.textContent = CSS; document.head.appendChild(s); }
  var fmtMs = function (v) { return v >= 100 ? v.toFixed(0) : v >= 10 ? v.toFixed(1) : v >= 1 ? v.toFixed(2) : v >= 0.1 ? v.toFixed(3) : v.toFixed(4); };
  var fmtX = function (r) { return r.toFixed(2) + "×"; };
  var shortLabel = function (b) { return b.kind === "release" ? b.version : b.kind === "unreleased" ? "fix*" : b.id === "2a173b7" ? "4.0.2+fix" : b.sha; };
  function niceStep(span, n) { var raw = span / n, p = Math.pow(10, Math.floor(Math.log10(raw))), m = raw / p; return (m < 1.5 ? 1 : m < 3 ? 2 : m < 7 ? 5 : 10) * p; }

  function KernelTimeline(props) {
    var src = props.src;
    var st = useState(null), doc = st[0], setDoc = st[1];
    var se = useState(null), err = se[0], setErr = se[1];
    var sm = useState("rel"), mode = sm[0], setMode = sm[1];
    var sv = useState(null), vis = sv[0], setVis = sv[1];
    var sa = useState(null), active = sa[0], setActive = sa[1];
    var sn = useState(null), annOn = sn[0], setAnnOn = sn[1];
    var stb = useState(false), table = stb[0], setTable = stb[1];
    var sw = useState(820), W = sw[0], setW = sw[1];
    var plotRef = useRef(null);
    useEffect(injectCss, []);
    useEffect(function () {
      var alive = true;
      fetch(src, { cache: "no-cache" }).then(function (r) { if (!r.ok) throw new Error(r.status + " " + src); return r.json(); })
        .then(function (d) { if (!alive) return; setDoc(d); setVis(Object.fromEntries(d.series.map(function (s) { return [s.key, !!s.visible]; }))); })
        .catch(function (e) { if (alive) setErr(String(e.message || e)); });
      return function () { alive = false; };
    }, [src]);
    useEffect(function () {
      var el = plotRef.current; if (!el || typeof ResizeObserver === "undefined") return;
      var ro = new ResizeObserver(function (es) { var w = Math.round(es[0].contentRect.width); if (w > 0) setW(w); }); ro.observe(el); return function () { ro.disconnect(); };
    }, [doc]);
    useEffect(function () {
      if (active == null) return;
      var off = function (e) { if (plotRef.current && !plotRef.current.contains(e.target)) setActive(null); };
      var esc = function (e) { if (e.key === "Escape") setActive(null); };
      document.addEventListener("pointerdown", off); document.addEventListener("keydown", esc);
      return function () { document.removeEventListener("pointerdown", off); document.removeEventListener("keydown", esc); };
    }, [active]);

    var model = useMemo(function () {
      if (!doc) return null;
      var B = doc.builds, S = doc.series.map(function (s, i) { return Object.assign({}, s, { color: COLORS[i % COLORS.length], dash: DASH[i] }); });
      S.forEach(function (s) {
        var base = null;
        s.pts = B.map(function (b, i) {
          var v = b.values[s.key]; if (!v || v.comparable === false) return null;
          if (base == null) base = v.ms;
          return { i: i, ms: v.ms, min: v.min, max: v.max, n: v.n, rel: v.ms / base, unreleased: b.kind === "unreleased" };
        });
        s.base = base; s.baseBuild = B[s.pts.findIndex(function (p) { return p; })];
      });
      var ann = (doc.annotations || []).map(function (a, j) { return Object.assign({ n: j + 1, idx: B.findIndex(function (b) { return b.id === a.at; }) }, a); }).filter(function (a) { return a.idx >= 0; });
      return { B: B, S: S, ann: ann };
    }, [doc]);

    if (err) return h("div", { className: "kt", "data-gui-node-id": props["data-gui-node-id"] }, h("p", null, "Timeline data could not be loaded (" + err + ")."));
    if (!model || !vis) return h("div", { className: "kt", "data-gui-node-id": props["data-gui-node-id"], style: { minHeight: 360 } });

    var B = model.B, S = model.S, shown = S.filter(function (s) { return vis[s.key]; });
    var narrow = W < 560, H = narrow ? 300 : 360;
    var M = { l: narrow ? 40 : 52, r: narrow ? 10 : 16, t: 30, b: narrow ? 66 : 62 };
    var pw = Math.max(10, W - M.l - M.r), ph = H - M.t - M.b;
    var x = function (i) { return M.l + (B.length === 1 ? pw / 2 : (i * pw) / (B.length - 1)); };
    var vals = []; shown.forEach(function (s) { s.pts.forEach(function (p) { if (p) vals.push(mode === "rel" ? p.rel : p.ms); }); });
    if (!vals.length) vals = mode === "rel" ? [1] : [1];
    var y, ticks, fmtTick;
    if (mode === "rel") {
      var lo = Math.min(0.9, Math.min.apply(null, vals)), hi = Math.max(1.1, Math.max.apply(null, vals));
      var stp = niceStep(hi - lo, narrow ? 4 : 6); lo = Math.floor(lo / stp) * stp; hi = Math.ceil(hi / stp) * stp;
      y = function (v) { return M.t + ph - ((v - lo) / (hi - lo)) * ph; };
      ticks = []; for (var t = lo; t <= hi + stp / 2; t += stp) ticks.push(+t.toFixed(6));
      fmtTick = function (v) { return (Math.abs(v - 1) < 1e-9 ? "1.0" : +v.toFixed(2)) + "×"; };
    } else {
      var l0 = Math.floor(Math.log10(Math.min.apply(null, vals))), l1 = Math.ceil(Math.log10(Math.max.apply(null, vals)));
      if (l1 === l0) l1 = l0 + 1;
      y = function (v) { return M.t + ph - ((Math.log10(v) - l0) / (l1 - l0)) * ph; };
      ticks = []; for (var e = l0; e <= l1; e++) ticks.push(Math.pow(10, e));
      fmtTick = function (v) { return (v >= 1 ? String(v) : String(+v.toFixed(6))) + (narrow ? "" : " ms"); };
    }
    var val = function (p) { return mode === "rel" ? p.rel : p.ms; };

    // ── svg ──
    var g = [];
    ticks.forEach(function (t, k) {
      var yy = y(t), one = mode === "rel" && Math.abs(t - 1) < 1e-9;
      g.push(h("line", { key: "gy" + k, x1: M.l, x2: M.l + pw, y1: yy, y2: yy, stroke: one ? FG2 : GRID, strokeDasharray: one ? "4 4" : null, strokeWidth: 1 }));
      g.push(h("text", { key: "ty" + k, x: M.l - 6, y: yy + 3.5, textAnchor: "end", className: one ? "kt-rel" : null }, fmtTick(t)));
    });
    B.forEach(function (b, i) {
      var rel = b.kind === "release", un = b.kind === "unreleased";
      g.push(h("line", { key: "gx" + i, x1: x(i), x2: x(i), y1: M.t, y2: M.t + ph, stroke: GRID, strokeWidth: rel ? 1 : 0.5, strokeDasharray: rel ? null : "2 4", opacity: rel ? 1 : 0.7 }));
      g.push(h("text", { key: "tx" + i, transform: "translate(" + x(i) + "," + (M.t + ph + 12) + ") rotate(-45)", textAnchor: "end",
        style: { fill: rel ? FG : FG2, fontWeight: rel ? 700 : 400, fontStyle: un ? "italic" : null, fontSize: rel ? 11.5 : 10.5 } }, shortLabel(b)));
    });
    model.ann.forEach(function (a) {
      var xx = x(a.idx), on = annOn === a.n || (active != null && active === a.idx);
      g.push(h("line", { key: "al" + a.n, x1: xx, x2: xx, y1: M.t - 10, y2: M.t + ph, stroke: FG, strokeWidth: on ? 1.5 : 1, strokeDasharray: "3 3", opacity: on ? 0.9 : 0.45 }));
      g.push(h("g", { key: "ab" + a.n, transform: "translate(" + xx + "," + (M.t - 17) + ")", style: { cursor: "pointer" },
          onPointerEnter: function () { setAnnOn(a.n); }, onPointerLeave: function () { setAnnOn(null); }, onClick: function (ev) { ev.stopPropagation(); setActive(a.idx); setAnnOn(a.n); } },
        h("title", null, a.n + ". " + a.title),
        h("circle", { r: 9, fill: on ? HUES[0] : FG }), h("text", { y: 3.6, textAnchor: "middle", style: { fill: PAPER, fontSize: 10.5, fontWeight: 800 } }, String(a.n))));
    });
    shown.forEach(function (s) {
      var main = [], last = null, segs = [];
      s.pts.forEach(function (p) { if (!p) return; if (p.unreleased) { if (last) segs.push([last, p]); } else { main.push(p); } last = p; });
      if (main.length > 1) g.push(h("path", { key: "l" + s.key, d: main.map(function (p, k) { return (k ? "L" : "M") + x(p.i).toFixed(1) + "," + y(val(p)).toFixed(1); }).join(""),
        fill: "none", stroke: s.color, strokeWidth: 2, strokeDasharray: s.dash, strokeLinejoin: "round", strokeLinecap: "round" }));
      segs.forEach(function (sg, k) { g.push(h("path", { key: "u" + s.key + k, d: "M" + x(sg[0].i) + "," + y(val(sg[0])) + "L" + x(sg[1].i) + "," + y(val(sg[1])), fill: "none", stroke: s.color, strokeWidth: 2, strokeDasharray: "3 4", opacity: 0.85 })); });
      s.pts.forEach(function (p) { if (!p) return; var on = active === p.i;
        g.push(h("circle", { key: "p" + s.key + p.i, cx: x(p.i), cy: y(val(p)), r: on ? 5 : p.unreleased ? 4 : 3.2, fill: p.unreleased ? PAPER : s.color, stroke: s.color, strokeWidth: p.unreleased ? 2 : on ? 2 : 0 })); });
    });
    if (active != null) g.push(h("line", { key: "act", x1: x(active), x2: x(active), y1: M.t, y2: M.t + ph, stroke: HUES[0], strokeWidth: 1.5, opacity: 0.7 }));
    var colW = B.length > 1 ? pw / (B.length - 1) : pw;
    B.forEach(function (b, i) {
      g.push(h("rect", { key: "hit" + i, x: x(i) - colW / 2, y: M.t, width: colW, height: ph + M.b - 8, fill: "transparent",
        onPointerEnter: function (ev) { if (ev.pointerType === "mouse") setActive(i); }, onClick: function () { setActive(active === i ? null : i); } }));
    });
    var onKey = function (ev) {
      if (ev.key === "ArrowRight" || ev.key === "ArrowLeft") { ev.preventDefault(); var d = ev.key === "ArrowRight" ? 1 : -1; setActive(active == null ? (d > 0 ? 0 : B.length - 1) : Math.max(0, Math.min(B.length - 1, active + d))); }
      if (ev.key === "Escape") setActive(null);
    };
    var svg = h("svg", { width: W, height: H, viewBox: "0 0 " + W + " " + H, role: "img", tabIndex: 0, onKeyDown: onKey,
      onPointerLeave: function (ev) { if (ev.pointerType === "mouse") setActive(null); },
      "aria-label": "Kernel cost per version, " + (mode === "rel" ? "relative to the first comparable build" : "milliseconds, log scale") + ". Use left and right arrow keys to read each version." }, g);

    // ── tooltip ──
    var tip = null;
    if (active != null) {
      var b = B[active], ax = x(active), left = ax > W / 2;
      var rows = shown.map(function (s) { var p = s.pts[active], v = b.values[s.key];
        return h("tr", { key: s.key }, h("td", null, h("span", { className: "kt-sw", style: { display: "inline-block", width: 8, height: 8, marginRight: 6, borderColor: s.color, background: s.color } }), s.name),
          h("td", null, p ? h("span", null, h("b", null, fmtMs(p.ms) + " ms"), " ", h("span", { className: "kt-muted" }, fmtX(p.rel))) : h("span", { className: "kt-muted" }, v && v.comparable === false ? "not comparable" : "—"))); });
      var anns = model.ann.filter(function (a) { return a.idx === active; });
      tip = h("div", { className: narrow ? "kt-tip kt-flow" : "kt-tip", role: "status", style: narrow ? null : left ? { right: Math.max(8, W - ax + 14) + "px" } : { left: Math.min(Math.max(8, ax + 14), W - 288) + "px" } },
        h("div", null, h("b", null, b.label), " ", h("span", { className: "kt-muted" }, b.label !== b.sha ? h("code", null, b.sha) : null, (b.label !== b.sha ? " · " : "") + b.date)),
        h("div", { className: "kt-muted" }, b.subject),
        h("table", null, h("tbody", null, rows)),
        anns.map(function (a) { return h("div", { key: a.n, className: "kt-note" }, h("b", null, a.n + ". " + a.title), h("div", null, a.text)); }));
    }

    var ctl = h("div", { className: "kt-bar" },
      h("div", { className: "kt-seg", role: "group", "aria-label": "Scale" },
        h("button", { type: "button", "aria-pressed": mode === "rel", onClick: function () { setMode("rel"); } }, "Relative"),
        h("button", { type: "button", "aria-pressed": mode === "ms", onClick: function () { setMode("ms"); } }, "ms (log)")),
      h("span", { className: "kt-sp" }),
      h("button", { type: "button", className: "kt-tbl-btn", "aria-expanded": table, onClick: function () { setTable(!table); } }, table ? "Hide table" : "Table"));
    var legend = h("div", { className: "kt-legend", role: "group", "aria-label": "Benchmarks" }, S.map(function (s) {
      return h("button", { key: s.key, type: "button", "aria-pressed": !!vis[s.key], title: s.benchmark + ": " + s.what + (s.base ? " · 1.0 = " + fmtMs(s.base) + " ms on " + s.baseBuild.label : ""),
        onClick: function () { var n = Object.assign({}, vis); n[s.key] = !n[s.key]; setVis(n); } },
        h("span", { className: "kt-sw", style: { borderColor: s.color, background: s.color, borderStyle: s.dash ? "dashed" : "solid" } }), s.name + (s.warmup ? " ⚠" : ""));
    }));
    var annList = h("ol", { className: "kt-ann" }, model.ann.map(function (a) {
      return h("li", { key: a.n, className: annOn === a.n || active === a.idx ? "on" : null, onPointerEnter: function () { setAnnOn(a.n); }, onPointerLeave: function () { setAnnOn(null); } },
        h("span", { className: "kt-n", "aria-hidden": "true" }, String(a.n)),
        h("span", null, h("b", null, a.title), " ", h("code", null, a.commits.join(" / ")), " — ", a.text));
    }));
    var tbl = table && h("div", { className: "kt-tbl" }, h("table", null,
      h("thead", null, h("tr", null, h("th", null, "build"), shown.map(function (s) { return h("th", { key: s.key, title: s.what }, s.name); }))),
      h("tbody", null, B.map(function (b, i) { return h("tr", { key: b.id }, h("td", null, b.label + (b.kind === "commit" && b.label !== b.sha ? " (" + b.sha + ")" : "")),
        shown.map(function (s) { var p = s.pts[i], v = b.values[s.key]; return h("td", { key: s.key, title: v ? "min " + v.min + " · max " + v.max + " · n " + v.n : null }, p ? fmtMs(p.ms) : v ? "n/c" : "—"); })); }))));
    var run = doc.run || {};
    var foot = h("div", { className: "kt-foot" },
      "Medians of " + run.rounds + " interleaved rounds per build, one machine (" + run.machine + ", " + run.node + "). " + (mode === "rel" ? doc.baseline + " " : "ms on a log scale. ") +
      (B.some(function (b) { return b.kind === "unreleased"; }) ? "Dashed segment: an unreleased branch. " : "") + "⚠ = dominated by first-write warm-up. n/c = not comparable (see the data file). ",
      h("a", { href: src }, "Data (JSON)"), ".");
    return h("div", { className: "kt", "data-gui-node-id": props["data-gui-node-id"] }, ctl, legend,
      h("div", { className: "kt-plot", ref: plotRef }, svg, tip), annList, tbl, foot);
  }
  root.KernelTimeline = KernelTimeline;
})(typeof globalThis !== "undefined" ? globalThis : this);
