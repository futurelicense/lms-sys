import { Navigate, Outlet } from 'react-router-dom';
import usePermission from '../hooks/usePermission';
import { ROUTES } from '../constants/routes';

/**
 * Route- or element-level permission check.
 * Pass `fallback` to hide UI instead of redirecting.
 */
export const PermissionGuard = ({ required = [], requireAll = false, fallback, children }) => {
  const { hasAllPermissions, hasAnyPermission } = usePermission();
  const allowed = requireAll ? hasAllPermissions(required) : hasAnyPermission(required);

  if (!allowed) {
    if (fallback !== undefined) return fallback;
    return <Navigate to={ROUTES.UNAUTHORIZED} replace />;
  }

  return children ?? <Outlet />;
};

export default PermissionGuard;
