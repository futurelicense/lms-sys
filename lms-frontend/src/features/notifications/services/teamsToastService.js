/**
 * TeamsToastService — In-memory observable service for Microsoft Teams-style
 * toast notifications. Ensures single-instance delivery and stacking.
 */
class TeamsToastService {
  constructor() {
    this.listeners = new Set();
    this.toasts = [];
    this.seenIds = new Set();
  }

  /**
   * Pushes a new notification to be displayed as a Teams-style toast card.
   * Deduplicates by notification ID.
   */
  show(notification) {
    if (!notification) return;
    const id = notification.id || `toast-${Date.now()}-${Math.random()}`;

    // Prevent duplicate rendering of the same notification
    if (this.seenIds.has(id)) return;
    this.seenIds.add(id);

    // Keep bounded history of seen IDs
    if (this.seenIds.size > 200) {
      const first = this.seenIds.values().next().value;
      this.seenIds.delete(first);
    }

    const toast = {
      ...notification,
      toastId: id,
      timestamp: Date.now(),
    };

    // Keep max 3 toasts visible at once, newest first
    this.toasts = [toast, ...this.toasts.filter((t) => t.toastId !== id).slice(0, 2)];
    this.notify();
  }

  /**
   * Dismisses a toast by ID.
   */
  dismiss(toastId) {
    this.toasts = this.toasts.filter((t) => t.toastId !== toastId);
    this.notify();
  }

  /**
   * Clears all active toasts.
   */
  clear() {
    this.toasts = [];
    this.notify();
  }

  /**
   * Subscribes to changes in the active toast queue.
   */
  subscribe(listener) {
    this.listeners.add(listener);
    listener(this.toasts);
    return () => this.listeners.delete(listener);
  }

  notify() {
    this.listeners.forEach((fn) => fn([...this.toasts]));
  }
}

export const teamsToastService = new TeamsToastService();
export default teamsToastService;
