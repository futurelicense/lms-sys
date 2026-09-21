import { http } from '../../../services/api/axiosInstance';
import { API_ENDPOINTS } from '../../../constants/apiEndpoints';

export const subscriptionService = {
  getCurrent: () => http.get(API_ENDPOINTS.subscriptions.current),
  listPlans: () => http.get(API_ENDPOINTS.subscriptions.plans),
  billingHistory: (params) => http.get(API_ENDPOINTS.subscriptions.billingHistory, { params }),
};

export default subscriptionService;
