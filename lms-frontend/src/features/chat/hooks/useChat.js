import { useState, useEffect, useCallback, useRef } from 'react';
import chatSocketService from '../services/chatSocketService';
import chatService from '../services/chatService';
import chatUnreadService from '../services/chatUnreadService';
import { SERVER_EVENTS } from '../constants/chatConstants';

/**
 * Main chat hook — manages Socket.IO connection lifecycle,
 * channel list, active channel, and real-time event routing.
 */
export function useChat(initialChannelId = null) {
  const [channels, setChannels] = useState([]);
  const [isLoadingChannels, setIsLoadingChannels] = useState(true);
  const [activeChannelId, setActiveChannelId] = useState(initialChannelId);
  const [isConnected, setIsConnected] = useState(() => chatSocketService.getIsConnected());
  const [connectionError, setConnectionError] = useState(null);
  const [unreadCounts, setUnreadCounts] = useState(() => chatUnreadService.getUnreadMap());
  const cleanupRef = useRef([]);

  // Subscribe to central unread counts
  useEffect(() => {
    const unsub = chatUnreadService.subscribe((_total, map) => {
      setUnreadCounts(map);
    });
    return unsub;
  }, []);

  // React if initialChannelId changes externally (e.g. navigation or URL change)
  useEffect(() => {
    if (initialChannelId) {
      setActiveChannelId(initialChannelId);
      chatUnreadService.clearChannel(initialChannelId);
      setUnreadCounts((prev) => ({ ...prev, [initialChannelId]: 0 }));
    }
  }, [initialChannelId]);

  // Fetch initial channels and unread counts via REST for immediate render
  useEffect(() => {
    let isMounted = true;
    Promise.all([
      chatService.getChannels().catch((err) => {
        console.warn('Could not fetch initial channels via REST:', err.message);
        return [];
      }),
      chatService.getUnreadCounts().catch((err) => {
        console.warn('Could not fetch unread counts via REST:', err.message);
        return {};
      }),
    ]).then(([channelsData, unreadData]) => {
      if (!isMounted) return;
      const list = Array.isArray(channelsData) ? channelsData : [];
      setChannels(list);
      if (list.length > 0) {
        setActiveChannelId((prev) => {
          if (prev) return prev;
          if (initialChannelId && list.some((c) => c.id === initialChannelId || String(c.id) === String(initialChannelId))) {
            return initialChannelId;
          }
          return list[0].id;
        });
      }
      if (unreadData && typeof unreadData === 'object') {
        chatUnreadService.setCounts(unreadData);
        setUnreadCounts(unreadData);
      }
    }).finally(() => {
      if (isMounted) setIsLoadingChannels(false);
    });

    return () => {
      isMounted = false;
    };
  }, [initialChannelId]);

  const activeChannelIdRef = useRef(activeChannelId);
  useEffect(() => {
    activeChannelIdRef.current = activeChannelId;
  }, [activeChannelId]);

  // Connect on mount, subscribe to events
  useEffect(() => {
    // Sync current connection status immediately
    const currentlyConnected = chatSocketService.getIsConnected();
    setIsConnected(currentlyConnected);
    if (currentlyConnected) setConnectionError(null);

    chatSocketService.connect();

    const unsubs = [
      chatSocketService.on('connection_status', ({ connected }) => {
        setIsConnected(connected);
        if (connected) setConnectionError(null);
      }),

      chatSocketService.on('connection_error', ({ message }) => {
        setConnectionError(message);
        setIsLoadingChannels(false);
      }),

      chatSocketService.on(SERVER_EVENTS.AUTHENTICATED, ({ channels: ch }) => {
        setIsLoadingChannels(false);
        if (Array.isArray(ch)) {
          setChannels((prev) => {
            const prevMap = new Map((Array.isArray(prev) ? prev : []).map((p) => [p.id, p]));
            return ch.map((newCh) => {
              const existing = prevMap.get(newCh.id);
              return {
                ...existing,
                ...newCh,
                displayName: newCh.displayName || newCh.display_name || existing?.displayName || existing?.display_name,
                display_name: newCh.display_name || newCh.displayName || existing?.display_name || existing?.displayName,
                otherUserId: newCh.otherUserId || newCh.other_user_id || existing?.otherUserId || existing?.other_user_id,
                other_user_id: newCh.other_user_id || newCh.otherUserId || existing?.other_user_id || existing?.other_user_id,
                otherUserName: newCh.otherUserName || newCh.other_user_name || existing?.otherUserName || existing?.other_user_name,
                other_user_name: newCh.other_user_name || newCh.otherUserName || existing?.other_user_name || existing?.otherUserName,
                members: newCh.members || existing?.members || [],
              };
            });
          });
          setActiveChannelId((prev) => {
            if (prev) return prev;
            if (initialChannelId && ch.some((c) => c.id === initialChannelId || String(c.id) === String(initialChannelId))) {
              return initialChannelId;
            }
            return ch.length > 0 ? ch[0].id : null;
          });
        }
      }),

      chatSocketService.on(SERVER_EVENTS.CHANNEL_CREATED, (channel) => {
        setChannels((prev) => {
          const list = Array.isArray(prev) ? prev : [];
          if (list.some((c) => c.id === channel.id)) return list;
          return [channel, ...list];
        });
      }),

      chatSocketService.on(SERVER_EVENTS.UNREAD_UPDATED, ({ channelId, count }) => {
        setUnreadCounts((prev) => ({ ...prev, [channelId]: count }));
      }),

      chatSocketService.on(SERVER_EVENTS.CHANNEL_ARCHIVED, ({ channelId }) => {
        setChannels((prev) =>
          prev.map((c) => (c.id === channelId ? { ...c, is_archived: true, isArchived: true } : c))
        );
      }),

      chatSocketService.on(SERVER_EVENTS.CHANNEL_UNARCHIVED, ({ channelId }) => {
        setChannels((prev) =>
          prev.map((c) => (c.id === channelId ? { ...c, is_archived: false, isArchived: false } : c))
        );
      }),

      chatSocketService.on(SERVER_EVENTS.NEW_MESSAGE, (msg) => {
        if (!msg) return;
        // Increment unread for channels that aren't active
        if (msg.channelId !== activeChannelIdRef.current) {
          setUnreadCounts((prev) => ({
            ...prev,
            [msg.channelId]: (prev?.[msg.channelId] ?? 0) + 1,
          }));
        }
        // Move channel to top of list
        setChannels((prev) => {
          const list = Array.isArray(prev) ? prev : [];
          const idx = list.findIndex((c) => c.id === msg.channelId);
          if (idx <= 0) return list;
          const updated = [...list];
          const [ch] = updated.splice(idx, 1);
          updated.unshift(ch);
          return updated;
        });
      }),
    ];

    cleanupRef.current = unsubs;

    return () => {
      unsubs.forEach((fn) => fn());
    };
  }, []);

  const selectChannel = useCallback((channelId) => {
    setActiveChannelId(channelId);
    activeChannelIdRef.current = channelId;
    // Clear unread for this channel
    chatUnreadService.clearChannel(channelId);
    setUnreadCounts((prev) => ({ ...prev, [channelId]: 0 }));
  }, []);

  const handleChannelCreated = useCallback((channel) => {
    if (!channel) return;
    setChannels((prev) => {
      const list = Array.isArray(prev) ? prev : [];
      if (list.some((c) => c.id === channel.id)) return list;
      return [channel, ...list];
    });
    setActiveChannelId(channel.id);
  }, []);

  const createDm = useCallback(async (targetUserId) => {
    const channel = await chatService.createDirectChannel(targetUserId);
    handleChannelCreated(channel);
    return channel;
  }, [handleChannelCreated]);

  const updateChannel = useCallback((updatedChannel) => {
    if (!updatedChannel?.id) return;
    setChannels((prev) =>
      prev.map((c) => (c.id === updatedChannel.id ? { ...c, ...updatedChannel } : c))
    );
  }, []);

  // Automatically resolve members for any DIRECT channels missing display names
  useEffect(() => {
    const directChannelsMissingName = channels.filter(
      (c) =>
        c.type === 'DIRECT' &&
        !c.displayName &&
        !c.display_name &&
        !c.otherUserName &&
        !c.other_user_name &&
        (!c.members || c.members.length === 0)
    );

    if (directChannelsMissingName.length === 0) return;

    let isMounted = true;
    Promise.all(
      directChannelsMissingName.map(async (ch) => {
        try {
          const members = await chatService.getMembers(ch.id);
          const list = Array.isArray(members) ? members : (members?.data ?? []);
          return { channelId: ch.id, members: list };
        } catch {
          return null;
        }
      })
    ).then((results) => {
      if (!isMounted) return;
      setChannels((prev) =>
        prev.map((c) => {
          const match = results.find((r) => r && r.channelId === c.id);
          if (match && match.members?.length > 0) {
            return { ...c, members: match.members };
          }
          return c;
        })
      );
    });

    return () => {
      isMounted = false;
    };
  }, [channels]);

  return {
    channels,
    isLoadingChannels,
    isLoading: isLoadingChannels,
    activeChannelId,
    selectChannel,
    isConnected,
    connectionError,
    unreadCounts,
    createDm,
    onChannelCreated: handleChannelCreated,
    updateChannel,
  };
}

export default useChat;
