import { useState, useMemo } from 'react';
import { Menu, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import ThemeSlider from '../../common/ThemeSlider';
import notificationService from '../../../features/notifications/services/notificationService';
import { useNotificationSocket } from '../../../features/notifications/hooks/useNotificationSocket';
import NotificationDropdown from '../../../features/notifications/components/NotificationDropdown';
import { QUERY_KEYS } from '../../../constants/appConstants';
import { ROUTES } from '../../../constants/routes';

/**
 * Header / Topbar with system status, notification bell, theme toggle, and profile.
 */
export const Header = ({ title, onToggleSidebar, children }) => {
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { unreadCount: socketUnreadCount } = useNotificationSocket();

  const { data: notificationsData } = useQuery({
    queryKey: QUERY_KEYS.NOTIFICATIONS,
    queryFn: () => notificationService.list().catch(() => ({ items: [] })),
    staleTime: 60000,
  });

  const notifications = useMemo(() => {
    return (
      notificationsData?.items ||
      notificationsData?.data?.items ||
      (Array.isArray(notificationsData) ? notificationsData : [])
    );
  }, [notificationsData]);

  const queryUnreadCount = useMemo(() => {
    return notifications.filter((n) => !n.isRead && !n.read && !n.readAt).length;
  }, [notifications]);

  const unreadCount = socketUnreadCount > 0 ? socketUnreadCount : queryUnreadCount;

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        height: 64,
        padding: '0 24px',
        flexShrink: 0,
        background: 'var(--surface-dark)',
        borderBottom: '1px solid var(--border-color)',
        position: 'sticky',
        top: 0,
        zIndex: 20,
      }}
    >
      {/* Hamburger — mobile only */}
      <button
        type="button"
        onClick={onToggleSidebar}
        aria-label="Toggle navigation"
        style={{
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--text-secondary)',
          padding: 6,
          borderRadius: 6,
          display: 'flex',
          alignItems: 'center',
        }}
        className="lg:hidden"
      >
        <Menu size={20} />
      </button>

      {/* Page title */}
      {title && (
        <span
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: 'var(--text-primary)',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          {title}
        </span>
      )}

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* System online badge */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: 'var(--surface-medium)',
          border: '1px solid var(--border-color)',
          borderRadius: 20,
          padding: '4px 10px',
        }}
      >
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }} />
        <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>
          System Online
        </span>
      </div>

      {/* Notification Bell & Dropdown */}
      <div style={{ position: 'relative' }}>
        <button
          type="button"
          onClick={() => setIsDropdownOpen((prev) => !prev)}
          aria-expanded={isDropdownOpen}
          aria-haspopup="true"
          style={{
            position: 'relative',
            background: isDropdownOpen ? 'var(--surface-light)' : 'var(--surface-medium)',
            border: isDropdownOpen ? '1px solid var(--primary-color)' : '1px solid var(--border-color)',
            borderRadius: 8,
            padding: '7px 9px',
            cursor: 'pointer',
            color: isDropdownOpen ? 'var(--text-primary)' : 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s ease',
          }}
          title="Notifications"
          aria-label="Toggle notifications"
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: -4,
                right: -4,
                background: '#ef4444',
                color: '#fff',
                fontSize: 10,
                fontWeight: 700,
                borderRadius: 99,
                minWidth: 16,
                height: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 4px',
                border: '2px solid var(--surface-dark)',
              }}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        <NotificationDropdown
          isOpen={isDropdownOpen}
          onClose={() => setIsDropdownOpen(false)}
          notifications={notifications}
          unreadCount={unreadCount}
        />
      </div>

      {/* Theme toggle slider */}
      <ThemeSlider size="md" />

      {/* Right slot (avatar, etc.) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>{children}</div>
    </header>
  );
};

export default Header;
