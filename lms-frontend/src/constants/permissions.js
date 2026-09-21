/**
 * Frontend permission authority strings.
 * Must match the authority values used in backend @PreAuthorize annotations.
 *
 * Backend authorities (from @PreAuthorize):
 *   USER_VIEW, USER_UPDATE, USER_DELETE, USER_LOCK, USER_MANAGE_ROLES
 *   ROLES_VIEW, ROLES_MANAGE
 *   PERMISSIONS_VIEW, PERMISSIONS_MANAGE
 *   INVITATION_VIEW, INVITATION_CREATE, INVITATION_MANAGE
 */
const PERMISSION_VALUES = Object.freeze({
  // User management
  USER_VIEW: 'USER_VIEW',
  USER_UPDATE: 'USER_UPDATE',
  USER_DELETE: 'USER_DELETE',
  USER_LOCK: 'USER_LOCK',
  USER_MANAGE_ROLES: 'USER_MANAGE_ROLES',

  // Roles
  ROLES_VIEW: 'ROLES_VIEW',
  ROLES_MANAGE: 'ROLES_MANAGE',

  // Permissions
  PERMISSIONS_VIEW: 'PERMISSIONS_VIEW',
  PERMISSIONS_MANAGE: 'PERMISSIONS_MANAGE',

  // Invitations
  INVITATION_VIEW: 'INVITATION_VIEW',
  INVITATION_CREATE: 'INVITATION_CREATE',
  INVITATION_MANAGE: 'INVITATION_MANAGE',

  // Courses — match backend @PreAuthorize strings
  COURSE_VIEW: 'COURSE_VIEW',
  COURSE_CREATE: 'COURSE_CREATE',
  COURSE_UPDATE: 'COURSE_UPDATE',
  COURSE_DELETE: 'COURSE_DELETE',
  COURSE_PUBLISH: 'COURSE_PUBLISH',
  COURSE_UNPUBLISH: 'COURSE_UNPUBLISH',
  COURSE_ARCHIVE: 'COURSE_ARCHIVE',
  COURSE_SUBMIT: 'COURSE_SUBMIT',
  COURSE_APPROVE: 'COURSE_APPROVE',
  COURSE_REJECT: 'COURSE_REJECT',

  // Instructors — match backend @PreAuthorize strings
  INSTRUCTOR_VIEW: 'INSTRUCTOR_VIEW',
  INSTRUCTOR_CREATE: 'INSTRUCTOR_CREATE',
  INSTRUCTOR_UPDATE: 'INSTRUCTOR_UPDATE',
  INSTRUCTOR_DELETE: 'INSTRUCTOR_DELETE',

  // Batches — match backend @PreAuthorize strings
  BATCH_VIEW: 'BATCH_VIEW',
  BATCH_CREATE: 'BATCH_CREATE',
  BATCH_UPDATE: 'BATCH_UPDATE',
  BATCH_DELETE: 'BATCH_DELETE',

  // Students — match backend @PreAuthorize strings
  STUDENT_VIEW: 'STUDENT_VIEW',
  STUDENT_CREATE: 'STUDENT_CREATE',
  STUDENT_UPDATE: 'STUDENT_UPDATE',
  STUDENT_DELETE: 'STUDENT_DELETE',

  // Enrollments
  ENROLLMENT_VIEW: 'ENROLLMENT_VIEW',
  ENROLLMENT_CREATE: 'ENROLLMENT_CREATE',
  ENROLLMENT_UPDATE: 'ENROLLMENT_UPDATE',
  ENROLLMENT_DELETE: 'ENROLLMENT_DELETE',

  // Assessments
  ASSESSMENT_VIEW: 'ASSESSMENT_VIEW',
  ASSESSMENT_CREATE: 'ASSESSMENT_CREATE',
  ASSESSMENT_UPDATE: 'ASSESSMENT_UPDATE',
  ASSESSMENT_DELETE: 'ASSESSMENT_DELETE',
  ASSESSMENT_PUBLISH: 'ASSESSMENT_PUBLISH',
  ASSESSMENT_ANALYTICS_VIEW: 'ASSESSMENT_ANALYTICS_VIEW',
  COURSE_ANALYTICS_VIEW: 'COURSE_ANALYTICS_VIEW',
  ENROLLMENT_READ: 'enrollment:read',
  ENROLLMENT_WRITE: 'enrollment:write',
  ASSESSMENT_READ: 'assessment:read',
  ASSESSMENT_WRITE: 'assessment:write',
  ASSESSMENT_GRADE: 'assessment:grade',
  CERTIFICATE_READ: 'certificate:read',
  CERTIFICATE_ISSUE: 'certificate:issue',
  ANALYTICS_READ: 'analytics:read',
  SUBSCRIPTION_READ: 'subscription:read',
  SUBSCRIPTION_MANAGE: 'subscription:manage',
  TENANT_READ: 'tenant:read',
  TENANT_MANAGE: 'tenant:manage',

  // Legacy aliases kept for guard compatibility during transition
  USER_READ: 'USER_VIEW',
  USER_WRITE: 'USER_UPDATE',
  ROLE_WRITE: 'ROLES_MANAGE',
  INVITATION_READ: 'INVITATION_VIEW',
  INVITATION_WRITE: 'INVITATION_CREATE',

  // Audit
  AUDIT_VIEW: 'AUDIT_VIEW',

  // Gamification
  GAMIFICATION_VIEW: 'GAMIFICATION_VIEW',
  GAMIFICATION_MANAGE: 'GAMIFICATION_MANAGE',
});

/**
 * Reading a key that does not exist used to yield `undefined`, and both the nav
 * and the route guards treat "no permission" as "no restriction" — so a typo
 * like PERMISSIONS.ROLE_READ silently made Roles and Permissions public to
 * everyone. In development an unknown key now throws instead of failing open.
 */
export const PERMISSIONS = import.meta.env.DEV
  ? new Proxy(PERMISSION_VALUES, {
      get(target, key) {
        if (typeof key === 'string' && !(key in target)) {
          throw new Error(
            `Unknown permission: PERMISSIONS.${key}. Check src/constants/permissions.js.`,
          );
        }
        return target[key];
      },
    })
  : PERMISSION_VALUES;
