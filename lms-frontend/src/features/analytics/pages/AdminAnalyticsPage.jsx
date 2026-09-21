import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  CalendarClock,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  Clock3,
  Download,
  FileText,
  GraduationCap,
  LayoutDashboard,
  MailPlus,
  Plus,
  Presentation,
  ShieldCheck,
  TrendingUp,
  Users,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { AdminCardSkeleton } from '../../../components/ui/AdminSkeleton';
import ErrorState from '../../../components/common/ErrorState';
import { QUERY_KEYS } from '../../../constants/appConstants';
import { ROUTES } from '../../../constants/routes';
import useAuth from '../../auth/hooks/useAuth';
import courseService from '../../courses/services/courseService';
import analyticsService from '../services/analyticsService';
import DashboardLeaderboardWidget from '../../assessments/components/DashboardLeaderboardWidget';

const percent = (value) => Math.max(0, Math.min(100, Number(value) || 0));
const number = (value) => new Intl.NumberFormat().format(Number(value) || 0);

const Card = ({ children, className = '' }) => (
  <section
    className={`rounded-2xl border p-5 sm:p-6 ${className}`}
    style={{ background: 'var(--surface-medium)', borderColor: 'var(--border-color)' }}
  >
    {children}
  </section>
);

const MetricRow = ({ icon: Icon, label, value, tone = 'blue' }) => {
  const tones = {
    blue: { background: 'var(--dashboard-accent-soft)', color: 'var(--dashboard-accent-text)' },
    green: { background: 'var(--dashboard-success-soft)', color: 'var(--dashboard-success-text)' },
    amber: { background: 'var(--dashboard-warning-soft)', color: 'var(--dashboard-warning-text)' },
  };
  return (
    <div
      className="flex items-center justify-between gap-3 rounded-xl border px-4 py-3"
      style={{ borderColor: 'var(--border-color)', background: 'var(--surface-dark)' }}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg" style={tones[tone]}>
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
        <span className="truncate text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
          {label}
        </span>
      </div>
      <strong className="text-base tabular-nums" style={{ color: 'var(--text-primary)' }}>
        {value}
      </strong>
    </div>
  );
};

const Bar = ({ value, tone = '#3b6fe0' }) => (
  <div className="h-2 overflow-hidden rounded-full" style={{ background: 'var(--active-bg)' }}>
    <div
      className="h-full rounded-full transition-[width] duration-500"
      style={{ width: `${percent(value)}%`, background: tone }}
    />
  </div>
);

const Legend = ({ color, label, value }) => (
  <div className="flex items-center justify-between gap-3 text-sm">
    <span className="flex min-w-0 items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: color }} />
      <span className="truncate">{label}</span>
    </span>
    <strong className="tabular-nums" style={{ color: 'var(--text-primary)' }}>{number(value)}</strong>
  </div>
);

const ReadinessRing = ({ label, published, total, color, detail }) => {
  const readiness = total ? percent((published / total) * 100) : 0;
  return (
    <div className="flex min-w-0 items-center gap-4 rounded-xl border p-4" style={{ borderColor: 'var(--border-color)', background: 'var(--surface-dark)' }}>
      <div className="grid h-20 w-20 shrink-0 place-items-center rounded-full" style={{ background: `conic-gradient(${color} ${readiness}%, var(--active-bg) 0)` }}>
        <div className="grid h-14 w-14 place-items-center rounded-full" style={{ background: 'var(--surface-dark)' }}>
          <strong className="text-sm tabular-nums" style={{ color: 'var(--text-primary)' }}>{readiness}%</strong>
        </div>
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{label}</p>
        <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>{number(published)} published of {number(total)}</p>
        <p className="mt-2 text-xs font-medium" style={{ color }}>{detail}</p>
      </div>
    </div>
  );
};

const DataPending = ({ icon: Icon, title, description, compact = false }) => (
  <div
    className={`grid place-items-center rounded-xl border text-center ${compact ? 'min-h-36 p-4' : 'min-h-52 p-6'}`}
    style={{ borderColor: 'var(--border-color)', background: 'var(--surface-dark)' }}
  >
    <div className="max-w-sm">
      <span className="mx-auto grid h-10 w-10 place-items-center rounded-lg" style={{ color: 'var(--dashboard-accent-text)', background: 'var(--dashboard-accent-soft)' }}>
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <p className="mt-3 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</p>
      <p className="mt-1 text-xs leading-5" style={{ color: 'var(--text-muted)' }}>{description}</p>
    </div>
  </div>
);

