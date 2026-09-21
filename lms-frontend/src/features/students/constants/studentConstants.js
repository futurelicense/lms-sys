/** Mirrors com.lms.student.entity.EnrolmentStatus. */
export const ENROLMENT_STATUS = Object.freeze({
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
  DROPPED: 'DROPPED',
  ON_HOLD: 'ON_HOLD',
});

export const ENROLMENT_STATUS_OPTIONS = [
  { value: ENROLMENT_STATUS.ACTIVE, label: 'Active' },
  { value: ENROLMENT_STATUS.COMPLETED, label: 'Completed' },
  { value: ENROLMENT_STATUS.DROPPED, label: 'Dropped' },
  { value: ENROLMENT_STATUS.ON_HOLD, label: 'On hold' },
];

export const ENROLMENT_STATUS_TONE = {
  [ENROLMENT_STATUS.ACTIVE]: 'success',
  [ENROLMENT_STATUS.COMPLETED]: 'info',
  [ENROLMENT_STATUS.DROPPED]: 'danger',
  [ENROLMENT_STATUS.ON_HOLD]: 'warning',
};
