import { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, User } from 'lucide-react';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import Avatar from '../components/common/Avatar';
import useAuth from '../features/auth/hooks/useAuth';
import { ThemeProvider } from '../context/ThemeContext';
import { ROUTES } from '../constants/routes';
import RouteErrorBoundary from '../components/common/RouteErrorBoundary';
import ImpersonationBanner from '../features/platform/components/ImpersonationBanner';
import BroadcastBanner from '../features/platform/components/BroadcastBanner';
import TeamsNotificationHost from '../features/notifications/components/TeamsNotificationToast';
import chatSocketService from '../features/chat/services/chatSocketService';
import chatUnreadService from '../features/chat/services/chatUnreadService';

/**
 * Shared chrome for every authenticated area.
 * Role layouts differ only by the navigation they inject.
 *
 * Layout: fixed sidebar (w-64 desktop) + flex column main (header / scrollable content / footer)
 */
export const AppShell = ({ navigation, title }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Maintain active chat socket connection globally for real-time presence across all authenticated pages
  useEffect(() => {
    if (user) {
      chatSocketService.connect();
    }
  }, [user]);

  // Manage Browser Tab Unread Count: Show (3) LMS in document.title when there are unread messages
  useEffect(() => {
    if (!user) {
      document.title = 'LMS';
      return;
    }

    const userId = user.id || user.userId || user.sub;
    chatUnreadService.init(userId);

    const unsub = chatUnreadService.subscribe((totalUnread) => {
      if (totalUnread > 0) {
        document.title = `(${totalUnread}) LMS`;
      } else {
        document.title = 'LMS';
      }
    });

    return () => {
      unsub();
    };
  }, [user]);

  const handleSignOut = async () => {
    chatSocketService.disconnect();
    chatUnreadService.reset();
    document.title = 'LMS';
    await logout();
    navigate(ROUTES.LOGIN, { replace: true, state: {} });
  };

  // Theme is handled globally by ThemeContext and main.jsx

  const userCard = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 10px', borderRadius: 8,
        background: 'var(--surface-medium)',
        border: '1px solid var(--border-color)',
      }}>
        <Avatar name={user?.fullName ?? user?.email ?? ''} src={user?.avatarUrl} size="sm" />
        <div style={{ minWidth: 0, flex: 1 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.fullName ?? user?.email}
          </p>
          <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</p>
        </div>
        <button
          onClick={handleSignOut}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4, borderRadius: 6, display: 'flex', alignItems: 'center' }}
          title="Sign out"
          aria-label="Sign out"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </div>
  );

  return (
    <ThemeProvider>
      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg)' }}>
        {/* Sidebar — fixed on desktop, slides in on mobile */}
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setSidebarOpen(false)}
          footer={userCard}
        >
          {navigation}
        </Sidebar>

        {/* Main content column */}
        <div style={{ display: 'flex', flex: 1, flexDirection: 'column', overflow: 'hidden', background: 'var(--bg)' }}>
          <ImpersonationBanner />
          <BroadcastBanner />
          <Header
            title={title}
            onToggleSidebar={() => setSidebarOpen((open) => !open)}
          >
            <Link to={ROUTES.PROFILE} style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: 'var(--text-primary)' }} title="Account & Profile">
              <Avatar name={user?.fullName ?? user?.email ?? ''} src={user?.avatarUrl} size="sm" />
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>Profile</span>
            </Link>
          </Header>

          <main style={{ flex: 1, overflowY: 'auto', padding: '24px', position: 'relative', background: 'var(--bg)' }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
              >
                <RouteErrorBoundary>
                  <Outlet />
                </RouteErrorBoundary>
              </motion.div>
            </AnimatePresence>
          </main>

          <Footer />
        </div>
      </div>
      <TeamsNotificationHost />
    </ThemeProvider>
  );
};

export default AppShell;
