import { useState, useEffect, useCallback, useRef } from 'react';
import chatSocketService from '../services/chatSocketService';
import chatService from '../services/chatService';
import { SERVER_EVENTS, MESSAGES_PER_PAGE } from '../constants/chatConstants';
import { v4 as uuidv4 } from 'uuid';
import useAuth from '../../auth/hooks/useAuth';

/**
 * Hook for managing messages in the active channel.
 * Handles real-time delivery, history loading, pagination,
 * editing, deleting, and reply state.
 */
export function useMessages(channelId, userProp = null) {
  const { user: authUser } = useAuth();
  const currentUser = userProp || authUser;
  const currentUserRef = useRef(currentUser);

  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  const [messages, setMessages] = useState([]);
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [replyTo, setReplyTo] = useState(null);
  const [typingUsers, setTypingUsers] = useState([]);
  const typingTimeouts = useRef(new Map());

  // Load initial messages and pins when channel changes
  useEffect(() => {
    if (!channelId) {
      setMessages([]);
      setPinnedMessages([]);
      return;
    }

    setIsLoading(true);
    setHasMore(true);
    setReplyTo(null);

    chatService.getPinnedMessages(channelId)
      .then((pins) => setPinnedMessages(Array.isArray(pins) ? pins : []))
      .catch(() => setPinnedMessages([]));

    chatService.getMessages(channelId, { limit: MESSAGES_PER_PAGE })
      .then((msgs) => {
        const list = msgs ?? [];
        setMessages(list);
        setHasMore(list.length >= MESSAGES_PER_PAGE);
        if (list.length > 0) {
          const latest = list[list.length - 1];
          if (latest?.id) {
            chatSocketService.markRead(channelId, latest.id);
          }
        }
      })
      .catch((err) => {
        console.error('Failed to load messages:', err);
        setHasMore(false);
      })
      .finally(() => setIsLoading(false));
  }, [channelId]);

  // Subscribe to real-time events
  useEffect(() => {
    if (!channelId) return;

    const unsubs = [
      chatSocketService.on(SERVER_EVENTS.NEW_MESSAGE, (msg) => {
        if (msg.channelId !== channelId) return;
        setMessages((prev) => {
          // Deduplicate by id or clientMessageId
          if (prev.some((m) => m.id === msg.id)) return prev;
          if (msg.clientMessageId && prev.some((m) => m.clientMessageId === msg.clientMessageId)) return prev;
          return [...prev, msg];
        });

        // Auto mark as read
        chatSocketService.markRead(channelId, msg.id);
      }),

      chatSocketService.on(SERVER_EVENTS.MESSAGE_EDITED, ({ messageId, content, editedAt }) => {
        setMessages((prev) =>
          prev.map((m) => (m.id === messageId ? { ...m, content, editedAt, edited_at: editedAt } : m))
        );
      }),

      chatSocketService.on(SERVER_EVENTS.MESSAGE_DELETED, ({ messageId, deletedAt }) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId ? { ...m, content: '[Message deleted]', deletedAt, deleted_at: deletedAt } : m
          )
        );
      }),

      chatSocketService.on(SERVER_EVENTS.REACTION_UPDATED, ({ messageId, reactions }) => {
        setMessages((prev) =>
          prev.map((m) => (m.id === messageId ? { ...m, reactions } : m))
        );
      }),

      chatSocketService.on(SERVER_EVENTS.MESSAGE_PINNED, ({ channelId: ch }) => {
        if (ch !== channelId) return;
        chatService.getPinnedMessages(channelId).then((pins) => setPinnedMessages(Array.isArray(pins) ? pins : [])).catch(() => {});
      }),

      chatSocketService.on(SERVER_EVENTS.MESSAGE_UNPINNED, ({ channelId: ch }) => {
        if (ch !== channelId) return;
        chatService.getPinnedMessages(channelId).then((pins) => setPinnedMessages(Array.isArray(pins) ? pins : [])).catch(() => {});
      }),

      chatSocketService.on(SERVER_EVENTS.MISSED_MESSAGES, ({ channelId: ch, messages: missed }) => {
        if (ch !== channelId || !Array.isArray(missed) || missed.length === 0) return;
        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m.id));
          const newMsgs = missed.filter((m) => !existingIds.has(m.id));
          if (newMsgs.length === 0) return prev;
          const merged = [...prev, ...newMsgs];
          const latest = merged[merged.length - 1];
          if (latest?.id) {
            chatSocketService.markRead(channelId, latest.id);
          }
          return merged;
        });
      }),

      // Typing indicators
      chatSocketService.on(SERVER_EVENTS.USER_TYPING, ({ channelId: ch, userId, email }) => {
        if (ch !== channelId) return;

        // Ignore typing indicator for the current user
        const curr = currentUserRef.current;
        const curId = curr?.id || curr?.userId || curr?.sub;
        const curEmail = curr?.email?.toLowerCase();
        if (
          (curId && String(userId) === String(curId)) ||
          (curEmail && email && curEmail === String(email).toLowerCase())
        ) {
          return;
        }

        setTypingUsers((prev) => {
          if (prev.some((u) => u.userId === userId)) return prev;
          return [...prev, { userId, email }];
        });
        // Auto-clear after 3 seconds
        clearTimeout(typingTimeouts.current.get(userId));
        typingTimeouts.current.set(userId, setTimeout(() => {
          setTypingUsers((prev) => prev.filter((u) => u.userId !== userId));
        }, 3000));
      }),

      chatSocketService.on(SERVER_EVENTS.USER_STOP_TYPING, ({ channelId: ch, userId }) => {
        if (ch !== channelId) return;
        setTypingUsers((prev) => prev.filter((u) => u.userId !== userId));
        clearTimeout(typingTimeouts.current.get(userId));
      }),
    ];

    return () => {
      unsubs.forEach((fn) => fn());
      typingTimeouts.current.forEach((t) => clearTimeout(t));
      typingTimeouts.current.clear();
    };
  }, [channelId]);

  // Load more (scroll up to load older messages)
  const loadMore = useCallback(async () => {
    if (!channelId || isLoading || !hasMore || messages.length === 0) return;

    setIsLoading(true);
    try {
      const oldest = messages[0];
      const older = await chatService.getMessages(channelId, {
        before: oldest.id,
        limit: MESSAGES_PER_PAGE,
      });
      setMessages((prev) => [...(older ?? []), ...prev]);
      setHasMore((older?.length ?? 0) >= MESSAGES_PER_PAGE);
    } catch (err) {
      console.error('Failed to load more messages:', err);
    } finally {
      setIsLoading(false);
    }
  }, [channelId, isLoading, hasMore, messages]);

  // Send message
  const sendMessage = useCallback((content, attachments = []) => {
    const trimmed = content?.trim() ?? '';
    if (!channelId || (!trimmed && (!attachments || attachments.length === 0))) return;
    const clientMessageId = uuidv4();
    chatSocketService.sendMessage(channelId, trimmed, clientMessageId, replyTo?.id ?? null, attachments);
    setReplyTo(null);
  }, [channelId, replyTo]);

  // Edit message (Phase 2)
  const editMessage = useCallback((messageId, content) => {
    chatSocketService.editMessage(messageId, content);
  }, []);

  // Delete message (Phase 2)
  const deleteMessage = useCallback((messageId) => {
    chatSocketService.deleteMessage(messageId);
  }, []);

  // Reactions (Phase 3)
  const toggleReaction = useCallback((messageId, reaction) => {
    chatSocketService.toggleReaction(messageId, reaction);
  }, []);

  // Pinned messages (Phase 3)
  const pinMessage = useCallback((messageId) => {
    if (!channelId || !messageId) return;
    chatSocketService.pinMessage(channelId, messageId);
  }, [channelId]);

  const unpinMessage = useCallback((messageId) => {
    if (!channelId || !messageId) return;
    chatSocketService.unpinMessage(channelId, messageId);
  }, [channelId]);

  // Typing
  const typingRef = useRef(false);
  const typingTimerRef = useRef(null);

  const handleTyping = useCallback(() => {
    if (!channelId) return;
    if (!typingRef.current) {
      typingRef.current = true;
      chatSocketService.startTyping(channelId);
    }
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      typingRef.current = false;
      chatSocketService.stopTyping(channelId);
    }, 2000);
  }, [channelId]);

  return {
    messages,
    pinnedMessages,
    isLoading,
    hasMore,
    loadMore,
    sendMessage,
    editMessage,
    deleteMessage,
    toggleReaction,
    pinMessage,
    unpinMessage,
    replyTo,
    setReplyTo,
    typingUsers,
    handleTyping,
  };
}

export default useMessages;
