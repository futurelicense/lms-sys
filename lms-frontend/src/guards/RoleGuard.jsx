import { Navigate, Outlet } from 'react-router-dom';
import usePermission from '../hooks/usePermission';
import { ROUTES } from '../constants/routes';

/** @param {string[]} allowedRoles */
export const RoleGuard = ({ allowedRoles = [], children }) => {
  const { hasAnyRole } = usePermission();

  if (!hasAnyRole(allowedRoles)) {
    return <Navigate to={ROUTES.UNAUTHORIZED} replace />;
  }

  return children ?? <Outlet />;
};

export default RoleGuard;
