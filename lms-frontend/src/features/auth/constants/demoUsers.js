import { ROLES } from '../../../constants/roles';
import { PERMISSIONS } from '../../../constants/permissions';

/** Prefix used to recognise offline demo tokens (never sent as real JWTs). */
export const DEMO_TOKEN_PREFIX = 'demo.';

export const DEMO_SESSION_KEY = 'lms.demoSession';

const INSTRUCTOR_PERMISSIONS = [
  PERMISSIONS.COURSE_VIEW,
  PERMISSIONS.COURSE_CREATE,
  PERMISSIONS.COURSE_UPDATE,
  PERMISSIONS.BATCH_VIEW,
  PERMISSIONS.ASSESSMENT_VIEW,
  PERMISSIONS.ASSESSMENT_CREATE,
  PERMISSIONS.ASSESSMENT_UPDATE,
  PERMISSIONS.ENROLLMENT_VIEW,
  PERMISSIONS.ANALYTICS_READ,
  PERMISSIONS.CERTIFICATE_READ,
  PERMISSIONS.CERTIFICATE_ISSUE,
  PERMISSIONS.GAMIFICATION_VIEW,
];

/**
 * Local-only demo personas. Used when no LMS API is available so the UI can be
 * browsed. Not valid against a real backend.
 */
export const DEMO_USERS = Object.freeze({
  ADMIN: Object.freeze({
    id: 'demo-admin',
    name: 'Demo Admin',
    fullName: 'Demo Admin',
    email: 'demo.admin@lms.local',
    roles: Object.freeze([ROLES.ADMIN]),
    permissions: Object.freeze([]),
    mustChangePassword: false,
    active: true,
  }),
  INSTRUCTOR: Object.freeze({
    id: 'demo-instructor',
    name: 'Demo Instructor',
    fullName: 'Demo Instructor',
    email: 'demo.instructor@lms.local',
    roles: Object.freeze([ROLES.INSTRUCTOR]),
    permissions: Object.freeze(INSTRUCTOR_PERMISSIONS),
    mustChangePassword: false,
    active: true,
  }),
  STUDENT: Object.freeze({
    id: 'demo-student',
    name: 'Demo Student',
    fullName: 'Demo Student',
    email: 'demo.student@lms.local',
    roles: Object.freeze([ROLES.STUDENT]),
    permissions: Object.freeze([]),
    mustChangePassword: false,
    active: true,
  }),
});

export const DEMO_ROLE_OPTIONS = Object.freeze([
  { key: 'ADMIN', label: 'Admin' },
  { key: 'INSTRUCTOR', label: 'Instructor' },
  { key: 'STUDENT', label: 'Student' },
]);
