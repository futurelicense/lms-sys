import { forwardRef } from 'react';

/**
 * Admin Dashboard Input — dark monochrome design.
 * Props: label, error, icon (ReactNode), hint, ...HTMLInputAttributes
 */
export const AdminInput = forwardRef(
  ({ label, error, icon, hint, style = {}, className = '', ...props }, ref) => (
    <div style={{ width: '100%' }}>
      {label && (
        <label
          style={{
            display: 'block',
            marginBottom: 6,
            fontSize: 13,
            fontWeight: 500,
            color: 'var(--text-secondary)',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          {label}
        </label>
      )}
      <div style={{ position: 'relative' }}>
        {icon && (
          <span
            style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              pointerEvents: 'none',
            }}
          >
            {icon}
          </span>
        )}
        <input
          ref={ref}
          className={className}
          style={{
            width: '100%',
            height: 38,
            padding: icon ? '0 12px 0 36px' : '0 12px',
            background: 'var(--input-bg)',
            border: error ? '1px solid rgba(239,68,68,0.6)' : '1px solid var(--border-color)',
            borderRadius: 8,
            fontSize: 14,
            color: 'var(--text-primary)',
            fontFamily: 'Inter, sans-serif',
            outline: 'none',
            transition: 'border-color 0.15s ease',
            boxSizing: 'border-box',
            ...style,
          }}
          onFocus={(e) => {
            e.target.style.borderColor = 'var(--text-secondary)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = error ? 'rgba(239,68,68,0.6)' : 'var(--border-color)';
          }}
          {...props}
        />
      </div>
      {error ? (
        <p style={{ margin: '4px 0 0', fontSize: 12, color: '#f87171' }}>{error}</p>
      ) : hint ? (
        <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>{hint}</p>
      ) : null}
    </div>
  ),
);

AdminInput.displayName = 'AdminInput';

export default AdminInput;
