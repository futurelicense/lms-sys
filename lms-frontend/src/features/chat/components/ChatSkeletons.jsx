/**
 * Rich skeleton loading components for the LMS Chat feature:
 * - SidebarSkeleton
 * - MessageFeedSkeleton
 * - ChannelHeaderSkeleton
 * - MemberRosterSkeleton
 * - UserListSkeleton
 */

export function SidebarSkeleton() {
  return (
    <div className="chat-sidebar-skeleton" aria-label="Loading channels">
      {[1, 2].map((groupId) => (
        <div key={groupId} className="chat-channel-group-skeleton">
          <div className="chat-skeleton chat-skeleton--label" />
          {[1, 2, 3].map((itemId) => (
            <div key={itemId} className="chat-channel-item-skeleton">
              <div className="chat-skeleton chat-skeleton--avatar" />
              <div
                className="chat-skeleton chat-skeleton--text"
                style={{ width: `${60 + ((groupId + itemId) % 3) * 15}%` }}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export function MessageFeedSkeleton({ count = 5 }) {
  const widths = ['75%', '45%', '90%', '60%', '35%'];
  return (
    <div className="chat-message-feed-skeleton" aria-label="Loading messages">
      {Array.from({ length: count }).map((_, index) => {
        const isAlternate = index % 3 === 1;
        return (
          <div
            key={index}
            className={`chat-message-skeleton ${isAlternate ? 'chat-message-skeleton--alt' : ''}`}
          >
            <div className="chat-skeleton chat-skeleton--msg-avatar" />
            <div className="chat-message-skeleton__content">
              <div className="chat-message-skeleton__header">
                <div className="chat-skeleton chat-skeleton--sender" />
                <div className="chat-skeleton chat-skeleton--time" />
              </div>
              <div
                className="chat-skeleton chat-skeleton--line"
                style={{ width: widths[index % widths.length] }}
              />
              {index % 2 === 0 && (
                <div
                  className="chat-skeleton chat-skeleton--line chat-skeleton--line-sub"
                  style={{ width: '40%' }}
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function ChannelHeaderSkeleton() {
  return (
    <div className="chat-channel-header-skeleton" aria-label="Loading channel info">
      <div className="chat-skeleton chat-skeleton--header-avatar" />
      <div className="chat-channel-header-skeleton__info">
        <div className="chat-skeleton chat-skeleton--header-name" />
        <div className="chat-skeleton chat-skeleton--header-desc" />
      </div>
    </div>
  );
}

export function MemberRosterSkeleton({ count = 4 }) {
  return (
    <div className="chat-roster-skeleton" aria-label="Loading members">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="chat-roster-item-skeleton">
          <div className="chat-skeleton chat-skeleton--roster-avatar" />
          <div className="chat-roster-item-skeleton__info">
            <div
              className="chat-skeleton chat-skeleton--roster-name"
              style={{ width: `${50 + (index % 3) * 15}%` }}
            />
            <div className="chat-skeleton chat-skeleton--roster-sub" style={{ width: '35%' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function UserListSkeleton({ count = 5 }) {
  return (
    <div className="chat-user-list-skeleton" aria-label="Loading users">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="chat-user-item-skeleton">
          <div className="chat-skeleton chat-skeleton--user-avatar" />
          <div className="chat-user-item-skeleton__info">
            <div
              className="chat-skeleton chat-skeleton--user-name"
              style={{ width: `${45 + (index % 3) * 20}%` }}
            />
            <div
              className="chat-skeleton chat-skeleton--user-email"
              style={{ width: `${60 + (index % 2) * 15}%` }}
            />
          </div>
          <div className="chat-skeleton chat-skeleton--user-btn" />
        </div>
      ))}
    </div>
  );
}
