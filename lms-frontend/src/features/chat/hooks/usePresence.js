import { useState, useEffect, useCallback } from 'react';
import chatSocketService from '../services/chatSocketService';
import { SERVER_EVENTS } from '../constants/chatConstants';

/**
 * Helper to format last-seen time relative to now.
 */
export function formatLastSeenTime(isoString) {
  if (!isoString) return 'Offline';
  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHr / 24);

  if (diffSec < 60) return 'Last seen just now';
  if (diffMin < 60) return `Last seen ${diffMin}m ago`;
  if (diffHr < 24) return `Last seen ${diffHr}h ago`;
  if (diffDays === 1) return 'Last seen yesterday';
  return `Last seen ${diffDays}d ago`;
}

/**
 * Hook to manage real-time online/offline presence and last seen state.
 */
export function usePresence() {
  const [onlineUserIds, setOnlineUserIds] = useState(() => chatSocketService.getOnlineUserIds());
  const [lastSeenMap, setLastSeenMap] = useState(() => chatSocketService.getLastSeenMap());

  useEffect(() => {
    // Initial sync with cached state
    setOnlineUserIds(chatSocketService.getOnlineUserIds());
    setLastSeenMap(chatSocketService.getLastSeenMap());

    const unsubs = [
      chatSocketService.on(SERVER_EVENTS.AUTHENTICATED, ({ onlineUserIds: online = [], lastSeen = {} }) => {
        if (Array.isArray(online)) {
          setOnlineUserIds(new Set(online.map((id) => String(id))));
        }
        if (lastSeen && typeof lastSeen === 'object') {
          setLastSeenMap({ ...lastSeen });
        }
      }),

      chatSocketService.on(SERVER_EVENTS.USER_PRESENCE, ({ userId, status, lastSeen }) => {
        if (!userId) return;
        const uid = String(userId);

        if (status === 'ONLINE') {
          setOnlineUserIds((prev) => {
            const next = new Set(prev);
            next.add(uid);
            return next;
          });
          setLastSeenMap((prev) => {
            const next = { ...prev };
            delete next[uid];
            return next;
          });
        } else if (status === 'OFFLINE') {
          setOnlineUserIds((prev) => {
            const next = new Set(prev);
            next.delete(uid);
            return next;
          });
          if (lastSeen) {
            setLastSeenMap((prev) => ({ ...prev, [uid]: lastSeen }));
          }
        }
      }),
    ];

    return () => {
      unsubs.forEach((fn) => fn());
    };
  }, []);

  const isOnline = useCallback((userId) => {
    if (!userId) return false;
    return onlineUserIds.has(String(userId));
  }, [onlineUserIds]);

  const getLastSeen = useCallback((userId) => {
    if (!userId) return null;
    return lastSeenMap[String(userId)] || null;
  }, [lastSeenMap]);

  const formatPresence = useCallback((userId) => {
    if (isOnline(userId)) return 'Active now';
    const lastSeen = getLastSeen(userId);
    return formatLastSeenTime(lastSeen);
  }, [isOnline, getLastSeen]);

  return {
    onlineUserIds,
    lastSeenMap,
    isOnline,
    getLastSeen,
    formatPresence,
  };
}

export default usePresence;
