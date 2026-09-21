import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Users, UserPlus, Trash2, Archive, ArchiveRestore, Shield, Edit2, Check, Search } from 'lucide-react';
import chatService from '../services/chatService';
import { CHANNEL_TYPES } from '../constants/chatConstants';
import { MemberRosterSkeleton } from './ChatSkeletons';

/**
 * ChannelDetailsModal — displays channel details, member roster with presence dots,
 * member management (add/remove), and archive toggle.
 */
export default function ChannelDetailsModal({
  isOpen,
  onClose,
  channel,
  currentUser,
  presence = {},
  onChannelUpdated,
}) {
  const [members, setMembers] = useState([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [isSavingInfo, setIsSavingInfo] = useState(false);

  // Add member state
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [searchUsers, setSearchUsers] = useState([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [error, setError] = useState(null);

  const { isOnline, formatPresence } = presence;

  // Load members when modal opens
  useEffect(() => {
    if (!isOpen || !channel?.id) {
      setIsEditingInfo(false);
      setIsAddingMember(false);
      setUserSearch('');
      setSearchUsers([]);
      setError(null);
      return;
    }

    setEditName(channel.name || '');
    setEditDesc(channel.description || '');

    setIsLoadingMembers(true);
    chatService.getMembers(channel.id)
      .then((data) => {
        const list = Array.isArray(data) ? data : (data?.data ?? []);
        setMembers(list);
      })
      .catch((err) => {
        console.error('Failed to load channel members:', err);
        setError('Failed to load channel members');
      })
      .finally(() => setIsLoadingMembers(false));
  }, [isOpen, channel?.id]);

  // Search users to add
  useEffect(() => {
    if (!isAddingMember) return;
    const timer = setTimeout(() => {
      setIsSearchingUsers(true);
      chatService.getUsers(userSearch)
        .then((data) => {
          const list = Array.isArray(data) ? data : (data?.data ?? []);
          // Exclude already existing members
          const existingIds = new Set(members.map((m) => String(m.user_id || m.userId || m.id)));
          setSearchUsers(list.filter((u) => !existingIds.has(String(u.id))));
        })
        .catch(() => setSearchUsers([]))
        .finally(() => setIsSearchingUsers(false));
    }, 250);
    return () => clearTimeout(timer);
  }, [isAddingMember, userSearch, members]);

  if (!isOpen || !channel) return null;

  const isDirect = channel.type === CHANNEL_TYPES.DIRECT;
  const isArchived = Boolean(channel.is_archived || channel.isArchived);

  // Check if current user has admin/owner rights
  const currentMember = members.find((m) => String(m.user_id || m.userId || m.id) === String(currentUser?.id));
  const isOwnerOrAdmin = !isDirect && (
    channel.creator_id === currentUser?.id ||
    currentMember?.role === 'owner' ||
    currentMember?.role === 'admin' ||
    currentUser?.role === 'ADMIN'
  );

  // Save edited info
  const handleSaveInfo = async (e) => {
    e.preventDefault();
    if (!editName.trim()) return;
    setIsSavingInfo(true);
    setError(null);
    try {
      const updated = await chatService.updateChannel(channel.id, {
        name: editName.trim(),
        description: editDesc.trim(),
      });
      onChannelUpdated?.(updated);
      setIsEditingInfo(false);
    } catch (err) {
      console.error('Failed to update channel:', err);
      setError(err?.response?.data?.error || 'Failed to update channel details');
    } finally {
      setIsSavingInfo(false);
    }
  };

  // Add a member
  const handleAddMember = async (userId) => {
    setError(null);
    try {
      await chatService.addMember(channel.id, userId);
      // Refresh members
      const updatedMembers = await chatService.getMembers(channel.id);
      const list = Array.isArray(updatedMembers) ? updatedMembers : (updatedMembers?.data ?? []);
      setMembers(list);
      setIsAddingMember(false);
      setUserSearch('');
    } catch (err) {
      console.error('Failed to add member:', err);
      setError(err?.response?.data?.error || 'Failed to add member');
    }
  };

  // Remove a member
  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Are you sure you want to remove this member?')) return;
    setError(null);
    try {
      await chatService.removeMember(channel.id, userId);
      setMembers((prev) => prev.filter((m) => String(m.user_id || m.userId || m.id) !== String(userId)));
    } catch (err) {
      console.error('Failed to remove member:', err);
      setError(err?.response?.data?.error || 'Failed to remove member');
    }
  };

  // Toggle archive
  const handleToggleArchive = async () => {
    const actionText = isArchived ? 'unarchive' : 'archive';
    if (!window.confirm(`Are you sure you want to ${actionText} this channel?`)) return;
    setError(null);
    try {
      const updated = isArchived
        ? await chatService.unarchiveChannel(channel.id)
        : await chatService.archiveChannel(channel.id);
      onChannelUpdated?.({ ...channel, is_archived: !isArchived, isArchived: !isArchived, ...updated });
    } catch (err) {
      console.error(`Failed to ${actionText} channel:`, err);
      setError(err?.response?.data?.error || `Failed to ${actionText} channel`);
    }
  };

  const modalContent = (
    <div className="chat-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="chat-modal chat-details-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="chat-modal__header">
          <div className="chat-modal__title-area">
            <h3 className="chat-modal__title">Channel Details</h3>
            <span className="chat-channel-header__type-badge">{channel.type}</span>
            {isArchived && <span className="chat-archived-badge">Archived</span>}
          </div>
          <button className="chat-modal__close" onClick={onClose} type="button">
            <X size={20} />
          </button>
        </div>

        {error && <div className="chat-modal__error">{error}</div>}

        <div className="chat-modal__body">
          {/* Channel Name & Description */}
          <div className="chat-details-section">
            <div className="chat-details-section__header">
              <h4>Channel Info</h4>
              {canManage && !isEditingInfo && (
                <button
                  type="button"
                  className="chat-details-btn--text"
                  onClick={() => setIsEditingInfo(true)}
                >
                  <Edit2 size={13} />
                  <span>Edit</span>
                </button>
              )}
            </div>

            {isEditingInfo ? (
              <form onSubmit={handleSaveInfo} className="chat-details-edit-form">
                <div className="chat-modal__form-group">
                  <label>Channel Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                  />
                </div>
                <div className="chat-modal__form-group">
                  <label>Description</label>
                  <textarea
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    rows={2}
                  />
                </div>
                <div className="chat-details-edit-actions">
                  <button
                    type="button"
                    className="chat-modal__btn chat-modal__btn--secondary"
                    onClick={() => setIsEditingInfo(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="chat-modal__btn chat-modal__btn--primary"
                    disabled={isSavingInfo || !editName.trim()}
                  >
                    {isSavingInfo ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="chat-details-info">
                <p className="chat-details-name">{channel.name || 'Unnamed Channel'}</p>
                {channel.description && (
                  <p className="chat-details-desc">{channel.description}</p>
                )}
              </div>
            )}
          </div>

          {/* Members list (for non-DIRECT channels) */}
          {channel.type !== CHANNEL_TYPES.DIRECT && (
            <div className="chat-details-section">
              <div className="chat-details-section__header">
                <h4>
                  <Users size={15} />
                  <span>Members ({members.length})</span>
                </h4>
                {canManage && !isAddingMember && (
                  <button
                    type="button"
                    className="chat-details-btn--text"
                    onClick={() => setIsAddingMember(true)}
                  >
                    <UserPlus size={13} />
                    <span>Add Member</span>
                  </button>
                )}
              </div>

              {/* Add member search inline */}
              {isAddingMember && (
                <div className="chat-details-add-member">
                  <div className="chat-modal__search">
                    <Search size={14} />
                    <input
                      type="text"
                      placeholder="Search users to add..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      autoFocus
                    />
                    <button
                      type="button"
                      className="chat-details-btn--cancel"
                      onClick={() => {
                        setIsAddingMember(false);
                        setUserSearch('');
                        setSearchUsers([]);
                      }}
                    >
                      <X size={14} />
                    </button>
                  </div>

                  {isSearchingUsers && (
                    <div className="chat-modal__loading">Searching...</div>
                  )}
                  {!isSearchingUsers && userSearch && searchUsers.length === 0 && (
                    <div className="chat-modal__empty">No matching users</div>
                  )}
                  {searchUsers.length > 0 && (
                    <div className="chat-details-search-results">
                      {searchUsers.map((u) => (
                        <div
                          key={u.id}
                          className="chat-modal__user-item"
                          onClick={() => handleAddMember(u.id)}
                        >
                          <div className="chat-modal__avatar">{u.name?.[0]?.toUpperCase() || '?'}</div>
                          <div className="chat-modal__user-info">
                            <span className="chat-modal__user-name">{u.name || u.email}</span>
                            {u.email && <span className="chat-modal__user-email">{u.email}</span>}
                          </div>
                          <button type="button" className="chat-modal__action-btn">
                            Add
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Member list with presence dots */}
              <div className="chat-details-member-list">
                {isLoadingMembers ? (
                  <MemberRosterSkeleton count={4} />
                ) : (
                  members.map((member) => {
                    const memberId = member.user_id || member.userId || member.id;
                    const online = isOnline ? isOnline(memberId) : false;
                    const isOwner = member.role === 'owner' || member.role === 'OWNER';
                    const isSelf = String(memberId) === String(currentUser?.id);
                    const name = member.name || member.display_name || member.email || 'Member';
                    const initial = name[0]?.toUpperCase() || '?';
                    const presenceText = formatPresence ? formatPresence(memberId) : (online ? 'Online' : 'Offline');

                    return (
                      <div key={memberId} className="chat-details-member-item">
                        <div className="chat-details-member-avatar-wrap">
                          <div className="chat-modal__avatar">
                            {initial}
                          </div>
                          <span
                            className={`chat-presence-dot ${
                              online ? 'chat-presence-dot--online' : 'chat-presence-dot--offline'
                            }`}
                            title={online ? 'Online' : 'Offline'}
                          />
                        </div>

                        <div className="chat-details-member-info">
                          <div className="chat-details-member-name-row">
                            <span className="chat-details-member-name">
                              {name}
                            </span>
                            {isSelf && <span className="chat-self-badge">you</span>}
                            {isOwner && (
                              <span className="chat-owner-badge" title="Channel Owner">
                                <Shield size={11} />
                                Owner
                              </span>
                            )}
                          </div>
                          {member.email && (
                            <span className="chat-details-member-email">{member.email}</span>
                          )}
                        </div>

                        {canManage && !isOwner && !isSelf && (
                          <button
                            type="button"
                            className="chat-details-btn--remove"
                            title="Remove member"
                            onClick={() => handleRemoveMember(memberId)}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Archive Action (Owner / Admin only) */}
          {canManage && (
            <div className="chat-details-section chat-details-section--danger">
              <button
                type="button"
                className={`chat-modal__btn ${
                  isArchived ? 'chat-modal__btn--secondary' : 'chat-modal__btn--danger'
                }`}
                onClick={handleToggleArchive}
              >
                {isArchived ? (
                  <>
                    <ArchiveRestore size={16} />
                    <span>Unarchive Channel</span>
                  </>
                ) : (
                  <>
                    <Archive size={16} />
                    <span>Archive Channel</span>
                  </>
                )}
              </button>
              <p className="chat-archive-hint">
                {isArchived
                  ? 'Unarchiving will allow members to post messages again.'
                  : 'Archiving sets this channel to read-only. Members will not be able to send new messages.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
}
