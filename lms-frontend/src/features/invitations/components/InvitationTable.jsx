import DataTable from '../../../components/common/DataTable';
import Badge from '../../../components/common/Badge';
import { formatDate } from '../../../utils/dateUtils';

const columns = [
  { key: 'email', header: 'Email', sortable: true },
  { key: 'roles', header: 'Roles', render: (row) => (row.roles ?? []).join(', ') },
  { key: 'status', header: 'Status', render: (row) => <Badge>{row.status}</Badge> },
  { key: 'expiresAt', header: 'Expires', render: (row) => formatDate(row.expiresAt) },
];

export const InvitationTable = (props) => (
  <DataTable columns={columns} emptyTitle="No invitations sent" {...props} />
);

export default InvitationTable;
