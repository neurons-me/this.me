// Live path tree for docs/me-whatever-what.html: a real this.me 4.2.1 instance (MeKernel loader, sha256 checked).
// The tree is drawn from me.inspect().index (the kernel's own path index); relations come from me.explain(path).
(function () {
  "use strict";
  var NS = "http://www.w3.org/2000/svg";
  var CSS = [
    ".pl{--ink:var(--mui-palette-text-primary,#1f2328);--mut:var(--mui-palette-text-secondary,#57606a);--line:var(--mui-palette-divider,rgba(127,127,127,.35));--bg:var(--mui-palette-background-default,#fff);--link:var(--mui-palette-info-main,#2a86c7);--sun:var(--mui-palette-warning-main,#d29922);--acc:var(--mui-palette-primary-main,#58a6ff);--sub:var(--mui-palette-action-hover,rgba(127,127,127,.08));margin:10px 0 22px;font-size:.9rem}",
    ".pl svg{display:block;width:100%;max-width:520px;height:auto;margin:0 auto;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;overflow:visible}",
    ".pl .e{stroke:var(--line);stroke-width:1.4;fill:none}.pl .e.on{stroke:var(--acc);stroke-width:2.4}",
    ".pl .d{stroke:var(--link);fill:none}.pl .dg{stroke-width:2.6;opacity:.55;filter:blur(2.5px)}.pl .dd{stroke-width:1.6;stroke-dasharray:4 5;animation:plFlow 1.4s linear infinite}",
    ".pl .d.hot{stroke:var(--sun)}.pl .dg.hot{opacity:.9}@keyframes plFlow{to{stroke-dashoffset:-18}}",
    ".pl .n{cursor:pointer;outline:none}.pl .n circle{fill:var(--bg);stroke:var(--mut);stroke-width:1.4;transition:stroke .2s}.pl .n.der circle{stroke:var(--sun);stroke-width:2}",
    ".pl .n.path circle{stroke:var(--acc);stroke-width:2.2}.pl .n.sel circle{stroke:var(--acc);stroke-width:3}.pl .n:focus-visible circle{stroke:var(--acc);stroke-dasharray:3 3}",
    ".pl .n .lb{fill:var(--mut);font-size:13px;letter-spacing:1.5px;text-anchor:middle}.pl .n.der .lb{fill:var(--sun)}.pl .n.path .lb,.pl .n.sel .lb{fill:var(--acc)}",
    ".pl .n .v{fill:var(--ink);font:italic 18px Georgia,'DejaVu Serif',serif;text-anchor:middle}.pl .n.der .v{fill:var(--sun);font-size:24px}.pl .n .root{fill:var(--acc);font-size:15px;text-anchor:middle}",
    ".pl .n.der.sel circle{stroke:var(--sun);stroke-width:3}.pl .n.der.sel .lb{fill:var(--sun)}.pl .n circle.selring{fill:none!important;stroke:var(--sun)!important;stroke-width:1.6!important;stroke-dasharray:4 4}",
    ".pl .ring{fill:none;stroke:var(--sun);stroke-width:2;opacity:0}.pl .ring.go{animation:plRing .9s ease-out}@keyframes plRing{from{opacity:.9;r:30px}to{opacity:0;r:60px}}",
    ".pl .dd.burst{animation:plFlow .35s linear infinite;stroke:var(--sun)}",
    ".pl .box{border:1px solid var(--line);border-radius:10px;padding:10px 12px;margin-top:6px;background:var(--sub)}",
    ".pl .row{display:flex;flex-wrap:wrap;gap:6px 14px;align-items:center;margin:3px 0}.pl .k{color:var(--mut);min-width:84px;font-size:.8rem}",
    ".pl code{font-size:.82rem}.pl .row>span:not(.k):not(.st){flex:1 1 0;min-width:0;font-size:.82rem}.pl .row>code{flex:1 1 0;min-width:0;white-space:nowrap;overflow-x:auto;scrollbar-width:thin}@media (max-width:600px){.pl .row>code{font-size:.72rem}.pl .k{min-width:72px}}"+".pl .pth{font-weight:600;color:var(--acc)}.pl .st{display:inline-flex;align-items:center;gap:4px}",
    ".pl .st button{width:30px;height:30px;border-radius:8px;border:1px solid var(--line);background:var(--bg);color:var(--ink);font:600 16px/1 inherit;cursor:pointer}.pl .st button:focus-visible{outline:2px solid var(--acc)}",
    ".pl .st input{width:64px;height:30px;border-radius:8px;border:1px solid var(--line);background:var(--bg);color:var(--ink);text-align:center;font:500 .9rem ui-monospace,monospace}",
    ".pl pre{margin:6px 0 0;max-height:220px;overflow:auto;font-size:.74rem;line-height:1.45;padding:8px 10px;border-radius:8px;border:1px solid var(--line);background:var(--bg)}",
    ".pl .ks{font-size:.72rem;color:var(--mut);text-align:center;margin-top:2px}.pl .hint{color:var(--mut);font-size:.8rem}",
    "@media (prefers-reduced-motion:reduce){.pl .dd,.pl .dd.burst{animation:none}.pl .ring.go{animation:none;opacity:.6}}"
  ].join("\n");

  function el(tag, attrs, parent, svg) { var n = svg ? document.createElementNS(NS, tag) : document.createElement(tag); for (var k in attrs || {}) { if (k === "text") n.textContent = attrs[k]; else n.setAttribute(k, attrs[k]); } if (parent) parent.appendChild(n); return n; }
  function writer(me, path) { var t = me; path.split(".").forEach(function (s) { t = t[s]; }); return t; }
  function callFor(path, mem, ex) {
    if (mem && mem.operator === "=" && ex && ex.expr) { var i = path.lastIndexOf("."); return "me." + path.slice(0, i) + '["="]("' + path.slice(i + 1) + '", "' + ex.expr + '")'; }
    return "me." + path + "(" + JSON.stringify(mem ? mem.value : undefined) + ")";
  }

  function mount(host) {
    if (!document.getElementById("pl-css")) el("style", { id: "pl-css", text: CSS }, document.head);
    var MK = window.MeKernel; if (!MK) return;
    MK.load().then(function (ME) {
      var me = new ME();
      me.colony.pantry.seeds(45); me.colony.pantry.honey(12); me.colony["="]("food", "pantry.seeds + pantry.honey");
      build(host, me, MK);
    }, function (e) { var s = host.querySelector(".pl-status"); if (s) s.textContent = "Kernel failed to load: " + (e && e.message || e); });
  }

  function build(host, me, MK) {
    var root = el("div", { class: "pl" }); var fallback = host.querySelector(".pl-static");
    var svg = el("svg", { viewBox: "0 20 520 520", role: "group", "aria-label": "Live path tree from this.me " + MK.KERNEL.version }, root, true);
    var gE = el("g", {}, svg, true), gD = el("g", {}, svg, true), gN = el("g", {}, svg, true);
    var ks = el("div", { class: "ks" }, root);
    var box = el("div", { class: "box", "aria-live": "polite" }, root);
    var sel = "colony.food", nodes = {}, edges = [], deps = [];

    function tree() {
      var idx = me.inspect().index, T = { name: "me", path: "", kids: [] }, all = { "": T };
      Object.keys(idx).forEach(function (p) { var segs = p.split("."), cur = "";
        segs.forEach(function (s, i) { var np = cur ? cur + "." + s : s; if (!all[np]) { all[np] = { name: s, path: np, kids: [], depth: i + 1 }; all[cur].kids.push(all[np]); } cur = np; }); });
      // layout: leaves left to right (branches before leaves), parents centred over children
      var leaves = 0; (function walk(n, d) { n.depth = d; n.kids.sort(function (a, b) { return (b.kids.length ? 1 : 0) - (a.kids.length ? 1 : 0); }); if (!n.kids.length) n.slot = leaves++; else { n.kids.forEach(function (c) { walk(c, d + 1); }); n.slot = (n.kids[0].slot + n.kids[n.kids.length - 1].slot) / 2; } })(T, 0);
      var maxD = 0; Object.keys(all).forEach(function (k) { maxD = Math.max(maxD, all[k].depth); });
      Object.keys(all).forEach(function (k) { var n = all[k]; n.x = 80 + (leaves > 1 ? n.slot * 360 / (leaves - 1) : 180); n.y = 70 + n.depth * (330 / Math.max(1, maxD)); });
      // pull derived values to the right, level with their parent's children, as in the figure
      return { all: all, idx: idx };
    }

    function render() {
      var t = tree(), all = t.all, maxY = 0; Object.keys(all).forEach(function (k) { if (!all[k].kids.length) maxY = Math.max(maxY, all[k].y); }); var _t = t, mems = me.inspect().memories, last = {};
      mems.forEach(function (m) { last[m.path] = m; });
      gE.textContent = ""; gD.textContent = ""; gN.textContent = ""; nodes = {}; deps = [];
      var onPath = {}; var sp = sel.split("."), acc = ""; onPath[""] = 1; sp.forEach(function (s) { acc = acc ? acc + "." + s : s; onPath[acc] = 1; });
      Object.keys(all).forEach(function (k) { var n = all[k]; n.kids.forEach(function (c) { el("path", { class: "e" + (onPath[c.path] && onPath[n.path] ? " on" : ""), d: "M" + n.x + " " + n.y + " L" + c.x + " " + c.y }, gE, true); }); });
      Object.keys(t.idx).forEach(function (p) { var ex = me.explain(p); if (ex && ex.meta && ex.meta.dependsOn && ex.meta.dependsOn.length) ex.meta.dependsOn.forEach(function (src) {
        var A = all[src], B = all[p]; if (!A || !B) return;
        // under every leaf and its label, then up into the right side of the derived node (its label sits above it)
        var low = maxY + 100 + 12 * (all[src].slot || 0), d = "M" + A.x + " " + (A.y + 58) + " C" + A.x + " " + low + " " + (B.x + 90) + " " + (low - 10) + " " + (B.x + 34) + " " + B.y;
        var hot = sel === p || sel === src; deps.push({ src: src, dst: p, g: el("path", { class: "d dg" + (hot ? " hot" : ""), d: d }, gD, true), dd: el("path", { class: "d dd" + (hot ? " hot" : ""), d: d }, gD, true) }); }); });
      Object.keys(all).forEach(function (k) { var n = all[k], isRoot = k === "", v = t.idx[k], der = last[k] && last[k].operator === "=";
        var g = el("g", { class: "n" + (der ? " der" : "") + (onPath[k] && k !== sel ? " path" : "") + (k === sel ? " sel" : ""), tabindex: "0", role: "button", "aria-pressed": k === sel ? "true" : "false",
          "aria-label": isRoot ? "me, the root" : k + (v !== undefined ? " = " + v : " (branch)") + (der ? ", derived" : "") }, gN, true);
        var r = isRoot ? 24 : der ? 34 : 28; if (der && k === sel) el("circle", { class: "selring", cx: n.x, cy: n.y, r: 42 }, g, true); el("circle", { cx: n.x, cy: n.y, r: r }, g, true);
        if (isRoot) el("text", { class: "root", x: n.x, y: n.y + 5, text: "me" }, g, true);
        else { el("text", { class: "lb", x: n.x, y: n.kids.length || der ? n.y - r - 12 : n.y + r + 22, text: n.name.toUpperCase() + (der ? " [=]" : "") }, g, true); if (v !== undefined) el("text", { class: "v", x: n.x, y: n.y + (der ? 8 : 6), text: String(v) }, g, true); }
                if (der) n.ring = el("circle", { class: "ring", cx: n.x, cy: n.y, r: 34 }, g, true);
        var pick = function () { sel = k || "colony"; render(); var f = nodes[sel]; f && f.focus(); };
        g.addEventListener("click", pick); g.addEventListener("keydown", function (ev) { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); pick(); } });
        nodes[k] = g; n.g = g; });
      ks.textContent = "drawn from me.inspect().index · this.me " + MK.KERNEL.version + " · sha256 " + String(MK.state.hash || "").slice(0, 12) + "… verified";
      panel(all, t.idx, last);
      return all;
    }

    function panel(all, idx, last) {
      box.textContent = ""; var n = all[sel], v = idx[sel], ex = v !== undefined ? me.explain(sel) : null, m = last[sel];
      var row = function (k) { var r = el("div", { class: "row" }, box); el("span", { class: "k", text: k }, r); return r; };
      el("code", { class: "pth", text: "me." + sel }, row("path"));
      if (v === undefined) {
        el("span", { text: "branch · " + n.kids.map(function (c) { return c.name; }).join(", ") }, row("children"));
        el("code", { text: 'me("' + sel + '") → undefined' }, row("read")); el("div", { class: "hint", text: "A branch exists because deeper paths were written; it holds no value of its own. Select a leaf to edit it." }, box); return;
      }
      el("code", { text: callFor(sel, m, ex) }, row("written by"));
      var rr = row("value");
      if (m && m.operator === "=") el("code", { text: String(v) }, rr);
      else { var st = el("span", { class: "st" }, rr), minus = el("button", { type: "button", "aria-label": "decrease " + sel, text: "−" }, st),
          inp = el("input", { type: "number", value: v, "aria-label": "value of " + sel, inputmode: "numeric" }, st), plus = el("button", { type: "button", "aria-label": "increase " + sel, text: "+" }, st);
        var set = function (nv) { if (!isFinite(nv)) return; write(sel, nv); };
        minus.onclick = function () { set(Number(inp.value) - 1); }; plus.onclick = function () { set(Number(inp.value) + 1); };
        inp.onchange = function () { set(Number(inp.value)); }; }
      el("code", { text: 'me("' + sel + '") → ' + JSON.stringify(me(sel)) }, row("read"));
      var dependents = deps.filter(function (d) { return d.src === sel; }).map(function (d) { return d.dst; });
      if (ex && ex.derivation) { el("code", { text: ex.expr }, row("expr")); el("span", { text: ex.derivation.inputs.map(function (i) { return i.path + " = " + i.value; }).join(" · ") }, row("inputs")); }
      el("span", { text: dependents.length ? dependents.join(", ") : "none" }, row("dependents"));
      el("code", { text: "me.explain(\"" + sel + "\")" }, row("explain")); el("pre", { text: JSON.stringify(ex, null, 1) }, box);
    }

    function write(path, val) {
      writer(me, path)(val);
      var ex = null; var all = render();
      // pulse: every dependency edge leaving the written path, then the rings of what the kernel says it recomputed
      deps.forEach(function (d) { if (d.src === path) { d.dd.classList.add("burst"); setTimeout(function () { d.dd.classList.remove("burst"); }, 900); } });
      Object.keys(all).forEach(function (k) { var e2 = all[k].ring; if (!e2) return; ex = me.explain(k); if (ex && ex.meta && ex.meta.sourcePath === path) { e2.classList.remove("go"); void e2.getBBox(); e2.classList.add("go"); } });
      var inp = box.querySelector("input"); inp && inp.focus();
    }

    if (fallback) fallback.style.display = "none";
    var s = host.querySelector(".pl-status"); s && s.remove();
    host.appendChild(root); render();
    host.PathsLive = { me: me, select: function (p) { sel = p; render(); }, write: write };
  }

  // the doc renderer keeps the inner markup but not the wrapper's attributes, so the static figure (.pl-static) is the anchor;
  // it may be re-rendered after load, so look again until a live tree sits next to it
  function boot() { document.querySelectorAll(".pl-static").forEach(function (st) { var host = st.parentElement; if (!host || host.__pl) return; host.__pl = 1; mount(host); }); }
  var tries = 0, iv = setInterval(function () { boot(); if (++tries > 40) clearInterval(iv); }, 250);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
