import { http } from '../../../services/api/axiosInstance';
import { API_ENDPOINTS } from '../../../constants/apiEndpoints';

export const batchService = {
  /** GET /batches?search=&status=&page=&size= */
  list: (params) =>
    http.get(API_ENDPOINTS.batches.base, {
      params: {
        page: params?.page ?? 0,
        size: params?.size ?? 20,
        sort: 'startDate,desc',
        search: params?.search || undefined,
        status: params?.status || undefined,
      },
    }),

  /** GET /batches/{id} */
  getById: (id) => http.get(API_ENDPOINTS.batches.byId(id)),

  /** POST /batches */
  create: (payload) => http.post(API_ENDPOINTS.batches.base, payload),

  /** PATCH /batches/{id} */
  update: (id, payload) => http.patch(API_ENDPOINTS.batches.byId(id), payload),

  /** DELETE /batches/{id} — refused by the API while learners are enrolled. */
  remove: (id) => http.delete(API_ENDPOINTS.batches.byId(id)),
};

export default batchService;
