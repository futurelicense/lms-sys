import { useEffect, useState } from 'react';
import { Link, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Building2,
  Cpu,
  LayoutDashboard,
  LogOut,
  Megaphone,
  ScrollText,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';
import { ROUTES } from '../../../constants/routes';
import platformAuthStorage from '../services/platformAuthStorage';
import { isPlatformHostname } from '../../../utils/tenantHostname';
import ThemeSlider from '../../../components/common/ThemeSlider';

const NAV_ITEMS = [
  { label: 'Dashboard', path: ROUTES.PLATFORM_DASHBOARD, icon: LayoutDashboard },
  { label: 'Workspaces', path: ROUTES.PLATFORM_TENANTS, icon: Building2 },
  { label: 'Audit Trail', path: ROUTES.PLATFORM_AUDIT_LOGS, icon: ScrollText },
  { label: 'Announcements', path: ROUTES.PLATFORM_ANNOUNCEMENTS, icon: Megaphone },
];

export const PlatformLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [hasToken, setHasToken] = useState(() => Boolean(platformAuthStorage.getToken()));

  useEffect(() => {
    const syncPlatformSession = (event) => {
      if (platformAuthStorage.isPlatformTokenChange(event)) {
        setHasToken(Boolean(event.newValue));
      }
    };
    window.addEventListener('storage', syncPlatformSession);
    return () => window.removeEventListener('storage', syncPlatformSession);
  }, []);

  if (!hasToken || !isPlatformHostname()) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  const handleSignOut = () => {
    platformAuthStorage.clear();
    navigate(ROUTES.LOGIN, { replace: true });
  };

  const currentTitle =
    NAV_ITEMS.find((item) => item.path === location.pathname)?.label || 'Platform Console';

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        overflow: 'hidden',
        background: 'var(--background)',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      {/* ── Fixed Sidebar ── */}
      <aside
        style={{
          width: 260,
          background: 'var(--surface-dark)',
          borderRight: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <div>
          {/* Brand / Logo */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '0 20px',
              height: 64,
              borderBottom: '1px solid var(--border-color)',
            }}
          >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                background: 'var(--surface-medium)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-primary)',
              }}
            >
              <ShieldCheck size={20} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: 'var(--text-muted)',
                  }}
                >
                  Platform
                </span>
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: '#4ade80',
                  }}
                />
              </div>
              <h2
                style={{
                  margin: 0,
                  fontSize: 14,
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.3px',
                }}
              >
                Control Plane
              </h2>
            </div>
          </div>

          {/* Navigation Items */}
          <nav style={{ padding: '16px 10px', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ padding: '4px 10px 8px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
              Core Services
            </div>
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive =
                location.pathname === item.path ||
                (item.path === ROUTES.PLATFORM_DASHBOARD && location.pathname === '/platform');
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 12px',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: isActive ? 600 : 500,
                    textDecoration: 'none',
                    transition: 'all 0.15s ease',
                    background: isActive ? 'var(--surface-medium)' : 'transparent',
                    color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                    border: isActive ? '1px solid var(--border-color)' : '1px solid transparent',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'var(--hover-bg)';
                      e.currentTarget.style.color = 'var(--text-primary)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = 'var(--text-secondary)';
                    }
                  }}
                >
                  <Icon
                    size={16}
                    style={{
                      color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                      flexShrink: 0,
                    }}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer User Profile & Actions */}
        <div style={{ padding: 14, borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 10px',
              borderRadius: 8,
              background: 'var(--surface-medium)',
              border: '1px solid var(--border-color)',
            }}
          >
            <div style={{ minWidth: 0, flex: 1 }}>
              <p
                style={{
                  margin: 0,
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                Global Administrator
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: 11,
                  color: 'var(--text-muted)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                PlatformAdmin@lms.local
              </p>
            </div>
            <button
              onClick={handleSignOut}
              title="Sign out of control plane"
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                padding: 4,
                borderRadius: 6,
                display: 'flex',
                alignItems: 'center',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#f87171')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main Layout Column ── */}
      <div style={{ display: 'flex', flex: 1, flexDirection: 'column', overflow: 'hidden', background: 'var(--background)' }}>
        {/* Sticky Header Topbar */}
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: 64,
            padding: '0 28px',
            flexShrink: 0,
            background: 'var(--surface-dark)',
            borderBottom: '1px solid var(--border-color)',
            position: 'sticky',
            top: 0,
            zIndex: 20,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: 'var(--text-primary)',
              }}
            >
              {currentTitle}
            </span>
            <span
              style={{
                fontSize: 11,
                padding: '2px 8px',
                borderRadius: 12,
                background: 'var(--surface-medium)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-muted)',
                fontWeight: 600,
              }}
            >
              Control Plane
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <ThemeSlider size="sm" />
          </div>
        </header>

        {/* Scrollable Main View Area */}
        <main style={{ flex: 1, overflowY: 'auto', padding: 28, position: 'relative' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default PlatformLayout;
