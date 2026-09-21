import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { AlertCircle, MessageSquare, WifiOff, FileText, Download, Search, UserPlus, Shield, Trash2 } from 'lucide-react';
import { getAvatarColorIndex } from '../utils/chatHelpers';
import useAuth from '../../auth/hooks/useAuth';
import { useChat } from '../hooks/useChat';
import { useMessages } from '../hooks/useMessages';
import { usePresence } from '../hooks/usePresence';
import chatService from '../services/chatService';
import ChatSidebar from '../components/ChatSidebar';
import ChannelHeader from '../components/ChannelHeader';
import MessageList from '../components/MessageList';
import MessageComposer from '../components/MessageComposer';
import PinnedMessagesBar from '../components/PinnedMessagesBar';
import ChannelDetailsModal from '../components/ChannelDetailsModal';
import ChatSearchModal from '../components/ChatSearchModal';
import chatUnreadService from '../services/chatUnreadService';
import { ChannelHeaderSkeleton, MessageFeedSkeleton } from '../components/ChatSkeletons';
import '../styles/chat.css';

/**
 * Main chat page — full-screen layout with sidebar + message area,
 * real-time presence, rich messaging, pins, and channel management.
 * Route: /chat or /chat/:channelId
 */
export default function ChatPage() {
  const { user: currentUser } = useAuth();
  const presence = usePresence();
  const { channelId: channelIdParam } = useParams();
  const [searchParams] = useSearchParams();
  const targetChannelId = channelIdParam || searchParams.get('channelId') || null;

  const {
    channels,
    isLoadingChannels,
    activeChannelId,
    selectChannel,
    isConnected,
    connectionError,
    unreadCounts,
    createDm,
    onChannelCreated,
    updateChannel,
  } = useChat(targetChannelId);

  // If a specific channelId was requested via URL and isn't loaded in channel list yet, fetch it
  useEffect(() => {
    if (!targetChannelId) return;
    if (channels.length > 0 && !channels.some((c) => c.id === targetChannelId || String(c.id) === String(targetChannelId))) {
      chatService.getChannel(targetChannelId)
        .then((channel) => {
          if (channel?.id) {
            onChannelCreated(channel);
            selectChannel(channel.id);
          }
        })
        .catch(() => {});
    }
  }, [targetChannelId, channels, onChannelCreated, selectChannel]);

  const {
    messages,
    pinnedMessages,
    isLoading,
    hasMore,
    loadMore,
    sendMessage,
    editMessage,
    deleteMessage,
    toggleReaction,
    pinMessage,
    unpinMessage,
    replyTo,
    setReplyTo,
    typingUsers,
    handleTyping,
  } = useMessages(activeChannelId, currentUser);

  const [channelMembers, setChannelMembers] = useState([]);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeHeaderTab, setActiveHeaderTab] = useState('chat');
  const [memberSearchQuery, setMemberSearchQuery] = useState('');

  const activeChannel = channels.find((c) => c.id === activeChannelId);
  const isArchived = Boolean(activeChannel?.is_archived || activeChannel?.isArchived);

  // Global Ctrl+K / Ctrl+F keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'f')) {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Clear unread count for active channel immediately and on window focus/visibility
  useEffect(() => {
    if (!activeChannelId) return;
    chatUnreadService.clearChannel(activeChannelId);

    const handleFocus = () => {
      if (document.visibilityState === 'visible') {
        chatUnreadService.clearChannel(activeChannelId);
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, [activeChannelId]);

  // Load channel members when active channel changes
  useEffect(() => {
    setActiveHeaderTab('chat');
    setMemberSearchQuery('');
    if (!activeChannelId) {
      setChannelMembers([]);
      return;
    }

    chatService.getMembers(activeChannelId)
      .then((data) => {
        const list = Array.isArray(data) ? data : (data?.data ?? []);
        setChannelMembers(list);
      })
      .catch((err) => {
        console.warn('Could not load channel members:', err);
        setChannelMembers([]);
      });
  }, [activeChannelId]);

  // Aggregate files shared in current channel's messages
  const channelFiles = useMemo(() => {
    const list = [];
    if (!Array.isArray(messages)) return list;
    messages.forEach((msg) => {
      let atts = [];
      if (Array.isArray(msg?.attachments)) atts = msg.attachments;
      else if (typeof msg?.attachments === 'string') {
        try {
          const p = JSON.parse(msg.attachments);
          if (Array.isArray(p)) atts = p;
          else if (p && typeof p === 'object') atts = [p];
        } catch {}
      } else if (msg?.attachments && typeof msg?.attachments === 'object') {
        atts = [msg.attachments];
      }

      atts.forEach((att) => {
        if (!att) return;
        const name = typeof att === 'string'
          ? att.split('/').pop() || 'file'
          : (att.name || att.originalName || att.filename || 'file');
        const url = typeof att === 'string' ? att : att.url;
        const size = typeof att === 'object' ? att.size : null;
        const mime = typeof att === 'object' ? (att.mimeType || att.mimetype) : null;
        list.push({
          name,
          url,
          size,
          mime,
          senderName: msg.senderName || msg.sender_name || msg.senderEmail?.split('@')[0] || 'User',
          createdAt: msg.createdAt || msg.created_at,
          messageId: msg.id,
        });
      });
    });
    return list;
  }, [messages]);

  // Filter members by search input
  const filteredChannelMembers = useMemo(() => {
    if (!Array.isArray(channelMembers)) return [];
    if (!memberSearchQuery.trim()) return channelMembers;
    const q = memberSearchQuery.toLowerCase().trim();
    return channelMembers.filter((m) => {
      const name = (m.name || m.display_name || '').toLowerCase();
      const email = (m.email || '').toLowerCase();
      return name.includes(q) || email.includes(q);
    });
  }, [channelMembers, memberSearchQuery]);

  const isOwnerOrAdmin = Boolean(
    activeChannel?.creator_id === currentUser?.id ||
    currentUser?.role === 'ADMIN' ||
    currentUser?.roles?.includes('ADMIN') ||
    channelMembers.some(
      (m) => String(m.user_id || m.userId || m.id) === String(currentUser?.id) &&
        ['OWNER', 'ADMIN', 'owner', 'admin'].includes(m.role)
    )
  );

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Are you sure you want to remove this member?')) return;
    try {
      await chatService.removeMember(activeChannelId, userId);
      setChannelMembers((prev) => prev.filter((m) => String(m.user_id || m.userId || m.id) !== String(userId)));
    } catch (err) {
      console.error('Failed to remove member:', err);
      alert(err?.response?.data?.error || 'Failed to remove member');
    }
  };

  // Jump smoothly to pinned message
  const handleJumpToMessage = useCallback((messageId) => {
    setActiveHeaderTab('chat');
    setTimeout(() => {
      const el = document.getElementById(`chat-msg-${messageId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('chat-message--highlight');
        setTimeout(() => el.classList.remove('chat-message--highlight'), 2500);
      }
    }, 50);
  }, []);

  // Jump smoothly to search result message, switching channel if needed
  const handleJumpToSearchResult = useCallback(({ channelId, messageId }) => {
    setActiveHeaderTab('chat');
    if (channelId && channelId !== activeChannelId) {
      selectChannel(channelId);
    }
    // Allow DOM to settle if switching channels
    setTimeout(() => {
      const el = document.getElementById(`chat-msg-${messageId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('chat-message--target-highlight');
        setTimeout(() => el.classList.remove('chat-message--target-highlight'), 3000);
      }
    }, 300);
  }, [activeChannelId, selectChannel]);

  // When the chat backend is not available, show a friendly unavailable state
  if (connectionError && !isConnected && channels.length === 0) {
    return (
      <div className="chat-page">
        <div className="chat-layout">
          <div className="chat-main">
            <div className="chat-empty">
              <div className="chat-empty__icon-wrapper">
                <WifiOff className="chat-empty__icon" size={36} />
              </div>
              <h3 className="chat-empty__title">Chat Service Unavailable</h3>
              <p className="chat-empty__text">
                The real-time chat server is currently offline. This feature will be available once the chat service is started.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-page">
      {/* Connection status bar — only show when reconnecting (had previous connection) */}
      {!isConnected && channels.length > 0 && (
        <div className="chat-status-bar chat-status-bar--offline">
          <AlertCircle size={15} className="chat-status-icon" />
          <span>{connectionError ? 'Reconnecting to chat server...' : 'Connecting to chat server...'}</span>
        </div>
      )}

      <div className="chat-layout">
        {/* Sidebar with presence dots */}
        <ChatSidebar
          channels={channels}
          activeChannelId={activeChannelId}
          onSelectChannel={selectChannel}
          unreadCounts={unreadCounts}
          onCreateDm={createDm}
          onChannelCreated={onChannelCreated}
          presence={presence}
          isLoading={isLoadingChannels}
        />

        {/* Main area */}
        <div className="chat-main">
          {isLoadingChannels && !activeChannel ? (
            <div className="chat-main-skeleton">
              <ChannelHeaderSkeleton />
              <div className="chat-main-skeleton__feed">
                <MessageFeedSkeleton count={6} />
              </div>
            </div>
          ) : activeChannel ? (
            <>
              <ChannelHeader
                channel={activeChannel}
                presence={presence}
                memberCount={channelMembers.length}
                onOpenDetails={() => setIsDetailsOpen(true)}
                onOpenSearch={() => setIsSearchOpen(true)}
                currentUser={currentUser}
                members={channelMembers}
                activeTab={activeHeaderTab}
                onTabChange={setActiveHeaderTab}
              />

              {activeHeaderTab === 'files' ? (
                <div className="chat-channel-files-tab">
                  <div className="chat-channel-files-header">
                    <h4>Shared Files ({channelFiles.length})</h4>
                  </div>
                  {channelFiles.length === 0 ? (
                    <div className="chat-empty">
                      <p className="chat-empty__text">No files have been shared in this channel yet.</p>
                      <button
                        type="button"
                        className="chat-btn chat-btn--primary"
                        onClick={() => setActiveHeaderTab('chat')}
                      >
                        Back to Chat
                      </button>
                    </div>
                  ) : (
                    <div className="chat-channel-files-grid">
                      {channelFiles.map((file, idx) => {
                        const isImg = file.mime?.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file.name);
                        return (
                          <div key={idx} className="chat-channel-file-card">
                            <div className="chat-channel-file-card__icon">
                              {isImg && file.url ? (
                                <img src={file.url} alt={file.name} className="chat-channel-file-thumb" />
                              ) : (
                                <FileText size={24} />
                              )}
                            </div>
                            <div className="chat-channel-file-card__info">
                              <span className="chat-channel-file-name" title={file.name}>{file.name}</span>
                              <span className="chat-channel-file-meta">
                                Shared by {file.senderName}
                                {file.size ? ` • ${(file.size / 1024).toFixed(0)} KB` : ''}
                              </span>
                            </div>
                            {file.url && (
                              <a
                                href={file.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                download={file.name}
                                className="chat-channel-file-download"
                                title="Download file"
                              >
                                <Download size={18} />
                              </a>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : activeHeaderTab === 'members' && activeChannel.type !== 'DIRECT' ? (
                <div className="chat-channel-members-tab">
                  <div className="chat-channel-members-header">
                    <div className="chat-channel-members-header__title-row">
                      <h4>Channel Members ({filteredChannelMembers.length})</h4>
                      {isOwnerOrAdmin && activeChannel.type === 'GROUP' && (
                        <button
                          type="button"
                          className="chat-btn chat-btn--primary chat-btn--sm"
                          onClick={() => setIsDetailsOpen(true)}
                        >
                          <UserPlus size={15} />
                          <span>Add Member</span>
                        </button>
                      )}
                    </div>
                    <div className="chat-channel-members-search">
                      <Search size={15} className="chat-sidebar__search-icon" />
                      <input
                        type="text"
                        placeholder="Search members by name or email..."
                        value={memberSearchQuery}
                        onChange={(e) => setMemberSearchQuery(e.target.value)}
                        className="chat-channel-members-search__input"
                      />
                    </div>
                  </div>

                  {filteredChannelMembers.length === 0 ? (
                    <div className="chat-empty">
                      <p className="chat-empty__text">
                        {memberSearchQuery ? 'No members match your search.' : 'No members found in this channel.'}
                      </p>
                      {memberSearchQuery && (
                        <button
                          type="button"
                          className="chat-btn chat-btn--secondary chat-btn--sm"
                          onClick={() => setMemberSearchQuery('')}
                        >
                          Clear Search
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="chat-channel-members-grid">
                      {filteredChannelMembers.map((member) => {
                        const mid = member.user_id || member.userId || member.id;
                        const online = presence.isOnline ? presence.isOnline(mid) : false;
                        const name = member.name || member.display_name || member.email?.split('@')[0] || 'Member';
                        const isOwner = member.role === 'owner' || member.role === 'OWNER';
                        const isAdmin = member.role === 'admin' || member.role === 'ADMIN';
                        const isSelf = String(mid) === String(currentUser?.id);

                        return (
                          <div key={mid} className="chat-channel-member-card">
                            <div className="chat-channel-member-card__avatar-wrap">
                              <div className={`chat-message__avatar chat-avatar--gradient-${getAvatarColorIndex(mid || name)}`}>
                                {name[0]?.toUpperCase() || '?'}
                              </div>
                              <span
                                className={`chat-presence-dot ${
                                  online ? 'chat-presence-dot--online' : 'chat-presence-dot--offline'
                                }`}
                                title={online ? 'Online' : 'Offline'}
                              />
                            </div>
                            <div className="chat-channel-member-card__info">
                              <div className="chat-channel-member-name-row">
                                <span className="chat-channel-member-name" title={name}>{name}</span>
                                {isSelf && <span className="chat-self-badge">you</span>}
                                {isOwner && (
                                  <span className="chat-owner-badge" title="Owner">
                                    <Shield size={11} /> Owner
                                  </span>
                                )}
                                {isAdmin && !isOwner && (
                                  <span className="chat-owner-badge" title="Admin">
                                    Admin
                                  </span>
                                )}
                              </div>
                              {member.email && (
                                <span className="chat-channel-member-email" title={member.email}>
                                  {member.email}
                                </span>
                              )}
                              <span className="chat-channel-member-status">
                                {online ? 'Active now' : 'Offline'}
                              </span>
                            </div>

                            {isOwnerOrAdmin && !isOwner && !isSelf && activeChannel.type === 'GROUP' && (
                              <button
                                type="button"
                                className="chat-channel-member-remove-btn"
                                onClick={() => handleRemoveMember(mid)}
                                title="Remove member"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {/* Sticky pinned messages banner */}
                  <PinnedMessagesBar
                    pinnedMessages={pinnedMessages}
                    onJumpToMessage={handleJumpToMessage}
                    onUnpin={unpinMessage}
                    canUnpin={!isArchived}
                  />

                  {/* Message Feed with reactions and pins */}
                  <MessageList
                    messages={messages}
                    isLoading={isLoading}
                    hasMore={hasMore}
                    onLoadMore={loadMore}
                    onReply={setReplyTo}
                    onEdit={editMessage}
                    onDelete={deleteMessage}
                    onToggleReaction={toggleReaction}
                    onPin={pinMessage}
                    onUnpin={unpinMessage}
                    pinnedMessages={pinnedMessages}
                    typingUsers={typingUsers}
                    currentUser={currentUser}
                  />

                  {/* Composer with mention autocomplete and archived state */}
                  <MessageComposer
                    onSend={sendMessage}
                    onTyping={handleTyping}
                    replyTo={replyTo}
                    onCancelReply={() => setReplyTo(null)}
                    disabled={!isConnected}
                    isArchived={isArchived}
                    members={channelMembers}
                    channelMembers={channelMembers}
                    channel={activeChannel}
                    currentUser={currentUser}
                    messages={messages}
                  />
                </>
              )}

              {/* Channel Details & Roster Modal */}
              <ChannelDetailsModal
                isOpen={isDetailsOpen}
                onClose={() => setIsDetailsOpen(false)}
                channel={activeChannel}
                currentUser={currentUser}
                presence={presence}
                onChannelUpdated={(updated) => {
                  updateChannel(updated);
                  if (updated.name || updated.description) {
                    activeChannel.name = updated.name;
                    activeChannel.description = updated.description;
                  }
                }}
              />

              {/* Message & Conversation Search Modal */}
              <ChatSearchModal
                isOpen={isSearchOpen}
                onClose={() => setIsSearchOpen(false)}
                activeChannel={activeChannel}
                onSelectResult={handleJumpToSearchResult}
              />
            </>
          ) : (
            <div className="chat-empty">
              <div className="chat-empty__icon-wrapper">
                <MessageSquare className="chat-empty__icon" size={36} />
              </div>
              <h3 className="chat-empty__title">Welcome to Chat</h3>
              <p className="chat-empty__text">
                Select a channel from the sidebar or start a direct message to begin conversations.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
