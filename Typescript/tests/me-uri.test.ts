import assert from "node:assert/strict";
import {
  canonicalizeLegacyAtOperator,
  canonicalizeHumanIdentity,
  formatCanonicalMeUri,
  formatMeSpaceUri,
  normalizeCanonicalSpace,
  parseCanonicalMeUri,
  parseMeSpaceUri,
  parseMeUri,
  projectDnsHostToNamespace,
  tryParseMeSpaceUri,
  tryParseMeUri,
  validateKnownSpaces,
} from "../src/me-uri.ts";

const parsed = parseCanonicalMeUri("me://suign.neurons.me[macbook]/profile.name", {
  knownSpaces: ["neurons.me"],
});
assert.equal(parsed.handle, "suign");
assert.equal(parsed.space, "neurons.me");
assert.equal(parsed.selector?.kind, "surface");
assert.equal(parsed.selector?.value, "surface:macbook");
assert.equal(parsed.path, "profile.name");
assert.equal(parsed.href, "me://suign.neurons.me[surface:macbook]/profile.name");

const fanout = parseCanonicalMeUri("me://suign.neurons.me[]/chat.general", {
  knownSpaces: ["neurons.me"],
});
assert.equal(fanout.selector?.kind, "fanout");
assert.equal(fanout.href, "me://suign.neurons.me[]/chat.general");

assert.equal(tryParseMeUri("me://neurons.me"), null);
assert.throws(() => parseCanonicalMeUri("me://neurons.me"), /handle\.space/i);
assert.throws(() => parseCanonicalMeUri("me://sui_gn.neurons.me"), /canonical handle/i);
assert.throws(
  () => parseCanonicalMeUri("me://john.dev.neurons.me", { knownSpaces: ["neurons.me"] }),
  /Unknown canonical space/i,
);

const subSpace = parseCanonicalMeUri("me://john.dev.neurons.me", {
  knownSpaces: ["neurons.me", "dev.neurons.me"],
});
assert.equal(subSpace.space, "dev.neurons.me");
assert.equal(subSpace.namespace, "john.dev.neurons.me");

const human = canonicalizeHumanIdentity("SuiGn@Neurons.me", {
  knownSpaces: ["neurons.me"],
});
assert.equal(human.alias, "suign@neurons.me");
assert.equal(human.namespace, "suign.neurons.me");
assert.equal(human.uri, "me://suign.neurons.me");

assert.equal(
  canonicalizeLegacyAtOperator("suign@neurons.me", {
    knownSpaces: ["neurons.me"],
  }),
  "me://suign.neurons.me",
);
assert.equal(
  canonicalizeLegacyAtOperator("alice@community.neurons.me", {
    knownSpaces: ["neurons.me"],
  }),
  null,
);
assert.equal(canonicalizeLegacyAtOperator("sui_gn@neurons.me", {
  knownSpaces: ["neurons.me"],
}), null);

const rootProjection = projectDnsHostToNamespace("https://neurons.me", ["neurons.me"]);
assert.equal(rootProjection.ok, true);
assert.equal(rootProjection.kind, "space");
if (rootProjection.ok && rootProjection.kind === "space") {
  assert.equal(rootProjection.space, "neurons.me");
}

const namespaceProjection = projectDnsHostToNamespace("https://suign.neurons.me", ["neurons.me"]);
assert.equal(namespaceProjection.ok, true);
assert.equal(namespaceProjection.kind, "namespace");
if (namespaceProjection.ok && namespaceProjection.kind === "namespace") {
  assert.equal(namespaceProjection.namespace, "suign.neurons.me");
  assert.equal(namespaceProjection.uri, "me://suign.neurons.me");
}

const multiLabelProjection = projectDnsHostToNamespace("https://foo.bar.neurons.me", ["neurons.me"]);
assert.equal(multiLabelProjection.ok, false);
if (!multiLabelProjection.ok) {
  assert.equal(multiLabelProjection.reason, "NOT_CANONICAL_NAMESPACE");
}

