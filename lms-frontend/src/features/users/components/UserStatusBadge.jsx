import Badge from '../../../components/common/Badge';
import { USER_STATUS_TONE } from '../constants/userConstants';
import { titleCase } from '../../../utils/formatUtils';

export const UserStatusBadge = ({ status }) => (
  <Badge tone={USER_STATUS_TONE[status] ?? 'neutral'}>{titleCase(status ?? '')}</Badge>
);

export default UserStatusBadge;
