export const STORAGE_KEYS = Object.freeze({
  ACCESS_TOKEN: 'lms.accessToken',
  REFRESH_TOKEN: 'lms.refreshToken',
  THEME: 'lms.theme',
  TENANT: 'lms.tenant',
  PLATFORM_ACCESS_TOKEN: 'lms.platform.accessToken',
});

export const QUERY_KEYS = Object.freeze({
  CURRENT_USER: ['currentUser'],
  USERS: ['users'],
  ROLES: ['roles'],
  INVITATIONS: ['invitations'],
  STUDENTS: ['students'],
  INSTRUCTORS: ['instructors'],
  BATCHES: ['batches'],
  COURSES: ['courses'],
  ENROLLMENTS: ['enrollments'],
  ASSESSMENTS: ['assessments'],
  CERTIFICATES: ['certificates'],
  NOTIFICATIONS: ['notifications'],
  ANALYTICS: ['analytics'],
  SUBSCRIPTION: ['subscription'],
  TENANT: ['tenant'],
  PROFILE: ['profile'],
  GAMIFICATION: ['gamification'],
  CALENDAR: ['calendar'],
  NOTES: ['notes'],
  BOOKMARKS: ['bookmarks'],
});

export const HTTP_STATUS = Object.freeze({
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE: 422,
  TOO_MANY_REQUESTS: 429,
  SERVER_ERROR: 500,
});

export const THEMES = Object.freeze({ LIGHT: 'light', DARK: 'dark', SYSTEM: 'system' });