const longestSuffixProjection = projectDnsHostToNamespace(
  "https://user.community.neurons.me",
  ["neurons.me", "community.neurons.me"],
);
assert.equal(longestSuffixProjection.ok, true);
assert.equal(longestSuffixProjection.kind, "namespace");
if (longestSuffixProjection.ok && longestSuffixProjection.kind === "namespace") {
  assert.equal(longestSuffixProjection.space, "community.neurons.me");
  assert.equal(longestSuffixProjection.namespace, "user.community.neurons.me");
}

const localhostProjection = projectDnsHostToNamespace("localhost", ["neurons.me"]);
assert.equal(localhostProjection.ok, false);
if (!localhostProjection.ok) {
  assert.equal(localhostProjection.reason, "TRANSPORT_ONLY_HOST");
}


// ── A space the runtime declares may have one label ────────────────────────
// `whoami.here`: a name inside a space. The space is a single label only because the runtime declared it;
// without that context nothing says where the handle stops, so the two-label minimum still holds.
const single = parseCanonicalMeUri("me://jabellae.localhost/profile.name", { knownSpaces: ["localhost"] });
assert.equal(single.handle, "jabellae");
assert.equal(single.space, "localhost");
assert.equal(single.namespace, "jabellae.localhost");
assert.equal(single.href, "me://jabellae.localhost/profile.name");
assert.equal(formatCanonicalMeUri({ handle: "jabellae", space: "here", knownSpaces: ["here"] }), "me://jabellae.here");
assert.equal(canonicalizeHumanIdentity("ana@here", { knownSpaces: ["here"] }).uri, "me://ana.here");

// ...and without that declaration it stays refused, in every direction (no guessing).
assert.throws(() => parseMeUri("me://jabellae.localhost"), /handle\.space/i);
assert.throws(() => parseCanonicalMeUri("me://jabellae.localhost", { knownSpaces: ["neurons.me"] }), /handle\.space/i);
assert.throws(() => formatCanonicalMeUri({ handle: "jabellae", space: "localhost" }), /at least two labels/i);
assert.throws(() => formatCanonicalMeUri({ handle: "jabellae", space: "here", knownSpaces: ["neurons.me"] }), /at least two labels/i);
assert.throws(() => normalizeCanonicalSpace("localhost"), /at least two labels/i);

// More than one label before a declared space is not split for you.
assert.throws(
  () => parseCanonicalMeUri("me://a.b.localhost", { knownSpaces: ["localhost"] }),
  /handle\.space|Unknown canonical space/i,
);

// The longest declared space wins, whatever its length.
const nested = parseCanonicalMeUri("me://a.b.c", { knownSpaces: ["c", "b.c"] });
assert.equal(nested.handle, "a");
assert.equal(nested.space, "b.c");

// Projection: the runtime's declared spaces decide before the transport-only rule does.
const rootHere = projectDnsHostToNamespace("here", ["here"]);
assert.equal(rootHere.ok, true);
if (rootHere.ok) {
  assert.equal(rootHere.kind, "space");
  assert.equal(rootHere.space, "here");
}
const userHere = projectDnsHostToNamespace("jabellae.here", ["here"]);
assert.equal(userHere.ok, true);
if (userHere.ok && userHere.kind === "namespace") {
  assert.equal(userHere.namespace, "jabellae.here");
  assert.equal(userHere.uri, "me://jabellae.here");
}
for (const root of ["localhost", "suis-macbook-air.local"]) {
  const rootProjection = projectDnsHostToNamespace(root, [root]);
  assert.equal(rootProjection.ok, true, `${root} is its own declared space`);
  const userProjection = projectDnsHostToNamespace(`jabellae.${root}`, [root]);
  assert.equal(userProjection.ok, true, `jabellae.${root} is a name inside it`);
  if (userProjection.ok && userProjection.kind === "namespace") assert.equal(userProjection.namespace, `jabellae.${root}`);
}
// Declared only for one root, localhost / *.local are still just transport for everything else.
for (const host of ["localhost", "jabellae.localhost", "x.suis-macbook-air.local"]) {
  const result = projectDnsHostToNamespace(host, ["neurons.me"]);
  assert.equal(result.ok, false);
  if (!result.ok) assert.ok(["TRANSPORT_ONLY_HOST", "UNKNOWN_SPACE"].includes(result.reason), `${host}: ${result.reason}`);
}
// A received Host cannot make itself a root: only what the runtime declared counts.
const selfDeclared = projectDnsHostToNamespace("jabellae.evil.example", ["localhost"]);
assert.equal(selfDeclared.ok, false);
if (!selfDeclared.ok) assert.equal(selfDeclared.reason, "UNKNOWN_SPACE");
// A bad declaration is reported where it is made, and never throws out of a request.
assert.throws(() => validateKnownSpaces(["localhost", "bad_space!"]), /Invalid known space/i);
assert.throws(() => validateKnownSpaces([""]), /Invalid known space/i);
assert.deepEqual(validateKnownSpaces(["localhost", "b.c", "c"]), ["b.c", "localhost", "c"].sort((l, r) => r.split(".").length - l.split(".").length || r.length - l.length));
const badConfig = projectDnsHostToNamespace("jabellae.localhost", ["localhost", "bad_space!"]);
assert.equal(badConfig.ok, false);
if (!badConfig.ok) assert.equal(badConfig.reason, "INVALID_KNOWN_SPACES");


