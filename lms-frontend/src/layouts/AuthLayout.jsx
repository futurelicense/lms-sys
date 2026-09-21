import { Outlet, useLocation } from 'react-router-dom';
import appConfig from '../config/appConfig';
import { ROUTES } from '../constants/routes';
import ThemeSlider from '../components/common/ThemeSlider';

const styles = {
  page: { minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 'var(--space-5)' },
  card: {
    width: '100%',
    maxWidth: 420,
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow-md)',
    padding: 'var(--space-6)',
  },
};

export const AuthLayout = () => {
  const location = useLocation();

  return (
    <>
      {/* Universal Theme Switcher for all Auth Domain screens */}
      <div
        style={{
          position: 'fixed',
          top: 20,
          right: 24,
          zIndex: 9999,
        }}
      >
        <ThemeSlider size="md" />
      </div>

      {location.pathname === ROUTES.LOGIN || location.pathname.startsWith('/auth/accept-invitation') ? (
        <Outlet />
      ) : (
        <main style={styles.page}>
          <div style={styles.card}>
            <h2 className="u-mb-4">{appConfig.name}</h2>
            <Outlet />
          </div>
        </main>
      )}
    </>
  );
};

export default AuthLayout;
