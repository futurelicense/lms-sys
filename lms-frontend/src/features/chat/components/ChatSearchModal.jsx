import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Search, X, MessageSquare, Paperclip, Calendar, Loader2 } from 'lucide-react';
import chatService from '../services/chatService';
import { formatMessageTime, getAvatarColorIndex, getChannelIcon } from '../utils/chatHelpers';

/**
 * Highlights matches of query within text.
 */
function HighlightedText({ text, query }) {
  if (!query || !text) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="chat-search-highlight">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}

export default function ChatSearchModal({
  isOpen,
  onClose,
  activeChannel,
  onSelectResult,
}) {
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState('channel'); // 'channel' | 'all'
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const inputRef = useRef(null);

  // Focus on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults([]);
      setHasSearched(false);
    }
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    if (!isOpen) return;
    const trimmed = query.trim();
    if (trimmed.length < 1) {
      setResults([]);
      setIsLoading(false);
      setHasSearched(false);
      return;
    }

    setIsLoading(true);
    const timer = setTimeout(async () => {
      try {
        const channelId = scope === 'channel' ? activeChannel?.id : undefined;
        const data = await chatService.searchMessages({ query: trimmed, channelId });
        const list = Array.isArray(data)
          ? data
          : (Array.isArray(data?.data) ? data.data : (data?.results ?? []));
        setResults(list);
        setHasSearched(true);
      } catch (err) {
        console.error('Search failed:', err);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query, scope, activeChannel?.id, isOpen]);

  // Keyboard navigation (Escape to close)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentChannelName = activeChannel?.displayName || activeChannel?.display_name || activeChannel?.name || 'Current Channel';

  return createPortal(
    <div
      className="chat-search-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Search Messages"
    >
      <div className="chat-search-modal">
        {/* Search header & input */}
        <div className="chat-search-modal__header">
          <div className="chat-search-modal__input-wrapper">
            <Search size={18} className="chat-search-modal__icon" />
            <input
              ref={inputRef}
              type="text"
              className="chat-search-modal__input"
              placeholder="Search messages, links, code..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {isLoading ? (
              <Loader2 size={16} className="chat-spinner-icon" />
            ) : query ? (
              <button
                type="button"
                className="chat-search-modal__clear"
                onClick={() => setQuery('')}
                title="Clear search"
              >
                <X size={16} />
              </button>
            ) : (
              <kbd className="chat-search-modal__kbd">ESC</kbd>
            )}
          </div>

          {/* Scope filter tabs */}
          <div className="chat-search-modal__tabs">
            {activeChannel && (
              <button
                type="button"
                className={`chat-search-modal__tab ${scope === 'channel' ? 'chat-search-modal__tab--active' : ''}`}
                onClick={() => setScope('channel')}
              >
                <span>In #{currentChannelName}</span>
              </button>
            )}
            <button
              type="button"
              className={`chat-search-modal__tab ${scope === 'all' ? 'chat-search-modal__tab--active' : ''}`}
              onClick={() => setScope('all')}
            >
              <span>All Channels</span>
            </button>
          </div>
        </div>

        {/* Results Area */}
        <div className="chat-search-modal__results">
          {isLoading ? (
            <div className="chat-search-modal__loading">
              <Loader2 size={24} className="chat-spinner-icon" />
              <span>Searching messages...</span>
            </div>
          ) : results.length > 0 ? (
            <div className="chat-search-modal__list">
              <div className="chat-search-modal__count">
                Found {results.length} message{results.length > 1 ? 's' : ''}
              </div>
              {results.map((msg) => {
                const senderName = msg.sender_name || msg.senderName || msg.sender_email?.split('@')[0] || 'User';
                const channelName = msg.channel_display_name || msg.channel_name || 'Channel';
                const hasFiles = (Array.isArray(msg.attachments) && msg.attachments.length > 0) ||
                  (typeof msg.attachments === 'string' && msg.attachments.length > 2);

                return (
                  <div
                    key={msg.id}
                    className="chat-search-result-item"
                    onClick={() => {
                      onSelectResult({
                        channelId: msg.channel_id || msg.channelId || msg.channel?.id,
                        messageId: msg.id || msg.message_id || msg.messageId,
                      });
                      onClose();
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="chat-search-result-item__top">
                      <div className="chat-search-result-item__sender">
                        <div className={`chat-search-result-item__avatar chat-avatar--gradient-${getAvatarColorIndex(msg.sender_id || msg.senderId || senderName)}`}>
                          {senderName[0]?.toUpperCase() || 'U'}
                        </div>
                        <span className="chat-search-result-item__sender-name">{senderName}</span>
                      </div>

                      <div className="chat-search-result-item__meta">
                        <span className="chat-search-result-item__channel-badge">
                          {getChannelIcon(msg.channel_type || msg.channelType)} {channelName}
                        </span>
                        <span className="chat-search-result-item__time">
                          {formatMessageTime(msg.created_at || msg.createdAt)}
                        </span>
                      </div>
                    </div>

                    <p className="chat-search-result-item__content">
                      <HighlightedText text={msg.content} query={query} />
                    </p>

                    {hasFiles && (
                      <div className="chat-search-result-item__has-attachment">
                        <Paperclip size={12} />
                        <span>Contains attachment</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : hasSearched ? (
            <div className="chat-search-modal__empty">
              <MessageSquare size={36} className="chat-search-modal__empty-icon" />
              <h4>No messages found</h4>
              <p>No results matching "{query}" {scope === 'channel' ? `in #${currentChannelName}` : 'across all channels'}.</p>
            </div>
          ) : (
            <div className="chat-search-modal__hint">
              <p>Type keywords to search message text across channels</p>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
