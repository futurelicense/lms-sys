/**
 * Admin Dashboard Badge — dark monochrome design.
 * @param {'default'|'success'|'warning'|'danger'|'info'|'neutral'} variant
 * @param {boolean} dot  — show a colored dot before the label
 *
 * Semantic colors are muted (low saturation) so they don't break the dark aesthetic.
 */
const variantStyles = {
  default: {
    background: 'rgba(255,255,255,0.08)',
    color: '#c8c8c8',
    border: '1px solid rgba(255,255,255,0.12)',
  },
  success: {
    background: 'rgba(34,197,94,0.12)',
    color: '#4ade80',
    border: '1px solid rgba(34,197,94,0.25)',
  },
  warning: {
    background: 'rgba(234,179,8,0.12)',
    color: '#facc15',
    border: '1px solid rgba(234,179,8,0.25)',
  },
  danger: {
    background: 'rgba(239,68,68,0.12)',
    color: '#f87171',
    border: '1px solid rgba(239,68,68,0.25)',
  },
  info: {
    background: 'rgba(56,189,248,0.12)',
    color: '#67e8f9',
    border: '1px solid rgba(56,189,248,0.25)',
  },
  neutral: {
    background: 'var(--surface-medium)',
    color: 'var(--text-muted)',
    border: '1px solid var(--border-color)',
  },
};

const dotColors = {
  default: '#a8a8a8',
  success: '#4ade80',
  warning: '#facc15',
  danger: '#f87171',
  info: '#67e8f9',
  neutral: '#6b6b6b',
};

export const AdminBadge = ({
  variant = 'default',
  children,
  style = {},
  className = '',
  dot = false,
}) => {
  const vs = variantStyles[variant] ?? variantStyles.default;

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        borderRadius: 20,
        padding: '2px 10px',
        fontSize: 11,
        fontWeight: 600,
        fontFamily: 'Inter, sans-serif',
        whiteSpace: 'nowrap',
        letterSpacing: '0.2px',
        ...vs,
        ...style,
      }}
    >
      {dot && (
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            flexShrink: 0,
            background: dotColors[variant] ?? dotColors.default,
          }}
        />
      )}
      {children}
    </span>
  );
};

export default AdminBadge;
