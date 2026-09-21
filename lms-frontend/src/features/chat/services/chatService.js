import axios from 'axios';
import environment from '../../../config/environment';
import tokenStorage from '../../../services/storage/tokenStorage';
import { installDemoAdapters } from '../../auth/services/demo/installDemoAdapters';

/**
 * Axios instance for the Chat Service REST API.
 * Separate from the main LMS API client since the Chat Service
 * runs on a different port/host.
 */
const chatApi = axios.create({
  baseURL: environment.chatServiceUrl ?? 'http://localhost:3001/api/v1/chat',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

installDemoAdapters(chatApi);

// Attach JWT token to every request
chatApi.interceptors.request.use((config) => {
  const token = tokenStorage.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Attach tenant slug from localStorage (if stored by main app)
  const tenantSlug = localStorage.getItem('tenantSlug');
  if (tenantSlug) {
    config.headers['X-Tenant-Slug'] = tenantSlug;
  }

  return config;
});

/** Unwrap response data (Chat Service returns { data: ... }) */
const unwrap = (r) => r?.data?.data ?? r?.data ?? r;

export const chatService = {
  /** List user's channels */
  getChannels: () => chatApi.get('/channels').then(unwrap),

  /** Get channel details */
  getChannel: (channelId) => chatApi.get(`/channels/${channelId}`).then(unwrap),

  /** Create a channel (DIRECT or GROUP) */
  createChannel: (payload) => chatApi.post('/channels', payload).then(unwrap),

  /** Get channel members */
  getMembers: (channelId) => chatApi.get(`/channels/${channelId}/members`).then(unwrap),

  /** Add member to group channel */
  addMember: (channelId, userId) => chatApi.post(`/channels/${channelId}/members`, { userId }).then(unwrap),

  /** Remove member from group channel */
  removeMember: (channelId, userId) => chatApi.delete(`/channels/${channelId}/members/${userId}`).then(unwrap),

  /** Get message history (cursor-based pagination) */
  getMessages: (channelId, { before, limit } = {}) => {
    const params = new URLSearchParams();
    if (before) params.set('before', before);
    if (limit) params.set('limit', String(limit));
    return chatApi.get(`/channels/${channelId}/messages?${params}`).then(unwrap);
  },

  /** Search messages within a channel or across all channels */
  searchMessages: ({ query, channelId } = {}) => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (channelId) params.set('channelId', channelId);
    return chatApi.get(`/messages/search?${params}`).then(unwrap);
  },

  /** Search / list users for direct messaging */
  getUsers: (q) => chatApi.get('/users', { params: { q } }).then(unwrap),

  /** Create a direct 1-on-1 channel */
  createDirectChannel: (targetUserId) =>
    chatApi.post('/channels', { type: 'DIRECT', targetUserId }).then(unwrap),

  /** Create a group channel */
  createGroupChannel: (name, description, memberIds) =>
    chatApi.post('/channels', { type: 'GROUP', name, description, memberIds }).then(unwrap),

  /** Upload file attachments */
  uploadFiles: (files) => {
    const formData = new FormData();
    for (const file of files) {
      formData.append('files', file);
    }
    return chatApi
      .post('/upload', formData, {
        headers: { 'Content-Type': undefined },
      })
      .then(unwrap);
  },

  /** Edit a message (Phase 2) */
  editMessage: (messageId, content) => chatApi.put(`/messages/${messageId}`, { content }).then(unwrap),

  /** Delete a message (Phase 2) */
  deleteMessage: (messageId) => chatApi.delete(`/messages/${messageId}`).then(unwrap),

  /** Mark channel as read (Phase 2) */
  markAsRead: (channelId, messageId) => chatApi.post(`/channels/${channelId}/read`, { messageId }).then(unwrap),

  /** Get unread counts (Phase 2) */
  getUnreadCounts: () => chatApi.get('/unread-counts').then(unwrap),

  /** Toggle emoji reaction on a message (Phase 3) */
  toggleReaction: (messageId, reaction) =>
    chatApi.post(`/messages/${messageId}/reactions`, { reaction }).then(unwrap),

  /** Get reactions for a message (Phase 3) */
  getReactions: (messageId) => chatApi.get(`/messages/${messageId}/reactions`).then(unwrap),

  /** Get pinned messages for a channel (Phase 3) */
  getPinnedMessages: (channelId) => chatApi.get(`/channels/${channelId}/pins`).then(unwrap),

  /** Pin a message in a channel (Phase 3) */
  pinMessage: (channelId, messageId) =>
    chatApi.post(`/channels/${channelId}/pins/${messageId}`).then(unwrap),

  /** Unpin a message in a channel (Phase 3) */
  unpinMessage: (channelId, messageId) =>
    chatApi.delete(`/channels/${channelId}/pins/${messageId}`).then(unwrap),

  /** Update channel name and/or description (Phase 3) */
  updateChannel: (channelId, payload) =>
    chatApi.put(`/channels/${channelId}`, payload).then(unwrap),

  /** Archive a channel (Phase 3) */
  archiveChannel: (channelId) =>
    chatApi.post(`/channels/${channelId}/archive`).then(unwrap),

  /** Unarchive a channel (Phase 3) */
  unarchiveChannel: (channelId) =>
    chatApi.post(`/channels/${channelId}/unarchive`).then(unwrap),
};

export default chatService;
