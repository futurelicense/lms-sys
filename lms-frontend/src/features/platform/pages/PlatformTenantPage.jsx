import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  Building2,
  Clock,
  PauseCircle,
  PlayCircle,
  Plus,
  RefreshCw,
  ServerCog,
  ShieldAlert,
  Sliders,
  UserCheck,
  Wrench,
  X,
} from 'lucide-react';
import platformAuthStorage from '../services/platformAuthStorage';
import platformService from '../services/platformService';
import tokenStorage from '../../../services/storage/tokenStorage';
import storage from '../../../services/storage/localStorage';
import { STORAGE_KEYS } from '../../../constants/appConstants';
import TenantConfigDrawer from '../components/TenantConfigDrawer';
import AdminButton from '../../../components/ui/AdminButton';
import AdminBadge from '../../../components/ui/AdminBadge';
import AdminInput from '../../../components/ui/AdminInput';
import AdminModal from '../../../components/ui/AdminModal';
import { AdminTableSkeleton } from '../../../components/ui/AdminSkeleton';

const emptyTenant = { name: '', slug: '', ownerName: '', ownerEmail: '', initialAdminPassword: '' };

const statusBadgeVariant = {
  ACTIVE: 'success',
  PROVISIONING: 'warning',
  SUSPENDED: 'neutral',
  CLOUD_PAUSING: 'info',
  CLOUD_PAUSED: 'info',
  CLOUD_RESTORING: 'warning',
  DELETION_SCHEDULED: 'danger',
  PROVISION_FAILED: 'danger',
};

const formatDate = (value) =>
  value ? new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(value)) : '—';

