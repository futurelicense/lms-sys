import { useState, useRef, useEffect, useMemo } from 'react';
import { Paperclip, X, FileText, Loader2, Lock, Users } from 'lucide-react';
import { MESSAGE_MAX_LENGTH } from '../constants/chatConstants';
import chatService from '../services/chatService';
import { getChannelDisplayName } from '../utils/chatHelpers';

/**
 * Message composer — text input with attachments, send button, reply preview,
 * smart @mentions autocomplete (direct message recipient vs group/course @everyone + members),
 * and archived channel lock.
 */
export default function MessageComposer({
  onSend,
  onTyping,
  replyTo,
  onCancelReply,
  disabled,
  isArchived = false,
  members = [],
  channelMembers = [],
  channel = null,
  currentUser = null,
  messages = [],
}) {
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [mentionQuery, setMentionQuery] = useState(null);
  const [mentionIndex, setMentionIndex] = useState(0);

  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

  // Focus input when reply changes
  useEffect(() => {
    if (replyTo) inputRef.current?.focus();
  }, [replyTo]);

  const currentUserId = currentUser?.id || currentUser?.userId || currentUser?.sub;
  const isDirect = (channel?.type || '').toUpperCase() === 'DIRECT';

  // Aggregate members from props, channel object, and recent message senders
  const effectiveMembers = useMemo(() => {
    const list = [];
    const seen = new Set();

    const add = (m) => {
      if (!m) return;
      const id = m.user_id || m.userId || m.id;
      const key = id ? String(id) : (m.email || m.name || m.display_name);
      if (key && !seen.has(key)) {
        seen.add(key);
        list.push(m);
      }
    };

    if (Array.isArray(members)) members.forEach(add);
    if (Array.isArray(channelMembers)) channelMembers.forEach(add);
    if (Array.isArray(channel?.members)) channel.members.forEach(add);

    // Also extract senders from recent messages as a fallback
    if (Array.isArray(messages)) {
      messages.forEach((msg) => {
        const sid = msg.sender_id || msg.senderId;
        const sname = msg.sender_name || msg.senderName;
        const semail = msg.sender_email || msg.senderEmail;
        if (sid && (sname || semail)) {
          add({
            user_id: sid,
            id: sid,
            name: sname || semail?.split('@')[0],
            display_name: sname || semail?.split('@')[0],
            email: semail,
          });
        }
      });
    }

    return list;
  }, [members, channelMembers, channel, messages]);

  // Build mention candidates list based on channel type:
  // - If Direct Message: suggest only that person
  // - If Group or Course: suggest @everyone first, then all members in the channel
  const allCandidates = useMemo(() => {
    if (isDirect) {
      let other = effectiveMembers.find((m) => {
        const mid = String(m.user_id || m.userId || m.id);
        return currentUserId ? mid !== String(currentUserId) : true;
      });

      // If we couldn't differentiate from current user but have at least one member
      if (!other && effectiveMembers.length > 0) {
        other = effectiveMembers.find((m) => {
          const mEmail = m.email;
          return currentUser?.email ? mEmail !== currentUser.email : true;
        }) || effectiveMembers[0];
      }

      const helperName = getChannelDisplayName(channel, currentUserId, effectiveMembers);
      const targetName =
        (other?.name && other.name !== 'Direct Message' ? other.name : null) ||
        (other?.display_name && other.display_name !== 'Direct Message' ? other.display_name : null) ||
        (other?.displayName && other.displayName !== 'Direct Message' ? other.displayName : null) ||
        (channel?.otherUserName && channel.otherUserName !== 'Direct Message' ? channel.otherUserName : null) ||
        (channel?.other_user_name && channel.other_user_name !== 'Direct Message' ? channel.other_user_name : null) ||
        (helperName && helperName !== 'Direct Message' ? helperName : null) ||
        (channel?.directUserEmail ? channel.directUserEmail.split('@')[0] : null) ||
        (other?.email ? other.email.split('@')[0] : null) ||
        'User';

      const targetId =
        other?.user_id ||
        other?.userId ||
        other?.id ||
        channel?.otherUserId ||
        channel?.other_user_id ||
        'direct-target';

      const targetEmail = other?.email || channel?.directUserEmail || channel?.direct_user_email;

      return [
        {
          id: targetId,
          name: targetName,
          display_name: targetName,
          email: targetEmail,
          isEveryone: false,
        },
      ];
    }

    // Group / Course / Org channel
    const list = [
      {
        id: 'everyone',
        name: 'everyone',
        display_name: 'everyone',
        subtitle: 'Notify everyone in this channel',
        isEveryone: true,
      },
    ];

    effectiveMembers.forEach((m) => {
      const mid = m.user_id || m.userId || m.id;
      if (!currentUserId || String(mid) !== String(currentUserId)) {
        const name = m.name || m.display_name || m.email?.split('@')[0] || 'User';
        list.push({
          id: mid || name,
          name,
          display_name: m.display_name || name,
          email: m.email,
          isEveryone: false,
        });
      }
    });

    return list;
  }, [isDirect, effectiveMembers, currentUserId, currentUser, channel]);

  const filteredMembers = useMemo(() => {
    if (mentionQuery === null) return [];
    const q = mentionQuery.toLowerCase().trim();
    if (!q) {
      return allCandidates.slice(0, 8);
    }
    return allCandidates
      .filter((c) => {
        if (c.isEveryone) {
          return (
            'everyone'.startsWith(q) ||
            'all'.startsWith(q) ||
            'everyone'.includes(q)
          );
        }
        const nameMatch = (c.name || '').toLowerCase().includes(q);
        const displayMatch = (c.display_name || '').toLowerCase().includes(q);
        const emailMatch = (c.email || '').toLowerCase().includes(q);
        return nameMatch || displayMatch || emailMatch;
      })
      .slice(0, 8);
  }, [mentionQuery, allCandidates]);

  const insertMention = (candidate) => {
    const cleanName = candidate.isEveryone
      ? 'everyone'
      : (candidate.name || candidate.display_name || 'user').replace(/\s+/g, '_');
    const cursor = inputRef.current?.selectionStart ?? content.length;
    const textBefore = content.slice(0, cursor);
    const textAfter = content.slice(cursor);
    const newBefore = textBefore.replace(/@([a-zA-Z0-9._-]*)$/, `@${cleanName} `);
    setContent(newBefore + textAfter);
    setMentionQuery(null);
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        const nextPos = newBefore.length;
        inputRef.current.setSelectionRange(nextPos, nextPos);
      }
    }, 0);
  };

  const [isDragging, setIsDragging] = useState(false);

  const uploadAndAppendFiles = async (files) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    setUploadError(null);
    try {
      const uploaded = await chatService.uploadFiles(files);
      const list = Array.isArray(uploaded)
        ? uploaded
        : Array.isArray(uploaded?.data)
        ? uploaded.data
        : (uploaded ? [uploaded] : []);
      setAttachments((prev) => [...prev, ...list]);
    } catch (err) {
      console.error('File upload failed:', err);
      setUploadError(err?.response?.data?.error || err?.message || 'Failed to upload attachment');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    await uploadAndAppendFiles(files);
  };

  const handlePaste = async (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    const filesToUpload = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type && item.type.indexOf('image') !== -1) {
        const file = item.getAsFile();
        if (file) {
          // Rename pasted screenshot to something descriptive with timestamp
          const extension = file.type.split('/')[1] || 'png';
          const renamedFile = new File(
            [file],
            `screenshot-${new Date().toISOString().replace(/[:.]/g, '-')}.${extension}`,
            { type: file.type }
          );
          filesToUpload.push(renamedFile);
        }
      }
    }

    if (filesToUpload.length > 0) {
      e.preventDefault();
      await uploadAndAppendFiles(filesToUpload);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!isDragging && !disabled && !isArchived) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    if (e.currentTarget.contains(e.relatedTarget)) return;
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled || isArchived) return;

    const files = Array.from(e.dataTransfer?.files || []);
    if (files.length > 0) {
      await uploadAndAppendFiles(files);
    }
  };

  const removeAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const hasContent = content.trim().length > 0;
    const hasAttachments = attachments.length > 0;
    if ((!hasContent && !hasAttachments) || disabled || isUploading || isArchived) return;

    onSend(content.trim(), attachments);
    setContent('');
    if (inputRef.current) {
      inputRef.current.style.height = '24px';
      inputRef.current.style.overflowY = 'hidden';
    }
    setAttachments([]);
    setUploadError(null);
    setMentionQuery(null);
  };

  const handleKeyDown = (e) => {
    // Mentions menu keyboard navigation
    if (mentionQuery !== null) {
      if (e.key === 'Escape') {
        e.preventDefault();
        setMentionQuery(null);
        return;
      }
      if (filteredMembers.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setMentionIndex((prev) => (prev + 1) % filteredMembers.length);
          return;
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setMentionIndex((prev) => (prev - 1 + filteredMembers.length) % filteredMembers.length);
          return;
        }
        if (e.key === 'Enter' || e.key === 'Tab') {
          e.preventDefault();
          insertMention(filteredMembers[mentionIndex]);
          return;
        }
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleChange = (e) => {
    const value = e.target.value;
    if (value.length <= MESSAGE_MAX_LENGTH) {
      setContent(value);
      onTyping();

      if (inputRef.current) {
        inputRef.current.style.height = 'auto';
        const scrollH = inputRef.current.scrollHeight;
        inputRef.current.style.height = `${Math.min(Math.max(scrollH, 24), 120)}px`;
        inputRef.current.style.overflowY = scrollH > 120 ? 'auto' : 'hidden';
      }

      // Check for @mention trigger
      const cursor = e.target.selectionStart;
      const textBefore = value.slice(0, cursor);
      const match = textBefore.match(/@([a-zA-Z0-9._-]*)$/);
      if (match) {
        setMentionQuery(match[1]);
        setMentionIndex(0);
      } else {
        setMentionQuery(null);
      }
    }
  };

  if (isArchived) {
    return (
      <div className="chat-composer chat-composer--archived">
        <Lock size={16} className="chat-composer__lock-icon" />
        <span>This channel has been archived and is read-only.</span>
      </div>
    );
  }

  const remaining = MESSAGE_MAX_LENGTH - content.length;
  const isNearLimit = remaining < 200;
  const canSend = (content.trim().length > 0 || attachments.length > 0) && !disabled && !isUploading;

  return (
    <form
      className={`chat-composer ${isDragging ? 'chat-composer--dragging' : ''}`}
      onSubmit={handleSubmit}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag & Drop Visual Overlay */}
      {isDragging && (
        <div className="chat-composer__drop-overlay">
          <Paperclip size={20} className="chat-composer__drop-icon" />
          <span>Drop files here to attach</span>
        </div>
      )}

      {/* Mention autocomplete dropdown */}
      {mentionQuery !== null && (
        <div className="chat-mention-popover">
          <div className="chat-mention-popover__title">
            <span>{isDirect ? 'Mention in Direct Message' : 'Mention member or @everyone'}</span>
          </div>
          {filteredMembers.length > 0 ? (
            filteredMembers.map((member, idx) => {
              const displayName = member.display_name || member.name || 'User';
              return (
                <div
                  key={member.id || idx}
                  className={`chat-mention-item ${idx === mentionIndex ? 'chat-mention-item--selected' : ''}`}
                  onClick={() => insertMention(member)}
                >
                  <div className={`chat-mention-avatar ${member.isEveryone ? 'chat-mention-avatar--everyone' : ''}`}>
                    {member.isEveryone ? <Users size={14} /> : displayName[0]?.toUpperCase()}
                  </div>
                  <div className="chat-mention-info">
                    <span className={`chat-mention-name ${member.isEveryone ? 'chat-mention-name--everyone' : ''}`}>
                      {member.isEveryone ? '@everyone' : displayName}
                    </span>
                    {member.isEveryone ? (
                      <span className="chat-mention-subtitle">{member.subtitle}</span>
                    ) : member.email ? (
                      <span className="chat-mention-email">{member.email}</span>
                    ) : null}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="chat-mention-empty">
              No members matching &ldquo;@{mentionQuery}&rdquo;
            </div>
          )}
        </div>
      )}

      {/* Reply preview */}
      {replyTo && (
        <div className="chat-composer__reply">
          <span className="chat-composer__reply-label">
            ↪ Replying to {replyTo.senderEmail?.split('@')[0] ?? 'message'}
          </span>
          <span className="chat-composer__reply-text">{replyTo.content?.slice(0, 80)}</span>
          <button
            type="button"
            className="chat-composer__reply-cancel"
            onClick={onCancelReply}
          >
            ✕
          </button>
        </div>
      )}

      {/* Attachment chips */}
      {attachments.length > 0 && (
        <div className="chat-composer__attachments">
          {attachments.map((file, idx) => {
            if (!file) return null;
            const fileName = typeof file === 'string'
              ? file.split('/').pop() || 'file'
              : (file.name || file.originalName || file.filename || 'file');
            const fileUrl = typeof file === 'string' ? file : file.url;
            const fileMime = typeof file === 'object' ? (file.mimeType || file.mimetype || '') : '';
            const isImg = fileMime.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(fileName);
            const sizeStr = typeof file === 'object' && file.size ? `${(file.size / 1024).toFixed(0)} KB` : '';
            return (
              <div key={file.id || file.filename || idx} className="chat-attachment-chip">
                {isImg && fileUrl ? (
                  <img src={fileUrl} alt="" className="chat-attachment-chip__thumb" />
                ) : (
                  <FileText size={14} className="chat-attachment-chip__icon" />
                )}
                <span className="chat-attachment-chip__name" title={fileName}>
                  {fileName}
                  {sizeStr && <span className="chat-attachment-chip__size"> ({sizeStr})</span>}
                </span>
                <button
                  type="button"
                  className="chat-attachment-chip__remove"
                  onClick={() => removeAttachment(idx)}
                  title="Remove attachment"
                >
                  <X size={12} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload error */}
      {uploadError && <div className="chat-composer__upload-error">{uploadError}</div>}

      <div className="chat-composer__input-row">
        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          multiple
          style={{ display: 'none' }}
        />

        {/* Paperclip attach button */}
        <button
          type="button"
          className="chat-composer__attach-btn"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isUploading}
          title="Attach files (images, PDFs, documents)"
          aria-label="Attach files"
        >
          {isUploading ? <Loader2 size={18} className="chat-spinner-icon" /> : <Paperclip size={18} />}
        </button>

        <textarea
          ref={inputRef}
          className="chat-composer__input"
          placeholder={disabled ? 'Reconnecting...' : 'Type a message... (paste screenshots or type @ to mention)'}
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          disabled={disabled}
          rows={1}
        />

        <button
          type="submit"
          className={`chat-composer__send ${canSend ? 'chat-composer__send--active' : ''}`}
          disabled={!canSend}
          title="Send message"
          aria-label="Send message"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>

      {/* Character count near limit */}
      {isNearLimit && (
        <div className={`chat-composer__char-count ${remaining < 50 ? 'chat-composer__char-count--danger' : ''}`}>
          {remaining} characters remaining
        </div>
      )}
    </form>
  );
}
