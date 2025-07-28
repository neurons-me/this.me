// index.js
/**
 * @module This.Me
 * @description This.Me is a data-structured identity...
 */

let Me;

function loadMe() {
  if (typeof window !== "undefined" && typeof window.document !== "undefined") {
    // 🌐 Browser → usa el cliente me.browser
    return import("./src/browser/me.browser.js").then(m => m.default);
  } else {
    console.warn("[this.me] Running in Node: Rust backend not yet implemented, using browser client as fallback.");
    return import("./src/browser/me.browser.js").then(m => m.default);
  }
}

// Inicializamos Me como un Promise
const mePromise = loadMe();

// Para quienes consumen el paquete como ESM normal
mePromise.then((m) => {
  Me = m;
});

export default mePromise;
export { mePromise as me };