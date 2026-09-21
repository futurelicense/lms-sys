import { ChevronLeft, ChevronRight } from 'lucide-react';
import AdminButton from './AdminButton';

/**
 * Admin Dashboard Pagination.
 * Props: page (0-based), totalPages, totalElements, size, onPageChange
 */
export const AdminPagination = ({ page, totalPages, totalElements, size, onPageChange }) => {
  if (totalPages <= 1) return null;

  const startItem = page * size + 1;
  const endItem = Math.min((page + 1) * size, totalElements);

  // Show up to 7 page buttons
  const maxVisible = 7;
  let pageNumbers = [];
  if (totalPages <= maxVisible) {
    pageNumbers = Array.from({ length: totalPages }, (_, i) => i);
  } else if (page < 4) {
    pageNumbers = [0, 1, 2, 3, 4, '...', totalPages - 1];
  } else if (page >= totalPages - 4) {
    pageNumbers = [
      0,
      '...',
      totalPages - 5,
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
    ];
  } else {
    pageNumbers = [0, '...', page - 1, page, page + 1, '...', totalPages - 1];
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        padding: '0 4px',
      }}
    >
      <p style={{ margin: 0, fontSize: 14, color: 'var(--text-muted)' }}>
        Showing <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{startItem}</span>–
        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{endItem}</span> of{' '}
        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{totalElements}</span>
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <AdminButton
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 0}
          icon={<ChevronLeft size={16} />}
        >
          Prev
        </AdminButton>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {pageNumbers.map((n, i) =>
            n === '...' ? (
              <span
                key={`ellipsis-${i}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 24,
                  height: 32,
                  fontSize: 14,
                  color: 'var(--text-muted)',
                }}
              >
                …
              </span>
            ) : (
              <button
                key={n}
                onClick={() => onPageChange(n)}
                style={{
                  height: 32,
                  minWidth: 32,
                  borderRadius: 8,
                  padding: '0 8px',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  border: 'none',
                  background: n === page ? 'var(--text-primary)' : 'transparent',
                  color: n === page ? 'var(--surface-dark)' : 'var(--text-secondary)',
                }}
                onMouseEnter={(e) => {
                  if (n !== page) e.currentTarget.style.background = 'var(--hover-bg)';
                }}
                onMouseLeave={(e) => {
                  if (n !== page) e.currentTarget.style.background = 'transparent';
                }}
              >
                {n + 1}
              </button>
            ),
          )}
        </div>
        <AdminButton
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages - 1}
        >
          Next
          <ChevronRight size={16} />
        </AdminButton>
      </div>
    </div>
  );
};

/**
 * Admin Dashboard EmptyState.
 * Props: icon, title, message, action
 */
export const AdminEmptyState = ({ icon, title, message, action }) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '64px 16px',
      textAlign: 'center',
    }}
  >
    <div
      style={{
        marginBottom: 16,
        display: 'flex',
        width: 56,
        height: 56,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 16,
        background: 'var(--surface-medium)',
        color: 'var(--text-muted)',
      }}
    >
      {icon}
    </div>
    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>
      {title}
    </h3>
    <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--text-muted)', maxWidth: 320 }}>
      {message}
    </p>
    {action && <div style={{ marginTop: 24 }}>{action}</div>}
  </div>
);

/**
 * Admin Dashboard ErrorState.
 * Props: message, onRetry
 */
export const AdminErrorState = ({ message, onRetry }) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '64px 16px',
      textAlign: 'center',
    }}
  >
    <div
      style={{
        marginBottom: 16,
        display: 'flex',
        width: 56,
        height: 56,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 16,
        background: 'rgba(239,68,68,0.1)',
        color: '#f87171',
      }}
    >
      <svg
        style={{ width: 28, height: 28 }}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
        />
      </svg>
    </div>
    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>
      Something went wrong
    </h3>
    <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--text-muted)', maxWidth: 320 }}>
      {message}
    </p>
    {onRetry && (
      <div style={{ marginTop: 24 }}>
        <AdminButton variant="outline" size="sm" onClick={onRetry}>
          Try again
        </AdminButton>
      </div>
    )}
  </div>
);

export default AdminPagination;
