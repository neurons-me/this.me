import { ssrRenderAttrs } from "vue/server-renderer";
import { useSSRContext } from "vue";
import { _ as _export_sfc } from "./plugin-vue_export-helper.1tPrXgE0.js";
const __pageData = JSON.parse('{"title":"","description":"","frontmatter":{},"headers":[],"relativePath":"old/Campos de identidad cifrada.md","filePath":"old/Campos de identidad cifrada.md"}');
const _sfc_main = { name: "old/Campos de identidad cifrada.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<div${ssrRenderAttrs(_attrs)}><p>Tu Me struct tiene: • Campos de identidad cifrada (username, public_key, private_key, context_id) • Un campo verbs: Verbs → que contiene las tablas “verbales” (be, do, have, etc.) • Un Connection activo a la base SQLite (conn)</p></div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("old/Campos de identidad cifrada.md");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const Campos_de_identidad_cifrada = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
export {
  __pageData,
  Campos_de_identidad_cifrada as default
};
