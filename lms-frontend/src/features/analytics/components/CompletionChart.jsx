import ProgressChart from './ProgressChart';

export const CompletionChart = ({ data = [] }) => (
  <ProgressChart title="Course completion" data={data} />
);

export default CompletionChart;
