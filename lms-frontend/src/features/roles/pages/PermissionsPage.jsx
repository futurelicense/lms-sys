import { useCallback, useEffect, useState } from 'react';
import { Search, Plus, Pencil, Trash2, MoreVertical } from 'lucide-react';
import AdminButton from '../../../components/ui/AdminButton';
import AdminInput from '../../../components/ui/AdminInput';
import { AdminModal, AdminConfirmModal } from '../../../components/ui/AdminModal';
import PermissionGuard from '../../../guards/PermissionGuard';
import { PERMISSIONS } from '../../../constants/permissions';
import roleService from '../services/roleService';
import { useToast } from '../../../components/feedback/Toast';

/* ───  design tokens ──────────────────────────────────────────── */
const M = {
  primary: 'var(--color-primary-500, #7367f0)',
  primarySoft: 'var(--surface-medium)',
  card: 'var(--surface-dark)',
  textMain: 'var(--text-primary)',
  textMuted: 'var(--text-muted)',
  border: 'var(--border-color)',
  shadow: 'var(--shadow-dark)',
  cardShadow: '0 2px 10px 0 rgba(0,0,0,0.1)',
  radius: 8,
};

/* ─── Pastel badge palette keyed by role name ───────────────────────── */
const ROLE_BADGE = [
  { bg: 'rgba(115, 103, 240, 0.15)', color: '#7367f0' },
  { bg: 'rgba(255, 159, 67, 0.15)', color: '#ff9f43' },
  { bg: 'rgba(0, 207, 232, 0.15)', color: '#00cfe8' },
  { bg: 'rgba(40, 199, 111, 0.15)', color: '#28c76f' },
  { bg: 'rgba(234, 84, 85, 0.15)', color: '#ea5455' },
  { bg: 'rgba(33, 150, 243, 0.15)', color: '#2196f3' },
  { bg: 'rgba(156, 39, 176, 0.15)', color: '#d05ce3' },
];

function roleBadgeStyle(name = '') {
  const h = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return ROLE_BADGE[h % ROLE_BADGE.length];
}

