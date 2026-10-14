// Shared loader for the live doc pages: the unmodified this.me 4.2.1 from npm (jsDelivr, unpkg fallback), sha256 checked
// in this browser before import (as on the Robots in Space / Affinity pages). window.MeKernel.load() → Promise<ME>;
// the first call fetches, later calls share it. state: loading | ok | error (+ hash, url, text); subscribe(fn) for changes.
(function () {
  "use strict";
  if (window.MeKernel) return;
  var KERNEL = { version: "4.2.1", label: "this.me@4.2.1", sha256: "0bd2cc60d15dfc9ff8942d390c075bbc22b4ae3a24d3cbfe581511ea84478757",
    urls: ["https://cdn.jsdelivr.net/npm/this.me@4.2.1/dist/me.es.js", "https://unpkg.com/this.me@4.2.1/dist/me.es.js"], npm: "https://www.npmjs.com/package/this.me/v/4.2.1" };
  var state = { state: "idle" }, subs = new Set(), promise = null;
  function set(s) { state = s; subs.forEach(function (f) { f(); }); }
  function sha256Hex(buf) { return crypto.subtle.digest("SHA-256", buf).then(function (d) { return Array.from(new Uint8Array(d)).map(function (b) { return b.toString(16).padStart(2, "0"); }).join(""); }); }
  function fetchKernel() {
    var errors = [], i = 0;
    function next() {
      if (i >= KERNEL.urls.length) return Promise.reject(new Error("could not load " + KERNEL.label + ": " + errors.join(" | ")));
      var url = KERNEL.urls[i++], text;
      return fetch(url, { cache: "force-cache" }).then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.text(); })
        .then(function (t) { text = t; return sha256Hex(new TextEncoder().encode(t)); })
        .then(function (hash) {
          if (hash !== KERNEL.sha256) throw new Error("sha256 mismatch: got " + hash);
          var blob = URL.createObjectURL(new Blob([text], { type: "text/javascript" }));
          return import(blob).then(function (mod) { URL.revokeObjectURL(blob); return { ME: mod.default || mod.ME, hash: hash, url: url }; });
        })
        .catch(function (e) { errors.push(url + ": " + (e && e.message || e)); return next(); });
    }
    return next();
  }
  function load() {
    if (!promise) { set({ state: "loading" });
      promise = fetchKernel().then(function (k) { set({ state: "ok", hash: k.hash, url: k.url }); return k.ME; },
        function (e) { set({ state: "error", text: String(e && e.message || e) }); throw e; }); }
    return promise;
  }
  window.MeKernel = { KERNEL: KERNEL, load: load, get state() { return state; }, subscribe: function (f) { subs.add(f); return function () { subs.delete(f); }; } };
})();
