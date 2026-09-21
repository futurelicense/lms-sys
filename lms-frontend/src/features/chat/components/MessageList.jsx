import { useEffect, useRef, useCallback } from 'react';
import MessageItem from './MessageItem';
import { MessageFeedSkeleton } from './ChatSkeletons';

/**
 * Scrollable message list with infinite scroll (load older) and auto-scroll to bottom.
 */
export default function MessageList({
  messages = [],
  isLoading = false,
  hasMore = false,
  onLoadMore,
  onReply,
  onEdit,
  onDelete,
  onToggleReaction,
  onPin,
  onUnpin,
  pinnedMessages = [],
  typingUsers = [],
  currentUser,
}) {
  const containerRef = useRef(null);
  const bottomRef = useRef(null);
  const prevLengthRef = useRef(0);

  const pinnedSet = new Set(pinnedMessages.map((p) => p.message_id || p.id));

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > prevLengthRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevLengthRef.current = messages.length;
  }, [messages.length]);

  // Scroll up to load more
  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container || isLoading || !hasMore) return;
    if (container.scrollTop < 100) {
      onLoadMore();
    }
  }, [isLoading, hasMore, onLoadMore]);

  return (
    <div className="chat-message-list" ref={containerRef} onScroll={handleScroll}>
      {/* Load more indicator */}
      {hasMore && messages.length > 0 && (
        <div className="chat-message-list__loader">
          {isLoading ? (
            <span className="chat-spinner" />
          ) : (
            <button className="chat-load-more" onClick={onLoadMore}>
              Load older messages
            </button>
          )}
        </div>
      )}

      {/* Skeletons on initial load */}
      {messages.length === 0 && isLoading && (
        <MessageFeedSkeleton count={6} />
      )}

      {/* Messages */}
      {messages.length === 0 && !isLoading && (
        <div className="chat-message-list__empty">
          <p>No messages yet. Say something! 👋</p>
        </div>
      )}

      {messages.map((msg) => (
        <MessageItem
          key={msg.id ?? msg.clientMessageId}
          message={msg}
          onReply={() => onReply(msg)}
          onEdit={onEdit}
          onDelete={onDelete}
          onToggleReaction={onToggleReaction}
          onPin={onPin}
          onUnpin={onUnpin}
          isPinned={pinnedSet.has(msg.id)}
          currentUser={currentUser}
        />
      ))}

      {/* Typing indicator */}
      {(() => {
        const currentUserId = currentUser?.id || currentUser?.userId || currentUser?.sub;
        const currentUserEmail = currentUser?.email?.toLowerCase();
        const otherTypingUsers = typingUsers.filter((u) => {
          if (currentUserId && String(u.userId) === String(currentUserId)) return false;
          if (currentUserEmail && u.email && u.email.toLowerCase() === currentUserEmail) return false;
          return true;
        });

        if (otherTypingUsers.length === 0) return null;

        return (
          <div className="chat-typing-indicator">
            <span className="chat-typing-indicator__dots">
              <span /><span /><span />
            </span>
            <span className="chat-typing-indicator__text">
              {otherTypingUsers.map((u) => u.email?.split('@')[0]).join(', ')}
              {otherTypingUsers.length === 1 ? ' is' : ' are'} typing...
            </span>
          </div>
        );
      })()}

      <div ref={bottomRef} />
    </div>
  );
}
