import DataTable from '../../../components/common/DataTable';
import { formatDate } from '../../../utils/dateUtils';
import { formatPercent } from '../../../utils/formatUtils';

const columns = [
  { key: 'courseTitle', header: 'Course', sortable: true },
  { key: 'learnerName', header: 'Learner', sortable: true },
  {
    key: 'progressPercent',
    header: 'Progress',
    render: (row) => formatPercent(row.progressPercent ?? 0),
  },
  {
    key: 'enrolledAt',
    header: 'Enrolled',
    sortable: true,
    render: (row) => formatDate(row.enrolledAt),
  },
];

export const EnrollmentTable = (props) => (
  <DataTable columns={columns} emptyTitle="No enrollments yet" {...props} />
);

export default EnrollmentTable;
