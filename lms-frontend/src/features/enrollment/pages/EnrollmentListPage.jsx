import { useState, useMemo, useCallback } from 'react';
import {
  CheckSquare, Globe, Users, UserCheck, BookOpen, FileCheck2,
  ArrowRight, Filter, CheckCircle2, XCircle, UserPlus,
  UserMinus, RefreshCw, GraduationCap, LayoutDashboard, Search, ChevronDown,
  Target, ArrowLeftRight, X, Layers
} from 'lucide-react';
import { useAdminEnrollments, useCreateAdminEnrollment, useUpdateAdminEnrollmentStatus } from '../hooks/useEnrollments';
import { useCourses } from '../../courses/hooks/useCourses';
import { useAdminAssessments } from '../../assessments/hooks/useAdminAssessments';
import { useUsers } from '../../users/hooks/useUsers';
import { courseService } from '../../courses/services/courseService';
import { useToast } from '../../../components/feedback/Toast';
import { AdminModal } from '../../../components/ui/AdminModal';

/* ─── Design tokens matching Roles List page ──────────────────────── */
const T = {
  card:        'var(--surface-dark)',
  bg:          'var(--bg)',
  surface:     'var(--surface-medium)',
  surfaceAlt:  'var(--surface-light-alt)',
  textMain:    'var(--text-primary)',
  textSub:     'var(--text-secondary)',
  textMuted:   'var(--text-muted)',
  border:      'var(--border-color)',
  borderSub:   'var(--border-subtle)',
  hover:       'var(--hover-bg)',
  active:      'var(--active-bg)',
  shadow:      'var(--shadow-dark)',
  input:       'var(--input-bg)',
  primary:     'var(--color-primary-500, #3b6fe0)',
  primaryFg:   'var(--lms-primary-foreground, #fff)',
  success:     '#28c76f',
  danger:      '#ea5455',
  warning:     '#ff9f43',
  info:        '#00cfe8',
  purple:      '#7c3aed',
  teal:        '#0d9488',
  radius:      8,
  cardShadow:  '0 2px 10px 0 rgba(0,0,0,0.1)',
};

/* ─── Badge color per status ──────────────────────────────────────── */
const STATUS_COLORS = {
  ACTIVE:       { bg: 'rgba(40,199,111,0.15)', color: T.success },
  NOT_ENROLLED: { bg: 'var(--surface-medium)',  color: 'var(--text-muted)' },
  INACTIVE:     { bg: 'rgba(234,84,85,0.15)',   color: T.danger },
  ASSIGNED:     { bg: 'rgba(40,199,111,0.15)',   color: T.success },
  UNASSIGNED:   { bg: 'var(--surface-medium)',   color: 'var(--text-muted)' },
  EVALUATOR:    { bg: 'rgba(0,207,232,0.15)',    color: T.info },
};

function StatusPill({ status }) {
  const c = STATUS_COLORS[status] ?? STATUS_COLORS.NOT_ENROLLED;
  return (
    <span style={{
      background: c.bg, color: c.color,
      padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600,
    }}>
      {status.replace('_', ' ')}
    </span>
  );
}

/* ─── Avatar with deterministic color ─────────────────────────────── */
const AVATAR_PALETTE = [
  { bg: '#7367f0', text: '#fff' },
  { bg: '#ea5455', text: '#fff' },
  { bg: '#28c76f', text: '#fff' },
  { bg: '#ff9f43', text: '#fff' },
  { bg: '#00cfe8', text: '#fff' },
  { bg: '#a8aaae', text: '#fff' },
];

function avatarColor(str = '') {
  const h = str.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_PALETTE[h % AVATAR_PALETTE.length];
}

function initials(name = '') {
  return name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('') || '?';
}

/* ─── Stat colors ─────────────────────────────────────────────────── */
const STAT_THEMES = {
  primary: { bar: T.primary, badge: { bg: 'rgba(59,111,224,0.15)', color: T.primary } },
  success: { bar: T.success, badge: { bg: 'rgba(40,199,111,0.15)', color: T.success } },
  danger:  { bar: T.danger,  badge: { bg: 'rgba(234,84,85,0.15)',  color: T.danger } },
  purple:  { bar: T.purple,  badge: { bg: 'rgba(124,58,237,0.15)', color: T.purple } },
  teal:    { bar: T.teal,    badge: { bg: 'rgba(13,148,136,0.15)', color: T.teal } },
};

