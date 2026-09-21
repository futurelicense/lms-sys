import { useMemo, useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  BookOpen,
  Award,
  Clock,
  CheckCircle2,
  Play,
  ArrowRight,
  Flame,
  FileText,
  Calendar,
  Sparkles,
  TrendingUp,
  Shield,
  Compass,
  AlertCircle,
  Bell,
  Download,
  Target,
  Zap,
  Trophy,
  CheckCircle,
  Lock,
  ExternalLink,
  MessageSquare,
  ChevronRight,
  Search,
  X,
} from 'lucide-react';
import useAuth from '../../auth/hooks/useAuth';
import { useMyCourses } from '../../courses/hooks/useCourses';
import analyticsService from '../services/analyticsService';
import assessmentService from '../../assessments/services/assessmentService';
import { ROUTES } from '../../../constants/routes';
import { QUERY_KEYS } from '../../../constants/appConstants';
import Spinner from '../../../components/common/Spinner';
import { useResources } from '../../resources/hooks/useResources';
import resourceService from '../../resources/services/resourceService';
import LeetCodeBadge from '../../assessments/components/LeetCodeBadge';
import BadgeDetailModal from '../../assessments/components/BadgeDetailModal';
import { LEETCODE_BADGES } from '../../assessments/utils/badgeDefinitions';

