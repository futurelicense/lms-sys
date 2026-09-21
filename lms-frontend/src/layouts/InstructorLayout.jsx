import InstructorNavigation from '../components/navigation/InstructorNavigation';
import RouteErrorBoundary from '../components/common/RouteErrorBoundary';
import AppShell from './AppShell';

export const InstructorLayout = () => (
  <RouteErrorBoundary>
    <AppShell title="Teaching" navigation={<InstructorNavigation />} />
  </RouteErrorBoundary>
);

export default InstructorLayout;
