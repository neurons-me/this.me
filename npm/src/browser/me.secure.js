//this.me/npm/src/browser/me.secure.js
//wrapper para validar trustedAction + session que usan los verbos antes de mutar:
import { trustedAction } from './me.trust.js';
import { isUnlocked } from './me.session.js';

function requireSecure(actionName = "action") {
  if (!trustedAction()) {
    throw new Error(`[SECURE] ${actionName} blocked: not a trusted interaction`);
  }
  if (!isUnlocked()) {
    throw new Error(`[SECURE] ${actionName} blocked: session expired`);
  }
}

export { requireSecure };