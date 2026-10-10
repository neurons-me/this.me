/**
 * Provenance recorded in every results file: kernel build, Node, machine, aggregate style.
 * The kernel is whatever sits in Typescript/dist (the README says to copy the published npm dist there);
 * dist carries no version string, so pass ME_VERSION=<x.y.z> and the sha256 of dist/me.es.js is recorded too.
 */
import { createHash } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import { cpus, totalmem, type, release, arch } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const dist = join(dirname(fileURLToPath(import.meta.url)), "../../../dist/me.es.js");

/** "explicit" = 4.1-style `a + b + …` sum formulas; "bracket" = 4.2 collection aggregate `parent.member[].on`. */
export const AGG_STYLE: "explicit" | "bracket" = process.env.GTFS_AGG === "bracket" ? "bracket" : "explicit";

export function runEnv() {
  const c = cpus();
  return {
    thisMe: process.env.ME_VERSION ?? "unknown (set ME_VERSION)",
    distSha256: existsSync(dist) ? createHash("sha256").update(readFileSync(dist)).digest("hex") : null,
    node: process.version,
    cpu: `${c[0]?.model ?? "?"} × ${c.length}`,
    memGiB: Math.round(totalmem() / 2 ** 30),
    os: `${type()} ${release()} ${arch()}`,
    aggregates: AGG_STYLE,
    date: new Date().toISOString(),
  };
}

export function runEnvLine(): string {
  const e = runEnv();
  return `this.me@${e.thisMe} (dist/me.es.js sha256 ${e.distSha256?.slice(0, 12) ?? "?"}…), Node ${e.node}, ${e.cpu}, ${e.memGiB} GiB, ${e.os}; count aggregates: ${e.aggregates}; ${e.date}`;
}
