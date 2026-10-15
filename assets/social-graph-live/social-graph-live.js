// Live figure for docs/Social-Graph.md: reads the page's shared this.me 4.2.1 kernel (assets/me-run, window.MeRunShared)
// after every Run and draws owner, users, friend pointers and the private contact. Owner / guest toggles the reader:
// guest reads go through me.as(null), so the stealth contact disappears. Every label is a kernel read, nothing is mirrored.
(function () {
  "use strict";
  window.MeRunShared = true;
  var h = function () { return React.createElement.apply(React, arguments); };
  var MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
  var C = { ink: "var(--mui-palette-text-primary,#c9d1d9)", ink2: "var(--mui-palette-text-secondary,#8b949e)", line: "var(--mui-palette-divider,rgba(128,128,128,.35))",
    acc: "var(--mui-palette-primary-main,#58a6ff)", ok: "var(--mui-palette-success-main,#2e9d6e)", warn: "var(--mui-palette-warning-main,#d29922)",
    paper: "var(--mui-palette-background-paper,transparent)", bad: "var(--mui-palette-error-main,#e5534b)" };
  var USERS = [["ana", 120, 60], ["pablo", 360, 60], ["luisa", 360, 200]];
  var OWNER = [200, 140], CONTACT = [60, 200];
  // new nodes / edges pop in when the kernel first holds them (CSS animation on mount); ring / fill changes fade
  var CSS = "@keyframes sgPop{0%{opacity:0;transform:scale(.3)}70%{opacity:1;transform:scale(1.12)}100%{transform:scale(1)}}" +
    "@keyframes sgDraw{from{stroke-dashoffset:120;opacity:0}to{stroke-dashoffset:0;opacity:1}}@keyframes sgFade{from{opacity:0}to{opacity:1}}" +
    ".sg-in{transform-box:fill-box;transform-origin:center;animation:sgPop .55s cubic-bezier(.2,.9,.3,1.3) both}" +
    ".sg-edge{animation:sgDraw .7s ease-out both}.sg-fade{animation:sgFade .5s ease-out both}" +
    "[data-sg-node] circle,[data-sg-node] rect{transition:stroke .45s,fill .45s,stroke-width .45s}" +
    ".sg-panel{border:1px solid var(--mui-palette-divider,rgba(128,128,128,.3));border-radius:12px;background:var(--mui-palette-background-paper,transparent);font-size:13px;overflow:hidden;margin:0 0 20px}" +
    ".sg-sec{padding:10px 12px;border-top:1px solid var(--mui-palette-divider,rgba(128,128,128,.25))}.sg-sec:first-child{border-top:0}" +
    ".sg-h{margin:0 0 6px;font:700 11px/1.3 system-ui,sans-serif;letter-spacing:.07em;text-transform:uppercase;color:var(--mui-palette-text-secondary,#8b949e)}" +
    "@media (prefers-reduced-motion:reduce){.sg-in,.sg-edge,.sg-fade{animation:none}}";
  function read(me, guest, p) { try { return guest ? me.as(null)(p) : me(p); } catch (e) { return undefined; } }
  function SocialGraphLive() {
    var s = React.useState(0), bump = s[1], g = React.useState(false), guest = g[0], setGuest = g[1];
    var mob = React.useState(false), mobile = mob[0], setMobile = mob[1];
    React.useEffect(function () { var f = function () { bump(function (x) { return x + 1; }); }; window.addEventListener("me-run", f); return function () { window.removeEventListener("me-run", f); }; }, []);
    React.useEffect(function () { if (!document.getElementById("sg-css")) { var st = document.createElement("style"); st.id = "sg-css"; st.textContent = CSS; document.head.appendChild(st); } }, []);
    // narrow screens: a compact figure (the panel sits on top of the steps there, not in a sticky sidebar)
    React.useEffect(function () { var f = function () { setMobile(window.innerWidth < 1000); }; f(); window.addEventListener("resize", f); return function () { window.removeEventListener("resize", f); }; }, []);
    var me = window.MeRun && window.MeRun.shared && window.MeRun.shared();
    var R = function (p) { return me ? read(me, guest, p) : undefined; };
    var owner = R("profile.name"), handle = me ? (function () { try { return guest ? null : me("@"); } catch (e) { return null; } })() : null;
    var nodes = [], edges = [], log = [];
    USERS.forEach(function (u) {
      var name = R("users." + u[0] + ".name"); if (name === undefined) return;
      var age = R("users." + u[0] + ".age"), adult = R("users." + u[0] + ".isAdult"), inv = R("users." + u[0] + ".canInvite"), fr = R("friends." + u[0] + ".name");
      nodes.push({ id: u[0], x: u[1], y: u[2], name: name, age: age, adult: adult, inv: inv });
      if (fr !== undefined) edges.push(u[0]);
    });
    var nr = R("contacts.ana.needsReply");
    var adults = R("friends[isAdult == true].name"), invites = R("friends[canInvite == true].name");
    var J = function (v) { return v === undefined ? "undefined" : JSON.stringify(v); };
    var pill = function (on, label, click, key) { return h("button", { key: key, type: "button", onClick: click, "aria-pressed": on ? "true" : "false", "data-sg": key,
      style: { font: "600 12px/1 " + MONO, padding: "6px 10px", borderRadius: 999, cursor: "pointer", border: "1px solid " + (on ? C.acc : C.line), color: on ? C.ink : C.ink2,
        background: on ? "color-mix(in srgb," + C.acc + " 14%, transparent)" : "transparent" } }, label); };
    var node = function (n) {
      return h("g", { key: n.id, className: "sg-in", "data-sg-node": n.id, "data-adult": String(!!n.adult), "data-invite": String(!!n.inv) },
        h("circle", { cx: n.x, cy: n.y, r: 30, fill: n.inv ? "color-mix(in srgb," + C.ok + " 22%, transparent)" : C.paper, stroke: n.adult ? C.ok : C.line, strokeWidth: n.adult ? 2.5 : 1.2 }),
        h("text", { x: n.x, y: n.y - 2, textAnchor: "middle", style: { font: "600 13px " + MONO, fill: C.ink } }, n.name),
        h("text", { x: n.x, y: n.y + 14, textAnchor: "middle", style: { font: "11px " + MONO, fill: C.ink2 } }, "age " + (n.age === undefined ? "?" : n.age)),
        n.inv ? h("text", { key: "inv", className: "sg-fade", x: n.x, y: n.y - 36, textAnchor: "middle", style: { font: "600 10px " + MONO, fill: C.ok } }, "canInvite") : null);
    };
    var figure = function (maxH) { return h("svg", { viewBox: "0 0 440 250", role: "img", "aria-label": "The social graph as the kernel holds it", style: { width: "100%", maxWidth: 520, maxHeight: maxH || null, display: "block", margin: "0 auto" } },
      edges.map(function (id) { var u = nodes.filter(function (n) { return n.id === id; })[0]; var dx = u.x - OWNER[0], dy = u.y - OWNER[1], L = Math.hypot(dx, dy); return h("line", { key: "e" + id, className: "sg-edge", "data-sg-edge": id, x1: OWNER[0] + dx / L * 36, y1: OWNER[1] + dy / L * 36, x2: u.x - dx / L * 32, y2: u.y - dy / L * 32, stroke: C.acc, strokeWidth: 1.6, strokeDasharray: "5 4" }); }),
      edges.length ? h("text", { key: "el", className: "sg-fade", x: 262, y: 104, style: { font: "10px " + MONO, fill: C.acc } }, "friends.*[\"->\"]") : null,
      (nr !== undefined) ? h("line", { key: "ec", className: "sg-edge", x1: OWNER[0] - 32, y1: OWNER[1] + 14, x2: CONTACT[0] + 42, y2: CONTACT[1] - 8, stroke: C.warn, strokeWidth: 1.2, strokeDasharray: "2 3" }) : null,
      nodes.map(node),
      h("g", { key: "owner", "data-sg-node": "owner" }, h("circle", { cx: OWNER[0], cy: OWNER[1], r: 34, fill: "color-mix(in srgb," + C.acc + " 14%, transparent)", stroke: C.acc, strokeWidth: 2 }),
        h("text", { x: OWNER[0], y: OWNER[1] - 2, textAnchor: "middle", style: { font: "700 12px " + MONO, fill: C.ink } }, owner === undefined ? (me ? "–" : "not run") : owner),
        h("text", { x: OWNER[0], y: OWNER[1] + 14, textAnchor: "middle", style: { font: "11px " + MONO, fill: C.ink2 } }, handle ? "@" + handle : guest ? "guest view" : "owner")),
      (me && (nr !== undefined || guest)) ? h("g", { key: "contact" + (nr === undefined), className: "sg-in", "data-sg-node": "contact", "data-hidden": String(nr === undefined) },
        h("rect", { x: CONTACT[0] - 42, y: CONTACT[1] - 22, width: 84, height: 44, rx: 8, fill: C.paper, stroke: nr === undefined ? C.line : C.warn, strokeDasharray: nr === undefined ? "4 3" : "none" }),
        h("text", { x: CONTACT[0], y: CONTACT[1] - 4, textAnchor: "middle", style: { font: "600 11px " + MONO, fill: nr === undefined ? C.ink2 : C.ink } }, nr === undefined ? "🔒 hidden" : "contacts.ana"),
        h("text", { x: CONTACT[0], y: CONTACT[1] + 12, textAnchor: "middle", style: { font: "10px " + MONO, fill: C.ink2 } }, nr === undefined ? "undefined" : "needsReply " + J(nr))) : null); };
    var fig = figure();
    var row = function (k, v) { return h("div", { key: k, style: { display: "flex", flexWrap: "wrap", columnGap: 8 } }, h("span", { className: "me-code" }, window.MeSyntax ? window.MeSyntax.render(h, k) : k), h("span", { style: { color: C.ok, overflowWrap: "anywhere" } }, "→ " + v)); };
    var pre = guest ? "me.as(null)" : "me";
    var toggles = [pill(!guest, "owner", function () { setGuest(false); }, "owner"), pill(guest, mobile ? "guest" : "guest · me.as(null)", function () { setGuest(true); }, "guest")];
    // panel as on the Smart Cities demos (AntCity .ac-panel): figure, then owner / guest, the live reads and the legend
    return h("aside", { className: "sg-panel", "data-sg": "graph", "aria-label": "Live social graph" },
      h("div", { className: "sg-sec" }, h("div", { className: "sg-h" }, "Live graph · read on this.me 4.2.1"), figure(mobile ? 200 : null)),
      h("div", { className: "sg-sec", style: { display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" } }, h("span", { className: "sg-h", style: { margin: "0 auto 0 0" } }, "Reader"), toggles),
      h("div", { className: "sg-sec", style: { font: "12px/1.6 " + MONO, color: C.ink2 } },
        h("div", { className: "sg-h" }, "Live reads"),
        !me ? h("div", null, "Press ▶ Run on any step; the figure reads the same kernel.") : [
          row(pre + '("friends[isAdult == true].name")', J(adults)),
          row(pre + '("friends[canInvite == true].name")', J(invites)),
          row(pre + '("contacts.ana.needsReply")', J(nr))]),
      h("div", { className: "sg-sec", style: { font: "11px/1.5 " + MONO, color: C.ink2 } }, "green ring = isAdult · green fill = canInvite · dashed = pointer"));
  }
  window.SocialGraphLive = SocialGraphLive;
})();
