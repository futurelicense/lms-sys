import { http } from '../../../services/api/axiosInstance';
import { API_ENDPOINTS } from '../../../constants/apiEndpoints';

export const authService = {
  /** POST /auth/login → ApiResponse<LoginResponse> { tokens, user, mustChangePassword } */
  login: (credentials) => http.post(API_ENDPOINTS.auth.login, credentials),

  /** POST /auth/logout */
  logout: (payload) => http.post(API_ENDPOINTS.auth.logout, payload ?? {}),

  /** POST /auth/logout-all */
  logoutEverywhere: () => http.post(API_ENDPOINTS.auth.logoutAll),

  /** POST /auth/refresh */
  refresh: (payload) => http.post(API_ENDPOINTS.auth.refresh, payload),

  /** GET /auth/me → ApiResponse<CurrentUserResponse> { user, roles, permissions } */
  getCurrentUser: () => http.get(API_ENDPOINTS.auth.me),

  /** GET /auth/sessions → ApiResponse<List<SessionResponse>> */
  getSessions: () => http.get(API_ENDPOINTS.auth.sessions),

  /** DELETE /auth/sessions/{sessionId} */
  revokeSession: (sessionId) => http.delete(API_ENDPOINTS.auth.revokeSession(sessionId)),

  /** POST /auth/forgot-password */
  forgotPassword: (payload) => http.post(API_ENDPOINTS.auth.forgotPassword, payload),

  /**
   * POST /auth/reset-password
   * Backend expects { token, newPassword } — NOT password.
   */
  resetPassword: ({ token, newPassword }) =>
    http.post(API_ENDPOINTS.auth.resetPassword, { token, newPassword }),

  /**
   * POST /auth/accept-invitation  (public — no JWT needed)
   * Body: { token, newPassword }
   * Returns LoginResponse { tokens, user, mustChangePassword: false }
   * so the user is immediately authenticated after setting their password.
   */
  acceptInvitation: ({ token, newPassword }) =>
    http.post(API_ENDPOINTS.auth.acceptInvitation, { token, newPassword }),
};

export default authService;
