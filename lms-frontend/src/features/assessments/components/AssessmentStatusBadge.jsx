import Badge from '../../../components/common/Badge';
import { ASSESSMENT_STATUS, ASSESSMENT_STATUS_TONE } from '../constants/assessmentConstants';

const LABELS = {
  [ASSESSMENT_STATUS.DRAFT]: 'Draft',
  [ASSESSMENT_STATUS.PUBLISHED]: 'Published',
  [ASSESSMENT_STATUS.CLOSED]: 'Closed',
  [ASSESSMENT_STATUS.ARCHIVED]: 'Archived',
};

export const AssessmentStatusBadge = ({ status }) => (
  <Badge tone={ASSESSMENT_STATUS_TONE[status] ?? 'neutral'}>{LABELS[status] ?? status}</Badge>
);

export default AssessmentStatusBadge;
