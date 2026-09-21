import { http } from '../../../services/api/axiosInstance';
import { API_ENDPOINTS } from '../../../constants/apiEndpoints';

/**
 * Admin operations for assessment sections.
 */
export const assessmentSectionService = {
    // Get all sections with their questions for an assessment
    getSections: async (assessmentId) => {
        const response = await http.get(`/admin/assessments/${assessmentId}/sections`);
        return response.data || response;
    },

    // Create a new section
    createSection: async (assessmentId, data) => {
        const response = await http.post(`/admin/assessments/${assessmentId}/sections`, data);
        return response.data || response;
    },

    // Update section
    updateSection: async (sectionId, data) => {
        const response = await http.put(`/admin/assessments/sections/${sectionId}`, data);
        return response.data || response;
    },

    // Delete section
    deleteSection: async (sectionId) => {
        const response = await http.delete(`/admin/assessments/sections/${sectionId}`);
        return response.data || response;
    },

    // Add a new question to a specific section
    addQuestionToSection: async (assessmentId, sectionId, data) => {
        // The URL based on AdminQuestionController is POST /api/v1/admin/assessments/{assessmentId}/sections/{sectionId}/questions
        const response = await http.post(`/admin/assessments/${assessmentId}/sections/${sectionId}/questions`, data);
        return response.data || response;
    },

    // Move an existing question to a section
    moveQuestionToSection: async (sectionId, assessmentQuestionId) => {
        const response = await http.put(`/admin/assessments/sections/${sectionId}/questions/${assessmentQuestionId}`);
        return response.data || response;
    },
    
    // Remove a question from any section (making it unsectioned)
    removeQuestionFromSection: async (assessmentQuestionId) => {
        const response = await http.put(`/admin/assessments/questions/${assessmentQuestionId}/unsection`);
        return response.data || response;
    },

    // Move a question by assessmentId and questionId
    moveQuestion: async (assessmentId, questionId, sectionId) => {
        const response = await http.put(`/admin/assessments/${assessmentId}/questions/${questionId}/section`, null, {
            params: sectionId ? { sectionId } : {}
        });
        return response.data || response;
    }
};