export const PlatformTenantPage = () => {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [values, setValues] = useState(emptyTenant);
  const [actionError, setActionError] = useState('');
  const [impersonatingTenantId, setImpersonatingTenantId] = useState(null);
  const [configTenant, setConfigTenant] = useState(null);
  const [debugModalTenant, setDebugModalTenant] = useState(null);
  const [debugReason, setDebugReason] = useState('Bug Analysis & Diagnostics');
  const [customReason, setCustomReason] = useState('');

  const DEBUG_REASONS = [
    'Bug Analysis & Diagnostics',
    'Curriculum & Course Setup',
    'Assessment & Grading Diagnostics',
    'Tenant Permission & Role Audit',
    'Incident Investigation',
  ];

  const hasToken = Boolean(platformAuthStorage.getToken());
  const tenants = useQuery({
    queryKey: ['platform-tenants'],
    queryFn: platformService.listTenants,
    enabled: hasToken,
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['platform-tenants'] });

  const create = useMutation({
    mutationFn: platformService.createTenant,
    onSuccess: () => {
      setValues(emptyTenant);
      setFormOpen(false);
      setActionError('');
      refresh();
    },
    onError: (error) => setActionError(error?.response?.data?.message ?? 'Tenant registration failed.'),
  });

  const lifecycle = useMutation({
    mutationFn: ({ action, id }) => platformService[action](id),
    onSuccess: () => {
      setActionError('');
      refresh();
    },
    onError: (error) => setActionError(error?.response?.data?.message ?? 'Tenant lifecycle action failed.'),
  });

  const submit = (event) => {
    event.preventDefault();
    create.mutate({ ...values, slug: values.slug.trim().toLowerCase() });
  };

  const runAction = (action, id) => lifecycle.mutate({ action, id });

  const handleLaunchDebugSession = async () => {
    if (!debugModalTenant) return;
    const finalReason = customReason.trim() || debugReason;
    setImpersonatingTenantId(debugModalTenant.id);
    setActionError('');
    try {
      const response = await platformService.impersonateTenant(debugModalTenant.id, {
        reason: finalReason,
        durationMinutes: 30,
      });
      const expiresAt = response.expiresAt ? new Date(response.expiresAt).getTime() : Date.now() + 30 * 60 * 1000;
      localStorage.setItem(
        'lms_impersonation',
        JSON.stringify({
          isImpersonating: true,
          tenantSlug: response.tenantSlug,
          tenantId: response.tenantId,
          targetUserEmail: response.targetUserEmail,
          targetUserName: response.targetUserName,
          reason: response.reason || finalReason,
          expiresAt,
          durationMinutes: 30,
          returnUrl: '/platform/tenants',
        })
      );
      storage.set(STORAGE_KEYS.TENANT, { slug: response.tenantSlug });
      tokenStorage.setAccessToken(response.accessToken);
      const destination =
        response.workspaceUrl === '/admin/dashboard'
          ? '/admin/analytics'
          : response.workspaceUrl || '/admin/analytics';
      window.location.href = destination;
    } catch (err) {
      setActionError(err?.response?.data?.message || 'Failed to initialize temporary debug access.');
      setImpersonatingTenantId(null);
      setDebugModalTenant(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1400, margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>
      {/* ── Page Header ── */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          paddingBottom: 20,
          borderBottom: '1px solid var(--border-color)',
        }}
      >
        <div>
          <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
            Environment Management
          </span>
          <h1 style={{ margin: '4px 0 0', fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
            Workspaces & Databases
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
            Create, monitor, configure, and isolate tenant cloud databases.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <AdminButton
            variant="outline"
            size="sm"
            onClick={refresh}
            loading={tenants.isFetching}
            icon={<RefreshCw size={14} />}
          >
            Refresh
          </AdminButton>
          <AdminButton
            size="sm"
            onClick={() => setFormOpen((open) => !open)}
            icon={formOpen ? <X size={14} /> : <Plus size={14} />}
          >
            {formOpen ? 'Close Form' : 'Register Workspace'}
          </AdminButton>
        </div>
      </div>

      {actionError && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 8,
            border: '1px solid rgba(239,68,68,0.3)',
            background: 'rgba(239,68,68,0.08)',
            color: '#f87171',
            fontSize: 13,
          }}
        >
          {actionError}
        </div>
      )}

      {/* ── Tenant Registration Form Card ── */}
      {formOpen && (
        <div
          style={{
            background: 'var(--surface-medium)',
            border: '1px solid var(--border-color)',
            borderRadius: 12,
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 12, borderBottom: '1px solid var(--border-color)' }}>
            <ServerCog size={18} style={{ color: 'var(--text-secondary)' }} />
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
              Register a New Tenant Workspace
            </h3>
          </div>

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
              <AdminInput
                label="Workspace Name"
                placeholder="e.g. Acme Academy"
                required
                value={values.name}
                onChange={(e) => setValues({ ...values, name: e.target.value })}
              />
              <AdminInput
                label="Tenant Slug (subdomain)"
                placeholder="e.g. acme"
                required
                value={values.slug}
                onChange={(e) => setValues({ ...values, slug: e.target.value })}
              />
              <AdminInput
                label="Initial Admin Full Name"
                placeholder="e.g. Jane Doe"
                required
                value={values.ownerName}
                onChange={(e) => setValues({ ...values, ownerName: e.target.value })}
              />
              <AdminInput
                label="Initial Admin Email"
                type="email"
                placeholder="e.g. admin@acme.edu"
                required
                value={values.ownerEmail}
                onChange={(e) => setValues({ ...values, ownerEmail: e.target.value })}
              />
              <AdminInput
                label="Initial Admin Password"
                type="password"
                placeholder="Min 12 characters"
                minLength={12}
                required
                value={values.initialAdminPassword}
                onChange={(e) => setValues({ ...values, initialAdminPassword: e.target.value })}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 8 }}>
              <AdminButton variant="outline" size="sm" onClick={() => setFormOpen(false)}>
                Cancel
              </AdminButton>
              <AdminButton type="submit" size="sm" loading={create.isPending}>
                Create Workspace
              </AdminButton>
            </div>
          </form>
        </div>
      )}

      {/* ── Table Card ── */}
      <div
        style={{
          background: 'var(--lms-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 12,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 20px',
            borderBottom: '1px solid var(--border-color)',
            background: 'var(--surface-dark)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Building2 size={16} style={{ color: 'var(--text-secondary)' }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
              Registered Environments ({tenants.data?.length ?? 0})
            </span>
          </div>
        </div>

        {tenants.isLoading ? (
          <div style={{ padding: 24 }}>
            <AdminTableSkeleton rows={4} cols={4} />
          </div>
        ) : tenants.isError ? (
          <div style={{ padding: '32px 20px', textAlign: 'center', color: '#f87171', fontSize: 13 }}>
            Unable to load tenants. Please refresh and check authorization.
          </div>
        ) : tenants.data?.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
            No tenants registered yet. Use the &quot;Register Workspace&quot; button above to create one.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--surface-medium)', borderBottom: '1px solid var(--border-color)' }}>
                  {['Workspace', 'Status', 'Provisioned / Created', 'Control Actions'].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: '11px 16px',
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        color: 'var(--text-muted)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tenants.data.map((tenant) => (
                  <tr
                    key={tenant.id}
                    style={{
                      borderBottom: '1px solid var(--border-color)',
                      transition: 'background 0.1s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--hover-bg)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    {/* Workspace details */}
                    <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                        {tenant.name}
                      </p>
                      <span
                        style={{
                          display: 'inline-block',
                          fontFamily: 'monospace',
                          fontSize: 11,
                          color: 'var(--text-muted)',
                          background: 'var(--surface-dark)',
                          padding: '1px 6px',
                          borderRadius: 4,
                          marginTop: 4,
                          border: '1px solid var(--border-color)',
                        }}
                      >
                        {tenant.slug}
                      </span>
                      <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
                        {tenant.ownerEmail}
                      </p>
                      {tenant.failureReason && (
                        <p
                          style={{
                            margin: '6px 0 0',
                            fontSize: 11,
                            color: '#f87171',
                            background: 'rgba(239,68,68,0.1)',
                            padding: '4px 8px',
                            borderRadius: 4,
                            border: '1px solid rgba(239,68,68,0.2)',
                          }}
                        >
                          {tenant.failureReason}
                        </p>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td style={{ padding: '14px 16px', verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                      <AdminBadge
                        variant={statusBadgeVariant[tenant.status] || 'default'}
                        dot
                      >
                        {tenant.status.replaceAll('_', ' ')}
                      </AdminBadge>
                    </td>

                    {/* Created date */}
                    <td style={{ padding: '14px 16px', verticalAlign: 'top', color: 'var(--text-muted)', fontSize: 12, whiteSpace: 'nowrap' }}>
                      {formatDate(tenant.provisionedAt ?? tenant.createdAt)}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
                        {/* 30-Minute Temporary Debug Access Button */}
                        {tenant.status === 'ACTIVE' && (
                          <AdminButton
                            size="sm"
                            onClick={() => {
                              setDebugModalTenant(tenant);
                              setDebugReason('Bug Analysis & Diagnostics');
                              setCustomReason('');
                            }}
                            loading={impersonatingTenantId === tenant.id}
                            icon={<Wrench size={14} />}
                          >
                            Debug Access (30m)
                          </AdminButton>
                        )}

                        {/* Config Button */}
                        <AdminButton
                          variant="secondary"
                          size="sm"
                          onClick={() => setConfigTenant(tenant)}
                          icon={<Sliders size={14} />}
                        >
                          Config
                        </AdminButton>

                        {/* Lifecycle controls */}
                        {(tenant.status === 'PROVISIONING' || tenant.status === 'PROVISION_FAILED') && (
                          <AdminButton
                            size="sm"
                            onClick={() => runAction('provisionTenant', tenant.id)}
                            loading={lifecycle.isPending}
                          >
                            Provision
                          </AdminButton>
                        )}

                        {tenant.status === 'ACTIVE' && (
                          <>
                            <AdminButton
                              variant="outline"
                              size="sm"
                              onClick={() => runAction('suspendTenant', tenant.id)}
                              disabled={lifecycle.isPending}
                            >
                              Suspend
                            </AdminButton>
                            <AdminButton
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (
                                  window.confirm(
                                    `Pause ${tenant.name}'s cloud database? LMS access will stop, but all tenant data is retained.`
                                  )
                                )
                                  runAction('pauseCloudProject', tenant.id);
                              }}
                              disabled={lifecycle.isPending}
                              icon={<PauseCircle size={14} />}
                            >
                              Pause DB
                            </AdminButton>
                          </>
                        )}

                        {tenant.status === 'CLOUD_PAUSED' && (
                          <AdminButton
                            variant="primary"
                            size="sm"
                            onClick={() => runAction('restoreCloudProject', tenant.id)}
                            loading={lifecycle.isPending}
                            icon={<PlayCircle size={14} />}
                          >
                            Resume DB
                          </AdminButton>
                        )}

                        {!['DELETION_SCHEDULED', 'DELETED'].includes(tenant.status) && (
                          <AdminButton
                            variant="danger"
                            size="sm"
                            onClick={() => {
                              if (
                                window.confirm(
                                  `Schedule ${tenant.name} for deletion? This is recoverable for 30 days.`
                                )
                              ) {
                                runAction('scheduleDeletion', tenant.id);
                              }
                            }}
                            disabled={lifecycle.isPending}
                            icon={<ShieldAlert size={14} />}
                          >
                            Delete
                          </AdminButton>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Configuration Drawer Modal */}
      <TenantConfigDrawer
        tenant={configTenant}
        isOpen={Boolean(configTenant)}
        onClose={() => setConfigTenant(null)}
      />

      {/* ── 30-Minute Temporary Debug Access Modal ── */}
      <AdminModal
        open={Boolean(debugModalTenant)}
        onClose={() => setDebugModalTenant(null)}
        title="Temporary Debug Access (30 Minutes)"
        description={`Launch a break-glass diagnostic session for workspace "${debugModalTenant?.name}" (${debugModalTenant?.slug}).`}
        footer={
          <>
            <AdminButton variant="outline" onClick={() => setDebugModalTenant(null)}>
              Cancel
            </AdminButton>
            <AdminButton
              onClick={handleLaunchDebugSession}
              loading={impersonatingTenantId === debugModalTenant?.id}
              icon={<Wrench size={14} />}
            >
              Start 30-Minute Debug Session
            </AdminButton>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Information box */}
          <div
            style={{
              padding: '12px 14px',
              borderRadius: 8,
              background: 'rgba(217, 119, 6, 0.1)',
              border: '1px solid rgba(217, 119, 6, 0.25)',
              display: 'flex',
              gap: 10,
              fontSize: 13,
              color: 'var(--text-secondary)',
              lineHeight: 1.5,
            }}
          >
            <Clock size={18} style={{ color: '#d97706', flexShrink: 0, marginTop: 2 }} />
            <div>
              <strong style={{ color: '#d97706' }}>Strict 30-Minute Expiry:</strong> This debug session will automatically expire and be revoked from both backend and browser in 30 minutes. All actions are logged under the platform audit trail.
            </div>
          </div>

          {/* Quick reason selection */}
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
              Diagnostic Reason / Purpose
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
              {DEBUG_REASONS.map((r) => {
                const isSelected = debugReason === r && !customReason;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      setDebugReason(r);
                      setCustomReason('');
                    }}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 20,
                      fontSize: 12,
                      fontWeight: 600,
                      border: isSelected ? '1px solid var(--primary, #3b82f6)' : '1px solid var(--border-color)',
                      background: isSelected ? 'var(--primary, #3b82f6)' : 'var(--surface-medium)',
                      color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {r}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom reason / ticket notes */}
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
              Custom Reason or Issue / Ticket # (Optional)
            </label>
            <AdminInput
              placeholder="e.g. Issue #245: Reproducing grade sync discrepancy"
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
            />
          </div>
        </div>
      </AdminModal>
    </div>
  );
};

export default PlatformTenantPage;
