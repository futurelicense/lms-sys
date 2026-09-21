import { useCallback, useEffect, useState } from 'react';
import {
  Search,
  Users as UsersIcon,
  MoreVertical,
  Lock,
  Unlock,
  UserCheck,
  UserX,
  History,
  ShieldCheck,
  Pencil,
  Mail,
  Trash2,
} from 'lucide-react';
import AdminButton from '../../../components/ui/AdminButton';
import AdminBadge from '../../../components/ui/AdminBadge';
import AdminInput from '../../../components/ui/AdminInput';
import { AdminModal, AdminConfirmModal } from '../../../components/ui/AdminModal';
import AdminPagination, {
  AdminEmptyState,
  AdminErrorState,
} from '../../../components/ui/AdminPagination';
import { AdminTableSkeleton } from '../../../components/ui/AdminSkeleton';
import PermissionGuard from '../../../guards/PermissionGuard';
import { PERMISSIONS } from '../../../constants/permissions';
import userService from '../services/userService';
import roleService from '../../roles/services/roleService';
import { useToast } from '../../../components/feedback/Toast';

/* ─── helpers ─── */

function getInitials(name = '') {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

const AVATAR_COLORS = [
  'bg-brand-100 text-brand-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-sky-100 text-sky-700',
  'bg-rose-100 text-rose-700',
  'bg-violet-100 text-violet-700',
];



function formatDate(str) {
  if (!str) return '—';
  return new Date(str).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatDateTime(str) {
  if (!str) return '—';
  return new Date(str).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function StatusBadge({ user }) {
  if (user?.locked)
    return (
      <AdminBadge variant="danger" dot>
        Locked
      </AdminBadge>
    );
  if (!user?.active)
    return (
      <AdminBadge variant="neutral" dot>
        Inactive
      </AdminBadge>
    );
  return (
    <AdminBadge variant="success" dot>
      Active
    </AdminBadge>
  );
}

function MenuItem({ icon, label, onClick, danger = false }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        width: '100%',
        alignItems: 'center',
        gap: 10,
        padding: '8px 12px',
        fontSize: 13,
        textAlign: 'left',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        color: danger ? '#f87171' : 'var(--text-secondary)',
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.background = danger ? 'rgba(239,68,68,0.08)' : 'var(--hover-bg)')
      }
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      {icon}
      {label}
    </button>
  );
}

const STATUS_FILTERS = ['ALL', 'ACTIVE', 'LOCKED', 'INACTIVE'];

/* ─── component ─── */