export const AdminAnalyticsPage = () => {
  const { user } = useAuth();
  const [reportingRange, setReportingRange] = useState('30d');
  const analytics = useQuery({
    queryKey: [...QUERY_KEYS.ANALYTICS, 'admin'],
    queryFn: () => analyticsService.adminOverview(),
  });
  const courses = useQuery({
    queryKey: ['courses', 'admin-dashboard'],
    queryFn: () => courseService.list({ page: 0, size: 5, status: 'PUBLISHED' }),
  });

  if (analytics.error) return <ErrorState error={analytics.error} onRetry={analytics.refetch} />;

  const data = analytics.data ?? {};
  const completionRate = percent(data.completionRate);
  const activeLearners = Number(data.activeLearners) || 0;
  const totalCourses = Number(data.totalCourses) || 0;
  const publishedCourses = Number(data.publishedCourses) || 0;
  const totalEnrollments = Number(data.totalEnrollments) || 0;
  const totalMembers = Number(data.totalMembers) || 0;
  const instructorCount = Number(data.instructorCount) || 0;
  const assessmentCount = Number(data.assessmentCount) || 0;
  const publishedAssessments = Number(data.publishedAssessments) || 0;
  const pendingInvitations = Number(data.pendingInvitations) || 0;
  const actionQueue = Array.isArray(data.actionQueue) ? data.actionQueue : [];
  const topCourses = Array.isArray(data.topCourses) ? data.topCourses : [];
  const atRiskCourses = Array.isArray(data.atRiskCourses) ? data.atRiskCourses : [];
  const coursePage = courses.data?.data ?? courses.data ?? {};
  const courseItems = Array.isArray(coursePage.content) ? coursePage.content : [];
  const learnerName = user?.firstName || user?.name?.split(' ')[0] || 'Administrator';
  const incompleteRate = Math.max(0, 100 - completionRate);
  const actionRoute = {
    invitations: ROUTES.INVITATIONS,
    courses: ROUTES.ADMIN_COURSES,
    assessments: ROUTES.ADMIN_ASSESSMENTS,
    risk: ROUTES.ADMIN_COURSES,
  };

  const primaryStats = [
    { label: 'Active learners', value: number(activeLearners), icon: Users, note: 'Currently enrolled', tone: 'blue' },
    { label: 'Published courses', value: number(publishedCourses), icon: BookOpen, note: 'Available to learners', tone: 'green' },
    { label: 'Total enrollments', value: number(totalEnrollments), icon: ClipboardList, note: 'Across this tenant', tone: 'amber' },
  ];

  return (
    <div className="mx-auto max-w-[1540px] space-y-5 pb-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium" style={{ color: 'var(--dashboard-accent-text)' }}>ACADEMY OVERVIEW</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Good to see you, {learnerName}
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
            A live view of learning activity across your organization.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="relative">
            <span className="sr-only">Reporting period</span>
            <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} aria-hidden="true" />
            <select
              value={reportingRange}
              onChange={(event) => setReportingRange(event.target.value)}
              className="appearance-none rounded-lg border py-2.5 pl-9 pr-8 text-sm font-semibold outline-none transition focus:ring-2"
              style={{ borderColor: 'var(--border-color)', background: 'var(--surface-medium)', color: 'var(--text-primary)' }}
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="quarter">This quarter</option>
              <option value="year">This year</option>
            </select>
          </label>
          <Link
            to={ROUTES.ADMIN_COURSES}
            className="inline-flex w-fit items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold no-underline transition hover:brightness-110 active:translate-y-px"
            style={{ background: 'var(--dashboard-accent)', color: '#fff' }}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Manage courses
          </Link>
        </div>
      </header>

      {analytics.isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => <AdminCardSkeleton key={index} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          <Card className="relative overflow-hidden xl:col-span-6">
            <div className="absolute -right-16 -top-16 h-52 w-52 rounded-full bg-blue-500/10 blur-3xl" />
            <div className="relative flex h-full flex-col justify-between gap-8">
              <div>
                <div className="flex items-center gap-2">
                  <span className="grid h-9 w-9 place-items-center rounded-lg" style={{ color: 'var(--dashboard-accent-text)', background: 'var(--dashboard-accent-soft)' }}>
                    <LayoutDashboard className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Learning health</span>
                </div>
                <h2 className="mt-5 max-w-md text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                  {completionRate}% of enrolled learning has been completed.
                </h2>
                <p className="mt-2 max-w-lg text-sm leading-6" style={{ color: 'var(--text-muted)' }}>
                  Keep teams moving by reviewing course availability, enrollments, and learner progress in one place.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link to={ROUTES.ENROLLMENTS} className="inline-flex items-center gap-1.5 text-sm font-semibold no-underline" style={{ color: 'var(--dashboard-accent-text)' }}>
                  Review enrollments <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link to={ROUTES.STUDENTS} className="inline-flex items-center gap-1.5 text-sm font-semibold no-underline" style={{ color: 'var(--text-secondary)' }}>
                  View learners <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </Card>

          <Card className="xl:col-span-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>Completion</h2>
              <TrendingUp className="h-4 w-4" style={{ color: 'var(--dashboard-accent-text)' }} aria-hidden="true" />
            </div>
            <div className="mt-7 grid place-items-center">
              <div
                className="grid h-36 w-36 place-items-center rounded-full"
                style={{ background: `conic-gradient(#3b6fe0 ${completionRate}%, var(--active-bg) 0)` }}
              >
                <div className="grid h-24 w-24 place-items-center rounded-full" style={{ background: 'var(--surface-medium)' }}>
                  <strong className="text-2xl tabular-nums" style={{ color: 'var(--text-primary)' }}>{completionRate}%</strong>
                </div>
              </div>
            </div>
            <p className="mt-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
              Completion across all enrollments
            </p>
          </Card>

          <Card className="xl:col-span-3">
            <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>At a glance</h2>
            <div className="mt-4 space-y-3">
              {primaryStats.map((stat) => <MetricRow key={stat.label} {...stat} />)}
            </div>
          </Card>
        </div>
      )}

      {/* Hall of Fame: Category Champions & Badges */}
      <DashboardLeaderboardWidget isInstructor={false} />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        <Card className="xl:col-span-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>Learner success rate</h2>
              <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>Completed versus active enrollments.</p>
            </div>
            <ShieldCheck className="h-5 w-5" style={{ color: 'var(--dashboard-success-text)' }} aria-hidden="true" />
          </div>
          <div className="mt-8 flex items-end justify-between">
            <strong className="text-5xl tracking-tight" style={{ color: 'var(--text-primary)' }}>{completionRate}%</strong>
            <span className="rounded-full px-2.5 py-1 text-xs font-semibold" style={{ color: 'var(--dashboard-success-text)', background: 'var(--dashboard-success-soft)' }}>
              Live metric
            </span>
          </div>
          <div className="mt-5"><Bar value={completionRate} /></div>
          <div className="mt-3 flex justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
            <span>{number(activeLearners)} active learners</span>
            <span>{number(totalEnrollments)} total enrollments</span>
          </div>
          <Link to={ROUTES.ENROLLMENTS} className="mt-7 flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold no-underline transition hover:bg-white/[.04] active:translate-y-px" style={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}>
            View enrollment details <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </Card>

        <Card className="xl:col-span-4">
          <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>Learning momentum</h2>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>Current platform-wide progress signals.</p>
          <div className="mt-7 space-y-5">
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span style={{ color: 'var(--text-secondary)' }}>Completed enrollment</span>
                <strong style={{ color: 'var(--text-primary)' }}>{completionRate}%</strong>
              </div>
              <Bar value={completionRate} tone="#3b6fe0" />
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span style={{ color: 'var(--text-secondary)' }}>Learning in progress</span>
                <strong style={{ color: 'var(--text-primary)' }}>{incompleteRate}%</strong>
              </div>
              <Bar value={incompleteRate} tone="#f59e0b" />
            </div>
          </div>
          <div className="mt-9 rounded-xl border p-4" style={{ borderColor: 'var(--border-color)', background: 'var(--surface-dark)' }}>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Need deeper reporting?</p>
            <p className="mt-1 text-sm leading-5" style={{ color: 'var(--text-muted)' }}>Trend history and course-level performance are being added to Analytics &amp; Reports.</p>
          </div>
        </Card>

        <Card className="xl:col-span-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>Published courses</h2>
              <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>Latest courses available to learners.</p>
            </div>
            <Link to={ROUTES.ADMIN_COURSES} className="text-sm font-semibold no-underline" style={{ color: 'var(--dashboard-accent-text)' }}>View all</Link>
          </div>
          <div className="mt-4 divide-y" style={{ borderColor: 'var(--border-color)' }}>
            {courses.isLoading ? Array.from({ length: 3 }).map((_, index) => <div key={index} className="h-14 animate-pulse" style={{ background: index % 2 ? 'transparent' : 'rgba(255,255,255,.02)' }} />) : null}
            {!courses.isLoading && courseItems.map((course) => (
              <Link key={course.id} to={ROUTES.ADMIN_COURSE_DETAILS(course.id)} className="flex items-center gap-3 py-3 no-underline transition hover:opacity-80">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg" style={{ color: 'var(--dashboard-accent-text)', background: 'var(--dashboard-accent-soft)' }}><GraduationCap className="h-4 w-4" aria-hidden="true" /></span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{course.title || 'Untitled course'}</span>
                  <span className="mt-0.5 block text-xs" style={{ color: 'var(--text-muted)' }}>{course.categoryName || course.level || 'Published course'}</span>
                </span>
                <ArrowRight className="h-4 w-4 shrink-0" style={{ color: 'var(--text-muted)' }} aria-hidden="true" />
              </Link>
            ))}
            {!courses.isLoading && !courseItems.length && (
              <div className="py-9 text-center">
                <BookOpen className="mx-auto h-5 w-5" style={{ color: 'var(--text-muted)' }} aria-hidden="true" />
                <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>No published courses yet.</p>
                <Link to={ROUTES.ADMIN_COURSES} className="mt-2 inline-block text-sm font-semibold" style={{ color: 'var(--dashboard-accent-text)' }}>Create or publish a course</Link>
              </div>
            )}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        <Card className="xl:col-span-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>Learning trend</h2>
              <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
                Completion and enrollment movement for {reportingRange === '7d' ? 'the last 7 days' : reportingRange === '30d' ? 'the last 30 days' : reportingRange === 'quarter' ? 'this quarter' : 'this year'}.
              </p>
            </div>
            <button type="button" disabled className="inline-flex w-fit cursor-not-allowed items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold opacity-50" style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }} title="Exports will become available with trend reporting">
              <Download className="h-4 w-4" aria-hidden="true" /> Export report
            </button>
          </div>
          <div className="mt-5 relative overflow-hidden rounded-xl border p-5" style={{ borderColor: 'var(--border-color)', background: 'var(--surface-dark)' }}>
            <div className="absolute inset-x-5 top-5 bottom-12 grid grid-rows-4 border-b" style={{ borderColor: 'var(--border-color)' }} aria-hidden="true">
              {Array.from({ length: 4 }).map((_, index) => <div key={index} className="border-t" style={{ borderColor: 'var(--border-color)' }} />)}
            </div>
            <div className="relative flex min-h-60 items-center justify-center">
              <div className="max-w-sm text-center">
                <span className="mx-auto grid h-10 w-10 place-items-center rounded-lg" style={{ color: 'var(--dashboard-accent-text)', background: 'var(--dashboard-accent-soft)' }}><TrendingUp className="h-5 w-5" aria-hidden="true" /></span>
                <p className="mt-3 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Trend data will appear here</p>
                <p className="mt-1 text-xs leading-5" style={{ color: 'var(--text-muted)' }}>The dashboard is ready for dated enrollment and completion events when the reporting API is introduced.</p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="xl:col-span-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>Action required</h2>
              <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>Items that need an administrator response.</p>
            </div>
            <AlertCircle className="h-5 w-5" style={{ color: 'var(--dashboard-warning-text)' }} aria-hidden="true" />
          </div>
          <div className="mt-5 space-y-2">
            {actionQueue.map((action) => (
              <Link
                key={action.type}
                to={actionRoute[action.type] || ROUTES.ADMIN_ANALYTICS}
                className="group flex items-center gap-3 rounded-xl border p-3 no-underline transition hover:bg-white/[.035] active:translate-y-px"
                style={{ borderColor: 'var(--border-color)', background: 'var(--surface-dark)' }}
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-sm font-bold" style={{ color: 'var(--dashboard-warning-text)', background: 'var(--dashboard-warning-soft)' }}>
                  {number(action.count)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{action.title}</span>
                  <span className="mt-0.5 block truncate text-xs" style={{ color: 'var(--text-muted)' }}>{action.detail}</span>
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" style={{ color: 'var(--text-muted)' }} aria-hidden="true" />
              </Link>
            ))}
            {!actionQueue.length && (
              <DataPending icon={ShieldCheck} title="Nothing needs attention" description="There are no pending invitations, unpublished content, or low-progress courses right now." compact />
            )}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        <Card className="xl:col-span-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>Recent activity</h2>
              <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>Enrollments, publishing, invitations, and assessment events.</p>
            </div>
            <Clock3 className="h-5 w-5" style={{ color: 'var(--dashboard-accent-text)' }} aria-hidden="true" />
          </div>
          <div className="mt-5">
            <DataPending icon={Clock3} title="No activity feed yet" description="The feed will populate when platform events are exposed through the analytics API." compact />
          </div>
        </Card>
        <Card className="xl:col-span-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>Course performance</h2>
              <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>Completion, enrollment, and assessment performance by course.</p>
            </div>
            <BookOpen className="h-5 w-5" style={{ color: 'var(--dashboard-success-text)' }} aria-hidden="true" />
          </div>
          <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-xl border p-4" style={{ borderColor: 'var(--border-color)', background: 'var(--surface-dark)' }}>
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Top courses</p>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>by enrollment</span>
              </div>
              <div className="mt-3 space-y-1 divide-y" style={{ borderColor: 'var(--border-color)' }}>
                {topCourses.map((course, index) => (
                  <Link key={course.id} to={ROUTES.ADMIN_COURSE_DETAILS(course.id)} className="group flex items-center gap-2 py-2 no-underline transition hover:opacity-80">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold" style={{ color: 'var(--dashboard-accent-text)', background: 'var(--dashboard-accent-soft)' }}>{index + 1}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{course.title || 'Untitled course'}</span>
                      <span className="block text-xs" style={{ color: 'var(--text-muted)' }}>{number(course.enrollments)} enrollments · {course.completionRate}% completed</span>
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 transition-transform group-hover:translate-x-0.5" style={{ color: 'var(--text-muted)' }} aria-hidden="true" />
                  </Link>
                ))}
                {!topCourses.length && <p className="py-4 text-center text-xs" style={{ color: 'var(--text-muted)' }}>Publish a course to begin measuring performance.</p>}
              </div>
            </div>
            <div className="rounded-xl border p-4" style={{ borderColor: 'var(--border-color)', background: 'var(--surface-dark)' }}>
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>At-risk courses</p>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>needs review</span>
              </div>
              <div className="mt-3 space-y-1 divide-y" style={{ borderColor: 'var(--border-color)' }}>
                {atRiskCourses.map((course) => (
                  <Link key={course.id} to={ROUTES.ADMIN_COURSE_DETAILS(course.id)} className="group flex items-center gap-2 py-2 no-underline transition hover:opacity-80">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full" style={{ color: 'var(--dashboard-warning-text)', background: 'var(--dashboard-warning-soft)' }}><AlertCircle className="h-3.5 w-3.5" aria-hidden="true" /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{course.title || 'Untitled course'}</span>
                      <span className="block text-xs" style={{ color: 'var(--text-muted)' }}>{course.enrollments === 0 ? 'No enrollments yet' : `${course.completionRate}% completion`}</span>
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 transition-transform group-hover:translate-x-0.5" style={{ color: 'var(--text-muted)' }} aria-hidden="true" />
                  </Link>
                ))}
                {!atRiskCourses.length && <p className="py-4 text-center text-xs" style={{ color: 'var(--dashboard-success-text)' }}>No at-risk published courses.</p>}
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        <Card className="xl:col-span-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>Enrollment outcome</h2>
              <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>How current enrollments are progressing.</p>
            </div>
            <span className="rounded-lg px-2.5 py-1 text-xs font-semibold" style={{ color: 'var(--dashboard-accent-text)', background: 'var(--dashboard-accent-soft)' }}>Live</span>
          </div>
          <div className="mt-6 grid grid-cols-1 items-center gap-6 sm:grid-cols-[170px_1fr]">
            <div className="grid place-items-center">
              <div
                className="grid h-36 w-36 place-items-center rounded-full"
                style={{ background: `conic-gradient(#3b6fe0 ${completionRate}%, #f59e0b ${completionRate}% 100%)` }}
              >
                <div className="grid h-24 w-24 place-items-center rounded-full text-center" style={{ background: 'var(--surface-medium)' }}>
                  <strong className="text-2xl leading-none" style={{ color: 'var(--text-primary)' }}>{number(totalEnrollments)}</strong>
                  <span className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>enrollments</span>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <Legend color="#3b6fe0" label="Completed" value={Math.round((totalEnrollments * completionRate) / 100)} />
              <Legend color="#f59e0b" label="In progress" value={Math.max(0, totalEnrollments - Math.round((totalEnrollments * completionRate) / 100))} />
              <div className="border-t pt-4" style={{ borderColor: 'var(--border-color)' }}>
                <p className="text-xs leading-5" style={{ color: 'var(--text-muted)' }}>The chart uses the current completion rate from the analytics API.</p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="xl:col-span-7">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>Content readiness</h2>
              <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>Publication coverage across your courses and assessments.</p>
            </div>
            <Link to={ROUTES.ADMIN_ASSESSMENTS} className="text-sm font-semibold no-underline" style={{ color: 'var(--dashboard-accent-text)' }}>Manage assessments</Link>
          </div>
          <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ReadinessRing label="Course catalog" published={publishedCourses} total={totalCourses} color="#3b6fe0" detail="Courses available to learners" />
            <ReadinessRing label="Assessment catalog" published={publishedAssessments} total={assessmentCount} color="#10b981" detail="Assessments available to learners" />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        <Card className="xl:col-span-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>Administrative workspace</h2>
              <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>Shortcuts for the work that keeps your academy moving.</p>
            </div>
            <span className="w-fit rounded-full px-2.5 py-1 text-xs font-semibold" style={{ color: 'var(--dashboard-accent-text)', background: 'var(--dashboard-accent-soft)' }}>
              {number(totalMembers)} members
            </span>
          </div>
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              { to: ROUTES.STUDENTS, icon: GraduationCap, title: 'Learners', detail: `${number(activeLearners)} active learners`, tone: 'var(--dashboard-accent-text)', surface: 'var(--dashboard-accent-soft)' },
              { to: ROUTES.INSTRUCTORS, icon: Presentation, title: 'Instructors', detail: `${number(instructorCount)} teaching profiles`, tone: 'var(--dashboard-success-text)', surface: 'var(--dashboard-success-soft)' },
              { to: ROUTES.ADMIN_ASSESSMENTS, icon: ClipboardCheck, title: 'Assessments', detail: `${number(publishedAssessments)} of ${number(assessmentCount)} live`, tone: 'var(--dashboard-warning-text)', surface: 'var(--dashboard-warning-soft)' },
              { to: ROUTES.INVITATIONS, icon: MailPlus, title: 'Invitations', detail: `${number(pendingInvitations)} pending acceptance`, tone: 'var(--dashboard-pink-text)', surface: 'var(--dashboard-pink-soft)' },
            ].map(({ to, icon: Icon, title, detail, tone, surface }) => (
              <Link key={title} to={to} className="group flex items-center gap-3 rounded-xl border p-4 no-underline transition hover:bg-white/[.035] active:translate-y-px" style={{ borderColor: 'var(--border-color)', background: 'var(--surface-dark)' }}>
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg" style={{ color: tone, background: surface }}><Icon className="h-5 w-5" aria-hidden="true" /></span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</span>
                  <span className="mt-0.5 block truncate text-xs" style={{ color: 'var(--text-muted)' }}>{detail}</span>
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" style={{ color: 'var(--text-muted)' }} aria-hidden="true" />
              </Link>
            ))}
          </div>
        </Card>

        <Card className="xl:col-span-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>This week</h2>
              <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>A concise operational snapshot.</p>
            </div>
            <CalendarClock className="h-5 w-5" style={{ color: 'var(--dashboard-accent-text)' }} aria-hidden="true" />
          </div>
          <div className="mt-5 space-y-3">
            <MetricRow icon={FileText} label="Published assessments" value={number(publishedAssessments)} tone="amber" />
            <MetricRow icon={MailPlus} label="Pending invitations" value={number(pendingInvitations)} tone="blue" />
            <MetricRow icon={Users} label="All organization members" value={number(totalMembers)} tone="green" />
          </div>
          <Link to={ROUTES.AUDIT_LOGS} className="mt-5 flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold no-underline transition hover:bg-white/[.04] active:translate-y-px" style={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}>
            Review audit logs <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </Card>
      </div>
    </div>
  );
};

export default AdminAnalyticsPage;
