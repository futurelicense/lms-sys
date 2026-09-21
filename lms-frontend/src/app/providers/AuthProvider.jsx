import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { loadSession, sessionExpired } from '../../features/auth/store/authSlice';
import { clearDemoSession } from '../../features/auth/services/demoSession';
import Spinner from '../../components/common/Spinner';

/**
 * Bootstraps the session once on mount and listens for the global
 * `auth:session-expired` event raised by the axios response interceptor.
 */
export const AuthProvider = ({ children }) => {
  const dispatch = useDispatch();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    dispatch(loadSession()).finally(() => {
      setInitialized(true);
    });
  }, [dispatch]);

  useEffect(() => {
    const handler = () => {
      clearDemoSession();
      dispatch(sessionExpired());
    };
    window.addEventListener('auth:session-expired', handler);
    return () => window.removeEventListener('auth:session-expired', handler);
  }, [dispatch]);

  if (!initialized) {
    return <Spinner fullPage label="Loading your workspace" />;
  }

  return children;
};

export default AuthProvider;
