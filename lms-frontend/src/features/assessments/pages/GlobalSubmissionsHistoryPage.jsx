import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import {
  Trophy, Award, Download, Calendar, Search, Filter,
  CheckCircle2, XCircle, Clock, Sparkles, BookOpen,
  ArrowUpRight, Users, ChevronRight, BarChart2, ShieldCheck,
  FileText, ExternalLink, ArrowLeft, X
} from 'lucide-react';
import { useAdminAssessments } from '../hooks/useAdminAssessments';
import adminAssessmentService from '../services/adminAssessmentService';
import {
  evaluateStudentBadges,
  LEETCODE_BADGES,
  LEADERBOARD_CATEGORIES,
} from '../utils/badgeDefinitions';
import LeetCodeBadge from '../components/LeetCodeBadge';
import BadgeDetailModal from '../components/BadgeDetailModal';
import Spinner from '../../../components/common/Spinner';
import Alert from '../../../components/feedback/Alert';
import { formatDateTime, formatRelative, formatDate } from '../../../utils/dateUtils';
import { ROUTES } from '../../../constants/routes';

export const GlobalSubmissionsHistoryPage = () => {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const isInstructor = location.pathname.startsWith('/instructor');

  const initialAssessmentId = searchParams.get('assessmentId') || 'ALL';

  const [selectedBadge, setSelectedBadge] = useState(null);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState(initialAssessmentId);
  const [selectedMonth, setSelectedMonth] = useState('ALL');
  const [selectedDate, setSelectedDate] = useState(''); // Specific date YYYY-MM-DD
  const [selectedDatePreset, setSelectedDatePreset] = useState('ALL'); // ALL, TODAY, YESTERDAY, LAST_7_DAYS, LAST_30_DAYS
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Sync if URL query param changes
  useEffect(() => {
    const aid = searchParams.get('assessmentId');
    if (aid && aid !== selectedAssessmentId) {
      setSelectedAssessmentId(aid);
    }
  }, [searchParams]);

  // 1. Fetch all assessments
  const { data: assessmentsData, isLoading: assessmentsLoading } = useAdminAssessments({ size: 100 });
  const assessments = useMemo(() => {
    const raw =
      assessmentsData?.content ||
      assessmentsData?.data?.content ||
      (Array.isArray(assessmentsData) ? assessmentsData : []);
    return Array.isArray(raw) ? raw : [];
  }, [assessmentsData]);

  // 2. Fetch all analytics / submissions across all assessments
  const [allSubmissions, setAllSubmissions] = useState([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    if (!assessments.length && !assessmentsLoading) {
      setAllSubmissions([]);
      setAnalyticsLoading(false);
      return;
    }

    if (!assessments.length) return;

    setAnalyticsLoading(true);
    setLoadError(null);

    Promise.allSettled(
      assessments.map((a) =>
        adminAssessmentService
          .getAnalytics(a.id)
          .then((res) => {
            const data = res?.data?.data || res?.data || res || {};
            const stats = data.studentStats || [];
            return stats.map((s) => ({
              ...s,
              assessmentId: a.id,
              assessmentTitle: a.title,
              assessmentTotalMarks: a.totalMarks || s.totalMarks || 100,
              assessmentDuration: a.durationMinutes || 60,
              assessmentStatus: a.status,
            }));
          })
          .catch(() => [])
      )
    )
      .then((results) => {
        if (!isMounted) return;
        const combined = [];
        results.forEach((r) => {
          if (r.status === 'fulfilled' && Array.isArray(r.value)) {
            combined.push(...r.value);
          }
        });

        // Sort by submittedAt descending (most recent first)
        combined.sort((a, b) => {
          const timeA = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
          const timeB = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
          return timeB - timeA;
        });

        setAllSubmissions(combined);
      })
      .catch((err) => {
        if (isMounted) setLoadError(err.message || 'Failed to aggregate submissions history');
      })
      .finally(() => {
        if (isMounted) setAnalyticsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [assessments, assessmentsLoading]);

  // Extract distinct available months from submissions for the month filter
  const availableMonths = useMemo(() => {
    const monthsMap = new Map();
    allSubmissions.forEach((sub) => {
      if (sub.submittedAt) {
        const d = new Date(sub.submittedAt);
        if (!isNaN(d.getTime())) {
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          const label = d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
          monthsMap.set(key, label);
        }
      }
    });
    return Array.from(monthsMap.entries()).map(([value, label]) => ({ value, label }));
  }, [allSubmissions]);

  // 3. Filter submissions based on user criteria
  const filteredSubmissions = useMemo(() => {
    return allSubmissions.filter((sub) => {
      // Assessment filter
      if (selectedAssessmentId !== 'ALL' && sub.assessmentId !== selectedAssessmentId) {
        return false;
      }

      // Month filter
      if (selectedMonth !== 'ALL') {
        if (!sub.submittedAt) return false;
        const d = new Date(sub.submittedAt);
        if (isNaN(d.getTime())) return false;

        const subMonthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (selectedMonth === 'THIS_MONTH') {
          const now = new Date();
          const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
          if (subMonthKey !== currentMonthKey) return false;
        } else if (selectedMonth === 'LAST_MONTH') {
          const lastMonth = new Date();
          lastMonth.setMonth(lastMonth.getMonth() - 1);
          const lastMonthKey = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`;
          if (subMonthKey !== lastMonthKey) return false;
        } else if (subMonthKey !== selectedMonth) {
          return false;
        }
      }

      // Specific Date filter (YYYY-MM-DD)
      if (selectedDate) {
        if (!sub.submittedAt) return false;
        const d = new Date(sub.submittedAt);
        if (isNaN(d.getTime())) return false;
        const subDateStr = d.toISOString().slice(0, 10);
        const localDateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        if (subDateStr !== selectedDate && localDateStr !== selectedDate) {
          return false;
        }
      }

      // Quick Date Preset filter
      if (selectedDatePreset !== 'ALL') {
        if (!sub.submittedAt) return false;
        const d = new Date(sub.submittedAt);
        if (isNaN(d.getTime())) return false;
        const now = new Date();

        if (selectedDatePreset === 'TODAY') {
          const isToday =
            d.getDate() === now.getDate() &&
            d.getMonth() === now.getMonth() &&
            d.getFullYear() === now.getFullYear();
          if (!isToday) return false;
        } else if (selectedDatePreset === 'YESTERDAY') {
          const yesterday = new Date(now);
          yesterday.setDate(now.getDate() - 1);
          const isYesterday =
            d.getDate() === yesterday.getDate() &&
            d.getMonth() === yesterday.getMonth() &&
            d.getFullYear() === yesterday.getFullYear();
          if (!isYesterday) return false;
        } else if (selectedDatePreset === 'LAST_7_DAYS') {
          const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          if (d < sevenDaysAgo) return false;
        } else if (selectedDatePreset === 'LAST_30_DAYS') {
          const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          if (d < thirtyDaysAgo) return false;
        }
      }

      // Status filter
      if (selectedStatus === 'PASSED' && !sub.passed) return false;
      if (selectedStatus === 'FAILED' && sub.passed !== false) return false;
      if (selectedStatus === 'COMPLETED' && sub.status !== 'COMPLETED') return false;
      if (selectedStatus === 'IN_PROGRESS' && sub.status !== 'IN_PROGRESS') return false;

      // Category filter (based on assessment title keywords)
      if (selectedCategory !== 'ALL') {
        const title = (sub.assessmentTitle || '').toUpperCase();
        if (selectedCategory === 'CODING' && !title.includes('CODE') && !title.includes('ALGORITHM') && !title.includes('PROGRAM')) {
          return false;
        }
        if (selectedCategory === 'SQL' && !title.includes('SQL') && !title.includes('DATABASE') && !title.includes('DATA')) {
          return false;
        }
        if (selectedCategory === 'QUIZ' && !title.includes('QUIZ') && !title.includes('APTITUDE') && !title.includes('MCQ')) {
          return false;
        }
      }

      // Search keyword
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesName = (sub.studentName || '').toLowerCase().includes(term);
        const matchesEmail = (sub.studentEmail || '').toLowerCase().includes(term);
        const matchesAssessment = (sub.assessmentTitle || '').toLowerCase().includes(term);
        if (!matchesName && !matchesEmail && !matchesAssessment) {
          return false;
        }
      }

      return true;
    });
  }, [allSubmissions, selectedAssessmentId, selectedMonth, selectedDate, selectedDatePreset, selectedCategory, selectedStatus, searchTerm]);

  // Ranked submissions for the podium and badges
  const rankedSubmissions = useMemo(() => {
    // Clone and sort by score percentage descending, then submittedAt ascending
    const sorted = [...filteredSubmissions].sort((a, b) => {
      const pctA = (a.score || 0) / (a.assessmentTotalMarks || 100);
      const pctB = (b.score || 0) / (b.assessmentTotalMarks || 100);
      if (pctB !== pctA) return pctB - pctA;
      const timeA = a.submittedAt ? new Date(a.submittedAt).getTime() : Infinity;
      const timeB = b.submittedAt ? new Date(b.submittedAt).getTime() : Infinity;
      return timeA - timeB;
    });

    const total = sorted.length;
    return sorted.map((sub, index) => {
      const rank = index + 1;
      const badges = evaluateStudentBadges(sub, rank, total);
      return {
        ...sub,
        rank,
        badges,
      };
    });
  }, [filteredSubmissions]);

  // Top 3 Podium Achievers
  const top1 = rankedSubmissions[0];
  const top2 = rankedSubmissions[1];
  const top3 = rankedSubmissions[2];

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = rankedSubmissions.length;
    if (!total) return { total: 0, avgScore: 0, passRate: 0, badgesCount: 0 };

    const totalScorePct = rankedSubmissions.reduce((sum, s) => {
      const max = s.assessmentTotalMarks || s.totalMarks || 100;
      return sum + ((s.score || 0) / max) * 100;
    }, 0);

    const passedCount = rankedSubmissions.filter((s) => s.passed).length;
    const badgesCount = rankedSubmissions.reduce((sum, s) => sum + (s.badges?.length || 0), 0);

    return {
      total,
      avgScore: Math.round(totalScorePct / total),
      passRate: Math.round((passedCount / total) * 100),
      badgesCount,
    };
  }, [rankedSubmissions]);

  // CSV Export
  const handleExportCsv = () => {
    if (!rankedSubmissions.length) return;

    const headers = [
      'Rank',
      'Student Name',
      'Student Email',
      'Assessment Title',
      'Solved Date',
      'Score Obtained',
      'Total Marks',
      'Percentage',
      'Grade',
      'Passed',
      'Attempts',
      'Badges Earned',
      'Status',
    ];

    const rows = rankedSubmissions.map((s) => {
      const badgeTitles = (s.badges || []).map((b) => b.title).join('; ');
      const pct = Math.round(((s.score || 0) / (s.assessmentTotalMarks || 100)) * 100);
      return [
        s.rank,
        `"${(s.studentName || 'Learner').replace(/"/g, '""')}"`,
        `"${(s.studentEmail || '').replace(/"/g, '""')}"`,
        `"${(s.assessmentTitle || '').replace(/"/g, '""')}"`,
        `"${s.submittedAt ? formatDateTime(s.submittedAt) : 'N/A'}"`,
        s.score || 0,
        s.assessmentTotalMarks || 100,
        `${pct}%`,
        s.gradeLetter || 'N/A',
        s.passed ? 'YES' : 'NO',
        s.attemptsCount || 1,
        `"${badgeTitles.replace(/"/g, '""')}"`,
        s.status || 'COMPLETED',
      ].join(',');
    });

    const csv = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `assessment_submissions_history_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getAssessmentDetailsRoute = (id) =>
    isInstructor ? ROUTES.INSTRUCTOR_ASSESSMENT_DETAILS(id) : ROUTES.ADMIN_ASSESSMENT_DETAILS(id);

  if (assessmentsLoading || analyticsLoading) {
    return <Spinner fullPage={false} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 60 }}>
      {/* ── 1. Page Header & Actions ── */}
      <div
        style={{
          background: 'var(--surface-medium, #18181b)',
          border: '1px solid var(--border-color, #27272a)',
          borderRadius: 18,
          padding: '24px 28px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <div>
            <Link
              to={isInstructor ? ROUTES.INSTRUCTOR_ANALYTICS : ROUTES.ADMIN_ANALYTICS}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--text-muted)',
                textDecoration: 'none',
                marginBottom: 10,
              }}
            >
              <ArrowLeft size={14} /> Back to Dashboard
            </Link>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  background: 'rgba(245, 158, 11, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#d97706',
                }}
              >
                <Trophy size={22} />
              </div>
              <div>
                <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>
                  Global Assessment Submissions &amp; History
                </h1>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
                  Complete record of all assessments solved, candidate scores, dates, and LeetCode honors.
                </p>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={handleExportCsv}
              disabled={rankedSubmissions.length === 0}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 18px',
                borderRadius: 10,
                background: 'var(--bg-secondary, #27272a)',
                border: '1px solid var(--border-color, #3f3f46)',
                color: 'var(--text-primary, #fff)',
                fontSize: 13,
                fontWeight: 600,
                cursor: rankedSubmissions.length === 0 ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                opacity: rankedSubmissions.length === 0 ? 0.6 : 1,
              }}
              onMouseEnter={(e) => {
                if (rankedSubmissions.length > 0) e.currentTarget.style.background = 'var(--border-color, #3f3f46)';
              }}
              onMouseLeave={(e) => {
                if (rankedSubmissions.length > 0) e.currentTarget.style.background = 'var(--bg-secondary, #27272a)';
              }}
            >
              <Download size={15} /> Export History (CSV)
            </button>
          </div>
        </div>
      </div>

      {loadError && <Alert tone="error">{loadError}</Alert>}

      {/* ── 2. KPI Metrics Bar ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
        }}
      >
        <div
          style={{
            background: 'var(--surface-medium, #18181b)',
            border: '1px solid var(--border-color, #27272a)',
            borderRadius: 14,
            padding: 18,
            display: 'flex',
            alignItems: 'center',
            gap: 14,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              background: 'rgba(59, 130, 246, 0.12)',
              color: '#3b82f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <CheckCircle2 size={22} />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Assessments Solved
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>
              {metrics.total.toLocaleString()}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {assessments.length} assessments tracked
            </div>
          </div>
        </div>

        <div
          style={{
            background: 'var(--surface-medium, #18181b)',
            border: '1px solid var(--border-color, #27272a)',
            borderRadius: 14,
            padding: 18,
            display: 'flex',
            alignItems: 'center',
            gap: 14,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              background: 'rgba(16, 185, 129, 0.12)',
              color: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <ShieldCheck size={22} />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Average Pass Rate
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#10b981' }}>
              {metrics.passRate}%
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Avg. score: {metrics.avgScore}%
            </div>
          </div>
        </div>

        <div
          style={{
            background: 'var(--surface-medium, #18181b)',
            border: '1px solid var(--border-color, #27272a)',
            borderRadius: 14,
            padding: 18,
            display: 'flex',
            alignItems: 'center',
            gap: 14,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              background: 'rgba(245, 158, 11, 0.12)',
              color: '#f59e0b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Sparkles size={22} />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Badges Awarded
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#f59e0b' }}>
              {metrics.badgesCount}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              LeetCode honors unlocked
            </div>
          </div>
        </div>

        <div
          style={{
            background: 'var(--surface-medium, #18181b)',
            border: '1px solid var(--border-color, #27272a)',
            borderRadius: 14,
            padding: 18,
            display: 'flex',
            alignItems: 'center',
            gap: 14,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              background: 'rgba(168, 85, 247, 0.12)',
              color: '#a855f7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Users size={22} />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Active Learners
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>
              {new Set(rankedSubmissions.map((s) => s.studentId)).size}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Unique student solvers
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. Filters Toolbar (Month, Assessment, Category, Status, Search) ── */}
      <div
        style={{
          background: 'var(--surface-medium, #18181b)',
          border: '1px solid var(--border-color, #27272a)',
          borderRadius: 16,
          padding: '18px 22px',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
          {/* Assessment Filter */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 220 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Assessment
            </label>
            <select
              value={selectedAssessmentId}
              onChange={(e) => setSelectedAssessmentId(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: 8,
                background: 'var(--bg-secondary, #27272a)',
                border: '1px solid var(--border-color, #3f3f46)',
                color: 'var(--text-primary)',
                fontSize: 13,
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="ALL">All Assessments</option>
              {assessments.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.title}
                </option>
              ))}
            </select>
          </div>

          {/* Month Filter */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 160 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Month &amp; Time
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(e.target.value);
                setSelectedDate('');
                setSelectedDatePreset('ALL');
              }}
              style={{
                padding: '8px 12px',
                borderRadius: 8,
                background: 'var(--bg-secondary, #27272a)',
                border: '1px solid var(--border-color, #3f3f46)',
                color: 'var(--text-primary)',
                fontSize: 13,
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="ALL">All Months</option>
              <option value="THIS_MONTH">This Month</option>
              <option value="LAST_MONTH">Last Month</option>
              {availableMonths.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {/* Specific Date Filter */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 170 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Specific Date
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setSelectedDatePreset('ALL');
                }}
                style={{
                  padding: '7px 10px',
                  borderRadius: 8,
                  background: 'var(--bg-secondary, #27272a)',
                  border: '1px solid var(--border-color, #3f3f46)',
                  color: 'var(--text-primary)',
                  fontSize: 13,
                  outline: 'none',
                  cursor: 'pointer',
                  width: '100%',
                }}
              />
              {selectedDate && (
                <button
                  type="button"
                  onClick={() => setSelectedDate('')}
                  title="Clear date"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: 4,
                  }}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Domain / Category Filter */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 170 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Domain
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: 8,
                background: 'var(--bg-secondary, #27272a)',
                border: '1px solid var(--border-color, #3f3f46)',
                color: 'var(--text-primary)',
                fontSize: 13,
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="ALL">All Domains</option>
              <option value="CODING">💻 Algorithms &amp; Coding</option>
              <option value="SQL">🗄️ Database &amp; SQL</option>
              <option value="QUIZ">🧠 Quizzes &amp; Aptitude</option>
            </select>
          </div>

          {/* Status Filter */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 140 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Outcome
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: 8,
                background: 'var(--bg-secondary, #27272a)',
                border: '1px solid var(--border-color, #3f3f46)',
                color: 'var(--text-primary)',
                fontSize: 13,
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="ALL">All Outcomes</option>
              <option value="PASSED">Passed Only</option>
              <option value="FAILED">Failed Only</option>
              <option value="COMPLETED">Completed</option>
              <option value="IN_PROGRESS">In Progress</option>
            </select>
          </div>

          {/* Search Box */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 200 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Search Candidate / Assessment
            </label>
            <div style={{ position: 'relative' }}>
              <Search
                size={15}
                style={{
                  position: 'absolute',
                  left: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                }}
              />
              <input
                type="text"
                placeholder="Type name, email, or assessment..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 36px',
                  borderRadius: 8,
                  background: 'var(--bg-secondary, #27272a)',
                  border: '1px solid var(--border-color, #3f3f46)',
                  color: 'var(--text-primary)',
                  fontSize: 13,
                  outline: 'none',
                }}
              />
            </div>
          </div>
        </div>

        {/* Quick Date Presets & Filter Tags Sub-bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flexWrap: 'wrap',
            paddingTop: 8,
            borderTop: '1px solid var(--border-color, #27272a)',
          }}
        >
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginRight: 4 }}>
            Quick Dates:
          </span>
          {[
            { id: 'ALL', label: 'All Dates' },
            { id: 'TODAY', label: 'Today' },
            { id: 'YESTERDAY', label: 'Yesterday' },
            { id: 'LAST_7_DAYS', label: 'Last 7 Days' },
            { id: 'LAST_30_DAYS', label: 'Last 30 Days' },
          ].map((preset) => {
            const isActive = selectedDatePreset === preset.id && !selectedDate;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => {
                  setSelectedDatePreset(preset.id);
                  setSelectedDate('');
                }}
                style={{
                  padding: '4px 10px',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  border: isActive ? '1px solid #f59e0b' : '1px solid var(--border-color, #3f3f46)',
                  background: isActive ? 'rgba(245, 158, 11, 0.15)' : 'var(--bg-secondary, #27272a)',
                  color: isActive ? '#f59e0b' : 'var(--text-muted)',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {preset.label}
              </button>
            );
          })}

          {selectedAssessmentId !== 'ALL' && (
            <div
              style={{
                marginLeft: 'auto',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                padding: '3px 10px',
                borderRadius: 6,
              }}
            >
              <span style={{ fontSize: 11, color: '#60a5fa' }}>
                Filtered: <strong>{assessments.find((a) => a.id === selectedAssessmentId)?.title || selectedAssessmentId}</strong>
              </span>
              <button
                type="button"
                onClick={() => setSelectedAssessmentId('ALL')}
                style={{ background: 'transparent', border: 'none', color: '#93c5fd', cursor: 'pointer', padding: 0 }}
                title="Clear assessment filter"
              >
                <X size={12} />
              </button>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
          <span>
            Displaying <strong>{rankedSubmissions.length}</strong> solved records matching filters
          </span>
          {(selectedAssessmentId !== 'ALL' || selectedMonth !== 'ALL' || selectedDate || selectedDatePreset !== 'ALL' || selectedCategory !== 'ALL' || selectedStatus !== 'ALL' || searchTerm) && (
            <button
              onClick={() => {
                setSelectedAssessmentId('ALL');
                setSelectedMonth('ALL');
                setSelectedDate('');
                setSelectedDatePreset('ALL');
                setSelectedCategory('ALL');
                setSelectedStatus('ALL');
                setSearchTerm('');
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#f59e0b',
                fontSize: 12,
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* ── 4. Hall of Fame Podium (Top 3 of Selection) ── */}
      {rankedSubmissions.length > 0 && (
        <div
          style={{
            background: 'var(--surface-medium, #18181b)',
            border: '1px solid var(--border-color, #27272a)',
            borderRadius: 18,
            padding: '28px 24px 18px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#f59e0b', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <Sparkles size={14} /> Honors Podium
            </div>
            <h3 style={{ margin: '4px 0 0', fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
              Top Performers in Selected View
            </h3>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'flex-end',
              gap: 20,
              flexWrap: 'wrap',
            }}
          >
            {/* Rank 2 (Silver) */}
            {top2 && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 220 }}>
                <div style={{ position: 'relative', marginBottom: 12 }}>
                  <div
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #94a3b8, #64748b)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 22,
                      fontWeight: 700,
                      color: '#fff',
                      border: '3px solid #cbd5e1',
                    }}
                  >
                    {(top2.studentName || 'S').charAt(0).toUpperCase()}
                  </div>
                  <div
                    style={{
                      position: 'absolute',
                      bottom: -4,
                      right: -4,
                      background: '#64748b',
                      color: '#fff',
                      borderRadius: '50%',
                      width: 24,
                      height: 24,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 12,
                      fontWeight: 800,
                      border: '2px solid #18181b',
                    }}
                  >
                    2
                  </div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', textAlign: 'center' }}>
                  {top2.studentName || 'Student #2'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, textAlign: 'center' }}>
                  {top2.score} / {top2.assessmentTotalMarks || 100} ({Math.round(((top2.score || 0) / (top2.assessmentTotalMarks || 100)) * 100)}%)
                </div>
                <div
                  style={{
                    width: '100%',
                    height: 80,
                    background: 'linear-gradient(180deg, rgba(148, 163, 184, 0.25) 0%, rgba(100, 116, 139, 0.08) 100%)',
                    borderRadius: '12px 12px 0 0',
                    border: '1px solid rgba(148, 163, 184, 0.35)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <span style={{ fontSize: 22 }}>🥈</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#cbd5e1' }}>SILVER</span>
                </div>
              </div>
            )}

            {/* Rank 1 (Gold - Center) */}
            {top1 && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 250, transform: 'translateY(-10px)' }}>
                <span style={{ fontSize: 28, marginBottom: 4 }}>👑</span>
                <div style={{ position: 'relative', marginBottom: 12 }}>
                  <div
                    style={{
                      width: 76,
                      height: 76,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #fbbf24, #d97706)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 26,
                      fontWeight: 800,
                      color: '#fff',
                      border: '3px solid #f59e0b',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                    }}
                  >
                    {(top1.studentName || 'S').charAt(0).toUpperCase()}
                  </div>
                  <div
                    style={{
                      position: 'absolute',
                      bottom: -4,
                      right: -4,
                      background: '#d97706',
                      color: '#fff',
                      borderRadius: '50%',
                      width: 28,
                      height: 28,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 14,
                      fontWeight: 800,
                      border: '2px solid #18181b',
                    }}
                  >
                    1
                  </div>
                </div>
                <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', textAlign: 'center' }}>
                  {top1.studentName || 'Champion'}
                </div>
                <div style={{ fontSize: 12, color: '#f59e0b', fontWeight: 600, marginBottom: 8, textAlign: 'center' }}>
                  {top1.score} / {top1.assessmentTotalMarks || 100} ({Math.round(((top1.score || 0) / (top1.assessmentTotalMarks || 100)) * 100)}%)
                </div>
                <div
                  style={{
                    width: '100%',
                    height: 110,
                    background: 'linear-gradient(180deg, rgba(245, 158, 11, 0.35) 0%, rgba(217, 119, 6, 0.1) 100%)',
                    borderRadius: '14px 14px 0 0',
                    border: '1.5px solid rgba(245, 158, 11, 0.55)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 4,
                  }}
                >
                  <span style={{ fontSize: 26 }}>🥇</span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#fef08a' }}>GOLD CHAMPION</span>
                  {top1.badges?.[0] && (
                    <LeetCodeBadge badge={top1.badges[0]} size="xs" onClick={(b) => setSelectedBadge(b)} />
                  )}
                </div>
              </div>
            )}

            {/* Rank 3 (Bronze) */}
            {top3 && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 220 }}>
                <div style={{ position: 'relative', marginBottom: 12 }}>
                  <div
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #d97706, #78350f)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 22,
                      fontWeight: 700,
                      color: '#fff',
                      border: '3px solid #fcd34d',
                    }}
                  >
                    {(top3.studentName || 'S').charAt(0).toUpperCase()}
                  </div>
                  <div
                    style={{
                      position: 'absolute',
                      bottom: -4,
                      right: -4,
                      background: '#78350f',
                      color: '#fff',
                      borderRadius: '50%',
                      width: 24,
                      height: 24,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 12,
                      fontWeight: 800,
                      border: '2px solid #18181b',
                    }}
                  >
                    3
                  </div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', textAlign: 'center' }}>
                  {top3.studentName || 'Student #3'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, textAlign: 'center' }}>
                  {top3.score} / {top3.assessmentTotalMarks || 100} ({Math.round(((top3.score || 0) / (top3.assessmentTotalMarks || 100)) * 100)}%)
                </div>
                <div
                  style={{
                    width: '100%',
                    height: 65,
                    background: 'linear-gradient(180deg, rgba(217, 119, 6, 0.25) 0%, rgba(120, 53, 15, 0.08) 100%)',
                    borderRadius: '12px 12px 0 0',
                    border: '1px solid rgba(217, 119, 6, 0.35)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <span style={{ fontSize: 20 }}>🥉</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#fde68a' }}>BRONZE</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 5. Submissions & Solved Data Table ── */}
      <div
        style={{
          background: 'var(--surface-medium, #18181b)',
          border: '1px solid var(--border-color, #27272a)',
          borderRadius: 16,
          overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--bg-secondary, #27272a)', borderBottom: '1px solid var(--border-color, #3f3f46)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '14px 16px', fontWeight: 600, width: 70 }}>Rank</th>
                <th style={{ padding: '14px 16px', fontWeight: 600 }}>Student</th>
                <th style={{ padding: '14px 16px', fontWeight: 600 }}>Assessment</th>
                <th style={{ padding: '14px 16px', fontWeight: 600 }}>Solved Date</th>
                <th style={{ padding: '14px 16px', fontWeight: 600 }}>Score Obtained</th>
                <th style={{ padding: '14px 16px', fontWeight: 600, width: 80 }}>Grade</th>
                <th style={{ padding: '14px 16px', fontWeight: 600, width: 100 }}>Result</th>
                <th style={{ padding: '14px 16px', fontWeight: 600 }}>Badges Earned</th>
                <th style={{ padding: '14px 16px', fontWeight: 600, width: 80 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {rankedSubmissions.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: 36, marginBottom: 8 }}>📝</div>
                    <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-primary)', marginBottom: 4 }}>
                      No Assessment Submissions Found
                    </div>
                    <div>Try adjusting your month, assessment, or keyword filters.</div>
                  </td>
                </tr>
              ) : (
                rankedSubmissions.map((s, idx) => {
                  const pct = Math.round(((s.score || 0) / (s.assessmentTotalMarks || 100)) * 100);
                  const isTop1 = s.rank === 1;
                  const isTop2 = s.rank === 2;
                  const isTop3 = s.rank === 3;

                  return (
                    <tr
                      key={`${s.assessmentId}_${s.studentId}_${idx}`}
                      style={{
                        borderBottom: '1px solid var(--border-color, #27272a)',
                        transition: 'background 0.15s',
                        background: isTop1
                          ? 'rgba(245, 158, 11, 0.04)'
                          : isTop2
                          ? 'rgba(148, 163, 184, 0.03)'
                          : isTop3
                          ? 'rgba(217, 119, 6, 0.03)'
                          : 'transparent',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-secondary, #27272a)')}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = isTop1
                          ? 'rgba(245, 158, 11, 0.04)'
                          : isTop2
                          ? 'rgba(148, 163, 184, 0.03)'
                          : isTop3
                          ? 'rgba(217, 119, 6, 0.03)'
                          : 'transparent';
                      }}
                    >
                      {/* Rank */}
                      <td style={{ padding: '14px 16px', fontWeight: 700 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          {isTop1 ? '🥇' : isTop2 ? '🥈' : isTop3 ? '🥉' : `#${s.rank}`}
                        </div>
                      </td>

                      {/* Student */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: '50%',
                              background: isTop1 ? '#f59e0b' : isTop2 ? '#94a3b8' : isTop3 ? '#d97706' : 'var(--border-color, #3f3f46)',
                              color: '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: 12,
                              flexShrink: 0,
                            }}
                          >
                            {(s.studentName || 'S').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                              {s.studentName || 'Anonymous Student'}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                              {s.studentEmail || 'No email'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Assessment */}
                      <td style={{ padding: '14px 16px' }}>
                        <Link
                          to={getAssessmentDetailsRoute(s.assessmentId)}
                          style={{
                            fontWeight: 600,
                            color: 'var(--text-primary)',
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>
                            {s.assessmentTitle}
                          </span>
                          <ExternalLink size={12} style={{ color: 'var(--text-muted)' }} />
                        </Link>
                      </td>

                      {/* Solved Date */}
                      <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                        {s.submittedAt ? (
                          <div>
                            <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                              {formatDateTime(s.submittedAt)}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                              {formatRelative(s.submittedAt)}
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>—</span>
                        )}
                      </td>

                      {/* Score Obtained */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: 120 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                              {s.score || 0} / {s.assessmentTotalMarks || 100}
                            </span>
                            <span style={{ fontWeight: 600, color: pct >= 80 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444' }}>
                              {pct}%
                            </span>
                          </div>
                          <div style={{ height: 5, borderRadius: 99, background: 'var(--border-color, #3f3f46)', overflow: 'hidden' }}>
                            <div
                              style={{
                                height: '100%',
                                width: `${Math.min(100, pct)}%`,
                                background: pct >= 80 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444',
                                borderRadius: 99,
                              }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Grade */}
                      <td style={{ padding: '14px 16px' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 700,
                            background:
                              s.gradeLetter === 'A+' || s.gradeLetter === 'A'
                                ? 'rgba(16, 185, 129, 0.15)'
                                : s.gradeLetter === 'B'
                                ? 'rgba(59, 130, 246, 0.15)'
                                : 'rgba(148, 163, 184, 0.15)',
                            color:
                              s.gradeLetter === 'A+' || s.gradeLetter === 'A'
                                ? '#10b981'
                                : s.gradeLetter === 'B'
                                ? '#3b82f6'
                                : 'var(--text-muted)',
                            border: `1px solid ${
                              s.gradeLetter === 'A+' || s.gradeLetter === 'A' ? '#10b98140' : '#3b82f640'
                            }`,
                          }}
                        >
                          {s.gradeLetter || 'N/A'}
                        </span>
                      </td>

                      {/* Result */}
                      <td style={{ padding: '14px 16px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '3px 8px',
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 700,
                            background: s.passed ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                            color: s.passed ? '#10b981' : '#ef4444',
                          }}
                        >
                          {s.passed ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                          {s.passed ? 'PASSED' : 'FAILED'}
                        </span>
                      </td>

                      {/* Badges Earned */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {s.badges && s.badges.length > 0 ? (
                            s.badges.slice(0, 2).map((b) => (
                              <LeetCodeBadge
                                key={b.id}
                                badge={b}
                                size="xs"
                                onClick={(badge) => setSelectedBadge(badge)}
                              />
                            ))
                          ) : (
                            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                              No badges
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Action */}
                      <td style={{ padding: '14px 16px' }}>
                        <Link
                          to={getAssessmentDetailsRoute(s.assessmentId)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            color: '#f59e0b',
                            fontSize: 12,
                            fontWeight: 600,
                            textDecoration: 'none',
                          }}
                        >
                          Details <ArrowUpRight size={13} />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 6. Badge Detail Modal ── */}
      {selectedBadge && (
        <BadgeDetailModal
          badge={selectedBadge}
          onClose={() => setSelectedBadge(null)}
        />
      )}
    </div>
  );
};

export default GlobalSubmissionsHistoryPage;
