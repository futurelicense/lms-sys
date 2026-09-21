import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { assessmentSectionService } from '../services/assessmentSectionService';

export const useAdminSections = (assessmentId) => {
    return useQuery({
        queryKey: ['adminSections', assessmentId],
        queryFn: () => assessmentSectionService.getSections(assessmentId),
        enabled: !!assessmentId,
    });
};

export const useCreateSection = (assessmentId) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data) => assessmentSectionService.createSection(assessmentId, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['adminSections', assessmentId]);
            queryClient.invalidateQueries(['adminAssessments']);
        },
    });
};

export const useUpdateSection = (assessmentId) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ sectionId, data }) => assessmentSectionService.updateSection(sectionId, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['adminSections', assessmentId]);
        },
    });
};

export const useDeleteSection = (assessmentId) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (sectionId) => assessmentSectionService.deleteSection(sectionId),
        onSuccess: () => {
            queryClient.invalidateQueries(['adminSections', assessmentId]);
            // Also invalidate questions since they get moved to unsectioned
            queryClient.invalidateQueries(['adminAssessmentQuestions', assessmentId]);
        },
    });
};

export const useAddQuestionToSection = (assessmentId) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ sectionId, data }) => 
            assessmentSectionService.addQuestionToSection(assessmentId, sectionId, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['adminSections', assessmentId]);
            queryClient.invalidateQueries(['adminAssessmentQuestions', assessmentId]);
            queryClient.invalidateQueries(['adminAssessments']); // total questions might change
        },
    });
};

export const useMoveQuestionToSection = (assessmentId) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ sectionId, assessmentQuestionId }) => 
            assessmentSectionService.moveQuestionToSection(sectionId, assessmentQuestionId),
        onSuccess: () => {
            queryClient.invalidateQueries(['adminSections', assessmentId]);
            queryClient.invalidateQueries(['adminAssessmentQuestions', assessmentId]);
        },
    });
};

export const useMoveQuestion = (assessmentId) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ questionId, sectionId }) =>
            assessmentSectionService.moveQuestion(assessmentId, questionId, sectionId),
        onSuccess: () => {
            queryClient.invalidateQueries(['adminSections', assessmentId]);
            queryClient.invalidateQueries(['adminAssessmentQuestions', assessmentId]);
        },
    });
};
