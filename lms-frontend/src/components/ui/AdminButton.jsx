import { Loader2 } from 'lucide-react';

/**
 * Admin Dashboard Button — dark monochrome design.
 * @param {'primary'|'secondary'|'outline'|'ghost'|'danger'|'success'} variant
 * @param {'sm'|'md'|'lg'} size
 */
const variantStyles = {
  // Primary: white bg, black text — high contrast CTA
  primary: {
    background: '#ffffff',
    color: '#000000',
    border: '1px solid #ffffff',
  },
  // Secondary: dark surface, white text, subtle border
  secondary: {
    background: 'var(--surface-medium)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-color)',
  },
  // Outline: transparent, white text, subtle border
  outline: {
    background: 'transparent',
    color: 'var(--text-secondary)',
    border: '1px solid var(--border-color)',
  },
  // Ghost: transparent, no border
  ghost: {
    background: 'transparent',
    color: 'var(--text-secondary)',
    border: '1px solid transparent',
  },
  // Danger: muted red
  danger: {
    background: 'rgba(239,68,68,0.12)',
    color: '#f87171',
    border: '1px solid rgba(239,68,68,0.3)',
  },
  // Success: muted green
  success: {
    background: 'rgba(34,197,94,0.12)',
    color: '#4ade80',
    border: '1px solid rgba(34,197,94,0.3)',
  },
};

const sizeStyles = {
  sm: { height: 32, padding: '0 12px', fontSize: 12, gap: 6 },
  md: { height: 38, padding: '0 16px', fontSize: 14, gap: 8 },
  lg: { height: 44, padding: '0 22px', fontSize: 15, gap: 10 },
};

export const AdminButton = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  children,
  style = {},
  disabled,
  type = 'button',
  ...props
}) => {
  const vs = variantStyles[variant] ?? variantStyles.primary;
  const ss = sizeStyles[size] ?? sizeStyles.md;

  return (
    <button
      type={type}
      disabled={disabled || loading}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 8,
        fontWeight: 600,
        fontFamily: 'Inter, sans-serif',
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled || loading ? 0.5 : 1,
        transition: 'opacity 0.15s ease, background 0.15s ease',
        whiteSpace: 'nowrap',
        ...vs,
        ...ss,
        ...style,
      }}
      onMouseEnter={(e) => {
        if (!disabled && !loading) e.currentTarget.style.opacity = '0.85';
      }}
      onMouseLeave={(e) => {
        if (!disabled && !loading) e.currentTarget.style.opacity = '1';
      }}
      {...props}
    >
      {loading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : icon}
      {children}
    </button>
  );
};

export default AdminButton;
