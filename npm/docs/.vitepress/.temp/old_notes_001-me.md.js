import { ssrRenderAttrs } from "vue/server-renderer";
import { useSSRContext } from "vue";
import { _ as _export_sfc } from "./plugin-vue_export-helper.1tPrXgE0.js";
const __pageData = JSON.parse('{"title":"","description":"","frontmatter":{},"headers":[],"relativePath":"old/notes/001-me.md","filePath":"old/notes/001-me.md"}');
const _sfc_main = { name: "old/notes/001-me.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<div${ssrRenderAttrs(_attrs)}><p><strong>Resumen de this-me</strong> this-me es un sistema de identidad local y encriptado diseñado para aplicaciones descentralizadas y conscientes de la privacidad. Permite a los usuarios crear y gestionar identidades seguras y almacenar datos locales de manera estructurada mediante &quot;verbos&quot; que describen acciones o atributos de la identidad.</p><p><strong>Componentes clave:</strong></p><ol><li><strong>Identidad (Me)</strong>: Representada por una estructura que incluye una clave pública y privada encriptada. Cada identidad se almacena en una base de datos SQLite local.</li><li><strong>Verbos</strong>: Métodos que permiten registrar acciones o atributos de la identidad, como <code>be</code> (ser), <code>have</code> (tener), <code>do</code> (hacer), <code>at</code> (estar en), <code>relate</code> (relacionarse con) y <code>react</code> (reaccionar a). Cada verbo se almacena en una tabla separada en la base de datos.</li><li><strong>Contextos</strong>: Los verbos se pueden segmentar por contextos utilizando un <code>context_id</code>, que es un hash derivado de combinaciones de identidades, secretos o dominios. Esto permite registrar acciones en espacios semánticos compartidos o privados.</li><li><strong>CLI</strong>: Una interfaz de línea de comandos que permite crear, gestionar y consultar identidades y verbos. Los comandos incluyen <code>create</code>, <code>change-password</code>, <code>display</code>, <code>list</code>, y métodos para invocar verbos como <code>be</code>, <code>do</code>, <code>have</code>, etc.</li></ol><p><strong>Características:</strong></p><ul><li><strong>Seguridad</strong>: Las claves privadas se almacenan encriptadas y se utilizan contraseñas para proteger las identidades.</li><li><strong>Flexibilidad</strong>: Los verbos y contextos permiten una gran flexibilidad en la forma en que se estructuran y consultan los datos de identidad.</li><li><strong>Privacidad</strong>: Al ser local y encriptado, this-me prioriza la privacidad y el control del usuario sobre sus datos.</li></ul><p><strong>Uso:</strong></p><ul><li>Crear y gestionar identidades seguras y encriptadas.</li><li>Registrar y consultar verbos y atributos de la identidad.</li><li>Utilizar contextos para segmentar y organizar los datos de identidad.</li></ul><p>En resumen, this-me es un sistema de identidad local y encriptado que permite a los usuarios crear y gestionar identidades seguras y estructuradas mediante verbos y contextos, priorizando la privacidad y la flexibilidad.</p></div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("old/notes/001-me.md");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const _001Me = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
export {
  __pageData,
  _001Me as default
};
