import { http } from '../../../services/api/axiosInstance';
import { API_ENDPOINTS } from '../../../constants/apiEndpoints';

export const enrollmentService = {
  list: (params) => http.get(API_ENDPOINTS.enrollments.base, { params }),
  getById: (id) => http.get(API_ENDPOINTS.enrollments.byId(id)),
  enroll: (payload) => http.post(API_ENDPOINTS.enrollments.base, payload),
  unenroll: (id) => http.delete(API_ENDPOINTS.enrollments.byId(id)),

  // Admin
  getAdminEnrollments: (params) => http.get(API_ENDPOINTS.adminEnrollments.base, { params }),
  getAdminEnrollmentById: (id) => http.get(API_ENDPOINTS.adminEnrollments.byId(id)),
  createAdminEnrollment: (payload) => http.post(API_ENDPOINTS.adminEnrollments.base, payload),
  updateAdminEnrollmentStatus: (id, status) =>
    http.patch(API_ENDPOINTS.adminEnrollments.status(id), { status }),
};

export default enrollmentService;
