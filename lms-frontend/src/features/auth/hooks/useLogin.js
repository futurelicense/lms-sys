import { useCallback, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { login } from '../store/authSlice';
import { getDefaultRouteForRoles, getPrimaryRole } from '../../../constants/roles';
import { ROUTES } from '../../../constants/routes';
import storage from '../../../services/storage/localStorage';
import { STORAGE_KEYS } from '../../../constants/appConstants';
import platformAuthStorage from '../../platform/services/platformAuthStorage';
import platformService from '../../platform/services/platformService';
import { isPlatformHostname, tenantSlugFromHostname } from '../../../utils/tenantHostname';
import { categorizeAuthError } from '../../../utils/errorUtils';

export const useLogin = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const clearError = useCallback(() => setError(null), []);

  const submit = useCallback(
    async (credentials) => {
      setIsSubmitting(true);
      setError(null);
      const { tenantSlug: _tenantSlug, ...loginCredentials } = credentials;
      const slug = tenantSlugFromHostname();

      const email = loginCredentials?.email?.trim();
      const password = loginCredentials?.password;

      if (!email || !password) {
        setIsSubmitting(false);
        setError({
          type: 'VALIDATION',
          title: 'Missing Required Fields',
          message: 'Please enter both your email address and password.',
        });
        return false;
      }

      if (isPlatformHostname()) {
        storage.remove(STORAGE_KEYS.TENANT);
        try {
          const response = await platformService.login(loginCredentials);
          platformAuthStorage.setToken(response.accessToken);
          setIsSubmitting(false);
          navigate(ROUTES.PLATFORM_TENANTS, { replace: true });
          return true;
        } catch (requestError) {
          setIsSubmitting(false);
          setError(categorizeAuthError(requestError));
          return false;
        }
      }

      if (!slug) {
        setIsSubmitting(false);
        setError({
          type: 'TENANT_NOT_FOUND',
          title: 'Workspace Required',
          message: 'Please open your specific workspace URL to sign in (e.g. your-team.localhost:3000).',
        });
        return false;
      }

      platformAuthStorage.clear();
      storage.set(STORAGE_KEYS.TENANT, { slug });

      try {
        const result = await dispatch(login(loginCredentials));

        if (login.rejected.match(result)) {
          const payload = result.payload;
          setError(
            payload && typeof payload === 'object' && payload.message
              ? payload
              : {
                  type: 'UNKNOWN',
                  title: 'Sign In Failed',
                  message: typeof payload === 'string' ? payload : 'Invalid email or password. Please try again.',
                },
          );
          return false;
        }

        const primaryRole = getPrimaryRole(result.payload?.roles);
        const fallback = getDefaultRouteForRoles(result.payload?.roles);
        const returnPath = location.state?.from?.pathname;

        // Never redirect back to transient forms (e.g. /new, /edit), auth routes, or root
        const isTransientOrForm =
          returnPath &&
          (returnPath.endsWith('/new') ||
            returnPath.endsWith('/edit') ||
            returnPath.startsWith('/auth') ||
            returnPath === ROUTES.LOGIN ||
            returnPath === ROUTES.ROOT);

        // Administrators logging in should land on their dashboard overview (/admin/analytics)
        const isAdminRole = primaryRole === 'ADMIN' || primaryRole === 'SUPER_ADMIN';
        const destination =
          returnPath && !isTransientOrForm && !isAdminRole ? returnPath : fallback;

        navigate(destination, { replace: true });
        return true;
      } catch (requestError) {
        setError(categorizeAuthError(requestError));
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [dispatch, navigate, location],
  );

  return { submit, error, isSubmitting, clearError };
};

export default useLogin;
