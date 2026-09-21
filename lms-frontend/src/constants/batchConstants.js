/**
 * Batch attributes, shared by the batches feature and the learner intake form.
 *
 * These live here rather than in either feature because a feature must not
 * import from another feature; see the architecture notes in the README.
 */

/** Mirrors com.lms.student.entity.BatchStatus. */
export const BATCH_STATUS_OPTIONS = [
  { value: 'PLANNED', label: 'Planned' },
  { value: 'ONGOING', label: 'Ongoing' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export const BATCH_STATUS_TONE = {
  PLANNED: 'info',
  ONGOING: 'success',
  COMPLETED: 'neutral',
  CANCELLED: 'danger',
};

/** Mirrors com.lms.student.entity.DeliveryMode. */
export const DELIVERY_MODE_OPTIONS = [
  { value: 'OFFLINE', label: 'Offline' },
  { value: 'ONLINE', label: 'Online' },
  { value: 'HYBRID', label: 'Hybrid' },
];
