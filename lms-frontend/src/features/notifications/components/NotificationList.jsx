import Notification from '../../../components/feedback/Notification';
import EmptyState from '../../../components/common/EmptyState';
import Skeleton from '../../../components/common/Skeleton';

export const NotificationList = ({ notifications = [], isLoading = false, onSelect }) => {
  if (isLoading) return <Skeleton height={64} count={4} />;
  if (notifications.length === 0) {
    return (
      <EmptyState title="You are all caught up" description="New notifications will appear here." />
    );
  }

  return (
    <div role="feed" aria-label="Notifications">
      {notifications.map((notification) => (
        <Notification key={notification.id} notification={notification} onSelect={onSelect} />
      ))}
    </div>
  );
};

export default NotificationList;
