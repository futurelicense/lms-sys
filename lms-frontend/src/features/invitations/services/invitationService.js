import { http } from '../../../services/api/axiosInstance';
import { API_ENDPOINTS } from '../../../constants/apiEndpoints';

/**
 * Normalizes an InvitationResponse from the backend.
 *
 * Backend shape: { id, userId, name, email, roles: Set<String>, status, expiresAt, acceptedAt, invitedBy, createdAt }
 * The UI expects `roleName` for display — derived from roles[0].
 */
function normalizeInvitation(inv) {
  if (!inv) return inv;
  const roles = Array.isArray(inv.roles) ? inv.roles : [...(inv.roles ?? [])];
  return {
    ...inv,
    // Convenience field: first role name for display
    roleName: roles[0] ?? '—',
  };
}

export const invitationService = {
  /**
   * GET /invitations?page=&size=&sort=
   * Backend returns PageResponse<InvitationResponse>.
   * Note: backend does NOT support status/search query params — filter client-side.
   */
  list: async (params) => {
    const res = await http.get(API_ENDPOINTS.invitations.base, {
      params: {
        page: params?.page ?? 0,
        size: params?.size ?? 20,
        sort: 'createdAt,desc',
      },
    });
    // Normalize every invitation in the page
    return {
      ...res,
      content: (res?.content ?? []).map(normalizeInvitation),
    };
  },

  /**
   * POST /invitations
   * Backend CreateInvitationRequest: { name, email, role }
   * `role` is the ROLE NAME (e.g. "INSTRUCTOR"), NOT a UUID.
   */
  invite: async ({ name, email, role }) => {
    const inv = await http.post(API_ENDPOINTS.invitations.base, { name, email, role });
    return normalizeInvitation(inv);
  },

  /** GET /invitations/{id} */
  getById: async (id) => normalizeInvitation(await http.get(API_ENDPOINTS.invitations.byId(id))),

  /** POST /invitations/{id}/resend */
  resend: async (id) => normalizeInvitation(await http.post(API_ENDPOINTS.invitations.resend(id))),

  /** DELETE /invitations/{id} — withdraws invitation and removes the pending account */
  revoke: async (id) => http.delete(API_ENDPOINTS.invitations.byId(id)),
};

export default invitationService;
