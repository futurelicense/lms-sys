import { http } from '../../../services/api/axiosInstance';
import { API_ENDPOINTS } from '../../../constants/apiEndpoints';

export const tenantService = {
  getCurrent: () => http.get(API_ENDPOINTS.tenants.current),
  updateSettings: (payload) => http.put(API_ENDPOINTS.tenants.settings, payload),
  updateBranding: (payload) => http.put(API_ENDPOINTS.tenants.branding, payload),
};

export default tenantService;
