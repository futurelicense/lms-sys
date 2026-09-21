import { http } from '../../../services/api/axiosInstance';
import { API_ENDPOINTS } from '../../../constants/apiEndpoints';

export const auditService = {
  list: (params) => http.get(API_ENDPOINTS.auditLogs.base, { params }),
};

export default auditService;
