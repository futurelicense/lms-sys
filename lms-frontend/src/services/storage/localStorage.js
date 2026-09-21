/**
 * Thin, exception-safe wrapper over window.localStorage.
 * Private/incognito modes and quota errors must never crash a render.
 */
const isAvailable = (() => {
  try {
    const probe = '__lms_probe__';
    window.localStorage.setItem(probe, probe);
    window.localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
})();

const memoryFallback = new Map();

export const storage = {
  get(key, fallback = null) {
    try {
      const raw = isAvailable ? window.localStorage.getItem(key) : memoryFallback.get(key);
      return raw == null ? fallback : JSON.parse(raw);
    } catch {
      return fallback;
    }
  },

  set(key, value) {
    try {
      const raw = JSON.stringify(value);
      if (isAvailable) window.localStorage.setItem(key, raw);
      else memoryFallback.set(key, raw);
    } catch {
      // Quota exceeded or serialisation failure - non-fatal by design.
    }
  },

  remove(key) {
    try {
      if (isAvailable) window.localStorage.removeItem(key);
      else memoryFallback.delete(key);
    } catch {
      // ignore
    }
  },

  clear() {
    try {
      if (isAvailable) window.localStorage.clear();
      else memoryFallback.clear();
    } catch {
      // ignore
    }
  },
};

export default storage;
