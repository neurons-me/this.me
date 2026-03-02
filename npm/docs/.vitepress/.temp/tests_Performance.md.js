import { ssrRenderAttrs, ssrRenderStyle } from "vue/server-renderer";
import { useSSRContext } from "vue";
import { _ as _export_sfc } from "./plugin-vue_export-helper.1tPrXgE0.js";
const __pageData = JSON.parse('{"title":"Performance & Benchmarks","description":"","frontmatter":{},"headers":[],"relativePath":"tests/Performance.md","filePath":"tests/Performance.md"}');
const _sfc_main = { name: "tests/Performance.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<div${ssrRenderAttrs(_attrs)}><h1 id="performance-benchmarks" tabindex="-1">Performance &amp; Benchmarks <a class="header-anchor" href="#performance-benchmarks" aria-label="Permalink to &quot;Performance &amp; Benchmarks&quot;">​</a></h1><p>Benchmarks live in <code>tests/Benchmarks/</code> and track:</p><ul><li>throughput stability,</li><li>fan-out behavior,</li><li>cold vs warm profiles,</li><li>explain overhead,</li><li>secret-path performance,</li><li>push vs pull isolation,</li><li>CI regression gates.</li></ul><h2 id="benchmark-files" tabindex="-1">Benchmark Files <a class="header-anchor" href="#benchmark-files" aria-label="Permalink to &quot;Benchmark Files&quot;">​</a></h2><table tabindex="0"><thead><tr><th>File</th><th>Focus</th></tr></thead><tbody><tr><td><code>benchmark.5.sustained-mutation.test.ts</code></td><td>sustained mutation throughput</td></tr><tr><td><code>benchmark.6.fanout-sensitivity.test.ts</code></td><td>fan-out sensitivity</td></tr><tr><td><code>benchmark.7.cold-warm-profiles.test.ts</code></td><td>cold/warm/steady profile split</td></tr><tr><td><code>benchmark.8.explain-overhead.test.ts</code></td><td>explain overhead budget</td></tr><tr><td><code>benchmark.9.secret-scope-impact.test.ts</code></td><td>secret/public latency envelope</td></tr><tr><td><code>benchmark.10.push-vs-pull.test.ts</code></td><td>eager vs lazy write/read isolation</td></tr><tr><td><code>benchmark.11.secret-push-vs-pull.test.ts</code></td><td>secret/public push-read isolation</td></tr><tr><td><code>benchmark.regression-gate.test.ts</code></td><td>CI pass/fail thresholds</td></tr></tbody></table><p>Run examples:</p><div class="language-bash vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">bash</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span style="${ssrRenderStyle({ "--shiki-light": "#6F42C1", "--shiki-dark": "#B392F0" })}">node</span><span style="${ssrRenderStyle({ "--shiki-light": "#032F62", "--shiki-dark": "#9ECBFF" })}"> tests/Benchmarks/benchmark.5.sustained-mutation.test.ts</span></span>
<span class="line"><span style="${ssrRenderStyle({ "--shiki-light": "#6F42C1", "--shiki-dark": "#B392F0" })}">node</span><span style="${ssrRenderStyle({ "--shiki-light": "#032F62", "--shiki-dark": "#9ECBFF" })}"> tests/Benchmarks/benchmark.10.push-vs-pull.test.ts</span></span>
<span class="line"><span style="${ssrRenderStyle({ "--shiki-light": "#6F42C1", "--shiki-dark": "#B392F0" })}">node</span><span style="${ssrRenderStyle({ "--shiki-light": "#032F62", "--shiki-dark": "#9ECBFF" })}"> tests/Benchmarks/benchmark.11.secret-push-vs-pull.test.ts</span></span>
<span class="line"><span style="${ssrRenderStyle({ "--shiki-light": "#6F42C1", "--shiki-dark": "#B392F0" })}">node</span><span style="${ssrRenderStyle({ "--shiki-light": "#032F62", "--shiki-dark": "#9ECBFF" })}"> tests/Benchmarks/benchmark.regression-gate.test.ts</span></span></code></pre></div><p>For detailed benchmark analysis and latest result tables, see:</p><ul><li><a href="/.me/docs/kernel/Benchmarks.html">Kernel Benchmarks</a></li></ul></div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("tests/Performance.md");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const Performance = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
export {
  __pageData,
  Performance as default
};
