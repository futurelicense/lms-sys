import { Link } from 'react-router-dom';
import DataTable from '../../../components/common/DataTable';
import Avatar from '../../../components/common/Avatar';
import { ROUTES } from '../../../constants/routes';
import { ROLE_LABELS } from '../../../constants/roles';
import { formatDate } from '../../../utils/dateUtils';
import UserStatusBadge from './UserStatusBadge';

const columns = [
  {
    key: 'fullName',
    header: 'Name',
    sortable: true,
    render: (user) => (
      <span className="u-flex u-items-center u-gap-2">
        <Avatar name={user.fullName} src={user.avatarUrl} size="sm" />
        <Link to={ROUTES.USER_DETAILS(user.id)}>{user.fullName}</Link>
      </span>
    ),
  },
  { key: 'email', header: 'Email', sortable: true },
  {
    key: 'roles',
    header: 'Roles',
    render: (user) => (user.roles ?? []).map((role) => ROLE_LABELS[role] ?? role).join(', '),
  },
  { key: 'status', header: 'Status', render: (user) => <UserStatusBadge status={user.status} /> },
  {
    key: 'lastLoginAt',
    header: 'Last active',
    sortable: true,
    render: (user) => formatDate(user.lastLoginAt),
  },
];

export const UserTable = (props) => (
  <DataTable
    columns={columns}
    emptyTitle="No users found"
    emptyDescription="Invite teammates to get started."
    {...props}
  />
);

export default UserTable;
