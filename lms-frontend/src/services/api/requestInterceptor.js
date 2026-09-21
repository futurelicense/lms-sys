import tokenStorage from '../storage/tokenStorage';
import storage from '../storage/localStorage';
import { STORAGE_KEYS } from '../../constants/appConstants';
import { isDemoToken } from '../../features/auth/services/demoSession';

/** Attaches auth, tenant and correlation headers to every outgoing request. */
export const onRequest = (config) => {
  const token = tokenStorage.getAccessToken();
  // Demo tokens are local stubs — do not send them to a real API.
  if (token && !isDemoToken(token)) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const tenant = storage.get(STORAGE_KEYS.TENANT);
  if (tenant?.slug) {
    config.headers['X-Tenant-Slug'] = tenant.slug;
  }

  config.headers['X-Request-Id'] = crypto.randomUUID();
  return config;
};

export const onRequestError = (error) => Promise.reject(error);
