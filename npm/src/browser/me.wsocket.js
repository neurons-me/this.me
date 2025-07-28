export default class MeWebSocket {
  constructor(meInstance, url) {
    this.me = meInstance; // Reference to the main Me instance
    this.url = url;
    this.ws = null;
    this.reconnectInterval = 10000;
    this.isConnected = false;
    this.connect();
  }

  connect() {
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      console.log("[this.me][WS] Connected to daemon");
      this.isConnected = true;
      if (this.me.state?.status) {
        this.me.state.status.active = true;
        this.me.state.status.error = false;
      }
      this.#notify();
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.#handleMessage(message);
      } catch (e) {
        console.warn("[this.me][WS] Invalid message:", event.data);
      }
    };

    this.ws.onclose = () => {
      console.warn("[this.me][WS] Disconnected, retrying in 10s");
      this.isConnected = false;
      if (this.me.state?.status) {
        this.me.state.status.active = false;
        this.me.state.status.error = true;
      }
      this.#notify();
      setTimeout(() => this.connect(), this.reconnectInterval);
    };

    this.ws.onerror = (err) => {
      console.error("[this.me][WS] Error:", err);
      this.ws.close();
    };
  }

  #handleMessage(msg) {
    switch (msg.type) {
      case "status":
        this.me.state.status = {
          active: msg.data.active,
          error: false,
          data: msg.data
        };
        break;
      case "listUs":
        this.me.state.listUs = msg.data;
        break;
      case "update":
        console.log("[this.me][WS] Update event:", msg.data);
        break;
      default:
        console.warn("[this.me][WS] Unknown message type:", msg.type);
    }
    this.#notify();
  }

  send(type, data) {
    if (this.isConnected && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, data }));
    }
  }

  #notify() {
    if (this.me.subscribers?.size) {
      this.me.subscribers.forEach((cb) => cb(this.me.state));
    }
  }
}
