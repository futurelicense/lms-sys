import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PageContainer from '../../../components/layout/PageContainer';
import Button from '../../../components/common/Button';
import ErrorState from '../../../components/common/ErrorState';
import NotificationList from '../components/NotificationList';
import notificationService from '../services/notificationService';
import { QUERY_KEYS } from '../../../constants/appConstants';

export const NotificationPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('all'); // 'all' | 'unread'

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: QUERY_KEYS.NOTIFICATIONS,
    queryFn: () => notificationService.list(),
  });

  const rawItems = useMemo(() => {
    return data?.items || data?.data?.items || (Array.isArray(data) ? data : []);
  }, [data]);

  const unreadCount = useMemo(() => {
    return rawItems.filter((n) => !n.isRead && !n.read && !n.readAt).length;
  }, [rawItems]);

  const filteredNotifications = useMemo(() => {
    if (filter === 'unread') {
      return rawItems.filter((n) => !n.isRead && !n.read && !n.readAt);
    }
    return rawItems;
  }, [rawItems, filter]);

  const markAllRead = useMutation({
    mutationFn: notificationService.markAllRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.NOTIFICATIONS }),
  });

  const markRead = useMutation({
    mutationFn: (notification) => notificationService.markRead(notification.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.NOTIFICATIONS }),
  });

  const handleSelect = (notification) => {
    const isUnread = !notification.isRead && !notification.read && !notification.readAt;
    if (isUnread) {
      markRead.mutate(notification);
    }
    if (notification.linkUrl) {
      navigate(notification.linkUrl);
    }
  };

  if (error) return <ErrorState error={error} onRetry={refetch} />;

  return (
    <PageContainer
      title="Notifications"
      subtitle={unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}` : 'All caught up!'}
      actions={
        <Button
          variant="secondary"
          onClick={() => markAllRead.mutate()}
          isLoading={markAllRead.isPending}
          disabled={unreadCount === 0}
        >
          Mark all read
        </Button>
      }
    >
      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          marginBottom: 16,
          borderBottom: '1px solid var(--border-color)',
          paddingBottom: 10,
        }}
      >
        <button
          type="button"
          onClick={() => setFilter('all')}
          style={{
            padding: '6px 14px',
            borderRadius: 6,
            border: 'none',
            fontSize: '0.875rem',
            fontWeight: 600,
            cursor: 'pointer',
            background: filter === 'all' ? 'var(--primary-color)' : 'transparent',
            color: filter === 'all' ? '#fff' : 'var(--text-secondary)',
            transition: 'all 0.15s ease',
          }}
        >
          All ({rawItems.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter('unread')}
          style={{
            padding: '6px 14px',
            borderRadius: 6,
            border: 'none',
            fontSize: '0.875rem',
            fontWeight: 600,
            cursor: 'pointer',
            background: filter === 'unread' ? 'var(--primary-color)' : 'transparent',
            color: filter === 'unread' ? '#fff' : 'var(--text-secondary)',
            transition: 'all 0.15s ease',
          }}
        >
          Unread ({unreadCount})
        </button>
      </div>

      <NotificationList
        notifications={filteredNotifications}
        isLoading={isLoading}
        onSelect={handleSelect}
      />
    </PageContainer>
  );
};

export default NotificationPage;
