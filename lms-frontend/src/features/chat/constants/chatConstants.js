/** Chat-specific constants. */

export const CHANNEL_TYPES = Object.freeze({
  ORG: 'ORG',
  COURSE: 'COURSE',
  DIRECT: 'DIRECT',
  GROUP: 'GROUP',
  ANNOUNCEMENT: 'ANNOUNCEMENT',
  LIVE_SESSION: 'LIVE_SESSION',
});

export const MESSAGE_TYPES = Object.freeze({
  TEXT: 'TEXT',
  SYSTEM: 'SYSTEM',
  ATTACHMENT: 'ATTACHMENT',
});

/** Socket.IO events sent by the client. */
export const CLIENT_EVENTS = Object.freeze({
  JOIN_CHANNEL: 'join_channel',
  LEAVE_CHANNEL: 'leave_channel',
  SEND_MESSAGE: 'send_message',
  EDIT_MESSAGE: 'edit_message',
  DELETE_MESSAGE: 'delete_message',
  TYPING_START: 'typing_start',
  TYPING_STOP: 'typing_stop',
  MARK_READ: 'mark_read',
  SYNC: 'sync',
  CREATE_DM: 'create_dm',
  TOGGLE_REACTION: 'toggle_reaction',
  PIN_MESSAGE: 'pin_message',
  UNPIN_MESSAGE: 'unpin_message',
  ARCHIVE_CHANNEL: 'archive_channel',
});

/** Socket.IO events received from the server. */
export const SERVER_EVENTS = Object.freeze({
  AUTHENTICATED: 'authenticated',
  NEW_MESSAGE: 'new_message',
  MESSAGE_EDITED: 'message_edited',
  MESSAGE_DELETED: 'message_deleted',
  USER_TYPING: 'user_typing',
  USER_STOP_TYPING: 'user_stop_typing',
  UNREAD_UPDATED: 'unread_updated',
  CHANNEL_CREATED: 'channel_created',
  MEMBER_JOINED: 'member_joined',
  MEMBER_LEFT: 'member_left',
  MISSED_MESSAGES: 'missed_messages',
  JOINED_CHANNEL: 'joined_channel',
  REACTION_UPDATED: 'reaction_updated',
  MESSAGE_PINNED: 'message_pinned',
  MESSAGE_UNPINNED: 'message_unpinned',
  CHANNEL_ARCHIVED: 'channel_archived',
  USER_PRESENCE: 'user_presence',
  ERROR: 'error',
});

export const MESSAGE_MAX_LENGTH = 4000;
export const MESSAGES_PER_PAGE = 50;
