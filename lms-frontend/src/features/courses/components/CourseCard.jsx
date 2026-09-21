import { Link } from 'react-router-dom';
import Card from '../../../components/common/Card';
import { formatDuration } from '../../../utils/dateUtils';
import { truncate } from '../../../utils/formatUtils';
import CourseThumbnail from './CourseThumbnail';
import CourseStatusBadge from './CourseStatusBadge';

export const CourseCard = ({ course, to }) => (
  <Card>
    <CourseThumbnail src={course.thumbnailUrl} alt={course.title} />
    <div className="u-flex u-items-center u-justify-between u-gap-2 u-mt-2">
      <h4>{to ? <Link to={to}>{course.title}</Link> : course.title}</h4>
      <CourseStatusBadge status={course.status} />
    </div>
    <p className="u-text-sm u-text-muted">{truncate(course.summary ?? '', 120)}</p>
    <p className="u-text-sm u-text-muted">
      {formatDuration((course.durationMinutes ?? 0) * 60)} &middot; {course.lessonCount ?? 0}{' '}
      lessons
    </p>
  </Card>
);

export default CourseCard;
