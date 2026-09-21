import StudentNavigation from '../components/navigation/StudentNavigation';
import RouteErrorBoundary from '../components/common/RouteErrorBoundary';
import AppShell from './AppShell';

export const StudentLayout = () => (
  <RouteErrorBoundary>
    <AppShell title="Learning" navigation={<StudentNavigation />} />
  </RouteErrorBoundary>
);

export default StudentLayout;
