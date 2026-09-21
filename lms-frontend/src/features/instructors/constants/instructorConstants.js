/** Mirrors com.lms.instructor.entity.EmploymentType. */
export const EMPLOYMENT_TYPE_OPTIONS = [
  { value: 'FULL_TIME', label: 'Full time' },
  { value: 'PART_TIME', label: 'Part time' },
  { value: 'VISITING', label: 'Visiting' },
  { value: 'CONTRACT', label: 'Contract' },
];

export const EMPLOYMENT_TYPE_TONE = {
  FULL_TIME: 'success',
  PART_TIME: 'info',
  VISITING: 'warning',
  CONTRACT: 'neutral',
};

export const EMPLOYMENT_TYPE_LABEL = Object.fromEntries(
  EMPLOYMENT_TYPE_OPTIONS.map((option) => [option.value, option.label]),
);
