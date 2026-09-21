import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { KeyRound, ShieldCheck, ArrowRight, Eye, EyeOff } from 'lucide-react';
import userService from '../../users/services/userService';
import { passwordChanged, logout } from '../store/authSlice';
import { normalizeError } from '../../../utils/errorUtils';
import { PASSWORD_POLICY } from '../../../utils/validationUtils';
import { ROUTES } from '../../../constants/routes';

const schema = z
  .object({
    currentPassword: z.string().min(1, 'Enter the temporary password from the invitation email'),
    newPassword: z
      .string()
      .min(PASSWORD_POLICY.minLength, `At least ${PASSWORD_POLICY.minLength} characters`)
      .regex(/[A-Z]/, 'Include an uppercase letter')
      .regex(/[a-z]/, 'Include a lowercase letter')
      .regex(/[0-9]/, 'Include a number')
      .regex(/[^A-Za-z0-9]/, 'Include a special character'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

function PasswordInput({ label, error, ...props }) {
  const [show, setShow] = useState(false);
  return (
    <div className="set-pw__field">
      <label className="set-pw__label">{label}</label>
      <div className="set-pw__input-wrap">
        <input
          {...props}
          type={show ? 'text' : 'password'}
          className={`set-pw__input${error ? ' set-pw__input--error' : ''}`}
          autoComplete="new-password"
        />
        <button
          type="button"
          className="set-pw__eye"
          onClick={() => setShow((s) => !s)}
          tabIndex={-1}
          aria-label={show ? 'Hide password' : 'Show password'}
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {error && <p className="set-pw__error">{error}</p>}
    </div>
  );
}

export const SetPasswordPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async ({ currentPassword, newPassword }) => {
    setServerError(null);
    try {
      await userService.changePassword({ currentPassword, newPassword });
      // Update Redux state so mustChangePassword is cleared
      dispatch(passwordChanged());
      navigate(ROUTES.PROFILE, { replace: true });
    } catch (err) {
      setServerError(normalizeError(err).message);
    }
  };

  const handleLogout = () => dispatch(logout());

  return (
    <div className="set-pw__page">
      <div className="set-pw__card">
        {/* Header */}
        <div className="set-pw__header">
          <div className="set-pw__icon-wrap">
            <KeyRound size={28} />
          </div>
          <h1 className="set-pw__title">Set your password</h1>
          <p className="set-pw__subtitle">
            You logged in with a temporary password. Please create a secure password to continue.
          </p>
        </div>

        {serverError && (
          <div className="set-pw__alert set-pw__alert--error" role="alert">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="set-pw__form">
          <PasswordInput
            label="Temporary password (from your invitation email)"
            error={errors.currentPassword?.message}
            {...register('currentPassword')}
            autoComplete="current-password"
          />
          <PasswordInput
            label="New password"
            error={errors.newPassword?.message}
            {...register('newPassword')}
          />
          <PasswordInput
            label="Confirm new password"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />

          {/* Password requirements hint */}
          <div className="set-pw__hints">
            <ShieldCheck size={14} className="set-pw__hints-icon" />
            <span>
              Must be {PASSWORD_POLICY.minLength}+ characters with uppercase, lowercase, number, and
              symbol.
            </span>
          </div>

          <button type="submit" className="set-pw__submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <span className="set-pw__spinner" />
            ) : (
              <>
                Activate account <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div className="set-pw__footer">
          <button type="button" className="set-pw__logout" onClick={handleLogout}>
            Sign out and use a different account
          </button>
        </div>
      </div>

      <style>{`
        .set-pw__page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
          padding: 1.5rem;
        }
        .set-pw__card {
          width: 100%;
          max-width: 440px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          backdrop-filter: blur(16px);
          border-radius: 20px;
          padding: 2.5rem 2rem;
          box-shadow: 0 25px 60px rgba(0,0,0,0.4);
          color: #f1f5f9;
        }
        .set-pw__header {
          text-align: center;
          margin-bottom: 2rem;
        }
        .set-pw__icon-wrap {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          margin-bottom: 1.25rem;
          color: white;
          box-shadow: 0 0 30px rgba(99,102,241,0.4);
        }
        .set-pw__title {
          font-size: 1.5rem;
          font-weight: 700;
          margin: 0 0 0.5rem;
          color: #f8fafc;
        }
        .set-pw__subtitle {
          font-size: 0.875rem;
          color: #94a3b8;
          margin: 0;
          line-height: 1.5;
        }
        .set-pw__alert {
          border-radius: 10px;
          padding: 0.75rem 1rem;
          font-size: 0.875rem;
          margin-bottom: 1.25rem;
        }
        .set-pw__alert--error {
          background: rgba(239,68,68,0.12);
          border: 1px solid rgba(239,68,68,0.3);
          color: #fca5a5;
        }
        .set-pw__form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .set-pw__field {
          display: flex;
          flex-direction: column;
          gap: 0.375rem;
        }
        .set-pw__label {
          font-size: 0.8125rem;
          font-weight: 500;
          color: #cbd5e1;
        }
        .set-pw__input-wrap {
          position: relative;
        }
        .set-pw__input {
          width: 100%;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 10px;
          padding: 0.625rem 2.5rem 0.625rem 0.875rem;
          font-size: 0.9375rem;
          color: #f1f5f9;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          box-sizing: border-box;
        }
        .set-pw__input:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99,102,241,0.2);
        }
        .set-pw__input--error {
          border-color: rgba(239,68,68,0.6);
        }
        .set-pw__eye {
          position: absolute;
          right: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #64748b;
          cursor: pointer;
          padding: 0;
          display: flex;
          align-items: center;
          transition: color 0.2s;
        }
        .set-pw__eye:hover { color: #94a3b8; }
        .set-pw__error {
          font-size: 0.75rem;
          color: #f87171;
          margin: 0;
        }
        .set-pw__hints {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          font-size: 0.75rem;
          color: #64748b;
          padding: 0.625rem 0.75rem;
          background: rgba(255,255,255,0.03);
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.06);
        }
        .set-pw__hints-icon {
          color: #6366f1;
          flex-shrink: 0;
          margin-top: 1px;
        }
        .set-pw__submit {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: white;
          border: none;
          border-radius: 10px;
          padding: 0.75rem;
          font-size: 0.9375rem;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.1s;
          margin-top: 0.5rem;
        }
        .set-pw__submit:hover:not(:disabled) {
          opacity: 0.9;
          transform: translateY(-1px);
        }
        .set-pw__submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .set-pw__spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .set-pw__footer {
          margin-top: 1.5rem;
          text-align: center;
        }
        .set-pw__logout {
          background: none;
          border: none;
          color: #64748b;
          font-size: 0.8125rem;
          cursor: pointer;
          text-decoration: underline;
          transition: color 0.2s;
        }
        .set-pw__logout:hover { color: #94a3b8; }
      `}</style>
    </div>
  );
};

export default SetPasswordPage;
