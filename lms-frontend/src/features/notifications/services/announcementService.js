import { http } from '../../../services/api/axiosInstance';

const BASE = '/announcements';

export const announcementService = {
  /** List all announcements for the current instructor/admin */
  list: () => http.get(BASE),

  /** List active announcements (public/student-facing) */
  listActive: () => http.get(`${BASE}/active`),

  /** Create a new announcement */
  create: (data) => http.post(BASE, data),

  /** Toggle an announcement active/inactive */
  toggle: (id, active) => http.post(`${BASE}/${id}/toggle`, null, { params: { active } }),

  /** Delete an announcement */
  remove: (id) => http.delete(`${BASE}/${id}`),
};

export default announcementService;
