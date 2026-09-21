import Card from '../../../components/common/Card';
import ProgressBar from '../../learning/components/ProgressBar';
import { formatNumber } from '../../../utils/formatUtils';

export const UsageCard = ({ label, used = 0, limit = 0 }) => (
  <Card title={label}>
    <ProgressBar value={limit > 0 ? (used / limit) * 100 : 0} label={`${label} usage`} />
    <p className="u-text-sm u-text-muted u-mt-2">
      {formatNumber(used)} of {limit > 0 ? formatNumber(limit) : 'unlimited'}
    </p>
  </Card>
);

export default UsageCard;