export const UserListPage = () => {
  const { success: toastSuccess, error: toastError } = useToast();

  // List state
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 10;
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Action menu
  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuOpenUpward, setMenuOpenUpward] = useState(false);

  // Confirm action modal
  const [confirmAction, setConfirmAction] = useState(null);
  // { user, type: 'activate'|'deactivate'|'lock'|'unlock', loading }

  // Status history modal
  const [statusHistory, setStatusHistory] = useState(null); // { user, history: [] }
  const [historyLoading, setHistoryLoading] = useState(false);

  // Edit user modal
  const [editUser, setEditUser] = useState(null);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  // Edit roles modal
  const [rolesUser, setRolesUser] = useState(null);
  const [allRoles, setAllRoles] = useState([]);
  const [selectedRoleIds, setSelectedRoleIds] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [rolesSaving, setRolesSaving] = useState(false);

  /* ─── data fetching ─── */

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const res = await userService.list({
        page,
        size: pageSize,
        search: search || undefined,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
      });
      // userService normalizes all responses to { content, totalPages, totalElements }
      const content = Array.isArray(res?.content)
        ? res.content
        : Array.isArray(res?.items)
          ? res.items
          : Array.isArray(res)
            ? res
            : [];
      setUsers(content);
      setTotalPages(res?.totalPages ?? (content.length > 0 ? 1 : 0));
      setTotalElements(res?.totalElements ?? content.length);
    } catch (err) {
      setLoadError(err?.message ?? 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, statusFilter]);

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, search, statusFilter]);

  // Close action menu on outside click
  useEffect(() => {
    if (!openMenuId) return;
    const handler = () => setOpenMenuId(null);
    window.addEventListener('click', handler);
    return () => window.removeEventListener('click', handler);
  }, [openMenuId]);

  /* ─── search / filter ─── */

  const handleSearch = () => {
    setPage(0);
    setSearch(searchInput);
  };
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch();
  };
  const handleStatusFilter = (status) => {
    setPage(0);
    setStatusFilter(status);
  };

  /* ─── confirm actions ─── */

  const doConfirmAction = async () => {
    if (!confirmAction) return;
    setConfirmAction((a) => ({ ...a, loading: true }));
    const { user: u, type } = confirmAction;
    try {
      if (type === 'activate') await userService.activate(u.id);
      if (type === 'deactivate') await userService.deactivate(u.id);
      if (type === 'lock') await userService.lock(u.id);
      if (type === 'unlock') await userService.unlock(u.id);
      if (type === 'delete') await userService.delete(u.id);
      toastSuccess(type === 'delete' ? `${u.fullName} has been removed.` : `${u.fullName} has been ${type}d.`);
      setConfirmAction(null);
      loadUsers();
    } catch (err) {
      toastError(err?.message ?? `Failed to ${type} user.`);
      setConfirmAction((a) => ({ ...a, loading: false }));
    }
  };

  /* ─── status history ─── */

  const openStatusHistory = async (u) => {
    setStatusHistory({ user: u, history: [] });
    setHistoryLoading(true);
    try {
      const history = await userService.getStatusHistory(u.id);
      setStatusHistory({ user: u, history: Array.isArray(history) ? history : [] });
    } catch (err) {
      toastError(err?.message ?? 'Failed to load status history.');
    } finally {
      setHistoryLoading(false);
    }
  };

  /* ─── edit user ─── */

  const openEditUser = (u) => {
    setEditUser(u);
    setEditFirstName(u.name?.split(' ')[0] ?? u.firstName ?? '');
    setEditLastName(u.name?.split(' ').slice(1).join(' ') ?? u.lastName ?? '');
    setEditEmail(u.email ?? '');
  };

  const handleSaveEdit = async () => {
    if (!editUser) return;
    setEditSaving(true);
    try {
      // Backend UpdateUserRequest accepts: name, phone, profileImageUrl
      const name = [editFirstName, editLastName].filter(Boolean).join(' ').trim() || editFirstName;
      await userService.update(editUser.id, { name });
      toastSuccess(`${editUser.fullName}'s profile has been updated.`);
      setEditUser(null);
      loadUsers();
    } catch (err) {
      toastError(err?.message ?? 'Failed to update user.');
    } finally {
      setEditSaving(false);
    }
  };

  /* ─── edit roles ─── */

  const openEditRoles = async (u) => {
    setRolesUser(u);
    // roles is Set<String> from backend — no IDs, just names.
    // We'll match by role name when saving.
    setSelectedRoleIds([]); // will be set to IDs after roles are loaded
    setRolesLoading(true);
    try {
      const roles = await roleService.list();
      const roleList = Array.isArray(roles?.items)
        ? roles.items
        : Array.isArray(roles?.content)
          ? roles.content
          : Array.isArray(roles)
            ? roles
            : [];
      setAllRoles(roleList);
      // Pre-select roles by matching name to ID
      const userRoleNames = Array.isArray(u.roles) ? u.roles : [];
      const preSelected = roleList.filter((r) => userRoleNames.includes(r.name)).map((r) => r.id);
      setSelectedRoleIds(preSelected);
    } catch (err) {
      toastError(err?.message ?? 'Failed to load roles.');
    } finally {
      setRolesLoading(false);
    }
  };

  const toggleRole = (roleId) => {
    setSelectedRoleIds((prev) =>
      prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId],
    );
  };

  const handleSaveRoles = async () => {
    if (!rolesUser) return;
    setRolesSaving(true);
    try {
      await userService.updateRoles(rolesUser.id, selectedRoleIds);
      toastSuccess(`Roles updated for ${rolesUser.fullName}.`);
      setRolesUser(null);
      loadUsers();
    } catch (err) {
      toastError(err?.message ?? 'Failed to update roles.');
    } finally {
      setRolesSaving(false);
    }
  };

  const confirmLabels = {
    activate: 'Activate',
    deactivate: 'Deactivate',
    lock: 'Lock',
    unlock: 'Unlock',
    delete: 'Remove User',
  };
  const confirmMessages = {
    activate: 'This user will regain access to the platform immediately.',
    deactivate: 'This user will lose access to the platform but their data is preserved.',
    lock: 'This user will be locked out and cannot sign in.',
    unlock: 'This user will be able to sign in again.',
    delete: 'Are you sure you want to remove this user? This action will remove the user from the active platform user directory.',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 20 }}>
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: 24,
              fontWeight: 700,
              color: 'var(--text-primary)',
              letterSpacing: '-0.5px',
            }}
          >
            Users
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--text-muted)' }}>
            Manage user accounts, roles, and access status.
          </p>
        </div>

      </div>

      {/* Filters bar */}
      <div className="card-base p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <AdminInput
              placeholder="Search by name or email…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleKeyDown}
              icon={<Search className="h-4 w-4" />}
            />
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {STATUS_FILTERS.map((s) => (
              <button
                key={s}
                onClick={() => handleStatusFilter(s)}
                style={{
                  borderRadius: 8,
                  padding: '6px 14px',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  fontFamily: 'Inter, sans-serif',
                  background: statusFilter === s ? '#ffffff' : 'var(--surface-medium)',
                  color: statusFilter === s ? '#000000' : 'var(--text-secondary)',
                  border:
                    statusFilter === s ? '1px solid #ffffff' : '1px solid var(--border-color)',
                }}
              >
                {s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
              </button>
            ))}
            <AdminButton size="sm" onClick={handleSearch}>
              Search
            </AdminButton>
          </div>
        </div>
      </div>

      {/* Table — fills remaining height */}
      <div
        className="card-base"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          minHeight: 0,
        }}
      >
        {loading ? (
          <div className="p-6">
            <AdminTableSkeleton rows={6} cols={5} />
          </div>
        ) : loadError ? (
          <AdminErrorState message={loadError} onRetry={loadUsers} />
        ) : users.length === 0 ? (
          <AdminEmptyState
            icon={<UsersIcon className="h-7 w-7" />}
            title="No users found"
            message={
              search || statusFilter !== 'ALL'
                ? 'Try adjusting your search or filter criteria.'
                : 'Users will appear here once invitations are accepted.'
            }
          />
        ) : (
          <>
            {/* Desktop table */}
            <div
              className="hidden md:flex"
              style={{ flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}
            >
              {/* Fixed header */}
              <table className="w-full" style={{ tableLayout: 'fixed' }}>
                <thead>
                  <tr
                    style={{
                      borderBottom: '1px solid var(--border-color)',
                      background: 'var(--surface-medium)',
                    }}
                  >
                    {['User', 'Status', 'Roles', 'Joined', 'Actions'].map((h, i) => (
                      <th
                        key={h}
                        style={{
                          padding: '12px 24px',
                          textAlign: i === 4 ? 'right' : 'left',
                          fontSize: 11,
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: '0.8px',
                          color: 'var(--text-muted)',
                          width: i === 0 ? '30%' : i === 4 ? '10%' : 'auto',
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
              </table>
              {/* Scrollable body */}
              <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
                <table className="w-full" style={{ tableLayout: 'fixed' }}>
                  <colgroup>
                    <col style={{ width: '30%' }} />
                    <col />
                    <col />
                    <col />
                    <col style={{ width: '10%' }} />
                  </colgroup>
                  <tbody style={{ display: 'table-row-group' }}>
                  {users.map((u) => (
                    <tr
                      key={u.id}
                      style={{
                        borderBottom: '1px solid var(--border-subtle)',
                        transition: 'background 0.1s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--hover-bg)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '14px 24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: '50%',
                              background: 'var(--surface-medium)',
                              border: '1px solid var(--border-color)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 13,
                              fontWeight: 700,
                              color: 'var(--text-secondary)',
                              flexShrink: 0,
                            }}
                          >
                            {getInitials(u.fullName ?? u.email ?? '?')}
                          </div>
                          <div>
                            <p
                              style={{
                                margin: 0,
                                fontSize: 14,
                                fontWeight: 600,
                                color: 'var(--text-primary)',
                              }}
                            >
                              {u.fullName}
                            </p>
                            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>
                              {u.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '14px 24px' }}>
                        <StatusBadge user={u} />
                      </td>
                      <td style={{ padding: '14px 24px' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {(u.roles ?? []).length > 0 ? (
                            (Array.isArray(u.roles) ? u.roles : [...(u.roles ?? [])]).map(
                              (roleName) => (
                                <span
                                  key={roleName}
                                  style={{
                                    borderRadius: 6,
                                    background: 'var(--surface-medium)',
                                    border: '1px solid var(--border-color)',
                                    padding: '2px 8px',
                                    fontSize: 12,
                                    fontWeight: 600,
                                    color: 'var(--text-secondary)',
                                  }}
                                >
                                  {roleName}
                                </span>
                              ),
                            )
                          ) : (
                            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                              No roles
                            </span>
                          )}
                        </div>
                      </td>
                      <td
                        style={{ padding: '14px 24px', fontSize: 13, color: 'var(--text-muted)' }}
                      >
                        {formatDate(u.createdAt)}
                      </td>
                      <td style={{ padding: '14px 24px', textAlign: 'right' }}>
                        <div style={{ position: 'relative', display: 'inline-block' }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (openMenuId === u.id) {
                                setOpenMenuId(null);
                              } else {
                                const rect = e.currentTarget.getBoundingClientRect();
                                setMenuOpenUpward(window.innerHeight - rect.bottom < 260);
                                setOpenMenuId(u.id);
                              }
                            }}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              color: 'var(--text-muted)',
                              padding: 6,
                              borderRadius: 6,
                              display: 'flex',
                              alignItems: 'center',
                            }}
                          >
                            <MoreVertical size={16} />
                          </button>
                          {openMenuId === u.id && (
                            <div
                              style={{
                                position: 'absolute',
                                right: 0,
                                ...(menuOpenUpward
                                  ? { bottom: 32, top: 'auto' }
                                  : { top: 36, bottom: 'auto' }),
                                zIndex: 50,
                                width: 160,
                                borderRadius: 8,
                                border: '1px solid var(--border-color)',
                                background: 'var(--surface-dark)',
                                padding: '4px 0',
                                boxShadow: '0 8px 30px rgba(0,0,0,0.35)',
                              }}
                            >
                              <PermissionGuard required={[PERMISSIONS.USER_WRITE]} fallback={null}>
                                <>
                                  {u.locked ? (
                                    <MenuItem
                                      icon={<Unlock size={14} />}
                                      label="Unlock"
                                      onClick={() => {
                                        setConfirmAction({
                                          user: u,
                                          type: 'unlock',
                                          loading: false,
                                        });
                                        setOpenMenuId(null);
                                      }}
                                    />
                                  ) : (
                                    <MenuItem
                                      icon={<Lock size={14} />}
                                      label="Lock"
                                      danger
                                      onClick={() => {
                                        setConfirmAction({ user: u, type: 'lock', loading: false });
                                        setOpenMenuId(null);
                                      }}
                                    />
                                  )}
                                  {u.active ? (
                                    <MenuItem
                                      icon={<UserX size={14} />}
                                      label="Deactivate"
                                      danger
                                      onClick={() => {
                                        setConfirmAction({
                                          user: u,
                                          type: 'deactivate',
                                          loading: false,
                                        });
                                        setOpenMenuId(null);
                                      }}
                                    />
                                  ) : (
                                    <MenuItem
                                      icon={<UserCheck size={14} />}
                                      label="Activate"
                                      onClick={() => {
                                        setConfirmAction({
                                          user: u,
                                          type: 'activate',
                                          loading: false,
                                        });
                                        setOpenMenuId(null);
                                      }}
                                    />
                                  )}
                                  <div
                                    style={{
                                      margin: '4px 0',
                                      borderTop: '1px solid var(--border-color)',
                                    }}
                                  />
                                  <MenuItem
                                    icon={<ShieldCheck size={14} />}
                                    label="Edit Roles"
                                    onClick={() => {
                                      openEditRoles(u);
                                      setOpenMenuId(null);
                                    }}
                                  />
                                  <MenuItem
                                    icon={<Pencil size={14} />}
                                    label="Edit Profile"
                                    onClick={() => {
                                      openEditUser(u);
                                      setOpenMenuId(null);
                                    }}
                                  />
                                  <MenuItem
                                    icon={<Trash2 size={14} />}
                                    label="Remove"
                                    danger
                                    onClick={() => {
                                      setConfirmAction({
                                        user: u,
                                        type: 'delete',
                                        loading: false,
                                      });
                                      setOpenMenuId(null);
                                    }}
                                  />
                                  <div
                                    style={{
                                      margin: '4px 0',
                                      borderTop: '1px solid var(--border-color)',
                                    }}
                                  />
                                </>
                              </PermissionGuard>
                              <MenuItem
                                icon={<History size={14} />}
                                label="Status History"
                                onClick={() => {
                                  openStatusHistory(u);
                                  setOpenMenuId(null);
                                }}
                              />
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile cards — scrollable */}
            <div className="md:hidden" style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
              {users.map((u) => (
                <div key={u.id} style={{ padding: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        background: 'var(--surface-medium)',
                        border: '1px solid var(--border-color)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 14,
                        fontWeight: 700,
                        color: 'var(--text-secondary)',
                        flexShrink: 0,
                      }}
                    >
                      {getInitials(u.fullName ?? u.email ?? '?')}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          margin: 0,
                          fontSize: 14,
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                        }}
                      >
                        {u.fullName}
                      </p>
                      <p
                        style={{
                          margin: 0,
                          fontSize: 12,
                          color: 'var(--text-muted)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {u.email}
                      </p>
                      <div
                        style={{
                          marginTop: 8,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          flexWrap: 'wrap',
                        }}
                      >
                        <StatusBadge user={u} />
                        {(Array.isArray(u.roles) ? u.roles : [...(u.roles ?? [])]).map(
                          (roleName) => (
                            <span
                              key={roleName}
                              style={{
                                borderRadius: 6,
                                background: 'var(--surface-medium)',
                                border: '1px solid var(--border-color)',
                                padding: '2px 8px',
                                fontSize: 12,
                                fontWeight: 600,
                                color: 'var(--text-secondary)',
                              }}
                            >
                              {roleName}
                            </span>
                          ),
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <PermissionGuard required={[PERMISSIONS.USER_WRITE]} fallback={null}>
                      <>
                        {u.locked ? (
                          <AdminButton
                            size="sm"
                            variant="outline"
                            icon={<Unlock className="h-3.5 w-3.5" />}
                            onClick={() =>
                              setConfirmAction({ user: u, type: 'unlock', loading: false })
                            }
                          >
                            Unlock
                          </AdminButton>
                        ) : (
                          <AdminButton
                            size="sm"
                            variant="outline"
                            icon={<Lock className="h-3.5 w-3.5" />}
                            onClick={() =>
                              setConfirmAction({ user: u, type: 'lock', loading: false })
                            }
                          >
                            Lock
                          </AdminButton>
                        )}
                        {u.active ? (
                          <AdminButton
                            size="sm"
                            variant="outline"
                            icon={<UserX className="h-3.5 w-3.5" />}
                            onClick={() =>
                              setConfirmAction({ user: u, type: 'deactivate', loading: false })
                            }
                          >
                            Deactivate
                          </AdminButton>
                        ) : (
                          <AdminButton
                            size="sm"
                            variant="outline"
                            icon={<UserCheck className="h-3.5 w-3.5" />}
                            onClick={() =>
                              setConfirmAction({ user: u, type: 'activate', loading: false })
                            }
                          >
                            Activate
                          </AdminButton>
                        )}
                        <AdminButton
                          size="sm"
                          variant="outline"
                          icon={<ShieldCheck className="h-3.5 w-3.5" />}
                          onClick={() => openEditRoles(u)}
                        >
                          Roles
                        </AdminButton>
                        <AdminButton
                          size="sm"
                          variant="outline"
                          icon={<Pencil className="h-3.5 w-3.5" />}
                          onClick={() => openEditUser(u)}
                        >
                          Edit
                        </AdminButton>
                        <AdminButton
                          size="sm"
                          variant="outline"
                          icon={<Trash2 className="h-3.5 w-3.5" />}
                          onClick={() =>
                            setConfirmAction({ user: u, type: 'delete', loading: false })
                          }
                        >
                          Remove
                        </AdminButton>
                      </>
                    </PermissionGuard>
                    <AdminButton
                      size="sm"
                      variant="ghost"
                      icon={<History className="h-3.5 w-3.5" />}
                      onClick={() => openStatusHistory(u)}
                    >
                      History
                    </AdminButton>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination — always visible at bottom */}
            <div style={{ borderTop: '1px solid var(--border-color)', padding: '12px 24px', flexShrink: 0 }}>
              <AdminPagination
                page={page}
                totalPages={totalPages}
                totalElements={totalElements}
                size={pageSize}
                onPageChange={setPage}
              />
            </div>
          </>
        )}
      </div>

      {/* ── Confirm action modal ── */}
      {confirmAction && (
        <AdminConfirmModal
          open
          onClose={() => setConfirmAction(null)}
          onConfirm={doConfirmAction}
          title={`${confirmLabels[confirmAction.type] ?? ''} ${confirmAction.user?.fullName ?? ''}`}
          message={confirmMessages[confirmAction.type] ?? ''}
          confirmLabel={confirmLabels[confirmAction.type] ?? 'Confirm'}
          variant={
            confirmAction.type === 'activate' || confirmAction.type === 'unlock'
              ? 'primary'
              : 'danger'
          }
          loading={confirmAction.loading}
        />
      )}

      {/* ── Status history modal ── */}
      {statusHistory && (
        <AdminModal
          open
          onClose={() => setStatusHistory(null)}
          title="Status History"
          description={`${statusHistory.user?.fullName ?? ''} · ${statusHistory.user?.email ?? ''}`}
          size="lg"
        >
          {historyLoading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-brand-600" />
            </div>
          ) : statusHistory.history.length === 0 ? (
            <AdminEmptyState
              icon={<History className="h-7 w-7" />}
              title="No history yet"
              message="No status changes have been recorded for this user."
            />
          ) : (
            <div className="space-y-0">
              {statusHistory.history.map((item, i) => (
                <div key={item.id ?? i} className="relative flex gap-4 pb-6 last:pb-0">
                  {i < statusHistory.history.length - 1 && (
                    <div
                      style={{
                        position: 'absolute',
                        left: 16,
                        top: 36,
                        bottom: 0,
                        width: 1,
                        background: 'var(--border-color)',
                      }}
                    />
                  )}
                  <div
                    style={{
                      display: 'flex',
                      width: 32,
                      height: 32,
                      flexShrink: 0,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '50%',
                      background:
                        item.action === 'LOCKED'
                          ? 'rgba(239,68,68,0.1)'
                          : item.action === 'DEACTIVATED'
                            ? 'var(--surface-medium)'
                            : item.action === 'UNLOCKED'
                              ? 'rgba(16,185,129,0.1)'
                              : 'rgba(59,130,246,0.1)',
                      color:
                        item.action === 'LOCKED'
                          ? '#f87171'
                          : item.action === 'DEACTIVATED'
                            ? 'var(--text-secondary)'
                            : item.action === 'UNLOCKED'
                              ? '#34d399'
                              : '#60a5fa',
                    }}
                  >
                    {item.action === 'LOCKED' ? (
                      <Lock size={16} />
                    ) : item.action === 'UNLOCKED' ? (
                      <Unlock size={16} />
                    ) : item.action === 'ACTIVATED' ? (
                      <UserCheck size={16} />
                    ) : (
                      <UserX size={16} />
                    )}
                  </div>
                  <div style={{ flex: 1, paddingTop: 2 }}>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 14,
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                      }}
                    >
                      {(item.action ?? '').replace(/_/g, ' ')}
                    </p>
                    <p style={{ margin: 0, fontSize: 14, color: 'var(--text-muted)' }}>
                      {item.description}
                    </p>
                    <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-secondary)' }}>
                      {item.performedBy} · {formatDateTime(item.performedAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </AdminModal>
      )}

      {/* ── Edit user modal ── */}
      {editUser && (
        <AdminModal
          open
          onClose={() => setEditUser(null)}
          title="Edit Profile"
          description={`${editUser.fullName} · ${editUser.email}`}
          footer={
            <>
              <AdminButton
                variant="outline"
                onClick={() => setEditUser(null)}
                disabled={editSaving}
              >
                Cancel
              </AdminButton>
              <AdminButton onClick={handleSaveEdit} loading={editSaving}>
                Save changes
              </AdminButton>
            </>
          }
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <AdminInput
                label="First name"
                value={editFirstName}
                onChange={(e) => setEditFirstName(e.target.value)}
              />
              <AdminInput
                label="Last name"
                value={editLastName}
                onChange={(e) => setEditLastName(e.target.value)}
              />
            </div>
            <AdminInput
              label="Email"
              type="email"
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
              icon={<Mail className="h-4 w-4" />}
            />
          </div>
        </AdminModal>
      )}

      {/* ── Edit roles modal ── */}
      {rolesUser && (
        <AdminModal
          open
          onClose={() => setRolesUser(null)}
          title="Edit Roles"
          description={`Assign roles to ${rolesUser.fullName}`}
          footer={
            <>
              <AdminButton
                variant="outline"
                onClick={() => setRolesUser(null)}
                disabled={rolesSaving}
              >
                Cancel
              </AdminButton>
              <AdminButton onClick={handleSaveRoles} loading={rolesSaving}>
                Save roles
              </AdminButton>
            </>
          }
        >
          {rolesLoading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-brand-600" />
            </div>
          ) : (
            <div className="space-y-2">
              {allRoles.map((role) => {
                const selected = selectedRoleIds.includes(role.id);
                return (
                  <button
                    key={role.id}
                    onClick={() => toggleRole(role.id)}
                    style={{
                      display: 'flex',
                      width: '100%',
                      alignItems: 'flex-start',
                      gap: 12,
                      borderRadius: 12,
                      padding: 16,
                      textAlign: 'left',
                      cursor: 'pointer',
                      border: selected
                        ? '1px solid var(--text-primary)'
                        : '1px solid var(--border-color)',
                      background: selected ? 'var(--hover-bg)' : 'var(--surface-dark)',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!selected) e.currentTarget.style.background = 'var(--hover-bg)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = selected
                        ? 'var(--hover-bg)'
                        : 'var(--surface-dark)';
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        width: 20,
                        height: 20,
                        flexShrink: 0,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 6,
                        marginTop: 2,
                        border: selected
                          ? '2px solid var(--text-primary)'
                          : '2px solid var(--border-color)',
                        background: selected ? 'var(--text-primary)' : 'transparent',
                      }}
                    >
                      {selected && (
                        <svg
                          style={{ width: 12, height: 12, color: 'var(--surface-dark)' }}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={3}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p
                        style={{
                          margin: 0,
                          fontSize: 14,
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                        }}
                      >
                        {role.name}
                      </p>
                      <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
                        {role.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </AdminModal>
      )}
    </div>
  );
};

export default UserListPage;
