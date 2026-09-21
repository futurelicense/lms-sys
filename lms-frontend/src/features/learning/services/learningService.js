import { http } from '../../../services/api/axiosInstance';
import { API_ENDPOINTS } from '../../../constants/apiEndpoints';

export const learningService = {
  getCourse: (courseId) => http.get(API_ENDPOINTS.courses.byId(courseId)),
  getLesson: (courseId, lessonId) =>
    http.get(API_ENDPOINTS.learning.lesson(courseId, lessonId)),
  getProgress: (courseId) =>
    http.get(API_ENDPOINTS.learning.progress(courseId)),
  saveProgress: (courseId, payload) =>
    http.post(API_ENDPOINTS.learning.progress(courseId), payload),
};

export default learningService;
