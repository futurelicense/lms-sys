import Card from '../../../components/common/Card';
import Badge from '../../../components/common/Badge';
import Button from '../../../components/common/Button';
import { formatCurrency } from '../../../utils/formatUtils';

export const PlanCard = ({ plan, isCurrent = false, onSelect }) => (
  <Card
    title={plan.name}
    actions={isCurrent ? <Badge tone="success">Current</Badge> : null}
    footer={
      !isCurrent && (
        <Button fullWidth onClick={() => onSelect?.(plan)}>
          Choose {plan.name}
        </Button>
      )
    }
  >
    <p style={{ fontSize: 'var(--text-2xl)' }}>
      {formatCurrency(plan.pricePerMonth, plan.currency)}
      <span className="u-text-sm u-text-muted"> / month</span>
    </p>
    <ul className="u-text-sm u-mt-4">
      {(plan.features ?? []).map((feature) => (
        <li key={feature}>{feature}</li>
      ))}
    </ul>
  </Card>
);

export default PlanCard;
