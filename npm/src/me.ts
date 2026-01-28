// me/npm/src/me.ts
import type { Thought, SemanticPath, EncryptedBlob } from "./types.js";
import {
  isThought,
  isPointer,
  isIdentityRef,
  makePointer,
  makeIdentityRef,
  normalizeAndValidateUsername,
  splitPath,
  pathStartsWith,
} from "./operators.js";
import { xorEncrypt, xorDecrypt, isEncryptedBlob } from "./crypto.js";
import { handleCall as handleCallFn } from "./handleCall.js";
// Proxy type for ME: allows callable and property access
export type MEProxy = ME & {
  [key: string]: any;
  (...args: any[]): MEProxy;
};
// me.ts
// Runtime semántico + cripto fractal basado en triadas:
// me(expression)
// Secret scoping (kernel-only): use `_("secret")` to declare a secret scope at a path.
// Example: me.layer1._("ABC").then.anything.below(...)
// Read: me("a.b.c") -> returns resolved value (decrypts if needed). Reading a scope root (e.g. me("layer1")) returns `undefined` on purpose (stealth).
const OP_DEFINE = "+";
// Hash simple portable (FNV-1a 32-bit, como antes)
function hashFn(input: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return ("00000000" + (h >>> 0).toString(16)).slice(-8);
}

export class ME {
  [key: string]: any;
  // Secret local por ruta ("a.b.c" -> secret declarado en ese nivel)
  private localSecrets: Record<string, string> = {};
  private localNoises: Record<string, string> = {};
  // Encrypted branch blobs stored at scope roots ("wallet" -> cipherblob)
  private encryptedBranches: Record<string, EncryptedBlob> = {};
  // Derived read index (path -> latest committed value). Canonical truth is shortTermMemory.
  private index: Record<string, any> = {};
  // Runtime log lives as a semantic node, but is updated via a kernel write (no extra thoughts).
  // This avoids the infinite recursion problem of: postulate -> write memory -> postulate -> ...
  private _shortTermMemory: Thought[] = [];
  // semantic accessor (property-style)
  get shortTermMemory(): Thought[] {
    return this._shortTermMemory;
  }
  // Kernel operator registry (editable through me["+"]("op", kind))
  // kind: "secret" | "pointer" | "identity" | "custom" | "remove" | "eval" | "query" | "noise"
  private operators: Record<string, { kind: string }> = {
    "_": { kind: "secret" },
    "~": { kind: "noise" },
    "__": { kind: "pointer" },
    "->": { kind: "pointer" },
    "@": { kind: "identity" },
    "=": { kind: "eval" },
    "?": { kind: "query" },
    "-": { kind: "remove" },
  };

  /**
   * Constructor base:
   *  me = new ME(expression?)
   *
   * Esto es equivalente a llamar:
   *   me(expression) en la raíz.
   */
  constructor(expression?: any) {
    this.localSecrets = {};
    this.localNoises = {};
    this.encryptedBranches = {};
    this.index = {};
    this.operators = {
      "_": { kind: "secret" },
      "~": { kind: "noise" },
      "__": { kind: "pointer" },
      "->": { kind: "pointer" },
      "@": { kind: "identity" },
      "=": { kind: "eval" },
      "?": { kind: "query" },
      "-": { kind: "remove" },
    };
    this._shortTermMemory = [];
    // Si hay triada inicial, la registramos en la raíz ("")
    if (expression !== undefined) {
      this.postulate([], expression);
    }
    this.rebuildIndex();
    const rootProxy = this.createProxy([]);
    Object.setPrototypeOf(rootProxy as any, ME.prototype);
    Object.assign(rootProxy as any, this);
    return rootProxy as unknown as ME;
  }

  private isRemoveCall(path: SemanticPath, expression: any): { targetPath: SemanticPath } | null {
    if (path.length === 0) return null;
    const { scope, leaf } = splitPath(path);
    if (!leaf) return null;
    if (this.opKind(leaf) !== "remove") return null;
    // Allow:
    //   me.foo.bar["-"]()          -> removes subtree rooted at foo.bar
    //   me["-"]("a.b.c")           -> removes subtree rooted at a.b.c (root operator)
    //   me.foo["-"]("x.y")         -> removes subtree rooted at foo.x.y (relative)
    if (expression === undefined || expression === null) {
      return { targetPath: scope };
    }

    if (typeof expression === "string") {
      const rel = expression.split(".").filter(Boolean);
      const targetPath = [...scope, ...rel];
      return { targetPath };
    }

    return null;
  }

