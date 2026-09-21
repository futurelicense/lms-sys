import { beforeEach, describe, expect, it } from 'vitest';
import { STORAGE_KEYS } from '../../src/constants/appConstants';
import platformAuthStorage from '../../src/features/platform/services/platformAuthStorage';

describe('platformAuthStorage', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it('persists the control-plane token in local storage', () => {
    platformAuthStorage.setToken('platform-token');

    expect(platformAuthStorage.getToken()).toBe('platform-token');
    expect(window.localStorage.getItem(STORAGE_KEYS.PLATFORM_ACCESS_TOKEN)).toBe('platform-token');
    expect(window.sessionStorage.getItem(STORAGE_KEYS.PLATFORM_ACCESS_TOKEN)).toBeNull();
  });

  it('clears the persisted token on explicit sign out', () => {
    platformAuthStorage.setToken('platform-token');
    platformAuthStorage.clear();

    expect(platformAuthStorage.getToken()).toBeNull();
  });

  it('recognises local-storage events for the platform session only', () => {
    expect(platformAuthStorage.isPlatformTokenChange({
      key: STORAGE_KEYS.PLATFORM_ACCESS_TOKEN,
      storageArea: window.localStorage,
    })).toBe(true);
    expect(platformAuthStorage.isPlatformTokenChange({
      key: STORAGE_KEYS.ACCESS_TOKEN,
      storageArea: window.localStorage,
    })).toBe(false);
  });
});
