import Card from '../../../components/common/Card';
import Avatar from '../../../components/common/Avatar';
import { ROLE_LABELS } from '../../../constants/roles';
import UserStatusBadge from './UserStatusBadge';

export const UserCard = ({ user }) => (
  <Card>
    <div className="u-flex u-items-center u-gap-3">
      <Avatar name={user.fullName} src={user.avatarUrl} />
      <div className="u-grow">
        <p>{user.fullName}</p>
        <p className="u-text-sm u-text-muted">{user.email}</p>
        <p className="u-text-sm u-text-muted">
          {(user.roles ?? []).map((role) => ROLE_LABELS[role] ?? role).join(', ')}
        </p>
      </div>
      <UserStatusBadge status={user.status} />
    </div>
  </Card>
);

export default UserCard;
