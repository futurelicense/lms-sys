import { http } from '../../../services/api/axiosInstance';
import { API_ENDPOINTS } from '../../../constants/apiEndpoints';

const ep = API_ENDPOINTS.adminAssessments;

export const rubricService = {
  list: (params) => http.get(ep.rubrics, { params }),
  getById: (id) => http.get(ep.rubricById(id)),
  create: (payload) => http.post(ep.rubrics, payload),
  remove: (id) => http.delete(ep.rubricById(id)),
};

export default rubricService;
