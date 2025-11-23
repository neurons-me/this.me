import MeWebSocket from "./webSocket.me.ts";
interface MonadStatus {
  active: boolean;
  version: string | null;
}

interface Identity {
  username: string;
  path?: string | null;
}

interface Entry {
  verb: string;
  key: string;
  value: string;
  timestamp: string;
}

interface State {
  status: {
    active: boolean;
    error: boolean;
    loading?: boolean;
    data: MonadStatus | null;
  };
  listUs: Identity[];
}

class Me {
  private endpoint: string;
  private state: State;
  private subscribers: Set<(state: State) => void>;
  private socket: MeWebSocket | null;
  constructor(endpoint = "http://localhost:7777/graphql") {
    this.endpoint = endpoint;
    this.state = {
      status: { active: false, error: false, loading: true, data: null },
      listUs: [],
    };
    this.subscribers = new Set();
    this.socket = null;
  }

  async status(): Promise<MonadStatus> {
    const query = `
      query {
        monadStatus {
          active
          version
        }
      }
    `;
    try {
      const data = await this.#graphqlRequest<{ monadStatus: MonadStatus }>(query);
      const clean = data.monadStatus ?? { active: false, version: null };
      this.#update({ status: { ...this.state.status, active: clean.active, data: clean } });
      return clean;
    } catch {
      this.#update({ status: { ...this.state.status, error: true, data: null } });
      return { active: false, version: null };
    }
  }

  async publicInfo(username: string): Promise<{ username: string; publicKey: string } | null> {
    const query = `
      query($username: String!) {
        publicInfo(username: $username) {
          username
          publicKey
        }
      }
    `;
    try {
      const data = await this.#graphqlRequest<{ publicInfo: { username: string; publicKey: string } }>(query, { username });
      const info = data.publicInfo;
      return info && info.username && info.publicKey ? info : null;
    } catch {
      return null;
    }
  }

  async listIdentities(): Promise<Identity[]> {
    const query = `
      query {
        listIdentities {
          username
        }
      }
    `;
    try {
      const data = await this.#graphqlRequest<{ listIdentities: Identity[] }>(query);
      const list = Array.isArray(data.listIdentities) ? data.listIdentities.map(u => ({ username: u.username, path: null })) : [];
      this.#update({ listUs: list });
      return list;
    } catch {
      this.#update({ listUs: [] });
      return [];
    }
  }

  async get(username: string, password: string, filter: Record<string, any> = {}): Promise<Entry[]> {
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
      const data = await this.#graphqlRequest<{ get: Entry[] }>(query, { username, password, filter });
      return data.get || [];
    } catch {
      return [];
    }
  }

  async #verbMutation(
    type: string,
    username: string,
    password: string,
    key: string,
    value: string,
    context_id: string | null = null
  ): Promise<boolean> {
    const query = `
      mutation($username: String!, $password: String!, $key: String!, $value: String!, $context_id: String) {
        ${type}(username: $username, password: $password, key: $key, value: $value, context_id: $context_id)
      }
    `;
    try {
      const data = await this.#graphqlRequest<Record<string, boolean>>(query, { username, password, key, value, context_id });
      return !!data[type];
    } catch {
      return false;
    }
  }

  async be(u: string, p: string, k: string, v: string, c: string | null = null) { return this.#verbMutation("be", u, p, k, v, c); }
  async have(u: string, p: string, k: string, v: string, c: string | null = null) { return this.#verbMutation("have", u, p, k, v, c); }
  async do(u: string, p: string, k: string, v: string, c: string | null = null) { return this.#verbMutation("do", u, p, k, v, c); }
  async at(u: string, p: string, k: string, v: string, c: string | null = null) { return this.#verbMutation("at", u, p, k, v, c); }
  async relate(u: string, p: string, k: string, v: string, c: string | null = null) { return this.#verbMutation("relate", u, p, k, v, c); }
  async react(u: string, p: string, k: string, v: string, c: string | null = null) { return this.#verbMutation("react", u, p, k, v, c); }
  async communicate(u: string, p: string, k: string, v: string, c: string | null = null) { return this.#verbMutation("communicate", u, p, k, v, c); }
  setEndpoint(url: string) { if (url.trim()) this.endpoint = url; }
  getState(): State { return this.state; }
  subscribe(cb: (state: State) => void): () => void {
    this.subscribers.add(cb);
    return () => this.subscribers.delete(cb);
  }

  #update(newState: Partial<State>) {
    this.state = { ...this.state, ...newState };
    this.subscribers.forEach(cb => cb(this.state));
  }

  async #graphqlRequest<T>(query: string, variables: Record<string, any> = {}): Promise<T> {
    const res = await fetch(this.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables }),
    });
    if (!res.ok) throw new Error(`GraphQL error: ${res.status}`);
    const { data, errors } = await res.json();
    if (errors) throw new Error(errors.map((e: any) => e.message).join(", "));
    return data;
  }
}

const _meRaw = new Me();
export const me = new Proxy(_meRaw, {
  get(target, prop, receiver) {
    const value = Reflect.get(target, prop, receiver);
    if (typeof value !== "function") return value;
    return (...args: any[]) => {
      const result = value.apply(target, args);
      if (result instanceof Promise) {
        result.then((data) => console.log(`[this.me] ${String(prop)} ✓`, data))
              .catch((err) => console.error(`[this.me] ${String(prop)} ✗`, err));
      }
      return result;
    };
  },
});

export default me;
if (typeof window !== "undefined") {
  (window as any).me = me;
  (me as any).help = () => console.table(Object.getOwnPropertyNames(Me.prototype));
}