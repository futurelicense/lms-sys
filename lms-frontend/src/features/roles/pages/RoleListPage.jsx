import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  ShieldCheck,
  Plus,
  Pencil,
  Trash2,
  Copy,
  Eye,
  ChevronDown,
  MoreVertical,
  KeyRound,
  Lock,
  Unlock,
  UserX,
  UserCheck,
} from 'lucide-react';
import AdminButton from '../../../components/ui/AdminButton';
import AdminInput from '../../../components/ui/AdminInput';
import { AdminModal, AdminConfirmModal } from '../../../components/ui/AdminModal';
import { AdminCardSkeleton } from '../../../components/ui/AdminSkeleton';
import { AdminErrorState } from '../../../components/ui/AdminPagination';
import PermissionGuard from '../../../guards/PermissionGuard';
import { PERMISSIONS } from '../../../constants/permissions';
import { ROUTES } from '../../../constants/routes';
import roleService from '../services/roleService';
import userService from '../../users/services/userService';
import { useToast } from '../../../components/feedback/Toast';

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

const AVATAR_PALETTE = [
  { bg: '#7367f0', text: '#fff' },
  { bg: '#ea5455', text: '#fff' },
  { bg: '#28c76f', text: '#fff' },
  { bg: '#ff9f43', text: '#fff' },
  { bg: '#00cfe8', text: '#fff' },
  { bg: '#a8aaae', text: '#fff' },
];

const ROLE_BADGE_COLORS = {
  admin: { bg: 'rgba(115, 103, 240, 0.15)', color: '#7367f0' },
  superadmin: { bg: 'rgba(115, 103, 240, 0.15)', color: '#7367f0' },
  manager: { bg: 'rgba(255, 159, 67, 0.15)', color: '#ff9f43' },
  editor: { bg: 'rgba(40, 199, 111, 0.15)', color: '#28c76f' },
  support: { bg: 'rgba(0, 207, 232, 0.15)', color: '#00cfe8' },
  user: { bg: 'rgba(40, 199, 111, 0.15)', color: '#28c76f' },
  instructor: { bg: 'rgba(33, 150, 243, 0.15)', color: '#2196f3' },
  student: { bg: 'rgba(156, 39, 176, 0.15)', color: '#d05ce3' },
};

function avatarColor(str = '') {
  const h = str.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_PALETTE[h % AVATAR_PALETTE.length];
}

function initials(name = '') {
  return (
    name
      .split(' ')
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? '')
      .join('') || '?'
  );
}

function roleBadge(name = '') {
  return (
    ROLE_BADGE_COLORS[name.toLowerCase().replace(/[^a-z]/g, '')] ?? {
      bg: M.primarySoft,
      color: M.primary,
    }
  );
}

/* ─── 3D avatar image pool (cycles deterministically per user) ─────── */
const AVATAR_IMAGES = [
  '/avatars/avatar-1.jpg',
  '/avatars/avatar-2.jpg',
  '/avatars/avatar-3.jpg',
  '/avatars/avatar-4.jpg',
  '/avatars/avatar-5.jpg',
  '/avatars/avatar-6.jpg',
];

function getAvatarImg(str = '') {
  const h = str.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_IMAGES[h % AVATAR_IMAGES.length];
}

/* ─── Avatar stack component ───────────────────────────────────────── */
function AvatarStack({ users = [], max = 3 }) {
  const visible = users.slice(0, max);
  const extra = users.length - max;
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {visible.map((u, i) => {
        const src = u.profileImageUrl || getAvatarImg(u.fullName ?? u.name ?? String(i));
        return (
          <div
            key={u.id ?? i}
            title={u.fullName ?? u.name}
            style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              border: '2px solid var(--surface-dark)',
              marginLeft: i === 0 ? 0 : -10,
              zIndex: max - i,
              position: 'relative',
              flexShrink: 0,
              overflow: 'hidden',
              background: 'var(--surface-medium)',
            }}
          >
            <img
              src={src}
              alt={u.fullName ?? u.name ?? ''}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              onError={(e) => {
                // Fallback: hide img and show initials div
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextSibling.style.display = 'flex';
              }}
            />
            <div
              style={{
                display: 'none',
                position: 'absolute',
                inset: 0,
                alignItems: 'center',
                justifyContent: 'center',
                background: avatarColor(u.fullName ?? u.name ?? '').bg,
                color: avatarColor(u.fullName ?? u.name ?? '').text,
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              {initials(u.fullName ?? u.name ?? '')}
            </div>
          </div>
        );
      })}
      {extra > 0 && (
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: '50%',
            background: M.primarySoft,
            color: M.primary,
            border: '2px solid var(--surface-dark)',
            marginLeft: -10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 10,
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          +{extra}
        </div>
      )}
    </div>
  );
}

