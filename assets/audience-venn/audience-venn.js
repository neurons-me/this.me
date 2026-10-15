/*! audience-venn 1.0.0 · a live OR audience on the real this.me 4.2.1 · MIT · neurons.me
 * Three identities (ana, bob, eve) around one content key. Toggling a circle changes the audience; every change runs, in
 * this browser, the unmodified this.me 4.2.1 from npm (window.MeKernel: jsDelivr, unpkg fallback, sha256 checked before
 * import): one P-256 key pair per party (ME.generateP256KeyPair, made once), a fresh random content key, one
 * ME.wrapSecretV1 per member (OR), then every party tries ME.unwrapSecretV1. Members open their own wrap; non-members try
 * a member's wrap with their own key and the kernel's real error is shown. Nothing on the figure is pre-computed.
 * Markup: <div class="audience-venn"></div> on a gui-doc page loading /assets/me-kernel/me-kernel.js; landing-gui.js
 * mounts window.AudienceVenn in its place.
 */
(function (root) {
  "use strict";
  var React = root.React; if (!React) return;
  var h = React.createElement, useState = React.useState, useEffect = React.useEffect, useRef = React.useRef;
  var MONO = "ui-monospace,SFMono-Regular,Menlo,Consolas,monospace";
  var P = "var(--mui-palette-primary-main, #2aa)", ERR = "var(--mui-palette-error-main, #d33)", TXT = "var(--mui-palette-text-primary, currentColor)",
    TX2 = "var(--mui-palette-text-secondary, #8b949e)", DIV = "var(--mui-palette-divider, rgba(128,128,128,.35))";
  var CSS = ".av{margin:0 0 28px}.av svg{display:block;width:100%;max-width:520px;height:auto;margin:0 auto}" +
    ".av-p{cursor:pointer;outline:none}.av-p:focus-visible circle.ring{stroke-width:3.5}" +
    ".av-bar{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin:8px 0 10px}" +
    ".av-btn{font:600 12.5px " + MONO + ";padding:4px 12px;border-radius:999px;border:1px solid " + DIV + ";background:transparent;color:" + TXT + ";cursor:pointer}" +
    ".av-btn[aria-pressed=true]{border-color:" + P + ";background:color-mix(in srgb," + P + " 14%,transparent)}" +
    ".av-k{text-align:center;font:12.5px " + MONO + ";color:" + TX2 + ";margin:2px 0 8px}.av-k b{color:" + TXT + "}" +
    ".av-log{margin:0 auto;max-width:680px;padding:10px 12px;border-radius:8px;border:1px solid " + DIV + ";font:12px/1.6 " + MONO + ";white-space:pre-wrap;word-break:break-all;color:" + TXT + ";background:color-mix(in srgb," + TXT + " 4%,transparent)}" +
    ".av-compact .av-btn{font-size:11.5px;padding:3px 10px}.av-more summary{list-style:none}.av-more summary::-webkit-details-marker{display:none}" +
    ".av-log .ok{color:var(--mui-palette-success-main,#2e9d6e)}.av-log .no{color:" + ERR + "}.av-log .dim{color:" + TX2 + "}";
  var NAMES = ["ana", "bob", "eve"], POS = { ana: [190, 130], bob: [330, 130], eve: [260, 245] }, R = 100;
  var short = function (s) { return s.length > 14 ? s.slice(0, 8) + "…" + s.slice(-4) : s; };
  function randomKey() { var b = new Uint8Array(16); crypto.getRandomValues(b); return "k_" + Array.from(b, function (x) { return x.toString(16).padStart(2, "0"); }).join(""); }

  function AudienceVenn(props) {
    var compact = !!(props && props.compact);
    var _s = useState({ ana: true, bob: true, eve: false }), sel = _s[0], setSel = _s[1];
    var _r = useState(null), res = _r[0], setRes = _r[1];
    var _st = useState("loading this.me 4.2.1…"), st = _st[0], setSt = _st[1];
    var keys = useRef(null), runId = useRef(0);
    useEffect(function () {
      if (!document.getElementById("av-css")) { var s = document.createElement("style"); s.id = "av-css"; s.textContent = CSS; document.head.appendChild(s); }
    }, []);
    useEffect(function () {
      var id = ++runId.current;
      (async function () {
        try {
          var ME = await root.MeKernel.load(), k = root.MeKernel.state;
          if (!keys.current) { keys.current = {}; for (var i = 0; i < NAMES.length; i++) keys.current[NAMES[i]] = await ME.generateP256KeyPair(); }
          var members = NAMES.filter(function (n) { return sel[n]; }), K = randomKey(), wraps = {}, log = [], out = {}, t0 = performance.now();
          for (var m = 0; m < members.length; m++) {
            var n = members[m];
            wraps[n] = await ME.wrapSecretV1({ secret: K, recipientPublicKey: keys.current[n].publicKey, kid: n, class: "identity-key" });
            log.push({ c: "dim", t: "wrapSecretV1(K → " + n + ") → { " + Object.keys(wraps[n]).join(", ") + " }" });
          }
          for (var j = 0; j < NAMES.length; j++) {
            var who = NAMES[j], target = sel[who] ? who : members[0];
            if (!target) { out[who] = { ok: false, text: "no wrap exists" }; log.push({ c: "no", t: who + ": nothing to open (empty audience)" }); continue; }
            try {
              var got = await ME.unwrapSecretV1(wraps[target], keys.current[who].privateKey, "utf8");
              out[who] = { ok: got === K, text: short(got) };
              log.push({ c: "ok", t: "unwrapSecretV1(W_" + target + ", " + who + ") → \"" + short(got) + "\"" + (got === K ? "  = K" : "") });
            } catch (e) {
              var msg = (e && e.name || "Error") + (e && e.message && e.message !== e.name ? ": " + e.message : "");
              out[who] = { ok: false, text: msg };
              log.push({ c: "no", t: "unwrapSecretV1(W_" + target + ", " + who + ") → throws " + msg });
            }
          }
          if (id !== runId.current) return;
          setRes({ K: K, out: out, log: log, ms: performance.now() - t0, members: members });
          setSt("this.me 4.2.1 · " + (k && k.url ? k.url.replace(/^https:\/\//, "").split("/")[0] : "npm") + " · sha256 " + (k && k.hash ? k.hash.slice(0, 8) + "…" + k.hash.slice(-6) : "") + " checked");
        } catch (e) { if (id === runId.current) setSt("kernel error: " + (e && e.message || e)); }
      })();
    }, [sel.ana, sel.bob, sel.eve]);
    var toggle = function (n) { var o = Object.assign({}, sel); o[n] = !o[n]; setSel(o); };
    var circles = NAMES.map(function (n) {
      var p = POS[n], on = sel[n], r = res && res.out[n];
      return h("g", { key: n, className: "av-p", role: "button", tabIndex: 0, "aria-pressed": on, "aria-label": n + (on ? " in the audience" : " not in the audience"), "data-party": n,
          onClick: function () { toggle(n); }, onKeyDown: function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(n); } } },
        h("circle", { className: "ring", cx: p[0], cy: p[1], r: R, fill: on ? "color-mix(in srgb, " + P + " 16%, transparent)" : "transparent", stroke: on ? P : DIV, strokeWidth: 2, strokeDasharray: on ? null : "6 6" }));
    });
    var labels = NAMES.map(function (n) {
      var p = POS[n], on = sel[n], r = res && res.out[n], lx = n === "ana" ? p[0] - 48 : n === "bob" ? p[0] + 48 : p[0], ly = n === "eve" ? p[1] + 52 : p[1] - 38;
      return h("g", { key: n + "l", pointerEvents: "none" },
        h("text", { x: lx, y: ly, textAnchor: "middle", fontFamily: MONO, fontWeight: 700, fontSize: 17, fill: on ? P : TX2 }, n),
        r && !r.ok ? h("line", { x1: lx - 22, y1: ly - 6, x2: lx + 22, y2: ly - 6, stroke: ERR, strokeWidth: 2.5 }) : null,
        h("text", { x: lx, y: ly + 18, textAnchor: "middle", fontFamily: MONO, fontSize: 10.5, fill: r ? (r.ok ? "var(--mui-palette-success-main,#2e9d6e)" : ERR) : TX2 },
          r ? (r.ok ? "🔑 " + r.text : (r.text.length > 26 ? r.text.slice(0, 24) + "…" : r.text)) : "…"));
    });
    var c = [260, 168], any = res && res.members.length > 0;
    var lock = h("g", { pointerEvents: "none", transform: "translate(" + (c[0] - 14) + " " + (c[1] - 18) + ")" },
      h("path", { d: "M6 14 V9 a8 8 0 0 1 16 0 V14", fill: "none", stroke: any ? P : TX2, strokeWidth: 3 }),
      h("rect", { x: 1, y: 14, width: 26, height: 20, rx: 4, fill: any ? P : TX2 }),
      h("circle", { cx: 14, cy: 23, r: 2.6, fill: "var(--mui-palette-background-paper, #fff)" }));
    var log = h("pre", { className: "av-log", "aria-live": "polite" }, res ? [h("span", { key: "h", className: "dim" }, st + "\n")].concat(res.log.map(function (l, i) { return h("span", { key: i, className: l.c }, l.t + "\n"); })) : st);
    return h("figure", { className: "av" + (compact ? " av-compact" : ""), "data-compact": compact ? "1" : null, style: { margin: compact ? "0 0 12px" : "0 0 28px" } },
      h("svg", { style: compact ? { maxWidth: 300 } : null, viewBox: "40 10 440 330", role: "group", "aria-label": "OR audience: click a circle to add or remove that identity" }, circles, lock, labels),
      h("div", { className: "av-bar" }, NAMES.map(function (n) { return h("button", { key: n, type: "button", className: "av-btn", "aria-pressed": !!sel[n], onClick: function () { toggle(n); } }, (sel[n] ? "✓ " : "+ ") + n); })),
      h("div", { className: "av-k" }, res ? h(React.Fragment, null, "K = ", h("b", null, short(res.K)), " · audience { " + res.members.join(", ") + " } · " + res.ms.toFixed(1) + " ms") : st),
      compact ? h("details", { className: "av-more" }, h("summary", { className: "av-k", style: { cursor: "pointer" } }, "kernel log"), log) : log);
  }
  root.AudienceVenn = AudienceVenn;
})(window);
