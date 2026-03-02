import { ssrRenderAttrs } from "vue/server-renderer";
import { useSSRContext } from "vue";
import { _ as _export_sfc } from "./plugin-vue_export-helper.1tPrXgE0.js";
const __pageData = JSON.parse('{"title":"Thoughts (Legacy)","description":"","frontmatter":{},"headers":[],"relativePath":"Thoughts.md","filePath":"Thoughts.md"}');
const _sfc_main = { name: "Thoughts.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<div${ssrRenderAttrs(_attrs)}><h1 id="thoughts-legacy" tabindex="-1">Thoughts (Legacy) <a class="header-anchor" href="#thoughts-legacy" aria-label="Permalink to &quot;Thoughts (Legacy)&quot;">​</a></h1><p><code>Thoughts</code> is the legacy name for what is now called <strong>Memory</strong>.</p><p>Use the Memory page instead:</p><ul><li><a href="./Memory.html">Memory</a></li></ul><p>Compatibility is still preserved in code:</p><ul><li><code>shortTermMemory</code> -&gt; legacy alias of <code>memory</code></li><li><code>inspect().thoughts</code> -&gt; legacy alias of <code>inspect().memory</code></li><li><code>replayThoughts(...)</code> -&gt; legacy alias of <code>replayMemory(...)</code></li></ul></div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("Thoughts.md");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const Thoughts = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
export {
  __pageData,
  Thoughts as default
};
