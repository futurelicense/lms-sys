import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ROUTES } from '../constants/routes';
import { getPrimaryRole, ROLES } from '../constants/roles';
import { PERMISSIONS } from '../constants/permissions';
import AuthLayout from '../layouts/AuthLayout';
import ErrorLayout from '../layouts/ErrorLayout';
import AdminLayout from '../layouts/AdminLayout';
import InstructorLayout from '../layouts/InstructorLayout';
import StudentLayout from '../layouts/StudentLayout';
import ProtectedRoute from '../guards/ProtectedRoute';
import GuestRoute from '../guards/GuestRoute';
import RoleGuard from '../guards/RoleGuard';
import PermissionGuard from '../guards/PermissionGuard';
import RoleHomeRedirect from '../guards/RoleHomeRedirect';
import useAuth from '../features/auth/hooks/useAuth';
import Spinner from '../components/common/Spinner';
import EmptyState from '../components/common/EmptyState';
import RouteErrorBoundary from '../components/common/RouteErrorBoundary';

const RoleBasedLayout = () => {
  const { user } = useAuth();
  const primaryRole = getPrimaryRole(user?.roles);
  if (primaryRole === ROLES.ADMIN || primaryRole === ROLES.SUPER_ADMIN) {
    return <AdminLayout />;
  }
  if (primaryRole === ROLES.INSTRUCTOR) {
    return <InstructorLayout />;
  }
  return <StudentLayout />;
};

// Auth screens load eagerly - they are the entry point for every unauthenticated visit.
import LoginPage from '../features/auth/pages/LoginPage';
import ForgotPasswordPage from '../features/auth/pages/ForgotPasswordPage';
import ResetPasswordPage from '../features/auth/pages/ResetPasswordPage';
import AcceptInvitationPage from '../features/auth/pages/AcceptInvitationPage';
import UnauthorizedPage from '../features/auth/pages/UnauthorizedPage';
import SetPasswordPage from '../features/auth/pages/SetPasswordPage';

// Code-split features
const UserListPage = lazy(() => import('../features/users/pages/UserListPage'));
const UserDetailsPage = lazy(() => import('../features/users/pages/UserDetailsPage'));
const CreateUserPage = lazy(() => import('../features/users/pages/CreateUserPage'));
const EditUserPage = lazy(() => import('../features/users/pages/EditUserPage'));
const RoleListPage = lazy(() => import('../features/roles/pages/RoleListPage'));
const RoleDetailsPage = lazy(() => import('../features/roles/pages/RoleDetailsPage'));
const PermissionsPage = lazy(() => import('../features/roles/pages/PermissionsPage'));
const InvitationListPage = lazy(() => import('../features/invitations/pages/InvitationListPage'));
const StudentListPage = lazy(() => import('../features/students/pages/StudentListPage'));
const EditStudentPage = lazy(() => import('../features/students/pages/EditStudentPage'));
const StudentDetailsPage = lazy(() => import('../features/students/pages/StudentDetailsPage'));
const InstructorListPage = lazy(() => import('../features/instructors/pages/InstructorListPage'));
const AddInstructorPage = lazy(() => import('../features/instructors/pages/AddInstructorPage'));
const EditInstructorPage = lazy(() => import('../features/instructors/pages/EditInstructorPage'));
const InstructorDetailsPage = lazy(() => import('../features/instructors/pages/InstructorDetailsPage'));
const BatchListPage = lazy(() => import('../features/batches/pages/BatchListPage'));
const InstructorBatchListPage = lazy(() => import('../features/batches/pages/InstructorBatchListPage'));
const AddStudentPage = lazy(() => import('../features/students/pages/AddStudentPage'));
const AdminAnalyticsPage = lazy(() => import('../features/analytics/pages/AdminAnalyticsPage'));
const ResourceManagementPage = lazy(
  () => import('../features/resources/pages/ResourceManagementPage'),
);
const AdminCourseListPage = lazy(() => import('../features/courses/pages/AdminCourseListPage'));
const InstructorAnalyticsPage = lazy(() => import('../features/analytics/pages/InstructorAnalyticsPage'));
const AnnouncementsPage = lazy(() => import('../features/notifications/pages/AnnouncementsPage'));
const QuestionBankPage = lazy(() => import('../features/assessments/pages/QuestionBankPage'));
const StudentProgressPage = lazy(() => import('../features/analytics/pages/StudentProgressPage'));
const OrganizationPage = lazy(() => import('../features/tenants/pages/OrganizationPage'));
const OrganizationSettingsPage = lazy(() => import('../features/tenants/pages/OrganizationSettingsPage'));
const SubscriptionPage = lazy(() => import('../features/subscriptions/pages/SubscriptionPage'));
const PlansPage = lazy(() => import('../features/subscriptions/pages/PlansPage'));
const BillingPage = lazy(() => import('../features/subscriptions/pages/BillingPage'));
const AuditLogsPage = lazy(() => import('../features/audit/pages/AuditLogsPage'));
const CourseListPage = lazy(() => import('../features/courses/pages/CourseListPage'));
const CourseDetailsPage = lazy(() => import('../features/courses/pages/CourseDetailsPage'));
const CreateCoursePage = lazy(() => import('../features/courses/pages/CreateCoursePage'));
const EditCoursePage = lazy(() => import('../features/courses/pages/EditCoursePage'));
const MyCoursesPage = lazy(() => import('../features/courses/pages/MyCoursesPage'));
const EnrollmentListPage = lazy(() => import('../features/enrollment/pages/EnrollmentListPage'));
const EnrollmentDetailsPage = lazy(() => import('../features/enrollment/pages/EnrollmentDetailsPage'));

