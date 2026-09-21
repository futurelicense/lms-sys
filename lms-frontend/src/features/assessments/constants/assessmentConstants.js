export const ASSESSMENT_STATUS = Object.freeze({
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
  CLOSED: 'CLOSED',
  ARCHIVED: 'ARCHIVED',
});

export const ASSESSMENT_STATUS_TONE = Object.freeze({
  [ASSESSMENT_STATUS.DRAFT]: 'neutral',
  [ASSESSMENT_STATUS.PUBLISHED]: 'success',
  [ASSESSMENT_STATUS.CLOSED]: 'warning',
  [ASSESSMENT_STATUS.ARCHIVED]: 'danger',
});

export const ASSESSMENT_STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  ...Object.values(ASSESSMENT_STATUS).map((s) => ({ value: s, label: s })),
];

export const DIFFICULTY = Object.freeze({
  EASY: 'EASY',
  MEDIUM: 'MEDIUM',
  HARD: 'HARD',
});

export const DIFFICULTY_OPTIONS = Object.values(DIFFICULTY).map((d) => ({
  value: d,
  label: d.charAt(0) + d.slice(1).toLowerCase(),
}));

export const DIFFICULTY_TONE = Object.freeze({
  [DIFFICULTY.EASY]: 'success',
  [DIFFICULTY.MEDIUM]: 'warning',
  [DIFFICULTY.HARD]: 'danger',
});

export const COMPILER_OPTIONS = [
  { value: 'ALL', label: 'All Compilers (Multi-Language)' },
  { value: 'JAVA', label: 'Java (JDK 17)' },
  { value: 'PYTHON', label: 'Python (3.11)' },
  { value: 'CPP', label: 'C++ (GCC 13)' },
  { value: 'C', label: 'C (GCC 13)' },
  { value: 'JAVASCRIPT', label: 'JavaScript (Node.js 20)' },
  { value: 'SQL', label: 'SQL (PostgreSQL 16)' },
];

// Legacy — kept for student-side components
export const QUESTION_TYPES = Object.freeze({
  CODING: 'CODING',
});

export const ATTEMPT_STATUS = Object.freeze({
  IN_PROGRESS: 'IN_PROGRESS',
  SUBMITTED: 'SUBMITTED',
  TIMED_OUT: 'TIMED_OUT',
  EXPIRED: 'EXPIRED',
  EVALUATED: 'EVALUATED',
});
