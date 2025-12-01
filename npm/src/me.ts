import sha3 from "js-sha3";

const { keccak256 } = sha3;
interface MeDeclaration {
  key: string;
  value: any;
  signature: string;
  timestamp: number;
}
export type MEProxy = ME & {
  [key: string]: any;
  (...args: any[]): MEProxy;
};
export class ME {
  [key: string]: any;
  username: string;
  secret: string;
  identityRoot: string;
  publicKey: string;
  identityHash: string;
  blockchain: string;

  // Encrypted semantic tree
  payload: any = {};

  // Declarations for each semantic assignment
  declarations: MeDeclaration[] = [];

  // Secret per path ("" = root)
  private secrets: Record<string, string> = {};
  // Preserve encrypted blobs per branch + secret so switching secrets does not
  // destroy previous encrypted universes.
  private branchVersions: Record<string, Record<string, string>> = {};
  constructor(username: string, secret: string, blockchain: string) {
    this.username = username;
    this.secret = secret;
    this.blockchain = blockchain;
    this.identityRoot = "0x" + keccak256(secret);
    this.publicKey = "0x" + keccak256("public:" + secret);
    this.identityHash = "0x" + keccak256(this.publicKey + this.username);
    // root secret
    this.secrets[""] = secret;
    // Create the root proxy so we can do me.foo.bar(123) and me("path")
    const rootProxy = this.createProxy([]);
    // Make the proxy also behave like an ME instance:
    // - attach ME prototype so instanceof checks work
    // - copy over instance fields so tools/consumers can inspect state if needed
    Object.setPrototypeOf(rootProxy as any, ME.prototype);
    Object.assign(rootProxy as any, this);
    return rootProxy as MEProxy;
  }

  /**
   * Create a proxy bound to a specific path, e.g. ["wallet", "income"]
   * The proxy itself is callable (function) and also expandable via property access.
   */
  private createProxy(path: string[]): MEProxy {
    const self = this;
    // target function used so that the proxy is callable
    const fn: any = (...args: any[]) => {
      return self.handleCall(path, args);
    };

    return new Proxy(fn, {
      get(target, prop) {
        // Allow access to real ME methods/properties (export, sign, etc.)
        if (typeof prop === "symbol") return (target as any)[prop];
        // "secret" is a reserved semantic operation; do not expose the internal field
        if (prop === "secret") return self.createProxy([...path, String(prop)]);
        if (prop in self) return (self as any)[prop];
        const newPath = [...path, String(prop)];
        return self.createProxy(newPath);
      },

      apply(target, thisArg, args) {
        return self.handleCall(path, args);
      },
    }) as MEProxy;
  }

  /**
   * Handle a call at a given path.
   * Examples:
   *   me.wallet.income(200)       → set encrypted payload at wallet.income
   *   me.wallet.secret("abc123")  → set secret for path "wallet"
   *   me.wallet.ptr()             → return pointer object { __ptr: "wallet" }
   */
  private handleCall(path: string[], args: any[]): MEProxy | any {
    if (path.length === 0) {
      // Direct me(...) call:
      // If argument is a string, treat as a GET for that semantic path.
      if (args.length === 1 && typeof args[0] === "string") {
        const getPath = args[0].split(".").filter(Boolean);
        return this.exportBranch(getPath.join("."));
      }

      // Otherwise return the root proxy (no‑op call).
      return this.createProxy([]) as MEProxy;
    }

    const last = path[path.length - 1];
    // Special method: secret() — sets a secret for the parent path
    if (last === "secret") {
      const parentPath = path.slice(0, -1);
      const parentKey = parentPath.join(".");
      const newSecret = String(args[0] ?? "");
      if (!newSecret) return this.createProxy(parentPath) as MEProxy;
      this.secrets[parentKey] = newSecret;
      // Optionally register a declaration that a secret was set (without leaking its value)
      const signature = "0x" + keccak256(this.secret + parentKey + "::secret-set");
      this.declarations.push({
        key: parentKey + ".secret",
        value: "<secret-set>",
        signature,
        timestamp: Date.now(),
      });

      return this.createProxy(parentPath) as MEProxy;
    }

    // Special method: ptr() — returns a pointer to the current branch
    if (last === "ptr") {
      const parentPath = path.slice(0, -1);
      const keyPath = parentPath.join(".");
      return { __ptr: keyPath };
    }

    // Normal semantic assignment: me.foo.bar(value)
    const keyPath = path.join(".");
    let value: any;
    if (args.length === 0) value = undefined;
    else if (args.length === 1) value = args[0];
    else value = args;
    // Write encrypted value into the semantic tree
    this.ensurePath(path, value);
    // Use the resolved secret for this path to sign the declaration
    const effectiveSecret = this.resolveSecret(path);
    const signature = "0x" + keccak256(
      effectiveSecret +
      keyPath +
      JSON.stringify(value)
    );

    this.declarations.push({
      key: keyPath,
      value,
      signature,
      timestamp: Date.now(),
    });

    // After an assignment, stay on the same branch so deeper chaining preserves context
    return this.createProxy(path) as MEProxy;
  }

