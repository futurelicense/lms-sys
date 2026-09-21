import { http } from '../../../services/api/axiosInstance';
import { API_ENDPOINTS } from '../../../constants/apiEndpoints';

/**
 * RoleResponse from backend: { id, name, description, permissions: List<PermissionResponse> }
 * PermissionResponse: { id, name, description, authority }
 */

export const roleService = {
  /** GET /roles → List<RoleResponse> (not paginated) */
  /** GET /roles → List<RoleResponse> (not paginated) */
  list: async (params) => http.get(API_ENDPOINTS.roles.base, { params }),

  /** GET /roles/{id} */
  getById: async (id) => http.get(API_ENDPOINTS.roles.byId(id)),

  /** POST /roles */
  create: async (payload) => http.post(API_ENDPOINTS.roles.base, payload),

  /**
   * PATCH /roles/{id} — backend is PATCH not PUT.
   * UpdateRoleRequest: { description, permissionIds }
   */
  update: async (id, payload) => http.patch(API_ENDPOINTS.roles.byId(id), payload),

  /** DELETE /roles/{id} */
  delete: async (id) => http.delete(API_ENDPOINTS.roles.byId(id)),

  // ─── Permission CRUD ───────────────────────────────────────────────────────

  /**
   * GET /permissions — NOT /roles/permissions (that endpoint doesn't exist).
   * Returns List<PermissionResponse>: { id, name, description, authority }
   */
  listPermissions: async () => http.get(API_ENDPOINTS.permissions.base),

  /** POST /permissions */
  createPermission: async (payload) => http.post(API_ENDPOINTS.permissions.base, payload),

  /**
   * PATCH /permissions/{id} — backend is PATCH not PUT.
   * UpdatePermissionRequest: { description }
   */
  updatePermission: async (id, payload) => http.patch(API_ENDPOINTS.permissions.byId(id), payload),

  /** DELETE /permissions/{id} */
  deletePermission: async (id) => http.delete(API_ENDPOINTS.permissions.byId(id)),
};

export default roleService;
