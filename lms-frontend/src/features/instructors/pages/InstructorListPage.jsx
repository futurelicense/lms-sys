import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, BookOpen, Calendar, Clock, Search, LayoutGrid, LayoutList,
  GraduationCap, Award, Layers, ExternalLink, RefreshCw, TrendingUp, Plus, Edit2, Mail, Phone, ShieldCheck
} from 'lucide-react';
import AdminButton from '../../../components/ui/AdminButton';
import AdminPagination from '../../../components/ui/AdminPagination';
import { useInstructors } from '../hooks/useInstructors';
import {
  EMPLOYMENT_TYPE_LABEL,
  EMPLOYMENT_TYPE_OPTIONS,
  EMPLOYMENT_TYPE_TONE,
} from '../constants/instructorConstants';
import { ROUTES } from '../../../constants/routes';

function getInitials(str = '') {
  return str.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0] ?? '').join('').toUpperCase() || 'IN';
}

function InstructorAvatar({ name = '', size = 44 }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        flexShrink: 0,
        background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        fontSize: Math.round(size * 0.38),
        fontFamily: 'system-ui, -apple-system, sans-serif',
        boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
        border: '1px solid rgba(255,255,255,0.15)',
      }}
    >
      {getInitials(name)}
    </div>
  );
}

const ENGAGEMENT_CONFIG = {
  FULL_TIME: { label: 'Full Time', bg: 'rgba(16, 185, 129, 0.18)', color: '#34d399', border: 'rgba(16, 185, 129, 0.35)' },
  PART_TIME: { label: 'Part Time', bg: 'rgba(59, 130, 246, 0.18)', color: '#60a5fa', border: 'rgba(59, 130, 246, 0.35)' },
  CONTRACT: { label: 'Contract', bg: 'rgba(245, 158, 11, 0.18)', color: '#fbbf24', border: 'rgba(245, 158, 11, 0.35)' },
  VISITING: { label: 'Visiting', bg: 'rgba(168, 85, 247, 0.18)', color: '#c084fc', border: 'rgba(168, 85, 247, 0.35)' },
};

function EngagementPill({ type }) {
  const norm = (type || 'FULL_TIME').toUpperCase();
  const c = ENGAGEMENT_CONFIG[norm] || ENGAGEMENT_CONFIG.FULL_TIME;
  return (
    <span
      style={{
        padding: '3px 10px',
        borderRadius: 99,
        fontSize: 11,
        fontWeight: 700,
        background: c.bg,
        color: c.color,
        border: `1px solid ${c.border}`,
        whiteSpace: 'nowrap',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.color }} />
      {c.label}
    </span>
  );
}

function AccountBadge({ row }) {
  if (row.locked) {
    return (
      <span
        style={{
          fontSize: 11,
          fontWeight: 700,
          padding: '2px 8px',
          borderRadius: 6,
          backgroundColor: 'rgba(239, 68, 68, 0.15)',
          color: '#f87171',
          border: '1px solid rgba(239, 68, 68, 0.3)',
        }}
      >
        Suspended
      </span>
    );
  }
  if (!row.active) {
    return (
      <span
        style={{
          fontSize: 11,
          fontWeight: 700,
          padding: '2px 8px',
          borderRadius: 6,
          backgroundColor: 'rgba(245, 158, 11, 0.15)',
          color: '#fbbf24',
          border: '1px solid rgba(245, 158, 11, 0.3)',
        }}
      >
        Pending
      </span>
    );
  }
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 700,
        padding: '2px 8px',
        borderRadius: 6,
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        color: '#34d399',
        border: '1px solid rgba(16, 185, 129, 0.3)',
      }}
    >
      Active
    </span>
  );
}

