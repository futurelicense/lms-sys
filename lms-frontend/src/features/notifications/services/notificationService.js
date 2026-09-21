import axios from 'axios';
import environment from '../../../config/environment';
import tokenStorage from '../../../services/storage/tokenStorage';
import { installDemoAdapters } from '../../auth/services/demo/installDemoAdapters';

const notificationApi = axios.create({
  baseURL: environment.notificationServiceUrl ?? 'http://localhost:3002/api/v1/notifications',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

installDemoAdapters(notificationApi);

notificationApi.interceptors.request.use((config) => {
  const token = tokenStorage.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const tenantSlug = localStorage.getItem('tenantSlug');
  if (tenantSlug) {
    config.headers['X-Tenant-Slug'] = tenantSlug;
  }
  return config;
});

const unwrap = (r) => r?.data ?? r;

export const notificationService = {
  list: (params) => notificationApi.get('/', { params }).then(unwrap),
  getUnreadCount: () => notificationApi.get('/unread-count').then((r) => r?.data?.count ?? r?.count ?? 0),
  markRead: (id) => notificationApi.patch(`/${id}/read`).then(unwrap),
  markAllRead: () => notificationApi.patch('/read-all').then(unwrap),
};

export default notificationService;
