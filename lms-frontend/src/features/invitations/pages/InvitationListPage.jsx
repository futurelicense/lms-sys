import { useCallback, useEffect, useState } from 'react';
import {
  Search,
  MailPlus,
  Send,
  Trash2,
  Plus,
  MoreVertical,
  Mail,
  User,
  ShieldCheck,
  Clock,
  CheckCircle2,
  Check,
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
import invitationService from '../services/invitationService';
import roleService from '../../roles/services/roleService';
import { useToast } from '../../../components/feedback/Toast';

const ROLE_DESCRIPTIONS = {
  ADMIN: 'Full platform management and security settings',
  INSTRUCTOR: 'Create, manage, and publish courses',
  STUDENT: 'Access enrolled courses and learning features',
};

function formatDate(str) {
  if (!str) return '—';
  return new Date(str).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function getInitials(name = '') {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function isExpired(inv) {
  return inv?.expiresAt && new Date(inv.expiresAt) < new Date();
}

function StatusBadge({ status }) {
  if (status === 'PENDING')
    return (
      <AdminBadge variant="warning" dot>
        Pending
      </AdminBadge>
    );
  if (status === 'ACCEPTED')
    return (
      <AdminBadge variant="success" dot>
        Accepted
      </AdminBadge>
    );
  if (status === 'EXPIRED')
    return (
      <AdminBadge variant="neutral" dot>
        Expired
      </AdminBadge>
    );
  return <AdminBadge variant="neutral">{status}</AdminBadge>;
}

const STATUS_FILTERS = ['ALL', 'PENDING', 'ACCEPTED', 'EXPIRED'];

export const InvitationListPage = () => {
  const { success: toastSuccess, error: toastError } = useToast();

  // List state
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 10;
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [openMenuId, setOpenMenuId] = useState(null);
  // Track whether the open dropdown should open upward (near bottom of viewport)
  const [menuOpenUpward, setMenuOpenUpward] = useState(false);

  // Create modal
  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createRoleName, setCreateRoleName] = useState(''); // Role NAME (not ID) — backend expects role name string
  const [allRoles, setAllRoles] = useState([]);
  const [rolesDropdownOpen, setRolesDropdownOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  // Confirm actions
  const [resendTarget, setResendTarget] = useState(null);
  const [revokeTarget, setRevokeTarget] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  /* ─── data fetching ─── */

  const loadInvitations = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      // Backend does not support status/search query params — pass page/size only,
      // then filter client-side.
      const res = await invitationService.list({ page, size: pageSize, search });
      let content = Array.isArray(res?.content)
        ? res.content
        : Array.isArray(res?.items)
          ? res.items
          : Array.isArray(res)
            ? res
            : [];

      // Client-side search filter
      if (search) {
        const q = search.toLowerCase();
        content = content.filter(
          (i) => i.name?.toLowerCase().includes(q) || i.email?.toLowerCase().includes(q),
        );
      }
      // Client-side status filter
      if (statusFilter !== 'ALL') {
        content = content.filter((i) => i.status === statusFilter);
      }

      setInvitations(content);
      setTotalPages(res?.totalPages ?? (content.length > 0 ? 1 : 0));
      setTotalElements(res?.totalElements ?? content.length);
    } catch (err) {
      setLoadError(err?.message ?? 'Failed to load invitations.');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, statusFilter]);

  useEffect(() => {
    loadInvitations();
  }, [loadInvitations]);

  useEffect(() => {
    if (!openMenuId) return;
    const handler = () => setOpenMenuId(null);
    window.addEventListener('click', handler);
    return () => window.removeEventListener('click', handler);
  }, [openMenuId]);

  useEffect(() => {
    if (!rolesDropdownOpen) return;
    const handler = () => setRolesDropdownOpen(false);
    window.addEventListener('click', handler);
    return () => window.removeEventListener('click', handler);
  }, [rolesDropdownOpen]);

  const handleSearch = () => {
    setPage(0);
    setSearch(searchInput);
  };
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch();
  };
  const handleStatusFilter = (s) => {
    setPage(0);
    setStatusFilter(s);
  };

  /* ─── create invitation ─── */

  const openCreate = async () => {
    setCreateOpen(true);
    setCreateName('');
    setCreateEmail('');
    setCreateRoleName('');
    setCreateError('');
    setRolesDropdownOpen(false);
    try {
      const roles = await roleService.list();
      const roleList = Array.isArray(roles?.items)
        ? roles.items
        : Array.isArray(roles?.content)
          ? roles.content
          : Array.isArray(roles)
            ? roles
            : [];
      // Filter out MANAGER role (case-insensitive) as requested
      const validRoles = roleList.filter(
        (r) => r.name && r.name.trim().toUpperCase() !== 'MANAGER',
      );
      setAllRoles(validRoles);
    } catch (err) {
      toastError(err?.message ?? 'Failed to load roles.');
    }
  };

  const selectedRole = allRoles.find((r) => r.name === createRoleName);

  const handleCreate = async () => {
    setCreateError('');
    if (!createName.trim()) {
      setCreateError("Please enter the recipient's name.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(createEmail)) {
      setCreateError('Please enter a valid email address.');
      return;
    }
    if (!createRoleName) {
      setCreateError('Please select a role for the invitation.');
      return;
    }

    setCreating(true);
    try {
      // Backend CreateInvitationRequest expects { name, email, role } where role is the ROLE NAME string
      await invitationService.invite({
        name: createName.trim(),
        email: createEmail.trim(),
        role: createRoleName,
      });
      toastSuccess(
        `Invitation sent to ${createEmail}. They will receive an email with a temporary password.`,
      );
      setCreateOpen(false);
      loadInvitations();
    } catch (err) {
      setCreateError(err?.message ?? 'Failed to send invitation.');
    } finally {
      setCreating(false);
    }
  };

  /* ─── resend / revoke ─── */

  const handleResend = async () => {
    if (!resendTarget) return;
    setActionLoading(true);
    try {
      await invitationService.resend(resendTarget.id);
      toastSuccess(`Invitation resent to ${resendTarget.email}.`);
      setResendTarget(null);
      loadInvitations();
    } catch (err) {
      toastError(err?.message ?? 'Failed to resend invitation.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevoke = async () => {
    if (!revokeTarget) return;
    setActionLoading(true);
    try {
      await invitationService.revoke(revokeTarget.id);
      toastSuccess(`Invitation for ${revokeTarget.email} has been revoked.`);
      setRevokeTarget(null);
      loadInvitations();
    } catch (err) {
      toastError(err?.message ?? 'Failed to revoke invitation.');
    } finally {
      setActionLoading(false);
    }
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
            Invitations
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--text-muted)' }}>
            Send and manage user invitations to the platform.
          </p>
        </div>
        <PermissionGuard required={[PERMISSIONS.INVITATION_WRITE]} fallback={null}>
          <AdminButton icon={<Plus className="h-4 w-4" />} onClick={openCreate}>
            New Invitation
          </AdminButton>
        </PermissionGuard>
      </div>

      {/* Filters */}
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
            <AdminTableSkeleton rows={5} cols={5} />
          </div>
        ) : loadError ? (
          <AdminErrorState message={loadError} onRetry={loadInvitations} />
        ) : invitations.length === 0 ? (
          <AdminEmptyState
            icon={<MailPlus className="h-7 w-7" />}
            title="No invitations found"
            message={
              search || statusFilter !== 'ALL'
                ? 'Try adjusting your search or filter.'
                : 'Send invitations to invite new users to the platform.'
            }
            action={
              <PermissionGuard required={[PERMISSIONS.INVITATION_WRITE]} fallback={null}>
                <AdminButton icon={<Plus className="h-4 w-4" />} onClick={openCreate}>
                  New Invitation
                </AdminButton>
              </PermissionGuard>
            }
          />
        ) : (
          <>
            {/* Desktop table */}
            <div
              className="hidden md:flex"
              style={{ flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}
            >
              <table className="w-full" style={{ tableLayout: 'fixed' }}>
                <thead>
                  <tr
                    style={{
                      borderBottom: '1px solid var(--border-color)',
                      background: 'var(--surface-medium)',
                    }}
                  >
                    {['Recipient', 'Status', 'Role', 'Expires', 'Sent By', 'Actions'].map(
                      (h, i) => (
                        <th
                          key={h}
                          style={{
                            padding: '12px 24px',
                            textAlign: i === 5 ? 'right' : 'left',
                            fontSize: 11,
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: '0.8px',
                            color: 'var(--text-muted)',
                            width: i === 0 ? '22%' : i === 5 ? '10%' : 'auto',
                          }}
                        >
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
              </table>
              {/* Scrollable body */}
              <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
                <table className="w-full" style={{ tableLayout: 'fixed' }}>
                  <colgroup>
                    <col style={{ width: '22%' }} />
                    <col />
                    <col />
                    <col />
                    <col />
                    <col style={{ width: '10%' }} />
                  </colgroup>
                  <tbody className="divide-y divide-slate-100">
                  {invitations.map((inv) => (
                    <tr
                      key={inv.id}
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
                            {getInitials(inv.name ?? '')}
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
                              {inv.name}
                            </p>
                            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>
                              {inv.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '14px 24px' }}>
                        <StatusBadge status={inv.status} />
                      </td>
                      <td style={{ padding: '14px 24px' }}>
                        <span
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
                          {inv.roleName ?? '—'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {isExpired(inv) ? (
                            <Clock size={14} color="var(--text-muted)" />
                          ) : (
                            <CheckCircle2 size={14} color="#4ade80" />
                          )}
                          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                            {formatDate(inv.expiresAt)}
                          </span>
                        </div>
                      </td>
                      <td
                        style={{ padding: '14px 24px', fontSize: 13, color: 'var(--text-muted)' }}
                      >
                        {inv.invitedBy ?? '—'}
                      </td>
                      <td style={{ padding: '14px 24px', textAlign: 'right' }}>
                        <PermissionGuard
                          required={[PERMISSIONS.INVITATION_WRITE]}
                          fallback={
                            <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>
                          }
                        >
                          <div style={{ position: 'relative', display: 'inline-block' }}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (openMenuId === inv.id) {
                                  setOpenMenuId(null);
                                } else {
                                  // Detect if near bottom of viewport → open upward
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  setMenuOpenUpward(window.innerHeight - rect.bottom < 180);
                                  setOpenMenuId(inv.id);
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
                            {openMenuId === inv.id && (
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
                                {inv.status === 'PENDING' && (
                                  <button
                                    onClick={() => {
                                      setResendTarget(inv);
                                      setOpenMenuId(null);
                                    }}
                                    style={{
                                      display: 'flex',
                                      width: '100%',
                                      alignItems: 'center',
                                      gap: 10,
                                      padding: '8px 12px',
                                      fontSize: 13,
                                      color: 'var(--text-secondary)',
                                      background: 'transparent',
                                      border: 'none',
                                      cursor: 'pointer',
                                      textAlign: 'left',
                                    }}
                                    onMouseEnter={(e) =>
                                      (e.currentTarget.style.background = 'var(--hover-bg)')
                                    }
                                    onMouseLeave={(e) =>
                                      (e.currentTarget.style.background = 'transparent')
                                    }
                                  >
                                    <Send size={14} /> Resend
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    setRevokeTarget(inv);
                                    setOpenMenuId(null);
                                  }}
                                  style={{
                                    display: 'flex',
                                    width: '100%',
                                    alignItems: 'center',
                                    gap: 10,
                                    padding: '8px 12px',
                                    fontSize: 13,
                                    color: '#f87171',
                                    background: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                  }}
                                  onMouseEnter={(e) =>
                                    (e.currentTarget.style.background = 'rgba(239,68,68,0.08)')
                                  }
                                  onMouseLeave={(e) =>
                                    (e.currentTarget.style.background = 'transparent')
                                  }
                                >
                                  <Trash2 size={14} /> Revoke
                                </button>
                              </div>
                            )}
                          </div>
                        </PermissionGuard>
                      </td>
                    </tr>
                  ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile cards — scrollable */}
            <div className="md:hidden" style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
              {invitations.map((inv) => (
                <div key={inv.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 text-sm font-bold">
                      {getInitials(inv.name ?? '')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900">{inv.name}</p>
                      <p className="text-xs text-slate-500 truncate">{inv.email}</p>
                      <div className="mt-2 flex items-center gap-2 flex-wrap">
                        <StatusBadge status={inv.status} />
                        <span className="rounded-md bg-brand-50 border border-brand-200 px-2 py-0.5 text-xs font-medium text-brand-700">
                          {inv.roleName ?? '—'}
                        </span>
                      </div>
                      <p className="mt-1.5 text-xs text-slate-400">
                        Expires {formatDate(inv.expiresAt)}
                      </p>
                    </div>
                  </div>
                  <PermissionGuard required={[PERMISSIONS.INVITATION_WRITE]} fallback={null}>
                    <div className="mt-3 flex gap-2">
                      {inv.status === 'PENDING' && (
                        <AdminButton
                          size="sm"
                          variant="outline"
                          icon={<Send className="h-3.5 w-3.5" />}
                          onClick={() => setResendTarget(inv)}
                        >
                          Resend
                        </AdminButton>
                      )}
                      <AdminButton
                        size="sm"
                        variant="outline"
                        icon={<Trash2 className="h-3.5 w-3.5" />}
                        onClick={() => setRevokeTarget(inv)}
                      >
                        Revoke
                      </AdminButton>
                    </div>
                  </PermissionGuard>
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

      {/* ── Create Invitation Modal ── */}
      {createOpen && (
        <AdminModal
          open
          overflowVisible
          onClose={() => {
            setCreateOpen(false);
            setRolesDropdownOpen(false);
          }}
          title="New Invitation"
          description="Invite a new user to join the platform"
          footer={
            <>
              <AdminButton
                variant="outline"
                onClick={() => {
                  setCreateOpen(false);
                  setRolesDropdownOpen(false);
                }}
                disabled={creating}
              >
                Cancel
              </AdminButton>
              <AdminButton
                onClick={handleCreate}
                loading={creating}
                icon={!creating ? <Send className="h-4 w-4" /> : undefined}
              >
                Send Invitation
              </AdminButton>
            </>
          }
        >
          {createError && (
            <div
              style={{
                marginBottom: 16,
                borderRadius: 8,
                border: '1px solid rgba(239,68,68,0.3)',
                background: 'rgba(239,68,68,0.08)',
                padding: '10px 14px',
              }}
            >
              <p style={{ margin: 0, fontSize: 13, color: '#f87171' }}>{createError}</p>
            </div>
          )}
          <div className="space-y-4">
            <AdminInput
              label="Full name"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              placeholder="e.g. Jane Smith"
              icon={<User className="h-4 w-4" />}
              autoFocus
            />
            <AdminInput
              label="Email address"
              type="email"
              value={createEmail}
              onChange={(e) => setCreateEmail(e.target.value)}
              placeholder="jane@example.com"
              icon={<Mail className="h-4 w-4" />}
            />
            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: 6,
                  fontSize: 13,
                  fontWeight: 500,
                  color: 'var(--text-secondary)',
                }}
              >
                Role
              </label>
              <div style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setRolesDropdownOpen(!rolesDropdownOpen);
                  }}
                  style={{
                    width: '100%',
                    height: 42,
                    padding: '0 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'var(--input-bg)',
                    border: rolesDropdownOpen
                      ? '1px solid var(--brand-primary, #6366f1)'
                      : '1px solid var(--border-color)',
                    boxShadow: rolesDropdownOpen
                      ? '0 0 0 2px rgba(99,102,241,0.15)'
                      : 'none',
                    borderRadius: 8,
                    fontSize: 14,
                    color: createRoleName ? 'var(--text-primary)' : 'var(--text-muted)',
                    cursor: 'pointer',
                    fontFamily: 'Inter, sans-serif',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <ShieldCheck
                      size={16}
                      color={createRoleName ? 'var(--text-primary)' : 'var(--text-muted)'}
                    />
                    <span style={{ fontWeight: createRoleName ? 600 : 400 }}>
                      {selectedRole ? selectedRole.name : 'Select a role…'}
                    </span>
                  </span>
                  <svg
                    style={{
                      width: 16,
                      height: 16,
                      color: 'var(--text-muted)',
                      transform: rolesDropdownOpen ? 'rotate(180deg)' : 'none',
                      transition: 'transform 0.15s ease',
                    }}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {rolesDropdownOpen && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      position: 'absolute',
                      zIndex: 50,
                      top: 'calc(100% + 6px)',
                      left: 0,
                      right: 0,
                      borderRadius: 10,
                      border: '1px solid var(--border-color)',
                      background: 'var(--surface-dark)',
                      boxShadow: '0 12px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)',
                      padding: 6,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 3,
                    }}
                  >
                    {allRoles
                      .filter((r) => r.name && r.name.trim().toUpperCase() !== 'MANAGER')
                      .map((role) => {
                        const isSelected = createRoleName === role.name;
                        return (
                          <button
                            key={role.id ?? role.name}
                            type="button"
                            onClick={() => {
                              setCreateRoleName(role.name);
                              setRolesDropdownOpen(false);
                            }}
                            style={{
                              display: 'flex',
                              width: '100%',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: 12,
                              padding: '8px 12px',
                              borderRadius: 8,
                              background: isSelected
                                ? 'var(--hover-bg)'
                                : 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              textAlign: 'left',
                              transition: 'background 0.12s ease',
                            }}
                            onMouseEnter={(e) => {
                              if (!isSelected) e.currentTarget.style.background = 'var(--hover-bg)';
                            }}
                            onMouseLeave={(e) => {
                              if (!isSelected) e.currentTarget.style.background = 'transparent';
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div
                                style={{
                                  width: 28,
                                  height: 28,
                                  borderRadius: 6,
                                  background: isSelected
                                    ? 'rgba(99,102,241,0.15)'
                                    : 'var(--surface-medium)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0,
                                }}
                              >
                                <ShieldCheck
                                  size={15}
                                  color={isSelected ? 'var(--text-primary)' : 'var(--text-muted)'}
                                />
                              </div>
                              <div>
                                <p
                                  style={{
                                    margin: 0,
                                    fontSize: 13,
                                    fontWeight: 600,
                                    color: 'var(--text-primary)',
                                  }}
                                >
                                  {role.name}
                                </p>
                                <p
                                  style={{
                                    margin: 0,
                                    fontSize: 11.5,
                                    color: 'var(--text-muted)',
                                    lineHeight: 1.3,
                                  }}
                                >
                                  {role.description || ROLE_DESCRIPTIONS[role.name] || 'Platform role'}
                                </p>
                              </div>
                            </div>
                            {isSelected && (
                              <Check size={16} color="var(--text-primary)" style={{ flexShrink: 0 }} />
                            )}
                          </button>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </AdminModal>
      )}

      {/* ── Resend confirm ── */}
      {resendTarget && (
        <AdminConfirmModal
          open
          onClose={() => setResendTarget(null)}
          onConfirm={handleResend}
          title="Resend Invitation"
          message={`A new invitation email will be sent to ${resendTarget.email} with a fresh expiry.`}
          confirmLabel="Resend"
          variant="primary"
          loading={actionLoading}
        />
      )}

      {/* ── Revoke confirm ── */}
      {revokeTarget && (
        <AdminConfirmModal
          open
          onClose={() => setRevokeTarget(null)}
          onConfirm={handleRevoke}
          title="Revoke Invitation"
          message={`The invitation for ${revokeTarget.email} will be permanently revoked.`}
          confirmLabel="Revoke"
          variant="danger"
          loading={actionLoading}
        />
      )}
    </div>
  );
};

export default InvitationListPage;
