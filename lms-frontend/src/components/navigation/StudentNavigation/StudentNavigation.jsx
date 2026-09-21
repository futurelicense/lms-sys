import {
  LayoutDashboard,
  BookOpen,
  FileText,
  Award,
  Bell,
  Trophy,
  CalendarDays,
  StickyNote,
  MessageSquare,
} from 'lucide-react';
import MainNavigation from '../MainNavigation';
import { ROUTES } from '../../../constants/routes';

/**
 * Student sidebar navigation:
 *   • Icons on every item
 *   • Grouped sections (Learning, Achievements)
 *   • Cleanly connected to backend DB endpoints
 */
const ITEMS = [
  {
    label: 'Dashboard',
    to: ROUTES.STUDENT_PROGRESS,
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    label: 'My Courses',
    to: ROUTES.MY_COURSES,
    group: 'Learning',
    icon: <BookOpen className="h-5 w-5" />,
  },
  {
    label: 'Assessments',
    to: ROUTES.STUDENT_ASSESSMENTS,
    group: 'Learning',
    icon: <FileText className="h-5 w-5" />,
  },
  {
    label: 'Calendar',
    to: ROUTES.CALENDAR,
    group: 'Learning',
    icon: <CalendarDays className="h-5 w-5" />,
  },
  {
    label: 'Notes & Bookmarks',
    to: ROUTES.NOTES_BOOKMARKS,
    group: 'Learning',
    icon: <StickyNote className="h-5 w-5" />,
  },
  {
    label: 'Achievements',
    to: ROUTES.GAMIFICATION,
    group: 'Achievements',
    icon: <Trophy className="h-5 w-5" />,
  },
  {
    label: 'Certificates',
    to: ROUTES.CERTIFICATES,
    group: 'Achievements',
    icon: <Award className="h-5 w-5" />,
  },
  {
    label: 'Notifications',
    to: ROUTES.NOTIFICATIONS,
    group: 'Achievements',
    icon: <Bell className="h-5 w-5" />,
  },
  {
    label: 'Chat',
    to: ROUTES.CHAT,
    group: 'Communication',
    icon: <MessageSquare className="h-5 w-5" />,
  },
];

export const StudentNavigation = () => <MainNavigation items={ITEMS} />;

export default StudentNavigation;
