import ProgressChart from './ProgressChart';

export const EnrollmentChart = ({ data = [] }) => (
  <ProgressChart title="Enrollments over time" data={data} />
);

export default EnrollmentChart;
