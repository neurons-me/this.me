import type { Thought, SemanticPath, EncryptedBlob } from "./types.js";
import {
  isPointer,
  isIdentityRef,
  isThought,
  makePointer,
  makeIdentityRef,
  normalizeAndValidateUsername,
  splitPath,
  pathStartsWith,
} from "./operators.js";
import { xorEncrypt, xorDecrypt, isEncryptedBlob } from "./crypto.js";

// Proxy type for ME: allows callable and property access
export type MEProxy = ME & {
  [key: string]: any;
  (...args: any[]): MEProxy;
};

// Operator token used to define new operators (kernel-only)
const OP_DEFINE = "+";

// Hash simple portable (FNV-1a 32-bit)
export function hashFn(input: string): string {
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

  // Canonical semantic log
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

    // Note: returning a Proxy from a class constructor is allowed in JS,
    // but TS types must be handled carefully by callers.
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
      return self.handleCall(path, args);
    };

    return new Proxy(fn, {
      get(target, prop) {
        if (typeof prop === "symbol") return (target as any)[prop];

        // Support direct access to real instance methods/props.
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

  // ---------------------------------------------------------
  // Llamada semántica en una ruta dada
  // path: ["wallet","balance"]
  // args: [expression]
  // ---------------------------------------------------------
  private handleCall(path: SemanticPath, args: any[]): MEProxy | any {
    // Caso especial: me("a.b.c") → lectura rápida del índice/branches
    if (path.length === 0) {
      // GET: me("a.b.c")
      if (args.length === 1 && typeof args[0] === "string") {
        const s = (args[0] as string).trim();

        const isOperatorPrefixed = s.startsWith("_") || s.startsWith("~") || s.startsWith("@");
        const isDottedPath = s.includes(".");
        const isSingleLabelPath = /^[a-zA-Z][a-zA-Z0-9_-]*$/.test(s);

        if (isDottedPath || isOperatorPrefixed || isSingleLabelPath) {
          const getPath = s.split(".").filter(Boolean);
          return this.readPath(getPath);
        }
      }

      // If called as me() with nothing, return the root proxy
      if (args.length === 0) {
        return this.createProxy([]) as MEProxy;
      }

      // Root postulate: me(expression)
      const expression = this.normalizeArgs(args);
      const out = this.postulate([], expression);

      // Operators at the current path may return a value
      if (out !== undefined) return out;
      return this.createProxy([]) as MEProxy;
    }

    // Ruta normal: me.foo.bar(...)
    const expression = this.normalizeArgs(args);
    const out = this.postulate(path, expression);

    // If a thought was produced, keep chaining along the semantic path.
    const { scope, leaf } = splitPath(path);
    const leafKind = leaf ? this.opKind(leaf) : null;
    if (isThought(out)) {
      const chainPath = leafKind ? scope : path;
      return this.createProxy(chainPath) as MEProxy;
    }

    // Operators at the current path may return a value
    if (out !== undefined) return out;

    // Después de asignar, permanecemos en la misma rama para chaining profundo:
    return this.createProxy(path) as MEProxy;
  }

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
    // Root form: me["@"]("id") is represented as path=["@"]. 
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
    if (path.length === 0) return null;
    const { scope, leaf } = splitPath(path);
    if (!leaf) return null;
    if (this.opKind(leaf) !== "eval") return null;

    if (typeof expression === "function") {
      return { mode: "thunk", targetPath: scope, thunk: expression };
    }

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
    if (path.length === 0) return null;
    const { scope, leaf } = splitPath(path);
    if (!leaf) return null;
    if (this.opKind(leaf) !== "query") return null;

    let pathsArg: any = null;
    let fn: Function | undefined;

    if (Array.isArray(expression) && expression.length > 0) {
      const looksLikeTuple =
        Array.isArray(expression[0]) && (expression.length === 1 || typeof expression[1] === "function");

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
      this.operators[def.op] = { kind: def.kind };
      return;
    }

    // Eval operator
    const ev = this.isEvalCall(targetPath, expression);
    if (ev) {
      if (ev.mode === "thunk") {
        const value = ev.thunk();
        if (ev.targetPath.length === 0) return value;
        return this.postulate(ev.targetPath, value, "=");
      }
      const assignTarget = [...ev.targetPath, ev.name];
      return this.postulate(assignTarget, ev.expr, "=");
    }

    // Query operator
    const q = this.isQueryCall(targetPath, expression);
    if (q) {
      const values = q.paths.map((p) => this.readPath(p.split(".").filter(Boolean)));
      const out = q.fn ? (q.fn as any)(...values) : values;
      if (q.targetPath.length === 0) return out;
      return this.postulate(q.targetPath, out, "?");
    }

    // Remove operator
    const rm = this.isRemoveCall(targetPath, expression);
    if (rm) {
      this.removeSubtree(rm.targetPath);
      return;
    }

    // Secret declaration nodes
    const scopeCall = this.isSecretScopeCall(targetPath, expression);
    if (scopeCall) {
      this.localSecrets[scopeCall.scopeKey] = expression;

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

    // Noise declaration nodes
    const noiseCall = this.isNoiseScopeCall(targetPath, expression);
    if (noiseCall) {
      this.localNoises[noiseCall.scopeKey] = expression;

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

    // Pointer declaration nodes
    const ptrCall = this.isPointerCall(targetPath, expression);
    if (ptrCall) {
      const { scope } = splitPath(targetPath);
      targetPath = scope;
      expression = makePointer(ptrCall.targetPath);
      storedValue = expression;
      if (operator === null) operator = "__";
    }

    // Identity operator
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
    // 3) Escribir expresión en el árbol semántico
    const scope = this.resolveBranchScope(targetPath);
    if (scope && scope.length > 0) {
      const scopeSecret = this.computeEffectiveSecret(scope);
      const rel = targetPath.slice(scope.length);
      const existingBlob = this.getBranchBlob(scope);
      let branchObj: any = {};
      if (existingBlob && scopeSecret) {
        const dec = xorDecrypt(existingBlob, scopeSecret, scope);
        if (dec && typeof dec === "object") branchObj = dec;
      }

      if (rel.length === 0) {
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

      if (scopeSecret) {
        const blob = xorEncrypt(branchObj, scopeSecret, scope);
        this.setBranchBlob(scope, blob);
      }
      storedValue = expression;
    } else if (effectiveSecret) {
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
    const prefix = targetPath.join(".");

    for (const key of Object.keys(this.localSecrets)) {
      if (prefix === "") {
        delete this.localSecrets[key];
        continue;
      }
      if (key === prefix || key.startsWith(prefix + ".")) {
        delete this.localSecrets[key];
      }
    }

    for (const key of Object.keys(this.localNoises)) {
      if (prefix === "") {
        delete this.localNoises[key];
        continue;
      }
      if (key === prefix || key.startsWith(prefix + ".")) {
        delete this.localNoises[key];
      }
    }

    for (const key of Object.keys(this.encryptedBranches)) {
      if (prefix === "") {
        delete this.encryptedBranches[key];
        continue;
      }
      if (key === prefix || key.startsWith(prefix + ".")) {
        delete this.encryptedBranches[key];
      }
    }

    const pathStr = targetPath.join(".");
    const timestamp = Date.now();
    const effectiveSecret = this.computeEffectiveSecret(targetPath);
    const hashInput = JSON.stringify({
      path: pathStr,
      operator: "-",
      expression: "-",
      value: "-",
      effectiveSecret,
    });
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

    let seed = "root";
    if (noiseValue) {
      seed = hashFn("noise::" + noiseValue);
    } else if (this.localSecrets[""]) {
      seed = hashFn(seed + "::" + this.localSecrets[""]);
    }

    for (let i = 1; i <= path.length; i++) {
      const p = path.slice(0, i).join(".");
      if (this.localSecrets[p]) {
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
  }

  private getBranchBlob(scope: SemanticPath): EncryptedBlob | undefined {
    const key = scope.join(".");
    return this.encryptedBranches[key];
  }

  private resolveBranchScope(path: SemanticPath): SemanticPath | null {
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

    const resolved = this.resolveIndexPointerPath(path);
    const raw = resolved.raw;
    if (raw === undefined) return undefined;
    if (isPointer(raw)) return this.readPath(raw.__ptr.split(".").filter(Boolean));
    if (isIdentityRef(raw)) return raw;
    if (!isEncryptedBlob(raw)) return raw;
    const effectiveSecret = this.computeEffectiveSecret(path);
    if (!effectiveSecret) return null;
    return xorDecrypt(raw, effectiveSecret, path);
  }
}