/* ── Skeleton Card ── */
function SkeletonCard() {
  const s = { background: 'rgba(255, 255, 255, 0.08)', borderRadius: 8, animation: 'pulse 1.5s ease-in-out infinite' };
  return (
    <div style={{ background: 'linear-gradient(180deg, #161922 0%, #11131a 100%)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ ...s, width: 80, height: 24, borderRadius: 6 }} />
        <div style={{ ...s, width: 80, height: 24, borderRadius: 99 }} />
      </div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <div style={{ ...s, width: 44, height: 44, borderRadius: '50%' }} />
        <div style={{ flex: 1 }}>
          <div style={{ ...s, height: 18, width: '70%', marginBottom: 6 }} />
          <div style={{ ...s, height: 12, width: '50%' }} />
        </div>
      </div>
      <div style={{ ...s, height: 36, borderRadius: 10 }} />
      <div style={{ ...s, height: 36, borderRadius: 99, marginTop: 8 }} />
    </div>
  );
}

const ENGAGEMENT_FILTERS = [
  { id: '', label: 'All Faculty' },
  { id: 'FULL_TIME', label: 'Full Time' },
  { id: 'PART_TIME', label: 'Part Time' },
  { id: 'CONTRACT', label: 'Contract' },
  { id: 'VISITING', label: 'Visiting' },
];

const PAGE_SIZE = 12;

export const InstructorListPage = () => {
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [employmentType, setEmploymentType] = useState('');
  const [viewMode, setViewMode] = useState(() => {
    try {
      return localStorage.getItem('lms_instructor_view_mode') || 'table';
    } catch (_) {
      return 'table';
    }
  });

  const {
    data: pageData,
    isLoading,
    error,
    refetch,
  } = useInstructors({ search, employmentType: employmentType || undefined, page, size: PAGE_SIZE });

  const instructors = useMemo(() => pageData?.content || [], [pageData]);
  const totalPages = pageData?.totalPages ?? 0;
  const totalElements = pageData?.totalElements ?? 0;

  // Telemetry KPIs
  const stats = useMemo(() => {
    const total = totalElements || instructors.length;
    const fullTime = instructors.filter((i) => i.employmentType === 'FULL_TIME').length;
    const active = instructors.filter((i) => !i.locked).length;
    const totalExp = instructors.reduce((acc, i) => acc + (Number(i.yearsOfExperience) || 0), 0);
    const avgExp = instructors.length > 0 ? (totalExp / instructors.length).toFixed(1) : '0';

    return { total, fullTime, active, avgExp };
  }, [instructors, totalElements]);

  return (
    <div className="space-y-6" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
            Instructors & Faculty
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--text-muted)' }}>
            Everyone who teaches at the centre. Manage faculty credentials, engagement types, and assigned cohorts.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <AdminButton
            variant="secondary"
            icon={<RefreshCw className="h-4 w-4" />}
            onClick={() => refetch()}
          >
            Sync Faculty
          </AdminButton>
          <AdminButton
            variant="primary"
            icon={<Plus className="h-4 w-4" />}
            onClick={() => navigate(ROUTES.INSTRUCTOR_CREATE)}
          >
            Add New Instructor
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
          { label: 'Total Faculty', val: stats.total, sub: 'Registered institution educators', icon: Users, tone: '#38bdf8' },
          { label: 'Full-Time Staff', val: stats.fullTime, sub: 'Core curriculum instructors', icon: Award, tone: '#10b981' },
          { label: 'Active Faculty', val: stats.active, sub: 'Teaching & evaluating cohorts', icon: TrendingUp, tone: '#f59e0b' },
          { label: 'Avg Experience', val: `${stats.avgExp} yrs`, sub: 'Cumulative technical depth', icon: Clock, tone: '#a855f7' },
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
          <div style={{ position: 'relative', flex: '1 1 260px', minWidth: 220 }}>
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
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              placeholder="Search by name, email, code or specialization…"
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

          {/* Engagement Status Pills */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {ENGAGEMENT_FILTERS.map((f) => {
              const active = employmentType === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => {
                    setEmploymentType(f.id);
                    setPage(0);
                  }}
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
                  {f.label}
                </button>
              );
            })}
          </div>

          {/* View Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginLeft: 'auto' }}>
            <div
              style={{
                display: 'flex',
                background: 'rgba(0, 0, 0, 0.3)',
                borderRadius: 8,
                padding: 2,
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              {[
                { id: 'table', I: LayoutList, title: 'List View' },
                { id: 'grid', I: LayoutGrid, title: 'Grid View' },
              ].map(({ id, I, title }) => (
                <button
                  key={id}
                  onClick={() => {
                    setViewMode(id);
                    try { localStorage.setItem('lms_instructor_view_mode', id); } catch (_) {}
                  }}
                  title={title}
                  style={{
                    padding: '8px 12px',
                    border: 'none',
                    borderRadius: 6,
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
      ) : instructors.length === 0 ? (
        <div style={{ padding: 48, textAlign: 'center', background: 'var(--lms-card)', borderRadius: 16, border: '1px solid var(--border-color)' }}>
          <GraduationCap size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 16px' }} />
          <p style={{ margin: '0 0 8px', fontWeight: 600, color: 'var(--text-primary)', fontSize: 18 }}>No instructors found</p>
          <p style={{ margin: '0 0 20px', color: 'var(--text-muted)', fontSize: 14 }}>
            {search || employmentType
              ? 'Try adjusting your search query or reset engagement filters.'
              : 'Onboard your first instructor to see them here.'}
          </p>
          <AdminButton variant="primary" icon={<Plus className="h-4 w-4" />} onClick={() => navigate(ROUTES.INSTRUCTOR_CREATE)}>
            Add New Instructor
          </AdminButton>
        </div>
      ) : viewMode === 'grid' ? (
        /* Modern Faculty Grid Cards */
        <div
          style={{
            display: 'grid',
            gap: 20,
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          }}
        >
          {instructors.map((row) => (
            <div
              key={row.id}
              onClick={() => navigate(ROUTES.INSTRUCTOR_DETAILS(row.id))}
              style={{
                background: 'linear-gradient(180deg, rgba(22, 25, 34, 0.85) 0%, rgba(17, 19, 26, 0.95) 100%)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 16,
                padding: 22,
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
                transition: 'all 0.2s ease',
                cursor: 'pointer',
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
              {/* Header: Employee Code & Engagement */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 14 }}>
                <span
                  style={{
                    padding: '3px 8px',
                    borderRadius: 6,
                    fontSize: 11,
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    background: 'rgba(59, 130, 246, 0.12)',
                    color: '#60a5fa',
                    border: '1px solid rgba(59, 130, 246, 0.25)',
                  }}
                >
                  {row.employeeCode}
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <EngagementPill type={row.employmentType} />
                  <AccountBadge row={row} />
                </div>
              </div>

              {/* Profile Main */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                <InstructorAvatar name={row.fullName} size={44} />
                <div style={{ minWidth: 0 }}>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: 17,
                      fontWeight: 700,
                      color: '#f8fafc',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {row.fullName}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                    <Mail size={12} color="#64748b" />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {row.email}
                    </span>
                  </div>
                </div>
              </div>

              {/* Specialization Box */}
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: 12,
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  fontSize: 12,
                  marginBottom: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#38bdf8', fontWeight: 600 }}>
                  <BookOpen size={13} />
                  <span>{row.specialization || 'Technical Instructor'}</span>
                </div>
                {row.institution && (
                  <div style={{ color: '#94a3b8', fontSize: 11 }}>
                    {row.highestQualification ? `${row.highestQualification} • ` : ''}{row.institution}
                  </div>
                )}
              </div>

              {/* Metadata row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, color: '#94a3b8', marginBottom: 16 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Clock size={13} color="#60a5fa" />
                  <span>{row.yearsOfExperience != null ? `${row.yearsOfExperience} yrs exp.` : 'Senior'}</span>
                </span>
                {row.phone && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Phone size={13} color="#34d399" />
                    <span>{row.phone}</span>
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                  paddingTop: 14,
                  marginTop: 'auto',
                }}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(ROUTES.INSTRUCTOR_DETAILS(row.id));
                  }}
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
                  <span>View Profile</span>
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(ROUTES.INSTRUCTOR_EDIT(row.id));
                  }}
                  title="Edit Profile"
                  style={{
                    padding: '8px 14px',
                    borderRadius: 99,
                    fontSize: 12,
                    fontWeight: 600,
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    background: 'rgba(255, 255, 255, 0.06)',
                    color: '#f8fafc',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'; }}
                >
                  <Edit2 size={13} />
                  <span>Edit</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Enterprise Data Table / List View */
        <div
          style={{
            background: 'linear-gradient(180deg, rgba(22, 25, 34, 0.9) 0%, rgba(17, 19, 26, 0.95) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 16,
            overflow: 'hidden',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', backgroundColor: 'rgba(255, 255, 255, 0.02)' }}>
                  <th style={{ padding: '14px 20px', fontWeight: 600, color: '#94a3b8' }}>Faculty Member</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600, color: '#94a3b8' }}>Employee ID</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600, color: '#94a3b8' }}>Specialization & Background</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600, color: '#94a3b8' }}>Engagement</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600, color: '#94a3b8' }}>Experience & Contact</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600, color: '#94a3b8' }}>Status</th>
                  <th style={{ padding: '14px 20px', fontWeight: 600, color: '#94a3b8', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {instructors.map((row) => {
                  const backgroundSubtitle = [row.qualification, row.institution].filter(Boolean).join(' • ');
                  return (
                    <tr
                      key={row.id}
                      onClick={() => navigate(ROUTES.INSTRUCTOR_DETAILS(row.id))}
                      style={{
                        borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                        transition: 'background-color 0.15s ease',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                    >
                      {/* Faculty Member */}
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <InstructorAvatar name={row.fullName} size={38} />
                          <div>
                            <div style={{ fontWeight: 600, color: '#f8fafc', fontSize: 14 }}>{row.fullName}</div>
                            <div style={{ fontSize: 12, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                              <Mail size={12} style={{ color: '#64748b' }} />
                              <span>{row.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Employee ID */}
                      <td style={{ padding: '14px 18px' }}>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: 6,
                            fontSize: 11,
                            fontFamily: 'monospace',
                            fontWeight: 700,
                            background: 'rgba(59, 130, 246, 0.12)',
                            color: '#60a5fa',
                            border: '1px solid rgba(59, 130, 246, 0.25)',
                            display: 'inline-block',
                          }}
                        >
                          {row.employeeCode || '—'}
                        </span>
                      </td>

                      {/* Specialization & Background */}
                      <td style={{ padding: '14px 18px', maxWidth: 280 }}>
                        <div style={{ fontWeight: 600, color: '#38bdf8', fontSize: 13 }}>
                          {row.specialization || 'Technical Instructor'}
                        </div>
                        {backgroundSubtitle && (
                          <div
                            style={{
                              fontSize: 11,
                              color: '#94a3b8',
                              marginTop: 2,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                            title={backgroundSubtitle}
                          >
                            {backgroundSubtitle}
                          </div>
                        )}
                      </td>

                      {/* Engagement */}
                      <td style={{ padding: '14px 18px' }}>
                        <EngagementPill type={row.employmentType} />
                      </td>

                      {/* Experience & Contact */}
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                          {row.yearsOfExperience != null && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#f8fafc' }}>
                              <Clock size={12} style={{ color: '#a855f7' }} />
                              <span>{row.yearsOfExperience} yrs exp.</span>
                            </div>
                          )}
                          {row.phone && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#94a3b8' }}>
                              <Phone size={11} style={{ color: '#10b981' }} />
                              <span>{row.phone}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '14px 18px' }}>
                        <AccountBadge row={row} />
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 8 }} onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => navigate(ROUTES.INSTRUCTOR_DETAILS(row.id))}
                            style={{
                              padding: '6px 14px',
                              borderRadius: 99,
                              fontSize: 12,
                              fontWeight: 700,
                              border: 'none',
                              background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
                              color: '#fff',
                              cursor: 'pointer',
                              boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)',
                              transition: 'all 0.15s',
                            }}
                          >
                            View Profile
                          </button>
                          <button
                            onClick={() => navigate(ROUTES.INSTRUCTOR_EDIT(row.id))}
                            title="Edit Profile"
                            style={{
                              padding: '6px 12px',
                              borderRadius: 99,
                              fontSize: 12,
                              fontWeight: 600,
                              border: '1px solid rgba(255, 255, 255, 0.15)',
                              background: 'rgba(255, 255, 255, 0.06)',
                              color: '#f8fafc',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              transition: 'all 0.15s',
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'; }}
                          >
                            <Edit2 size={12} />
                            <span>Edit</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modern Admin Pagination */}
      {totalPages > 1 && (
        <div style={{ marginTop: 24 }}>
          <AdminPagination
            page={page}
            totalPages={totalPages}
            totalElements={totalElements}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        </div>
      )}

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}`}</style>
    </div>
  );
};

export default InstructorListPage;
