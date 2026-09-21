import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated, selectUser, selectMustChangePassword } from '../features/auth/store/authSlice';
import { getDefaultRouteForRoles } from '../constants/roles';
import { ROUTES } from '../constants/routes';
import platformAuthStorage from '../features/platform/services/platformAuthStorage';
import { isPlatformHostname } from '../utils/tenantHostname';

/** Keeps signed-in users away from login/reset pages. */
export const GuestRoute = ({ children }) => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectUser);
  const mustChangePassword = useSelector(selectMustChangePassword);

  if (platformAuthStorage.getToken() && isPlatformHostname()) {
    return <Navigate to={ROUTES.PLATFORM_DASHBOARD} replace />;
  }

  if (isAuthenticated) {
    // Invited user that still has temp password must go straight to set-password
    if (mustChangePassword) {
      return <Navigate to={ROUTES.SET_PASSWORD} replace />;
    }
    return <Navigate to={getDefaultRouteForRoles(user?.roles)} replace />;
  }

  return children ?? <Outlet />;
};

export default GuestRoute;