/* ─── MAIN PAGE ───────────────────────────────────────────────────── */
export const EnrollmentListPage = () => {
  const { success, error: toastError } = useToast();

  const [topTab, setTopTab]               = useState('COURSES');
  const [subTab, setSubTab]               = useState('STUDENTS');
  const [statusFilter, setStatusFilter]   = useState('ALL');
  const [selectedCourseId, setSelectedCourseId]       = useState('');
  const [selectedAssessmentId, setSelectedAssessmentId] = useState('');
  const [targetModalOpen, setTargetModalOpen]         = useState(false);
  const [targetSearchQuery, setTargetSearchQuery]     = useState('');
  const [selectionMode, setSelectionMode] = useState('PARTICULAR');
  const [selectedUserIds, setSelectedUserIds]         = useState([]);
  const [searchQuery, setSearchQuery]     = useState('');
  const [isAssigning, setIsAssigning]     = useState(false);
  const [page, setPage]                   = useState(0);
  const [size]                            = useState(20);

  // ── Data Queries ──
  const { data: enrollmentsData, isLoading: loadingEnrollments, refetch: refetchEnrollments } =
    useAdminEnrollments({ page, size });
  const { data: coursesData, isLoading: loadingCourses, refetch: refetchCourses } =
    useCourses({ size: 100 });
  const { data: assessmentsData, isLoading: loadingAssessments } =
    useAdminAssessments({ size: 100 });
  const { data: usersData, isLoading: loadingUsers } =
    useUsers({ size: 100 });

  const createEnrollment = useCreateAdminEnrollment();
  const updateStatus = useUpdateAdminEnrollmentStatus();

  const extract = (d) => {
    if (!d) return [];
    if (Array.isArray(d)) return d;
    return d.content || d.data?.content || [];
  };

  const rawEnrollments = useMemo(() => extract(enrollmentsData), [enrollmentsData]);
  const courses         = useMemo(() => extract(coursesData),    [coursesData]);
  const assessments     = useMemo(() => extract(assessmentsData),[assessmentsData]);
  const rawUsers        = useMemo(() => extract(usersData),      [usersData]);

  const activeCourse = useMemo(() =>
    courses.find(c => c.id === selectedCourseId),
    [courses, selectedCourseId]);

  const activeAssessment = useMemo(() =>
    assessments.find(a => a.id === selectedAssessmentId),
    [assessments, selectedAssessmentId]);

  const activeTarget = topTab === 'COURSES' ? activeCourse : activeAssessment;

  const targetEnrolledCount = useMemo(() => {
    if (!selectedCourseId) return 0;
    return rawEnrollments.filter(e => e.course?.id === selectedCourseId && e.status !== 'INACTIVE').length;
  }, [rawEnrollments, selectedCourseId]);

  const students = useMemo(() =>
    rawUsers.filter(u => u.roles?.includes('STUDENT') || (!u.roles?.includes('INSTRUCTOR') && !u.roles?.includes('ADMIN'))),
    [rawUsers]);

  const instructors = useMemo(() =>
    rawUsers.filter(u => u.roles?.includes('INSTRUCTOR') || u.roles?.includes('ADMIN')),
    [rawUsers]);

  const targetInstructor = useMemo(() => {
    if (!activeCourse?.instructorId) return null;
    return instructors.find(i => i.id === activeCourse.instructorId);
  }, [activeCourse, instructors]);

  const filteredModalTargets = useMemo(() => {
    const list = topTab === 'COURSES' ? courses : assessments;
    if (!targetSearchQuery.trim()) return list;
    const q = targetSearchQuery.toLowerCase();
    return list.filter(item =>
      (item.title || '').toLowerCase().includes(q) ||
      (item.description || '').toLowerCase().includes(q) ||
      (item.instructorName || '').toLowerCase().includes(q)
    );
  }, [topTab, courses, assessments, targetSearchQuery]);

  const activeTargetList = subTab === 'STUDENTS' ? students : instructors;

  const fmt = (d) => {
    if (!d) return '—';
    try {
      const date = new Date(d);
      return Number.isNaN(date.getTime())
        ? '—'
        : new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }).format(date);
    }
    catch { return '—'; }
  };

  const toggleUser = useCallback((id) =>
    setSelectedUserIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]), []);

  const handleSelectAll = useCallback((checked, list) =>
    setSelectedUserIds(checked ? list.map(u => u.id) : []), []);

  const switchTopTab = (t) => { setTopTab(t); setSelectedUserIds([]); setStatusFilter('ALL'); };
  const switchSubTab = (t) => { setSubTab(t); setSelectedUserIds([]); setStatusFilter('ALL'); };

  const enrolledStudentIds = useMemo(() =>
    new Set(rawEnrollments.filter(e => selectedCourseId ? e.course?.id === selectedCourseId : true).map(e => e.student?.id)),
    [rawEnrollments, selectedCourseId]);

  const assignedInstructorIds = useMemo(() =>
    new Set(courses.filter(c => selectedCourseId ? c.id === selectedCourseId : true).map(c => c.instructorId).filter(Boolean)),
    [courses, selectedCourseId]);

  // ── Actions ──
  const handleApplyChanges = async () => {
    setIsAssigning(true);
    try {
      if (topTab === 'COURSES') {
        if (!selectedCourseId) { toastError('Please select a target course.'); return; }
        if (subTab === 'STUDENTS') {
          const ids = selectionMode === 'ALL' ? students.map(s => s.id) : selectedUserIds;
          if (!ids.length) { toastError('Select at least one student.'); return; }
          for (const uid of ids) await createEnrollment.mutateAsync({ studentId: uid, courseId: selectedCourseId });
          success(`Enrolled ${ids.length} student(s) successfully!`);
          setSelectedUserIds([]); setStatusFilter('ENROLLED'); refetchEnrollments();
        } else {
          const ids = selectionMode === 'ALL' ? instructors.map(i => i.id) : selectedUserIds;
          if (!ids.length) { toastError('Select at least one instructor.'); return; }
          await courseService.update(selectedCourseId, { instructorId: ids[0] });
          const inst = instructors.find(i => i.id === ids[0]);
          success(`Assigned ${inst?.fullName || inst?.name || 'Instructor'} to course!`);
          setSelectedUserIds([]); refetchCourses();
        }
      } else {
        if (!selectedAssessmentId) { toastError('Please select a target assessment.'); return; }
        const ids = selectionMode === 'ALL' ? (subTab === 'STUDENTS' ? students : instructors).map(u => u.id) : selectedUserIds;
        if (!ids.length) { toastError(`Select at least one ${subTab === 'STUDENTS' ? 'student' : 'instructor'}.`); return; }
        success(`Assigned ${ids.length} ${subTab.toLowerCase()} to assessment!`);
        setSelectedUserIds([]);
      }
    } catch (err) { toastError(err?.message || 'Operation failed'); }
    finally { setIsAssigning(false); }
  };

  const handleRevoke = async () => {
    if (!selectedUserIds.length) { toastError('Select at least one student to revoke.'); return; }
    setIsAssigning(true);
    try {
      const affected = rawEnrollments.filter(e =>
        selectedUserIds.includes(e.student?.id) && (!selectedCourseId || e.course?.id === selectedCourseId));
      for (const e of affected) await updateStatus.mutateAsync({ id: e.id, status: 'INACTIVE' });
      success(`Revoked ${affected.length} enrollment(s).`);
      setSelectedUserIds([]); refetchEnrollments();
    } catch (err) { toastError(err?.message || 'Revoke failed'); }
    finally { setIsAssigning(false); }
  };

  // ── Row Data ──
  const searchFilter = (u) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (u.fullName || u.name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q);
  };

  const courseStudentRows = useMemo(() =>
    students.filter(searchFilter).map(s => {
      const e = rawEnrollments.find(e => e.student?.id === s.id && (!selectedCourseId || e.course?.id === selectedCourseId));
      return { id: s.id, name: s.fullName || s.name || s.email, email: s.email,
        courseTitle: e?.course?.title || (selectedCourseId ? courses.find(c => c.id === selectedCourseId)?.title : '—'),
        status: e?.status || 'NOT_ENROLLED', isEnrolled: Boolean(e && e.status !== 'INACTIVE'), enrolledAt: e?.enrolledAt };
    }).filter(r => statusFilter === 'ENROLLED' ? r.isEnrolled : statusFilter === 'UNENROLLED' ? !r.isEnrolled : true),
  [students, rawEnrollments, selectedCourseId, courses, searchQuery, statusFilter]);

  const courseInstructorRows = useMemo(() =>
    instructors.filter(searchFilter).map(i => {
      const owned = courses.filter(c => c.instructorId === i.id);
      const isAssigned = selectedCourseId ? owned.some(c => c.id === selectedCourseId) : owned.length > 0;
      return { id: i.id, name: i.fullName || i.name || i.email, email: i.email,
        courses: owned.map(c => c.title).join(', ') || '—',
        status: isAssigned ? 'ASSIGNED' : 'UNASSIGNED', isAssigned, since: i.createdAt };
    }).filter(r => statusFilter === 'ENROLLED' ? r.isAssigned : statusFilter === 'UNENROLLED' ? !r.isAssigned : true),
  [instructors, courses, selectedCourseId, searchQuery, statusFilter]);

  const assessmentStudentRows = useMemo(() =>
    students.filter(searchFilter).map(s => {
      const a = assessments.find(x => x.id === selectedAssessmentId);
      return { id: s.id, name: s.fullName || s.name || s.email, email: s.email,
        assessmentTitle: a?.title || 'All Assessments', totalMarks: a?.totalMarks || '—',
        status: 'ASSIGNED', isAssigned: true };
    }).filter(r => statusFilter === 'UNENROLLED' ? !r.isAssigned : true),
  [students, assessments, selectedAssessmentId, searchQuery, statusFilter]);

  const assessmentInstructorRows = useMemo(() =>
    instructors.filter(searchFilter).map(i => {
      const a = assessments.find(x => x.id === selectedAssessmentId);
      return { id: i.id, name: i.fullName || i.name || i.email, email: i.email,
        assessmentTitle: a?.title || 'All Assessments', status: 'EVALUATOR', isAssigned: true, since: i.createdAt };
    }).filter(r => statusFilter === 'UNENROLLED' ? !r.isAssigned : true),
  [instructors, assessments, selectedAssessmentId, searchQuery, statusFilter]);

  // ── Active data ──
  let activeRows = [];
  let tableHeaders = [];

  if (topTab === 'COURSES' && subTab === 'STUDENTS') {
    activeRows = courseStudentRows;
    tableHeaders = ['', 'STUDENT', 'TARGET COURSE', 'STATUS', 'ENROLLED ON'];
  } else if (topTab === 'COURSES' && subTab === 'INSTRUCTORS') {
    activeRows = courseInstructorRows;
    tableHeaders = ['', 'INSTRUCTOR', 'ASSIGNED COURSE(S)', 'STATUS', 'MEMBER SINCE'];
  } else if (topTab === 'ASSESSMENTS' && subTab === 'STUDENTS') {
    activeRows = assessmentStudentRows;
    tableHeaders = ['', 'STUDENT', 'ASSESSMENT', 'MARKS', 'STATUS'];
  } else {
    activeRows = assessmentInstructorRows;
    tableHeaders = ['', 'INSTRUCTOR', 'ASSESSMENT', 'ROLE', 'MEMBER SINCE'];
  }

  const isLoadingData = loadingUsers || loadingCourses || loadingAssessments || loadingEnrollments || isAssigning;
  const totalStudents    = students.length;
  const totalInstructors = instructors.length;
  const enrolledCount    = students.filter(s => enrolledStudentIds.has(s.id)).length;
  const assignedCount    = instructors.filter(i => assignedInstructorIds.has(i.id)).length;

  const actionLabel = useMemo(() => {
    if (topTab === 'COURSES' && subTab === 'STUDENTS')      return 'Enroll Students';
    if (topTab === 'COURSES' && subTab === 'INSTRUCTORS')   return 'Assign Instructor';
    if (topTab === 'ASSESSMENTS' && subTab === 'STUDENTS')  return 'Assign Students';
    return 'Assign Evaluator';
  }, [topTab, subTab]);

  const showRevoke = topTab === 'COURSES' && subTab === 'STUDENTS';
  const allSelected = activeRows.length > 0 && activeRows.every(r => selectedUserIds.includes(r.id));

  // ── Shared inline styles ──
  const inputStyle = {
    paddingLeft: 32, paddingRight: 12, paddingTop: 7, paddingBottom: 7,
    fontSize: 13, border: `1px solid ${T.border}`, borderRadius: 6,
    outline: 'none', color: T.textMain, background: T.input, width: '100%',
  };

  

  const pillBtn = (isActive) => ({
    display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px',
    fontSize: 12, fontWeight: 700, border: 'none', borderRadius: 6,
    cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap',
    background: isActive ? T.primary : 'transparent',
    color: isActive ? T.primaryFg : T.textMuted,
  });

  const filterBtn = (isActive, variant) => {
    const colors = {
      all:        { bg: T.primary, color: T.primaryFg },
      enrolled:   { bg: T.success, color: '#fff' },
      unenrolled: { bg: T.danger,  color: '#fff' },
    };
    const c = colors[variant] || colors.all;
    return {
      display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px',
      fontSize: 12, fontWeight: 700, border: 'none', borderRadius: 6,
      cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap',
      background: isActive ? c.bg : 'transparent',
      color: isActive ? c.color : T.textMuted,
    };
  };

  // ── Render table cell content ──
  const renderUserCell = (row) => {
    const ac = avatarColor(row.name);
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
          background: ac.bg, color: ac.text, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 700, border: `2px solid ${T.card}`,
        }}>
          {initials(row.name)}
        </div>
        <div>
          <p style={{ fontSize: 14, fontWeight: 600, color: T.textMain, margin: 0 }}>{row.name}</p>
          <p style={{ fontSize: 12, color: T.textMuted, margin: 0 }}>{row.email}</p>
        </div>
      </div>
    );
  };

  const renderRowCells = (row) => {
    if (topTab === 'COURSES' && subTab === 'STUDENTS') return [
      renderUserCell(row),
      <span style={{ fontSize: 13, color: T.textSub }}>{row.courseTitle}</span>,
      <StatusPill status={row.status} />,
      <span style={{ fontSize: 13, color: T.textMuted }}>{fmt(row.enrolledAt)}</span>,
    ];
    if (topTab === 'COURSES' && subTab === 'INSTRUCTORS') return [
      renderUserCell(row),
      <span style={{ fontSize: 13, color: T.textSub }}>{row.courses}</span>,
      <StatusPill status={row.status} />,
      <span style={{ fontSize: 13, color: T.textMuted }}>{fmt(row.since)}</span>,
    ];
    if (topTab === 'ASSESSMENTS' && subTab === 'STUDENTS') return [
      renderUserCell(row),
      <span style={{ fontSize: 13, color: T.textSub }}>{row.assessmentTitle}</span>,
      <span style={{ fontSize: 13, fontWeight: 700, color: T.primary }}>{row.totalMarks}</span>,
      <StatusPill status={row.status} />,
    ];
    return [
      renderUserCell(row),
      <span style={{ fontSize: 13, color: T.textSub }}>{row.assessmentTitle}</span>,
      <StatusPill status={row.status} />,
      <span style={{ fontSize: 13, color: T.textMuted }}>{fmt(row.since)}</span>,
    ];
  };

  // ── Render ──
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Page Header */}
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: T.textMain, margin: 0 }}>Enrollments & Assignments</h1>
        <p style={{ fontSize: 14, color: T.textMuted, margin: '6px 0 0' }}>
          Manage student enrollments and instructor course & assessment assignments.
        </p>
      </div>

      {/* Stat Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16 }}>
        {[
          { label: 'Total Students',    count: totalStudents,                 total: rawUsers.length,   theme: 'primary' },
          { label: 'Enrolled Students', count: enrolledCount,                 total: totalStudents,     theme: 'success' },
          { label: 'Not Enrolled',      count: totalStudents - enrolledCount, total: totalStudents,     theme: 'danger' },
          { label: 'Total Instructors', count: totalInstructors,              total: rawUsers.length,   theme: 'purple' },
          { label: 'Assigned',          count: assignedCount,                 total: totalInstructors,  theme: 'teal' },
        ].map((stat, i) => {
          const pct = stat.total > 0 ? Math.round((stat.count / stat.total) * 100) : 0;
          const st = STAT_THEMES[stat.theme];
          return (
            <div key={i} style={{
              background: T.card, borderRadius: T.radius, boxShadow: T.cardShadow,
              padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 8,
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = T.shadow; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = T.cardShadow; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: T.textMuted }}>{stat.label}</span>
                <span style={{ fontSize: 10, fontWeight: 800, padding: '1px 8px', borderRadius: 999, background: st.badge.bg, color: st.badge.color }}>{pct}%</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <span style={{ fontSize: 24, fontWeight: 900, color: T.textMain }}>{stat.count}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: T.textMuted }}>/ {stat.total}</span>
              </div>
              <div style={{ height: 5, borderRadius: 999, background: T.surface, overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: 999, background: st.bar, width: `${pct}%`, transition: 'width 0.6s ease' }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Content Card */}
      <div style={{ background: T.card, borderRadius: T.radius, boxShadow: T.cardShadow, overflow: 'hidden' }}>

        {/* Top Tabs: Course vs Assessment */}
        <div style={{ display: 'flex', borderBottom: `1px solid ${T.border}` }}>
          {[
            { key: 'COURSES',     icon: <BookOpen size={15} />,   label: 'Course Management' },
            { key: 'ASSESSMENTS', icon: <FileCheck2 size={15} />, label: 'Assessment Management' },
          ].map(t => (
            <button key={t.key} onClick={() => switchTopTab(t.key)} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '14px 24px',
              fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer',
              transition: 'all 0.15s', background: 'none',
              color: topTab === t.key ? T.primary : T.textMuted,
              borderBottom: topTab === t.key ? `2px solid ${T.primary}` : '2px solid transparent',
            }}
              onMouseEnter={e => { if (topTab !== t.key) e.currentTarget.style.background = T.hover; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
            >
              {t.icon}{t.label}
            </button>
          ))}
        </div>

        {/* Sub Tabs + Selection Scope */}
        <div style={{ padding: '16px 24px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12, borderBottom: `1px solid ${T.border}` }}>
          {/* Students / Instructors pills */}
          <div style={{ display: 'flex', gap: 3, padding: 3, background: T.surface, borderRadius: 8 }}>
            {[
              { key: 'STUDENTS',    icon: <GraduationCap size={14} />, label: `Students (${students.length})` },
              { key: 'INSTRUCTORS', icon: <UserCheck size={14} />,     label: `Instructors (${instructors.length})` },
            ].map(t => (
              <button key={t.key} onClick={() => switchSubTab(t.key)} style={pillBtn(subTab === t.key)}
                onMouseEnter={e => { if (subTab !== t.key) e.currentTarget.style.background = T.hover; }}
                onMouseLeave={e => { if (subTab !== t.key) e.currentTarget.style.background = 'transparent'; }}
              >
                {t.icon}{t.label}
              </button>
            ))}
          </div>
          {/* Particular / All pills */}
          <div style={{ display: 'flex', gap: 3, padding: 3, background: T.surface, borderRadius: 8 }}>
            {[
              { key: 'PARTICULAR', icon: <CheckSquare size={13} />, label: `Selected Members (${selectedUserIds.length})` },
              { key: 'ALL',        icon: <Globe size={13} />,       label: `All Members (${activeTargetList.length})` },
            ].map(m => (
              <button key={m.key} onClick={() => setSelectionMode(m.key)} style={pillBtn(selectionMode === m.key)}
                onMouseEnter={e => { if (selectionMode !== m.key) e.currentTarget.style.background = T.hover; }}
                onMouseLeave={e => { if (selectionMode !== m.key) e.currentTarget.style.background = 'transparent'; }}
              >
                {m.icon}{m.label}
              </button>
            ))}
          </div>
        </div>

        {/* ─── Target Spotlight Banner (Option 2) ────────────────── */}
        <div style={{ padding: '16px 24px', borderBottom: `1px solid ${T.border}`, background: 'rgba(255, 255, 255, 0.01)' }}>
          {activeTarget ? (
            /* Active Target Card */
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 16,
                padding: '16px 20px',
                borderRadius: 10,
                background: 'linear-gradient(135deg, rgba(115, 103, 240, 0.12) 0%, rgba(115, 103, 240, 0.03) 100%)',
                border: '1px solid rgba(115, 103, 240, 0.3)',
                boxShadow: '0 4px 20px rgba(115, 103, 240, 0.08)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: 'rgba(115, 103, 240, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: T.primary,
                    flexShrink: 0,
                    boxShadow: '0 0 16px rgba(115, 103, 240, 0.25)',
                  }}
                >
                  {topTab === 'COURSES' ? <BookOpen size={24} /> : <FileCheck2 size={24} />}
                </div>

                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        fontSize: 10,
                        fontWeight: 800,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        padding: '2px 8px',
                        borderRadius: 99,
                        background: 'rgba(115, 103, 240, 0.2)',
                        color: T.primary,
                      }}
                    >
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: T.primary }} />
                      Active Target {topTab === 'COURSES' ? 'Course' : 'Assessment'}
                    </span>
                    {activeCourse?.status && (
                      <span style={{ fontSize: 11, fontWeight: 600, color: T.textMuted }}>
                        • {activeCourse.status}
                      </span>
                    )}
                  </div>

                  <h3
                    style={{
                      margin: 0,
                      fontSize: 17,
                      fontWeight: 700,
                      color: T.textMain,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {activeTarget.title}
                  </h3>

                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16, marginTop: 6, fontSize: 12, color: T.textMuted }}>
                    {topTab === 'COURSES' ? (
                      <>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <Users size={13} color={T.primary} />
                          <strong style={{ color: T.textMain }}>{targetEnrolledCount}</strong> enrolled student{targetEnrolledCount === 1 ? '' : 's'}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <UserCheck size={13} color={T.success} />
                          Instructor: <strong style={{ color: T.textMain }}>{targetInstructor?.fullName || targetInstructor?.name || activeCourse?.instructorName || 'Unassigned'}</strong>
                        </span>
                      </>
                    ) : (
                      <>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <CheckCircle2 size={13} color={T.teal} />
                          Total Marks: <strong style={{ color: T.textMain }}>{activeAssessment?.totalMarks ?? '—'}</strong>
                        </span>
                        {activeAssessment?.durationMinutes && (
                          <span>
                            Duration: <strong style={{ color: T.textMain }}>{activeAssessment.durationMinutes} mins</strong>
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <button
                  type="button"
                  onClick={() => setTargetModalOpen(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 14px',
                    fontSize: 13,
                    fontWeight: 600,
                    borderRadius: 8,
                    background: 'rgba(115, 103, 240, 0.18)',
                    color: T.primary,
                    border: '1px solid rgba(115, 103, 240, 0.35)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(115, 103, 240, 0.28)';
                    e.currentTarget.style.borderColor = T.primary;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(115, 103, 240, 0.18)';
                    e.currentTarget.style.borderColor = 'rgba(115, 103, 240, 0.35)';
                  }}
                >
                  <ArrowLeftRight size={14} /> Switch {topTab === 'COURSES' ? 'Course' : 'Assessment'}
                </button>

                <button
                  type="button"
                  title="Clear selection to view all"
                  onClick={() => topTab === 'COURSES' ? setSelectedCourseId('') : setSelectedAssessmentId('')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 34,
                    height: 34,
                    borderRadius: 8,
                    background: T.surface,
                    color: T.textMuted,
                    border: `1px solid ${T.border}`,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.color = T.danger;
                    e.currentTarget.style.borderColor = 'rgba(234, 84, 85, 0.4)';
                    e.currentTarget.style.background = 'rgba(234, 84, 85, 0.1)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.color = T.textMuted;
                    e.currentTarget.style.borderColor = T.border;
                    e.currentTarget.style.background = T.surface;
                  }}
                >
                  <X size={15} />
                </button>
              </div>
            </div>
          ) : (
            /* Unselected Empty State Card */
            <div
              style={{
                padding: '18px 22px',
                borderRadius: 10,
                background: T.surface,
                border: `1px dashed ${T.border}`,
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 16,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 10,
                    background: 'rgba(255, 255, 255, 0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: T.textMuted,
                  }}
                >
                  <Target size={22} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: T.textMain }}>
                    No Target {topTab === 'COURSES' ? 'Course' : 'Assessment'} Selected
                  </h4>
                  <p style={{ margin: '3px 0 0', fontSize: 13, color: T.textMuted }}>
                    Select a target to view enrolled members, check status, and assign {subTab.toLowerCase()}.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                {/* Quick select chips */}
                {(topTab === 'COURSES' ? courses : assessments).slice(0, 3).map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => topTab === 'COURSES' ? setSelectedCourseId(item.id) : setSelectedAssessmentId(item.id)}
                    style={{
                      padding: '5px 10px',
                      fontSize: 12,
                      fontWeight: 500,
                      borderRadius: 6,
                      background: 'rgba(255, 255, 255, 0.04)',
                      color: T.textSub,
                      border: `1px solid ${T.border}`,
                      cursor: 'pointer',
                      maxWidth: 160,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = T.hover;
                      e.currentTarget.style.color = T.primary;
                      e.currentTarget.style.borderColor = T.primary;
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                      e.currentTarget.style.color = T.textSub;
                      e.currentTarget.style.borderColor = T.border;
                    }}
                  >
                    ⚡ {item.title}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => setTargetModalOpen(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 16px',
                    fontSize: 13,
                    fontWeight: 600,
                    borderRadius: 8,
                    background: T.primary,
                    color: '#fff',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(115, 103, 240, 0.3)',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.1)'}
                  onMouseLeave={e => e.currentTarget.style.filter = 'none'}
                >
                  <Target size={15} /> Choose Target {topTab === 'COURSES' ? 'Course' : 'Assessment'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Toolbar: dropdown + filter + search + action */}
        <div style={{ padding: '12px 24px', display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, borderBottom: `1px solid ${T.border}` }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 16, flex: 1 }}>
            {/* Target Quick Switcher Button */}
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: T.textMuted, marginBottom: 4 }}>
                {topTab === 'COURSES' ? 'Target Course' : 'Target Assessment'}
              </label>
              <button
                type="button"
                onClick={() => setTargetModalOpen(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  height: 38,
                  padding: '0 12px',
                  background: T.surface,
                  border: `1px solid ${activeTarget ? 'rgba(115, 103, 240, 0.4)' : T.border}`,
                  borderRadius: 8,
                  cursor: 'pointer',
                  color: activeTarget ? T.textMain : T.textMuted,
                  fontSize: 13,
                  fontWeight: 500,
                  maxWidth: 240,
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = T.primary}
                onMouseLeave={e => e.currentTarget.style.borderColor = activeTarget ? 'rgba(115, 103, 240, 0.4)' : T.border}
              >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, textAlign: 'left' }}>
                  {activeTarget ? activeTarget.title : `Select ${topTab === 'COURSES' ? 'Course' : 'Assessment'}...`}
                </span>
                <ChevronDown size={14} style={{ color: T.textMuted, flexShrink: 0 }} />
              </button>
            </div>

            {/* View Filter */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: T.textMuted, marginBottom: 4 }}>
                <Filter size={12} /> View Filter
              </label>
              <div style={{ display: 'flex', gap: 2, padding: 3, background: T.surface, borderRadius: 8 }}>
                {[
                  { key: 'ALL',        icon: <LayoutDashboard size={13} />, label: 'All',                                              variant: 'all' },
                  { key: 'ENROLLED',   icon: <CheckCircle2 size={13} />,   label: subTab === 'STUDENTS' ? 'Enrolled' : 'Assigned',     variant: 'enrolled' },
                  { key: 'UNENROLLED', icon: <XCircle size={13} />,        label: subTab === 'STUDENTS' ? 'Not Enrolled' : 'Unassigned',variant: 'unenrolled' },
                ].map(opt => (
                  <button key={opt.key} onClick={() => setStatusFilter(opt.key)} style={filterBtn(statusFilter === opt.key, opt.variant)}
                    onMouseEnter={e => { if (statusFilter !== opt.key) e.currentTarget.style.background = T.hover; }}
                    onMouseLeave={e => { if (statusFilter !== opt.key) e.currentTarget.style.background = 'transparent'; }}
                  >
                    {opt.icon}{opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Search */}
            <div style={{ width: 180 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: T.textMuted, marginBottom: 4 }}>
                Search
              </label>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: T.textMuted }} />
                <input
                  type="text"
                  placeholder={`Search ${subTab.toLowerCase()}...`}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={inputStyle}
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {showRevoke && (
              <button onClick={handleRevoke} disabled={isAssigning || selectedUserIds.length === 0}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px',
                  fontSize: 12, fontWeight: 700, color: T.danger,
                  border: `1px solid rgba(234,84,85,0.3)`, background: 'rgba(234,84,85,0.08)',
                  borderRadius: 6, cursor: 'pointer', transition: 'all 0.15s',
                  opacity: (isAssigning || selectedUserIds.length === 0) ? 0.4 : 1,
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(234,84,85,0.16)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(234,84,85,0.08)'}
              >
                <UserMinus size={14} /> Revoke
              </button>
            )}
            <button onClick={() => { refetchEnrollments(); refetchCourses(); }}
              style={{
                display: 'flex', alignItems: 'center', padding: '7px 10px',
                border: `1px solid ${T.border}`, background: T.surface,
                borderRadius: 6, cursor: 'pointer', color: T.textMuted, transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = T.hover; e.currentTarget.style.color = T.textMain; }}
              onMouseLeave={e => { e.currentTarget.style.background = T.surface; e.currentTarget.style.color = T.textMuted; }}
              title="Refresh data"
            >
              <RefreshCw size={14} />
            </button>
            <button onClick={handleApplyChanges} disabled={isAssigning}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '7px 18px',
                fontSize: 13, fontWeight: 700, color: T.primaryFg,
                background: T.primary, border: 'none', borderRadius: 6,
                cursor: 'pointer', transition: 'opacity 0.15s',
                opacity: isAssigning ? 0.6 : 1,
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
              onMouseLeave={e => e.currentTarget.style.opacity = isAssigning ? '0.6' : '1'}
            >
              <UserPlus size={14} /> {actionLabel} <ArrowRight size={13} />
            </button>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: T.surface }}>
                {tableHeaders.map((h, i) => (
                  <th key={i} style={{
                    padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700,
                    color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap',
                  }}>
                    {h === '' ? (
                      <input type="checkbox" checked={allSelected}
                        onChange={e => handleSelectAll(e.target.checked, activeRows)}
                        disabled={selectionMode === 'ALL'}
                        style={{ cursor: 'pointer' }}
                      />
                    ) : h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoadingData ? (
                <tr><td colSpan={tableHeaders.length} style={{ padding: '32px 16px', textAlign: 'center', color: T.textMuted, fontSize: 13 }}>Loading…</td></tr>
              ) : activeRows.length === 0 ? (
                <tr><td colSpan={tableHeaders.length} style={{ padding: '48px 16px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    {statusFilter === 'ENROLLED' ? <CheckCircle2 size={32} style={{ color: T.success, opacity: 0.5 }} /> :
                     statusFilter === 'UNENROLLED' ? <XCircle size={32} style={{ color: T.danger, opacity: 0.5 }} /> :
                     <Users size={32} style={{ color: T.textMuted, opacity: 0.5 }} />}
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: T.textMain }}>
                      {statusFilter === 'UNENROLLED' ? `All ${subTab.toLowerCase()} are enrolled!` :
                       statusFilter === 'ENROLLED' ? `No enrolled ${subTab.toLowerCase()} found` :
                       `No ${subTab.toLowerCase()} found`}
                    </p>
                    <p style={{ margin: 0, fontSize: 13, color: T.textMuted }}>
                      Try adjusting your search or selecting a different course.
                    </p>
                  </div>
                </td></tr>
              ) : activeRows.map(row => {
                const cells = renderRowCells(row);
                return (
                  <tr key={row.id}
                    style={{ borderTop: `1px solid ${T.border}`, transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = T.hover}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '10px 16px' }}>
                      <input type="checkbox"
                        checked={selectionMode === 'ALL' || selectedUserIds.includes(row.id)}
                        onChange={() => toggleUser(row.id)}
                        disabled={selectionMode === 'ALL'}
                        style={{ cursor: 'pointer' }}
                      />
                    </td>
                    {cells.map((cell, i) => (
                      <td key={i} style={{ padding: '10px 16px' }}>{cell}</td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer / Pagination */}
        <div style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: `1px solid ${T.border}` }}>
          <div style={{ fontSize: 13, color: T.textMuted }}>
            Showing <strong style={{ color: T.textMain }}>{activeRows.length}</strong> {subTab.toLowerCase()}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: T.textMuted }}>
            Page {page + 1}
            {['‹', '›'].map((ch, i) => (
              <button key={i}
                disabled={i === 0 ? page === 0 : activeRows.length < size}
                onClick={() => setPage(p => i === 0 ? Math.max(0, p - 1) : p + 1)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: '2px 8px', borderRadius: 4, fontSize: 18, color: T.textMain,
                  opacity: (i === 0 ? page === 0 : activeRows.length < size) ? 0.3 : 1,
                }}
              >{ch}</button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Target Picker Modal (Option 2) ────────────────────── */}
      {targetModalOpen && (
        <AdminModal
          open
          onClose={() => {
            setTargetModalOpen(false);
            setTargetSearchQuery('');
          }}
          title={topTab === 'COURSES' ? 'Select Target Course' : 'Select Target Assessment'}
          description={`Search and choose a ${topTab === 'COURSES' ? 'course' : 'assessment'} to filter the roster and manage assignments.`}
          size="lg"
          footer={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <button
                type="button"
                onClick={() => {
                  if (topTab === 'COURSES') setSelectedCourseId('');
                  else setSelectedAssessmentId('');
                  setTargetModalOpen(false);
                  setTargetSearchQuery('');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: T.danger,
                  fontSize: 13,
                  fontWeight: 600,
                  padding: '6px 12px',
                  borderRadius: 6,
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(234, 84, 85, 0.1)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                Clear Selection (View All)
              </button>
              <button
                type="button"
                onClick={() => {
                  setTargetModalOpen(false);
                  setTargetSearchQuery('');
                }}
                style={{
                  padding: '8px 18px',
                  borderRadius: 8,
                  background: T.surface,
                  color: T.textMain,
                  border: `1px solid ${T.border}`,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
                onMouseEnter={e => e.currentTarget.style.background = T.hover}
                onMouseLeave={e => e.currentTarget.style.background = T.surface}
              >
                Close
              </button>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Search filter input */}
            <div style={{ position: 'relative' }}>
              <Search
                size={16}
                style={{
                  position: 'absolute',
                  left: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: T.textMuted,
                }}
              />
              <input
                type="text"
                autoFocus
                placeholder={`Search ${topTab === 'COURSES' ? 'courses by title, instructor, or description' : 'assessments'}...`}
                value={targetSearchQuery}
                onChange={e => setTargetSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  height: 42,
                  padding: '0 36px 0 38px',
                  background: 'var(--input-bg, var(--surface-medium))',
                  border: `1px solid ${T.border}`,
                  borderRadius: 8,
                  fontSize: 14,
                  color: T.textMain,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              {targetSearchQuery && (
                <button
                  type="button"
                  onClick={() => setTargetSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: 10,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: T.textMuted,
                  }}
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {/* Total items counter */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, color: T.textMuted, padding: '0 2px' }}>
              <span>Showing <strong>{filteredModalTargets.length}</strong> {topTab === 'COURSES' ? 'courses' : 'assessments'}</span>
              <span>Click a card to set as active target</span>
            </div>

            {/* List of items */}
            <div style={{ maxHeight: '52vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, paddingRight: 4 }}>
              {filteredModalTargets.length === 0 ? (
                <div style={{ padding: '36px 16px', textAlign: 'center', color: T.textMuted }}>
                  <Target size={32} style={{ opacity: 0.4, margin: '0 auto 8px', display: 'block' }} />
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>
                    No {topTab === 'COURSES' ? 'courses' : 'assessments'} match &quot;{targetSearchQuery}&quot;
                  </p>
                </div>
              ) : (
                filteredModalTargets.map((item) => {
                  const isSelected = topTab === 'COURSES'
                    ? selectedCourseId === item.id
                    : selectedAssessmentId === item.id;
                  
                  const enrolledCount = topTab === 'COURSES'
                    ? rawEnrollments.filter(e => e.course?.id === item.id && e.status !== 'INACTIVE').length
                    : null;

                  const inst = topTab === 'COURSES' && item.instructorId
                    ? instructors.find(i => i.id === item.instructorId)
                    : null;

                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        if (topTab === 'COURSES') setSelectedCourseId(item.id);
                        else setSelectedAssessmentId(item.id);
                        setTargetModalOpen(false);
                        setTargetSearchQuery('');
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 14,
                        padding: '12px 16px',
                        borderRadius: 8,
                        cursor: 'pointer',
                        background: isSelected ? 'rgba(115, 103, 240, 0.12)' : 'var(--surface-medium)',
                        border: isSelected ? `1px solid ${T.primary}` : `1px solid ${T.border}`,
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={e => {
                        if (!isSelected) {
                          e.currentTarget.style.background = T.hover;
                          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                        }
                      }}
                      onMouseLeave={e => {
                        if (!isSelected) {
                          e.currentTarget.style.background = 'var(--surface-medium)';
                          e.currentTarget.style.borderColor = T.border;
                        }
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0, flex: 1 }}>
                        <div
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 8,
                            background: isSelected ? T.primary : 'rgba(255, 255, 255, 0.05)',
                            color: isSelected ? '#fff' : T.textMuted,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          {topTab === 'COURSES' ? <BookOpen size={20} /> : <FileCheck2 size={20} />}
                        </div>

                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: T.textMain }}>
                              {item.title}
                            </p>
                            {isSelected && (
                              <span
                                style={{
                                  fontSize: 11,
                                  fontWeight: 700,
                                  color: T.primary,
                                  background: 'rgba(115, 103, 240, 0.2)',
                                  padding: '1px 7px',
                                  borderRadius: 4,
                                }}
                              >
                                Selected
                              </span>
                            )}
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginTop: 4, fontSize: 12, color: T.textMuted }}>
                            {topTab === 'COURSES' ? (
                              <>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <Users size={13} color={T.primary} />
                                  {enrolledCount} enrolled student{enrolledCount === 1 ? '' : 's'}
                                </span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <UserCheck size={13} color={T.success} />
                                  {inst?.fullName || inst?.name || item.instructorName || 'Unassigned'}
                                </span>
                              </>
                            ) : (
                              <>
                                <span>Total Marks: {item.totalMarks ?? '—'}</span>
                                {item.durationMinutes && <span>Duration: {item.durationMinutes}m</span>}
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div style={{ flexShrink: 0 }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '5px 12px',
                            fontSize: 12,
                            fontWeight: 600,
                            borderRadius: 6,
                            background: isSelected ? T.primary : 'transparent',
                            color: isSelected ? '#fff' : T.primary,
                            border: isSelected ? 'none' : `1px solid rgba(115, 103, 240, 0.35)`,
                          }}
                        >
                          {isSelected ? 'Active Target' : 'Select'}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </AdminModal>
      )}
    </div>
  );
};

export default EnrollmentListPage;
