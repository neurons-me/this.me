// Runnable .me code blocks on doc pages: a fenced block marked {: .me-run} gets a Run button. Run executes, on one fresh
// new ME() from this.me 4.2.1 (assets/me-kernel/me-kernel.js, sha256-checked), every runnable block of the page up to and
// including this one, in page order (later blocks build on earlier ones, as the page reads); the output panel lists what
// each read in this block returned (lines starting me(, me.explain(, me.inspect() and any error, line by line.
// `import …` and `const me = new ME()` lines are shown but not run: the page provides me. landing-gui.js renders the
// blocks through window.MeRun.MeRunBlock; without JS they stay plain code.
(function () {
  "use strict";
  var MK = window.MeKernel, codes = [];
  var h = function () { return React.createElement.apply(React, arguments); };
  var MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
  var C = { ink: "var(--mui-palette-text-primary, inherit)", ink2: "var(--mui-palette-text-secondary, #888)", line: "var(--mui-palette-divider, rgba(128,128,128,.3))",
    ok: "var(--mui-palette-success-main, #2e9d6e)", bad: "var(--mui-palette-error-main, #e5534b)", acc: "var(--mui-palette-primary-main, #58a6ff)",
    code: "color-mix(in srgb, var(--mui-palette-text-primary, #888) 4%, var(--mui-palette-background-paper, transparent))" };
  var SKIP = /^\s*(import\s|const\s+me\s*=\s*new\s+ME\b)/, READ = /^\s*me(\(|\.explain\(|\.inspect\(|\.as\()/;
  // a trailing // comment after code (the line's own expected value) is not part of the statement
  function strip(line) { return line.replace(/([;)\]])\s+\/\/.*$/, "$1").replace(/;\s*$/, "").trim(); }
  function show(v) {
    if (v === undefined) return "undefined"; if (typeof v === "function") return "[proxy]";
    try { var s = JSON.stringify(v); if (s.length <= 120 || typeof v !== "object") return s.length > 400 ? s.slice(0, 400) + " …" : s;
      s = JSON.stringify(v, null, 2); return s.length > 8000 ? s.slice(0, 8000) + "\n…" : s; } catch (e) { return String(v); }
  }
  function runLines(me, code, collect) {
    var out = [];
    code.split("\n").forEach(function (raw, n) {
      if (!raw.trim() || /^\s*\/\//.test(raw) || SKIP.test(raw)) return;
      var src = strip(raw), isRead = READ.test(src);
      try {
        var v = isRead ? new Function("me", "return (" + src + ");")(me) : new Function("me", src + ";")(me);
        if (collect && isRead) out.push({ n: n, src: src, value: show(v) });
      } catch (e) { out.push({ n: n, src: src, error: String(e && e.message || e) }); }
    });
    return out;
  }
  // Shared mode (a page sets window.MeRunShared = true): one new ME() for the whole page. Run executes the earlier
  // blocks that have not run yet, once, then this block, on that same instance; each run fires "me-run" on window
  // with { me, idx } so a live figure can redraw from the kernel.
  var shared = null, ran = {};
  function runShared(idx) {
    return MK.load().then(function (ME) {
      if (!shared) shared = new ME();
      var t0 = performance.now(), pre = [], before = 0, out;
      for (var i = 0; i < idx; i++) if (!ran[i] && codes[i] != null) { before++; ran[i] = 1; runLines(shared, codes[i], false).forEach(function (r) { if (r.error) pre.push(r); }); }
      out = runLines(shared, codes[idx], true); ran[idx] = 1;
      try { window.dispatchEvent(new CustomEvent("me-run", { detail: { me: shared, idx: idx, ran: Object.keys(ran).map(Number) } })); } catch (e) {}
      return { out: out, pre: pre, ms: performance.now() - t0, before: before, shared: true };
    });
  }
  function runUpTo(idx) {
    if (window.MeRunShared) return runShared(idx);
    return MK.load().then(function (ME) {
      var me = new ME(), t0 = performance.now(), pre = [], out;
      for (var i = 0; i < idx; i++) runLines(me, codes[i], false).forEach(function (r) { if (r.error) pre.push(r); });
      out = runLines(me, codes[idx], true);
      return { out: out, pre: pre, ms: performance.now() - t0, before: idx };
    });
  }
  function MeRunBlock(p) {
    var idx = p.idx, code = p.code;
    codes[idx] = code;
    var st = React.useState(null), res = st[0], setRes = st[1], o = React.useState(true), open = o[0], setOpen = o[1];
    var ks = React.useSyncExternalStore(MK.subscribe, function () { return MK.state; });
    var run = function () { setRes({ running: true }); setOpen(true); runUpTo(idx).then(setRes, function (e) { setRes({ fail: String(e && e.message || e) }); }); };
    var errs = res && res.out ? res.out.filter(function (r) { return r.error; }).length + res.pre.length : 0;
    var btn = h("button", { type: "button", onClick: run, disabled: !!(res && res.running), "data-me-run": "button", "aria-label": "Run this code on this.me 4.2.1",
        style: { position: "absolute", top: 8, right: 8, font: "600 11px/1 " + MONO, padding: "5px 9px", borderRadius: 6, cursor: "pointer", color: C.acc,
          background: "var(--mui-palette-background-paper, transparent)", border: "1px solid color-mix(in srgb, " + C.acc + " 45%, transparent)" } },
      res && res.running ? "Running…" : res ? "▶ Run again" : "▶ Run");
    var panel = res && !res.running && h("details", { open: open, onToggle: function (e) { setOpen(e.currentTarget.open); }, "data-me-run": "output", "data-errors": String(errs),
        style: { borderTop: "1px solid " + C.line, padding: "6px 14px 8px", font: "12px/1.55 " + MONO, color: C.ink } },
      h("summary", { style: { cursor: "pointer", color: res.fail || errs ? C.bad : C.ink2 } },
        res.fail ? "Kernel not loaded: " + res.fail
          : "Output · " + res.out.filter(function (r) { return !r.error; }).length + " read" + (res.out.length === 1 ? "" : "s") + (errs ? " · " + errs + " error" + (errs > 1 ? "s" : "") : "") +
            (res.shared ? " · shared new ME(), this.me " + MK.KERNEL.version + (res.before ? " · ran " + res.before + " earlier block" + (res.before > 1 ? "s" : "") + " first" : "") : " · fresh new ME(), this.me " + MK.KERNEL.version + (res.before ? " · after the " + res.before + " block" + (res.before > 1 ? "s" : "") + " above" : "")) + " · " + res.ms.toFixed(1) + " ms"),
      res.out && h("div", { style: { marginTop: 6 } },
        res.pre.map(function (r, i) { return h("div", { key: "p" + i, style: { color: C.bad } }, "an earlier block failed: " + r.src + " → " + r.error); }),
        res.out.length ? res.out.map(function (r, i) {
          return h("div", { key: i, style: { display: "flex", flexWrap: "wrap", columnGap: 10, padding: "1px 0" } },
            h("span", { className: "me-code" }, window.MeSyntax ? window.MeSyntax.render(h, r.src) : r.src),
            !r.error && /\n/.test(r.value) ? h("pre", { style: { margin: "2px 0 0", flexBasis: "100%", maxHeight: 340, overflow: "auto", font: "inherit", color: C.ok, whiteSpace: "pre" } }, r.value)
              : h("span", { style: { color: r.error ? C.bad : C.ok, overflowWrap: "anywhere", minWidth: 0 } }, "→ ", r.error ? "error: " + r.error : r.value));
        }) : h("div", { style: { color: C.ink2 } }, "Ran without errors (this block has no reads).")));
    return h("div", { "data-me-run": "block", "data-run-idx": String(idx), style: { position: "relative", margin: "0 0 20px", border: "1px solid " + C.line, borderRadius: 10, overflow: "hidden", background: C.code } },
      btn,
      h("pre", { className: "me-code", style: { margin: 0, padding: "12px 16px", paddingRight: 100, overflowX: "auto", font: "13px/1.6 " + MONO, color: C.ink } },
        h("code", { style: { fontFamily: "inherit", whiteSpace: "pre" } }, window.MeSyntax ? window.MeSyntax.render(h, code) : code)),
      panel);
  }
  window.MeRun = { MeRunBlock: MeRunBlock, runUpTo: runUpTo, codes: codes, shared: function () { return shared; } };
})();
