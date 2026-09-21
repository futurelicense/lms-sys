import axios from 'axios';
import environment from '../../config/environment';
import appConfig from '../../config/appConfig';
import { onRequest, onRequestError } from './requestInterceptor';
import { onResponse, createResponseErrorHandler } from './responseInterceptor';
import { installDemoAdapters } from '../../features/auth/services/demo/installDemoAdapters';

export const apiClient = axios.create({
  baseURL: environment.apiBaseUrl,
  timeout: appConfig.requestTimeoutMs,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use(onRequest, onRequestError);
apiClient.interceptors.response.use(onResponse, createResponseErrorHandler(apiClient));

// Demo mode: intercept HTTP when a local demo session is active.
installDemoAdapters(apiClient);

/**
 * Unwraps the ApiResponse envelope { data, message, timestamp } returned by
 * every backend endpoint, so service files see the inner payload directly.
 * For paginated results the inner `data` is already a PageResponse object.
 */
const unwrap = (r) => {
  // Real backend: ApiResponse wrapper has a "data" key
  if (r && typeof r === 'object' && 'data' in r) return r.data;
  // Fallback for any non-wrapped or raw responses (dev mocks)
  return r;
};

/** Unwraps the ApiResponse envelope so services receive the raw payload. */
export const http = {
  get:    (url, config) => apiClient.get(url, config).then((r) => unwrap(r.data)),
  post:   (url, body, config) => apiClient.post(url, body, config).then((r) => unwrap(r.data)),
  put:    (url, body, config) => apiClient.put(url, body, config).then((r) => unwrap(r.data)),
  patch:  (url, body, config) => apiClient.patch(url, body, config).then((r) => unwrap(r.data)),
  delete: (url, config) => apiClient.delete(url, config).then((r) => unwrap(r.data)),
};

export default apiClient;
