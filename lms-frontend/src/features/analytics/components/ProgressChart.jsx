import Card from '../../../components/common/Card';
import EmptyState from '../../../components/common/EmptyState';

/**
 * Lightweight inline bar chart - no charting dependency yet.
 * Swap the body for Recharts/visx when the design calls for richer charts.
 */
export const ProgressChart = ({ title = 'Progress', data = [] }) => {
  const max = Math.max(1, ...data.map((point) => point.value));

  return (
    <Card title={title}>
      {data.length === 0 ? (
        <EmptyState title="No data yet" />
      ) : (
        <div className="u-flex u-gap-2" style={{ alignItems: 'flex-end', height: 160 }}>
          {data.map((point) => (
            <div key={point.label} className="u-flex-col u-items-center u-grow u-gap-1">
              <div
                title={`${point.label}: ${point.value}`}
                style={{
                  width: '100%',
                  height: `${(point.value / max) * 130}px`,
                  background: 'var(--color-primary-500)',
                  borderRadius: 'var(--radius-sm)',
                }}
              />
              <span className="u-text-sm u-text-muted u-truncate">{point.label}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

export default ProgressChart;
