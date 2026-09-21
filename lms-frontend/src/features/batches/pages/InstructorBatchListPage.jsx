import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, BookOpen, Calendar, Clock, Search, LayoutGrid, LayoutList,
  ArrowRight, Download, GraduationCap, Award, Layers, ExternalLink, RefreshCw, TrendingUp
} from 'lucide-react';
import AdminButton from '../../../components/ui/AdminButton';
import { useBatches } from '../hooks/useBatches';
import { useAuth } from '../../auth/hooks/useAuth';
import { ROUTES } from '../../../constants/routes';
import CohortRosterModal from '../components/CohortRosterModal';

/* ── Status Pill ── */
const BATCH_STATUS_CONFIG = {
  PLANNED: { label: 'Planned', bg: 'rgba(59, 130, 246, 0.18)', color: '#60a5fa', border: 'rgba(59, 130, 246, 0.35)' },
  ONGOING: { label: 'Ongoing', bg: 'rgba(16, 185, 129, 0.18)', color: '#34d399', border: 'rgba(16, 185, 129, 0.35)' },
  IN_PROGRESS: { label: 'Ongoing', bg: 'rgba(16, 185, 129, 0.18)', color: '#34d399', border: 'rgba(16, 185, 129, 0.35)' },
  COMPLETED: { label: 'Completed', bg: 'rgba(168, 85, 247, 0.18)', color: '#c084fc', border: 'rgba(168, 85, 247, 0.35)' },
  CANCELLED: { label: 'Cancelled', bg: 'rgba(239, 68, 68, 0.18)', color: '#f87171', border: 'rgba(239, 68, 68, 0.35)' },
  ARCHIVED: { label: 'Archived', bg: 'rgba(100, 116, 139, 0.18)', color: '#94a3b8', border: 'rgba(100, 116, 139, 0.35)' },
};

function StatusPill({ status }) {
  const norm = (status || 'PLANNED').toUpperCase();
  const c = BATCH_STATUS_CONFIG[norm] || BATCH_STATUS_CONFIG.PLANNED;
  return (
    <span style={{
      padding: '4px 12px', borderRadius: 99, fontSize: 12, fontWeight: 600,
      background: c.bg, color: c.color, border: `1px solid ${c.border}`,
      backdropFilter: 'blur(8px)', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 6
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.color }} />
      {c.label}
    </span>
  );
}