/* ─── Status badge ─────────────────────────────────────────────────── */
function StatusBadge({ user }) {
  const s = user.locked
    ? { bg: 'rgba(234, 84, 85, 0.15)', color: '#ea5455', label: 'Locked' }
    : !user.active
      ? { bg: 'var(--surface-medium)', color: 'var(--text-muted)', label: 'Inactive' }
      : !user.activated
        ? { bg: 'rgba(255, 159, 67, 0.15)', color: '#ff9f43', label: 'Pending' }
        : { bg: 'rgba(40, 199, 111, 0.15)', color: '#28c76f', label: 'Active' };
  return (
    <span
      style={{
        background: s.bg,
        color: s.color,
        padding: '3px 10px',
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
      }}
    >
      {s.label}
    </span>
  );
}

/* ─── Role card ────────────────────────────────────────────────────── */
function RoleCard({ role, usersWithRole, onEdit, onDelete }) {
  return (
    <div
      style={{
        background: M.card,
        borderRadius: M.radius,
        boxShadow: M.cardShadow,
        padding: '20px 20px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        transition: 'transform 0.2s, box-shadow 0.2s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.boxShadow = M.shadow;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = '';
        e.currentTarget.style.boxShadow = M.cardShadow;
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 13, color: M.textMuted }}>
          Total {usersWithRole.length} user{usersWithRole.length !== 1 ? 's' : ''}
        </span>
        <AvatarStack users={usersWithRole} max={3} />
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: 16, fontWeight: 700, color: M.textMain, margin: 0 }}>{role.name}</p>
          <PermissionGuard required={[PERMISSIONS.ROLE_WRITE]} fallback={null}>
            <button
              onClick={() => onEdit(role)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: M.primary,
                fontSize: 13,
                fontWeight: 500,
                padding: '2px 0',
                marginTop: 2,
              }}
            >
              <Pencil size={12} /> Edit Role
            </button>
          </PermissionGuard>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            onClick={() => navigator.clipboard?.writeText(role.name ?? '')}
            title="Copy role name"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 6,
              borderRadius: 6,
              color: M.textMuted,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--hover-bg)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
          >
            <Copy size={15} />
          </button>
          <PermissionGuard required={[PERMISSIONS.ROLE_WRITE]} fallback={null}>
            <button
              onClick={onDelete}
              title="Delete role"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 6,
                borderRadius: 6,
                color: M.textMuted,
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
              <Trash2 size={15} />
            </button>
          </PermissionGuard>
        </div>
      </div>
    </div>
  );
}

