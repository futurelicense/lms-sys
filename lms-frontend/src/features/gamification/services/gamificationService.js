import { http } from '../../../services/api/axiosInstance';
import { API_ENDPOINTS } from '../../../constants/apiEndpoints';

export const gamificationService = {
  // Student operations
  getSummary: () => http.get(API_ENDPOINTS.gamification.summary),
  getBadges: () => http.get(API_ENDPOINTS.gamification.badges),
  getMilestones: () => http.get(API_ENDPOINTS.gamification.milestones),
  getStreak: () => http.get(API_ENDPOINTS.gamification.streak),
  getPointsHistory: (params) => http.get(API_ENDPOINTS.gamification.points, { params }),
  getLeaderboard: (params) => http.get(API_ENDPOINTS.gamification.leaderboard, { params }),

  // Admin operations
  listBadges: () => http.get(API_ENDPOINTS.gamification.admin.badges),
  createBadge: (data) => http.post(API_ENDPOINTS.gamification.admin.badges, data),
  updateBadge: (id, data) => http.put(API_ENDPOINTS.gamification.admin.badgeById(id), data),
  deleteBadge: (id) => http.delete(API_ENDPOINTS.gamification.admin.badgeById(id)),

  listLevels: () => http.get(API_ENDPOINTS.gamification.admin.levels),
  createLevel: (data) => http.post(API_ENDPOINTS.gamification.admin.levels, data),
  updateLevel: (id, data) => http.put(API_ENDPOINTS.gamification.admin.levelById(id), data),
  deleteLevel: (id) => http.delete(API_ENDPOINTS.gamification.admin.levelById(id)),

  listMilestones: () => http.get(API_ENDPOINTS.gamification.admin.milestones),
  createMilestone: (data) => http.post(API_ENDPOINTS.gamification.admin.milestones, data),
  updateMilestone: (id, data) => http.put(API_ENDPOINTS.gamification.admin.milestoneById(id), data),
  deleteMilestone: (id) => http.delete(API_ENDPOINTS.gamification.admin.milestoneById(id)),

  listPointRules: () => http.get(API_ENDPOINTS.gamification.admin.pointRules),
  updatePointRule: (id, data) => http.put(API_ENDPOINTS.gamification.admin.pointRuleById(id), data),
};

export default gamificationService;
