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
      listUs: []
    };
    this.subscribers = new Set();
    this.socket = null;
  }

  // 🔹 Daemon-level helpers
  /** 🔹 Daemon status
   * Retrieves the current status of the daemon.
   * Use to check if the service is active and get version/uptime info.
   */
  async status() {
    const query = `
      query {
        monadStatus {
          active
          version
        }
      }
    `;
    try {
      const data = await this.#graphqlRequest(query);
      const clean = data.monadStatus
        ? {
            active: data.monadStatus.active,
            version: data.monadStatus.version
          }
        : { active: false, version: null };
      this.#update({ status: { active: clean.active, error: false, data: clean } });
      return clean;
    } catch {
      const clean = { active: false, version: null };
      this.#update({ status: { active: false, error: true, data: null } });
      return clean;
    }
  }

/** 🔹 Get public identity info
 * Queries public data like alias and publicKey.
 */
async publicInfo(username) {
  const query = `
    query($username: String!) {
      publicInfo(username: $username) {
        username
        publicKey
      }
    }
  `;
  try {
    const data = await this.#graphqlRequest(query, { username });
    if (data.publicInfo && typeof data.publicInfo === "object") {
      const { username: u, publicKey } = data.publicInfo;
      return u && publicKey ? { username: u, publicKey } : null;
    }
    return null;
  } catch {
    return null;
  }
}

  /** 🔹 List all identities
   * Fetches all available identities (users).
   * Use to display or manage the list of identities.
   */
  async listIdentities() {
    const query = `
      query {
        listIdentities {
          username
        }
      }
    `;
    try {
      const data = await this.#graphqlRequest(query);
      const list = Array.isArray(data.listIdentities)
        ? data.listIdentities.map(({ username }) => ({ username, path: null }))
        : [];
      this.#update({ listUs: list });
      return list;
    } catch {
      this.#update({ listUs: [] });
      return [];
    }
  }

  /** 🔹 Get entries with filters */
  async get(username, password, filter = {}) {
    const query = `
      query($username: String!, $password: String!, $filter: GetFilter!) {
        get(username: $username, password: $password, filter: $filter) {
          verb
          key
          value
          timestamp
        }
      }
    `;
    try {
      const data = await this.#graphqlRequest(query, { username, password, filter });
      return data.get || [];
    } catch {
      return [];
    }
  }

  /** 🔹 Base helper for verb mutations */
  async #verbMutation(type, username, password, key, value, context_id = null) {
    const query = `
      mutation($username: String!, $password: String!, $key: String!, $value: String!, $context_id: String) {
        ${type}(username: $username, password: $password, key: $key, value: $value, context_id: $context_id)
      }
    `;
    try {
      const data = await this.#graphqlRequest(query, { username, password, key, value, context_id });
      return !!data[type];
    } catch {
      return false;
    }
  }

  // Shorthand verb methods
  async be(username, password, key, value, context_id = null) {
    return this.#verbMutation("be", username, password, key, value, context_id);
  }

  async have(username, password, key, value, context_id = null) {
    return this.#verbMutation("have", username, password, key, value, context_id);
  }

  async do(username, password, key, value, context_id = null) {
    return this.#verbMutation("do", username, password, key, value, context_id);
  }

  async at(username, password, key, value, context_id = null) {
    return this.#verbMutation("at", username, password, key, value, context_id);
  }

  async relate(username, password, key, value, context_id = null) {
    return this.#verbMutation("relate", username, password, key, value, context_id);
  }

  async react(username, password, key, value, context_id = null) {
    return this.#verbMutation("react", username, password, key, value, context_id);
  }

  async communicate(username, password, key, value, context_id = null) {
    return this.#verbMutation("communicate", username, password, key, value, context_id);
  }


  /** 
   * Internal helpers related to state and subscriptions,
   * not specific to WebSocket.
   */
  _updateFromSocket(newPartialState) {
    this.#update(newPartialState);
  }

  /** 
   * Internal helpers related to state and subscriptions,
   * not specific to WebSocket.
   */
  setEndpoint(url) {
    if (typeof url === "string" && url.trim() !== "") {
      this.endpoint = url;
    }
  }

  /** 
   * Internal helpers related to state and subscriptions,
   * not specific to WebSocket.
   */
  getState() {
    return this.state;
  }

  /** 
   * Internal helpers related to state and subscriptions,
   * not specific to WebSocket.
   */
  #update(newState) {
    this.state = { ...this.state, ...newState };
    this.subscribers.forEach(cb => cb(this.state));
  }

  /** 
   * Internal helpers related to state and subscriptions,
   * not specific to WebSocket.
   */
  subscribe(cb) {
    this.subscribers.add(cb);
    return () => this.subscribers.delete(cb);
  }

  async startSocket() {
    if (!this.state.status.active) return;
    if (this.socket) {
      console.warn("[this.me] WebSocket already running");
      return;
    }
    this.socket = new MeWebSocket(this.endpoint.replace("/graphql", ""));
    // Inline socket event listeners
    this.socket.on("status", (payload) => {
      this._updateFromSocket({
        status: { active: true, error: false, data: payload }
      });
    });

    this.socket.on("listUs", (payload) => {
      this._updateFromSocket({ listUs: payload });
    });

    this.socket.on("update", (payload) => {
      console.log("[this.me] update event", payload);
    });
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
}


/** ✅ Export a single shared instance */
const me = new Me();
export default me;

// ✅ If running in a browser, expose a global instance automatically
if (typeof window !== "undefined") {
  window.me = me;
  console.log("[this.me] Global instance available as window.me");
}