  // ---------------------------------------------------------
  // Proxy infinito: me.foo.bar(...triada)
  // ---------------------------------------------------------
  private createProxy(path: SemanticPath): MEProxy {
    const self = this;
    const fn: any = (...args: any[]) => {
      return handleCallFn(
        {
          createProxy: (p) => self.createProxy(p),
          normalizeArgs: (a) => self.normalizeArgs(a),
          readPath: (p) => self.readPath(p),
          postulate: (p, e) => self.postulate(p, e),
          opKind: (op) => self.opKind(op),
          splitPath,
          isThought,
        },
        path,
        args
      );
    };

    return new Proxy(fn, {
      get(target, prop) {
        if (typeof prop === "symbol") return (target as any)[prop];
        // Support direct access to real instance methods/props.
        // IMPORTANT: if the property exists on the ME instance prototype (methods like `postulate`, etc)
        // or is a real data accessor (like `shortTermMemory` getter), we should return it.
        if (prop in self) {
          const existing = (self as any)[prop];
          if (typeof existing === "function") return existing.bind(self);
          return existing;
        }

        // Everything else is semantic path chaining.
        const newPath = [...path, String(prop)];
        return self.createProxy(newPath);
      },
      apply(target, _thisArg, args) {
        // When invoked, always go through the function we created (fn) via `target` to preserve chaining.
        return Reflect.apply(target as any, undefined, args);
      },
    }) as MEProxy;
  }

  // Normaliza args:
  //   ()       → expression = undefined
  //   (expr)   → expr
  // Preserve operator multi-arg calls like:
  //   me["+"]("=", "eval")
  //   me["?"](["a.b"], fn)
  // For normal writes, keep single-arg semantics.
  // NOTE: secrets are declared structurally via _("..."), not as args.
  private normalizeArgs(args: any[]): any {
    if (args.length === 0) return undefined;
    if (args.length === 1) return args[0];
    return args;
  }

  private opKind(op: string): string | null {
    const hit = this.operators[op];
    return hit?.kind ?? null;
  }

  private isSecretScopeCall(path: SemanticPath, expression: any): { scopeKey: string } | null {
    if (path.length === 0) return null;
    const { scope, leaf } = splitPath(path);
    if (!leaf) return null;
    if (this.opKind(leaf) !== "secret") return null;
    if (typeof expression !== "string") return null;
    return { scopeKey: scope.join(".") };
  }

  private isNoiseScopeCall(path: SemanticPath, expression: any): { scopeKey: string } | null {
    if (path.length === 0) return null;
    const { scope, leaf } = splitPath(path);
    if (!leaf) return null;
    if (this.opKind(leaf) !== "noise") return null;
    if (typeof expression !== "string") return null;
    return { scopeKey: scope.join(".") };
  }

  private isPointerCall(path: SemanticPath, expression: any): { targetPath: string } | null {
    if (path.length === 0) return null;
    const { leaf } = splitPath(path);
    if (!leaf) return null;
    if (this.opKind(leaf) !== "pointer") return null;
    if (typeof expression !== "string") return null;
    const targetPath = expression.trim().replace(/^\./, "");
    if (!targetPath) return null;
    return { targetPath };
  }

  private isIdentityCall(path: SemanticPath, expression: any): { id: string; targetPath: SemanticPath } | null {
    // Allow identity operator both at root and at any path:
    //   ME()["@"]("jabellae")         -> stores identity at root (path="")
    //   me.profile["@"]("foo")         -> stores identity at scope "profile"

    // Root form: me["@"]("id") is represented as path=["@"].
    // This must return a chainable proxy via postulate -> handleCall.
    if (path.length === 1 && this.opKind(path[0]) === "identity") {
      if (typeof expression !== "string") return null;
      const id = normalizeAndValidateUsername(expression);
      return { id, targetPath: [] };
    }

    // Non-root form: me.something["@"]("id")
    const { scope, leaf } = splitPath(path);
    if (!leaf) return null;
    if (this.opKind(leaf) !== "identity") return null;
    if (typeof expression !== "string") return null;
    const id = normalizeAndValidateUsername(expression);
    return { id, targetPath: scope };
  }

