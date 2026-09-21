import AdminNavigation from '../components/navigation/AdminNavigation';
import RouteErrorBoundary from '../components/common/RouteErrorBoundary';
import AppShell from './AppShell';

export const AdminLayout = () => (
  <RouteErrorBoundary>
    <AppShell title="Administration" navigation={<AdminNavigation />} />
  </RouteErrorBoundary>
);

export default AdminLayout;
