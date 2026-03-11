import { ssrRenderAttrs } from "vue/server-renderer";
import { useSSRContext } from "vue";
import { _ as _export_sfc } from "./plugin-vue_export-helper.1tPrXgE0.js";
const __pageData = JSON.parse('{"title":"","description":"","frontmatter":{},"headers":[],"relativePath":"old/next.md","filePath":"old/next.md"}');
const _sfc_main = { name: "old/next.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<div${ssrRenderAttrs(_attrs)}><p>Nota – Próximo paso con this.me y LLM • Una vez terminada la página, implementar un prototipo declarativo conectado a un LLM. • Usar un enfoque RAG (Retrieval-Augmented Generation) con la documentación y código de this.me para que el modelo pueda responder sobre la estructura y el ecosistema sin reentrenarse. • Guardar documentación y definiciones en un índice vectorial, y alimentar el LLM con fragmentos relevantes en cada consulta. • Esto permitirá empezar a “aprender” la estructura de this.me de inmediato, con bajo coste y alta flexibilidad. • Evaluar después si vale la pena un fine-tuning para mejorar comprensión interna o independencia de contexto.</p></div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("old/next.md");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const next = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
export {
  __pageData,
  next as default
};
