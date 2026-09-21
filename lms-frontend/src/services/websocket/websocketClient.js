import environment from '../../config/environment';
import tokenStorage from '../storage/tokenStorage';
import { isDemoSessionActive } from '../../features/auth/services/demoSession';

/** Auto-reconnecting websocket client with exponential backoff. */
class WebsocketClient {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.shouldReconnect = true;
  }

  connect() {
    if (this.socket && this.socket.readyState <= WebSocket.OPEN) return;

    // Offline demo — do not open a real websocket.
    if (isDemoSessionActive()) return;

    const token = tokenStorage.getAccessToken();
    this.socket = new WebSocket(`${environment.wsBaseUrl}?token=${token ?? ''}`);

    this.socket.onopen = () => {
      this.reconnectAttempts = 0;
    };

    this.socket.onmessage = (event) => {
      try {
        const { type, payload } = JSON.parse(event.data);
        this.listeners.get(type)?.forEach((handler) => handler(payload));
      } catch {
        // Ignore malformed frames.
      }
    };

    this.socket.onclose = () => {
      if (!this.shouldReconnect) return;
      const delay = Math.min(30000, 1000 * 2 ** this.reconnectAttempts);
      this.reconnectAttempts += 1;
      setTimeout(() => this.connect(), delay);
    };
  }

  on(type, handler) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type).add(handler);
    return () => this.listeners.get(type)?.delete(handler);
  }

  send(type, payload) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type, payload }));
    }
  }

  disconnect() {
    this.shouldReconnect = false;
    this.socket?.close();
    this.socket = null;
  }
}

export const websocketClient = new WebsocketClient();
export default websocketClient;
