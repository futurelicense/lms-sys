import { API_ENDPOINTS } from '../../constants/apiEndpoints';
import { HTTP_STATUS } from '../../constants/appConstants';
import { normalizeError } from '../../utils/errorUtils';
import tokenStorage from '../storage/tokenStorage';
import { isDemoSessionActive, isDemoToken } from '../../features/auth/services/demoSession';

/**
 * Refresh-token flow with request queueing: while a refresh is in flight, any
 * other 401 waits on the same promise instead of firing N parallel refreshes.
 */
let refreshPromise = null;

const forceLogout = () => {
  tokenStorage.clear();
  window.dispatchEvent(new CustomEvent('auth:session-expired'));
};

export const onResponse = (response) => response;

export const createResponseErrorHandler = (client) => async (error) => {
  const original = error.config;
  const status = error.response?.status;

  const isRefreshCall = original?.url?.includes(API_ENDPOINTS.auth.refresh);
  const isLoginCall = original?.url?.includes(API_ENDPOINTS.auth.login);

  // Offline demo sessions have no real JWT — failed API calls must not kick the user out.
  if (
    status === HTTP_STATUS.UNAUTHORIZED &&
    (isDemoSessionActive() || isDemoToken(tokenStorage.getAccessToken()))
  ) {
    return Promise.reject(normalizeError(error));
  }

  if (status === HTTP_STATUS.UNAUTHORIZED && !original?._retry && !isRefreshCall && !isLoginCall) {
    original._retry = true;

    const refreshToken = tokenStorage.getRefreshToken();
    if (!refreshToken || isDemoToken(refreshToken)) {
      forceLogout();
      return Promise.reject(normalizeError(error));
    }

    try {
      refreshPromise =
        refreshPromise ??
        client
          .post(API_ENDPOINTS.auth.refresh, { refreshToken })
          .then((res) => res.data)
          .finally(() => {
            refreshPromise = null;
          });

      const tokens = await refreshPromise;
      tokenStorage.setTokens(tokens);
      original.headers.Authorization = `Bearer ${tokens.accessToken}`;
      return client(original);
    } catch (refreshError) {
      forceLogout();
      return Promise.reject(normalizeError(refreshError));
    }
  }

  return Promise.reject(normalizeError(error));
};
