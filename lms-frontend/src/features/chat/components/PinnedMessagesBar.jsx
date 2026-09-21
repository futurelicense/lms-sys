import { useState } from 'react';
import { Pin, ChevronDown, ChevronUp, X } from 'lucide-react';

/**
 * Sticky banner at the top of the chat showing pinned messages.
 */
export default function PinnedMessagesBar({ pinnedMessages = [], onJumpToMessage, onUnpin, canUnpin }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!pinnedMessages || pinnedMessages.length === 0) return null;

  const count = pinnedMessages.length;
  const currentPin = pinnedMessages[0];
  const currentMessageId = currentPin.message_id || currentPin.id || currentPin.messageId;
  const currentAuthor = currentPin.sender_name || currentPin.senderName || currentPin.sender_email?.split('@')[0] || currentPin.senderEmail?.split('@')[0] || 'User';

  return (
    <div className="chat-pinned-bar">
      <div className="chat-pinned-bar__header" onClick={() => count > 1 && setIsExpanded((prev) => !prev)}>
        <div className="chat-pinned-bar__icon-wrapper">
          <Pin size={14} className="chat-pinned-bar__icon" />
        </div>
        <div className="chat-pinned-bar__content">
          <div className="chat-pinned-bar__author">
            Pinned message{count > 1 ? ` (1 of ${count})` : ''} • {currentAuthor}
          </div>
          <div className="chat-pinned-bar__snippet">
            {currentPin.content?.slice(0, 100) || (currentPin.attachments?.length ? 'Shared an attachment' : 'Message')}
          </div>
        </div>

        <div className="chat-pinned-bar__actions" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            className="chat-pinned-bar__btn"
            onClick={() => onJumpToMessage(currentMessageId)}
            title="Jump to message"
          >
            Jump
          </button>
          {canUnpin && (
            <button
              type="button"
              className="chat-pinned-bar__unpin-btn"
              onClick={() => onUnpin(currentMessageId)}
              title="Unpin"
              aria-label="Unpin"
            >
              <X size={14} />
            </button>
          )}
          {count > 1 && (
            <button
              type="button"
              className="chat-pinned-bar__toggle-btn"
              onClick={() => setIsExpanded((prev) => !prev)}
              title={isExpanded ? 'Collapse' : 'Show all pinned'}
            >
              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          )}
        </div>
      </div>

      {/* Expanded list of all pinned messages */}
      {isExpanded && count > 1 && (
        <div className="chat-pinned-bar__dropdown">
          {pinnedMessages.slice(1).map((pin) => {
            const pinId = pin.message_id || pin.id || pin.messageId;
            const pinAuthor = pin.sender_name || pin.senderName || pin.sender_email?.split('@')[0] || pin.senderEmail?.split('@')[0] || 'User';
            return (
              <div key={pin.pin_id || pinId} className="chat-pinned-bar__item">
                <div className="chat-pinned-bar__item-content">
                  <span className="chat-pinned-bar__item-sender">{pinAuthor}:</span>
                  <span className="chat-pinned-bar__item-text">{pin.content?.slice(0, 80) || 'Attachment'}</span>
                </div>
                <div className="chat-pinned-bar__item-actions">
                  <button
                    type="button"
                    className="chat-btn chat-btn--xs"
                    onClick={() => onJumpToMessage(pinId)}
                  >
                    Jump
                  </button>
                  {canUnpin && (
                    <button
                      type="button"
                      className="chat-pinned-bar__unpin-btn"
                      onClick={() => onUnpin(pinId)}
                      title="Unpin"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
