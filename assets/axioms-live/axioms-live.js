// Axioms page (/.me/docs/Axioms.html): every axiom's Demonstration runs live on the unmodified this.me 4.2.1 from npm
// (loaded and sha256-checked in this browser by the shared assets/me-kernel/me-kernel.js).
// The snippet is the page's own text (<div class="axiom-proof" data-axiom="A1"><pre><code>…</code></pre></div>): statements
// run in order on a fresh new ME(); a line "expression //= expected" is evaluated at that point and compared with expected.
// landing-gui.js renders the placeholders through window.AxiomsLive.{AxiomProof, AxiomKernel}. Without JS the code stays.
(function () {
  "use strict";
  var MK = window.MeKernel, KERNEL = MK.KERNEL;   // assets/me-kernel/me-kernel.js, loaded first by the page
  var TEST = "https://github.com/neurons-me/.me/blob/main/Typescript/tests/axioms.test.ts";
  var RUNNER = "https://github.com/neurons-me/.me/blob/main/assets/axioms-live/axioms-live.js";
  var PRELUDE = [
    "const memories = () => me._memories || me.memories || [];",
    "const lastMemory = () => memories()[memories().length - 1];",
    "const secretOf = (path) => (memories().find((m) => m.path === path) || {}).effectiveSecret;",
    "const throws = (f) => { try { f(); return false; } catch (e) { return true; } };",
    "const fnv1a = (s) => { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); } return (\"00000000\" + (h >>> 0).toString(16)).slice(-8); };",
    "const rehash = (m) => fnv1a(JSON.stringify({ path: m.path, operator: m.operator, expression: m.expression, value: m.value, effectiveSecret: m.effectiveSecret, prevHash: m.prevHash ?? \"\" }));"].join("\n");

  // ── kernel (shared loader) ──
  var st = { kernel: { state: "loading" }, results: {}, v: 0 }, subs = new Set();
  function set() { st.v++; subs.forEach(function (f) { f(); }); }
  var ready = MK.load().then(function (ME) { st.kernel = MK.state; set(); return ME; }, function (e) { st.kernel = MK.state; set(); throw e; });

  // ── runner ──
  function parse(code) {
    return code.split("\n").filter(function (l) { return l.trim(); }).map(function (l) {
      var i = l.indexOf("//="); return i < 0 ? { stmt: l } : { expr: l.slice(0, i).trim().replace(/;$/, ""), want: l.slice(i + 3).trim(), src: l };
    });
  }
  function same(a, b) { return typeof a === typeof b && JSON.stringify(a) === JSON.stringify(b); }
  function show(v) { if (v === undefined) return "undefined"; if (typeof v === "function") return "[Function]"; try { return JSON.stringify(v); } catch (e) { return String(v); } }
  function run(ME, code) {
    var lines = parse(code), body = [PRELUDE, "const __r = [];"];
    lines.forEach(function (l) { body.push(l.stmt ? l.stmt : "__r.push((() => { try { return { v: (" + l.expr + ") }; } catch (e) { return { e: String(e && e.message || e) }; } })());"); });
    body.push("return __r;");
    var now = Date.now, t0 = performance.now(), res;
    try { res = new Function("me", body.join("\n"))(new ME()); }
    catch (e) { return { ok: false, error: String(e && e.message || e), checks: [], lines: lines }; }
    finally { Date.now = now; }
    var k = 0, checks = lines.filter(function (l) { return !l.stmt; }).map(function (l) {
      var want = new Function("return (" + l.want + ")")(), r = res[k++];
      return { expr: l.expr, want: want, got: r.v, error: r.e, ok: !r.e && same(r.v, want) };
    });
    return { ok: checks.length > 0 && checks.every(function (c) { return c.ok; }), checks: checks, lines: lines, ms: performance.now() - t0 };
  }
  function prove(id, code) {
    if (st.results[id]) return;
    st.results[id] = { state: "running" };
    ready.then(function (ME) { st.results[id] = Object.assign({ state: "done" }, run(ME, code)); set(); }, function () { st.results[id] = { state: "error" }; set(); });
  }

  // ── components (React, theme colours through the .GUI CSS variables) ──
  var h = function () { return React.createElement.apply(React, arguments); };
  var MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
  var C = { ink: "var(--mui-palette-text-primary, inherit)", ink2: "var(--mui-palette-text-secondary, #888)", line: "var(--mui-palette-divider, rgba(128,128,128,.3))",
    ok: "var(--mui-palette-success-main, #2e9d6e)", bad: "var(--mui-palette-error-main, #e5534b)", acc: "var(--mui-palette-primary-main, #58a6ff)",
    code: "color-mix(in srgb, var(--mui-palette-text-primary, #888) 4%, var(--mui-palette-background-paper, transparent))" };
  function useSt() { React.useSyncExternalStore(function (f) { subs.add(f); return function () { subs.delete(f); }; }, function () { return st.v; }); return st; }
  function syn(code) { return window.MeSyntax ? h("span", { className: "me-code", style: { whiteSpace: "pre-wrap" } }, window.MeSyntax.render(h, code)) : code; }

  function AxiomProof(p) {
    var s = useSt(), id = p.axiom, code = p.code || "";
    React.useEffect(function () { prove(id, code); }, [id, code]);
    var r = s.results[id] || { state: "running" }, lines = parse(code), k = 0;
    var rows = lines.map(function (l, i) {
      if (l.stmt) return h("div", { key: i, style: { padding: "1px 0" } }, syn(l.stmt));
      var c = r.state === "done" && r.checks[k++];
      return h("div", { key: i, "data-check": c ? (c.ok ? "ok" : "fail") : "pending", style: { display: "flex", flexWrap: "wrap", alignItems: "baseline", columnGap: 10, padding: "1px 0" } },
        h("span", { style: { minWidth: 0 } }, syn(l.expr)),
        h("span", { style: { color: C.ink2, whiteSpace: "nowrap" } }, "→ ",
          c ? h("b", { style: { color: c.ok ? C.ok : C.bad, fontWeight: 600 } }, c.error ? "throws: " + c.error : show(c.got)) : "…",
          c && !c.ok ? h("span", null, "  (expected " + show(c.want) + ")") : null,
          c ? h("span", { "aria-label": c.ok ? "holds" : "fails", style: { marginLeft: 8, color: c.ok ? C.ok : C.bad, fontWeight: 700 } }, c.ok ? "✓" : "✗") : null));
    });
    var n = r.checks ? r.checks.length : 0, good = r.checks ? r.checks.filter(function (c) { return c.ok; }).length : 0;
    var foot = r.state === "running" ? (s.kernel.state === "error" ? "The kernel did not load, so this demonstration did not run." : "Running on " + KERNEL.label + "…")
      : r.state === "error" ? "The kernel did not load, so this demonstration did not run."
      : r.error ? "✗ The snippet threw: " + r.error
      : r.ok ? "∎ Q.E.D. — " + good + "/" + n + " checks hold on " + KERNEL.label + ", run in this browser (" + r.ms.toFixed(1) + " ms)."
      : "✗ " + (n - good) + " of " + n + " checks do not hold on " + KERNEL.label + ".";
    var col = r.state !== "done" ? C.ink2 : r.ok ? C.ok : C.bad;
    return h("div", { className: "axiom-proof-live", "data-axiom": id, "data-result": r.state !== "done" ? r.state : r.ok ? "qed" : "fail",
        style: { margin: "4px 0 16px", border: "1px solid " + C.line, borderRadius: 10, overflow: "hidden", background: C.code } },
      h("div", { style: { display: "flex", justifyContent: "space-between", gap: 8, padding: "6px 12px", borderBottom: "1px solid " + C.line, font: "700 11px/1.4 " + MONO, letterSpacing: ".08em", textTransform: "uppercase", color: C.ink2 } },
        h("span", null, "Demonstration"), h("span", { style: { fontWeight: 400, letterSpacing: 0, textTransform: "none" } }, "live · new ME() · " + KERNEL.label)),
      h("div", { style: { padding: "10px 12px", font: "12.5px/1.6 " + MONO, color: C.ink, overflowX: "auto" } }, rows),
      h("div", { style: { padding: "6px 12px 8px", borderTop: "1px solid " + C.line, font: "600 12px/1.5 " + MONO, color: col } }, foot));
  }

  function AxiomKernel() {
    var s = useSt(), k = s.kernel, ids = Object.keys(s.results), done = ids.filter(function (i) { return s.results[i].state === "done"; }),
      qed = done.filter(function (i) { return s.results[i].ok; }).length;
    var a = function (href, t) { return h("a", { href: href, target: "_blank", rel: "noopener", style: { color: C.acc, textDecoration: "none" } }, t); };
    var sum = k.state === "ok" ? [h("b", { key: "l" }, KERNEL.label), " · sha256 " + k.hash.slice(0, 12) + "… verified in this browser · ",
        h("b", { key: "q", style: { color: done.length && qed === done.length ? C.ok : done.length ? C.bad : C.ink2 } }, qed + "/" + (ids.length || 11) + " axioms demonstrated")]
      : k.state === "error" ? [h("b", { key: "e", style: { color: C.bad } }, "Kernel not loaded: "), k.text] : ["Loading " + KERNEL.label + " and checking its sha256…"];
    var row = function (l, v) { return h("div", { key: l, style: { display: "grid", gridTemplateColumns: "70px minmax(0,1fr)", gap: 8, padding: "4px 0", borderTop: "1px solid " + C.line } }, h("span", { style: { color: C.ink2 } }, l), h("span", { style: { minWidth: 0, overflowWrap: "anywhere" } }, v)); };
    return h("details", { className: "axiom-kernel-live", "data-kernel": k.state, style: { margin: "0 0 24px", border: "1px solid " + C.line, borderRadius: 10, padding: "8px 12px", font: "12px/1.5 " + MONO, color: C.ink } },
      h("summary", { style: { cursor: "pointer", color: C.ink2 } }, h("span", { style: { color: C.ink2 } }, "Kernel · "), sum),
      h("div", { style: { marginTop: 8 } },
        row("kernel", h("span", null, a(KERNEL.npm, KERNEL.label), " · unmodified, from npm · ", k.url ? k.url : KERNEL.urls.join(" or "))),
        row("sha256", KERNEL.sha256 + (k.state === "ok" ? " ✓" : "")),
        row("helpers", h("pre", { style: { margin: 0, whiteSpace: "pre-wrap", font: "inherit" } }, syn(PRELUDE))),
        row("source", h("span", null, a(RUNNER, "axioms-live.js"), " (this runner) · ", a(TEST, "axioms.test.ts"), " (the Node test)"))));
  }
  window.AxiomsLive = { AxiomProof: AxiomProof, AxiomKernel: AxiomKernel, run: run, parse: parse, KERNEL: KERNEL };
})();
