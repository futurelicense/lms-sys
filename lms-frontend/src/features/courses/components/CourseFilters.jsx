import Input from '../../../components/common/Input';
import Select from '../../../components/common/Select';
import { COURSE_LEVEL_OPTIONS, COURSE_STATUS_OPTIONS } from '../constants/courseConstants';

export const CourseFilters = ({ value = {}, onChange }) => {
  const update = (patch) => onChange({ ...value, ...patch });

  return (
    <div className="u-flex u-gap-3 u-wrap u-mb-4">
      <Input
        label="Search"
        placeholder="Search courses"
        value={value.search ?? ''}
        onChange={(event) => update({ search: event.target.value })}
      />
      <Select
        label="Status"
        placeholder="Any status"
        options={COURSE_STATUS_OPTIONS}
        value={value.status ?? ''}
        onChange={(event) => update({ status: event.target.value || undefined })}
      />
      <Select
        label="Level"
        placeholder="Any level"
        options={COURSE_LEVEL_OPTIONS}
        value={value.level ?? ''}
        onChange={(event) => update({ level: event.target.value || undefined })}
      />
    </div>
  );
};

export default CourseFilters;
