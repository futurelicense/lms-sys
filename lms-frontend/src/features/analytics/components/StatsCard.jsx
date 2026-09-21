import Card from '../../../components/common/Card';
import Skeleton from '../../../components/common/Skeleton';
import { formatNumber } from '../../../utils/formatUtils';

export const StatsCard = ({ label, value, delta, isLoading = false, formatter = formatNumber }) => (
  <Card>
    <p className="u-text-sm u-text-muted">{label}</p>
    {isLoading ? (
      <Skeleton height={28} width={90} />
    ) : (
      <p style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-semibold)' }}>
        {formatter(value)}
      </p>
    )}
    {typeof delta === 'number' && (
      <p
        className="u-text-sm"
        style={{ color: delta >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}
      >
        {delta >= 0 ? '+' : ''}
        {delta}% vs last period
      </p>
    )}
  </Card>
);

export default StatsCard;
