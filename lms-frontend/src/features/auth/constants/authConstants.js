export const AUTH_EVENTS = Object.freeze({
  SESSION_EXPIRED: 'auth:session-expired',
});

export const AUTH_MESSAGES = Object.freeze({
  INVALID_CREDENTIALS: 'Email or password is incorrect.',
  ACCOUNT_LOCKED: 'Your account is locked. Contact your administrator.',
  RESET_LINK_SENT: 'If that email exists, a reset link is on its way.',
  PASSWORD_UPDATED: 'Your password has been updated. Please sign in.',
  INVITATION_ACCEPTED: 'Welcome aboard! Your account is ready.',
});

export const INVITATION_STATUS = Object.freeze({
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  EXPIRED: 'EXPIRED',
  REVOKED: 'REVOKED',
});
