import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  MailPlus,
  ClipboardList,
  Building2,
  CreditCard,
  KeyRound,
  BookOpen,
  FileText,
  GraduationCap,
  CalendarRange,
  Presentation,
  ScrollText,
  FolderDown,
  Trophy,
  MessageSquare,
} from 'lucide-react';
import MainNavigation from '../MainNavigation';
import { ROUTES } from '../../../constants/routes';
import { PERMISSIONS } from '../../../constants/permissions';

const ITEMS = [
  {
    label: 'Dashboard',
    to: ROUTES.ADMIN_ANALYTICS,
    permission: PERMISSIONS.ANALYTICS_READ,
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    label: 'Users',
    to: ROUTES.USERS,
    permission: PERMISSIONS.USER_READ,
    group: 'People',
    icon: <Users className="h-5 w-5" />,
  },
  {
    label: 'Batches',
    to: ROUTES.BATCHES,
    permission: PERMISSIONS.BATCH_VIEW,
    group: 'Learning',
    icon: <CalendarRange className="h-5 w-5" />,
  },
  {
    label: 'Learners',
    permission: PERMISSIONS.STUDENT_VIEW,
    group: 'People',
    icon: <GraduationCap className="h-5 w-5" />,
    children: [
      {
        label: 'Add New Learner',
        to: ROUTES.STUDENT_CREATE,
        permission: PERMISSIONS.STUDENT_CREATE,
      },
      { label: 'Learner List', to: ROUTES.STUDENTS, end: true },
    ],
  },
  {
    label: 'Instructors',
    permission: PERMISSIONS.INSTRUCTOR_VIEW,
    group: 'People',
    icon: <Presentation className="h-5 w-5" />,
    children: [
      {
        label: 'Add New Instructor',
        to: ROUTES.INSTRUCTOR_CREATE,
        permission: PERMISSIONS.INSTRUCTOR_CREATE,
      },
      { label: 'Instructor List', to: ROUTES.INSTRUCTORS, end: true },
    ],
  },
  {
    label: 'Roles',
    to: ROUTES.ROLES,
    permission: PERMISSIONS.ROLES_VIEW,
    group: 'People',
    icon: <ShieldCheck className="h-5 w-5" />,
  },
  {
    label: 'Permissions',
    to: ROUTES.PERMISSIONS,
    permission: PERMISSIONS.ROLES_VIEW,
    group: 'People',
    icon: <KeyRound className="h-5 w-5" />,
  },
  {
    label: 'Invitations',
    to: ROUTES.INVITATIONS,
    permission: PERMISSIONS.INVITATION_READ,
    group: 'People',
    icon: <MailPlus className="h-5 w-5" />,
  },
  {
    label: 'Courses',
    to: ROUTES.ADMIN_COURSES,
    permission: PERMISSIONS.COURSE_VIEW,
    group: 'Learning',
    icon: <BookOpen className="h-5 w-5" />,
  },
  {
    label: 'Enrollments',
    to: ROUTES.ENROLLMENTS,
    permission: PERMISSIONS.ENROLLMENT_READ,
    group: 'Learning',
    icon: <ClipboardList className="h-5 w-5" />,
  },
  {
    label: 'Assessments',
    to: ROUTES.ADMIN_ASSESSMENTS,
    permission: PERMISSIONS.ASSESSMENT_VIEW,
    group: 'Learning',
    icon: <FileText className="h-5 w-5" />,
  },
  {
    label: 'Campus Toolkit',
    to: ROUTES.CAMPUS_RESOURCES,
    group: 'Learning',
    icon: <FolderDown className="h-5 w-5" />,
  },
  {
    label: 'Audit Logs',
    to: ROUTES.AUDIT_LOGS,
    group: 'Settings',
    icon: <ScrollText className="h-5 w-5" />,
  },
  {
    label: 'Organization',
    to: ROUTES.ORGANIZATION,
    permission: PERMISSIONS.TENANT_READ,
    group: 'Settings',
    icon: <Building2 className="h-5 w-5" />,
  },
  {
    label: 'Subscription',
    to: ROUTES.SUBSCRIPTION,
    permission: PERMISSIONS.SUBSCRIPTION_READ,
    group: 'Settings',
    icon: <CreditCard className="h-5 w-5" />,
  },
  {
    label: 'Gamification',
    to: ROUTES.ADMIN_GAMIFICATION,
    permission: PERMISSIONS.GAMIFICATION_MANAGE,
    group: 'Settings',
    icon: <Trophy className="h-5 w-5" />,
  },
  {
    label: 'Chat',
    to: ROUTES.CHAT,
    group: 'Communication',
    icon: <MessageSquare className="h-5 w-5" />,
  },
];

export const AdminNavigation = () => <MainNavigation items={ITEMS} />;

export default AdminNavigation;