  private isEvalCall(
    path: SemanticPath,
    expression: any
  ):
    | { mode: "thunk"; targetPath: SemanticPath; thunk: Function }
    | { mode: "assign"; targetPath: SemanticPath; name: string; expr: string }
    | null {
    // Supported:
    //   me["="](() => expr)                 -> returns computed value (root) OR assigns (non-root)
    //   me.foo.bar["="](() => expr)         -> assigns result to foo.bar
    //   me.foo["="]("net", "a - b")        -> assigns derived value to foo.net
    //   me.foo["="](["net", "a - b"])      -> same as above
    if (path.length === 0) return null;
    const { scope, leaf } = splitPath(path);
    if (!leaf) return null;
    if (this.opKind(leaf) !== "eval") return null;
    // Thunk form
    if (typeof expression === "function") {
      return { mode: "thunk", targetPath: scope, thunk: expression };
    }

    // Assign form: [name, expr] or (name, expr) packed by normalizeArgs as an array
    if (Array.isArray(expression) && expression.length >= 2) {
      const name = String(expression[0] ?? "").trim();
      const expr = String(expression[1] ?? "").trim();
      if (!name || !expr) return null;
      return { mode: "assign", targetPath: scope, name, expr };
    }

    return null;
  }

  private isQueryCall(
    path: SemanticPath,
    expression: any
  ): { targetPath: SemanticPath; paths: string[]; fn?: Function } | null {
    // Supported:
    //   me["?"](["a.b", "c.d"], fn?)
    //   me["?"](["a.b", "c.d"])
    //   me.foo["?"](["x.y"], fn?)      -> assigns result to foo
    //   me.foo["?"]("x.y", "z.k")     -> variadic, packed by normalizeArgs into an array
    if (path.length === 0) return null;
    const { scope, leaf } = splitPath(path);
    if (!leaf) return null;
    if (this.opKind(leaf) !== "query") return null;
    let pathsArg: any = null;
    let fn: Function | undefined;
    // normalize args: expression may be either:
    //  - tuple array: [pathsArray, fn]
    //  - a paths array directly: ["a.b", "c.d"]
    //  - variadic packed array: ["a.b", "c.d", "e.f"]
    if (Array.isArray(expression) && expression.length > 0) {
      const looksLikeTuple =
        Array.isArray(expression[0]) &&
        (expression.length === 1 || typeof expression[1] === "function");
      if (looksLikeTuple) {
        pathsArg = expression[0];
        fn = typeof expression[1] === "function" ? (expression[1] as Function) : undefined;
      } else {
        pathsArg = expression;
      }
    } else {
      return null;
    }

    if (!Array.isArray(pathsArg) || pathsArg.length === 0) return null;
    const paths = pathsArg
      .map((p: any) => String(p))
      .map((p: string) => p.trim())
      .filter((p: string) => p.length > 0);
    if (paths.length === 0) return null;
    return { targetPath: scope, paths, fn };
  }

  private isDefineOpCall(path: SemanticPath, expression: any): { op: string; kind: string } | null {
    // Only allow defining operators at root: me["+"]("op", "kind")
    if (path.length !== 1) return null;
    const leaf = path[0];
    if (leaf !== OP_DEFINE) return null;
    if (!Array.isArray(expression) || expression.length < 2) return null;
    const op = String(expression[0] ?? "").trim();
    const kind = String(expression[1] ?? "").trim();
    if (!op || !kind) return null;
    // protect core define operator from being overwritten
    if (op === OP_DEFINE) return null;
    return { op, kind };
  }

