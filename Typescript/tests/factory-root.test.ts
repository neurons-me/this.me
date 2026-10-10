import assert from "node:assert/strict";
// Through the built package, like the axioms test: the factory pulls in the whole kernel, which plain
// `node` cannot load from source.
import ME from "../dist/index.js";

const createThisMe = (ME as any).createThisMe as (input: Record<string, unknown>) => any;

// A root named explicitly by whoever builds the kernel is a declaration, so a single label is as valid as
// several. Reading it back through the kernel is what proves the factory stored it, not just accepted it.
const read = (me: any, path: string) => me(path);

const single: any = createThisMe({ name: "ana", space: "localhost" });
assert.equal(read(single, "profile.rootNamespace"), "localhost");
assert.equal(read(single, "profile.namespace"), "ana.localhost");
assert.equal(read(single, "profile.username"), "ana");

const several: any = createThisMe({ name: "ana", space: "neurons.me" });
assert.equal(read(several, "profile.rootNamespace"), "neurons.me");
assert.equal(read(several, "profile.namespace"), "ana.neurons.me");

// Same normalization as every other space: case is folded, not rejected.
const mixed: any = createThisMe({ name: "ana", space: "LocalHost" });
assert.equal(read(mixed, "profile.rootNamespace"), "localhost");
assert.equal(read(mixed, "profile.namespace"), "ana.localhost");

// `namespace` is accepted as the same declaration.
const viaNamespace: any = createThisMe({ name: "ana", namespace: "here" });
assert.equal(read(viaNamespace, "profile.namespace"), "ana.here");

// A malformed root is refused where it is given, and never stored.
assert.throws(() => createThisMe({ name: "ana", space: "bad_space!" }), /Invalid space label/i);

// No root declared: nothing is invented.
const none: any = createThisMe({ name: "ana" });
assert.equal(read(none, "profile.rootNamespace"), undefined);
assert.equal(read(none, "profile.namespace"), undefined);

console.log("✔ factory root declaration tests passed");
