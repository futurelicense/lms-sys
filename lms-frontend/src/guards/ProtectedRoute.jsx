import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectAuthStatus, selectMustChangePassword } from '../features/auth/store/authSlice';
import { ROUTES } from '../constants/routes';
import Spinner from '../components/common/Spinner';

/**
 * Blocks unauthenticated access and remembers where the user was headed.
 * Also intercepts users that still have a temporary password and routes them
 * to the set-password page before allowing any other navigation.
 */
export const ProtectedRoute = ({ children }) => {
  const status = useSelector(selectAuthStatus);
  const mustChangePassword = useSelector(selectMustChangePassword);
  const location = useLocation();

  if (status === 'idle' || status === 'loading') return <Spinner fullPage />;

  if (status !== 'authenticated') {
    const isFormOrAuthPath =
      location.pathname.endsWith('/new') ||
      location.pathname.endsWith('/edit') ||
      location.pathname.startsWith('/auth');
    return (
      <Navigate
        to={ROUTES.LOGIN}
        state={isFormOrAuthPath ? undefined : { from: location }}
        replace
      />
    );
  }

  // Invited user on their first login — force them to set a real password
  if (mustChangePassword && location.pathname !== ROUTES.SET_PASSWORD) {
    return <Navigate to={ROUTES.SET_PASSWORD} replace />;
  }

  return children ?? <Outlet />;
};

export default ProtectedRoute;
