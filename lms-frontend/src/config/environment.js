/**
 * Single, validated entry point for every environment variable.
 * Nothing else in the app should read `import.meta.env` directly.
 */
const raw = import.meta.env;

const required = ['VITE_API_BASE_URL'];

const missing = required.filter((key) => !raw[key]);
if (missing.length > 0 && raw.PROD) {
  throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
}

export const environment = Object.freeze({
  apiBaseUrl: raw.VITE_API_BASE_URL ?? 'http://localhost:8080/api/v1',
  wsBaseUrl: raw.VITE_WS_BASE_URL ?? 'ws://localhost:8080/ws',
  chatServiceUrl: raw.VITE_CHAT_SERVICE_URL ?? 'http://localhost:3001/api/v1/chat',
  chatWsUrl: raw.VITE_CHAT_WS_URL ?? 'http://localhost:3001',
  notificationServiceUrl: raw.VITE_NOTIFICATION_SERVICE_URL ?? 'http://localhost:3002/api/v1/notifications',
  notificationWsUrl: raw.VITE_NOTIFICATION_WS_URL ?? 'http://localhost:3002',
  appName: raw.VITE_APP_NAME ?? 'LMS',
  appEnv: raw.VITE_APP_ENV ?? raw.MODE,
  sentryDsn: raw.VITE_SENTRY_DSN ?? '',
  enableAnalytics: raw.VITE_ENABLE_ANALYTICS === 'true',
  // Offline demo personas on the login page. Defaults on; set to "false" to hide.
  enableDemoLogin: raw.VITE_ENABLE_DEMO_LOGIN !== 'false',
  isProduction: raw.PROD,
  isDevelopment: raw.DEV,
});

export default environment;
