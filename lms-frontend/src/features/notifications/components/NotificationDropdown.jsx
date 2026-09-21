import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Bell,
  MessageSquare,
  AtSign,
  Hash,
  BookOpen,
  Award,
  CheckCheck,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import notificationService from '../services/notificationService';
import { QUERY_KEYS } from '../../../constants/appConstants';
import { ROUTES } from '../../../constants/routes';
import { formatRelative } from '../../../utils/dateUtils';

function getNotificationIcon(type) {
  switch (type) {
    case 'CHAT_DM':
      return <MessageSquare size={15} style={{ color: '#6366f1' }} />;
    case 'CHAT_MENTION':
      return <AtSign size={15} style={{ color: '#8b5cf6' }} />;
    case 'CHAT_CHANNEL':
    case 'CHAT_MESSAGE':
      return <Hash size={15} style={{ color: '#06b6d4' }} />;
    case 'COURSE_PUBLISHED':
    case 'COURSE_UPDATED':
    case 'COURSE_ANNOUNCEMENT':
      return <BookOpen size={15} style={{ color: '#10b981' }} />;
    case 'ASSESSMENT_ASSIGNED':
    case 'ASSESSMENT_DUE':
      return <Award size={15} style={{ color: '#f59e0b' }} />;
    default:
      return <Bell size={15} style={{ color: '#38bdf8' }} />;
  }
}

export default function NotificationDropdown({
  isOpen,
  onClose,
  notifications = [],
  unreadCount = 0,
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const dropdownRef = useRef(null);
  const [filter, setFilter] = useState('all'); // 'all' | 'unread'

  const markReadMutation = useMutation({
    mutationFn: (id) => notificationService.markRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.NOTIFICATIONS }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationService.markAllRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.NOTIFICATIONS }),
  });

  // Handle click outside & Escape key
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose();
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredItems = notifications.filter((item) => {
    const isUnread = !item.isRead && !item.read && !item.readAt;
    return filter === 'all' || isUnread;
  });

  const handleItemClick = (item) => {
    const isUnread = !item.isRead && !item.read && !item.readAt;
    if (isUnread) {
      markReadMutation.mutate(item.id);
    }
    onClose();
    if (item.linkUrl) {
      navigate(item.linkUrl);
    }
  };

  return (
    <div
      ref={dropdownRef}
      role="dialog"
      aria-label="Notifications"
      style={{
        position: 'absolute',
        top: 'calc(100% + 8px)',
        right: 0,
        width: 380,
        maxWidth: '92vw',
        background: '#101524',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 14,
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.05)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        animation: 'fadeInScale 0.15s ease-out',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 16px 10px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.07)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#ffffff' }}>
            Notifications
          </span>
          {unreadCount > 0 && (
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                background: '#4f46e5',
                color: '#ffffff',
                padding: '2px 8px',
                borderRadius: 999,
              }}
            >
              {unreadCount}
            </span>
          )}
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#818cf8',
              fontSize: '0.78rem',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '4px 6px',
              borderRadius: 4,
            }}
          >
            <CheckCheck size={14} />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: 6,
          padding: '8px 16px',
          background: 'rgba(255, 255, 255, 0.02)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        }}
      >
        <button
          type="button"
          onClick={() => setFilter('all')}
          style={{
            background: filter === 'all' ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
            border: 'none',
            borderRadius: 6,
            padding: '4px 10px',
            fontSize: '0.78rem',
            fontWeight: filter === 'all' ? 600 : 500,
            color: filter === 'all' ? '#ffffff' : '#94a3b8',
            cursor: 'pointer',
          }}
        >
          All
        </button>
        <button
          type="button"
          onClick={() => setFilter('unread')}
          style={{
            background: filter === 'unread' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
            border: 'none',
            borderRadius: 6,
            padding: '4px 10px',
            fontSize: '0.78rem',
            fontWeight: filter === 'unread' ? 600 : 500,
            color: filter === 'unread' ? '#a5b4fc' : '#94a3b8',
            cursor: 'pointer',
          }}
        >
          Unread {unreadCount > 0 ? `(${unreadCount})` : ''}
        </button>
      </div>

      {/* Notification List */}
      <div
        style={{
          maxHeight: 340,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {filteredItems.length === 0 ? (
          <div
            style={{
              padding: '36px 20px',
              textAlign: 'center',
              color: '#64748b',
              fontSize: '0.84rem',
            }}
          >
            <Bell size={28} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
            <p style={{ margin: 0, fontWeight: 500, color: '#94a3b8' }}>No notifications found</p>
            <span style={{ fontSize: '0.76rem' }}>You're all caught up!</span>
          </div>
        ) : (
          filteredItems.map((item) => {
            const isUnread = !item.isRead && !item.read && !item.readAt;
            const relativeTime = item.createdAt ? formatRelative(item.createdAt) : '';

            return (
              <div
                key={item.id}
                onClick={() => handleItemClick(item)}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                  padding: '12px 16px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                  background: isUnread ? 'rgba(99, 102, 241, 0.06)' : 'transparent',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = isUnread
                    ? 'rgba(99, 102, 241, 0.12)'
                    : 'rgba(255, 255, 255, 0.04)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = isUnread
                    ? 'rgba(99, 102, 241, 0.06)'
                    : 'transparent';
                }}
              >
                {/* Icon avatar */}
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: 2,
                  }}
                >
                  {getNotificationIcon(item.type)}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 8,
                      marginBottom: 2,
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.84rem',
                        fontWeight: isUnread ? 700 : 500,
                        color: isUnread ? '#ffffff' : '#cbd5e1',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {item.type === 'CHAT_DM' && item.data?.senderName
                        ? item.data.senderName
                        : item.title}
                    </span>
                    {relativeTime && (
                      <span style={{ fontSize: '0.7rem', color: '#64748b', flexShrink: 0 }}>
                        {relativeTime}
                      </span>
                    )}
                  </div>

                  <p
                    style={{
                      fontSize: '0.78rem',
                      color: '#94a3b8',
                      margin: 0,
                      lineHeight: 1.4,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {item.message || item.body || ''}
                  </p>
                </div>

                {/* Unread indicator dot */}
                {isUnread && (
                  <div
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      background: '#6366f1',
                      marginTop: 6,
                      flexShrink: 0,
                    }}
                  />
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '10px 16px',
          borderTop: '1px solid rgba(255, 255, 255, 0.07)',
          background: 'rgba(255, 255, 255, 0.02)',
        }}
      >
        <button
          type="button"
          onClick={() => {
            onClose();
            navigate(ROUTES.NOTIFICATIONS);
          }}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#a5b4fc',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <span>View all in Notifications</span>
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