  /**
   * Secret scope resolution with path:
   * - Find the most specific path that has a secret.
   * - Return both the secret and the path at which it was defined.
   * - If none, fall back to root secret with empty path.
   */
  private resolveSecretWithPath(path: string[]): { secret: string; secretPath: string[] } {
    for (let i = path.length; i >= 0; i--) {
      const key = path.slice(0, i).join(".");
      if (this.secrets[key]) {
        return { secret: this.secrets[key], secretPath: path.slice(0, i) };
      }
    }
    // root secret
    return { secret: this.secret, secretPath: [] };
  }

  /**
   * Backwards-compatible helper: only return the secret string.
   */
  private resolveSecret(path: string[]): string {
    return this.resolveSecretWithPath(path).secret;
  }

  /**
   * Encrypt and store the value at the given path inside `payload`.
   *
   * If there is a non-root secret defined for some ancestor path P of `path`,
   * we treat that ancestor path P as the "branch root" and store the ENTIRE
   * subtree under P as ONE encrypted blob at that location.
   *
   * This means that to re-enter that channel you need both:
   *   - the full expression for P, and
   *   - the secret used at P.
   */
  private ensurePath(path: string[], value: any) {
    const { secret, secretPath } = this.resolveSecretWithPath(path);
    const branchKey = secretPath.join(".");
    const secretKey = keccak256(secret);

    // If the secretPath is non-empty, we treat that node as the branch root
    // for full-blob encryption. Root secret (empty path) does not trigger
    // branch-blob mode; it just encrypts leaves normally.
    const useBranchBlob = secretPath.length > 0;

    if (useBranchBlob) {
      // 1) Get current branch node for THIS secret at secretPath
      let branchTree: any = {};
      const existingBlob = this.branchVersions[branchKey]?.[secretKey];
      const existingPayload = this.getSubPayload(secretPath);

      if (existingBlob) {
        const decrypted = this.decryptForPath(secretPath, existingBlob);
        if (decrypted && typeof decrypted === "object") branchTree = decrypted;
      } else if (typeof existingPayload === "string") {
        const decrypted = this.decryptForPath(secretPath, existingPayload);
        if (decrypted && typeof decrypted === "object") branchTree = decrypted;
      } else if (existingPayload && typeof existingPayload === "object") {
        branchTree = existingPayload;
      }

      // 2) Apply the new assignment into the decrypted branch tree
      const relPath = path.slice(secretPath.length); // path relative to branch root
      let ref = branchTree;
      for (let i = 0; i < relPath.length - 1; i++) {
        const part = relPath[i];
        if (!ref[part] || typeof ref[part] !== "object") {
          ref[part] = {};
        }
        ref = ref[part];
      }
      const lastRel = relPath[relPath.length - 1];
      ref[lastRel] = value;

      // 3) Encrypt the WHOLE branch tree as one value using the secret for secretPath
      const encryptedBlob = this.encryptForPath(secretPath, branchTree);

      // 4) Store the encrypted blob back at secretPath
      if (!this.branchVersions[branchKey]) this.branchVersions[branchKey] = {};
      this.branchVersions[branchKey][secretKey] = encryptedBlob;
      this.writeBranchBlob(secretPath, encryptedBlob);
      return;
    }

    // DEFAULT BEHAVIOR (leaf encryption only, using root secret)
    const encrypted = this.encryptForPath(path, value);

    let ref = this.payload;
    for (let i = 0; i < path.length - 1; i++) {
      const part = path[i];
      if (!ref[part] || typeof ref[part] !== "object") {
        ref[part] = {};
      }
      ref = ref[part];
    }
    const last = path[path.length - 1];
    ref[last] = encrypted;
  }

