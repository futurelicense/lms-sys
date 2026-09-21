import { http } from '../../../services/api/axiosInstance';
import { API_ENDPOINTS } from '../../../constants/apiEndpoints';

export const certificateService = {
  list: (params) => http.get(API_ENDPOINTS.certificates.base, { params }),
  getById: (id) => http.get(API_ENDPOINTS.certificates.byId(id)),
  download: (id) => http.get(API_ENDPOINTS.certificates.download(id), { responseType: 'blob' }),
  verify: (serialNumber) => http.get(API_ENDPOINTS.certificates.verify(serialNumber)),
};

export default certificateService;
