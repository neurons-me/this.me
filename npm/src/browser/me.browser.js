/*      ⠀⢀⣀⣀⣀⣀⣀⣀⣀⣀⣀⣀⣀⣀⡀
     ⠀⠀⢀⣴⣿⠟⠉⠉⠉⠉⠉⠉⠉⠉⠛⠻⣿⣦⡀
     ⠀⢠⣿⠋⠀⢀⣠⣤⣶⣶⣶⣶⣤⣄⠀⠈⠙⣿⡄
     ⠀⣼⡏⠀⣰⣿⣿⡿⠛⠉⠉⠛⠻⣿⣿⣆⠀⢹⣧
     ⢀⣿⠀⢠⣿⣿⡟⠀⠀⢀⣀⠀⠀⢻⣿⣿⡄⠀⣿⡀
     ⢸⡇⠀⢸⣿⣿⣧⠀⢰⣿⣿⣷⠀⣼⣿⣿⡇⠀⢸⡇
     ⢸⡇⠀⠘⢿⣿⣿⣷⣄⠈⠉⢀⣴⣿⣿⡿⠃⠀⢸⡇
     ⠀⣧⠀⠀⠀⠙⢿⣿⣿⣿⣿⣿⣿⡿⠋⠀⠀⠀⣼
     ⠀⠘⣧⡀⠀⠀⠀⠈⠙⠛⠛⠋⠁⠀⠀⠀⢀⣼⠃
     ⠀⠀⠈⠻⣦⣀⠀⠀⠀⠀⠀⠀⠀⠀⣀⣴⠟⠁
     ⠀⠀⠀⠀⠈⠙⠻⣦⣤⣤⣤⣤⣶⠿⠋⠁
             ⠀⢀⡾⠋⠁⠙⢷⡀
             ⠀⣼⠃⢠⣾⣷⡄⠘⣧
             ⠀⣿⠀⠘⠿⠿⠃⠀⣿
             ⠀⠹⣧⠀⠀⠀⠀⣼⠏
             ⠀⠀⠙⠷⣤⣤⡾⠋
this.me by suiGn - neurons.me*/
import MeWebSocket from "./me.wsocket.js";
/** Class-based singleton with state and subscriptions */
class Me {
  constructor(endpoint = "http://localhost:7777/graphql") {
    this.endpoint = endpoint;

    this.state = {
      status: { active: false, error: false, loading: true, data: null },
      listUs: [],
      activeMe: null
    };
    this.subscribers = new Set();

    // ✅ Auto-check daemon status when instantiated
    this.status();
    this.socket = null;
  }
  /** 🔹 Init
   * Manually initializes the daemon state (status + listUs).
   * Useful if you need to re-check after user actions.
   */
  async init() {
    // Mark as loading
    this.#update({
      status: { ...this.state.status, loading: true }
    });

    // Check status first
    const status = await this.status();

    // Start WS if active
    if (status.active) {
      await this.startSocket();

      // Wait for first WS message or fallback timeout
      await new Promise((resolve) => {
        let resolved = false;

        const unsub = this.subscribe((state) => {
          if (!resolved && state.status.active !== undefined) {
            resolved = true;
            unsub();
            resolve();
          }
        });

        setTimeout(() => {
          if (!resolved) {
            resolved = true;
            unsub();
            resolve();
          }
        }, 2000);
      });
    }

    // Stop loading
    this.#update({
      status: { ...this.state.status, loading: false }
    });

    return this.state.status;
  }

  async startSocket() {
    if (!this.state.status.active) return;
    if (this.socket) {
      console.warn("[this.me] WebSocket already running");
      return;
    }
    this.socket = new MeWebSocket(this.endpoint.replace("/graphql", ""));
    this.socket.onMessage((data) => {
      if (data.type === "status") {
        this.#update({ status: { active: true, error: false, data: data.payload } });
      }
      if (data.type === "listUs") {
        this.#update({ listUs: data.payload });
      }
    });
  }

  setEndpoint(url) {
    if (typeof url === "string" && url.trim() !== "") {
      this.endpoint = url;
    }
  }

  getState() {
    return this.state;
  }

  #update(newState) {
    this.state = { ...this.state, ...newState };
    this.subscribers.forEach(cb => cb(this.state));
  }

  subscribe(cb) {
    this.subscribers.add(cb);
    return () => this.subscribers.delete(cb);
  }

  async #graphqlRequest(query, variables = {}) {
    const res = await fetch(this.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables })
    });
    if (!res.ok) throw new Error(`GraphQL error: ${res.status}`);
    const { data, errors } = await res.json();
    if (errors) throw new Error(errors.map(e => e.message).join(", "));
    return data;
  }

  // 🔹 Daemon-level helpers
  /** 🔹 Daemon status
   * Retrieves the current status of the daemon.
   * Use to check if the service is active and get version/uptime info.
   */
  async status() {
    const query = `
      query {
        status {
          active
          version
          uptime
        }
      }
    `;
    try {
      const data = await this.#graphqlRequest(query);
      const clean = data.status
        ? {
            active: data.status.active,
            version: data.status.version,
            uptime: data.status.uptime
          }
        : { active: false, version: null, uptime: null };
      this.#update({ status: { active: clean.active, error: false, data: clean } });
      return clean;
    } catch {
      const clean = { active: false, version: null, uptime: null };
      this.#update({ status: { active: false, error: true, data: null } });
      return clean;
    }
  }

  /** 🔹 List all identities
   * Fetches all available identities (users).
   * Use to display or manage the list of identities.
   */
  async listUs() {
    const query = `
      query {
        listUs {
          alias
          path
        }
      }
    `;
    try {
      const data = await this.#graphqlRequest(query);
      const list = Array.isArray(data.listUs)
        ? data.listUs.map(({ alias, path }) => ({ alias, path }))
        : [];
      this.#update({ listUs: list });
      return list;
    } catch {
      this.#update({ listUs: [] });
      return [];
    }
  }

  /** 🔹 Load an identity
   * Loads a specific identity by alias and hash.
   * Use to activate or switch to a particular identity.
   */
  async loadMe(alias, hash) {
    const query = `
      mutation($alias: String!, $hash: String!) {
        loadMe(alias: $alias, hash: $hash)
      }
    `;
    try {
      const data = await this.#graphqlRequest(query, { alias, hash });
      const result = !!data.loadMe;
      if (result) {
        this.#update({ activeMe: alias });
      }
      return result;
    } catch {
      return false;
    }
  }

  // 🔹 Me-level operations
  /** 🔹 Be operation
   * Performs a 'be' mutation for given alias, key, and value.
   * Use to set or update identity attributes.
   */
  async be(alias, key, value) {
    const query = `
      mutation($alias: String!, $key: String!, $value: String!) {
        be(alias: $alias, key: $key, value: $value)
      }
    `;
    try {
      const data = await this.#graphqlRequest(query, { alias, key, value });
      return !!data.be;
    } catch {
      return false;
    }
  }

  /** 🔹 Have operation
   * Performs a 'have' mutation for given alias, key, and value.
   * Use to declare possession or ownership related to identity.
   */
  async have(alias, key, value) {
    const query = `
      mutation($alias: String!, $key: String!, $value: String!) {
        have(alias: $alias, key: $key, value: $value)
      }
    `;
    try {
      const data = await this.#graphqlRequest(query, { alias, key, value });
      return !!data.have;
    } catch {
      return false;
    }
  }

  /** 🔹 Do operation
   * Performs a 'do' mutation for given alias, key, and value.
   * Use to record actions or activities for the identity.
   */
  async do_(alias, key, value) {
    const query = `
      mutation($alias: String!, $key: String!, $value: String!) {
        do(alias: $alias, key: $key, value: $value)
      }
    `;
    try {
      const data = await this.#graphqlRequest(query, { alias, key, value });
      return !!data.do;
    } catch {
      return false;
    }
  }

  /** 🔹 At operation
   * Performs an 'at' mutation for given alias, key, and value.
   * Use to set location or context related data for the identity.
   */
  async at(alias, key, value) {
    const query = `
      mutation($alias: String!, $key: String!, $value: String!) {
        at(alias: $alias, key: $key, value: $value)
      }
    `;
    try {
      const data = await this.#graphqlRequest(query, { alias, key, value });
      return !!data.at;
    } catch {
      return false;
    }
  }

  /** 🔹 Relate operation
   * Performs a 'relate' mutation for given alias, key, and value.
   * Use to define relationships or connections for the identity.
   */
  async relate(alias, key, value) {
    const query = `
      mutation($alias: String!, $key: String!, $value: String!) {
        relate(alias: $alias, key: $key, value: $value)
      }
    `;
    try {
      const data = await this.#graphqlRequest(query, { alias, key, value });
      return !!data.relate;
    } catch {
      return false;
    }
  }

  /** 🔹 React operation
   * Performs a 'react' mutation for given alias, key, and value.
   * Use to record reactions or responses by the identity.
   */
  async react(alias, key, value) {
    const query = `
      mutation($alias: String!, $key: String!, $value: String!) {
        react(alias: $alias, key: $key, value: $value)
      }
    `;
    try {
      const data = await this.#graphqlRequest(query, { alias, key, value });
      return !!data.react;
    } catch {
      return false;
    }
  }

  /** 🔹 Communication operation
   * Performs a 'communication' mutation for given alias, key, and value.
   * Use to log communications or messages for the identity.
   */
  async communication(alias, key, value) {
    const query = `
      mutation($alias: String!, $key: String!, $value: String!) {
        communication(alias: $alias, key: $key, value: $value)
      }
    `;
    try {
      const data = await this.#graphqlRequest(query, { alias, key, value });
      return !!data.communication;
    } catch {
      return false;
    }
  }

  /** 🔹 Get identity info
   * Queries detailed information about a specific identity by alias.
   * Use to retrieve public data like alias and publicKey.
   */
  async me(alias) {
    const query = `
      query($alias: String!) {
        me(alias: $alias) {
          alias
          publicKey
        }
      }
    `;
    try {
      const data = await this.#graphqlRequest(query, { alias });
      if (data.me && typeof data.me === "object") {
        const { alias: a, publicKey } = data.me;
        return a && publicKey ? { alias: a, publicKey } : null;
      }
      return null;
    } catch {
      return null;
    }
  }
}


/** ✅ Export a single shared instance */
const me = new Me();
export default me;

// ✅ If running in a browser, expose a global instance automatically
if (typeof window !== "undefined") {
  window.me = me;
  console.log("[this.me] Global instance available as window.me");
}