  /**
   * Set a value at a nested path inside `payload`.
   */
  private setSubPayload(path: string[], value: any) {
    if (path.length === 0) {
      this.payload = value;
      return;
    }
    let ref = this.payload;
    for (let i = 0; i < path.length - 1; i++) {
      const part = path[i];
      if (!ref[part] || typeof ref[part] !== "object") {
        ref[part] = {};
      }
      ref = ref[part];
    }
    const last = path[path.length - 1];
    ref[last] = value;
  }

  /**
   * Find the nearest ancestor path that represents an encrypted branch blob.
   */
  private findNearestBranchAncestor(path: string[]): { path: string[]; secret: string } | null {
    for (let i = path.length - 1; i >= 1; i--) {
      const ancestorPath = path.slice(0, i);
      const key = ancestorPath.join(".");
      if (this.branchVersions[key]) {
        return { path: ancestorPath, secret: this.resolveSecret(ancestorPath) };
      }
    }
    return null;
  }

  /**
   * Write an encrypted branch blob while preserving any encrypted ancestor branches.
   */
  private writeBranchBlob(path: string[], blob: string) {
    let currentPath = path;
    let currentBlob = blob;

    while (true) {
      const ancestor = this.findNearestBranchAncestor(currentPath);
      if (!ancestor) {
        this.setSubPayload(currentPath, currentBlob);
        return;
      }

      const { path: ancestorPath, secret } = ancestor;
      const ancestorKey = ancestorPath.join(".");
      const ancestorSecretKey = keccak256(secret);
      const existingPayload = this.getSubPayload(ancestorPath);
      const existingBlob =
        this.branchVersions[ancestorKey]?.[ancestorSecretKey] ??
        (typeof existingPayload === "string" ? existingPayload : undefined);

      let ancestorTree: any = {};
      if (existingBlob) {
        const decrypted = this.decryptForPath(ancestorPath, existingBlob);
        if (decrypted && typeof decrypted === "object") {
          ancestorTree = decrypted;
        }
      }

      const relPath = currentPath.slice(ancestorPath.length);
      let ref = ancestorTree;
      for (let i = 0; i < relPath.length - 1; i++) {
        const part = relPath[i];
        if (!ref[part] || typeof ref[part] !== "object") ref[part] = {};
        ref = ref[part];
      }
      ref[relPath[relPath.length - 1]] = currentBlob;

      const encryptedAncestor = this.encryptForPath(ancestorPath, ancestorTree);
      if (!this.branchVersions[ancestorKey]) this.branchVersions[ancestorKey] = {};
      this.branchVersions[ancestorKey][ancestorSecretKey] = encryptedAncestor;

      currentPath = ancestorPath;
      currentBlob = encryptedAncestor;
    }
  }

  private getSubPayload(path: string[]): any {
    let ref = this.payload;
    for (const part of path) {
      if (!ref || typeof ref !== "object") return undefined;
      ref = ref[part];
    }
    return ref;
  }

