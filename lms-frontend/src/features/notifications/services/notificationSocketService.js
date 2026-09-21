import { io } from 'socket.io-client';
import environment from '../../../config/environment';
import tokenStorage from '../../../services/storage/tokenStorage';
import { isDemoSessionActive } from '../../auth/services/demoSession';

/**
 * Socket.IO client singleton for LMS-Notification-Service.
 * Manages connection lifecycle and dispatches live notification events.
 */
class NotificationSocketService {
  constructor() {
    /** @type {import('socket.io-client').Socket|null} */
    this.socket = null;
    /** @type {Map<string, Set<Function>>} */
    this.listeners = new Map();
    this.isConnected = false;
  }

  /**
   * Connects to the Notification Service via Socket.IO.
   */
  connect() {
    if (this.socket) return;

    const token = tokenStorage.getAccessToken();
    if (!token) return;

    if (isDemoSessionActive()) {
      this.isConnected = true;
      this._emit('connection_status', { connected: true });
      return;
    }

    this.socket = io(environment.notificationWsUrl ?? 'http://localhost:3002', {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 20000,
      timeout: 10000,
    });

    this.socket.on('connect', () => {
      this.isConnected = true;
      this._emit('connection_status', { connected: true });
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      this._emit('connection_status', { connected: false, reason });
    });

    this.socket.on('connect_error', (err) => {
      this._emit('connection_error', { message: err.message });
    });

    this.socket.on('unread_count', (data) => {
      this._emit('unread_count', data);
    });

    this.socket.on('notification', (data) => {
      this._emit('notification', data);
    });
  }

  /**
   * Disconnects from the Notification Service.
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  /**
   * Subscribes to an event.
   * @param {string} event
   * @param {Function} callback
   * @returns {() => void} Unsubscribe function
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    return () => this.off(event, callback);
  }

  /**
   * Unsubscribes from an event.
   */
  off(event, callback) {
    const set = this.listeners.get(event);
    if (set) {
      set.delete(callback);
      if (set.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  /**
   * Internal event dispatcher.
   */
  _emit(event, data) {
    const set = this.listeners.get(event);
    if (set) {
      for (const cb of set) {
        try {
          cb(data);
        } catch (err) {
          console.error(`Error in notification listener for "${event}":`, err);
        }
      }
    }
  }
}

export const notificationSocketService = new NotificationSocketService();
export default notificationSocketService;
