// ME axioms test (black-box-ish)
// Goal: validate the *algebra* of ME: navigable proxy, declarative operators,
// stealth secret scopes, pointer traversal, thought log invariants.
//
// IMPORTANT: This is designed to run against the built ESM bundle:
//   node tests/axioms.test.ts
// so we avoid TypeScript-only runners and we keep typings minimal.
// Runtime uses Node's built-in assert. For TypeScript tooling,
// some projects don't include Node typings in test files by default.
// We keep runtime import simple and patch types locally.
import assert from "node:assert/strict";
// eslint-disable-next-line import/extensions
import ME from "../dist/me.es.js";

// Treat runtime value as callable Proxy.
type MEProxy = any;

type Thought = {
  path: string;
  operator: string | null;
  expression: any;
  value: any;
  effectiveSecret: string;
  hash: string;
  timestamp: number;
};

type TestFn = () => void;
function describe(name: string, fn: TestFn) {
  // eslint-disable-next-line no-console
  console.log(`\n### ${name}`);
  fn();
}

function it(name: string, fn: TestFn) {
  try {
    fn();
    // eslint-disable-next-line no-console
    console.log(`✅ ${name}`);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(`❌ ${name}`);
    throw err;
  }
}

function lastN<T>(arr: T[], n = 8): T[] {
  return arr.slice(Math.max(0, arr.length - n));
}

function getSTM(me: MEProxy): Thought[] {
  // shortTermMemory is a getter in your implementation, but keep compatibility.
  const v = (me as any).shortTermMemory ?? (me as any)._shortTermMemory;
  return Array.isArray(v) ? v : [];
}

function dump(me: MEProxy, title: string) {
  const stm = getSTM(me);
  // eslint-disable-next-line no-console
  console.log("\n====================\n" + title + "\n====================");
  // eslint-disable-next-line no-console
  console.log("last thoughts:", lastN(stm, 10));
  // eslint-disable-next-line no-console
  console.log("index keys:", Object.keys(((me as any).index) || {}));
  // eslint-disable-next-line no-console
  console.log("index peek:", {
    __id: me("__id"),
    root: me(""),
    profileName: me("profile.name"),
    walletIncome: me("wallet.income"),
    walletRoot: me("wallet"),
    walletNet: me("wallet.net"),
    badge: me("profile.badge"),
    primaryPtr: me("profile.cards.primary"),
  });
  // eslint-disable-next-line no-console
  console.log("encryptedBranches keys:", Object.keys(((me as any).encryptedBranches) || {}));
  // eslint-disable-next-line no-console
  console.log("localSecrets:", Object.keys(((me as any).localSecrets) || {}));
  // eslint-disable-next-line no-console
  console.log("localNoises:", Object.keys(((me as any).localNoises) || {}));
}

/**
 * Secret-scope stealth axiom:
 * If a scope is secret, reading the scope root returns `undefined`.
 */
function assertStealthRoot(me: MEProxy, scope: string) {
  assert.equal(me(scope), undefined, `expected stealth root for scope '${scope}'`);
}

/**
 * Stealth index axiom:
 * Public-derived index must not reveal a secret subtree prefix.
 */
function assertIndexDoesNotExposePrefix(me: MEProxy, prefix: string) {
  const keys = Object.keys(((me as any).index) || {});
  for (const k of keys) {
    assert.ok(!k.startsWith(prefix), `index should not expose '${prefix}', but saw key '${k}'`);
  }
}

/**
 * Username validation (DNS-label-ish) used by normalizeAndValidateUsername.
 * This is just for test expectations.
 */
function shouldBeValidUsername(id: string) {
  const s = id.trim().toLowerCase();
  if (s.length < 3 || s.length > 63) return false;
  if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(s)) return false;
  if (s.includes("--")) return false;
  return true;
}

/**
 * Invariant: creating a new ME yields a callable Proxy.
 */
function assertCallable(me: any) {
  assert.equal(typeof me, "function", "expected ME instance to be callable (Proxy function)");
}

