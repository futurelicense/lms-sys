import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { SignInPage } from '../../../components/ui/sign-in';
import { ROUTES } from '../../../constants/routes';
import { getDefaultRouteForRoles } from '../../../constants/roles';
import environment from '../../../config/environment';
import { isPlatformHostname, tenantSlugFromHostname } from '../../../utils/tenantHostname';
import useLogin from '../hooks/useLogin';
import { loginDemo } from '../store/authSlice';
import { DEMO_ROLE_OPTIONS } from '../constants/demoUsers';

const testimonials = [
  {
    avatarSrc: 'https://randomuser.me/api/portraits/women/57.jpg',
    name: 'Sarah Chen',
    handle: '@sarahdigital',
    text: 'Amazing platform! The user experience is seamless and the features are exactly what I needed.',
  },
  {
    avatarSrc: 'https://randomuser.me/api/portraits/men/64.jpg',
    name: 'Marcus Johnson',
    handle: '@marcustech',
    text: 'This service has transformed how I work. Clean design, powerful features, and excellent support.',
  },
];

export const LoginPage = () => {
  const { submit, error, isSubmitting, clearError } = useLogin();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const tenantSlug = tenantSlugFromHostname();
  const platformLogin = isPlatformHostname();
  const showDemoLogin = environment.enableDemoLogin && !platformLogin;

  const handleSignIn = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    await submit({
      email: formData.get('email'),
      password: formData.get('password'),
      tenantSlug: formData.get('tenantSlug'),
      rememberMe: formData.has('rememberMe'),
    });
  };

  const handleDemoLogin = async (roleKey) => {
    clearError();
    const result = await dispatch(loginDemo(roleKey));
    if (loginDemo.fulfilled.match(result)) {
      navigate(getDefaultRouteForRoles(result.payload?.roles), { replace: true });
    }
  };

  return (
    <SignInPage
      heroImageSrc="https://images.unsplash.com/photo-1642615835477-d303d7dc9ee9?w=2160&q=80"
      testimonials={testimonials}
      onSignIn={handleSignIn}
      onResetPassword={() => navigate(ROUTES.FORGOT_PASSWORD)}
      error={error}
      errorMessage={error?.message}
      onDismissError={clearError}
      isSubmitting={isSubmitting}
      description={platformLogin
        ? 'Sign in to manage tenant databases and their lifecycle.'
        : tenantSlug
          ? `Sign in to the ${tenantSlug} learning workspace.`
          : 'Open a tenant workspace URL to sign in, or use demo access below.'}
      showTenantSlug={false}
      demoLogin={
        showDemoLogin
          ? {
              options: DEMO_ROLE_OPTIONS,
              onSelect: handleDemoLogin,
              hint: 'Fully offline — seeded courses, students, assessments, and more. No backend calls.',
            }
          : null
      }
    />
  );
};

export default LoginPage;
