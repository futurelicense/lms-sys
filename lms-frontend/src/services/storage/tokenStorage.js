import { STORAGE_KEYS } from '../../constants/appConstants';
import storage from './localStorage';

/**
 * SECURITY NOTE
 * -------------
 * Access token: kept in-memory only (module-level variable). Never written to
 * any persistent storage, so it is cleared on page reload.
 *
 * Refresh token: stored in sessionStorage (tab-scoped, not accessible cross-origin,
 * cleared when the tab is closed). This is an improvement over localStorage but
 * still client-side JS-accessible. For full XSS protection, migrate to httpOnly
 * + Secure + SameSite=Strict cookies issued by the API server.
 *
 * This module centralises access so that swapping the strategy touches exactly one file.
 */
let accessTokenInMemory = null;

const REFRESH_KEY = STORAGE_KEYS.REFRESH_TOKEN;

export const tokenStorage = {
  getAccessToken() {
    return accessTokenInMemory;
  },

  setAccessToken(token) {
    accessTokenInMemory = token;
  },

  getRefreshToken() {
    try {
      return sessionStorage.getItem(REFRESH_KEY);
    } catch {
      return null;
    }
  },

  setRefreshToken(token) {
    try {
      if (token == null) {
        sessionStorage.removeItem(REFRESH_KEY);
      } else {
        sessionStorage.setItem(REFRESH_KEY, token);
      }
    } catch {
      // sessionStorage unavailable (e.g. private mode with storage disabled)
    }
  },

  setTokens({ accessToken, refreshToken }) {
    if (accessToken) tokenStorage.setAccessToken(accessToken);
    if (refreshToken) tokenStorage.setRefreshToken(refreshToken);
  },

  clear() {
    accessTokenInMemory = null;
    storage.remove(STORAGE_KEYS.ACCESS_TOKEN); // clean up any legacy localStorage entry
    try {
      sessionStorage.removeItem(REFRESH_KEY);
    } catch {
      // ignore
    }
  },
};

export default tokenStorage;