  // ---------------------------------------------------------
  // Postulate: semantic write at a given path
  // ---------------------------------------------------------
  private postulate(path: SemanticPath, expression: any, operator: string | null = null): any {
    let targetPath = path;
    let storedValue: any = expression;
    // Operator definition (kernel-only): me["+"]("op", "kind")
    const def = this.isDefineOpCall(targetPath, expression);
    if (def) {
      // Kernel-only: do not generate thoughts
      this.operators[def.op] = { kind: def.kind };
      return;
    }

    // Eval operator: evaluate a thunk and optionally assign the result
    //   me["="](() => expr)               -> records a thought only
    //   me.foo.bar["="](() => expr)       -> assigns evaluated result to foo.bar
    //   me.foo["="]("net", "a - b")       -> assigns derived value to foo.net
    //   me.foo["="](["net", "a - b"])     -> same as above
    const ev = this.isEvalCall(targetPath, expression);
    if (ev) {
      if (ev.mode === "thunk") {
        const value = ev.thunk();
        // root eval: me["="](() => ...) returns the computed value
        if (ev.targetPath.length === 0) {
          return value;
        }

        // assign evaluated result to the destination path (path without the operator leaf)
        return this.postulate(ev.targetPath, value, "=");
      }

      // String-expression assign form
      // Example: me.wallet["="]("net", "wallet.income - wallet.expenses.rent")
      // We store the expression as-is for now; actual evaluation can be added later.
      // Commit to `<targetPath>.<name>` so it behaves like a derived leaf.
      const assignTarget = [...ev.targetPath, ev.name];
      return this.postulate(assignTarget, ev.expr, "=");
    }

    // Query operator: collect values from paths and optionally transform
    //   me["?"](["a.b","c.d"])                   -> records collected array as a thought
    //   me["?"](["a.b","c.d"], (a,b)=>...)       -> records fn(a,b) as a thought
    //   me.foo["?"](["a.b"], (a)=>...)           -> assigns result to foo
    const q = this.isQueryCall(targetPath, expression);
    if (q) {
      const values = q.paths.map((p) => this.readPath(p.split(".").filter(Boolean)));
      const out = q.fn ? (q.fn as any)(...values) : values;
      // root query: me["?"](...) returns the result
      if (q.targetPath.length === 0) {
        return out;
      }

      // assign collected result at destination path
      return this.postulate(q.targetPath, out, "?");
    }

    // Remove operator
    const rm = this.isRemoveCall(targetPath, expression);
    if (rm) {
      this.removeSubtree(rm.targetPath);
      return;
    }

    // Secret declaration nodes:
    //   me.layer1._("ABC")  -> declares secret for scope `layer1`
    // Record an operator thought without leaking the secret value.
    const scopeCall = this.isSecretScopeCall(targetPath, expression);
    if (scopeCall) {
      this.localSecrets[scopeCall.scopeKey] = expression;
      // Record an operator thought without leaking the secret value.
      const scopePath = scopeCall.scopeKey ? scopeCall.scopeKey.split(".").filter(Boolean) : [];
      const pathStr = scopePath.join(".");
      const effectiveSecret = this.computeEffectiveSecret(scopePath);
      const safeExpression = "***";
      const safeValue = "***";
      const hashInput = JSON.stringify({
        path: pathStr,
        operator: "_",
        expression: safeExpression,
        value: safeValue,
        effectiveSecret,
      });
      const hash = hashFn(hashInput);
      const timestamp = Date.now();
      const thought: Thought = {
        path: pathStr,
        operator: "_",
        expression: safeExpression,
        value: safeValue,
        effectiveSecret,
        hash,
        timestamp,
      };
      this._shortTermMemory.push(thought);
      this.rebuildIndex();
      return thought;
    }

    // Noise declaration nodes:
    //   me.layer1["~"]("NOISE") -> declares a noise override for scope `layer1`
    // Record an operator thought without leaking the noise value.
    const noiseCall = this.isNoiseScopeCall(targetPath, expression);
    if (noiseCall) {
      this.localNoises[noiseCall.scopeKey] = expression;
      // Record an operator thought without leaking the noise value.
      const scopePath = noiseCall.scopeKey ? noiseCall.scopeKey.split(".").filter(Boolean) : [];
      const pathStr = scopePath.join(".");
      const effectiveSecret = this.computeEffectiveSecret(scopePath);
      const safeExpression = "***";
      const safeValue = "***";
      const hashInput = JSON.stringify({
        path: pathStr,
        operator: "~",
        expression: safeExpression,
        value: safeValue,
        effectiveSecret,
      });
      const hash = hashFn(hashInput);
      const timestamp = Date.now();
      const thought: Thought = {
        path: pathStr,
        operator: "~",
        expression: safeExpression,
        value: safeValue,
        effectiveSecret,
        hash,
        timestamp,
      };
      this._shortTermMemory.push(thought);
      this.rebuildIndex();
      return thought;
    }

    // Pointer declaration nodes (kernel-only):
    //   me.profile.city.__("geo.city") OR me.profile.city["->"]("geo.city")
    //   -> stores an opaque pointer object at `profile.city`
    // Meta-only: does not encrypt by itself, but can coexist with secret scopes.
    const ptrCall = this.isPointerCall(targetPath, expression);
    if (ptrCall) {
      const { scope } = splitPath(targetPath);
      targetPath = scope;
      expression = makePointer(ptrCall.targetPath);
      storedValue = expression;
      if (operator === null) operator = "__";
    }

    // Identity operator: store identity reference at scope (validated domain-safe username)
    const idCall = this.isIdentityCall(targetPath, expression);
    if (idCall) {
      targetPath = idCall.targetPath;
      expression = makeIdentityRef(idCall.id);
      storedValue = expression;
      if (operator === null) operator = "@";
    }

    const pathStr = targetPath.join(".");
    // 2) Calcular secretos efectivos fractales
    const effectiveSecret = this.computeEffectiveSecret(targetPath);
    // Guard: if a caller tries to write into a hidden scope via a userland alias (e.g. `.secret("x")`)
    // without having declared a kernel scope (`_(...)`), DO NOT auto-create an encrypted branch.
    // This keeps secret scoping purely structural.
    const scope = this.resolveBranchScope(targetPath);
    if (scope && scope.length === 0 && this.localSecrets[""] && !this.localSecrets[pathStr]) {
      // root secret is allowed to encrypt leaves (value-level), so no-op here
    }

    // 3) Escribir expresión en el árbol semántico (vía log + índice derivado)
    // Secret scope -> encryptedBranches only (stealth). Non-secret -> index stores ciphertext/plain.
    if (scope && scope.length > 0) {
      const scopeSecret = this.computeEffectiveSecret(scope);
      const rel = targetPath.slice(scope.length);
      // Decrypt existing branch object (if any)
      const existingBlob = this.getBranchBlob(scope);
      let branchObj: any = {};
      if (existingBlob && scopeSecret) {
        const dec = xorDecrypt(existingBlob, scopeSecret, scope);
        if (dec && typeof dec === "object") branchObj = dec;
      }

      // Mutate branch object at relative path
      if (rel.length === 0) {
        // root expression under scope
        if (typeof branchObj !== "object" || branchObj === null) branchObj = {};
        branchObj["expression"] = expression;
      } else {
        let ref = branchObj;
        for (let i = 0; i < rel.length - 1; i++) {
          const part = rel[i];
          if (!ref[part] || typeof ref[part] !== "object") ref[part] = {};
          ref = ref[part];
        }
        ref[rel[rel.length - 1]] = expression;
      }

      // Re-encrypt and store at scope root.
      if (scopeSecret) {
        const blob = xorEncrypt(branchObj, scopeSecret, scope);
        this.setBranchBlob(scope, blob);
      }
      storedValue = expression;
    } else if (effectiveSecret) {
      // value-level encryption (root secret or explicit path secret with no defined scope)
      // Do NOT encrypt pointer/identity marker objects; keep them structural.
      // ALSO: derived/eval/query operator outputs should stay readable as plain values.
      //       (You can still store secrets by putting them under a secret scope branch.)
      const shouldEncryptValue = operator !== "=" && operator !== "?";
      if (isPointer(expression) || isIdentityRef(expression) || !shouldEncryptValue) {
        storedValue = expression;
      } else {
        storedValue = xorEncrypt(expression, effectiveSecret, targetPath);
      }
    } else {
      storedValue = expression;
    }

    // 4) Calcular hash/firma de esta triada
    const value = storedValue;
    const hashInput = JSON.stringify({
      path: pathStr,
      operator,
      expression,
      value,
      effectiveSecret,
    });
    const hash = hashFn(hashInput);
    const timestamp = Date.now();
    const thought: Thought = {
      path: pathStr,
      operator,
      expression,
      value,
      effectiveSecret,
      hash,
      timestamp,
    };
    this._shortTermMemory.push(thought);
    this.rebuildIndex();
    return thought;
  }

