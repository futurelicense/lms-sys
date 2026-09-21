import { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { ROLES } from '../constants/roles';

const EMPTY = Object.freeze([]);

/**
 * Client-side permission checks are a UX affordance only.
 * The API must enforce the same rules - never treat this as a security boundary.
 */
export const usePermission = () => {
  const user = useSelector((state) => state.auth.user);

  // Stable references keep the memoised callbacks below from changing every render.
  const permissions = useMemo(() => user?.permissions ?? EMPTY, [user]);
  const roles = useMemo(() => user?.roles ?? EMPTY, [user]);
  const isSuperAdmin = roles.includes(ROLES.SUPER_ADMIN) || roles.includes(ROLES.ADMIN);

  const hasPermission = useCallback(
    (permission) => isSuperAdmin || permissions.includes(permission),
    [isSuperAdmin, permissions],
  );

  const hasAnyPermission = useCallback(
    (list = []) => list.length === 0 || list.some(hasPermission),
    [hasPermission],
  );

  const hasAllPermissions = useCallback((list = []) => list.every(hasPermission), [hasPermission]);

  const hasRole = useCallback((role) => roles.includes(role), [roles]);

  const hasAnyRole = useCallback(
    (list = []) => list.length === 0 || list.some((role) => roles.includes(role)),
    [roles],
  );

  return {
    permissions,
    roles,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasAnyRole,
  };
};

export default usePermission;
