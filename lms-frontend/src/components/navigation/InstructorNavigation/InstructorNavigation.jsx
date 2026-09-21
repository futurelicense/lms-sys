import { FolderDown, BookOpen, FileText, ClipboardList, LayoutDashboard, Megaphone, Database, Users, Award, MessageSquare } from 'lucide-react';
import MainNavigation from '../MainNavigation';
import { ROUTES } from '../../../constants/routes';
import { PERMISSIONS } from '../../../constants/permissions';

const ITEMS = [
  {
    label: 'Dashboard',
    to: ROUTES.INSTRUCTOR_ANALYTICS,
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    label: 'Courses',
    to: ROUTES.COURSES,
    permission: PERMISSIONS.COURSE_VIEW,
    group: 'Teaching',
    icon: <BookOpen className="h-5 w-5" />,
  },
  {
    label: 'Cohorts & Batches',
    to: ROUTES.INSTRUCTOR_BATCHES,
    permission: PERMISSIONS.BATCH_VIEW,
    group: 'Teaching',
    icon: <Users className="h-5 w-5" />,
  },
  {
    label: 'Assessments',
    to: ROUTES.ASSESSMENTS,
    permission: PERMISSIONS.ASSESSMENT_VIEW,
    group: 'Teaching',
    icon: <FileText className="h-5 w-5" />,
  },
  {
    label: 'Question Bank',
    to: ROUTES.INSTRUCTOR_QUESTION_BANK,
    group: 'Teaching',
    icon: <Database className="h-5 w-5" />,
  },
  {
    label: 'Enrollments',
    to: ROUTES.ENROLLMENTS,
    permission: PERMISSIONS.ENROLLMENT_VIEW,
    group: 'Teaching',
    icon: <ClipboardList className="h-5 w-5" />,
  },
  {
    label: 'Graduation & Certificates',
    to: ROUTES.INSTRUCTOR_CERTIFICATES,
    group: 'Teaching',
    icon: <Award className="h-5 w-5" />,
  },
  {
    label: 'Study Toolkits',
    to: ROUTES.INSTRUCTOR_RESOURCES,
    group: 'Teaching',
    icon: <FolderDown className="h-5 w-5" />,
  },
  {
    label: 'Announcements',
    to: ROUTES.INSTRUCTOR_ANNOUNCEMENTS,
    group: 'Communication',
    icon: <Megaphone className="h-5 w-5" />,
  },
  {
    label: 'Chat',
    to: ROUTES.CHAT,
    group: 'Communication',
    icon: <MessageSquare className="h-5 w-5" />,
  },
];

export const InstructorNavigation = () => <MainNavigation items={ITEMS} />;

export default InstructorNavigation;
