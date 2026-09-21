import { X } from 'lucide-react';
import '../../../config/appConfig';

/* ─── Monochrome Logo ──────────────────────────────────────── */
const Logo = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ color: 'var(--text-primary)' }}>
    <path
      d="M21.5034 4.14819L12.5034 9.14819C12.193 9.32074 11.807 9.32074 11.4966 9.14819L2.49658 4.14819C2.17937 3.97193 1.77665 4.16853 1.72758 4.53232L1.03784 9.64687C1.01258 9.83424 1.08272 10.0215 1.22271 10.1475L11.6669 19.5475C11.854 19.7159 12.146 19.7159 12.3331 19.5475L22.7773 10.1475C22.9173 10.0215 22.9874 9.83424 22.9622 9.64687L22.2724 4.53232C22.2234 4.16853 21.8206 3.97193 21.5034 4.14819Z"
      fill="currentColor"
    />
  </svg>
);

/**
 * Admin Sidebar — dark monochrome design.
 */
export const Sidebar = ({ isOpen = false, onClose, children, footer = null }) => (
  <>
    {/* Mobile overlay backdrop */}
    {isOpen && (
      <div
        className="fixed inset-0 z-30 backdrop-blur-sm lg:hidden"
        style={{ background: 'rgba(0,0,0,0.7)' }}
        onClick={onClose}
      />
    )}

    {/* Sidebar panel */}
    <aside
      className={[
        'fixed inset-y-0 left-0 z-40 flex w-64 flex-col',
        'transition-transform duration-300 ease-in-out',
        'lg:translate-x-0 lg:static lg:inset-auto',
        isOpen ? 'translate-x-0' : '-translate-x-full',
      ].join(' ')}
      style={{
        background: 'var(--surface-dark)',
        borderRight: '1px solid var(--border-color)',
      }}
    >
      {/* Brand / Logo */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '0 20px',
          height: 64,
          flexShrink: 0,
          borderBottom: '1px solid var(--border-color)',
        }}
      >
        <Logo />
        <span
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: 'var(--text-primary)',
            letterSpacing: '-0.5px',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          LMS
        </span>

        {/* Mobile close button */}
        <button
          onClick={onClose}
          style={{
            marginLeft: 'auto',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: 4,
            borderRadius: 6,
          }}
          aria-label="Close sidebar"
          className="lg:hidden"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto" style={{ padding: '8px 0' }} aria-label="Main">
        {children}
      </nav>

      {/* Footer slot (user card) */}
      {footer && (
        <div style={{ padding: '12px 12px', borderTop: '1px solid var(--border-color)' }}>
          {footer}
        </div>
      )}
    </aside>
  </>
);

export default Sidebar;
