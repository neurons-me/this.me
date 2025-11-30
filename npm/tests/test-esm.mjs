import { ME } from "../dist/me.es.js";

// Create ME instance
const me = new ME("test", "secret");

// Test 1 — callable identity
console.log("typeof me:", typeof me);  // expected: function

// Test 2 — semantic writes
me.profile.name("Abella");
me.profile.age(30);
me.system.audio.volume(0.8);

// Test 3 — semantic reads
console.log("profile.name =", me("profile.name")); // expected: "Abella"
console.log("profile =", me("profile"));           // expected: object
console.log("system.audio =", me("system.audio")); // expected: object

// Test 4 — export full identity
console.log("export():");
console.log(JSON.stringify(me.export(), null, 2));

// Test 5 — branch export
console.log("export(profile):");
console.log(JSON.stringify(me.exportBranch("profile"), null, 2));