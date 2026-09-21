import axios from 'axios';
import environment from '../../../config/environment';
import appConfig from '../../../config/appConfig';
import platformAuthStorage from './platformAuthStorage';
import { installDemoAdapters } from '../../auth/services/demo/installDemoAdapters';

const client = axios.create({
  baseURL: environment.apiBaseUrl,
  timeout: appConfig.requestTimeoutMs,
  headers: { 'Content-Type': 'application/json' },
});

installDemoAdapters(client);

client.interceptors.request.use((config) => {
  const token = platformAuthStorage.getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  config.headers['X-Request-Id'] = crypto.randomUUID();
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      const isLoginRequest = error.config?.url?.includes('/auth/login');
      if (!isLoginRequest) {
        platformAuthStorage.clear();
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

const unwrap = (response) => {
  const body = response.data;
  return body && typeof body === 'object' && 'data' in body ? body.data : body;
};

// environment.apiBaseUrl already includes the /api/v1 prefix.
const endpoint = '/platform';

export const platformService = {
  // Auth
  login: (payload) => client.post(`${endpoint}/auth/login`, payload).then(unwrap),

  // Overview
  getOverview: () => client.get(`${endpoint}/overview`).then(unwrap),

  // Tenants
  listTenants: () => client.get(`${endpoint}/tenants`).then(unwrap),
  createTenant: (payload) => client.post(`${endpoint}/tenants`, payload).then(unwrap),
  provisionTenant: (id) => client.post(`${endpoint}/tenants/${id}/provision`).then(unwrap),
  suspendTenant: (id) => client.post(`${endpoint}/tenants/${id}/suspend`).then(unwrap),
  pauseCloudProject: (id) => client.post(`${endpoint}/tenants/${id}/pause-cloud`).then(unwrap),
  restoreCloudProject: (id) => client.post(`${endpoint}/tenants/${id}/restore-cloud`).then(unwrap),
  scheduleDeletion: (id) => client.post(`${endpoint}/tenants/${id}/schedule-deletion`).then(unwrap),

  // Impersonation / Temporary Debug Access
  impersonateTenant: (id, payload = {}) => client.post(`${endpoint}/tenants/${id}/impersonate`, payload).then(unwrap),

  // Tenant Config (Feature flags & quotas)
  getTenantConfig: (id) => client.get(`${endpoint}/tenants/${id}/config`).then(unwrap),
  updateTenantConfig: (id, payload) => client.put(`${endpoint}/tenants/${id}/config`, payload).then(unwrap),

  // Audit logs
  listAuditLogs: (params) => client.get(`${endpoint}/audit-logs`, { params }).then(unwrap),

  // Broadcast announcements
  listAnnouncements: () => client.get(`${endpoint}/announcements`).then(unwrap),
  listActiveAnnouncements: () => client.get(`${endpoint}/announcements/active`).then(unwrap),
  createAnnouncement: (payload) => client.post(`${endpoint}/announcements`, payload).then(unwrap),
  deleteAnnouncement: (id) => client.delete(`${endpoint}/announcements/${id}`).then(unwrap),
  toggleAnnouncement: (id, active) => client.post(`${endpoint}/announcements/${id}/toggle?active=${active}`).then(unwrap),
};

export default platformService;
