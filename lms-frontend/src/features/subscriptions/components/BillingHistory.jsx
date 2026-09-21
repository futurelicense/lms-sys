import DataTable from '../../../components/common/DataTable';
import { formatDate } from '../../../utils/dateUtils';
import { formatCurrency } from '../../../utils/formatUtils';

const columns = [
  { key: 'invoiceNumber', header: 'Invoice' },
  { key: 'issuedAt', header: 'Date', sortable: true, render: (row) => formatDate(row.issuedAt) },
  { key: 'amount', header: 'Amount', render: (row) => formatCurrency(row.amount, row.currency) },
  { key: 'status', header: 'Status' },
];

export const BillingHistory = (props) => (
  <DataTable columns={columns} emptyTitle="No invoices yet" {...props} />
);

export default BillingHistory;
