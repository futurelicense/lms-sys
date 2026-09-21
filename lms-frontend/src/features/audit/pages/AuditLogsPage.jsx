import { useState, useCallback, useEffect } from 'react';
import { Search, ShieldAlert, RefreshCw, ChevronDown } from 'lucide-react';
import AdminButton from '../../../components/ui/AdminButton';
import AdminInput from '../../../components/ui/AdminInput';
import AdminPagination, {
  AdminEmptyState,
  AdminErrorState,
} from '../../../components/ui/AdminPagination';
import { AdminTableSkeleton } from '../../../components/ui/AdminSkeleton';
import auditService from '../services/auditService';
import { formatDateTime } from '../../../utils/dateUtils';

const AUDIT_ACTIONS = [
  'ALL',
  'LOGIN_SUCCESS', 'LOGIN_FAILED', 'LOGOUT', 'TOKEN_REFRESHED',
  'PASSWORD_CHANGED', 'PASSWORD_RESET_REQUESTED', 'PASSWORD_RESET',
  'ROLE_ASSIGNED', 'ROLE_REMOVED',
  'ACCOUNT_LOCKED', 'ACCOUNT_UNLOCKED', 'ACCOUNT_ACTIVATED', 'ACCOUNT_DEACTIVATED',
  'USER_INVITED', 'INVITATION_ACCEPTED', 'INVITATION_REVOKED', 'INVITATION_RESENT',
  'SESSION_REVOKED',
  'COURSE_CREATED', 'COURSE_UPDATED', 'COURSE_SUBMITTED', 'COURSE_APPROVED',
  'COURSE_REJECTED', 'COURSE_PUBLISHED', 'COURSE_UNPUBLISHED', 'COURSE_ARCHIVED', 'COURSE_DELETED',
  'STUDENT_CREATED', 'STUDENT_UPDATED', 'STUDENT_DELETED',
  'INSTRUCTOR_CREATED', 'INSTRUCTOR_UPDATED', 'INSTRUCTOR_DELETED',
];

const RESOURCES = ['ALL', 'user', 'course', 'student', 'instructor', 'invitation', 'role', 'session'];

const ACTION_COLORS = {
  LOGIN_SUCCESS:    { bg: 'rgba(40,199,111,0.12)',  color: '#28c76f' },
  LOGIN_FAILED:     { bg: 'rgba(234,84,85,0.12)',   color: '#ea5455' },
  LOGOUT:           { bg: 'rgba(168,170,174,0.12)', color: '#a8aaae' },
  ACCOUNT_LOCKED:   { bg: 'rgba(234,84,85,0.12)',   color: '#ea5455' },
  ACCOUNT_UNLOCKED: { bg: 'rgba(40,199,111,0.12)',  color: '#28c76f' },
  ACCOUNT_DEACTIVATED: { bg: 'rgba(234,84,85,0.12)', color: '#ea5455' },
  ACCOUNT_ACTIVATED:   { bg: 'rgba(40,199,111,0.12)', color: '#28c76f' },
  COURSE_APPROVED:  { bg: 'rgba(40,199,111,0.12)',  color: '#28c76f' },
  COURSE_REJECTED:  { bg: 'rgba(234,84,85,0.12)',   color: '#ea5455' },
  COURSE_DELETED:   { bg: 'rgba(234,84,85,0.12)',   color: '#ea5455' },
  COURSE_PUBLISHED: { bg: 'rgba(0,207,232,0.12)',   color: '#00cfe8' },
  PASSWORD_CHANGED: { bg: 'rgba(255,159,67,0.12)',  color: '#ff9f43' },
  PASSWORD_RESET:   { bg: 'rgba(255,159,67,0.12)',  color: '#ff9f43' },
  ROLE_ASSIGNED:    { bg: 'rgba(115,103,240,0.12)', color: '#7367f0' },
  ROLE_REMOVED:     { bg: 'rgba(234,84,85,0.12)',   color: '#ea5455' },
  USER_INVITED:     { bg: 'rgba(0,207,232,0.12)',   color: '#00cfe8' },
};

function ActionBadge({ action }) {
  const c = ACTION_COLORS[action] ?? { bg: 'var(--surface-medium)', color: 'var(--text-muted)' };
  return (
    <span style={{
      background: c.bg, color: c.color,
      padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700,
      whiteSpace: 'nowrap', letterSpacing: '0.02em',
    }}>
      {action.replace(/_/g, ' ')}
    </span>
  );
}

