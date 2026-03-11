import { _ as _export_sfc, o as openBlock, c as createElementBlock, j as createBaseVNode } from "./chunks/framework.A4PPlylb.js";
const __pageData = JSON.parse('{"title":"","description":"","frontmatter":{},"headers":[],"relativePath":"old/ProductionORDev.md","filePath":"old/ProductionORDev.md"}');
const _sfc_main = { name: "old/ProductionORDev.md" };
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return openBlock(), createElementBlock("div", null, [..._cache[0] || (_cache[0] = [
    createBaseVNode("p", null, "Tu archivo .env: ENV=development", -1),
    createBaseVNode("p", null, "Solo necesitas cambiarlo a: ENV=production", -1),
    createBaseVNode("p", null, "cuando vayas a producción, y tu código detectará automáticamente el entorno correcto. Asegúrate de que estás cargando .env al inicio de tu aplicación con: import 'dotenv/config';", -1),
    createBaseVNode("p", null, "¡Con eso ya tienes un entorno flexible y controlado!", -1)
  ])]);
}
const ProductionORDev = /* @__PURE__ */ _export_sfc(_sfc_main, [["render", _sfc_render]]);
export {
  __pageData,
  ProductionORDev as default
};
