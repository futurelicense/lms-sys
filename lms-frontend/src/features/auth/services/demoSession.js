import { DEMO_SESSION_KEY, DEMO_TOKEN_PREFIX, DEMO_USERS } from '../constants/demoUsers';
import tokenStorage from '../../../services/storage/tokenStorage';
import storage from '../../../services/storage/localStorage';
import { STORAGE_KEYS } from '../../../constants/appConstants';
import { resetDemoStore } from './demo/demoStore';

export const isDemoToken = (token) =>
  typeof token === 'string' && token.startsWith(DEMO_TOKEN_PREFIX);

export const isDemoSessionActive = () => {
  if (isDemoToken(tokenStorage.getAccessToken())) return true;
  return Boolean(readDemoSession()?.user);
};

export const readDemoSession = () => {
  try {
    const raw = sessionStorage.getItem(DEMO_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const writeDemoSession = (session) => {
  try {
    sessionStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(session));
  } catch {
    // ignore (private mode / storage disabled)
  }
};

export const clearDemoSession = () => {
  try {
    sessionStorage.removeItem(DEMO_SESSION_KEY);
  } catch {
    // ignore
  }
};

/**
 * Establishes an offline demo session for the given persona key.
 * @param {'ADMIN'|'INSTRUCTOR'|'STUDENT'} roleKey
 */
export const establishDemoSession = (roleKey) => {
  const user = DEMO_USERS[roleKey];
  if (!user) {
    throw new Error(`Unknown demo role: ${roleKey}`);
  }

  const tokens = {
    accessToken: `${DEMO_TOKEN_PREFIX}access.${roleKey.toLowerCase()}`,
    refreshToken: `${DEMO_TOKEN_PREFIX}refresh.${roleKey.toLowerCase()}`,
  };

  resetDemoStore();
  tokenStorage.setTokens(tokens);
  writeDemoSession({ user, roleKey });
  storage.set(STORAGE_KEYS.TENANT, { slug: 'demo' });

  return {
    ...user,
    roles: [...user.roles],
    permissions: [...user.permissions],
  };
};
