import { ssrRenderAttrs } from "vue/server-renderer";
import { useSSRContext } from "vue";
import { _ as _export_sfc } from "./plugin-vue_export-helper.1tPrXgE0.js";
const __pageData = JSON.parse('{"title":"","description":"","frontmatter":{},"headers":[],"relativePath":"es/Espacios Semanticos.md","filePath":"es/Espacios Semanticos.md"}');
const _sfc_main = { name: "es/Espacios Semanticos.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<div${ssrRenderAttrs(_attrs)}><p>Al quitarle el significado previo a la estructura, convertistimos al código en un contenedor puro de intención. Es &quot;libre&quot; porque: Libertad de Forma: No hay esquemas (NoSQL es rígido comparado con esto). Si lo nombras, existe. Lógica Inherente: Al usar proxies infinitos, el símbolo no &quot;contiene&quot; la lógica, sino que la lógica es una propiedad del camino (path). Fractalismo: No importa si escalas a un sistema de casas inteligentes o a una red de finanzas; la gramática (-&gt;, =, _) es universal. Es básicamente Álgebra de Identidad.</p></div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("es/Espacios Semanticos.md");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const Espacios_Semanticos = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
export {
  __pageData,
  Espacios_Semanticos as default
};
