import { ssrRenderAttrs, ssrRenderStyle } from "vue/server-renderer";
import { useSSRContext } from "vue";
import { _ as _export_sfc } from "./plugin-vue_export-helper.1tPrXgE0.js";
const __pageData = JSON.parse('{"title":"Axioms & Phases","description":"","frontmatter":{},"headers":[],"relativePath":"tests/Axioms-and-Phases.md","filePath":"tests/Axioms-and-Phases.md"}');
const _sfc_main = { name: "tests/Axioms-and-Phases.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<div${ssrRenderAttrs(_attrs)}><h1 id="axioms-phases" tabindex="-1">Axioms &amp; Phases <a class="header-anchor" href="#axioms-phases" aria-label="Permalink to &quot;Axioms &amp; Phases&quot;">​</a></h1><p>These are the semantic correctness tests of <code>.me</code>.</p><h2 id="axioms-tests-axioms-test-ts" tabindex="-1">Axioms (<code>tests/axioms.test.ts</code>) <a class="header-anchor" href="#axioms-tests-axioms-test-ts" aria-label="Permalink to &quot;Axioms (\`tests/axioms.test.ts\`)&quot;">​</a></h2><p>Axioms validate non-negotiable behavior:</p><ul><li>Callable + navigable proxy surface</li><li>Secret stealth roots (<code>_</code>) and noise reset (<code>~</code>)</li><li>Identity normalization (<code>@</code>)</li><li>Pointer semantics (<code>__</code> / <code>-&gt;</code>)</li><li>Query/memory events (<code>?</code>)</li><li>Remove tombstones (<code>-</code>)</li><li>Hash-chain tamper evidence</li><li>Deterministic LWW conflict resolution</li></ul><p>Run:</p><div class="language-bash vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">bash</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span style="${ssrRenderStyle({ "--shiki-light": "#6F42C1", "--shiki-dark": "#B392F0" })}">node</span><span style="${ssrRenderStyle({ "--shiki-light": "#032F62", "--shiki-dark": "#9ECBFF" })}"> tests/axioms.test.ts</span></span></code></pre></div><p>Failure impact:</p><ul><li>If this fails, semantic integrity is considered broken.</li></ul><h2 id="phases-fire-test-tests-phases-test-js" tabindex="-1">Phases Fire Test (<code>tests/phases.test.js</code>) <a class="header-anchor" href="#phases-fire-test-tests-phases-test-js" aria-label="Permalink to &quot;Phases Fire Test (\`tests/phases.test.js\`)&quot;">​</a></h2><p>Phases validate feature progress from phase 0 to phase 8 in one runtime flow:</p><ul><li>selectors, broadcast, filters, ranges, transforms</li><li>replay + snapshot rehydration</li><li>incremental recompute + explain masking</li></ul><p>Run:</p><div class="language-bash vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">bash</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span style="${ssrRenderStyle({ "--shiki-light": "#6F42C1", "--shiki-dark": "#B392F0" })}">node</span><span style="${ssrRenderStyle({ "--shiki-light": "#032F62", "--shiki-dark": "#9ECBFF" })}"> tests/phases.test.js</span></span></code></pre></div><h2 id="why-both" tabindex="-1">Why Both? <a class="header-anchor" href="#why-both" aria-label="Permalink to &quot;Why Both?&quot;">​</a></h2><ul><li>Axioms = invariants and safety properties.</li><li>Phases = integration progression and user-visible capability continuity.</li></ul></div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("tests/Axioms-and-Phases.md");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const AxiomsAndPhases = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
export {
  __pageData,
  AxiomsAndPhases as default
};
