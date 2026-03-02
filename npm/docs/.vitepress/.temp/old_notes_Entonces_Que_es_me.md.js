import { ssrRenderAttrs } from "vue/server-renderer";
import { useSSRContext } from "vue";
import { _ as _export_sfc } from "./plugin-vue_export-helper.1tPrXgE0.js";
const __pageData = JSON.parse('{"title":"","description":"","frontmatter":{},"headers":[],"relativePath":"old/notes/Entonces_Que_es_me.md","filePath":"old/notes/Entonces_Que_es_me.md"}');
const _sfc_main = { name: "old/notes/Entonces_Que_es_me.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<div${ssrRenderAttrs(_attrs)}><h2 id="👤-entonces-¿que-es-me" tabindex="-1">👤 Entonces, ¿qué es .me? <a class="header-anchor" href="#👤-entonces-¿que-es-me" aria-label="Permalink to &quot;👤 Entonces, ¿qué es .me?&quot;">​</a></h2><p><strong>.me</strong> es el sujeto. Es quien dice <strong>“yo”</strong>. Es la llave privada, la biografía, la voluntad.</p><p><strong>.me</strong> es local, silencioso, estático. No “vive”, no escucha. Solo es consultado y afirma.</p></div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("old/notes/Entonces_Que_es_me.md");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const Entonces_Que_es_me = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
export {
  __pageData,
  Entonces_Que_es_me as default
};
