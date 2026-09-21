import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Activity,
  Award,
  BookOpen,
  Building2,
  Cpu,
  Database,
  ExternalLink,
  HardDrive,
  Layers,
  Megaphone,
  RefreshCw,
  ScrollText,
  Users,
} from 'lucide-react';
import platformService from '../services/platformService';
import { ROUTES } from '../../../constants/routes';
import AdminButton from '../../../components/ui/AdminButton';
import AdminBadge from '../../../components/ui/AdminBadge';
import { AdminCardSkeleton } from '../../../components/ui/AdminSkeleton';

export const PlatformDashboardPage = () => {
  const {
    data: overview,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: ['platform-overview'],
    queryFn: platformService.getOverview,
    refetchInterval: 30000,
  });

  const { data: tenants = [] } = useQuery({
    queryKey: ['platform-tenants'],
    queryFn: platformService.listTenants,
  });

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          {[1, 2, 3, 4].map((i) => (
            <AdminCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          padding: 24,
          borderRadius: 12,
          border: '1px solid rgba(239,68,68,0.3)',
          background: 'rgba(239,68,68,0.08)',
          color: '#f87171',
        }}
      >
        <p style={{ margin: '0 0 12px 0', fontSize: 14 }}>
          Failed to load platform overview: {error?.message}
        </p>
        <AdminButton variant="danger" size="sm" onClick={() => refetch()}>
          Retry
        </AdminButton>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Workspaces',
      value: overview?.totalTenants ?? 0,
      sub: `${overview?.activeTenants ?? 0} active, ${overview?.suspendedTenants ?? 0} suspended`,
      icon: Building2,
    },
    {
      label: 'Total Users',
      value: overview?.totalUsers ?? 0,
      sub: 'Across all workspaces',
      icon: Users,
    },
    {
      label: 'Catalog Courses',
      value: overview?.totalCourses ?? 0,
      sub: 'Published curricula',
      icon: BookOpen,
    },
    {
      label: 'Assessments',
      value: overview?.totalAssessments ?? 0,
      sub: 'Quizzes & coding tests',
      icon: Award,
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1400, margin: '0 auto' }}>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
              Telemetry & Control
            </span>
            <AdminBadge variant="success" dot>
              Operational
            </AdminBadge>
          </div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
            Platform Overview
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
            Real-time cross-tenant telemetry, database cluster health, and workspace utilization.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <AdminButton
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            loading={isFetching}
            icon={<RefreshCw size={14} />}
          >
            Refresh
          </AdminButton>
          <Link to={ROUTES.PLATFORM_TENANTS} style={{ textDecoration: 'none' }}>
            <AdminButton size="sm" icon={<Building2 size={14} />}>
              Manage Workspaces
            </AdminButton>
          </Link>
          <Link to={ROUTES.PLATFORM_ANNOUNCEMENTS} style={{ textDecoration: 'none' }}>
            <AdminButton variant="secondary" size="sm" icon={<Megaphone size={14} />}>
              Broadcast
            </AdminButton>
          </Link>
        </div>
      </div>

      {/* ── KPI Stat Cards ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 16,
        }}
      >
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              style={{
                background: 'var(--surface-medium)',
                border: '1px solid var(--border-color)',
                borderRadius: 12,
                padding: '20px 22px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    color: 'var(--text-muted)',
                  }}
                >
                  {card.label}
                </span>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: 'var(--surface-dark)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <Icon size={16} />
                </div>
              </div>

              <div style={{ marginTop: 14 }}>
                <span
                  style={{
                    fontSize: 32,
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    letterSpacing: '-0.5px',
                    lineHeight: 1,
                  }}
                >
                  {card.value}
                </span>
                <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
                  {card.sub}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Lower Panels: System Health & Workspaces Preview ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: 20,
        }}
      >
        {/* System Health Card */}
        <div
          style={{
            background: 'var(--surface-medium)',
            border: '1px solid var(--border-color)',
            borderRadius: 12,
            padding: 22,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingBottom: 14,
              borderBottom: '1px solid var(--border-color)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Activity size={16} style={{ color: '#4ade80' }} />
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                System Infrastructure
              </h3>
            </div>
            <AdminBadge variant="success" dot>
              {overview?.systemHealth?.status || 'HEALTHY'}
            </AdminBadge>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: 8,
                background: 'var(--surface-dark)',
                border: '1px solid var(--border-color)',
                fontSize: 13,
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)' }}>
                <Database size={15} style={{ color: '#67e8f9' }} /> Database Connectivity
              </span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                {overview?.systemHealth?.databaseStatus || 'CONNECTED'}
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: 8,
                background: 'var(--surface-dark)',
                border: '1px solid var(--border-color)',
                fontSize: 13,
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)' }}>
                <HardDrive size={15} style={{ color: '#c084fc' }} /> JVM Heap Memory
              </span>
              <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--text-primary)' }}>
                {overview?.systemHealth?.usedMemoryMb} MB / {overview?.systemHealth?.maxMemoryMb} MB
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: 8,
                background: 'var(--surface-dark)',
                border: '1px solid var(--border-color)',
                fontSize: 13,
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)' }}>
                <Cpu size={15} style={{ color: '#facc15' }} /> CPU Compute Threads
              </span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                {overview?.systemHealth?.availableProcessors || 4} Processors
              </span>
            </div>
          </div>
        </div>

        {/* Tenant Workspaces Preview Card */}
        <div
          style={{
            background: 'var(--surface-medium)',
            border: '1px solid var(--border-color)',
            borderRadius: 12,
            padding: 22,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingBottom: 14,
              borderBottom: '1px solid var(--border-color)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Layers size={16} style={{ color: 'var(--text-secondary)' }} />
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                Active Workspaces
              </h3>
            </div>
            <Link
              to={ROUTES.PLATFORM_TENANTS}
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--text-secondary)',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              View all <ExternalLink size={12} />
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {tenants.slice(0, 4).map((tenant) => (
              <div
                key={tenant.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: 8,
                  background: 'var(--surface-dark)',
                  border: '1px solid var(--border-color)',
                }}
              >
                <div style={{ minWidth: 0, paddingRight: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                      {tenant.name}
                    </span>
                    <span
                      style={{
                        fontFamily: 'monospace',
                        fontSize: 11,
                        color: 'var(--text-muted)',
                        background: 'var(--surface-medium)',
                        padding: '1px 6px',
                        borderRadius: 4,
                      }}
                    >
                      {tenant.slug}
                    </span>
                  </div>
                  <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {tenant.ownerEmail}
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AdminBadge
                    variant={tenant.status === 'ACTIVE' ? 'success' : 'warning'}
                    dot
                  >
                    {tenant.status}
                  </AdminBadge>
                  <Link to={ROUTES.PLATFORM_TENANTS} style={{ color: 'var(--text-muted)', display: 'flex' }}>
                    <ExternalLink size={14} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlatformDashboardPage;
