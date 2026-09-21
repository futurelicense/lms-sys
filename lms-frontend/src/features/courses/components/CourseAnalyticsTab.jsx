import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Users, UserCheck, UserX, CheckCircle, BarChart2,
  Search, Percent, ArrowUpRight
} from 'lucide-react';
import { http } from '../../../services/api/axiosInstance';
import Spinner from '../../../components/common/Spinner';
import Alert from '../../../components/feedback/Alert';
import Badge from '../../../components/common/Badge';
import { formatDate } from '../../../utils/dateUtils';

export const CourseAnalyticsTab = ({ courseId }) => {
  const { data: analytics, isLoading, error } = useQuery({
    queryKey: ['course-analytics', courseId],
    queryFn: async () => {
      try {
        const res = await http.get(`/courses/${courseId}/analytics`);
        return res.data ?? res;
      } catch (err) {
        console.warn('Primary analytics endpoint failed, trying fallback path...', err);
        const res = await http.get(`/courses/${courseId}/curriculum/analytics`);
        return res.data ?? res;
      }
    }
  });

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  if (isLoading) return <Spinner fullPage={false} />;
  if (error) return <Alert tone="error">Failed to load course statistics: {error?.message || 'Error'}</Alert>;
  if (!analytics) return null;

  const {
    totalEnrolledStudents = 0,
    attendedCount = 0,
    nonAttendedCount = 0,
    completedCount = 0,
    inProgressCount = 0,
    averageCompletionPercentage = 0,
    studentStats = [],
    progressDistribution = []
  } = analytics;

  // Filter students
  const filteredStudents = studentStats.filter((s) => {
    const matchesSearch =
      (s.studentName && s.studentName.toLowerCase().includes(search.toLowerCase())) ||
      (s.studentEmail && s.studentEmail.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const maxBucketCount = Math.max(...progressDistribution.map((b) => b.count), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* ── 1. Top Stat Cards Grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        {/* Enrolled */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={labelStyle}>Total Enrolled</span>
            <div style={iconBoxStyle('rgba(59, 130, 246, 0.1)', '#3b82f6')}>
              <Users size={18} />
            </div>
          </div>
          <div style={valueStyle}>{totalEnrolledStudents}</div>
          <span style={subtextStyle}>Registered Students</span>
        </div>

        {/* Attended */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={labelStyle}>Attended Students</span>
            <div style={iconBoxStyle('rgba(16, 185, 129, 0.1)', '#10b981')}>
              <UserCheck size={18} />
            </div>
          </div>
          <div style={valueStyle}>{attendedCount}</div>
          <span style={subtextStyle}>
            {totalEnrolledStudents > 0
              ? `${Math.round((attendedCount / totalEnrolledStudents) * 100)}% attendance rate`
              : '0% attendance'}
          </span>
        </div>

        {/* Non-Attended */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={labelStyle}>Non-Attended</span>
            <div style={iconBoxStyle('rgba(239, 68, 68, 0.1)', '#ef4444')}>
              <UserX size={18} />
            </div>
          </div>
          <div style={valueStyle}>{nonAttendedCount}</div>
          <span style={subtextStyle}>Students not started yet</span>
        </div>

        {/* Completed */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={labelStyle}>Completed Course</span>
            <div style={iconBoxStyle('rgba(139, 92, 246, 0.1)', '#8b5cf6')}>
              <CheckCircle size={18} />
            </div>
          </div>
          <div style={valueStyle}>{completedCount}</div>
          <span style={subtextStyle}>{inProgressCount} in-progress</span>
        </div>

        {/* Avg Completion % */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={labelStyle}>Avg. Completion %</span>
            <div style={iconBoxStyle('rgba(245, 158, 11, 0.1)', '#f59e0b')}>
              <Percent size={18} />
            </div>
          </div>
          <div style={valueStyle}>
            {averageCompletionPercentage}%
          </div>
          <span style={subtextStyle}>Across all enrolled</span>
        </div>
      </div>

      {/* ── 2. Graphical Statistical Overview ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
        {/* Progress Distribution Chart */}
        <div style={panelStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <BarChart2 size={18} style={{ color: '#3b82f6' }} />
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
              Course Progress Distribution Graph
            </h3>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 12 }}>
            {progressDistribution.map((b) => {
              const pctOfTotal = totalEnrolledStudents > 0 ? Math.round((b.count / totalEnrolledStudents) * 100) : 0;
              const barHeightPct = (b.count / maxBucketCount) * 100;

              return (
                <div key={b.bucketRange} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-secondary)' }}>
                    <span style={{ fontWeight: 600 }}>{b.bucketRange} Progress</span>
                    <span>{b.count} students ({pctOfTotal}%)</span>
                  </div>
                  <div style={{ height: 10, background: 'var(--border-color)', borderRadius: 6, overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${barHeightPct}%`,
                        background: 'linear-gradient(90deg, #3b82f6 0%, #8b5cf6 100%)',
                        borderRadius: 6,
                        transition: 'width 0.4s ease'
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Engagement & Completion Ratio Card */}
        <div style={panelStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <ArrowUpRight size={18} style={{ color: '#10b981' }} />
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
              Course Participation Ratios
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 12 }}>
            {/* Attended Ratio */}
            <div style={ratioBoxStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>Attended Students</span>
                <span style={{ color: '#10b981', fontWeight: 700 }}>
                  {attendedCount} / {totalEnrolledStudents} ({totalEnrolledStudents > 0 ? Math.round((attendedCount / totalEnrolledStudents) * 100) : 0}%)
                </span>
              </div>
              <div style={trackStyle}>
                <div
                  style={{
                    height: '100%',
                    width: `${totalEnrolledStudents > 0 ? (attendedCount / totalEnrolledStudents) * 100 : 0}%`,
                    background: '#10b981',
                    borderRadius: 4
                  }}
                />
              </div>
            </div>

            {/* Completion Ratio */}
            <div style={ratioBoxStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>Full Course Completion</span>
                <span style={{ color: '#8b5cf6', fontWeight: 700 }}>
                  {completedCount} / {totalEnrolledStudents} ({totalEnrolledStudents > 0 ? Math.round((completedCount / totalEnrolledStudents) * 100) : 0}%)
                </span>
              </div>
              <div style={trackStyle}>
                <div
                  style={{
                    height: '100%',
                    width: `${totalEnrolledStudents > 0 ? (completedCount / totalEnrolledStudents) * 100 : 0}%`,
                    background: '#8b5cf6',
                    borderRadius: 4
                  }}
                />
              </div>
            </div>

            {/* Non Attended Ratio */}
            <div style={ratioBoxStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>Non-Attended</span>
                <span style={{ color: '#ef4444', fontWeight: 700 }}>
                  {nonAttendedCount} / {totalEnrolledStudents} ({totalEnrolledStudents > 0 ? Math.round((nonAttendedCount / totalEnrolledStudents) * 100) : 0}%)
                </span>
              </div>
              <div style={trackStyle}>
                <div
                  style={{
                    height: '100%',
                    width: `${totalEnrolledStudents > 0 ? (nonAttendedCount / totalEnrolledStudents) * 100 : 0}%`,
                    background: '#ef4444',
                    borderRadius: 4
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. Individual Student Progress & Completion Table ── */}
      <div style={panelStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
              Individual Student Completion & Performance
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
              View progress percentage, attended status, and completion metrics per student.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {/* Search */}
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search student..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={searchInputStyle}
              />
            </div>

            {/* Status Filter */}
            <div style={{ display: 'flex', gap: 4, background: 'var(--surface-medium)', padding: 3, borderRadius: 8, border: '1px solid var(--border-color)' }}>
              {['ALL', 'COMPLETED', 'IN_PROGRESS', 'NON_ATTENDED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: statusFilter === st ? 600 : 400,
                    border: 'none',
                    background: statusFilter === st ? 'var(--text-primary)' : 'transparent',
                    color: statusFilter === st ? 'var(--lms-background)' : 'var(--text-secondary)',
                    cursor: 'pointer'
                  }}
                >
                  {st === 'ALL' ? 'All' : st === 'COMPLETED' ? 'Completed' : st === 'IN_PROGRESS' ? 'In Progress' : 'Non Attended'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '10px 12px', fontWeight: 600 }}>Student</th>
                <th style={{ padding: '10px 12px', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '10px 12px', fontWeight: 600 }}>Lessons Completed</th>
                <th style={{ padding: '10px 12px', fontWeight: 600 }}>Individual Completion %</th>
                <th style={{ padding: '10px 12px', fontWeight: 600 }}>Last Active</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length > 0 ? (
                filteredStudents.map((s) => (
                  <tr key={s.studentId} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    {/* Student Name & Email */}
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{s.studentName || 'Student'}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.studentEmail}</div>
                    </td>

                    {/* Status Badge */}
                    <td style={{ padding: '12px' }}>
                      <StatusBadge status={s.status} />
                    </td>

                    {/* Lessons Completed */}
                    <td style={{ padding: '12px', color: 'var(--text-primary)', fontWeight: 500 }}>
                      {s.lessonsCompleted} / {s.totalLessons} lessons
                    </td>

                    {/* Completion Percentage Bar */}
                    <td style={{ padding: '12px', minWidth: 160 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1, height: 6, background: 'var(--border-color)', borderRadius: 99, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${s.completionPercentage}%`, background: s.completionPercentage === 100 ? '#10b981' : '#3b82f6', borderRadius: 99 }} />
                        </div>
                        <span style={{ fontWeight: 700, fontSize: 12, color: 'var(--text-primary)', width: 38 }}>
                          {s.completionPercentage}%
                        </span>
                      </div>
                    </td>

                    {/* Last Active */}
                    <td style={{ padding: '12px', color: 'var(--text-muted)', fontSize: 12 }}>
                      {s.lastActivityAt ? formatDate(s.lastActivityAt) : 'Never'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No student stats found matching criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const StatusBadge = ({ status }) => {
  if (status === 'COMPLETED') return <Badge tone="success">Completed</Badge>;
  if (status === 'IN_PROGRESS') return <Badge tone="info">In Progress</Badge>;
  return <Badge tone="neutral">Non-Attended</Badge>;
};

/* ── Inline Design Token Styles ── */
const cardStyle = {
  background: 'var(--lms-card)',
  border: '1px solid var(--border-color)',
  borderRadius: 14,
  padding: 16,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between'
};

const panelStyle = {
  background: 'var(--lms-card)',
  border: '1px solid var(--border-color)',
  borderRadius: 14,
  padding: 20
};

const labelStyle = {
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--text-muted)'
};

const valueStyle = {
  fontSize: 22,
  fontWeight: 700,
  color: 'var(--text-primary)',
  margin: '8px 0 2px'
};

const subtextStyle = {
  fontSize: 11,
  color: 'var(--text-muted)'
};

const iconBoxStyle = (bg, color) => ({
  width: 34,
  height: 34,
  borderRadius: 8,
  background: bg,
  color: color,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
});

const ratioBoxStyle = {
  background: 'var(--bg-primary)',
  border: '1px solid var(--border-color)',
  padding: 12,
  borderRadius: 10
};

const trackStyle = {
  height: 6,
  background: 'var(--border-color)',
  borderRadius: 4,
  overflow: 'hidden'
};

const searchInputStyle = {
  padding: '6px 12px 6px 30px',
  borderRadius: 8,
  border: '1px solid var(--border-color)',
  background: 'var(--bg-primary)',
  color: 'var(--text-primary)',
  fontSize: 13,
  outline: 'none',
  width: 180
};

export default CourseAnalyticsTab;