const AdminAssessmentListPage = lazy(() => import('../features/assessments/pages/AdminAssessmentListPage'));
const AdminCreateAssessmentPage = lazy(() => import('../features/assessments/pages/AdminCreateAssessmentPage'));
const AdminAssessmentDetailsPage = lazy(() => import('../features/assessments/pages/AdminAssessmentDetailsPage'));
const AdminEditAssessmentPage = lazy(() => import('../features/assessments/pages/AdminEditAssessmentPage'));
const GradingWorkflowPage = lazy(() => import('../features/assessments/pages/GradingWorkflowPage'));
const RubricManagerPage = lazy(() => import('../features/assessments/pages/RubricManagerPage'));
const AssessmentListPage = lazy(() => import('../features/assessments/pages/AssessmentListPage'));
const AssessmentResultPage = lazy(() => import('../features/assessments/pages/AssessmentResultPage'));
const StudentAssessmentTakingPage = lazy(() => import('../features/assessments/pages/StudentAssessmentTakingPage'));
const CreateAssessmentPage = lazy(() => import('../features/assessments/pages/CreateAssessmentPage'));
const GlobalSubmissionsHistoryPage = lazy(() => import('../features/assessments/pages/GlobalSubmissionsHistoryPage'));

const CertificateListPage = lazy(() => import('../features/certificates/pages/CertificateListPage'));
const CertificateDetailsPage = lazy(() => import('../features/certificates/pages/CertificateDetailsPage'));
const PublicCertificateVerifyPage = lazy(() => import('../features/certificates/pages/PublicCertificateVerifyPage'));
const InstructorCertificationHubPage = lazy(() => import('../features/certificates/pages/InstructorCertificationHubPage'));
const GamificationDashboard = lazy(() => import('../features/gamification/pages/GamificationDashboard'));
const AdminGamificationPage = lazy(() => import('../features/gamification/pages/AdminGamificationPage'));
const StudentCalendarPage = lazy(() => import('../features/calendar/pages/StudentCalendarPage'));
const NotesBookmarksPage = lazy(() => import('../features/notes/pages/NotesBookmarksPage'));
const NotificationPage = lazy(() => import('../features/notifications/pages/NotificationPage'));
const ProfilePage = lazy(() => import('../features/profile/pages/ProfilePage'));
const SecurityPage = lazy(() => import('../features/profile/pages/SecurityPage'));
const ChatPage = lazy(() => import('../features/chat/pages/ChatPage'));