function truncate(str, n = 32) {
  if (!str) return '—';
  return str.length > n ? str.slice(0, n) + '…' : str;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const AuditLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 20;

  const [searchInput, setSearchInput] = useState('');
  const [userId, setUserId] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [resourceFilter, setResourceFilter] = useState('ALL');
  const [actionOpen, setActionOpen] = useState(false);
  const [resourceOpen, setResourceOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const trimmedUser = userId.trim();
      const validUserId = trimmedUser && UUID_REGEX.test(trimmedUser) ? trimmedUser : undefined;

      const params = {
        page,
        size: pageSize,
        sort: 'createdAt,desc',
        ...(validUserId ? { userId: validUserId } : {}),
        ...(actionFilter !== 'ALL' ? { action: actionFilter } : {}),
        ...(resourceFilter !== 'ALL' ? { resource: resourceFilter } : {}),
      };

      const res = await auditService.list(params);
      // http.get unwraps ApiResponse -> res is PageResponse object
      const page_data = res?.data?.data ?? res?.data ?? res ?? {};
      const content = Array.isArray(page_data?.content) ? page_data.content : [];

      setLogs(content);
      setTotalPages(typeof page_data?.totalPages === 'number' ? page_data.totalPages : 0);
      setTotalElements(typeof page_data?.totalElements === 'number' ? page_data.totalElements : content.length);
    } catch (err) {
      setLoadError(err?.message ?? 'Failed to load audit logs. Please check server connection.');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, userId, actionFilter, resourceFilter]);

  useEffect(() => { load(); }, [load]);

  // close dropdowns on outside click
  useEffect(() => {
    if (!actionOpen && !resourceOpen) return;
    const handler = () => { setActionOpen(false); setResourceOpen(false); };
    window.addEventListener('click', handler);
    return () => window.removeEventListener('click', handler);
  }, [actionOpen, resourceOpen]);

  const handleApplyUserId = () => { setPage(0); setUserId(searchInput.trim()); };

  const filteredLogs = logs; // server-side filtered

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
            Audit Logs
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--text-muted)' }}>
            Tamper-proof record of every security-relevant action on the platform.
          </p>
        </div>
        <AdminButton variant="outline" icon={<RefreshCw size={14} />} onClick={() => { setPage(0); load(); }}>
          Refresh
        </AdminButton>
      </div>

      {/* Filters */}
      <div style={{ background: 'var(--lms-card)', border: '1px solid var(--border-color)', borderRadius: 12, padding: 16 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>

          {/* User ID search */}
          <div style={{ flex: '1 1 220px', minWidth: 180 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 6 }}>
              Filter by User ID
            </label>
            <AdminInput
              placeholder="Paste a user UUID…"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleApplyUserId()}
              icon={<Search size={14} />}
            />
          </div>

          {/* Action dropdown */}
          <div style={{ position: 'relative', flex: '1 1 180px', minWidth: 160 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 6 }}>
              Action
            </label>
            <button
              onClick={e => { e.stopPropagation(); setActionOpen(o => !o); setResourceOpen(false); }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 12px', borderRadius: 8, fontSize: 13, fontWeight: 500,
                border: '1px solid var(--border-color)', background: 'var(--lms-card)',
                color: 'var(--text-primary)', cursor: 'pointer',
              }}
            >
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {actionFilter === 'ALL' ? 'All Actions' : actionFilter.replace(/_/g, ' ')}
              </span>
              <ChevronDown size={14} style={{ flexShrink: 0, marginLeft: 6 }} />
            </button>
            {actionOpen && (
              <div onClick={e => e.stopPropagation()} style={{
                position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, marginTop: 4,
                background: 'var(--surface-dark)', border: '1px solid var(--border-color)',
                borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                maxHeight: 260, overflowY: 'auto',
              }}>
                {AUDIT_ACTIONS.map(a => (
                  <button key={a} onClick={() => { setActionFilter(a); setActionOpen(false); setPage(0); }}
                    style={{
                      display: 'block', width: '100%', textAlign: 'left', padding: '8px 14px',
                      fontSize: 13, border: 'none', cursor: 'pointer',
                      background: actionFilter === a ? 'var(--hover-bg)' : 'transparent',
                      color: actionFilter === a ? 'var(--text-primary)' : 'var(--text-secondary)',
                      fontWeight: actionFilter === a ? 700 : 400,
                    }}
                    onMouseEnter={e => { if (actionFilter !== a) e.currentTarget.style.background = 'var(--hover-bg)'; }}
                    onMouseLeave={e => { if (actionFilter !== a) e.currentTarget.style.background = 'transparent'; }}
                  >
                    {a === 'ALL' ? 'All Actions' : a.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Resource dropdown */}
          <div style={{ position: 'relative', flex: '1 1 160px', minWidth: 140 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 6 }}>
              Resource
            </label>
            <button
              onClick={e => { e.stopPropagation(); setResourceOpen(o => !o); setActionOpen(false); }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 12px', borderRadius: 8, fontSize: 13, fontWeight: 500,
                border: '1px solid var(--border-color)', background: 'var(--lms-card)',
                color: 'var(--text-primary)', cursor: 'pointer',
              }}
            >
              <span>{resourceFilter === 'ALL' ? 'All Resources' : resourceFilter}</span>
              <ChevronDown size={14} style={{ flexShrink: 0, marginLeft: 6 }} />
            </button>
            {resourceOpen && (
              <div onClick={e => e.stopPropagation()} style={{
                position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, marginTop: 4,
                background: 'var(--surface-dark)', border: '1px solid var(--border-color)',
                borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
              }}>
                {RESOURCES.map(r => (
                  <button key={r} onClick={() => { setResourceFilter(r); setResourceOpen(false); setPage(0); }}
                    style={{
                      display: 'block', width: '100%', textAlign: 'left', padding: '8px 14px',
                      fontSize: 13, border: 'none', cursor: 'pointer',
                      background: resourceFilter === r ? 'var(--hover-bg)' : 'transparent',
                      color: resourceFilter === r ? 'var(--text-primary)' : 'var(--text-secondary)',
                      fontWeight: resourceFilter === r ? 700 : 400,
                    }}
                    onMouseEnter={e => { if (resourceFilter !== r) e.currentTarget.style.background = 'var(--hover-bg)'; }}
                    onMouseLeave={e => { if (resourceFilter !== r) e.currentTarget.style.background = 'transparent'; }}
                  >
                    {r === 'ALL' ? 'All Resources' : r}
                  </button>
                ))}
              </div>
            )}
          </div>

          <AdminButton onClick={handleApplyUserId} style={{ alignSelf: 'flex-end' }}>
            Apply
          </AdminButton>
          <AdminButton variant="outline" onClick={() => { setSearchInput(''); setUserId(''); setActionFilter('ALL'); setResourceFilter('ALL'); setPage(0); }} style={{ alignSelf: 'flex-end' }}>
            Clear
          </AdminButton>
        </div>
      </div>

      {/* Table card */}
      <div style={{ background: 'var(--lms-card)', border: '1px solid var(--border-color)', borderRadius: 12, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 24 }}>
            <AdminTableSkeleton rows={8} cols={6} />
          </div>
        ) : loadError ? (
          <AdminErrorState message={loadError} onRetry={load} />
        ) : filteredLogs.length === 0 ? (
          <AdminEmptyState
            icon={<ShieldAlert size={28} />}
            title="No audit logs found"
            message="No events match your current filters. Try adjusting or clearing them."
          />
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--surface-medium)', borderBottom: '1px solid var(--border-color)' }}>
                    {['Timestamp', 'Action', 'Resource', 'Resource ID', 'User / Actor', 'IP Address', 'Details'].map(h => (
                      <th key={h} style={{
                        padding: '11px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700,
                        textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)',
                        whiteSpace: 'nowrap',
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log, i) => (
                    <tr key={log.id ?? i}
                      style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.1s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--hover-bg)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {formatDateTime(log.createdAt)}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <ActionBadge action={log.action} />
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        {log.resource ?? '—'}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {log.resourceId ? (
                          <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--text-muted)', background: 'var(--surface-medium)', padding: '2px 6px', borderRadius: 4 }}>
                            {String(log.resourceId).slice(0, 8)}…
                          </span>
                        ) : '—'}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {log.userName || log.userEmail ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                              {log.userName || log.userEmail}
                            </span>
                            {log.userName && log.userEmail && (
                              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                {log.userEmail}
                              </span>
                            )}
                          </div>
                        ) : log.userId ? (
                          <span title={log.userId} style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--text-muted)', background: 'var(--surface-medium)', padding: '2px 6px', borderRadius: 4 }}>
                            {String(log.userId).slice(0, 8)}…
                          </span>
                        ) : (
                          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>system</span>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {log.ipAddress ?? '—'}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-secondary)', maxWidth: 240 }}>
                        <span title={log.details ?? ''}>{truncate(log.details, 40)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-color)' }}>
                <AdminPagination
                  page={page}
                  totalPages={totalPages}
                  totalElements={totalElements}
                  size={pageSize}
                  onPageChange={setPage}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AuditLogsPage;
