import { useState } from 'react';
import { Reply, Pencil, Trash2, FileText, Download, Smile, Pin, PinOff, X, FileCode, FileArchive, FileSpreadsheet, Maximize2, Clock } from 'lucide-react';
import { formatMessageTime, getAvatarColorIndex } from '../utils/chatHelpers';
import ImageLightbox from './ImageLightbox';

const QUICK_EMOJIS = ['👍', '❤️', '😂', '🎉', '🚀', '👀'];

function formatFileSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(filename = '') {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  if (['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'html', 'css', 'json', 'sql', 'c', 'cpp'].includes(ext)) {
    return <FileCode size={20} className="chat-message__file-icon chat-message__file-icon--code" />;
  }
  if (['zip', 'rar', 'tar', 'gz', '7z'].includes(ext)) {
    return <FileArchive size={20} className="chat-message__file-icon chat-message__file-icon--archive" />;
  }
  if (['xls', 'xlsx', 'csv'].includes(ext)) {
    return <FileSpreadsheet size={20} className="chat-message__file-icon chat-message__file-icon--sheet" />;
  }
  return <FileText size={20} className="chat-message__file-icon" />;
}

/**
 * Parses text and highlights @mentions.
 */
function renderFormattedContent(text) {
  if (!text) return null;
  const parts = text.split(/(@\w+)/g);
  return parts.map((part, i) => {
    if (part.startsWith('@')) {
      return (
        <span key={i} className="chat-mention-tag">
          {part}
        </span>
      );
    }
    return part;
  });
}

/**
 * Single message bubble with hover actions (reply, edit, delete, react, pin).
 */
export default function MessageItem({
  message,
  onReply,
  onEdit,
  onDelete,
  onToggleReaction,
  onPin,
  onUnpin,
  isPinned = false,
  currentUser,
}) {
  const [showActions, setShowActions] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [activeLightboxImage, setActiveLightboxImage] = useState(null);

  const senderEmail = message.senderEmail ?? message.sender_email;
  const senderName = message.senderName ?? message.sender_name ?? senderEmail?.split('@')[0] ?? 'Unknown';
  const senderId = message.senderId ?? message.sender_id;
  const createdAt = message.createdAt ?? message.created_at;
  const editedAt = message.editedAt ?? message.edited_at;
  const deletedAt = message.deletedAt ?? message.deleted_at;
  const isDeleted = !!deletedAt;
  const isSystem = (message.messageType ?? message.message_type) === 'SYSTEM';
  const replyTo = message.replyToMessageId ?? message.reply_to_message_id;
  const replyAuthor = message.replyToSenderName ?? message.reply_to_sender_name ?? message.reply_to_sender_email?.split('@')[0];
  const replyContent = message.replyToContent ?? message.reply_to_content;

  const reactions = Array.isArray(message.reactions) ? message.reactions : [];

  const currentUserId = currentUser?.id || currentUser?.userId;
  const userRoles = currentUser?.roles || [];
  const isOwner = !!(currentUserId && senderId && String(currentUserId) === String(senderId));
  const isModerator = userRoles.some((r) => ['ADMIN', 'SUPER_ADMIN', 'INSTRUCTOR'].includes(r));
  const canEdit = isOwner && !isDeleted;
  const canDelete = (isOwner || isModerator) && !isDeleted;
  const canPin = (isModerator || isOwner) && !isDeleted;

  let attachments = [];
  if (Array.isArray(message?.attachments)) {
    attachments = message.attachments;
  } else if (typeof message?.attachments === 'string') {
    try {
      const parsed = JSON.parse(message.attachments);
      if (Array.isArray(parsed)) attachments = parsed;
      else if (parsed && typeof parsed === 'object') attachments = [parsed];
    } catch {
      attachments = [];
    }
  } else if (message?.attachments && typeof message?.attachments === 'object') {
    attachments = [message.attachments];
  }

  const handleEditSubmit = () => {
    if (editContent.trim()) {
      onEdit(message.id, editContent.trim());
    }
    setIsEditing(false);
  };

  if (isSystem) {
    return (
      <div className="chat-message chat-message--system">
        <span className="chat-message__system-text">{message.content}</span>
        <span className="chat-message__time">{formatMessageTime(createdAt)}</span>
      </div>
    );
  }

  return (
    <div
      id={`chat-msg-${message.id}`}
      className={`chat-message ${isOwner ? 'chat-message--outgoing' : 'chat-message--incoming'} ${isDeleted ? 'chat-message--deleted' : ''}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => {
        setShowActions(false);
        setShowEmojiPicker(false);
      }}
    >
      {/* Avatar */}
      <div className={`chat-message__avatar chat-avatar--gradient-${getAvatarColorIndex(senderId || senderName)}`}>
        {senderName[0]?.toUpperCase() || '?'}
      </div>

      <div className="chat-message__body">
        <div className="chat-message__bubble">
        {/* Header: name + time */}
        <div className="chat-message__header">
          <span className="chat-message__sender">{senderName}</span>
          <span className="chat-message__time">{formatMessageTime(createdAt)}</span>
          {editedAt && !isDeleted && <span className="chat-message__edited">(edited)</span>}
          {isPinned && <span className="chat-message__pinned-badge">📌 Pinned</span>}
        </div>

        {/* Reply context preview */}
        {replyTo && (
          <div className="chat-message__reply-context">
            <span className="chat-message__reply-author">
              ↪ {replyAuthor || 'Replied message'}:
            </span>
            <span className="chat-message__reply-snippet">
              {replyContent || 'Message'}
            </span>
          </div>
        )}

        {/* Content */}
        {isEditing ? (
          <div className="chat-message__edit-form">
            <input
              type="text"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleEditSubmit();
                if (e.key === 'Escape') setIsEditing(false);
              }}
              className="chat-message__edit-input"
              autoFocus
            />
            <div className="chat-message__edit-actions">
              <button onClick={handleEditSubmit} className="chat-btn chat-btn--sm">Save</button>
              <button onClick={() => setIsEditing(false)} className="chat-btn chat-btn--sm chat-btn--ghost">Cancel</button>
            </div>
          </div>
        ) : (
          <>
            {message.content && (
              <p className={`chat-message__content ${isDeleted ? 'chat-message__content--deleted' : ''}`}>
                {isDeleted ? message.content : renderFormattedContent(message.content)}
              </p>
            )}

            {/* Reaction chips */}
            {reactions.length > 0 && !isDeleted && (
              <div className="chat-message__reactions">
                {reactions.map((r, idx) => {
                  const hasReacted = currentUserId && Array.isArray(r.userIds) && r.userIds.includes(String(currentUserId));
                  const userNamesList = Array.isArray(r.userNames) ? r.userNames.filter(Boolean).join(', ') : '';
                  return (
                    <button
                      key={r.reaction || idx}
                      type="button"
                      className={`chat-reaction-chip ${hasReacted ? 'chat-reaction-chip--active' : ''}`}
                      onClick={() => onToggleReaction?.(message.id, r.reaction)}
                      title={userNamesList || `${r.count} reaction${r.count > 1 ? 's' : ''}`}
                    >
                      <span className="chat-reaction-chip__emoji">{r.reaction}</span>
                      <span className="chat-reaction-chip__count">{r.count}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Attachments rendering */}
            {attachments.length > 0 && !isDeleted && (
              <div className="chat-message__attachments">
                {attachments.map((att, idx) => {
                  if (!att) return null;
                  const fileName = typeof att === 'string'
                    ? att.split('/').pop() || 'file'
                    : (att.name || att.originalName || att.filename || 'file');
                  const fileUrl = typeof att === 'string' ? att : att.url;
                  const mimeType = typeof att === 'object' ? (att.mimeType || att.mimetype || '') : '';
                  const isImage = mimeType.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(fileName);
                  const isExpired = typeof att === 'object' && (att.expired || !fileUrl);

                  if (isExpired) {
                    return (
                      <div
                        key={att.id || idx}
                        className="chat-message__file-card chat-message__file-card--expired"
                        style={{
                          opacity: 0.7,
                          borderStyle: 'dashed',
                          cursor: 'default',
                          background: 'rgba(255, 255, 255, 0.02)',
                        }}
                        title="This attachment has expired per the organization's retention policy"
                      >
                        <Clock size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                        <div className="chat-message__file-meta">
                          <span className="chat-message__file-name" style={{ textDecoration: 'line-through' }}>{fileName}</span>
                          <span className="chat-message__file-size" style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                            Expired per storage policy
                          </span>
                        </div>
                      </div>
                    );
                  }

                  return isImage && fileUrl ? (
                    <div
                      key={att.id || idx}
                      className="chat-message__image-card"
                      onClick={() => setActiveLightboxImage(typeof att === 'object' ? att : { url: fileUrl, name: fileName })}
                      title="Click to view full size"
                    >
                      <img
                        src={fileUrl}
                        alt={fileName}
                        className="chat-message__img"
                        loading="lazy"
                      />
                      <div className="chat-message__image-hover">
                        <Maximize2 size={16} />
                      </div>
                    </div>
                  ) : (
                    <a
                      key={att.id || idx}
                      href={fileUrl || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      download={fileName}
                      className="chat-message__file-card"
                      title={`Download ${fileName}`}
                    >
                      {getFileIcon(fileName)}
                      <div className="chat-message__file-meta">
                        <span className="chat-message__file-name">{fileName}</span>
                        {typeof att === 'object' && att.size && (
                          <span className="chat-message__file-size">
                            {formatFileSize(att.size)}
                          </span>
                        )}
                      </div>
                      <Download size={16} className="chat-message__file-download" />
                    </a>
                  );
                })}
              </div>
            )}

            {/* Lightbox Modal */}
            <ImageLightbox
              isOpen={Boolean(activeLightboxImage)}
              src={activeLightboxImage?.url}
              alt={activeLightboxImage?.name || activeLightboxImage?.originalName}
              name={activeLightboxImage?.name || activeLightboxImage?.originalName}
              onClose={() => setActiveLightboxImage(null)}
            />
          </>
        )}
        </div>{/* end .chat-message__bubble */}
      </div>

      {/* Hover actions */}
      {showActions && !isDeleted && !isEditing && (
        <div className="chat-message__actions">
          {/* Reaction Picker */}
          <div className="chat-reaction-picker-wrapper">
            {showEmojiPicker ? (
              <div className="chat-reaction-picker chat-reaction-picker--inline">
                {QUICK_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    className="chat-reaction-picker__btn"
                    onClick={() => {
                      onToggleReaction?.(message.id, emoji);
                      setShowEmojiPicker(false);
                    }}
                    title={`React with ${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
                <button
                  type="button"
                  className="chat-message__action chat-message__action--close-picker"
                  onClick={() => setShowEmojiPicker(false)}
                  title="Close reaction picker"
                  aria-label="Close reaction picker"
                >
                  <X size={13} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowEmojiPicker(true)}
                className="chat-message__action"
                title="Add reaction"
                aria-label="Add reaction"
              >
                <Smile size={14} />
              </button>
            )}
          </div>

          <button onClick={onReply} className="chat-message__action" title="Reply" aria-label="Reply">
            <Reply size={14} />
          </button>

          {canPin && (
            <button
              onClick={() => (isPinned ? onUnpin?.(message.id) : onPin?.(message.id))}
              className={`chat-message__action ${isPinned ? 'chat-message__action--pinned' : ''}`}
              title={isPinned ? 'Unpin message' : 'Pin message'}
              aria-label={isPinned ? 'Unpin message' : 'Pin message'}
            >
              {isPinned ? <PinOff size={14} /> : <Pin size={14} />}
            </button>
          )}

          {canEdit && (
            <button
              onClick={() => { setEditContent(message.content); setIsEditing(true); }}
              className="chat-message__action"
              title="Edit message"
              aria-label="Edit"
            >
              <Pencil size={14} />
            </button>
          )}

          {canDelete && (
            <button
              onClick={() => {
                if (window.confirm(isModerator && !isOwner ? 'Moderate and delete this message?' : 'Delete your message?')) {
                  onDelete(message.id);
                }
              }}
              className="chat-message__action chat-message__action--danger"
              title={isModerator && !isOwner ? 'Moderate Delete' : 'Delete'}
              aria-label="Delete"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
