//this.me/npm/src/browser/me.session.js
//manejo de sesiones desbloqueadas
let unlockedUntil = 0;
const SESSION_DURATION = 5 * 60 * 1000; // 5 minutos

function unlockSession() {
  unlockedUntil = Date.now() + SESSION_DURATION;
}

function isUnlocked() {
  return Date.now() < unlockedUntil;
}

function lockSession() {
  unlockedUntil = 0;
}

export { unlockSession, isUnlocked, lockSession };