  private removeSubtree(targetPath: SemanticPath) {
    // Remove secrets declared at/under this path (excluding root unless targetPath is root)
    const prefix = targetPath.join(".");
    for (const key of Object.keys(this.localSecrets)) {
      if (prefix === "") {
        // wiping root removes all
        delete this.localSecrets[key];
        continue;
      }
      if (key === prefix || key.startsWith(prefix + ".")) {
        delete this.localSecrets[key];
      }
    }

    // Remove noises declared at/under this path
    for (const key of Object.keys(this.localNoises)) {
      if (prefix === "") {
        delete this.localNoises[key];
        continue;
      }
      if (key === prefix || key.startsWith(prefix + ".")) {
        delete this.localNoises[key];
      }
    }

    // Remove encrypted branch blobs at/under this path
    for (const key of Object.keys(this.encryptedBranches)) {
      if (prefix === "") {
        delete this.encryptedBranches[key];
        continue;
      }
      if (key === prefix || key.startsWith(prefix + ".")) {
        delete this.encryptedBranches[key];
      }
    }

    // (optional but helpful) Record a thought/declaration for auditing.
    const pathStr = targetPath.join(".");
    const timestamp = Date.now();
    const effectiveSecret = this.computeEffectiveSecret(targetPath);
    const hashInput = JSON.stringify({ path: pathStr, operator: "-", expression: "-", value: "-", effectiveSecret });
    const hash = hashFn(hashInput);
    const thought: Thought = {
      path: pathStr,
      operator: "-",
      expression: "-",
      value: "-",
      effectiveSecret,
      hash,
      timestamp,
    };
    this._shortTermMemory.push(thought);
    this.rebuildIndex();
  }

