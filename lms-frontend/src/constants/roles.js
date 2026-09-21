export const ROLES = Object.freeze({
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  INSTRUCTOR: 'INSTRUCTOR',
  STUDENT: 'STUDENT',
});

export const ROLE_LABELS = Object.freeze({
  [ROLES.SUPER_ADMIN]: 'Super Admin',
  [ROLES.ADMIN]: 'Administrator',
  [ROLES.INSTRUCTOR]: 'Instructor',
  [ROLES.STUDENT]: 'Student',
});

export const ROLE_HOME_ROUTE = Object.freeze({
  [ROLES.SUPER_ADMIN]: '/admin/analytics',
  [ROLES.ADMIN]: '/admin/analytics',
  [ROLES.INSTRUCTOR]: '/instructor/courses',
  [ROLES.STUDENT]: '/learn/my-courses',
});

/**
 * One source of truth for the workspace a multi-role user opens by default.
 * Keep this order aligned with the layouts and route guards: management first,
 * then teaching, then learner-only access.
 */
export const ROLE_ROUTE_PRIORITY = Object.freeze([
  ROLES.SUPER_ADMIN,
  ROLES.ADMIN,
  ROLES.INSTRUCTOR,
  ROLES.STUDENT,
]);

const roleName = (role) => (typeof role === 'string' ? role : role?.name);

export const getPrimaryRole = (roles = []) => {
  const normalizedRoles = (Array.isArray(roles) ? roles : [...(roles ?? [])])
    .map(roleName)
    .filter(Boolean);

  return ROLE_ROUTE_PRIORITY.find((role) => normalizedRoles.includes(role)) ?? null;
};

export const getDefaultRouteForRoles = (roles = []) =>
  ROLE_HOME_ROUTE[getPrimaryRole(roles)] ?? '/profile';
