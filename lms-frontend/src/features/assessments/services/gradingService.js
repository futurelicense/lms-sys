import { http } from '../../../services/api/axiosInstance';
import { API_ENDPOINTS } from '../../../constants/apiEndpoints';

const ep = API_ENDPOINTS.adminAssessments;

export const gradingService = {
  getPendingSubmissions: (params) => http.get(ep.pendingGrading, { params }),
  gradeAttemptSubmission: (attemptId, payload) => http.post(ep.gradeAttempt(attemptId), payload),
};

export default gradingService;
