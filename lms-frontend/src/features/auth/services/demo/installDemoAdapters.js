import axios from 'axios';
import { isDemoSessionActive } from '../demoSession';
import { handleDemoRequest } from './demoRouter';

const DEMO_UPLOAD_HOST = 'https://demo.local/';

const wrapApi = (payload) => ({
  data: payload,
  message: 'OK',
  timestamp: new Date().toISOString(),
});

const settle = (config, payload, status = 200) => ({
  data: wrapApi(payload),
  status,
  statusText: status === 200 ? 'OK' : 'Error',
  headers: { 'content-type': 'application/json' },
  config,
  request: { responseURL: 'demo://local' },
});

/**
 * Axios adapter: when a demo session is active, never touch the network.
 * Also activates if a leftover demo session exists in sessionStorage (HMR-safe).
 */
export const createDemoAwareAdapter = (fallbackAdapter) => async (config) => {
  if (!isDemoSessionActive()) {
    return fallbackAdapter(config);
  }

  try {
    const payload = handleDemoRequest(config);
    return settle(config, payload, 200);
  } catch (error) {
    const status = error.status || 500;
    return Promise.reject(
      Object.assign(new Error(error.message || 'Demo request failed'), {
        config,
        response: {
          status,
          data: wrapApi({ message: error.message }),
          headers: {},
          config,
        },
        isAxiosError: true,
      }),
    );
  }
};

let installed = false;
let nativeFetch = null;

/** Short-circuit demo upload PUTs that bypass axios. */
const installFetchGuard = () => {
  if (typeof window === 'undefined' || nativeFetch) return;
  nativeFetch = window.fetch.bind(window);
  window.fetch = (input, init) => {
    const url = String(typeof input === 'string' ? input : input?.url ?? '');
    if (isDemoSessionActive() && url.startsWith(DEMO_UPLOAD_HOST)) {
      return Promise.resolve(new Response(null, { status: 200, statusText: 'OK' }));
    }
    return nativeFetch(input, init);
  };
};

/**
 * Install demo adapters on the given axios instances (main API, chat, notifications).
 * Safe to call multiple times.
 */
export const installDemoAdapters = (...clients) => {
  installFetchGuard();

  const fallback =
    axios.getAdapter?.(axios.defaults.adapter) ||
    axios.defaults.adapter;

  // Resolve default adapter once (array form in axios 1.x)
  let resolvedFallback = fallback;
  if (Array.isArray(fallback)) {
    resolvedFallback = axios.getAdapter(fallback);
  } else if (typeof fallback !== 'function') {
    resolvedFallback = axios.getAdapter(['xhr', 'http', 'fetch']);
  }

  const adapter = createDemoAwareAdapter(resolvedFallback);

  clients.filter(Boolean).forEach((client) => {
    client.defaults.adapter = adapter;
  });

  installed = true;
  return installed;
};

export default installDemoAdapters;
