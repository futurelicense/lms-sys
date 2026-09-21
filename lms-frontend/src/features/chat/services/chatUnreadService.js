import chatService from './chatService';
import chatSocketService from './chatSocketService';
import { SERVER_EVENTS } from '../constants/chatConstants';

/**
 * Singleton service for tracking unread chat message counts across
 * all channels and synchronizing the browser document title.
 */
class ChatUnreadService {
  constructor() {
    this.unreadMap = {};
    this.listeners = new Set();
    this.isInitialized = false;
    this.unsubSocket = null;
    this.currentUserId = null;
  }

  /**
   * Initializes real-time unread tracking for the authenticated user.
   */
  init(userId) {
    if (this.isInitialized && this.currentUserId === userId) return;
    this.currentUserId = userId;
    this.isInitialized = true;

    // Fetch initial unread counts via REST
    chatService.getUnreadCounts()
      .then((counts) => {
        if (counts && typeof counts === 'object') {
          this.setCounts(counts);
        }
      })
      .catch((err) => {
        console.warn('Could not fetch unread counts via REST:', err.message);
      });

    // Cleanup previous socket listeners
    if (this.unsubSocket) {
      this.unsubSocket();
    }

    const unsubs = [
      chatSocketService.on(SERVER_EVENTS.NEW_MESSAGE, (msg) => {
        if (!msg) return;

        // Never count user's own sent messages
        if (this.currentUserId && String(msg.senderId) === String(this.currentUserId)) {
          return;
        }

        // Check if user is actively viewing this specific channel in a visible tab
        const pathname = window.location.pathname;
        const search = window.location.search;
        let isActivelyViewing = false;

        if (pathname.includes('/chat') && document.visibilityState === 'visible') {
          const urlParams = new URLSearchParams(search);
          const activeId = urlParams.get('channelId') || pathname.split('/chat/')[1];
          if (activeId && String(activeId) === String(msg.channelId)) {
            isActivelyViewing = true;
          }
        }

        if (!isActivelyViewing && msg.channelId) {
          this.incrementChannel(msg.channelId);
        }
      }),

      chatSocketService.on(SERVER_EVENTS.UNREAD_UPDATED, ({ channelId, count }) => {
        if (channelId) {
          this.setChannelUnread(channelId, count || 0);
        }
      }),
    ];

    this.unsubSocket = () => {
      unsubs.forEach((fn) => fn());
    };
  }

  setCounts(counts) {
    this.unreadMap = { ...counts };
    this.notify();
  }

  setChannelUnread(channelId, count) {
    this.unreadMap = { ...this.unreadMap, [channelId]: count };
    this.notify();
  }

  incrementChannel(channelId) {
    const current = Number(this.unreadMap[channelId]) || 0;
    this.unreadMap = { ...this.unreadMap, [channelId]: current + 1 };
    this.notify();
  }

  clearChannel(channelId) {
    if (channelId && this.unreadMap[channelId]) {
      this.unreadMap = { ...this.unreadMap, [channelId]: 0 };
      this.notify();
    }
  }

  getTotalUnread() {
    return Object.values(this.unreadMap).reduce((sum, val) => sum + (Number(val) || 0), 0);
  }

  getUnreadMap() {
    return { ...this.unreadMap };
  }

  subscribe(listener) {
    this.listeners.add(listener);
    listener(this.getTotalUnread(), this.getUnreadMap());
    return () => this.listeners.delete(listener);
  }

  notify() {
    const total = this.getTotalUnread();
    const map = this.getUnreadMap();
    this.listeners.forEach((fn) => {
      try {
        fn(total, map);
      } catch (e) {
        console.error('Error in chatUnreadService listener:', e);
      }
    });
  }

  reset() {
    this.unreadMap = {};
    this.isInitialized = false;
    this.currentUserId = null;
    if (this.unsubSocket) {
      this.unsubSocket();
      this.unsubSocket = null;
    }
    this.notify();
  }
}

export const chatUnreadService = new ChatUnreadService();
export default chatUnreadService;
