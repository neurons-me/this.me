import { ssrRenderAttrs } from "vue/server-renderer";
import { useSSRContext } from "vue";
import { _ as _export_sfc } from "./plugin-vue_export-helper.1tPrXgE0.js";
const __pageData = JSON.parse('{"title":"","description":"","frontmatter":{},"headers":[],"relativePath":"old/ProductionORDev.md","filePath":"old/ProductionORDev.md"}');
const _sfc_main = { name: "old/ProductionORDev.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<div${ssrRenderAttrs(_attrs)}><p>Tu archivo .env: ENV=development</p><p>Solo necesitas cambiarlo a: ENV=production</p><p>cuando vayas a producción, y tu código detectará automáticamente el entorno correcto. Asegúrate de que estás cargando .env al inicio de tu aplicación con: import &#39;dotenv/config&#39;;</p><p>¡Con eso ya tienes un entorno flexible y controlado!</p></div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("old/ProductionORDev.md");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const ProductionORDev = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
export {
  __pageData,
  ProductionORDev as default
};
