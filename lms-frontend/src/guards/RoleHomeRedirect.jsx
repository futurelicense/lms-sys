import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  selectAuthStatus,
  selectMustChangePassword,
  selectUser,
} from '../features/auth/store/authSlice';
import { getDefaultRouteForRoles } from '../constants/roles';
import { ROUTES } from '../constants/routes';
import Spinner from '../components/common/Spinner';

/** Redirects a signed-in user to the canonical workspace for their roles. */
const RoleHomeRedirect = () => {
  const status = useSelector(selectAuthStatus);
  const user = useSelector(selectUser);
  const mustChangePassword = useSelector(selectMustChangePassword);

  if (status === 'idle' || status === 'loading') return <Spinner fullPage />;
  if (status !== 'authenticated') return <Navigate to={ROUTES.LOGIN} replace />;
  if (mustChangePassword) return <Navigate to={ROUTES.SET_PASSWORD} replace />;

  return <Navigate to={getDefaultRouteForRoles(user?.roles)} replace />;
};

export default RoleHomeRedirect;
