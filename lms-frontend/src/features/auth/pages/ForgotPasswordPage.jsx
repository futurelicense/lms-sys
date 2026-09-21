import { Link } from 'react-router-dom';
import ForgotPasswordForm from '../components/ForgotPasswordForm';
import { ROUTES } from '../../../constants/routes';

export const ForgotPasswordPage = () => (
  <>
    <h3 className="u-mb-4">Reset your password</h3>
    <ForgotPasswordForm />
    <p className="u-mt-4 u-text-sm">
      <Link to={ROUTES.LOGIN}>Back to sign in</Link>
    </p>
  </>
);

export default ForgotPasswordPage;
