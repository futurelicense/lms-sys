import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import gamificationService from '../services/gamificationService';
import { QUERY_KEYS } from '../../../constants/appConstants';

const GAMIFICATION_KEYS = {
  all: QUERY_KEYS.GAMIFICATION,
  summary: () => [...QUERY_KEYS.GAMIFICATION, 'summary'],
  badges: () => [...QUERY_KEYS.GAMIFICATION, 'badges'],
  milestones: () => [...QUERY_KEYS.GAMIFICATION, 'milestones'],
  streak: () => [...QUERY_KEYS.GAMIFICATION, 'streak'],
  points: (params) => [...QUERY_KEYS.GAMIFICATION, 'points', params],
  adminBadges: () => [...QUERY_KEYS.GAMIFICATION, 'admin', 'badges'],
  adminLevels: () => [...QUERY_KEYS.GAMIFICATION, 'admin', 'levels'],
  adminMilestones: () => [...QUERY_KEYS.GAMIFICATION, 'admin', 'milestones'],
  adminPointRules: () => [...QUERY_KEYS.GAMIFICATION, 'admin', 'point-rules'],
};

// ─── Student Hooks ───────────────────────────────────────────────────────────

export const useGamificationSummary = () =>
  useQuery({
    queryKey: GAMIFICATION_KEYS.summary(),
    queryFn: () => gamificationService.getSummary(),
  });

export const useStudentBadges = () =>
  useQuery({
    queryKey: GAMIFICATION_KEYS.badges(),
    queryFn: () => gamificationService.getBadges(),
  });

export const useStudentMilestones = () =>
  useQuery({
    queryKey: GAMIFICATION_KEYS.milestones(),
    queryFn: () => gamificationService.getMilestones(),
  });

export const useStudentStreak = () =>
  useQuery({
    queryKey: GAMIFICATION_KEYS.streak(),
    queryFn: () => gamificationService.getStreak(),
  });

export const usePointsHistory = (params = { page: 0, size: 10 }) =>
  useQuery({
    queryKey: GAMIFICATION_KEYS.points(params),
    queryFn: () => gamificationService.getPointsHistory(params),
    placeholderData: (previous) => previous,
  });

// ─── Admin Hooks ─────────────────────────────────────────────────────────────

export const useAdminBadges = () =>
  useQuery({
    queryKey: GAMIFICATION_KEYS.adminBadges(),
    queryFn: () => gamificationService.listBadges(),
  });

export const useCreateBadge = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => gamificationService.createBadge(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GAMIFICATION_KEYS.adminBadges() });
      queryClient.invalidateQueries({ queryKey: GAMIFICATION_KEYS.badges() });
    },
  });
};

export const useUpdateBadge = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => gamificationService.updateBadge(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GAMIFICATION_KEYS.adminBadges() });
      queryClient.invalidateQueries({ queryKey: GAMIFICATION_KEYS.badges() });
    },
  });
};

export const useDeleteBadge = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => gamificationService.deleteBadge(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GAMIFICATION_KEYS.adminBadges() });
      queryClient.invalidateQueries({ queryKey: GAMIFICATION_KEYS.badges() });
    },
  });
};

export const useAdminLevels = () =>
  useQuery({
    queryKey: GAMIFICATION_KEYS.adminLevels(),
    queryFn: () => gamificationService.listLevels(),
  });

export const useCreateLevel = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => gamificationService.createLevel(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GAMIFICATION_KEYS.adminLevels() });
      queryClient.invalidateQueries({ queryKey: GAMIFICATION_KEYS.summary() });
    },
  });
};

export const useUpdateLevel = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => gamificationService.updateLevel(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GAMIFICATION_KEYS.adminLevels() });
      queryClient.invalidateQueries({ queryKey: GAMIFICATION_KEYS.summary() });
    },
  });
};

export const useDeleteLevel = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => gamificationService.deleteLevel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GAMIFICATION_KEYS.adminLevels() });
      queryClient.invalidateQueries({ queryKey: GAMIFICATION_KEYS.summary() });
    },
  });
};

export const useAdminMilestones = () =>
  useQuery({
    queryKey: GAMIFICATION_KEYS.adminMilestones(),
    queryFn: () => gamificationService.listMilestones(),
  });

export const useCreateMilestone = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => gamificationService.createMilestone(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GAMIFICATION_KEYS.adminMilestones() });
      queryClient.invalidateQueries({ queryKey: GAMIFICATION_KEYS.milestones() });
    },
  });
};

export const useUpdateMilestone = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => gamificationService.updateMilestone(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GAMIFICATION_KEYS.adminMilestones() });
      queryClient.invalidateQueries({ queryKey: GAMIFICATION_KEYS.milestones() });
    },
  });
};

export const useDeleteMilestone = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => gamificationService.deleteMilestone(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GAMIFICATION_KEYS.adminMilestones() });
      queryClient.invalidateQueries({ queryKey: GAMIFICATION_KEYS.milestones() });
    },
  });
};

export const useAdminPointRules = () =>
  useQuery({
    queryKey: GAMIFICATION_KEYS.adminPointRules(),
    queryFn: () => gamificationService.listPointRules(),
  });

export const useUpdatePointRule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => gamificationService.updatePointRule(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GAMIFICATION_KEYS.adminPointRules() });
    },
  });
};