// ── The space itself: me://<space> ─────────────────────────────────────────
// `me://here` is the root a runtime declares, addressed as itself; `me://ana.here` is someone inside it.
// The reference is only valid with the declaring context, and parseMeUri (handle required) is untouched.
const rootRef = parseMeSpaceUri("me://here", { knownSpaces: ["here"] });
assert.equal(rootRef.space, "here");
assert.equal(rootRef.href, "me://here");
assert.equal(rootRef.selector, null);
assert.equal(rootRef.path, null);

const rootPath = parseMeSpaceUri("me://localhost[macbook]/profile.name", { knownSpaces: ["localhost"] });
assert.equal(rootPath.space, "localhost");
assert.equal(rootPath.selector?.value, "surface:macbook");
assert.equal(rootPath.path, "profile.name");
assert.equal(rootPath.href, "me://localhost[surface:macbook]/profile.name");

// A multi-label space is addressed the same way, and case is folded like everywhere else.
assert.equal(parseMeSpaceUri("me://Neurons.ME", { knownSpaces: ["neurons.me"] }).space, "neurons.me");

// A name inside a declared space is a namespace, not the space: refused here, still read by the other parser.
assert.throws(() => parseMeSpaceUri("me://ana.here", { knownSpaces: ["here"] }), /not the space itself/i);
assert.equal(parseCanonicalMeUri("me://ana.here", { knownSpaces: ["here"] }).namespace, "ana.here");
// The longest declared space is the space; one more label in front is someone inside it.
assert.equal(parseMeSpaceUri("me://system.here", { knownSpaces: ["here", "system.here"] }).space, "system.here");
assert.throws(() => parseMeSpaceUri("me://x.system.here", { knownSpaces: ["here", "system.here"] }), /not the space itself/i);

// Nothing is guessed: an undeclared name is not a space, and no context means no reading at all.
assert.throws(() => parseMeSpaceUri("me://elsewhere", { knownSpaces: ["here"] }), /Unknown canonical space/i);
assert.throws(() => parseMeSpaceUri("me://here", { knownSpaces: [] }), /no declared spaces/i);
assert.equal(tryParseMeSpaceUri("me://elsewhere", { knownSpaces: ["here"] }), null);
assert.throws(() => parseMeSpaceUri("https://here", { knownSpaces: ["here"] }), /me:\/\//i);

// The handle form keeps demanding a handle, with or without a declared root.
assert.throws(() => parseMeUri("me://here"), /handle\.space/i);
assert.throws(() => parseCanonicalMeUri("me://here", { knownSpaces: ["here"] }), /handle\.space/i);

assert.equal(formatMeSpaceUri({ space: "here", knownSpaces: ["here"] }), "me://here");
assert.equal(formatMeSpaceUri({ space: "here", knownSpaces: ["here"], path: "profile.name" }), "me://here/profile.name");
assert.throws(() => formatMeSpaceUri({ space: "elsewhere", knownSpaces: ["here"] }), /Unknown canonical space/i);

console.log("✔ me:// canonical URI tests passed");
