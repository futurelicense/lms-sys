import { Link } from 'react-router-dom';
import Card from '../../../components/common/Card';
import ProgressBar from '../../learning/components/ProgressBar';
import { ROUTES } from '../../../constants/routes';
import { formatDate } from '../../../utils/dateUtils';

export const EnrollmentCard = ({ enrollment }) => (
  <Card title={<Link to={ROUTES.LEARNING(enrollment.courseId)}>{enrollment.courseTitle}</Link>}>
    <ProgressBar value={enrollment.progressPercent ?? 0} />
    <p className="u-text-sm u-text-muted u-mt-2">Enrolled {formatDate(enrollment.enrolledAt)}</p>
  </Card>
);

export default EnrollmentCard;
