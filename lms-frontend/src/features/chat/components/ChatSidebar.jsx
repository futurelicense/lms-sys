import { useState, useCallback } from 'react';
import { Search, SquarePen, Pin } from 'lucide-react';
import useAuth from '../../auth/hooks/useAuth';
import { getChannelDisplayName, getChannelIcon } from '../utils/chatHelpers';
import { CHANNEL_TYPES } from '../constants/chatConstants';
import NewChatModal from './NewChatModal';
import { SidebarSkeleton } from './ChatSkeletons';

const FILTER_OPTIONS = [
  { key: 'all', label: 'All' },
  { key: 'direct', label: 'DMs' },
  { key: 'group', label: 'Teams' },
  { key: 'course', label: 'Courses' },
];

/**
 * Chat sidebar — Teams-style with filter pills, search, pinned favorites, and conversation list.
 */
export default function ChatSidebar({
  channels = [],
  activeChannelId,
  onSelectChannel,
  unreadCounts = {},
  onChannelCreated,
  presence = {},
  isLoading = false,
}) {
  const { user: currentUser } = useAuth();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');

  const storageKey = `chat_pinned_${currentUser?.id || 'default'}`;
  const [pinnedIds, setPinnedIds] = useState(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const togglePinChannel = useCallback((e, channelId) => {
    e.stopPropagation();
    setPinnedIds((prev) => {
      const isPinned = prev.includes(channelId);
      const next = isPinned ? prev.filter((id) => id !== channelId) : [...prev, channelId];
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch (err) {
        console.error('Failed to persist pinned channels:', err);
      }
      return next;
    });
  }, [storageKey]);

  const safeChannels = Array.isArray(channels) ? channels : [];

  const filtered = safeChannels.filter((ch) => {
    // Filter by type
    if (activeFilter !== 'all') {
      const typeMap = {
        direct: CHANNEL_TYPES.DIRECT,
        group: CHANNEL_TYPES.GROUP,
        course: CHANNEL_TYPES.COURSE,
      };
      if (typeMap[activeFilter] && ch.type !== typeMap[activeFilter]) {
        // Also include ORG channels in the 'group' filter
        if (!(activeFilter === 'group' && ch.type === CHANNEL_TYPES.ORG)) {
          return false;
        }
      }
    }
    // Filter by search
    if (search) {
      const name = getChannelDisplayName(ch, currentUser?.id)?.toLowerCase() ?? '';
      if (!name.includes(search.toLowerCase())) return false;
    }
    return true;
  });

  // Pinned channels (shown at top)
  const pinnedChannels = filtered.filter((c) => pinnedIds.includes(c.id));

  // Group remaining channels by type for display
  const orgChannels = filtered.filter((c) => c.type === CHANNEL_TYPES.ORG && !pinnedIds.includes(c.id));
  const courseChannels = filtered.filter((c) => c.type === CHANNEL_TYPES.COURSE && !pinnedIds.includes(c.id));
  const directChannels = filtered.filter((c) => c.type === CHANNEL_TYPES.DIRECT && !pinnedIds.includes(c.id));
  const groupChannels = filtered.filter((c) => c.type === CHANNEL_TYPES.GROUP && !pinnedIds.includes(c.id));

  return (
    <aside className="chat-sidebar">
      <div className="chat-sidebar__header">
        <div className="chat-sidebar__title-wrapper">
          <h2 className="chat-sidebar__title">Chat</h2>
          {isLoading ? (
            <span className="chat-skeleton chat-skeleton--header-count" />
          ) : (
            <span className="chat-sidebar__count">{safeChannels.length}</span>
          )}
        </div>
        <button
          className="chat-sidebar__new-dm"
          onClick={() => setIsModalOpen(true)}
          title="Start new conversation"
          aria-label="Start new conversation"
        >
          <SquarePen size={18} />
        </button>
      </div>

      <NewChatModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onChannelCreated={(ch) => {
          onChannelCreated?.(ch);
          onSelectChannel(ch.id);
        }}
      />

      {/* Filter Pills */}
      <div className="chat-sidebar__filters">
        {FILTER_OPTIONS.map((f) => (
          <button
            key={f.key}
            className={`chat-filter-pill ${activeFilter === f.key ? 'chat-filter-pill--active' : ''}`}
            onClick={() => setActiveFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="chat-sidebar__search">
        <div className="chat-sidebar__search-wrapper">
          <Search className="chat-sidebar__search-icon" size={15} />
          <input
            type="text"
            placeholder="Search conversations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="chat-sidebar__search-input"
            disabled={isLoading}
          />
        </div>
      </div>

      <nav className="chat-sidebar__channels">
        {isLoading ? (
          <SidebarSkeleton />
        ) : (
          <>
            {pinnedChannels.length > 0 && (
              <ChannelGroup
                label="📌 Pinned"
                channels={pinnedChannels}
                activeId={activeChannelId}
                onSelect={onSelectChannel}
                unreadCounts={unreadCounts}
                presence={presence}
                currentUserId={currentUser?.id}
                pinnedIds={pinnedIds}
                onTogglePin={togglePinChannel}
              />
            )}
            {orgChannels.length > 0 && (
              <ChannelGroup
                label="Channels"
                channels={orgChannels}
                activeId={activeChannelId}
                onSelect={onSelectChannel}
                unreadCounts={unreadCounts}
                presence={presence}
                currentUserId={currentUser?.id}
                pinnedIds={pinnedIds}
                onTogglePin={togglePinChannel}
              />
            )}
            {courseChannels.length > 0 && (
              <ChannelGroup
                label="Courses"
                channels={courseChannels}
                activeId={activeChannelId}
                onSelect={onSelectChannel}
                unreadCounts={unreadCounts}
                presence={presence}
                currentUserId={currentUser?.id}
                pinnedIds={pinnedIds}
                onTogglePin={togglePinChannel}
              />
            )}
            {directChannels.length > 0 && (
              <ChannelGroup
                label="Direct Messages"
                channels={directChannels}
                activeId={activeChannelId}
                onSelect={onSelectChannel}
                unreadCounts={unreadCounts}
                presence={presence}
                currentUserId={currentUser?.id}
                pinnedIds={pinnedIds}
                onTogglePin={togglePinChannel}
              />
            )}
            {groupChannels.length > 0 && (
              <ChannelGroup
                label="Groups"
                channels={groupChannels}
                activeId={activeChannelId}
                onSelect={onSelectChannel}
                unreadCounts={unreadCounts}
                presence={presence}
                currentUserId={currentUser?.id}
                pinnedIds={pinnedIds}
                onTogglePin={togglePinChannel}
              />
            )}
            {filtered.length === 0 && (
              <p className="chat-sidebar__empty">No channels found</p>
            )}
          </>
        )}
      </nav>
    </aside>
  );
}

function ChannelGroup({
  label,
  channels = [],
  activeId,
  onSelect,
  unreadCounts = {},
  presence = {},
  currentUserId,
  pinnedIds = [],
  onTogglePin,
}) {
  return (
    <div className="chat-channel-group">
      <h3 className="chat-channel-group__label">{label}</h3>
      {channels.map((ch) => {
        const unread = (unreadCounts && unreadCounts[ch.id]) ?? 0;
        const isActive = ch.id === activeId;
        const isPinned = pinnedIds.includes(ch.id);
        const otherMember = ch.members?.find((m) => String(m.user_id || m.userId || m.id) !== String(currentUserId));
        const otherUserId = ch.otherUserId || ch.other_user_id || otherMember?.user_id || otherMember?.userId || otherMember?.id;
        const isUserOnline = ch.type === CHANNEL_TYPES.DIRECT && otherUserId && presence.isOnline
          ? presence.isOnline(otherUserId)
          : false;

        const displayName = getChannelDisplayName(ch, currentUserId, ch.members);

        return (
          <button
            key={ch.id}
            className={`chat-channel-item ${isActive ? 'chat-channel-item--active' : ''} ${unread > 0 ? 'chat-channel-item--unread' : ''}`}
            onClick={() => onSelect(ch.id)}
            title={displayName}
          >
            <span className="chat-channel-item__icon-wrapper">
              <span className={`chat-channel-icon-badge chat-channel-icon-badge--${ch.type?.toLowerCase()}`}>
                {getChannelIcon(ch.type)}
              </span>
              {ch.type === CHANNEL_TYPES.DIRECT && otherUserId && (
                <span
                  className={`chat-presence-dot chat-presence-dot--sidebar ${
                    isUserOnline ? 'chat-presence-dot--online' : 'chat-presence-dot--offline'
                  }`}
                  title={isUserOnline ? 'Online' : 'Offline'}
                />
              )}
            </span>
            <span className="chat-channel-item__name">{displayName}</span>
            {unread > 0 && (
              <span className="chat-channel-item__badge">{unread > 99 ? '99+' : unread}</span>
            )}
            {onTogglePin && (
              <span
                role="button"
                tabIndex={0}
                className={`chat-channel-item__pin-action ${isPinned ? 'chat-channel-item__pin-action--pinned' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onTogglePin(e, ch.id);
                }}
                title={isPinned ? 'Unpin from favorites' : 'Pin to favorites'}
                aria-label={isPinned ? 'Unpin from favorites' : 'Pin to favorites'}
              >
                <Pin size={12} />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
