/**
 * example.ts
 * -----------------------------------------
 * A gradual introduction to ME:
 * 1. Simple semantic assignments
 * 2. Nested proxies
 * 3. Secrets + encrypted branches
 * 4. Nested secrets (fractal crypto)
 * 5. Returning to previous channels
 * -----------------------------------------
 */

import { ME } from "../src/me.ts";
// -----------------------------------------
// 0. Create your identity
// -----------------------------------------
const me: any = new ME("abellae", "rootSecret123");
console.log("\n------------------------------");
console.log("STEP 1 — Simple Assignments");
console.log("------------------------------\n");
// -----------------------------------------
// 1. Simple leaf assignments
// -----------------------------------------
me.instrument("Moog");
me.dogs("Luna", "Dogo");
me.meta.color("blue");
console.log("Exported payload (encrypted):");
console.log(JSON.stringify(me.export().payload, null, 2));
console.log("\nExport Branch: meta.color");
console.log(me("meta.color")); // "blue"
// -----------------------------------------
console.log("\n------------------------------");
console.log("STEP 2 — Nested Proxies");
console.log("------------------------------\n");
// -----------------------------------------
me.system.audio.filters.lowpass.cutoff(1200);
me.system.audio.filters.lowpass.resonance(0.7);
console.log("GET: system.audio.filters.lowpass");
console.log(me("system.audio.filters.lowpass"));
// -----------------------------------------
console.log("\n-------------------------------------------");
console.log("STEP 3 — Introduce a Secret (Encrypted Blob)");
console.log("-------------------------------------------\n");
// -----------------------------------------
me.wallet.secret("XYZ");
me.wallet.balance(500);
me.wallet.transactions.list([1, 2, 3]);
console.log("Encrypted wallet subtree:");
console.log(JSON.stringify(me.export().payload.wallet, null, 2));
console.log("\nDecrypted wallet subtree:");
console.log(me("wallet"));
// -----------------------------------------
console.log("\n-------------------------------------------");
console.log("STEP 4 — Nested Secrets (Fractal Crypto)");
console.log("-------------------------------------------\n");
// -----------------------------------------
me.wallet.transactions.secret("ABC"); // deeper secret
me.wallet.transactions.hidden("private-note");
me.wallet.transactions.deep.secret("DEEP"); // nested again
me.wallet.transactions.deep.value("super hidden");
console.log("Decrypted wallet:");
console.log(JSON.stringify(me("wallet"), null, 2));
// -----------------------------------------
console.log("\n-------------------------------------------");
console.log("STEP 5 — Return to a Previous Secret Channel");
console.log("-------------------------------------------\n");
// -----------------------------------------
console.log("Current (last secret used = DEEP):");
console.log(JSON.stringify(me("wallet"), null, 2));
console.log("\nSwitch back to secret XYZ (wallet root):");
me.wallet.secret("XYZ");
console.log(JSON.stringify(me("wallet"), null, 2));
console.log("\nSwitch back to secret ABC (transactions level):");
me.wallet.transactions.secret("ABC");
console.log(me("wallet.transactions"));
console.log("\n-------------------------------------------");
console.log("END OF PAYLOADS EXAMPLE");
console.log("-------------------------------------------\n");
console.log("------------EXPORT() EXAMPLE--------------\n");

console.log(me.export());