  // ---------------------------------------------------------
  // Fractal secret: combina todos los secrets a lo largo de la ruta, o noise acts as a new root for chaining
  // ---------------------------------------------------------
  private computeEffectiveSecret(path: SemanticPath): string {
    // 0) Noise root: pick the deepest noise declared along the path.
    // If present, it becomes the new base seed for subsequent secret chaining *below it*.
    let noiseKey: string | null = null;
    let noiseValue: string | null = null;
    if (this.localNoises[""] !== undefined) {
      noiseKey = "";
      noiseValue = this.localNoises[""];
    }

    for (let i = 1; i <= path.length; i++) {
      const k = path.slice(0, i).join(".");
      if (this.localNoises[k] !== undefined) {
        noiseKey = k;
        noiseValue = this.localNoises[k];
      }
    }

    // Base seed is either a noise-derived seed or the default "root".
    let seed = "root";
    if (noiseValue) {
      seed = hashFn("noise::" + noiseValue);
    } else if (this.localSecrets[""]) {
      // Root secret participates only when there is no overriding noise.
      seed = hashFn(seed + "::" + this.localSecrets[""]);
    }

    // 1) Normal secret chaining, but only from the noise position downward.
    // If noiseKey is null, we chain secrets from root through the full path.
    // If noiseKey is set, we chain only secrets at/under that noise scope.
    const startDepth = noiseKey === null ? 1 : noiseKey === "" ? 0 : noiseKey.split(".").filter(Boolean).length;
    for (let i = 1; i <= path.length; i++) {
      const p = path.slice(0, i).join(".");
      if (this.localSecrets[p]) {
        // If we have a noiseKey, only apply secrets at or below that noise scope.
        if (noiseKey !== null) {
          if (noiseKey === "") {
            // allow all below root
          } else {
            const noisePrefix = noiseKey + ".";
            if (!(p === noiseKey || p.startsWith(noisePrefix))) continue;
          }
        }
        seed = hashFn(seed + "::" + this.localSecrets[p]);
      }
    }

    // If nothing contributed, return empty.
    // (This preserves old behavior where an empty effectiveSecret means "no encryption" for non-secret writes.)
    if (seed === "root") return "";
    return seed;
  }