/**
 * Helper: find last thought matching predicate.
 */
function findLastThought(me: MEProxy, pred: (t: Thought) => boolean): Thought | undefined {
  const stm = getSTM(me);
  for (let i = stm.length - 1; i >= 0; i--) {
    if (pred(stm[i])) return stm[i];
  }
  return undefined;
}

/**
 * Helper: assert there exists an @ claim on root.
 */
function assertHasRootClaim(me: MEProxy, expected: string) {
  const claim = findLastThought(me, (t) => t.path === "" && t.operator === "@");
  assert.ok(claim, "expected an @ claim thought at root");
  const v =
    (claim!.value && claim!.value.__id) ||
    (claim!.expression && claim!.expression.__id) ||
    claim!.value;
  assert.equal(v, expected, "expected @ claim to store normalized username");
}

describe("ME axioms (structure + operators)", () => {
  it("A-struct-0: ME is callable and supports navigable chaining", () => {
    const me = new (ME as any)() as MEProxy;
    assertCallable(me);

    // chaining returns proxies (functions)
    const p1 = me.profile;
    const p2 = me.profile.name;
    assert.equal(typeof p1, "function");
    assert.equal(typeof p2, "function");

    // calling a leaf returns another proxy (chainable)
    const out = me.profile.name("Abella");
    assert.ok(out, "expected a return value for chaining");
    // root getter
    assert.doesNotThrow(() => me("profile.name"));
  });

  it("A0: root is public; secret scopes are stealth at their root", () => {
    const me = new (ME as any)() as MEProxy;

    me["@"]( "jabellae" );
    me.ledger.host("localhost:8161");
    me.ledger.protocol("http");

    // secret scope: wallet
    me.wallet["_"]("secret");
    me.wallet.income(100);

    dump(me, "A0 after public + secret wallet writes");

    assert.equal(me("ledger.host"), "localhost:8161");
    assert.equal(me("ledger.protocol"), "http");

    assertStealthRoot(me, "wallet");
    assert.equal(me("wallet.income"), 100);

    assertIndexDoesNotExposePrefix(me, "wallet");
    assertIndexDoesNotExposePrefix(me, "wallet.");

    assert.ok((((me as any).encryptedBranches) || {})["wallet"], "expected encryptedBranches['wallet']");
  });

  it("A1: '@' validates username semantics and records a root claim thought", () => {
    const me = new (ME as any)() as MEProxy;

    const ok = "jabellae";
    assert.ok(shouldBeValidUsername(ok), "expected helper to accept a valid username");
    me["@"](ok);
    assertHasRootClaim(me, ok);

    // invalid usernames should throw
    const bad = ["Abella", "a_b", "-aaa", "aaa-", "a..b", "a b", "á", "A", "", "aa", "a--b", "a", "ab"];
    for (const b of bad) {
      assert.ok(!shouldBeValidUsername(b), `test expects '${b}' to be invalid`);
      assert.throws(
        () => me["@"](b),
        undefined,
        `expected me['@'] to throw for invalid username '${b}'`
      );
    }
  });

  it("A2: '_' creates a secret scope; nesting under scope is readable but scope root stays stealth", () => {
    const me = new (ME as any)() as MEProxy;

    me["@"]( "jabellae" );
    me.profile.kind("public-profile");

    me.profile["_"]("alpha");
    me.profile.name("Abella");
    me.profile.city("Veracruz");

    dump(me, "A2 after secret profile writes");

    assertStealthRoot(me, "profile");
    assert.equal(me("profile.name"), "Abella");
    assert.equal(me("profile.city"), "Veracruz");

    assertIndexDoesNotExposePrefix(me, "profile");
  });

  it("A3: '~' noise resets secret inheritance (effectiveSecret changes) and '_' can chain after noise", () => {
    const me = new (ME as any)() as MEProxy;

    me["@"]( "jabellae" );

    // alpha scope
    me.wallet["_"]("alpha");
    me.wallet.hidden.notes("alpha-note");

    const alphaThought = findLastThought(me, (t) => t.path === "wallet.hidden.notes");
    assert.ok(alphaThought, "expected alpha thought");

    // noise cut + beta secret
    me.wallet["~"]("noise");
    me.wallet["_"]("beta");
    me.wallet.hidden.seed("beta-seed");

    const betaThought = findLastThought(me, (t) => t.path === "wallet.hidden.seed");
    assert.ok(betaThought, "expected beta thought");

    dump(me, "A3 after alpha -> noise -> beta");

    assert.notEqual(alphaThought!.effectiveSecret, betaThought!.effectiveSecret);
    assertStealthRoot(me, "wallet");
    assert.equal(me("wallet.hidden.seed"), "beta-seed");
  });

  it("A4: '__' pointer stores a pointer object; reads traverse pointer targets", () => {
    const me = new (ME as any)() as MEProxy;

    me["@"]( "jabellae" );

    me.wallet["_"]("secret");
    me.wallet.income(1000);
    me.wallet.expenses.rent(500);

    // pointer: profile.cards.primary -> wallet
    me.profile.cards.primary["__"]("wallet");

    dump(me, "A4 after pointer declare");

    const ptr = me("profile.cards.primary");
    assert.deepEqual(ptr, { __ptr: "wallet" });

    // traversal: reading through pointer should give wallet values
    assert.equal(me("profile.cards.primary.income"), 1000);
    assert.equal(me("profile.cards.primary.expenses.rent"), 500);

    assertStealthRoot(me, "wallet");
    assertIndexDoesNotExposePrefix(me, "wallet");
  });

  it("A5: '?' collect returns a function (picker) and records a collect thought", () => {
    const me = new (ME as any)() as MEProxy;

    me["@"]( "jabellae" );

    me.profile["_"]("alpha");
    me.profile.name("Abella");
    me.profile.city("Veracruz");

    const pickedProfile = me.profile["?"]("name", "city");

    dump(me, "A5 after collect profile");

    assert.equal(typeof pickedProfile, "function");

    // Collect thought should exist at 'profile' with operator '?'
    const collect = findLastThought(me, (t) => t.path === "profile" && t.operator === "?");
    assert.ok(collect, "expected a '?' collect thought at path 'profile'");

    assertStealthRoot(me, "profile");
    assert.equal(me("profile.name"), "Abella");
  });

  it("A6: '-' remove tombstones a path; subsequent reads are not the original cleartext", () => {
    const me = new (ME as any)() as MEProxy;

    me["@"]( "jabellae" );

    me.wallet["_"]("secret");
    me.wallet.hidden.notes("private note");
    assert.equal(me("wallet.hidden.notes"), "private note");

    me.wallet.hidden["-"]("notes");

    dump(me, "A6 after remove wallet.hidden.notes");

    const v = me("wallet.hidden.notes");
    assert.ok(
      v === null ||
        v === undefined ||
        v === "-" ||
        (typeof v === "object" && v !== null && (v as any).__tombstone === true),
      "expected removed value to no longer be the original"
    );
  });

  it("A7: returning to public after secret/noise leaves public ledger readable", () => {
    const me = new (ME as any)() as MEProxy;

    me["@"]( "jabellae" );

    me.ledger.host("localhost:8161");
    me.ledger.protocol("http");

    me.profile["_"]("alpha");
    me.profile.name("Abella");
    me.profile["~"]("noise");
    me.profile["_"]("beta");
    me.profile.hidden.seed("beta-seed");

    // back to root public
    me.ledger.status("ok");

    dump(me, "A7 after secret/noise then back to public root");

    assert.equal(me("ledger.host"), "localhost:8161");
    assert.equal(me("ledger.protocol"), "http");
    assert.equal(me("ledger.status"), "ok");

    assertStealthRoot(me, "profile");
    assert.ok((((me as any).encryptedBranches) || {})["profile"], "expected encryptedBranches['profile']");
  });
});

export {};
