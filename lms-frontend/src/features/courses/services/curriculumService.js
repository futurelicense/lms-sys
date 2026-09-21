import { http } from '../../../services/api/axiosInstance';

const curriculumService = {
  addModule: (courseId, data) => http.post(`/courses/${courseId}/curriculum/modules`, data),
  updateModule: (courseId, moduleId, data) => http.put(`/courses/${courseId}/curriculum/modules/${moduleId}`, data),
  deleteModule: (courseId, moduleId) => http.delete(`/courses/${courseId}/curriculum/modules/${moduleId}`),
  
  addLesson: (courseId, moduleId, data) => http.post(`/courses/${courseId}/curriculum/modules/${moduleId}/lessons`, data),
  updateLesson: (courseId, moduleId, lessonId, data) => http.put(`/courses/${courseId}/curriculum/modules/${moduleId}/lessons/${lessonId}`, data),
  uploadLessonThumbnail: (courseId, moduleId, lessonId, file) => {
    const body = new FormData();
    body.append('file', file);
    return http.post(`/courses/${courseId}/curriculum/modules/${moduleId}/lessons/${lessonId}/thumbnail`, body, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  deleteLesson: (courseId, moduleId, lessonId) => http.delete(`/courses/${courseId}/curriculum/modules/${moduleId}/lessons/${lessonId}`)
};

export default curriculumService;
