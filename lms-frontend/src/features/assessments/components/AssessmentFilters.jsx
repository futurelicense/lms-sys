import Select from '../../../components/common/Select';
import { ASSESSMENT_STATUS_OPTIONS } from '../constants/assessmentConstants';

export const AssessmentFilters = ({ value = {}, onChange }) => {
  const patch = (changes) => onChange({ ...value, ...changes });

  return (
    <div className="u-flex u-gap-3 u-wrap u-mb-4">
      <Select
        label="Status"
        options={ASSESSMENT_STATUS_OPTIONS}
        value={value.status ?? ''}
        onChange={(e) => patch({ status: e.target.value || undefined })}
      />
    </div>
  );
};

export default AssessmentFilters;