  /**
   * Recursively decrypt a node of the encrypted payload tree.
   */
  private decryptTree(path: string[], node: any): any {
    if (node === undefined || node === null) return node;

    if (typeof node === "string") {
      if (!this.isHexString(node)) return node;
      const decrypted = this.decryptForPath(path, node);
      return decrypted === null ? node : decrypted;
    }

    if (typeof node !== "object") {
      // Unstructured, return as-is
      return node;
    }

    const result: any = Array.isArray(node) ? [] : {};
    for (const key of Object.keys(node)) {
      const childPath = [...path, key];
      result[key] = this.decryptTree(childPath, node[key]);
    }
    return result;
  }

  /**
   * Encrypt a value (object or primitive) using the secret resolved for the given path.
   * Produces a hex string compatible with decryptForPath().
   */
  private encryptForPath(path: string[], value: any): string {
    const secret = this.resolveSecret(path);

    // Convert value to JSON bytes
    const jsonStr = JSON.stringify(value);
    const bytes = new TextEncoder().encode(jsonStr);

    // Generate key bytes using secret + path
    const key = keccak256(secret + ":" + path.join("."));
    const keyBytes = this.asciiToBytes(key);

    // XOR-encrypt
    const out = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) {
      out[i] = bytes[i] ^ keyBytes[i % keyBytes.length];
    }

    // Convert encrypted bytes to hex string
    let hex = "";
    for (let i = 0; i < out.length; i++) {
      hex += out[i].toString(16).padStart(2, "0");
    }
    return hex;
  }

  /**
   * Decrypt a single encrypted blob using the secret resolved for the given path.
   */
  private decryptForPath(path: string[], encrypted: string): any {
    // Resolve secret for this path
    const secret = this.resolveSecret(path);

    try {
      // Decode hex
      const bytes = this.hexToBytes(encrypted);

      // Generate key bytes
      const key = keccak256(secret + ":" + path.join("."));
      const keyBytes = this.asciiToBytes(key);

      // XOR-decrypt
      const out = new Uint8Array(bytes.length);
      for (let i = 0; i < bytes.length; i++) {
        out[i] = bytes[i] ^ keyBytes[i % keyBytes.length];
      }

      const jsonStr = new TextDecoder().decode(out);
      return JSON.parse(jsonStr);
    } catch (e) {
      return null;
    }
  }

  private asciiToBytes(str: string): Uint8Array {
    return new TextEncoder().encode(str);
  }

  private hexToBytes(hex: string): Uint8Array {
    const clean = hex.startsWith("0x") ? hex.slice(2) : hex;
    const out = new Uint8Array(clean.length / 2);
    for (let i = 0; i < out.length; i++) {
      out[i] = parseInt(clean.substr(i * 2, 2), 16);
    }
    return out;
  }

  private isHexString(value: string): boolean {
    const clean = value.startsWith("0x") ? value.slice(2) : value;
    return clean.length > 0 && clean.length % 2 === 0 && /^[0-9a-fA-F]+$/.test(clean);
  }

  /**
   * Export the encrypted payload and declaration metadata.
   */
  export() {
    return {
      identityRoot: this.identityRoot,
      publicKey: this.publicKey,
      identityHash: this.identityHash,
      declarations: this.declarations,
      payload: this.payload,
    };
  }

  /**
   * Export and decrypt a specific branch using the currently active secret
   * resolved for that path.
   */
  exportBranch(path: string): any {
    const parts = path ? path.split(".").filter(Boolean) : [];
    const branchKey = parts.join(".");
    const secret = this.resolveSecret(parts);
    const secretKey = keccak256(secret);

    const versionedBlob = this.branchVersions[branchKey]?.[secretKey];
    if (versionedBlob) {
      const decrypted = this.decryptForPath(parts, versionedBlob);
      return this.decryptTree(parts, decrypted);
    }

    const node = this.getSubPayload(parts);
    if (node === undefined) return undefined;
    if (typeof node === "string") {
      const decrypted = this.decryptForPath(parts, node);
      return this.decryptTree(parts, decrypted);
    }
    return this.decryptTree(parts, node);
  }
}
