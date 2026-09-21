import Badge from '../../../components/common/Badge';
import { COURSE_STATUS_TONE } from '../constants/courseConstants';
import { titleCase } from '../../../utils/formatUtils';

export const CourseStatusBadge = ({ status }) => (
  <Badge tone={COURSE_STATUS_TONE[status] ?? 'neutral'}>{titleCase(status ?? '')}</Badge>
);

export default CourseStatusBadge;
