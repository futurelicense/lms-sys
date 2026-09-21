import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Filter, RefreshCw, ScrollText, Search, ShieldAlert } from 'lucide-react';
import platformService from '../services/platformService';
import AdminButton from '../../../components/ui/AdminButton';
import AdminBadge from '../../../components/ui/AdminBadge';
import AdminInput from '../../../components/ui/AdminInput';
import { AdminTableSkeleton } from '../../../components/ui/AdminSkeleton';
import { AdminEmptyState } from '../../../components/ui/AdminPagination';

const EVENT_TYPE_BADGES = {
  TENANT_REQUESTED: 'info',
  DATABASE_CREATED: 'info',
  TENANT_PROVISIONED: 'success',
  TENANT_SUSPENDED: 'warning',
  CLOUD_PROJECT_PAUSED: 'neutral',
  CLOUD_PROJECT_RESTORED: 'success',
  TENANT_IMPERSONATED: 'warning',
  TENANT_CONFIG_UPDATED: 'success',
  TENANT_DELETION_SCHEDULED: 'danger',
  CONTROL_PLANE_ROLE_MIGRATED: 'default',
};

const formatDate = (iso) => {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(iso));
};

export const PlatformAuditLogsPage = () => {
  const [selectedTenantId, setSelectedTenantId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const { data: tenants = [] } = useQuery({
    queryKey: ['platform-tenants'],
    queryFn: platformService.listTenants,
  });

  const { data: auditLogs = [], isLoading, isFetching, refetch } = useQuery({
    queryKey: ['platform-audit-logs', selectedTenantId],
    queryFn: () => platformService.listAuditLogs(selectedTenantId ? { tenantId: selectedTenantId } : {}),
  });

  const filteredLogs = auditLogs.filter((log) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      log.eventType?.toLowerCase().includes(term) ||
      log.message?.toLowerCase().includes(term) ||
      log.tenantSlug?.toLowerCase().includes(term) ||
      log.tenantName?.toLowerCase().includes(term)
    );
  });

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
            Security & Compliance
          </span>
          <h1 style={{ margin: '4px 0 0', fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
            Platform Audit Trail
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
            Immutable audit record of all control plane operations, tenant lifecycle actions, and impersonation sessions.
          </p>
        </div>

        <AdminButton
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          loading={isFetching}
          icon={<RefreshCw size={14} />}
        >
          Refresh Stream
        </AdminButton>
      </div>

      {/* ── Filter Bar ── */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          padding: '12px 16px',
          borderRadius: 12,
          background: 'var(--surface-medium)',
          border: '1px solid var(--border-color)',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, flex: 1, minWidth: 260 }}>
          <div style={{ maxWidth: 300, flex: 1 }}>
            <AdminInput
              placeholder="Search event, message, or tenant..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<Search size={14} />}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Filter size={14} style={{ color: 'var(--text-muted)' }} />
            <select
              value={selectedTenantId}
              onChange={(e) => setSelectedTenantId(e.target.value)}
              style={{
                height: 38,
                padding: '0 12px',
                borderRadius: 8,
                background: 'var(--input-bg)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                fontSize: 13,
                fontFamily: 'Inter, sans-serif',
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              <option value="">All Workspaces</option>
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.slug})
                </option>
              ))}
            </select>
          </div>
        </div>

        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          Showing <strong style={{ color: 'var(--text-primary)' }}>{filteredLogs.length}</strong> events
        </span>
      </div>

      {/* ── Table Card ── */}
      <div
        style={{
          background: 'var(--lms-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 12,
          overflow: 'hidden',
        }}
      >
        {isLoading ? (
          <div style={{ padding: 24 }}>
            <AdminTableSkeleton rows={8} cols={5} />
          </div>
        ) : filteredLogs.length === 0 ? (
          <div style={{ padding: 40 }}>
            <AdminEmptyState
              icon={<ShieldAlert size={28} />}
              title="No audit events found"
              message="No platform control-plane events match your search filters."
            />
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--surface-medium)', borderBottom: '1px solid var(--border-color)' }}>
                  {['Timestamp', 'Workspace', 'Event Type', 'Message / Event Details', 'Actor ID'].map((h) => (
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
                {filteredLogs.map((log) => (
                  <tr
                    key={log.id}
                    style={{
                      borderBottom: '1px solid var(--border-color)',
                      transition: 'background 0.1s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--hover-bg)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: 12, whiteSpace: 'nowrap' }}>
                      {formatDate(log.createdAt)}
                    </td>
                    <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', display: 'block' }}>
                        {log.tenantName}
                      </span>
                      <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--text-muted)' }}>
                        {log.tenantSlug}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                      <AdminBadge variant={EVENT_TYPE_BADGES[log.eventType] || 'default'} dot>
                        {log.eventType}
                      </AdminBadge>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', maxWidth: 450, wordBreak: 'break-word' }}>
                      {log.message}
                    </td>
                    <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                      <span
                        style={{
                          fontFamily: 'monospace',
                          fontSize: 11,
                          color: 'var(--text-muted)',
                          background: 'var(--surface-medium)',
                          padding: '2px 6px',
                          borderRadius: 4,
                        }}
                      >
                        {log.actorId ? String(log.actorId).slice(0, 8) + '…' : 'System'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlatformAuditLogsPage;
