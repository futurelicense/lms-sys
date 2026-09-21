import { io } from 'socket.io-client';
import environment from '../../../config/environment';
import tokenStorage from '../../../services/storage/tokenStorage';
import { SERVER_EVENTS, CLIENT_EVENTS } from '../constants/chatConstants';
import { isDemoSessionActive } from '../../auth/services/demoSession';

/**
 * Socket.IO client singleton for the Chat Service.
 * Manages connection lifecycle, authentication, and event routing.
 */
class ChatSocketService {
  constructor() {
    /** @type {import('socket.io-client').Socket|null} */
    this.socket = null;
    /** @type {Map<string, Set<Function>>} */
    this.listeners = new Map();
    this.isConnected = false;
    /** Track last known message IDs per channel for reconnect recovery */
    this.lastMessageIds = {};
    /** Real-time presence cache */
    this.onlineUserIds = new Set();
    this.lastSeenMap = {};
  }

  /**
   * Returns current connection state.
   */
  getIsConnected() {
    return !!(this.isConnected || this.socket?.connected);
  }

  /**
   * Connects to the Chat Service via Socket.IO.
   */
  connect() {
    if (this.socket?.connected) {
      this.isConnected = true;
      this._emit('connection_status', { connected: true });
      return;
    }

    const token = tokenStorage.getAccessToken();
    if (!token) return;

    // Offline demo: pretend we're connected without opening a socket.
    if (isDemoSessionActive()) {
      this.isConnected = true;
      this._emit('connection_status', { connected: true });
      return;
    }

    this.socket = io(environment.chatWsUrl ?? 'http://localhost:3001', {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 30000,
      timeout: 10000,
    });

    // Connection lifecycle
    this.socket.on('connect', () => {
      this.isConnected = true;
      this._emit('connection_status', { connected: true });

      // Phase 2: Reconnect recovery — sync missed messages
      if (Object.keys(this.lastMessageIds).length > 0) {
        this.socket.emit(CLIENT_EVENTS.SYNC, { lastMessageIds: this.lastMessageIds });
      }
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      this._emit('connection_status', { connected: false, reason });
    });

    this.socket.on('connect_error', (err) => {
      this._emit('connection_error', { message: err.message });
    });

    // Server events → internal listeners
    Object.values(SERVER_EVENTS).forEach((event) => {
      this.socket.on(event, (data) => {
        // Cache presence
        if (event === SERVER_EVENTS.AUTHENTICATED && data) {
          if (Array.isArray(data.onlineUserIds)) {
            this.onlineUserIds = new Set(data.onlineUserIds.map((id) => String(id)));
          }
          if (data.lastSeen && typeof data.lastSeen === 'object') {
            this.lastSeenMap = { ...data.lastSeen };
          }
        }

        if (event === SERVER_EVENTS.USER_PRESENCE && data?.userId) {
          const uid = String(data.userId);
          if (data.status === 'ONLINE') {
            this.onlineUserIds.add(uid);
            delete this.lastSeenMap[uid];
          } else if (data.status === 'OFFLINE') {
            this.onlineUserIds.delete(uid);
            if (data.lastSeen) {
              this.lastSeenMap[uid] = data.lastSeen;
            }
          }
        }

        this._emit(event, data);

        // Track last message ID per channel for reconnect recovery
        if (event === SERVER_EVENTS.NEW_MESSAGE && data?.channelId && data?.id) {
          this.lastMessageIds[data.channelId] = data.id;
        }
      });
    });
  }

  /**
   * Gets cached online user IDs.
   */
  getOnlineUserIds() {
    return new Set(this.onlineUserIds);
  }

  /**
   * Gets cached last seen map.
   */
  getLastSeenMap() {
    return { ...this.lastSeenMap };
  }

  /**
   * Checks if user is cached online.
   */
  isUserOnline(userId) {
    if (!userId) return false;
    return this.onlineUserIds.has(String(userId));
  }

  /**
   * Disconnects from the Chat Service.
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.lastMessageIds = {};
      this.onlineUserIds.clear();
      this.lastSeenMap = {};
    }
  }

  /**
   * Sends a message to a channel.
   */
  sendMessage(channelId, content, clientMessageId, replyToMessageId = null, attachments = []) {
    this.socket?.emit(CLIENT_EVENTS.SEND_MESSAGE, {
      channelId,
      content,
      clientMessageId,
      replyToMessageId,
      attachments,
    });
  }

  /**
   * Edits a message (Phase 2).
   */
  editMessage(messageId, content) {
    this.socket?.emit(CLIENT_EVENTS.EDIT_MESSAGE, { messageId, content });
  }

  /**
   * Deletes a message (Phase 2).
   */
  deleteMessage(messageId) {
    this.socket?.emit(CLIENT_EVENTS.DELETE_MESSAGE, { messageId });
  }

  /**
   * Joins a channel's Socket.IO room.
   */
  joinChannel(channelId) {
    this.socket?.emit(CLIENT_EVENTS.JOIN_CHANNEL, { channelId });
  }

  /**
   * Leaves a channel's Socket.IO room.
   */
  leaveChannel(channelId) {
    this.socket?.emit(CLIENT_EVENTS.LEAVE_CHANNEL, { channelId });
  }

  /**
   * Starts typing indicator.
   */
  startTyping(channelId) {
    this.socket?.emit(CLIENT_EVENTS.TYPING_START, { channelId });
  }

  /**
   * Stops typing indicator.
   */
  stopTyping(channelId) {
    this.socket?.emit(CLIENT_EVENTS.TYPING_STOP, { channelId });
  }

  /**
   * Marks a channel as read up to a message (Phase 2).
   */
  markRead(channelId, messageId) {
    this.socket?.emit(CLIENT_EVENTS.MARK_READ, { channelId, messageId });
  }

  /**
   * Creates a direct message channel.
   */
  createDm(targetUserId) {
    this.socket?.emit(CLIENT_EVENTS.CREATE_DM, { targetUserId });
  }

  /**
   * Toggles emoji reaction on a message (Phase 3).
   */
  toggleReaction(messageId, reaction) {
    this.socket?.emit(CLIENT_EVENTS.TOGGLE_REACTION, { messageId, reaction });
  }

  /**
   * Pins a message in a channel (Phase 3).
   */
  pinMessage(channelId, messageId) {
    this.socket?.emit(CLIENT_EVENTS.PIN_MESSAGE, { channelId, messageId });
  }

  /**
   * Unpins a message in a channel (Phase 3).
   */
  unpinMessage(channelId, messageId) {
    this.socket?.emit(CLIENT_EVENTS.UNPIN_MESSAGE, { channelId, messageId });
  }

  /**
   * Archives or unarchives a channel (Phase 3).
   */
  archiveChannel(channelId, isArchived = true) {
    this.socket?.emit(CLIENT_EVENTS.ARCHIVE_CHANNEL, { channelId, isArchived });
  }

  // ─── Event Subscription ─────────────────────────────────

  /**
   * Subscribe to an event. Returns an unsubscribe function.
   */
  on(event, handler) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(handler);
    return () => this.listeners.get(event)?.delete(handler);
  }

  /** Internal: notify listeners */
  _emit(event, data) {
    this.listeners.get(event)?.forEach((handler) => {
      try {
        handler(data);
      } catch (err) {
        console.error(`Chat event handler error [${event}]:`, err);
      }
    });
  }
}

export const chatSocketService = new ChatSocketService();
export default chatSocketService;
