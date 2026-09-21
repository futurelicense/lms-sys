import { http } from '../../../services/api/axiosInstance';
import { API_ENDPOINTS } from '../../../constants/apiEndpoints';

/**
 * UserResponse from backend: { id, name, email, phone, profileImageUrl,
 *   active, locked, activated, roles: Set<String>, createdAt }
 *
 * Note: backend uses `name` (not `fullName`). We normalize to add fullName.
 */
function normalizeUser(user) {
  if (!user) return user;
  return {
    ...user,
    fullName: user.fullName ?? user.name ?? '',
    roles: Array.isArray(user.roles) ? user.roles : [...(user.roles ?? [])],
  };
}

function normalizeList(res) {
  if (!res) return { content: [], totalPages: 0, totalElements: 0 };
  const content = (res.content ?? []).map(normalizeUser);
  return { ...res, content };
}

export const userService = {
  /**
   * GET /users?search=&active=&page=&size=
   * Backend accepts: search (String), active (Boolean).
   * Locked filter is NOT a backend param — we handle it client-side.
   */
  list: async ({ search, status, page = 0, size = 10 } = {}) => {
    const params = { page, size, sort: 'createdAt,desc' };
    if (search) params.search = search;
    // Map UI status filter to backend active param
    if (status === 'ACTIVE') params.active = true;
    if (status === 'INACTIVE') params.active = false;
    // LOCKED has no backend param — fetch all then filter client-side

    const res = await http.get(API_ENDPOINTS.users.base, { params });
    const normalized = normalizeList(res);

    // Client-side locked filter
    if (status === 'LOCKED') {
      normalized.content = normalized.content.filter((u) => u.locked);
    }
    return normalized;
  },

  /** GET /users/{id} */
  getById: async (id) => normalizeUser(await http.get(API_ENDPOINTS.users.byId(id))),

  /**
   * PATCH /users/{id} — update profile fields.
   * Backend UpdateUserRequest: { name, phone, profileImageUrl }
   */
  update: async (id, payload) =>
    normalizeUser(await http.patch(API_ENDPOINTS.users.byId(id), payload)),

  /** POST /users/{id}/activate */
  activate: async (id, reason) =>
    normalizeUser(await http.post(API_ENDPOINTS.users.activate(id), reason ? { reason } : {})),

  /** POST /users/{id}/deactivate */
  deactivate: async (id, reason) =>
    normalizeUser(await http.post(API_ENDPOINTS.users.deactivate(id), reason ? { reason } : {})),

  /** POST /users/{id}/lock */
  lock: async (id, reason) =>
    normalizeUser(await http.post(API_ENDPOINTS.users.lock(id), reason ? { reason } : {})),

  /** POST /users/{id}/unlock */
  unlock: async (id, reason) =>
    normalizeUser(await http.post(API_ENDPOINTS.users.unlock(id), reason ? { reason } : {})),

  /** DELETE /users/{id} */
  delete: async (id) => http.delete(API_ENDPOINTS.users.byId(id)),

  /** GET /users/{id}/status-history */
  getStatusHistory: async (id) => http.get(API_ENDPOINTS.users.statusHistory(id)),

  /**
   * PUT /users/{id}/roles
   * Backend UpdateUserRolesRequest: { roleIds: [UUID] }
   */
  updateRoles: async (id, roleIds) =>
    normalizeUser(await http.put(API_ENDPOINTS.users.roles(id), { roleIds })),

  /**
   * POST /users/me/password
   * Backend ChangePasswordRequest: { currentPassword, newPassword }
   * Used by SetPasswordPage for invited users and SecurityPage for regular changes.
   */
  changePassword: async ({ currentPassword, newPassword }) =>
    http.post(API_ENDPOINTS.users.changePassword, { currentPassword, newPassword }),
};

export default userService;