export const StudentDashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const studentName = user?.fullName || user?.firstName || user?.email?.split('@')[0] || 'Learner';
  const [selectedBadge, setSelectedBadge] = useState(null);

  // Current time greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  // 1. Fetch Student Progress Analytics
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: [...QUERY_KEYS.ANALYTICS, 'progress'],
    queryFn: () => analyticsService.studentProgress(),
    staleTime: 30000,
  });

  // 2. Fetch My Enrolled Courses
  const { data: coursesData, isLoading: coursesLoading } = useMyCourses();
  const { data: toolkitResources = [] } = useResources();
  const [showAllGuidesModal, setShowAllGuidesModal] = useState(false);
  const [toolkitCategoryFilter, setToolkitCategoryFilter] = useState('ALL');
  const [toolkitSearch, setToolkitSearch] = useState('');

  const filteredModalGuides = useMemo(() => {
    return toolkitResources.filter((g) => {
      const matchCat = toolkitCategoryFilter === 'ALL' || g.category === toolkitCategoryFilter;
      const matchSearch =
        !toolkitSearch ||
        g.title?.toLowerCase().includes(toolkitSearch.toLowerCase()) ||
        g.description?.toLowerCase().includes(toolkitSearch.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [toolkitResources, toolkitCategoryFilter, toolkitSearch]);
  const courses = useMemo(() => {
    const raw =
      coursesData?.content ??
      coursesData?.data?.content ??
      coursesData?.items ??
      coursesData?.data ??
      coursesData ??
      [];
    return Array.isArray(raw) ? raw : [];
  }, [coursesData]);

  // Determine the active / "Continue Learning" course
  const continueCourse = useMemo(() => {
    if (!courses || courses.length === 0) return null;
    const inProgress = courses.find((c) => (c.progressPercent || 0) < 100);
    return inProgress || courses[0];
  }, [courses]);

  // 3. Fetch Student Assessments
  const [assessments, setAssessments] = useState([]);
  const [assessmentsLoading, setAssessmentsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    assessmentService
      .list()
      .then((res) => {
        if (!active) return;
        const items =
          res?.content ??
          res?.data?.data?.content ??
          res?.data?.content ??
          (Array.isArray(res) ? res : []);
        setAssessments(items.slice(0, 3));
      })
      .catch(() => {
        if (active) setAssessments([]);
      })
      .finally(() => {
        if (active) setAssessmentsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  // Weekly Trend Chart Data
  const weeklyTrends = useMemo(() => {
    const defaultDays = [
      { name: 'Mon', hours: 1.5 },
      { name: 'Tue', hours: 2.0 },
      { name: 'Wed', hours: 0.8 },
      { name: 'Thu', hours: 3.2 },
      { name: 'Fri', hours: 2.4 },
      { name: 'Sat', hours: 1.0 },
      { name: 'Sun', hours: 2.1 },
    ];
    return analytics?.enrollmentTrend && analytics.enrollmentTrend.length > 0
      ? analytics.enrollmentTrend
      : defaultDays;
  }, [analytics]);

  const maxHours = Math.max(1, ...weeklyTrends.map((d) => d.hours || 0));

  // Quick download helper for study cheatsheets
  

  const stats = [
    {
      label: 'Courses in Progress',
      value: analytics?.inProgressCount ?? (courses.filter((c) => (c.progressPercent || 0) < 100).length || courses.length),
      subtext: `${courses.length} total enrolled`,
      icon: <BookOpen size={20} className="text-blue-400" />,
      color: '#3b82f6',
      bg: 'rgba(59, 130, 246, 0.1)',
    },
    {
      label: 'Completed Courses',
      value: analytics?.completedCount ?? (courses.filter((c) => (c.progressPercent || 0) >= 100).length || 0),
      subtext: 'Unlock completion certificates',
      icon: <CheckCircle2 size={20} className="text-emerald-400" />,
      color: '#10b981',
      bg: 'rgba(16, 185, 129, 0.1)',
    },
    {
      label: 'Certificates Earned',
      value: analytics?.certificateCount ?? 0,
      subtext: '0 / 7 verifiable credentials',
      icon: <Award size={20} className="text-amber-400" />,
      color: '#f59e0b',
      bg: 'rgba(245, 158, 11, 0.1)',
    },
    {
      label: 'Hours Learned',
      value: `${analytics?.hoursLearned ?? 12}h`,
      subtext: '+3.2h logged this week',
      icon: <Clock size={20} className="text-violet-400" />,
      color: '#8b5cf6',
      bg: 'rgba(139, 92, 246, 0.1)',
    },
  ];

  // Announcements
  const announcements = [
    {
      id: 1,
      tag: 'ASSESSMENT WINDOW',
      tagColor: '#3b82f6',
      tagBg: 'rgba(59, 130, 246, 0.12)',
      title: 'Proctored Assessments are Live',
      detail: 'Java Collections & SQL Optimization are open for testing. Make sure webcam permissions are granted.',
      date: 'Today, 2:30 PM',
    },
    {
      id: 2,
      tag: 'NEW CONTENT',
      tagColor: '#10b981',
      tagBg: 'rgba(16, 185, 129, 0.12)',
      title: 'React 19 Hooks & Architectural Patterns Added',
      detail: 'New practical exercises and reference study guides have been published in your module curriculum.',
      date: 'Yesterday',
    },
    {
      id: 3,
      tag: 'CERTIFICATION',
      tagColor: '#f59e0b',
      tagBg: 'rgba(245, 158, 11, 0.12)',
      title: 'Verifiable Digital Credentials Enabled',
      detail: 'Completed course certificates now feature instant cryptographic QR verification for LinkedIn sharing.',
      date: 'Sep 11, 2026',
    },
  ];

  // Gamification Badges
  const badges = [
    {
      id: 'streak',
      title: 'Streak Titan',
      desc: '4 continuous days of learning',
      status: 'UNLOCKED',
      icon: <Flame size={18} fill="#ef4444" color="#ef4444" />,
      badgeColor: '#ef4444',
      badgeBg: 'rgba(239, 68, 68, 0.15)',
    },
    {
      id: 'code',
      title: 'Code Pioneer',
      desc: 'First coding question submitted',
      status: 'UNLOCKED',
      icon: <Zap size={18} color="#eab308" />,
      badgeColor: '#eab308',
      badgeBg: 'rgba(234, 179, 8, 0.15)',
    },
    {
      id: 'ace',
      title: 'Assessment Ace',
      desc: 'Score 85%+ on a proctored exam',
      status: 'IN_PROGRESS',
      progress: 78,
      icon: <Target size={18} color="#3b82f6" />,
      badgeColor: '#3b82f6',
      badgeBg: 'rgba(59, 130, 246, 0.15)',
    },
    {
      id: 'finisher',
      title: 'Course Master',
      desc: 'Reach 100% completion in any course',
      status: 'LOCKED',
      icon: <Trophy size={18} color="#a1a1aa" />,
      badgeColor: '#a1a1aa',
      badgeBg: 'rgba(255, 255, 255, 0.05)',
    },
  ];

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 40 }}>
      {/* ── Hero Greeting Banner ── */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.15) 0%, rgba(147, 51, 234, 0.15) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 20,
          padding: '28px 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 20,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-primary-400, #60a5fa)' }}>
              STUDENT LEARNING MISSION CONTROL
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '2px 8px',
                borderRadius: 99,
                fontSize: 11,
                fontWeight: 700,
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#f87171',
                border: '1px solid rgba(239, 68, 68, 0.3)',
              }}
            >
              <Flame size={13} fill="#ef4444" />
              {analytics?.streakDays ?? 4} Day Streak!
            </span>
          </div>
          <h1 style={{ margin: '0 0 6px', fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
            {greeting}, {studentName}! 🚀
          </h1>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--text-secondary)', maxWidth: 540, lineHeight: 1.5 }}>
            Ready to continue your mastery? Keep momentum going by finishing your active module or taking your pending assessment.
          </p>
        </div>

        {/* Quick Action Dock */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', zIndex: 2 }}>
          <button
            onClick={() => navigate(ROUTES.MY_COURSES)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 18px',
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              background: 'var(--text-primary)',
              color: 'var(--bg)',
              border: 'none',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              transition: 'transform 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            <BookOpen size={16} />
            My Courses
          </button>
          <button
            onClick={() => navigate(ROUTES.STUDENT_ASSESSMENTS)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 18px',
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              background: 'var(--surface-medium)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              transition: 'background 0.15s ease',
            }}
          >
            <FileText size={16} />
            Assessments
          </button>
          <button
            onClick={() => navigate(ROUTES.CERTIFICATES)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 18px',
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              background: 'var(--surface-medium)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              transition: 'background 0.15s ease',
            }}
          >
            <Award size={16} />
            Certificates
          </button>
        </div>
      </div>

      {/* ── 4 KPI Stats Row ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
        }}
      >
        {stats.map((item) => (
          <div
            key={item.label}
            style={{
              background: 'var(--lms-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 16,
              padding: '20px 22px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
              minHeight: 110,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <p style={{ margin: '0 0 4px', fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>
                  {item.label}
                </p>
                <h3 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: 'var(--text-primary)' }}>
                  {analyticsLoading ? '...' : item.value}
                </h3>
              </div>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: item.bg,
                  color: item.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {item.icon}
              </div>
            </div>
            <p style={{ margin: '8px 0 0', fontSize: 11, color: 'var(--text-secondary)', fontWeight: 500 }}>
              {item.subtext}
            </p>
          </div>
        ))}
      </div>

      {/* ── 2-Column: Continue Learning Hero & Weekly Activity ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: 24, alignItems: 'start' }}>
        {/* Left: Continue Learning Banner */}
        <div
          style={{
            background: 'var(--lms-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 18,
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sparkles size={18} className="text-amber-400" />
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                Continue Learning
              </h2>
            </div>
            <Link
              to={ROUTES.MY_COURSES}
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--color-primary-400, #60a5fa)',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              View All ({courses.length}) <ArrowRight size={14} />
            </Link>
          </div>

          {coursesLoading ? (
            <div style={{ padding: '40px 0', display: 'flex', justifyContent: 'center' }}>
              <Spinner />
            </div>
          ) : continueCourse ? (
            <div
              style={{
                background: 'var(--surface-medium)',
                border: '1px solid var(--border-color)',
                borderRadius: 14,
                padding: 20,
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
              }}
            >
              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                {continueCourse.thumbnailUrl ? (
                  <img
                    src={continueCourse.thumbnailUrl}
                    alt={continueCourse.title}
                    style={{ width: 68, height: 68, borderRadius: 12, objectFit: 'cover' }}
                  />
                ) : (
                  <div
                    style={{
                      width: 68,
                      height: 68,
                      borderRadius: 12,
                      background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 22,
                      fontWeight: 800,
                      flexShrink: 0,
                    }}
                  >
                    {continueCourse.title.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 600,
                        background: 'rgba(59, 130, 246, 0.12)',
                        color: '#3b82f6',
                      }}
                    >
                      {continueCourse.level || 'Interactive'}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      Instructor: {continueCourse.createdByName || 'Faculty Mentor'}
                    </span>
                  </div>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: 17,
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {continueCourse.title}
                  </h3>
                  <p
                    style={{
                      margin: '4px 0 0',
                      fontSize: 13,
                      color: 'var(--text-secondary)',
                      display: '-webkit-box',
                      WebkitLineClamp: 1,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {continueCourse.description || 'Resume from where you left off and finish your next module.'}
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 12,
                    fontWeight: 600,
                    marginBottom: 6,
                    color: 'var(--text-secondary)',
                  }}
                >
                  <span>Course Completion</span>
                  <span style={{ color: 'var(--text-primary)' }}>
                    {continueCourse.progressPercent ?? 0}%
                  </span>
                </div>
                <div style={{ height: 6, background: 'var(--border-color)', borderRadius: 99, overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${Math.min(100, continueCourse.progressPercent || 0)}%`,
                      background: 'linear-gradient(90deg, #3b82f6, #10b981)',
                      borderRadius: 99,
                      transition: 'width 0.4s ease',
                    }}
                  />
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => navigate(ROUTES.LEARNING(continueCourse.id))}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '12px 20px',
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: 'var(--color-primary-500, #3b82f6)',
                  color: '#fff',
                  border: 'none',
                  boxShadow: '0 2px 10px rgba(59, 130, 246, 0.3)',
                  transition: 'opacity 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
              >
                <Play size={16} fill="#fff" />
                Resume Learning
              </button>
            </div>
          ) : (
            <div
              style={{
                textAlign: 'center',
                padding: '40px 20px',
                background: 'var(--surface-medium)',
                borderRadius: 14,
                border: '1px dashed var(--border-color)',
              }}
            >
              <BookOpen size={36} style={{ color: 'var(--text-muted)', margin: '0 auto 12px' }} />
              <h4 style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
                No active courses yet
              </h4>
              <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--text-muted)' }}>
                Enroll into a course or ask your batch administrator to assign your learning path.
              </p>
              <button
                onClick={() => navigate(ROUTES.MY_COURSES)}
                style={{
                  padding: '8px 18px',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: 'var(--text-primary)',
                  color: 'var(--bg)',
                  border: 'none',
                }}
              >
                Explore Courses
              </button>
            </div>
          )}
        </div>

        {/* Right: Weekly Learning Activity Chart */}
        <div
          style={{
            background: 'var(--lms-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 18,
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrendingUp size={18} className="text-emerald-400" />
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                Weekly Study Time
              </h2>
            </div>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>
              Last 7 Days
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              height: 180,
              padding: '16px 0 0',
              borderBottom: '1px solid var(--border-color)',
              gap: 8,
            }}
          >
            {weeklyTrends.map((d) => {
              const heightPct = Math.round(((d.hours || 0) / maxHours) * 120);
              return (
                <div
                  key={d.name}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 8,
                    flex: 1,
                  }}
                >
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>
                    {d.hours > 0 ? `${d.hours}h` : '0'}
                  </span>
                  <div
                    title={`${d.name}: ${d.hours} hours`}
                    style={{
                      width: '70%',
                      maxWidth: 24,
                      height: `${Math.max(8, heightPct)}px`,
                      background: d.hours > 0 ? 'var(--color-primary-500, #3b82f6)' : 'var(--surface-medium)',
                      borderRadius: '6px 6px 0 0',
                      transition: 'height 0.4s ease',
                    }}
                  />
                  <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)' }}>
                    {d.name}
                  </span>
                </div>
              );
            })}
          </div>

          <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
            Consistent daily study boosts memory retention by over 60%!
          </p>
        </div>
      </div>

      {/* ── Upcoming Assessments & Milestones ── */}
      <div
        style={{
          background: 'var(--lms-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 18,
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calendar size={18} className="text-violet-400" />
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
              Upcoming Assessments & Deadlines
            </h2>
          </div>
          <Link
            to={ROUTES.STUDENT_ASSESSMENTS}
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--color-primary-400, #60a5fa)',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            All Assessments <ArrowRight size={14} />
          </Link>
        </div>

        {assessmentsLoading ? (
          <div style={{ padding: '30px 0', display: 'flex', justifyContent: 'center' }}>
            <Spinner />
          </div>
        ) : assessments.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '30px 10px',
              color: 'var(--text-muted)',
              fontSize: 13,
            }}
          >
            <CheckCircle2 size={32} style={{ margin: '0 auto 8px', color: '#10b981' }} />
            <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-primary)' }}>
              You are all caught up!
            </p>
            <p style={{ margin: '4px 0 0' }}>No pending assessments due right now.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 14 }}>
            {assessments.map((a) => (
              <div
                key={a.id}
                style={{
                  background: 'var(--surface-medium)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 12,
                  padding: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: 12,
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: 4,
                        fontSize: 10,
                        fontWeight: 700,
                        background: 'rgba(59, 130, 246, 0.1)',
                        color: '#3b82f6',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <Shield size={11} /> Proctored Test
                    </span>
                    {a.durationMinutes && (
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {a.durationMinutes} mins
                      </span>
                    )}
                  </div>
                  <h4 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
                    {a.title}
                  </h4>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 12,
                      color: 'var(--text-secondary)',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {a.description || 'Test your knowledge on this module with automated test-case evaluation.'}
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>
                    Total: {a.totalMarks || 100} Marks
                  </span>
                  <button
                    onClick={() => navigate(ROUTES.ASSESSMENT_ATTEMPT(a.id))}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '6px 14px',
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      background: 'var(--text-primary)',
                      color: 'var(--bg)',
                      border: 'none',
                    }}
                  >
                    Launch <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── NEW SECTION: Daily Target, Announcements & Achievements ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: 24, alignItems: 'start' }}>
        
        {/* Left Column: Daily Target & Campus Noticeboard */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Daily Learning Goal Card */}
          <div
            style={{
              background: 'var(--lms-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 18,
              padding: 22,
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Target size={18} className="text-emerald-400" />
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
                  Today&apos;s Study Goal
                </h3>
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#10b981' }}>
                35m / 45m (78%)
              </span>
            </div>

            <div style={{ height: 8, background: 'var(--surface-medium)', borderRadius: 99, overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: '78%',
                  background: 'linear-gradient(90deg, #10b981, #06b6d4)',
                  borderRadius: 99,
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
              <span style={{ color: 'var(--text-muted)' }}>
                🔥 10 more minutes to hit your goal & secure your 5-day streak!
              </span>
              <button
                onClick={() => {
                  if (continueCourse) navigate(ROUTES.LEARNING(continueCourse.id));
                  else navigate(ROUTES.MY_COURSES);
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--color-primary-400, #60a5fa)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: 0,
                }}
              >
                Study Now <ChevronRight size={14} />
              </button>
            </div>
          </div>

          {/* Campus & Batch Noticeboard */}
          <div
            style={{
              background: 'var(--lms-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 18,
              padding: 22,
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Bell size={18} className="text-amber-400" />
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
                  Campus & Batch Noticeboard
                </h3>
              </div>
              <Link
                to={ROUTES.NOTIFICATIONS}
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--color-primary-400, #60a5fa)',
                  textDecoration: 'none',
                }}
              >
                Notifications Center
              </Link>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {announcements.map((item) => (
                <div
                  key={item.id}
                  style={{
                    background: 'var(--surface-medium)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 12,
                    padding: '14px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: 4,
                        fontSize: 10,
                        fontWeight: 700,
                        background: item.tagBg,
                        color: item.tagColor,
                      }}
                    >
                      {item.tag}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {item.date}
                    </span>
                  </div>
                  <h4 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                    {item.title}
                  </h4>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {item.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Gamification Badges & Quick Study Toolkit */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* LeetCode Skill Badges & Category Standings */}
          <div
            style={{
              background: 'var(--lms-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 18,
              padding: 22,
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Trophy size={18} className="text-yellow-400" />
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
                  Skill Badges &amp; Category Standings
                </h3>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b' }}>
                LeetCode Honors
              </span>
            </div>

            {/* Badges Display Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {LEETCODE_BADGES.slice(0, 4).map((b) => (
                <div
                  key={b.id}
                  onClick={() => setSelectedBadge(b)}
                  style={{
                    background: 'var(--surface-medium)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 12,
                    padding: '10px 12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                    cursor: 'pointer',
                    transition: 'transform 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = 'none')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <LeetCodeBadge badge={b} size="xs" interactive={false} />
                    <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)' }}>
                      {b.tier.label}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.3 }}>
                    {b.criteria}
                  </p>
                </div>
              ))}
            </div>

            {/* Category Standing Progress Mini-Bars */}
            <div
              style={{
                background: 'var(--surface-dark, rgba(0,0,0,0.2))',
                borderRadius: 12,
                padding: 12,
                border: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase' }}>
                Category Skill Percentile
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>💻 Algorithms &amp; Coding</span>
                  <strong style={{ color: '#a855f7' }}>Top 12% (Knight)</strong>
                </div>
                <div style={{ height: 5, borderRadius: 99, background: 'var(--border-color)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: '88%', background: '#a855f7', borderRadius: 99 }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>🗄️ Database &amp; SQL</span>
                  <strong style={{ color: '#3b82f6' }}>Top 15% (Grandmaster)</strong>
                </div>
                <div style={{ height: 5, borderRadius: 99, background: 'var(--border-color)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: '85%', background: '#3b82f6', borderRadius: 99 }} />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Study Toolkit (Cheatsheets & References) */}
          <div
            style={{
              background: 'var(--lms-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 18,
              padding: 22,
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Download size={18} className="text-blue-400" />
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
                  Study Toolkit & Guides
                </h3>
              </div>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                Offline Reference
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {toolkitResources.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '16px 8px', color: 'var(--text-muted)', fontSize: 12 }}>
                  No campus guides uploaded yet.
                </div>
              ) : (
                <>
                  {toolkitResources.slice(0, 5).map((guide) => {
                    const isNew = guide.createdAt && (Date.now() - new Date(guide.createdAt).getTime() < 7 * 24 * 3600 * 1000);
                    const fileTypeUpper = (guide.fileType || 'PDF').toUpperCase();
                    const badgeColor =
                      fileTypeUpper === 'DOCX' || fileTypeUpper === 'DOC'
                        ? { bg: 'rgba(59, 130, 246, 0.15)', text: '#60a5fa', border: 'rgba(59, 130, 246, 0.3)' }
                        : fileTypeUpper === 'ZIP' || fileTypeUpper === 'RAR'
                        ? { bg: 'rgba(16, 185, 129, 0.15)', text: '#34d399', border: 'rgba(16, 185, 129, 0.3)' }
                        : { bg: 'rgba(239, 68, 68, 0.15)', text: '#f87171', border: 'rgba(239, 68, 68, 0.3)' };

                    return (
                      <div
                        key={guide.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 14px',
                          borderRadius: 10,
                          background: 'var(--surface-medium)',
                          border: '1px solid var(--border-color)',
                          gap: 10,
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span
                              style={{
                                fontSize: 9,
                                fontWeight: 800,
                                padding: '1px 5px',
                                borderRadius: 4,
                                background: badgeColor.bg,
                                color: badgeColor.text,
                                border: `1px solid ${badgeColor.border}`,
                                letterSpacing: '0.5px',
                              }}
                            >
                              {fileTypeUpper}
                            </span>
                            <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {guide.title}
                            </p>
                            {isNew && (
                              <span
                                style={{
                                  fontSize: 9,
                                  fontWeight: 800,
                                  padding: '1px 5px',
                                  borderRadius: 99,
                                  background: 'rgba(249, 115, 22, 0.2)',
                                  color: '#fb923c',
                                  border: '1px solid rgba(249, 115, 22, 0.4)',
                                  letterSpacing: '0.4px',
                                }}
                              >
                                NEW
                              </span>
                            )}
                          </div>
                          <p style={{ margin: 0, fontSize: 10, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {guide.description || `${guide.fileSize || 'Reference Guide'} • by ${guide.authorRole || 'Faculty'}`}
                          </p>
                        </div>
                        <button
                          onClick={() => resourceService.downloadFile(guide)}
                          title={`Download ${guide.title}`}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '6px 12px',
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: 'pointer',
                            background: 'var(--surface-light, #27272a)',
                            border: '1px solid var(--border-color)',
                            color: 'var(--text-primary)',
                            whiteSpace: 'nowrap',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <Download size={12} />
                          Get
                        </button>
                      </div>
                    );
                  })}

                  {toolkitResources.length > 0 && (
                    <button
                      onClick={() => setShowAllGuidesModal(true)}
                      style={{
                        marginTop: 4,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        padding: '9px 12px',
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                        background: 'rgba(59, 130, 246, 0.08)',
                        border: '1px solid rgba(59, 130, 246, 0.2)',
                        color: '#60a5fa',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      View All {toolkitResources.length} Study Guides & Kits
                      <ChevronRight size={14} />
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* ── All Guides & Toolkits Modal ── */}
          {showAllGuidesModal && (
            <div
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 9999,
                background: 'rgba(0, 0, 0, 0.75)',
                backdropFilter: 'blur(6px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 16,
              }}
              onClick={() => setShowAllGuidesModal(false)}
            >
              <div
                style={{
                  background: '#12131a',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: 20,
                  width: '100%',
                  maxWidth: 680,
                  maxHeight: '85vh',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7)',
                  overflow: 'hidden',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div
                  style={{
                    padding: '20px 24px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        background: 'rgba(59, 130, 246, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#60a5fa',
                      }}
                    >
                      <Download size={18} />
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#fff' }}>
                        Campus Study Toolkits & Reference Guides
                      </h3>
                      <p style={{ margin: 0, fontSize: 12, color: '#94a3b8' }}>
                        {toolkitResources.length} official offline resources published for all students
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAllGuidesModal(false)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      padding: 6,
                      borderRadius: 8,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Modal Controls (Search & Categories) */}
                <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 12, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  {/* Search Bar */}
                  <div style={{ position: 'relative', width: '100%' }}>
                    <Search
                      size={16}
                      style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }}
                    />
                    <input
                      type="text"
                      value={toolkitSearch}
                      onChange={(e) => setToolkitSearch(e.target.value)}
                      placeholder="Search guides, topics, keywords..."
                      style={{
                        width: '100%',
                        padding: '10px 14px 10px 38px',
                        borderRadius: 10,
                        background: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: '#fff',
                        fontSize: 13,
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  {/* Category Filter Pills */}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {[
                      { key: 'ALL', label: 'All Resources' },
                      { key: 'CHEATSHEET', label: 'Cheatsheets' },
                      { key: 'ACADEMIC_GUIDE', label: 'Academic Guides' },
                      { key: 'POLICY_EXAM', label: 'Policies' },
                      { key: 'SOFTWARE_KIT', label: 'Software Kits' },
                    ].map((cat) => (
                      <button
                        key={cat.key}
                        onClick={() => setToolkitCategoryFilter(cat.key)}
                        style={{
                          padding: '5px 12px',
                          borderRadius: 8,
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: 'pointer',
                          border: toolkitCategoryFilter === cat.key ? '1px solid #3b82f6' : '1px solid rgba(255,255,255,0.08)',
                          background: toolkitCategoryFilter === cat.key ? '#2563eb' : 'rgba(255,255,255,0.03)',
                          color: toolkitCategoryFilter === cat.key ? '#fff' : '#94a3b8',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Modal Resource List */}
                <div style={{ padding: '16px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
                  {filteredModalGuides.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '36px 12px', color: '#64748b' }}>
                      No study guides match your query.
                    </div>
                  ) : (
                    filteredModalGuides.map((guide) => {
                      const isNew = guide.createdAt && (Date.now() - new Date(guide.createdAt).getTime() < 7 * 24 * 3600 * 1000);
                      const fileTypeUpper = (guide.fileType || 'PDF').toUpperCase();
                      const badgeColor =
                        fileTypeUpper === 'DOCX' || fileTypeUpper === 'DOC'
                          ? { bg: 'rgba(59, 130, 246, 0.15)', text: '#60a5fa', border: 'rgba(59, 130, 246, 0.3)' }
                          : fileTypeUpper === 'ZIP' || fileTypeUpper === 'RAR'
                          ? { bg: 'rgba(16, 185, 129, 0.15)', text: '#34d399', border: 'rgba(16, 185, 129, 0.3)' }
                          : { bg: 'rgba(239, 68, 68, 0.15)', text: '#f87171', border: 'rgba(239, 68, 68, 0.3)' };

                      return (
                        <div
                          key={guide.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '14px 16px',
                            borderRadius: 12,
                            background: 'rgba(255, 255, 255, 0.02)',
                            border: '1px solid rgba(255, 255, 255, 0.06)',
                            gap: 14,
                          }}
                        >
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                              <span
                                style={{
                                  fontSize: 10,
                                  fontWeight: 800,
                                  padding: '2px 7px',
                                  borderRadius: 5,
                                  background: badgeColor.bg,
                                  color: badgeColor.text,
                                  border: `1px solid ${badgeColor.border}`,
                                }}
                              >
                                {fileTypeUpper}
                              </span>
                              <h4 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#fff' }}>
                                {guide.title}
                              </h4>
                              {isNew && (
                                <span
                                  style={{
                                    fontSize: 9,
                                    fontWeight: 800,
                                    padding: '1px 6px',
                                    borderRadius: 99,
                                    background: 'rgba(249, 115, 22, 0.2)',
                                    color: '#fb923c',
                                    border: '1px solid rgba(249, 115, 22, 0.4)',
                                  }}
                                >
                                  NEW
                                </span>
                              )}
                            </div>
                            <p style={{ margin: '0 0 6px', fontSize: 12, color: '#94a3b8', lineHeight: 1.4 }}>
                              {guide.description || 'Supplementary institutional learning toolkit.'}
                            </p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 11, color: '#64748b' }}>
                              <span>{guide.fileSize || 'Unknown size'}</span>
                              <span>•</span>
                              <span>Published by {guide.author || guide.authorName || 'Faculty'} ({guide.authorRole || 'Admin'})</span>
                              {guide.downloadsCount > 0 && (
                                <>
                                  <span>•</span>
                                  <span>{guide.downloadsCount} downloads</span>
                                </>
                              )}
                            </div>
                          </div>

                          <button
                            onClick={() => resourceService.downloadFile(guide)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                              padding: '8px 14px',
                              borderRadius: 8,
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: 'pointer',
                              border: 'none',
                              background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
                              color: '#fff',
                              whiteSpace: 'nowrap',
                              boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)',
                            }}
                          >
                            <Download size={13} />
                            Download
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Badge Lore & Criteria Modal */}
      {selectedBadge && (
        <BadgeDetailModal
          badge={selectedBadge}
          onClose={() => setSelectedBadge(null)}
        />
      )}
    </div>
  );
};

export default StudentDashboardPage;
