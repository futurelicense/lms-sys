/** Every path in the app lives here - never hardcode a route string elsewhere. */
export const ROUTES = Object.freeze({
  ROOT: '/',

  // Auth
  LOGIN: '/auth/login',
  ACCEPT_INVITATION: '/auth/accept-invitation',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',
  SET_PASSWORD: '/auth/set-password',
  UNAUTHORIZED: '/unauthorized',
  NOT_FOUND: '/404',

  // Global platform control plane
  PLATFORM_LOGIN: '/platform/login',
  PLATFORM_DASHBOARD: '/platform/dashboard',
  PLATFORM_TENANTS: '/platform/tenants',
  PLATFORM_AUDIT_LOGS: '/platform/audit-logs',
  PLATFORM_ANNOUNCEMENTS: '/platform/announcements',

  // Admin
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_ANALYTICS: '/admin/analytics',
  USERS: '/admin/users',
  USER_CREATE: '/admin/users/new',
  USER_DETAILS: (id = ':userId') => `/admin/users/${id}`,
  USER_EDIT: (id = ':userId') => `/admin/users/${id}/edit`,
  ROLES: '/admin/roles',
  ROLE_DETAILS: (id = ':roleId') => `/admin/roles/${id}`,
  PERMISSIONS: '/admin/permissions',
  INVITATIONS: '/admin/invitations',
  INSTRUCTORS: '/admin/instructors',
  INSTRUCTOR_CREATE: '/admin/instructors/new',
  INSTRUCTOR_DETAILS: (id = ':instructorId') => `/admin/instructors/${id}`,
  INSTRUCTOR_EDIT: (id = ':instructorId') => `/admin/instructors/${id}/edit`,
  BATCHES: '/admin/batches',
  STUDENTS: '/admin/students',
  STUDENT_CREATE: '/admin/students/new',
  STUDENT_DETAILS: (id = ':studentId') => `/admin/students/${id}`,
  STUDENT_EDIT: (id = ':studentId') => `/admin/students/${id}/edit`,
  ENROLLMENTS: '/admin/enrollments',
  ENROLLMENT_DETAILS: (id = ':enrollmentId') => `/admin/enrollments/${id}`,
  ORGANIZATION: '/admin/organization',
  ORGANIZATION_SETTINGS: '/admin/organization/settings',
  SUBSCRIPTION: '/admin/subscription',
  PLANS: '/admin/subscription/plans',
  BILLING: '/admin/subscription/billing',
  ADMIN_COURSES: '/admin/courses',
  ADMIN_COURSE_CREATE: '/admin/courses/new',
  ADMIN_COURSE_DETAILS: (id = ':courseId') => `/admin/courses/${id}`,
  ADMIN_COURSE_EDIT: (id = ':courseId') => `/admin/courses/${id}/edit`,

  AUDIT_LOGS: '/admin/audit-logs',

  // Admin Assessments
  ADMIN_ASSESSMENTS: '/admin/assessments',
  ADMIN_ASSESSMENT_CREATE: '/admin/assessments/new',
  ADMIN_ASSESSMENT_DETAILS: (id = ':assessmentId') => `/admin/assessments/${id}`,
  ADMIN_ASSESSMENT_EDIT: (id = ':assessmentId') => `/admin/assessments/${id}/edit`,
  ADMIN_SUBMISSIONS_HISTORY: '/admin/assessments/submissions-history',
  ADMIN_GRADING: '/admin/assessments/grading',
  ADMIN_RUBRICS: '/admin/assessments/rubrics',
  ADMIN_GAMIFICATION: '/admin/gamification',
  CAMPUS_RESOURCES: '/admin/resources',

  // Instructor
  INSTRUCTOR_ANALYTICS: '/instructor/analytics',
  COURSES: '/instructor/courses',
  COURSE_CREATE: '/instructor/courses/new',
  COURSE_DETAILS: (id = ':courseId') => `/instructor/courses/${id}`,
  COURSE_EDIT: (id = ':courseId') => `/instructor/courses/${id}/edit`,
  ASSESSMENTS: '/instructor/assessments',
  ASSESSMENT_CREATE: '/instructor/assessments/new',
  INSTRUCTOR_ASSESSMENT_DETAILS: (id = ':assessmentId') => `/instructor/assessments/${id}`,
  INSTRUCTOR_ASSESSMENT_EDIT: (id = ':assessmentId') => `/instructor/assessments/${id}/edit`,
  INSTRUCTOR_SUBMISSIONS_HISTORY: '/instructor/assessments/submissions-history',
  INSTRUCTOR_GRADING: '/instructor/assessments/grading',
  INSTRUCTOR_RUBRICS: '/instructor/assessments/rubrics',
  INSTRUCTOR_RESOURCES: '/instructor/resources',
  INSTRUCTOR_ANNOUNCEMENTS: '/instructor/announcements',
  INSTRUCTOR_QUESTION_BANK: '/instructor/question-bank',
  INSTRUCTOR_BATCHES: '/instructor/batches',
  INSTRUCTOR_CERTIFICATES: '/instructor/certificates',
  ADMIN_QUESTION_BANK: '/admin/assessments/question-bank',

  // Student
  MY_COURSES: '/learn/my-courses',
  STUDENT_ASSESSMENTS: '/learn/assessments',
  MY_ASSESSMENTS: '/learn/assessments',
  LEARNING: (id = ':courseId') => `/learn/${id}`,
  LESSON: (c = ':courseId', l = ':lessonId') => `/learn/${c}/lessons/${l}`,
  COURSE_PLAYER: (id = ':courseId') => `/learn/${id}/player`,
  ASSESSMENT_ATTEMPT: (id = ':assessmentId') => `/learn/assessments/${id}`,
  ASSESSMENT_RESULT: (id = ':attemptId') => `/learn/assessments/results/${id}`,
  STUDENT_PROGRESS: '/learn/progress',
  CERTIFICATES: '/learn/certificates',
  CERTIFICATE_DETAILS: (id = ':certificateId') => `/learn/certificates/${id}`,
  GAMIFICATION: '/learn/gamification',
  CALENDAR: '/learn/calendar',
  NOTES_BOOKMARKS: '/learn/notes',

  // Public & Verification
  PUBLIC_CERTIFICATE_VERIFY: '/verify',
  PUBLIC_CERTIFICATE_VERIFY_SERIAL: (serial = ':serialNumber') => `/verify/${serial}`,

  // Shared
  NOTIFICATIONS: '/notifications',
  PROFILE: '/profile',
  SECURITY: '/profile/security',

  // Chat
  CHAT: '/chat',
  CHAT_CHANNEL: (id = ':channelId') => `/chat/${id}`,
});
