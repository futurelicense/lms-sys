import { STORAGE_KEYS } from '../../../constants/appConstants';

const key = STORAGE_KEYS.PLATFORM_ACCESS_TOKEN;

export const platformAuthStorage = {
  // Platform sessions deliberately survive a page refresh and can be used from
  // another tab. Tenant user sessions keep their existing storage policy.
  getToken: () => window.localStorage.getItem(key),
  setToken: (token) => window.localStorage.setItem(key, token),
  clear: () => window.localStorage.removeItem(key),
  isPlatformTokenChange: (event) => event.key === key && event.storageArea === window.localStorage,
};

export default platformAuthStorage;
