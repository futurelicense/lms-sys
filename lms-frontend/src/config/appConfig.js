import environment from './environment';

export const appConfig = Object.freeze({
  name: environment.appName,
  defaultPageSize: 20,
  pageSizeOptions: [10, 20, 50, 100],
  requestTimeoutMs: 30000,
  maxUploadBytes: 50 * 1024 * 1024,
  acceptedImageTypes: ['image/png', 'image/jpeg', 'image/webp'],
  acceptedVideoTypes: ['video/mp4', 'video/webm'],
  toastDurationMs: 5000,
  debounceMs: 300,
});

export default appConfig;
