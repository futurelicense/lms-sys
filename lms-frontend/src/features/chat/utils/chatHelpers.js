import { CHANNEL_TYPES } from '../constants/chatConstants';

/**
 * Formats a timestamp for display in the chat UI.
 */
export function formatMessageTime(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  if (isToday) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return `Yesterday ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }

  return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) +
    ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * Returns a display name for a channel.
 * For DIRECT channels, resolves the other participant's name instead of the generic label.
 */
export function getChannelDisplayName(channel, currentUserId = null, members = []) {
  if (!channel) return '';

  // 1. Named channels (GROUP, COURSE, ORG, etc.)
  if (channel.type !== CHANNEL_TYPES.DIRECT && channel.name) {
    return channel.name;
  }

  // 2. Explicit display name properties from backend or enrichment
  if (channel.display_name && channel.display_name !== 'Direct Message') {
    return channel.display_name;
  }
  if (channel.displayName && channel.displayName !== 'Direct Message') {
    return channel.displayName;
  }
  if (channel.other_user_name && channel.other_user_name !== 'Direct Message') {
    return channel.other_user_name;
  }
  if (channel.otherUserName && channel.otherUserName !== 'Direct Message') {
    return channel.otherUserName;
  }
  if (channel.directUserEmail || channel.direct_user_email) {
    const email = channel.directUserEmail || channel.direct_user_email;
    return email.split('@')[0];
  }

  // 3. Resolve from members array if present
  const memberList = Array.isArray(channel.members)
    ? channel.members
    : Array.isArray(members)
    ? members
    : [];

  if (memberList.length > 0) {
    const otherMember = currentUserId
      ? memberList.find((m) => String(m.user_id || m.userId || m.id) !== String(currentUserId))
      : memberList[0];
    if (otherMember) {
      const name = otherMember.name || otherMember.email?.split('@')[0];
      if (name) return name;
    }
  }

  // 4. Fallback if channel has a custom name
  if (channel.name && channel.name !== 'Direct Message') return channel.name;

  return channel.type === CHANNEL_TYPES.DIRECT ? 'Direct Message' : 'Unnamed Channel';
}

/**
 * Returns an icon/emoji for a channel type.
 */
export function getChannelIcon(type) {
  switch (type) {
    case CHANNEL_TYPES.ORG: return '🏢';
    case CHANNEL_TYPES.COURSE: return '📚';
    case CHANNEL_TYPES.DIRECT: return '💬';
    case CHANNEL_TYPES.GROUP: return '👥';
    case CHANNEL_TYPES.ANNOUNCEMENT: return '📢';
    case CHANNEL_TYPES.LIVE_SESSION: return '🔴';
    default: return '#';
  }
}

/**
 * Groups consecutive messages from the same sender for compact display.
 */
export function groupMessages(messages) {
  if (!messages?.length) return [];

  const groups = [];
  let currentGroup = null;

  for (const msg of messages) {
    const senderId = msg.senderId ?? msg.sender_id;
    if (currentGroup && currentGroup.senderId === senderId) {
      // Check if within 5 minutes of last message in group
      const lastMsg = currentGroup.messages[currentGroup.messages.length - 1];
      const lastTime = new Date(lastMsg.createdAt ?? lastMsg.created_at).getTime();
      const thisTime = new Date(msg.createdAt ?? msg.created_at).getTime();
      if (thisTime - lastTime < 5 * 60 * 1000) {
        currentGroup.messages.push(msg);
        continue;
      }
    }
    currentGroup = {
      senderId,
      senderEmail: msg.senderEmail ?? msg.sender_email,
      messages: [msg],
    };
    groups.push(currentGroup);
  }

  return groups;
}

/**
 * Generates a stable deterministic color index (0-5) for user avatars
 */
export function getAvatarColorIndex(nameOrId) {
  if (!nameOrId) return 0;
  const str = String(nameOrId);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % 6;
}