// Platform Control Plane
const PlatformLayout = lazy(() => import('../features/platform/components/PlatformLayout'));
const PlatformDashboardPage = lazy(() => import('../features/platform/pages/PlatformDashboardPage'));
const PlatformTenantPage = lazy(() => import('../features/platform/pages/PlatformTenantPage'));
const PlatformAuditLogsPage = lazy(() => import('../features/platform/pages/PlatformAuditLogsPage'));
const PlatformAnnouncementsPage = lazy(() => import('../features/platform/pages/PlatformAnnouncementsPage'));

const suspend = (element) => (
  <RouteErrorBoundary>
    <Suspense fallback={<Spinner fullPage />}>{element}</Suspense>
  </RouteErrorBoundary>
);

export const router = createBrowserRouter([
  // Platform routes
  {
    path: ROUTES.PLATFORM_LOGIN,
    element: <Navigate to={ROUTES.LOGIN} replace />,
  },
  {
    path: '/platform',
    element: suspend(<PlatformLayout />),
    children: [
      { index: true, element: <Navigate to={ROUTES.PLATFORM_DASHBOARD} replace /> },
      { path: ROUTES.PLATFORM_DASHBOARD, element: suspend(<PlatformDashboardPage />) },
      { path: ROUTES.PLATFORM_TENANTS, element: suspend(<PlatformTenantPage />) },
      { path: ROUTES.PLATFORM_AUDIT_LOGS, element: suspend(<PlatformAuditLogsPage />) },
      { path: ROUTES.PLATFORM_ANNOUNCEMENTS, element: suspend(<PlatformAnnouncementsPage />) },
    ],
  },

  // Public Certificate Verification
  { path: ROUTES.PUBLIC_CERTIFICATE_VERIFY, element: suspend(<PublicCertificateVerifyPage />) },
  { path: '/verify/:serialNumber', element: suspend(<PublicCertificateVerifyPage />) },

  // Auth / Guest routes
  {
    element: <GuestRoute />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          { path: ROUTES.LOGIN, element: <LoginPage /> },
          { path: ROUTES.FORGOT_PASSWORD, element: <ForgotPasswordPage /> },
          { path: ROUTES.RESET_PASSWORD, element: <ResetPasswordPage /> },
          { path: ROUTES.ACCEPT_INVITATION, element: <AcceptInvitationPage /> },
        ],
      },
    ],
  },

  // Protected workspace routes
  {
    element: <ProtectedRoute />,
    children: [
      { path: ROUTES.ROOT, element: <RoleHomeRedirect /> },
      {
        path: '/admin',
        element: <RoleGuard allowedRoles={[ROLES.ADMIN, ROLES.SUPER_ADMIN]} />,
        children: [
          {
            element: <AdminLayout />,
            children: [
              { index: true, element: <Navigate to={ROUTES.ADMIN_ANALYTICS} replace /> },
              { path: 'dashboard', element: <Navigate to={ROUTES.ADMIN_ANALYTICS} replace /> },
              { path: '/admin/dashboard', element: <Navigate to={ROUTES.ADMIN_ANALYTICS} replace /> },
              { path: ROUTES.ADMIN_ANALYTICS, element: suspend(<AdminAnalyticsPage />) },
              {
                element: <PermissionGuard required={[PERMISSIONS.USER_READ]} />,
                children: [
                  { path: ROUTES.USERS, element: suspend(<UserListPage />) },
                  { path: ROUTES.USER_CREATE, element: suspend(<CreateUserPage />) },
                  { path: ROUTES.USER_DETAILS(), element: suspend(<UserDetailsPage />) },
                  { path: ROUTES.USER_EDIT(), element: suspend(<EditUserPage />) },
                ],
              },
              { path: ROUTES.ROLES, element: suspend(<RoleListPage />) },
              { path: ROUTES.ROLE_DETAILS(), element: suspend(<RoleDetailsPage />) },
              { path: ROUTES.PERMISSIONS, element: suspend(<PermissionsPage />) },
              { path: ROUTES.INVITATIONS, element: suspend(<InvitationListPage />) },
              { path: ROUTES.BATCHES, element: suspend(<BatchListPage />) },
              { path: ROUTES.STUDENTS, element: suspend(<StudentListPage />) },
              { path: ROUTES.STUDENT_CREATE, element: suspend(<AddStudentPage />) },
              { path: ROUTES.STUDENT_EDIT(), element: suspend(<EditStudentPage />) },
              { path: ROUTES.STUDENT_DETAILS(), element: suspend(<StudentDetailsPage />) },
              { path: ROUTES.INSTRUCTORS, element: suspend(<InstructorListPage />) },
              { path: ROUTES.INSTRUCTOR_CREATE, element: suspend(<AddInstructorPage />) },
              { path: ROUTES.INSTRUCTOR_EDIT(), element: suspend(<EditInstructorPage />) },
              { path: ROUTES.INSTRUCTOR_DETAILS(), element: suspend(<InstructorDetailsPage />) },
              { path: ROUTES.ENROLLMENTS, element: suspend(<EnrollmentListPage />) },
              { path: ROUTES.ENROLLMENT_DETAILS(), element: suspend(<EnrollmentDetailsPage />) },
              { path: ROUTES.ORGANIZATION, element: suspend(<OrganizationPage />) },
              { path: ROUTES.ORGANIZATION_SETTINGS, element: suspend(<OrganizationSettingsPage />) },
              { path: ROUTES.SUBSCRIPTION, element: suspend(<SubscriptionPage />) },
              { path: ROUTES.PLANS, element: suspend(<PlansPage />) },
              { path: ROUTES.BILLING, element: suspend(<BillingPage />) },
              { path: ROUTES.AUDIT_LOGS, element: suspend(<AuditLogsPage />) },
              { path: ROUTES.ADMIN_COURSES, element: suspend(<AdminCourseListPage />) },
              { path: ROUTES.ADMIN_COURSE_CREATE, element: suspend(<CreateCoursePage />) },
              { path: ROUTES.ADMIN_COURSE_DETAILS(), element: suspend(<CourseDetailsPage />) },
              { path: ROUTES.ADMIN_COURSE_EDIT(), element: suspend(<EditCoursePage />) },
              { path: ROUTES.CAMPUS_RESOURCES, element: suspend(<ResourceManagementPage />) },
              { path: ROUTES.ADMIN_GAMIFICATION, element: suspend(<AdminGamificationPage />) },
              {
                element: <PermissionGuard required={[PERMISSIONS.ASSESSMENT_VIEW]} />,
                children: [
                  { path: ROUTES.ADMIN_ASSESSMENTS, element: suspend(<AdminAssessmentListPage />) },
                  { path: ROUTES.ADMIN_ASSESSMENT_CREATE, element: suspend(<AdminCreateAssessmentPage />) },
                  { path: ROUTES.ADMIN_ASSESSMENT_DETAILS(), element: suspend(<AdminAssessmentDetailsPage />) },
                  { path: ROUTES.ADMIN_ASSESSMENT_EDIT(), element: suspend(<AdminEditAssessmentPage />) },
                  { path: ROUTES.ADMIN_SUBMISSIONS_HISTORY, element: suspend(<GlobalSubmissionsHistoryPage />) },
                  { path: ROUTES.ADMIN_GRADING, element: suspend(<GradingWorkflowPage />) },
                  { path: ROUTES.ADMIN_RUBRICS, element: suspend(<RubricManagerPage />) },
                  { path: ROUTES.ADMIN_QUESTION_BANK, element: suspend(<QuestionBankPage />) },
                ],
              },
            ],
          },
        ],
      },

      {
        path: '/instructor',
        element: <RoleGuard allowedRoles={[ROLES.INSTRUCTOR, ROLES.ADMIN, ROLES.SUPER_ADMIN]} />,
        children: [
          {
            element: <InstructorLayout />,
            children: [
              { index: true, element: <Navigate to={ROUTES.COURSES} replace /> },
              { path: ROUTES.INSTRUCTOR_ANALYTICS, element: suspend(<InstructorAnalyticsPage />) },
              { path: ROUTES.COURSES, element: suspend(<CourseListPage />) },
              { path: ROUTES.INSTRUCTOR_BATCHES, element: suspend(<InstructorBatchListPage />) },
              { path: ROUTES.INSTRUCTOR_CERTIFICATES, element: suspend(<InstructorCertificationHubPage />) },
              { path: ROUTES.COURSE_CREATE, element: suspend(<CreateCoursePage />) },
              { path: ROUTES.COURSE_DETAILS(), element: suspend(<CourseDetailsPage />) },
              { path: ROUTES.COURSE_EDIT(), element: suspend(<EditCoursePage />) },
              { path: ROUTES.INSTRUCTOR_RESOURCES, element: suspend(<ResourceManagementPage />) },
              { path: ROUTES.ASSESSMENTS, element: suspend(<AdminAssessmentListPage />) },
              { path: ROUTES.ASSESSMENT_CREATE, element: suspend(<CreateAssessmentPage />) },
              { path: ROUTES.INSTRUCTOR_ASSESSMENT_DETAILS(), element: suspend(<AdminAssessmentDetailsPage />) },
              { path: ROUTES.INSTRUCTOR_ASSESSMENT_EDIT(), element: suspend(<AdminEditAssessmentPage />) },
              { path: ROUTES.INSTRUCTOR_SUBMISSIONS_HISTORY, element: suspend(<GlobalSubmissionsHistoryPage />) },
              { path: ROUTES.INSTRUCTOR_GRADING, element: suspend(<GradingWorkflowPage />) },
              { path: ROUTES.INSTRUCTOR_RUBRICS, element: suspend(<RubricManagerPage />) },
              { path: ROUTES.INSTRUCTOR_ANNOUNCEMENTS, element: suspend(<AnnouncementsPage />) },
              { path: ROUTES.INSTRUCTOR_QUESTION_BANK, element: suspend(<QuestionBankPage />) },
            ],
          },
        ],
      },

      // Standalone Full-Window Lockdown Exam & Proctoring Environment
      {
        path: ROUTES.ASSESSMENT_ATTEMPT(),
        element: suspend(<StudentAssessmentTakingPage />),
      },

      {
        path: '/learn',
        element: <StudentLayout />,
        children: [
          { index: true, element: <Navigate to={ROUTES.MY_COURSES} replace /> },
          { path: ROUTES.MY_COURSES, element: suspend(<MyCoursesPage />) },
          { path: ROUTES.STUDENT_PROGRESS, element: suspend(<StudentProgressPage />) },
          { path: ROUTES.STUDENT_ASSESSMENTS, element: suspend(<AssessmentListPage />) },
          { path: ROUTES.MY_ASSESSMENTS, element: suspend(<AssessmentListPage />) },
          { path: ROUTES.CERTIFICATES, element: suspend(<CertificateListPage />) },
          { path: ROUTES.CERTIFICATE_DETAILS(), element: suspend(<CertificateDetailsPage />) },
          { path: ROUTES.GAMIFICATION, element: suspend(<GamificationDashboard />) },
          { path: ROUTES.CALENDAR, element: suspend(<StudentCalendarPage />) },
          { path: ROUTES.NOTES_BOOKMARKS, element: suspend(<NotesBookmarksPage />) },
          { path: ROUTES.ASSESSMENT_RESULT(), element: suspend(<AssessmentResultPage />) },
          { path: ROUTES.LEARNING(), element: suspend(<CourseDetailsPage />) },
          { path: ROUTES.LESSON(), element: suspend(<CourseDetailsPage />) },
          { path: ROUTES.COURSE_PLAYER(), element: suspend(<CourseDetailsPage />) },
        ],
      },

      {
        element: <RoleBasedLayout />,
        children: [
          { path: ROUTES.NOTIFICATIONS, element: suspend(<NotificationPage />) },
          { path: ROUTES.PROFILE, element: suspend(<ProfilePage />) },
          { path: ROUTES.SECURITY, element: suspend(<SecurityPage />) },
          { path: ROUTES.CHAT, element: suspend(<ChatPage />) },
          { path: ROUTES.CHAT_CHANNEL(), element: suspend(<ChatPage />) },
        ],
      },

      // First-time password change for invited users
      {
        path: ROUTES.SET_PASSWORD,
        element: <SetPasswordPage />,
      },
    ],
  },

  // Error routes
  {
    element: <ErrorLayout />,
    children: [
      { path: ROUTES.UNAUTHORIZED, element: <UnauthorizedPage /> },
      {
        path: '*',
        element: (
          <EmptyState title="404 - Page not found" description="That page does not exist." />
        ),
      },
    ],
  },
]);

export default router;
