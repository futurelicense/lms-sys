import { useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import notificationSocketService from '../services/notificationSocketService';
import notificationService from '../services/notificationService';
import teamsToastService from '../services/teamsToastService';
import { QUERY_KEYS } from '../../../constants/appConstants';

/**
 * Hook connecting the client to the LMS-Notification-Service real-time socket.
 * Synchronizes unread count and displays Microsoft Teams-style toast alerts on incoming notifications.
 */
export function useNotificationSocket() {
  const queryClient = useQueryClient();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const seenNotificationIdsRef = useRef(new Set());

  useEffect(() => {
    // Initial fetch of unread count from REST
    notificationService.getUnreadCount()
      .then((count) => {
        if (typeof count === 'number') setUnreadCount(count);
      })
      .catch(() => {});

    notificationSocketService.connect();

    const unsubStatus = notificationSocketService.on('connection_status', ({ connected }) => {
      setIsConnected(connected);
    });

    const unsubCount = notificationSocketService.on('unread_count', ({ count }) => {
      if (typeof count === 'number') {
        setUnreadCount(count);
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.NOTIFICATIONS });
      }
    });

    const unsubNotification = notificationSocketService.on('notification', (item) => {
      if (item && item.id) {
        // Prevent duplicate toasts and count increments
        if (seenNotificationIdsRef.current.has(item.id)) return;
        seenNotificationIdsRef.current.add(item.id);
        if (seenNotificationIdsRef.current.size > 200) {
          const first = seenNotificationIdsRef.current.values().next().value;
          seenNotificationIdsRef.current.delete(first);
        }

        setUnreadCount((prev) => prev + 1);
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.NOTIFICATIONS });

        // Dispatch to Microsoft Teams-style notification toast
        teamsToastService.show(item);
      }
    });

    return () => {
      unsubStatus();
      unsubCount();
      unsubNotification();
    };
  }, [queryClient]);

  return {
    unreadCount,
    setUnreadCount,
    isConnected,
  };
}

export default useNotificationSocket;
