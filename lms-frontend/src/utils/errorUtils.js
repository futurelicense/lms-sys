import { HTTP_STATUS } from '../constants/appConstants';

const STATUS_MESSAGES = {
  [HTTP_STATUS.BAD_REQUEST]: 'The request was invalid.',
  [HTTP_STATUS.UNAUTHORIZED]: 'Your session has expired. Please sign in again.',
  [HTTP_STATUS.FORBIDDEN]: 'You do not have permission to perform this action.',
  [HTTP_STATUS.NOT_FOUND]: 'The requested resource was not found.',
  [HTTP_STATUS.CONFLICT]: 'This action conflicts with the current state.',
  [HTTP_STATUS.UNPROCESSABLE]: 'Some fields need your attention.',
  [HTTP_STATUS.TOO_MANY_REQUESTS]: 'Too many requests. Please slow down.',
  [HTTP_STATUS.SERVER_ERROR]: 'Something went wrong on our side.',
};

/** Turns any thrown value into a predictable, serializable shape the UI can render. */
export const normalizeError = (error) => {
  if (error && error.status !== undefined && error.message !== undefined && !error.response) {
    return error;
  }

  const status = error?.response?.status ?? 0;
  const data = error?.response?.data ?? {};
  const isNetwork =
    !error?.response ||
    error?.code === 'ERR_NETWORK' ||
    error?.code === 'ECONNABORTED' ||
    error?.message === 'Network Error';

  return {
    status,
    code: data.code ?? error?.code ?? (isNetwork ? 'ERR_NETWORK' : 'UNKNOWN_ERROR'),
    message:
      data.message ??
      STATUS_MESSAGES[status] ??
      (isNetwork
        ? 'Cannot reach the server. Check your connection.'
        : 'An unexpected error occurred.'),
    fieldErrors: data.errors ?? data.fieldErrors ?? {},
    isNetworkError: isNetwork,
  };
};

/** Categorizes authentication errors into user-friendly diagnostic objects. */
export const categorizeAuthError = (error) => {
  const norm = normalizeError(error);
  const status = norm.status;
  const code = norm.code;
  const rawMsg = norm.message || '';
  const isNet = norm.isNetworkError || code === 'ERR_NETWORK' || status === 0;

  // 1. Connection / Network / Server Offline
  if (isNet) {
    return {
      status: 0,
      code: 'NETWORK_ERROR',
      type: 'NETWORK_ERROR',
      title: 'Server Connection Failed',
      message:
        'Unable to connect to the backend server. Please verify the backend service is running and check your network connection.',
    };
  }

  // 2. Server-side errors (500, 502, 503, 504)
  if (status >= 500) {
    return {
      status,
      code: code || 'INTERNAL_ERROR',
      type: 'SERVER_ERROR',
      title: 'Backend Server Problem',
      message:
        status === 503 || status === 502
          ? 'The authentication service is temporarily unavailable or restarting. Please try again in a few moments.'
          : 'A backend server error occurred while processing your request. Please try again later.',
    };
  }

  // 3. Workspace / Tenant not found (404)
  if (status === 404) {
    return {
      status,
      code: code || 'TENANT_NOT_FOUND',
      type: 'TENANT_NOT_FOUND',
      title: 'Workspace Not Found',
      message: 'This learning workspace does not exist. Please check your workspace URL or subdomain.',
    };
  }

  // 4. Rate Limiting (429)
  if (status === 429) {
    return {
      status,
      code: 'TOO_MANY_REQUESTS',
      type: 'RATE_LIMIT',
      title: 'Too Many Attempts',
      message: 'Too many sign-in attempts. Please wait a few minutes before trying again.',
    };
  }

  // 5. Forbidden / Account Locked / Inactive Workspace (403)
  if (status === 403) {
    const isLocked =
      code === 'ACCOUNT_DISABLED' ||
      /lock/i.test(rawMsg) ||
      /disabled/i.test(rawMsg) ||
      /deactivat/i.test(rawMsg);

    const isTenantIssue = /tenant/i.test(rawMsg) || /workspace/i.test(rawMsg);

    if (isTenantIssue) {
      return {
        status,
        code: code || 'TENANT_INACTIVE',
        type: 'TENANT_INACTIVE',
        title: 'Workspace Inactive',
        message:
          rawMsg || 'This learning workspace is currently inactive or suspended. Contact an administrator.',
      };
    }

    if (isLocked) {
      return {
        status,
        code: code || 'ACCOUNT_DISABLED',
        type: 'ACCOUNT_LOCKED',
        title: 'Account Locked or Disabled',
        message:
          rawMsg ||
          'This account has been locked due to excessive failed attempts or deactivated. Please contact an administrator.',
      };
    }

    return {
      status,
      code: code || 'ACCESS_DENIED',
      type: 'ACCESS_DENIED',
      title: 'Access Restricted',
      message: rawMsg || 'You do not have permission to access this workspace.',
    };
  }

  // 6. Invalid Credentials (401)
  if (status === 401) {
    return {
      status,
      code: code || 'INVALID_CREDENTIALS',
      type: 'CREDENTIALS',
      title: 'Invalid Credentials',
      message: 'Incorrect email or password. Please verify your details and try again.',
    };
  }

  // Fallback
  return {
    status,
    code,
    type: 'UNKNOWN',
    title: 'Sign In Failed',
    message: rawMsg || 'An unexpected error occurred during sign in. Please try again.',
  };
};

export const getFieldError = (error, field) => error?.fieldErrors?.[field] ?? null;

export const isAuthError = (error) =>
  error?.status === HTTP_STATUS.UNAUTHORIZED || error?.status === HTTP_STATUS.FORBIDDEN;
