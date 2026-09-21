import DataTable from '../../../components/common/DataTable';

const columns = [
  { key: 'name', header: 'Role', sortable: true },
  { key: 'description', header: 'Description' },
  { key: 'userCount', header: 'Users', sortable: true },
];

export const RoleTable = (props) => (
  <DataTable columns={columns} emptyTitle="No roles defined" {...props} />
);

export default RoleTable;