function formatDateTime(str) {
  if (!str) return '—';
  return new Date(str).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/* ─── Main page ──────────────────────────────────────────────────────── */
export const PermissionsPage = () => {
  const { success: toastSuccess, error: toastError } = useToast();

  const [permissions, setPermissions] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');

  const [editPerm, setEditPerm] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [permName, setPermName] = useState('');
  const [permDescription, setPermDescription] = useState('');
  const [permAuthority, setPermAuthority] = useState('');
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState('');

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [page, setPage] = useState(0);
  const PAGE_SIZE = 10;

  const toArr = (r) =>
    Array.isArray(r?.items)
      ? r.items
      : Array.isArray(r?.content)
        ? r.content
        : Array.isArray(r)
          ? r
          : [];

  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const [permsRes, rolesRes] = await Promise.all([
        roleService.listPermissions(),
        roleService.list(),
      ]);
      setPermissions(toArr(permsRes));
      setRoles(toArr(rolesRes));
    } catch (err) {
      setLoadError(err?.message ?? 'Failed to load permissions.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = search
    ? permissions.filter((p) => {
        const q = search.toLowerCase();
        return (
          p.name?.toLowerCase().includes(q) ||
          p.authority?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q)
        );
      })
    : permissions;

  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  /** Build a map: permissionId → [roles that have this permission] */
  const permRolesMap = {};
  roles.forEach((role) => {
    (role.permissions ?? []).forEach((p) => {
      // p can be either a string (authority name) or an object with an authority/name/id
      const authorityStr = typeof p === 'string' ? p : (p.name ?? p.authority);
      const permObj = permissions.find(
        (x) => x.name === authorityStr || x.authority === authorityStr || x.id === (p.id ?? p),
      );
      if (permObj) {
        if (!permRolesMap[permObj.id]) permRolesMap[permObj.id] = [];
        if (!permRolesMap[permObj.id].find((r) => r.id === role.id))
          permRolesMap[permObj.id].push(role);
      }
    });
  });

  const openCreate = () => {
    setEditPerm(null);
    setPermName('');
    setPermDescription('');
    setPermAuthority('');
    setModalError('');
    setModalOpen(true);
  };
  const openEdit = (perm) => {
    setEditPerm(perm);
    setPermName(perm.name ?? '');
    setPermDescription(perm.description ?? '');
    setPermAuthority(perm.authority ?? '');
    setModalError('');
    setModalOpen(true);
  };

  const handleSave = async () => {
    setModalError('');
    if (!permName.trim()) {
      setModalError('Permission name is required.');
      return;
    }
    if (!permDescription.trim()) {
      setModalError('Description is required.');
      return;
    }
    if (!permAuthority.trim()) {
      setModalError('Authority identifier is required.');
      return;
    }
    const authority = permAuthority.trim().toUpperCase().replace(/\s+/g, '_');
    setSaving(true);
    try {
      if (editPerm) {
        await roleService.updatePermission(editPerm.id, {
          name: permName.trim(),
          description: permDescription.trim(),
          authority,
        });
        toastSuccess(`Permission "${permName}" updated.`);
      } else {
        await roleService.createPermission({
          name: permName.trim(),
          description: permDescription.trim(),
          authority,
        });
        toastSuccess(`Permission "${permName}" created.`);
      }
      setModalOpen(false);
      loadData();
    } catch (err) {
      setModalError(err?.message ?? 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await roleService.deletePermission(deleteTarget.id);
      toastSuccess(`Permission "${deleteTarget.name}" deleted.`);
      setDeleteTarget(null);
      loadData();
    } catch (err) {
      toastError(err?.message ?? 'Failed.');
      setDeleting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Card wrapper */}
      <div
        style={{
          background: M.card,
          borderRadius: M.radius,
          boxShadow: M.cardShadow,
          overflow: 'hidden',
        }}
      >
        {/* Toolbar */}
        <div
          style={{
            padding: '16px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: `1px solid ${M.border}`,
          }}
        >
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <Search
              size={15}
              style={{
                position: 'absolute',
                left: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                color: M.textMuted,
              }}
            />
            <input
              type="text"
              placeholder="Search Permissions"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              style={{
                paddingLeft: 32,
                paddingRight: 12,
                paddingTop: 7,
                paddingBottom: 7,
                fontSize: 13,
                border: `1px solid ${M.border}`,
                borderRadius: 6,
                outline: 'none',
                width: 220,
                color: M.textMain,
                background: 'var(--input-bg)',
              }}
            />
          </div>
          {/* Add button */}
          <PermissionGuard required={[PERMISSIONS.ROLE_WRITE]} fallback={null}>
            <button
              onClick={openCreate}
              style={{
                background: M.primary,
                color: 'var(--lms-primary-foreground, #fff)',
                border: 'none',
                borderRadius: 6,
                padding: '9px 20px',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'opacity 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              <Plus size={15} /> Add Permission
            </button>
          </PermissionGuard>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--surface-medium)' }}>
                {['NAME', 'ASSIGNED TO', 'CREATED DATE', 'ACTIONS'].map((h, i) => (
                  <th
                    key={i}
                    style={{
                      padding: '10px 20px',
                      textAlign: 'left',
                      fontSize: 11,
                      fontWeight: 700,
                      color: M.textMuted,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={4}
                    style={{
                      padding: '40px 20px',
                      textAlign: 'center',
                      color: M.textMuted,
                      fontSize: 13,
                    }}
                  >
                    Loading permissions…
                  </td>
                </tr>
              ) : loadError ? (
                <tr>
                  <td
                    colSpan={4}
                    style={{
                      padding: '40px 20px',
                      textAlign: 'center',
                      color: '#ea5455',
                      fontSize: 13,
                    }}
                  >
                    {loadError}
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    style={{
                      padding: '40px 20px',
                      textAlign: 'center',
                      color: M.textMuted,
                      fontSize: 13,
                    }}
                  >
                    No permissions found.
                  </td>
                </tr>
              ) : (
                paginated.map((perm) => {
                  const assignedRoles = permRolesMap[perm.id] ?? [];
                  return (
                    <tr
                      key={perm.id}
                      style={{
                        borderTop: `1px solid ${M.border}`,
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--hover-bg)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      {/* Name */}
                      <td style={{ padding: '14px 20px' }}>
                        <p style={{ fontSize: 14, fontWeight: 600, color: M.textMain, margin: 0 }}>
                          {perm.name}
                        </p>
                        {perm.description && (
                          <p
                            style={{
                              fontSize: 12,
                              color: M.textMuted,
                              margin: '2px 0 0',
                              maxWidth: 300,
                            }}
                          >
                            {perm.description}
                          </p>
                        )}
                      </td>

                      {/* Assigned roles */}
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {assignedRoles.length === 0 ? (
                            <span style={{ fontSize: 12, color: M.textMuted }}>—</span>
                          ) : (
                            assignedRoles.map((role) => {
                              const style = roleBadgeStyle(role.name ?? '');
                              return (
                                <span
                                  key={role.id}
                                  style={{
                                    background: style.bg,
                                    color: style.color,
                                    padding: '3px 10px',
                                    borderRadius: 4,
                                    fontSize: 12,
                                    fontWeight: 600,
                                  }}
                                >
                                  {role.name}
                                </span>
                              );
                            })
                          )}
                        </div>
                      </td>

                      {/* Created date */}
                      <td
                        style={{
                          padding: '14px 20px',
                          fontSize: 13,
                          color: 'var(--text-secondary)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {formatDateTime(perm.createdAt)}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', gap: 2 }}>
                          <PermissionGuard required={[PERMISSIONS.ROLE_WRITE]} fallback={null}>
                            <button
                              onClick={() => openEdit(perm)}
                              title="Edit"
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: 6,
                                borderRadius: 6,
                                color: M.textMuted,
                                display: 'flex',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = M.primarySoft;
                                e.currentTarget.style.color = M.primary;
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'none';
                                e.currentTarget.style.color = M.textMuted;
                              }}
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(perm)}
                              title="Delete"
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: 6,
                                borderRadius: 6,
                                color: M.textMuted,
                                display: 'flex',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(234, 84, 85, 0.1)';
                                e.currentTarget.style.color = '#ea5455';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'none';
                                e.currentTarget.style.color = M.textMuted;
                              }}
                            >
                              <Trash2 size={16} />
                            </button>
                          </PermissionGuard>
                          <button
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: 6,
                              borderRadius: 6,
                              color: M.textMuted,
                              display: 'flex',
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.background = 'var(--hover-bg)')
                            }
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                          >
                            <MoreVertical size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div
          style={{
            padding: '12px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: `1px solid ${M.border}`,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 13,
              color: M.textMuted,
            }}
          >
            Rows per page: <strong style={{ color: M.textMain }}>{PAGE_SIZE}</strong>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 13,
              color: M.textMuted,
            }}
          >
            <span>
              {filtered.length === 0
                ? '0'
                : `${page * PAGE_SIZE + 1}–${Math.min((page + 1) * PAGE_SIZE, filtered.length)}`}{' '}
              of {filtered.length}
            </span>
            {['‹', '›'].map((ch, i) => (
              <button
                key={i}
                disabled={i === 0 ? page === 0 : page >= totalPages - 1}
                onClick={() =>
                  setPage((p) => (i === 0 ? Math.max(0, p - 1) : Math.min(totalPages - 1, p + 1)))
                }
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '2px 8px',
                  borderRadius: 4,
                  fontSize: 18,
                  color: M.textMain,
                  opacity: (i === 0 ? page === 0 : page >= totalPages - 1) ? 0.3 : 1,
                }}
              >
                {ch}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Create / Edit Modal */}
      {modalOpen && (
        <AdminModal
          open
          onClose={() => setModalOpen(false)}
          title={editPerm ? 'Edit Permission' : 'Create Permission'}
          description={editPerm ? `Editing "${editPerm.name}"` : 'Define a new granular authority'}
          footer={
            <>
              <AdminButton variant="outline" onClick={() => setModalOpen(false)} disabled={saving}>
                Cancel
              </AdminButton>
              <AdminButton onClick={handleSave} loading={saving}>
                {editPerm ? 'Save changes' : 'Create permission'}
              </AdminButton>
            </>
          }
        >
          {modalError && (
            <div
              style={{
                marginBottom: 20,
                borderRadius: 12,
                border: '1px solid rgba(239,68,68,0.3)',
                background: 'rgba(239,68,68,0.1)',
                padding: '12px 16px',
              }}
            >
              <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: '#f87171' }}>
                {modalError}
              </p>
            </div>
          )}
          <div className="space-y-5">
            <AdminInput
              label="Permission name"
              value={permName}
              onChange={(e) => setPermName(e.target.value)}
              placeholder="e.g. Create Course"
              autoFocus
            />
            <AdminInput
              label="Description"
              value={permDescription}
              onChange={(e) => setPermDescription(e.target.value)}
              placeholder="What this permission allows users to do"
            />
            <AdminInput
              label="Authority identifier"
              value={permAuthority}
              onChange={(e) => setPermAuthority(e.target.value)}
              placeholder="e.g. COURSE_CREATE"
              hint="Uppercase with underscores. Used in role-based access checks."
            />
          </div>
        </AdminModal>
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <AdminConfirmModal
          open
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          title="Delete Permission"
          message={`Are you sure you want to delete "${deleteTarget.name}"? This cannot be undone and may affect roles that use this permission.`}
          confirmLabel="Delete"
          variant="danger"
          loading={deleting}
        />
      )}
    </div>
  );
};

export default PermissionsPage;