/* ── Clean Skeleton Card ── */
function SkeletonCard() {
  const s = { background: 'rgba(255, 255, 255, 0.08)', borderRadius: 8, animation: 'pulse 1.5s ease-in-out infinite' };
  return (
    <div style={{ background: 'linear-gradient(180deg, #161922 0%, #11131a 100%)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ ...s, width: 90, height: 24, borderRadius: 6 }} />
        <div style={{ ...s, width: 80, height: 24, borderRadius: 99 }} />
      </div>
      <div style={{ ...s, height: 20, width: '75%' }} />
      <div style={{ ...s, height: 14, width: '55%' }} />
      <div style={{ ...s, height: 60, borderRadius: 10 }} />
      <div style={{ ...s, height: 8, borderRadius: 99 }} />
      <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
        <div style={{ ...s, height: 36, flex: 1, borderRadius: 99 }} />
        <div style={{ ...s, height: 36, width: 100, borderRadius: 99 }} />
      </div>
    </div>
  );
}

const STATUS_FILTERS = ['ALL', 'ONGOING', 'PLANNED', 'COMPLETED', 'ARCHIVED'];

export const InstructorBatchListPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [myCohortsOnly, setMyCohortsOnly] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [selectedBatchForRoster, setSelectedBatchForRoster] = useState(null);

  const { data: pageData, isLoading, refetch } = useBatches({
    size: 100,
  });

  const batches = useMemo(() => {
    return pageData?.content || [];
  }, [pageData]);

  // Telemetry statistics
  const stats = useMemo(() => {
    const total = batches.length;
    const inProgress = batches.filter((b) => b.status === 'IN_PROGRESS' || b.status === 'ONGOING').length;
    const totalEnrolled = batches.reduce((acc, b) => acc + (b.enrolledCount || 0), 0);
    const totalCapacity = batches.reduce((acc, b) => acc + (b.capacity || 0), 0);
    const avgFillRate = totalCapacity > 0 ? Math.round((totalEnrolled / totalCapacity) * 100) : 0;

    return { total, inProgress, totalEnrolled, avgFillRate };
  }, [batches]);

  // Filtered batches
  const filteredBatches = useMemo(() => {
    return batches.filter((batch) => {
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (batch.code && batch.code.toLowerCase().includes(q)) ||
        (batch.name && batch.name.toLowerCase().includes(q)) ||
        (batch.courseTitle && batch.courseTitle.toLowerCase().includes(q));

      const normStatus = (batch.status || '').toUpperCase();
      const matchesStatus =
        statusFilter === 'ALL' ||
        normStatus === statusFilter ||
        (statusFilter === 'ONGOING' && (normStatus === 'IN_PROGRESS' || normStatus === 'ONGOING'));

      const matchesOwner =
        !myCohortsOnly ||
        (user?.id && (batch.instructorId === user.id || batch.createdBy === user.id));

      return matchesSearch && matchesStatus && matchesOwner;
    });
  }, [batches, search, statusFilter, myCohortsOnly, user?.id]);

  return (
    <div className="space-y-6" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
            Cohorts & Batches
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--text-muted)' }}>
            Oversee dated student training cohorts, track capacity utilization, and inspect live enrolled learner rosters.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <AdminButton
            variant="secondary"
            icon={<RefreshCw className="h-4 w-4" />}
            onClick={() => refetch()}
          >
            Sync Telemetry
          </AdminButton>
        </div>
      </div>

      {/* Telemetry KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
        }}
      >
        {[
          { label: 'Total Cohorts', val: stats.total, sub: 'Registered institutional batches', icon: Layers, tone: '#38bdf8' },
          { label: 'Enrolled Learners', val: stats.totalEnrolled, sub: 'Active candidates across cohorts', icon: Users, tone: '#10b981' },
          { label: 'Active Batches', val: stats.inProgress, sub: 'Currently in-progress schedules', icon: TrendingUp, tone: '#f59e0b' },
          { label: 'Capacity Fill Rate', val: `${stats.avgFillRate}%`, sub: 'Seat allocation efficiency', icon: Award, tone: '#a855f7' },
        ].map((m, idx) => {
          const Icon = m.icon;
          return (
            <div
              key={idx}
              style={{
                background: 'linear-gradient(180deg, rgba(22, 25, 34, 0.9) 0%, rgba(17, 19, 26, 0.95) 100%)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 16,
                padding: '18px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: '0 4px 18px rgba(0,0,0,0.2)',
              }}
            >
              <div>
                <p style={{ margin: 0, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8' }}>
                  {m.label}
                </p>
                <div style={{ fontSize: 26, fontWeight: 800, color: '#f8fafc', marginTop: 4, letterSpacing: '-0.02em' }}>
                  {m.val}
                </div>
                <p style={{ margin: '4px 0 0', fontSize: 11, color: '#64748b' }}>
                  {m.sub}
                </p>
              </div>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: `${m.tone}15`,
                  border: `1px solid ${m.tone}30`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: m.tone,
                  flexShrink: 0,
                }}
              >
                <Icon size={20} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter Toolbar */}
      <div
        style={{
          background: 'linear-gradient(180deg, rgba(22, 25, 34, 0.9) 0%, rgba(17, 19, 26, 0.95) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 16,
          padding: 16,
          boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
          {/* Search Input */}
          <div style={{ position: 'relative', flex: '1 1 240px', minWidth: 200 }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: 14,
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#94a3b8',
                pointerEvents: 'none',
              }}
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search code, batch, curriculum…"
              style={{
                width: '100%',
                padding: '10px 14px 10px 38px',
                borderRadius: 10,
                border: '1px solid rgba(255, 255, 255, 0.12)',
                background: 'rgba(0, 0, 0, 0.35)',
                color: '#f8fafc',
                fontSize: 14,
                fontFamily: 'system-ui, -apple-system, sans-serif',
                boxSizing: 'border-box',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => { e.target.style.borderColor = '#3b82f6'; }}
              onBlur={(e) => { e.target.style.borderColor = 'rgba(255, 255, 255, 0.12)'; }}
            />
          </div>

          {/* Status Pills */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {STATUS_FILTERS.map((s) => {
              const active = statusFilter === s;
              return (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  style={{
                    padding: '7px 16px',
                    borderRadius: 99,
                    fontSize: 13,
                    fontWeight: active ? 700 : 500,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    background: active
                      ? 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)'
                      : 'rgba(255, 255, 255, 0.04)',
                    color: active ? '#ffffff' : '#94a3b8',
                    border: active ? '1px solid transparent' : '1px solid rgba(255, 255, 255, 0.08)',
                    boxShadow: active ? '0 2px 12px rgba(37, 99, 235, 0.4)' : 'none',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'; }}
                  onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)'; }}
                >
                  {s === 'ALL' ? 'All Batches' : BATCH_STATUS_CONFIG[s]?.label ?? s}
                </button>
              );
            })}
          </div>

          {/* My Cohorts Checkbox & View Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginLeft: 'auto' }}>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 13,
                color: '#cbd5e1',
                cursor: 'pointer',
                userSelect: 'none',
              }}
            >
              <input
                type="checkbox"
                checked={myCohortsOnly}
                onChange={(e) => setMyCohortsOnly(e.target.checked)}
                style={{ cursor: 'pointer', accentColor: '#3b82f6' }}
              />
              <span>My Cohorts Only</span>
            </label>

            <div style={{ display: 'flex', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 10, overflow: 'hidden', background: 'rgba(0,0,0,0.2)' }}>
              {[
                { id: 'grid', I: LayoutGrid },
                { id: 'table', I: LayoutList },
              ].map(({ id, I }) => (
                <button
                  key={id}
                  onClick={() => setViewMode(id)}
                  style={{
                    padding: '8px 12px',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    background: viewMode === id ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
                    color: viewMode === id ? '#ffffff' : '#64748b',
                    transition: 'all 0.2s',
                  }}
                >
                  <I size={16} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Section */}
      {isLoading ? (
        <div style={{ display: 'grid', gap: 20, gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))' }}>
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : filteredBatches.length === 0 ? (
        <div style={{ padding: 48, textAlign: 'center', background: 'var(--lms-card)', borderRadius: 16, border: '1px solid var(--border-color)' }}>
          <GraduationCap size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 16px' }} />
          <p style={{ margin: '0 0 8px', fontWeight: 600, color: 'var(--text-primary)', fontSize: 18 }}>No cohorts found</p>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 15 }}>
            {search || statusFilter !== 'ALL' || myCohortsOnly
              ? 'Try adjusting your search query or reset active filters.'
              : 'No training batches have been scheduled for this institution yet.'}
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        /* Clean Operational Cohort Card (NO course banners, NO fake monograms) */
        <div
          style={{
            display: 'grid',
            gap: 20,
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          }}
        >
          {filteredBatches.map((batch) => {
            const enrolled = batch.enrolledCount || 0;
            const capacity = batch.capacity || 0;
            const pct = capacity ? Math.min(100, Math.round((enrolled / capacity) * 100)) : 0;

            return (
              <div
                key={batch.id}
                style={{
                  background: 'linear-gradient(180deg, rgba(22, 25, 34, 0.85) 0%, rgba(17, 19, 26, 0.95) 100%)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 16,
                  padding: 22,
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.35)';
                  e.currentTarget.style.boxShadow = '0 12px 28px rgba(0, 0, 0, 0.35)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.25)';
                }}
              >
                {/* Header: Batch Code & Status */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 12 }}>
                  <span
                    style={{
                      padding: '4px 10px',
                      borderRadius: 6,
                      fontSize: 11,
                      fontFamily: 'monospace',
                      fontWeight: 700,
                      background: 'rgba(59, 130, 246, 0.12)',
                      color: '#60a5fa',
                      border: '1px solid rgba(59, 130, 246, 0.25)',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {batch.code}
                  </span>

                  <StatusPill status={batch.status} />
                </div>

                {/* Batch Name */}
                <h3
                  style={{
                    margin: '0 0 6px 0',
                    fontSize: 18,
                    fontWeight: 700,
                    color: '#f8fafc',
                    lineHeight: 1.35,
                  }}
                >
                  {batch.name}
                </h3>

                {/* Associated Curriculum / Course */}
                <div
                  onClick={() => batch.courseId && navigate(ROUTES.COURSE_DETAILS(batch.courseId))}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    color: '#94a3b8',
                    fontSize: 13,
                    cursor: batch.courseId ? 'pointer' : 'default',
                    marginBottom: 14,
                    textDecoration: 'none',
                  }}
                >
                  <BookOpen size={14} style={{ color: '#38bdf8', flexShrink: 0 }} />
                  <span style={{ color: '#cbd5e1', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {batch.courseTitle || 'Core Curriculum'}
                  </span>
                </div>

                {/* Schedule Telemetry Box */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    padding: '12px 14px',
                    borderRadius: 12,
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    fontSize: 12,
                    marginBottom: 16,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#cbd5e1' }}>
                    <Calendar size={13} style={{ color: '#94a3b8', flexShrink: 0 }} />
                    <span>
                      Runs: <strong style={{ color: '#f8fafc' }}>{batch.startDate || 'TBD'}</strong> → <strong style={{ color: '#f8fafc' }}>{batch.endDate || 'TBD'}</strong>
                    </span>
                  </div>
                  {batch.schedule && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#94a3b8' }}>
                      <Clock size={13} style={{ color: '#94a3b8', flexShrink: 0 }} />
                      <span>{batch.schedule}</span>
                    </div>
                  )}
                </div>

                {/* Capacity Progress Bar */}
                <div style={{ marginBottom: 18 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                    <span style={{ color: '#94a3b8', fontWeight: 500 }}>Cohort Enrolment</span>
                    <span style={{ color: '#f8fafc', fontWeight: 700 }}>
                      {enrolled} / {capacity || '—'} Seats ({pct}%)
                    </span>
                  </div>
                  <div
                    style={{
                      width: '100%',
                      height: 6,
                      borderRadius: 99,
                      background: 'rgba(255, 255, 255, 0.08)',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${pct}%`,
                        borderRadius: 99,
                        background: pct >= 90
                          ? 'linear-gradient(90deg, #f59e0b, #ef4444)'
                          : 'linear-gradient(90deg, #3b82f6, #10b981)',
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                    paddingTop: 16,
                    marginTop: 'auto',
                  }}
                >
                  <button
                    onClick={() => setSelectedBatchForRoster(batch)}
                    style={{
                      flex: 1,
                      padding: '8px 14px',
                      borderRadius: 99,
                      fontSize: 12,
                      fontWeight: 700,
                      border: 'none',
                      background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
                      color: '#fff',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      boxShadow: '0 2px 10px rgba(37, 99, 235, 0.35)',
                      transition: 'all 0.2s',
                    }}
                  >
                    <Users size={13} />
                    <span>Inspect Roster</span>
                  </button>

                  <button
                    onClick={() => navigate(`/instructor/certificates?batchId=${batch.id}`)}
                    title="Graduation & Certification Hub"
                    style={{
                      padding: '8px 14px',
                      borderRadius: 99,
                      fontSize: 12,
                      fontWeight: 600,
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      background: 'rgba(16, 185, 129, 0.1)',
                      color: '#34d399',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(16, 185, 129, 0.2)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)'; }}
                  >
                    <Award size={13} />
                    <span>Graduation</span>
                  </button>

                  {batch.courseId && (
                    <button
                      onClick={() => navigate(ROUTES.COURSE_DETAILS(batch.courseId))}
                      title="Course Studio"
                      style={{
                        padding: '8px 10px',
                        borderRadius: 8,
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        background: 'transparent',
                        color: '#cbd5e1',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <ExternalLink size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table / List View */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {filteredBatches.map((batch) => {
            const enrolled = batch.enrolledCount || 0;
            const capacity = batch.capacity || 0;
            const pct = capacity ? Math.min(100, Math.round((enrolled / capacity) * 100)) : 0;

            return (
              <div
                key={batch.id}
                style={{
                  background: 'linear-gradient(180deg, rgba(22, 25, 34, 0.85) 0%, rgba(17, 19, 26, 0.95) 100%)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 14,
                  display: 'flex',
                  alignItems: 'center',
                  padding: '16px 20px',
                  gap: 16,
                  boxShadow: '0 4px 18px rgba(0,0,0,0.2)',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.boxShadow = '0 4px 18px rgba(0,0,0,0.2)';
                }}
              >
                {/* Cohort Icon Box */}
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 10,
                    background: 'rgba(59, 130, 246, 0.12)',
                    border: '1px solid rgba(59, 130, 246, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#60a5fa',
                    flexShrink: 0,
                  }}
                >
                  <Users size={18} />
                </div>

                {/* Batch Name & Details */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 16, fontWeight: 700, color: '#f8fafc' }}>{batch.name}</span>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: 6,
                        fontSize: 11,
                        fontFamily: 'monospace',
                        fontWeight: 700,
                        background: 'rgba(255, 255, 255, 0.06)',
                        color: '#94a3b8',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                      }}
                    >
                      {batch.code}
                    </span>
                    <StatusPill status={batch.status} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: '#94a3b8' }}>
                    <span style={{ color: '#38bdf8', fontWeight: 600 }}>
                      {batch.courseTitle || 'General Curriculum'}
                    </span>
                    <span>•</span>
                    <span>{batch.startDate} → {batch.endDate}</span>
                    {batch.schedule && (
                      <>
                        <span>•</span>
                        <span>{batch.schedule}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Capacity Meter */}
                <div style={{ width: 140, flexShrink: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                    <span style={{ color: '#94a3b8' }}>Capacity</span>
                    <span style={{ color: '#f8fafc', fontWeight: 700 }}>{enrolled}/{capacity}</span>
                  </div>
                  <div style={{ width: '100%', height: 5, borderRadius: 99, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, #3b82f6, #10b981)' }} />
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8, borderLeft: '1px solid rgba(255,255,255,0.08)', paddingLeft: 16, flexShrink: 0 }}>
                  <button
                    onClick={() => setSelectedBatchForRoster(batch)}
                    style={{
                      padding: '7px 16px',
                      borderRadius: 99,
                      fontSize: 13,
                      fontWeight: 700,
                      border: 'none',
                      background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
                      color: '#fff',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <Users size={14} />
                    <span>Roster</span>
                  </button>

                  <button
                    onClick={() => navigate(`/instructor/certificates?batchId=${batch.id}`)}
                    style={{
                      padding: '7px 16px',
                      borderRadius: 99,
                      fontSize: 13,
                      fontWeight: 600,
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      background: 'rgba(16, 185, 129, 0.1)',
                      color: '#34d399',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                    }}
                  >
                    <Award size={14} />
                    <span>Graduation</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cohort Roster Modal */}
      {selectedBatchForRoster && (
        <CohortRosterModal
          batch={selectedBatchForRoster}
          isOpen={Boolean(selectedBatchForRoster)}
          onClose={() => setSelectedBatchForRoster(null)}
        />
      )}

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}`}</style>
    </div>
  );
};

export default InstructorBatchListPage;
