//this.me/npm/src/browser/me.trust.js
//detección de acciones humanas (click, key)
let lastTrusted = 0;
const TRUST_TIMEOUT = 3000; // 3 segundos

function markTrusted() {
  lastTrusted = Date.now();
}

function trustedAction() {
  return (Date.now() - lastTrusted) < TRUST_TIMEOUT;
}

// Se conecta automáticamente a eventos comunes
window.addEventListener("click", markTrusted);
window.addEventListener("keydown", markTrusted);

export { trustedAction };