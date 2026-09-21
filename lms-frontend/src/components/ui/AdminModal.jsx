import { X, AlertTriangle } from 'lucide-react';
import AdminButton from './AdminButton';

/**
 * Admin Dashboard Modal — Tailwind-based.
 * Props: open, onClose, title, description, children, footer, size ('sm'|'md'|'lg'|'xl')
 */
const sizeMap = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export const AdminModal = ({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  overflowVisible = false,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div
        className="absolute inset-0 backdrop-blur-sm"
        style={{ background: 'rgba(0,0,0,0.6)' }}
        onClick={onClose}
      />
      {/* Panel */}
      <div
        className={`relative w-full ${sizeMap[size] ?? sizeMap.md} max-h-[90vh] ${overflowVisible ? 'overflow-visible' : 'overflow-hidden'} rounded-2xl shadow-2xl animate-scale-in flex flex-col`}
        style={{ background: 'var(--surface-dark)', boxShadow: 'var(--shadow-dark)' }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 16,
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-color)',
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
              {title}
            </h2>
            {description && (
              <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--text-muted)' }}>
                {description}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              flexShrink: 0,
              borderRadius: 8,
              padding: 6,
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--hover-bg)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <X size={20} />
          </button>
        </div>
        {/* Body */}
        <div className={`flex-1 ${overflowVisible ? 'overflow-visible' : 'overflow-y-auto'} px-6 py-5`}>{children}</div>
        {/* Footer */}
        {footer && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: 12,
              padding: '16px 24px',
              borderTop: '1px solid var(--border-color)',
              background: 'var(--surface-medium)',
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Admin Dashboard Confirm Modal.
 * Props: open, onClose, onCancel, onConfirm, title, message, description, confirmLabel, variant ('primary'|'danger'), danger, loading
 */
export const AdminConfirmModal = ({
  open,
  onClose,
  onCancel,
  onConfirm,
  title = 'Are you sure?',
  message,
  description,
  confirmLabel = 'Confirm',
  variant = 'danger',
  danger = false,
  loading = false,
}) => {
  const handleClose = onClose || onCancel;
  const displayMessage = message || description;
  const isDestructive = danger || variant === 'danger';
  const resolvedVariant = isDestructive ? 'danger' : (variant || 'primary');

  return (
    <AdminModal
      open={open}
      onClose={handleClose}
      title={title}
      size="sm"
      footer={
        <>
          <AdminButton variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </AdminButton>
          <AdminButton variant={resolvedVariant} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </AdminButton>
        </>
      }
    >
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        {isDestructive && (
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.15)',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <AlertTriangle size={18} />
          </div>
        )}
        <p style={{ margin: 0, fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, flex: 1, whiteSpace: 'pre-line' }}>
          {displayMessage}
        </p>
      </div>
    </AdminModal>
  );
};

export default AdminModal;
