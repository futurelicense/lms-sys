import { Info, Lock, Search } from 'lucide-react';
import { getChannelDisplayName, getChannelIcon } from '../utils/chatHelpers';
import { CHANNEL_TYPES } from '../constants/chatConstants';
import { ChannelHeaderSkeleton } from './ChatSkeletons';

/**
 * Channel header — displays channel name, type icon, presence/member info,
 * archived status, search trigger, and details modal trigger.
 */
export default function ChannelHeader({
  channel,
  onOpenDetails,
  onOpenSearch,
  presence = {},
  memberCount = 0,
  isLoading = false,
  currentUser = null,
  members = [],
  activeTab = 'chat',
  onTabChange,
}) {
  if (isLoading) return <ChannelHeaderSkeleton />;
  if (!channel) return null;

  const isDirect = channel.type === CHANNEL_TYPES.DIRECT;
  const isArchived = Boolean(channel.is_archived || channel.isArchived);
  const { isOnline, formatPresence } = presence;

  const currentUserId = currentUser?.id;
  const displayName = getChannelDisplayName(channel, currentUserId, members);

  // For direct message, find the recipient's id
  const otherMember = isDirect
    ? members.find((m) => String(m.user_id || m.userId || m.id) !== String(currentUserId))
    : null;
  const otherUserId = channel.otherUserId || channel.other_user_id || otherMember?.user_id || otherMember?.id;
  const isOtherOnline = isDirect && otherUserId && isOnline ? isOnline(otherUserId) : false;
  const presenceSubtitle = isDirect && otherUserId && formatPresence ? formatPresence(otherUserId) : null;

  return (
    <header className="chat-channel-header">
      <div className="chat-channel-header__top">
        <div className="chat-channel-header__info">
          <div className="chat-channel-header__avatar-wrapper">
            <span className={`chat-channel-icon-badge chat-channel-icon-badge--header chat-channel-icon-badge--${channel.type?.toLowerCase()}`}>
              {getChannelIcon(channel.type)}
            </span>
            {isDirect && otherUserId && (
              <span
                className={`chat-presence-dot chat-presence-dot--header ${
                  isOtherOnline ? 'chat-presence-dot--online' : 'chat-presence-dot--offline'
                }`}
                title={isOtherOnline ? 'Online' : 'Offline'}
              />
            )}
          </div>

          <div>
            <div className="chat-channel-header__name-row">
              <h3 className="chat-channel-header__name">{displayName}</h3>
              {isArchived && (
                <span className="chat-archived-badge" title="This channel is archived and read-only">
                  <Lock size={12} />
                  <span>Archived</span>
                </span>
              )}
            </div>

            <div className="chat-channel-header__meta">
              {isDirect ? (
                presenceSubtitle && (
                  <span className={`chat-channel-header__presence ${isOtherOnline ? 'chat-channel-header__presence--online' : ''}`}>
                    {presenceSubtitle}
                  </span>
                )
              ) : (
                channel.description ? (
                  <p className="chat-channel-header__desc">{channel.description}</p>
                ) : memberCount > 0 ? (
                  <span className="chat-channel-header__member-count">{memberCount} members</span>
                ) : null
              )}
            </div>
          </div>
        </div>

        <div className="chat-channel-header__actions">
          <span className="chat-channel-header__type-badge">{channel.type}</span>
          {onOpenSearch && (
            <button
              className="chat-channel-header__action-btn"
              onClick={onOpenSearch}
              title="Search messages (Ctrl+K)"
              aria-label="Search messages"
            >
              <Search size={18} />
            </button>
          )}
          {!isDirect && onOpenDetails && (
            <button
              className="chat-channel-header__action-btn"
              onClick={onOpenDetails}
              title="Channel Details"
              aria-label="Channel Details"
            >
              <Info size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="chat-channel-header__tabs">
        <button
          type="button"
          className={`chat-header-tab ${activeTab === 'chat' ? 'chat-header-tab--active' : ''}`}
          onClick={() => onTabChange?.('chat')}
        >
          Chat
        </button>
        <button
          type="button"
          className={`chat-header-tab ${activeTab === 'files' ? 'chat-header-tab--active' : ''}`}
          onClick={() => onTabChange?.('files')}
          title="View channel files"
        >
          Files
        </button>
        {!isDirect && (
          <button
            type="button"
            className={`chat-header-tab ${activeTab === 'members' ? 'chat-header-tab--active' : ''}`}
            onClick={() => onTabChange?.('members')}
            title="View channel members"
          >
            Members
          </button>
        )}
      </div>
    </header>
  );
}