  // ---------------------------------------------------------
  // Índice derivado
  // ---------------------------------------------------------
  private rebuildIndex() {
    const next: Record<string, any> = {};
    for (const t of this._shortTermMemory) {
      const p = t.path;
      const pathParts = p.split(".").filter(Boolean);
      const scope = this.resolveBranchScope(pathParts);
      const inSecret = scope && scope.length > 0 && pathStartsWith(pathParts, scope);
      if (t.operator === "-") {
        if (p === "") {
          for (const k of Object.keys(next)) delete next[k];
          continue;
        }
        const prefix = p + ".";
        for (const k of Object.keys(next)) {
          if (k === p || k.startsWith(prefix)) delete next[k];
        }
        continue;
      }

      if (inSecret) continue;
      next[p] = t.value;
    }
    this.index = next;
  }

  private getIndex(path: SemanticPath): any {
    return this.index[path.join(".")];
  }

  private setIndex(path: SemanticPath, value: any): void {
    this.index[path.join(".")] = value;
  }

  private resolveIndexPointerPath(path: SemanticPath, maxHops = 8): { path: SemanticPath; raw: any } {
    let curPath = path;
    for (let i = 0; i < maxHops; i++) {
      const raw = this.getIndex(curPath);
      if (!isPointer(raw)) return { path: curPath, raw };
      curPath = raw.__ptr.split(".").filter(Boolean);
    }
    return { path: curPath, raw: undefined };
  }

  private setBranchBlob(scope: SemanticPath, blob: EncryptedBlob) {
    const key = scope.join(".");
    this.encryptedBranches[key] = blob;
    // Intentionally do NOT mirror encrypted blobs into the index.
    // The index should not reveal that a secret scope even exists.
  }

  private getBranchBlob(scope: SemanticPath): EncryptedBlob | undefined {
    const key = scope.join(".");
    return this.encryptedBranches[key];
  }

  private resolveBranchScope(path: SemanticPath): SemanticPath | null {
    // pick the deepest scope root that has a secret declared
    let best: SemanticPath | null = null;
    if (this.localSecrets[""]) best = [];
    for (let i = 1; i <= path.length; i++) {
      const p = path.slice(0, i);
      const k = p.join(".");
      if (this.localSecrets[k]) best = p;
    }
    return best;
  }

  private readPath(path: SemanticPath): any {
    // 1) Secret scopes (non-root) live ONLY in encryptedBranches.
    const scope = this.resolveBranchScope(path);
    if (scope && scope.length > 0 && pathStartsWith(path, scope)) {
      if (path.length === scope.length) return undefined; // hide scope root
      const scopeSecret = this.computeEffectiveSecret(scope);
      if (!scopeSecret) return null;
      const blob = this.getBranchBlob(scope);
      if (!blob) return undefined;
      const branchObj = xorDecrypt(blob, scopeSecret, scope);
      if (!branchObj || typeof branchObj !== "object") return undefined;
      const rel = path.slice(scope.length);
      let ref: any = branchObj;
      for (const part of rel) {
        if (!ref || typeof ref !== "object") return undefined;
        ref = ref[part];
      }
      if (isPointer(ref)) return this.readPath(ref.__ptr.split(".").filter(Boolean));
      if (isIdentityRef(ref)) return ref;
      return ref;
    }

    // 2) Non-secret: read from derived index, resolve pointers, decrypt if needed.
    const resolved = this.resolveIndexPointerPath(path);
    const raw = resolved.raw;
    if (raw === undefined) return undefined;
    if (isPointer(raw)) return this.readPath(raw.__ptr.split(".").filter(Boolean));
    if (isIdentityRef(raw)) return raw;
    if (!isEncryptedBlob(raw)) return raw;
    // IMPORTANT:
    // Decrypt using the caller's requested path, not the pointer-resolved path.
    // This avoids mismatch when a pointer hops across a noise boundary.
    const effectiveSecret = this.computeEffectiveSecret(path);
    if (!effectiveSecret) return null;
    return xorDecrypt(raw, effectiveSecret, path);
  }
}