/* ─── Main page ────────────────────────────────────────────────────── */
export const RoleListPage = () => {
  const navigate = useNavigate();
  const { success: toastSuccess, error: toastError } = useToast();

  const [roles, setRoles] = useState([]);
  const [allPermissions, setAllPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [userSearchInput, setUserSearchInput] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [userPage, setUserPage] = useState(0);
  const [userTotal, setUserTotal] = useState(0);
  const PAGE_SIZE = 10;

  // User table action states
  const [userMenuOpenId, setUserMenuOpenId] = useState(null);
  const [deleteUserTarget, setDeleteUserTarget] = useState(null);
  const [deletingUser, setDeletingUser] = useState(false);
  const [rolesUserTarget, setRolesUserTarget] = useState(null);
  const [selectedUserRoleIds, setSelectedUserRoleIds] = useState([]);
  const [savingUserRoles, setSavingUserRoles] = useState(false);
  const [confirmUserAction, setConfirmUserAction] = useState(null);

  // Close user dropdown menu on click outside
  useEffect(() => {
    if (!userMenuOpenId) return;
    const handler = () => setUserMenuOpenId(null);
    window.addEventListener('click', handler);
    return () => window.removeEventListener('click', handler);
  }, [userMenuOpenId]);

  const [editRole, setEditRole] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [roleName, setRoleName] = useState('');
  const [roleDescription, setRoleDescription] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [permSearch, setPermSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const toArr = (r) =>
    Array.isArray(r?.items)
      ? r.items
      : Array.isArray(r?.content)
        ? r.content
        : Array.isArray(r)
          ? r
          : [];

  const loadRoles = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const [rolesRes, permsRes] = await Promise.all([
        roleService.list(),
        roleService.listPermissions(),
      ]);
      setRoles(toArr(rolesRes));
      setAllPermissions(toArr(permsRes));
    } catch (err) {
      setLoadError(err?.message ?? 'Failed to load roles.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const res = await userService.list({
        search: userSearch || undefined,
        page: userPage,
        size: PAGE_SIZE,
      });
      let content = res?.content ?? [];
      if (roleFilter) {
        content = content.filter((u) =>
          (u.roles ?? []).some(
            (r) =>
              (typeof r === 'string' ? r : (r.name ?? '')).toLowerCase() ===
              roleFilter.toLowerCase(),
          ),
        );
      }
      setUsers(content);
      setUserTotal(res?.totalElements ?? content.length);
    } catch {
      setUsers([]);
    } finally {
      setUsersLoading(false);
    }
  }, [userSearch, userPage, roleFilter]);

  useEffect(() => {
    loadRoles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userSearch, userPage, roleFilter]);

  const openCreate = () => {
    setEditRole(null);
    setRoleName('');
    setRoleDescription('');
    setSelectedPermissions([]);
    setPermSearch('');
    setModalError('');
    setModalOpen(true);
  };
  const openEdit = (role) => {
    setEditRole(role);
    setRoleName(role.name ?? '');
    setRoleDescription(role.description ?? '');
    setSelectedPermissions((role.permissions ?? []).map((p) => p.id));
    setPermSearch('');
    setModalError('');
    setModalOpen(true);
  };
  const togglePerm = (id) =>
    setSelectedPermissions((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const handleSave = async () => {
    setModalError('');
    if (!roleName.trim()) {
      setModalError('Role name is required.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: roleName.trim(),
        description: roleDescription.trim(),
        permissionIds: selectedPermissions,
      };
      if (editRole) {
        await roleService.update(editRole.id, payload);
        toastSuccess(`Role "${roleName}" updated.`);
      } else {
        await roleService.create(payload);
        toastSuccess(`Role "${roleName}" created.`);
      }
      setModalOpen(false);
      loadRoles();
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
      await roleService.delete(deleteTarget.id);
      toastSuccess(`Role "${deleteTarget.name}" deleted.`);
      setDeleteTarget(null);
      loadRoles();
    } catch (err) {
      toastError(err?.message ?? 'Failed to delete.');
      setDeleting(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteUserTarget) return;
    setDeletingUser(true);
    try {
      await userService.delete(deleteUserTarget.id);
      toastSuccess(`${deleteUserTarget.fullName || deleteUserTarget.name || 'User'} has been removed.`);
      setDeleteUserTarget(null);
      loadUsers();
    } catch (err) {
      toastError(err?.message ?? 'Failed to remove user.');
    } finally {
      setDeletingUser(false);
    }
  };

  const openEditUserRoles = (u) => {
    setRolesUserTarget(u);
    const userRoleNames = (u.roles ?? []).map((r) =>
      typeof r === 'string' ? r : (r?.name ?? '')
    );
    const preSelected = roles
      .filter((r) => userRoleNames.some((name) => name.toLowerCase() === r.name?.toLowerCase()))
      .map((r) => r.id);
    setSelectedUserRoleIds(preSelected);
  };

  const handleSaveUserRoles = async () => {
    if (!rolesUserTarget) return;
    setSavingUserRoles(true);
    try {
      await userService.updateRoles(rolesUserTarget.id, selectedUserRoleIds);
      toastSuccess(`Roles updated for ${rolesUserTarget.fullName || rolesUserTarget.name || 'user'}.`);
      setRolesUserTarget(null);
      loadUsers();
    } catch (err) {
      toastError(err?.message ?? 'Failed to update roles.');
    } finally {
      setSavingUserRoles(false);
    }
  };

  const handleUserStatusAction = async () => {
    if (!confirmUserAction) return;
    const { user: u, type } = confirmUserAction;
    setConfirmUserAction((prev) => ({ ...prev, loading: true }));
    try {
      if (type === 'activate') await userService.activate(u.id);
      if (type === 'deactivate') await userService.deactivate(u.id);
      if (type === 'lock') await userService.lock(u.id);
      if (type === 'unlock') await userService.unlock(u.id);
      toastSuccess(
        type === 'lock'
          ? `${u.fullName || u.name} has been locked.`
          : type === 'unlock'
            ? `${u.fullName || u.name} has been unlocked.`
            : `${u.fullName || u.name} has been ${type}d.`
      );
      setConfirmUserAction(null);
      loadUsers();
    } catch (err) {
      toastError(err?.message ?? `Failed to ${type} user.`);
      setConfirmUserAction((prev) => ({ ...prev, loading: false }));
    }
  };

  const filteredPerms = permSearch
    ? allPermissions.filter(
        (p) =>
          p.name?.toLowerCase().includes(permSearch.toLowerCase()) ||
          p.authority?.toLowerCase().includes(permSearch.toLowerCase()),
      )
    : allPermissions;

  const totalPages = Math.max(1, Math.ceil(userTotal / PAGE_SIZE));

  const inputStyle = {
    paddingLeft: 32,
    paddingRight: 12,
    paddingTop: 7,
    paddingBottom: 7,
    fontSize: 13,
    border: `1px solid ${M.border}`,
    borderRadius: 6,
    outline: 'none',
    color: M.textMain,
    background: 'var(--input-bg)',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Page header */}
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: M.textMain, margin: 0 }}>Roles List</h1>
        <p style={{ fontSize: 14, color: M.textMuted, margin: '6px 0 0' }}>
          A role provided access to predefined menus and features so that depending on assigned role
          an administrator can have access to what he need
        </p>
      </div>

      {/* Role cards grid */}
      {loading ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 20,
          }}
        >
          {Array.from({ length: 5 }).map((_, i) => (
            <AdminCardSkeleton key={i} />
          ))}
        </div>
      ) : loadError ? (
        <AdminErrorState message={loadError} onRetry={loadRoles} />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 20,
          }}
        >
          {roles.map((role) => {
            const usersWithRole = users.filter((u) =>
              (u.roles ?? []).some(
                (r) =>
                  (typeof r === 'string' ? r : (r.name ?? '')).toLowerCase() ===
                  (role.name ?? '').toLowerCase(),
              ),
            );
            return (
              <RoleCard
                key={role.id}
                role={role}
                usersWithRole={usersWithRole}
                onEdit={openEdit}
                onDelete={() => setDeleteTarget(role)}
              />
            );
          })}
          {/* Add Role card */}
          <div
            style={{
              background: M.card,
              borderRadius: M.radius,
              boxShadow: M.cardShadow,
              padding: '20px 20px 16px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              minHeight: 130,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* 3D character illustration */}
            <img
              src="/add-role-character.jpg"
              alt="Add role"
              style={{
                position: 'absolute',
                bottom: 0,
                left: 12,
                height: 120,
                width: 'auto',
                objectFit: 'contain',
                pointerEvents: 'none',
              }}
            />
            <PermissionGuard required={[PERMISSIONS.ROLE_WRITE]} fallback={null}>
              <button
                onClick={openCreate}
                style={{
                  background: M.primary,
                  color: 'var(--lms-primary-foreground, #fff)',
                  border: 'none',
                  borderRadius: 6,
                  padding: '8px 18px',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'opacity 0.15s',
                  position: 'relative',
                  zIndex: 1,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
              >
                <Plus size={15} /> Add Role
              </button>
            </PermissionGuard>
            <p
              style={{
                fontSize: 13,
                color: M.textMuted,
                textAlign: 'right',
                margin: 0,
                lineHeight: 1.6,
                position: 'relative',
                zIndex: 1,
              }}
            >
              Add new role,
              <br />
              if it doesn&apos;t exist.
            </p>
          </div>
        </div>
      )}

      {/* Users with their roles table */}
      <div
        style={{
          background: M.card,
          borderRadius: M.radius,
          boxShadow: M.cardShadow,
          overflow: 'hidden',
        }}
      >
        {/* Table section header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: `1px solid ${M.border}` }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: M.textMain, margin: 0 }}>
            Total users with their roles
          </h2>
          <p style={{ fontSize: 13, color: M.textMuted, margin: '4px 0 0' }}>
            Find all of your platform&apos;s user accounts and their associated roles.
          </p>
        </div>

        {/* Toolbar */}
        <div
          style={{
            padding: '12px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 12,
            borderBottom: `1px solid ${M.border}`,
          }}
        >
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
              placeholder="Search User"
              value={userSearchInput}
              onChange={(e) => setUserSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setUserSearch(userSearchInput);
                  setUserPage(0);
                }
              }}
              style={{ ...inputStyle, width: 180 }}
            />
          </div>
          <div style={{ position: 'relative' }}>
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setUserPage(0);
              }}
              style={{
                appearance: 'none',
                paddingLeft: 12,
                paddingRight: 28,
                paddingTop: 7,
                paddingBottom: 7,
                fontSize: 13,
                border: `1px solid ${M.border}`,
                borderRadius: 6,
                outline: 'none',
                cursor: 'pointer',
                color: roleFilter ? M.textMain : M.textMuted,
                background: 'var(--input-bg)',
                width: 150,
              }}
            >
              <option value="">Select Role</option>
              {roles.map((r) => (
                <option key={r.id} value={r.name}>
                  {r.name}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              style={{
                position: 'absolute',
                right: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                color: M.textMuted,
                pointerEvents: 'none',
              }}
            />
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--surface-medium)' }}>
                {['', 'USER', 'EMAIL', 'ROLE', 'STATUS', 'ACTIONS'].map((h, i) => (
                  <th
                    key={i}
                    style={{
                      padding: '10px 16px',
                      textAlign: 'left',
                      fontSize: 11,
                      fontWeight: 700,
                      color: M.textMuted,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {h === '' ? <input type="checkbox" /> : h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {usersLoading ? (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      padding: '32px 16px',
                      textAlign: 'center',
                      color: M.textMuted,
                      fontSize: 13,
                    }}
                  >
                    Loading users…
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      padding: '32px 16px',
                      textAlign: 'center',
                      color: M.textMuted,
                      fontSize: 13,
                    }}
                  >
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const userRoles = Array.isArray(user.roles) ? user.roles : [];
                  return (
                    <tr
                      key={user.id}
                      style={{
                        borderTop: `1px solid ${M.border}`,
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--hover-bg)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '10px 16px' }}>
                        <input type="checkbox" />
                      </td>
                      <td style={{ padding: '10px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: '50%',
                              flexShrink: 0,
                              overflow: 'hidden',
                              background: 'var(--surface-medium)',
                              border: `1px solid ${M.border}`,
                              position: 'relative',
                            }}
                          >
                            <img
                              src={
                                user.profileImageUrl ||
                                getAvatarImg(user.fullName ?? user.name ?? '')
                              }
                              alt={user.fullName ?? user.name ?? ''}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                display: 'block',
                              }}
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextSibling.style.display = 'flex';
                              }}
                            />
                            <div
                              style={{
                                display: 'none',
                                position: 'absolute',
                                inset: 0,
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: avatarColor(user.fullName ?? user.name ?? '').bg,
                                color: avatarColor(user.fullName ?? user.name ?? '').text,
                                fontSize: 12,
                                fontWeight: 700,
                              }}
                            >
                              {initials(user.fullName ?? user.name ?? '?')}
                            </div>
                          </div>
                          <div>
                            <p
                              style={{
                                fontSize: 14,
                                fontWeight: 600,
                                color: M.textMain,
                                margin: 0,
                              }}
                            >
                              {user.fullName ?? user.name}
                            </p>
                            <p style={{ fontSize: 12, color: M.textMuted, margin: 0 }}>
                              {user.email?.split('@')[0]}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td
                        style={{
                          padding: '10px 16px',
                          fontSize: 13,
                          color: 'var(--text-secondary)',
                        }}
                      >
                        {user.email}
                      </td>
                      <td style={{ padding: '10px 16px' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {userRoles.length === 0 ? (
                            <span style={{ fontSize: 12, color: M.textMuted }}>—</span>
                          ) : (
                            userRoles.slice(0, 2).map((r, i) => {
                              const rName = typeof r === 'string' ? r : (r.name ?? '');
                              const c = roleBadge(rName);
                              return (
                                <span
                                  key={i}
                                  style={{
                                    background: c.bg,
                                    color: c.color,
                                    padding: '2px 8px',
                                    borderRadius: 4,
                                    fontSize: 12,
                                    fontWeight: 600,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 4,
                                  }}
                                >
                                  <ShieldCheck size={11} />
                                  {rName}
                                </span>
                              );
                            })
                          )}
                          {userRoles.length > 2 && (
                            <span
                              style={{
                                background: M.primarySoft,
                                color: M.primary,
                                padding: '2px 8px',
                                borderRadius: 4,
                                fontSize: 12,
                                fontWeight: 600,
                              }}
                            >
                              +{userRoles.length - 2}
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '10px 16px' }}>
                        <StatusBadge user={user} />
                      </td>
                      <td style={{ padding: '10px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, position: 'relative' }}>
                          {/* Remove user button */}
                          <button
                            type="button"
                            title="Remove user"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteUserTarget(user);
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: 6,
                              borderRadius: 6,
                              color: M.textMuted,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.15s ease',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'rgba(234, 84, 85, 0.12)';
                              e.currentTarget.style.color = '#ea5455';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'none';
                              e.currentTarget.style.color = M.textMuted;
                            }}
                          >
                            <Trash2 size={16} />
                          </button>

                          {/* View user details button */}
                          <button
                            type="button"
                            title="View user details"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(ROUTES.USER_DETAILS(user.id));
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: 6,
                              borderRadius: 6,
                              color: M.textMuted,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.15s ease',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'var(--hover-bg)';
                              e.currentTarget.style.color = 'var(--text-primary)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'none';
                              e.currentTarget.style.color = M.textMuted;
                            }}
                          >
                            <Eye size={16} />
                          </button>

                          {/* More options dropdown button */}
                          <div style={{ position: 'relative' }}>
                            <button
                              type="button"
                              title="More options"
                              onClick={(e) => {
                                e.stopPropagation();
                                setUserMenuOpenId(userMenuOpenId === user.id ? null : user.id);
                              }}
                              style={{
                                background: userMenuOpenId === user.id ? 'var(--hover-bg)' : 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: 6,
                                borderRadius: 6,
                                color: userMenuOpenId === user.id ? 'var(--text-primary)' : M.textMuted,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.15s ease',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'var(--hover-bg)';
                                e.currentTarget.style.color = 'var(--text-primary)';
                              }}
                              onMouseLeave={(e) => {
                                if (userMenuOpenId !== user.id) {
                                  e.currentTarget.style.background = 'none';
                                  e.currentTarget.style.color = M.textMuted;
                                }
                              }}
                            >
                              <MoreVertical size={16} />
                            </button>

                            {userMenuOpenId === user.id && (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                  position: 'absolute',
                                  right: 0,
                                  top: '100%',
                                  marginTop: 4,
                                  zIndex: 100,
                                  minWidth: 160,
                                  borderRadius: 8,
                                  border: '1px solid var(--border-color)',
                                  background: 'var(--surface-dark, #0a0a0a)',
                                  padding: '4px 0',
                                  boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
                                }}
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    setUserMenuOpenId(null);
                                    openEditUserRoles(user);
                                  }}
                                  style={{
                                    width: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    padding: '8px 12px',
                                    fontSize: 13,
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: 'var(--text-primary)',
                                    textAlign: 'left',
                                  }}
                                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--hover-bg)')}
                                  onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                                >
                                  <ShieldCheck size={14} /> Manage Roles
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setUserMenuOpenId(null);
                                    setConfirmUserAction({
                                      user,
                                      type: user.locked ? 'unlock' : 'lock',
                                      loading: false,
                                    });
                                  }}
                                  style={{
                                    width: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    padding: '8px 12px',
                                    fontSize: 13,
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: user.locked ? '#28c76f' : '#ea5455',
                                    textAlign: 'left',
                                  }}
                                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--hover-bg)')}
                                  onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                                >
                                  {user.locked ? <Unlock size={14} /> : <Lock size={14} />}
                                  {user.locked ? 'Unlock Account' : 'Lock Account'}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setUserMenuOpenId(null);
                                    setConfirmUserAction({
                                      user,
                                      type: user.active ? 'deactivate' : 'activate',
                                      loading: false,
                                    });
                                  }}
                                  style={{
                                    width: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    padding: '8px 12px',
                                    fontSize: 13,
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: user.active ? '#ea5455' : '#28c76f',
                                    textAlign: 'left',
                                  }}
                                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--hover-bg)')}
                                  onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                                >
                                  {user.active ? <UserX size={14} /> : <UserCheck size={14} />}
                                  {user.active ? 'Deactivate' : 'Activate'}
                                </button>

                                <div style={{ height: 1, background: 'var(--border-color)', margin: '4px 0' }} />

                                <button
                                  type="button"
                                  onClick={() => {
                                    setUserMenuOpenId(null);
                                    setDeleteUserTarget(user);
                                  }}
                                  style={{
                                    width: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    padding: '8px 12px',
                                    fontSize: 13,
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: '#ea5455',
                                    textAlign: 'left',
                                  }}
                                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(234, 84, 85, 0.1)')}
                                  onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                                >
                                  <Trash2 size={14} /> Remove User
                                </button>
                              </div>
                            )}
                          </div>
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
              {userPage * PAGE_SIZE + 1}–{Math.min((userPage + 1) * PAGE_SIZE, userTotal)} of{' '}
              {userTotal}
            </span>
            {['‹', '›'].map((ch, i) => (
              <button
                key={i}
                disabled={i === 0 ? userPage === 0 : userPage >= totalPages - 1}
                onClick={() =>
                  setUserPage((p) =>
                    i === 0 ? Math.max(0, p - 1) : Math.min(totalPages - 1, p + 1),
                  )
                }
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '2px 8px',
                  borderRadius: 4,
                  fontSize: 18,
                  color: M.textMain,
                  opacity: (i === 0 ? userPage === 0 : userPage >= totalPages - 1) ? 0.3 : 1,
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
          title={editRole ? 'Edit Role' : 'Add New Role'}
          description={editRole ? `Editing "${editRole.name}"` : 'Define a new access level'}
          size="lg"
          footer={
            <>
              <AdminButton variant="outline" onClick={() => setModalOpen(false)} disabled={saving}>
                Cancel
              </AdminButton>
              <AdminButton onClick={handleSave} loading={saving}>
                {editRole ? 'Save changes' : 'Create role'}
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
              label="Role name"
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              placeholder="e.g. Content Manager"
              icon={<ShieldCheck size={16} />}
              autoFocus
            />
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: 6,
                }}
              >
                Description
              </label>
              <textarea
                value={roleDescription}
                onChange={(e) => setRoleDescription(e.target.value)}
                placeholder="What access does this role grant?"
                rows={2}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  fontSize: 14,
                  border: '1px solid var(--border-color)',
                  borderRadius: 8,
                  outline: 'none',
                  resize: 'none',
                  background: 'var(--input-bg)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
            <div>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: 6,
                }}
              >
                <KeyRound size={16} style={{ color: 'var(--text-muted)' }} /> Permissions (
                {selectedPermissions.length} selected)
              </label>
              <div style={{ marginTop: 6, marginBottom: 12 }}>
                <AdminInput
                  placeholder="Search permissions…"
                  value={permSearch}
                  onChange={(e) => setPermSearch(e.target.value)}
                  icon={<Search size={16} />}
                />
              </div>
              <div
                style={{
                  maxHeight: 256,
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  borderRadius: 12,
                  border: '1px solid var(--border-color)',
                  padding: 12,
                }}
              >
                {filteredPerms.length === 0 ? (
                  <p
                    style={{
                      padding: '16px 0',
                      textAlign: 'center',
                      fontSize: 14,
                      color: 'var(--text-muted)',
                      margin: 0,
                    }}
                  >
                    No permissions match.
                  </p>
                ) : (
                  filteredPerms.map((perm) => {
                    const sel = selectedPermissions.includes(perm.id);
                    return (
                      <button
                        key={perm.id}
                        type="button"
                        onClick={() => togglePerm(perm.id)}
                        style={{
                          display: 'flex',
                          width: '100%',
                          alignItems: 'center',
                          gap: 12,
                          borderRadius: 8,
                          padding: 10,
                          textAlign: 'left',
                          transition: 'background 0.15s',
                          cursor: 'pointer',
                          border: 'none',
                          background: sel ? 'var(--surface-medium)' : 'transparent',
                        }}
                        onMouseEnter={(e) => {
                          if (!sel) e.currentTarget.style.background = 'var(--hover-bg)';
                        }}
                        onMouseLeave={(e) => {
                          if (!sel) e.currentTarget.style.background = 'transparent';
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
                            transition: 'all 0.15s',
                            border: sel
                              ? '2px solid var(--text-primary)'
                              : '2px solid var(--border-color)',
                            background: sel ? 'var(--text-primary)' : 'transparent',
                          }}
                        >
                          {sel && (
                            <svg
                              style={{ width: 12, height: 12, color: 'var(--surface-dark)' }}
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={3}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p
                            style={{
                              margin: 0,
                              fontSize: 14,
                              fontWeight: 500,
                              color: 'var(--text-primary)',
                            }}
                          >
                            {perm.name}
                          </p>
                          <p
                            style={{
                              margin: 0,
                              fontSize: 12,
                              fontFamily: 'monospace',
                              color: 'var(--text-muted)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {perm.authority}
                          </p>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </AdminModal>
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <AdminConfirmModal
          open
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          title="Delete Role"
          message={`Are you sure you want to delete "${deleteTarget.name}"? This cannot be undone.`}
          confirmLabel="Delete"
          variant="danger"
          loading={deleting}
        />
      )}

      {/* Delete User confirm */}
      {deleteUserTarget && (
        <AdminConfirmModal
          open
          onClose={() => setDeleteUserTarget(null)}
          onConfirm={handleDeleteUser}
          title="Remove User"
          message={`Are you sure you want to remove "${deleteUserTarget.fullName || deleteUserTarget.name || deleteUserTarget.email}"? This action cannot be undone.`}
          confirmLabel="Remove User"
          variant="danger"
          loading={deletingUser}
        />
      )}

      {/* Lock / Unlock / Activate / Deactivate confirm */}
      {confirmUserAction && (
        <AdminConfirmModal
          open
          onClose={() => setConfirmUserAction(null)}
          onConfirm={handleUserStatusAction}
          title={
            confirmUserAction.type === 'lock'
              ? 'Lock Account'
              : confirmUserAction.type === 'unlock'
              ? 'Unlock Account'
              : confirmUserAction.type === 'deactivate'
              ? 'Deactivate User'
              : 'Activate User'
          }
          message={
            confirmUserAction.type === 'lock'
              ? `Are you sure you want to lock the account for "${confirmUserAction.user?.fullName || confirmUserAction.user?.name || confirmUserAction.user?.email}"? They will not be able to log in.`
              : confirmUserAction.type === 'unlock'
              ? `Are you sure you want to unlock the account for "${confirmUserAction.user?.fullName || confirmUserAction.user?.name || confirmUserAction.user?.email}"?`
              : confirmUserAction.type === 'deactivate'
              ? `Are you sure you want to deactivate "${confirmUserAction.user?.fullName || confirmUserAction.user?.name || confirmUserAction.user?.email}"?`
              : `Are you sure you want to activate "${confirmUserAction.user?.fullName || confirmUserAction.user?.name || confirmUserAction.user?.email}"?`
          }
          confirmLabel={
            confirmUserAction.type === 'lock'
              ? 'Lock Account'
              : confirmUserAction.type === 'unlock'
              ? 'Unlock Account'
              : confirmUserAction.type === 'deactivate'
              ? 'Deactivate'
              : 'Activate'
          }
          variant={
            confirmUserAction.type === 'lock' || confirmUserAction.type === 'deactivate'
              ? 'danger'
              : 'primary'
          }
          loading={confirmUserAction.loading}
        />
      )}

      {/* Manage User Roles modal */}
      {rolesUserTarget && (
        <AdminModal
          open
          onClose={() => setRolesUserTarget(null)}
          title={`Manage Roles — ${rolesUserTarget.fullName || rolesUserTarget.name || rolesUserTarget.email}`}
          description="Select the system roles assigned to this user."
          size="md"
          footer={
            <>
              <AdminButton
                variant="outline"
                onClick={() => setRolesUserTarget(null)}
                disabled={savingUserRoles}
              >
                Cancel
              </AdminButton>
              <AdminButton
                variant="primary"
                onClick={handleSaveUserRoles}
                loading={savingUserRoles}
              >
                Save Roles
              </AdminButton>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {roles.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No roles available.</p>
            ) : (
              roles.map((role) => {
                const checked = selectedUserRoleIds.includes(role.id);
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() =>
                      setSelectedUserRoleIds((prev) =>
                        prev.includes(role.id)
                          ? prev.filter((id) => id !== role.id)
                          : [...prev, role.id]
                      )
                    }
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '10px 14px',
                      borderRadius: 8,
                      border: checked
                        ? '1px solid var(--primary-color, #7367f0)'
                        : '1px solid var(--border-color)',
                      background: checked
                        ? 'rgba(115, 103, 240, 0.08)'
                        : 'var(--surface-medium)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                      width: '100%',
                    }}
                  >
                    <div
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: 4,
                        border: checked
                          ? '2px solid var(--primary-color, #7367f0)'
                          : '2px solid var(--border-color)',
                        background: checked
                          ? 'var(--primary-color, #7367f0)'
                          : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {checked && (
                        <svg
                          style={{ width: 12, height: 12, color: '#fff' }}
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
                      {role.description && (
                        <p
                          style={{
                            margin: '2px 0 0',
                            fontSize: 12,
                            color: 'var(--text-muted)',
                          }}
                        >
                          {role.description}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </AdminModal>
      )}
    </div>
  );
};

export default RoleListPage;
