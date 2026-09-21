import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Search, User, Users, Check, RotateCw } from 'lucide-react';
import chatService from '../services/chatService';
import { getAvatarColorIndex } from '../utils/chatHelpers';
import { UserListSkeleton } from './ChatSkeletons';

export default function NewChatModal({ isOpen, onClose, onChannelCreated }) {
  const [activeTab, setActiveTab] = useState('direct'); // 'direct' | 'group'
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState(new Set());
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const fetchUsers = useCallback(async (query) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await chatService.getUsers(query);
      const list = Array.isArray(data) ? data : (data?.data ?? []);
      setUsers(list);
    } catch (err) {
      console.error('Failed to load users:', err);
      setUsers([]);
      setError('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setSelectedUserIds(new Set());
      setGroupName('');
      setGroupDesc('');
      setError(null);
      return;
    }

    fetchUsers(searchQuery);
  }, [isOpen, searchQuery, fetchUsers]);

  if (!isOpen) return null;

  const handleStartDirect = async (targetUser) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const channel = await chatService.createDirectChannel(targetUser.id);
      onChannelCreated(channel);
      onClose();
    } catch (err) {
      console.error('Failed to start direct chat:', err);
      setError(err?.response?.data?.error || 'Failed to start direct chat');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!groupName.trim()) {
      setError('Please provide a group name');
      return;
    }
    if (selectedUserIds.size === 0) {
      setError('Please select at least one member');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const channel = await chatService.createGroupChannel(
        groupName.trim(),
        groupDesc.trim() || undefined,
        Array.from(selectedUserIds)
      );
      onChannelCreated(channel);
      onClose();
    } catch (err) {
      console.error('Failed to create group:', err);
      setError(err?.response?.data?.error || 'Failed to create group');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleUserSelection = (id) => {
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const modalContent = (
    <div className="chat-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="chat-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="chat-modal__header">
          <div className="chat-modal__tabs">
            <button
              className={`chat-modal__tab ${activeTab === 'direct' ? 'chat-modal__tab--active' : ''}`}
              onClick={() => setActiveTab('direct')}
              type="button"
            >
              <User size={16} />
              <span>Direct Message</span>
            </button>
            <button
              className={`chat-modal__tab ${activeTab === 'group' ? 'chat-modal__tab--active' : ''}`}
              onClick={() => setActiveTab('group')}
              type="button"
            >
              <Users size={16} />
              <span>New Group</span>
            </button>
          </div>
          <button className="chat-modal__close" onClick={onClose} type="button" aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        {/* Error message with retry */}
        {error && (
          <div className="chat-modal__error">
            <span>{error}</span>
            <button
              type="button"
              className="chat-modal__retry-btn"
              onClick={() => fetchUsers(searchQuery)}
              title="Retry loading users"
            >
              <RotateCw size={13} />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Content */}
        {activeTab === 'direct' ? (
          <div className="chat-modal__body">
            <div className="chat-modal__search">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search people by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
            </div>

            <div className="chat-modal__user-list">
              {isLoading ? (
                <UserListSkeleton count={5} />
              ) : users.length === 0 ? (
                <div className="chat-modal__empty">No users found</div>
              ) : (
                users.map((user) => {
                  const displayName = user.name || (user.email ? user.email.split('@')[0] : 'User');
                  const initial = user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || '?';
                  const avatarIdx = getAvatarColorIndex(user.name || user.email || user.id);
                  return (
                    <div
                      key={user.id}
                      className="chat-modal__user-item"
                      onClick={() => !isSubmitting && handleStartDirect(user)}
                    >
                      <div className={`chat-modal__avatar chat-avatar--gradient-${avatarIdx}`}>{initial}</div>
                      <div className="chat-modal__user-info">
                        <div className="chat-modal__user-name">{displayName}</div>
                        {user.email && <div className="chat-modal__user-email">{user.email}</div>}
                      </div>
                      <button
                        className="chat-modal__action-btn"
                        disabled={isSubmitting}
                        type="button"
                      >
                        Message
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleCreateGroup} className="chat-modal__body">
            <div className="chat-modal__form-group">
              <label>Group Name *</label>
              <input
                type="text"
                placeholder="e.g. Study Group, Project Team"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="chat-modal__form-group">
              <label>Description (Optional)</label>
              <input
                type="text"
                placeholder="What is this group about?"
                value={groupDesc}
                onChange={(e) => setGroupDesc(e.target.value)}
              />
            </div>

            <div className="chat-modal__section-label">Select Members ({selectedUserIds.size})</div>
            <div className="chat-modal__user-list chat-modal__user-list--selectable">
              {isLoading ? (
                <UserListSkeleton count={5} />
              ) : (
                Array.isArray(users) && users.map((user) => {
                  const isSelected = selectedUserIds.has(user.id);
                  const displayName = user.name || (user.email ? user.email.split('@')[0] : 'User');
                  const initial = user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || '?';
                  const avatarIdx = getAvatarColorIndex(user.name || user.email || user.id);
                  return (
                    <div
                      key={user.id}
                      className={`chat-modal__user-item ${isSelected ? 'chat-modal__user-item--selected' : ''}`}
                      onClick={() => toggleUserSelection(user.id)}
                    >
                      <div className={`chat-modal__avatar chat-avatar--gradient-${avatarIdx}`}>{initial}</div>
                      <div className="chat-modal__user-info">
                        <div className="chat-modal__user-name">{displayName}</div>
                        {user.email && <div className="chat-modal__user-email">{user.email}</div>}
                      </div>
                      <div className={`chat-modal__checkbox ${isSelected ? 'chat-modal__checkbox--checked' : ''}`}>
                        {isSelected && <Check size={14} />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="chat-modal__footer">
              <button
                type="button"
                className="chat-modal__btn chat-modal__btn--secondary"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="chat-modal__btn chat-modal__btn--primary"
                disabled={isSubmitting || !groupName.trim() || selectedUserIds.size === 0}
              >
                {isSubmitting ? 'Creating...' : 'Create Group'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
}
