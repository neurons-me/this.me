import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ME } from "../src/me.ts";

describe("ME Secret Derivation & Branch Encryption", () => {

  it("should encrypt a simple leaf using root secret", () => {
    const me: any = new ME("abellae", "rootSecret123");

    me.instrument("Moog");

    const exported = me.export();
    assert.ok(typeof exported.payload.instrument === "string", "payload.instrument must be encrypted hex");
    assert.notEqual(exported.payload.instrument, "Moog", "value must NOT be stored in plain text");

    const branch = me("instrument");
    assert.equal(branch, "Moog", "branch decrypt should return original value");
  });

  it("should encrypt entire branch as single blob when secret is applied at a path", () => {
    const me: any = new ME("abellae", "root");

    me.wallet.eth("W1").friends.secret("XYZ");
    me.wallet.eth("W1").friends.list(["Ana", "Luis"]);
    me.wallet.eth("W1").friends.best("Luis");

    const exported = me.export();

    // Navigate: payload.wallet.eth.friends should be a HEX blob
    const friendsBlob =
      exported.payload.wallet.eth.friends;

    assert.ok(typeof friendsBlob === "string", "friends subtree must be stored as single encrypted blob");
    assert(!friendsBlob.includes("Ana"), "should not contain plain data");
    assert(!friendsBlob.includes("Luis"), "should not contain plain data");

    const branch = me("wallet.eth.friends");

    assert.deepEqual(branch, {
      list: ["Ana", "Luis"],
      best: "Luis",
    });
  });

  it("should support nested secrets inside branch-level secrets", () => {
    const me: any = new ME("abellae", "root");

    me.wallet.eth("W1").friends.secret("XYZ");
    me.wallet.eth("W1").friends.list(["Ana"]);

    me.wallet.eth("W1").friends.best.secret("KKK");
    me.wallet.eth("W1").friends.best.reason("confianza");

    const branch = me("wallet.eth.friends");

    assert.deepEqual(branch, {
      list: ["Ana"],
      best: {
        reason: "confianza",
      },
    });
  });

  it("should isolate encrypted branches so they require full path + secret", () => {
    const me: any = new ME("abellae", "root");

    me.notes.secret("A1");
    me.notes.private("hola");

    let exported = me.export();
    assert.ok(typeof exported.payload.notes === "string", "notes subtree must be encrypted blob");

    const branch = me("notes");
    assert.deepEqual(branch, { private: "hola" });

    // Now override with another secret, creating a second encrypted universe
    me.notes.secret("B2");
    me.notes.private("mundo");

    exported = me.export();

    const branchA1 = me("notes"); // using B2 now
    assert.deepEqual(branchA1, { private: "mundo" }, "should decrypt using B2 universe");

    // Simulate "returning" to A1 universe:
    me.notes.secret("A1");
    const branchA1b = me("notes");

    assert.deepEqual(branchA1b, { private: "hola" }, "A1 should decode original universe");
  });

});