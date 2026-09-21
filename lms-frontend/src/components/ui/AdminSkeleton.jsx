/**
 * Admin Dashboard Skeleton components.
 */

/**
 * Table skeleton — renders rows × cols skeleton cells.
 */
export const AdminTableSkeleton = ({ rows = 5, cols = 5 }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} style={{ display: 'flex', gap: 16 }}>
        {Array.from({ length: cols }).map((_, j) => (
          <div
            key={j}
            className="animate-pulse"
            style={{
              height: 40,
              flex: 1,
              borderRadius: 8,
              background: 'var(--surface-medium)',
              animationDelay: `${i * 100 + j * 50}ms`,
            }}
          />
        ))}
      </div>
    ))}
  </div>
);

/**
 * Card skeleton — renders a single card placeholder.
 */
export const AdminCardSkeleton = () => (
  <div
    style={{
      background: 'var(--surface-dark)',
      borderRadius: 8,
      padding: 24,
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
    }}
  >
    <div
      className="animate-pulse"
      style={{ height: 16, width: 96, borderRadius: 4, background: 'var(--surface-medium)' }}
    />
    <div
      className="animate-pulse"
      style={{ height: 32, width: 64, borderRadius: 4, background: 'var(--surface-medium)' }}
    />
    <div
      className="animate-pulse"
      style={{ height: 12, width: 128, borderRadius: 4, background: 'var(--surface-medium)' }}
    />
  </div>
);

export default AdminTableSkeleton;
