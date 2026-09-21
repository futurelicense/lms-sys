import { http } from '../../../services/api/axiosInstance';
import { API_ENDPOINTS } from '../../../constants/apiEndpoints';

export const analyticsService = {
  adminOverview: async (params) => http.get(API_ENDPOINTS.analytics.admin, { params }),
  instructorOverview: async (params) => http.get(API_ENDPOINTS.analytics.instructor, { params }),
  studentProgress: async (params) => http.get(API_ENDPOINTS.analytics.studentProgress, { params }),
};

export default analyticsService;
