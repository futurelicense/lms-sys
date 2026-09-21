import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Lock,
} from 'lucide-react';
import { acceptInvitation } from '../store/authSlice';
import { ROUTES } from '../../../constants/routes';

const PASSWORD_RULES = [
  { label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { label: 'One uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { label: 'One lowercase letter', test: (p) => /[a-z]/.test(p) },
  { label: 'One number', test: (p) => /\d/.test(p) },
];

/**
 * AcceptInvitationPage
 *
 * Handles the magic link: /auth/accept-invitation?token=XYZ
 * The user sets their permanent password here. On success they are
 * immediately logged in and redirected to their dashboard.
 */
export const AcceptInvitationPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const token = searchParams.get('token') ?? '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // If no token in URL, show an error immediately
  const noToken = !token;

  const rules = PASSWORD_RULES.map((r) => ({ ...r, passed: r.test(newPassword) }));
  const passwordStrong = rules.every((r) => r.passed);
  const passwordsMatch = newPassword === confirmPassword && confirmPassword !== '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!passwordStrong) {
      setError('Please choose a stronger password.');
      return;
    }
    if (!passwordsMatch) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const result = await dispatch(acceptInvitation({ token, newPassword }));
      if (acceptInvitation.fulfilled.match(result)) {
        setSuccess(true);
        // Redirect after a brief success flash
        setTimeout(() => navigate(ROUTES.DASHBOARD, { replace: true }), 1500);
      } else {
        setError(result.payload?.message ?? 'Something went wrong. The link may have expired.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (noToken) {
    return (
      <div className="accept-inv__wrap" style={styles.wrap}>
        <div style={{ ...styles.card, maxWidth: 460 }}>
          <div style={styles.iconWrap('#fee2e2')}>
            <AlertCircle size={28} color="#ef4444" />
          </div>
          <h1 style={styles.title}>Invalid Link</h1>
          <p style={styles.body}>
            This invitation link is missing or malformed. Please use the link from your invitation
            email, or contact your administrator.
          </p>
          <Link to={ROUTES.LOGIN} style={styles.btn}>
            Go to Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div style={styles.wrap}>
        <div style={{ ...styles.card, maxWidth: 460, textAlign: 'center' }}>
          <div style={styles.iconWrap('#dcfce7')}>
            <CheckCircle2 size={32} color="#16a34a" />
          </div>
          <h1 style={styles.title}>Account activated!</h1>
          <p style={styles.body}>Your password has been set. Redirecting to your dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.wrap}>
      {/* Left branding panel */}
      <div className="accept-inv__left" style={styles.leftPanel}>
        <div style={styles.leftContent}>
          <div style={styles.logoArea}>
            <div style={styles.logoIcon}>
              <ShieldCheck size={28} color="#fff" />
            </div>
            <span style={styles.logoText}>LMS Platform</span>
          </div>
          <h2 style={styles.brandHeading}>You&apos;ve been invited!</h2>
          <p style={styles.brandBody}>
            Set up your password to activate your account and get full access to the Learning
            Management System.
          </p>
          <div style={styles.featureList}>
            {[
              'Access your courses & learning materials',
              'Track progress and certifications',
              'Collaborate with your team',
            ].map((f, i) => (
              <div key={i} style={styles.featureItem}>
                <CheckCircle2 size={16} style={{ color: '#a5f3c4', flexShrink: 0 }} />
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div style={styles.rightPanel}>
        <div style={styles.card}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ ...styles.iconWrap('rgba(99,102,241,0.12)'), margin: '0 auto 16px' }}>
              <ShieldCheck size={28} color="#6366f1" />
            </div>
            <h1 style={styles.title}>Create your password</h1>
            <p style={styles.body}>
              Welcome! Choose a secure password to activate your LMS account.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div style={styles.errorBox}>
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {/* New Password */}
            <div style={styles.fieldGroup}>
              <label style={styles.label}>New Password</label>
              <div style={styles.inputWrap}>
                <Lock size={16} style={styles.inputIcon} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Choose a strong password"
                  required
                  autoFocus
                  style={styles.input}
                  onFocus={(e) => (e.target.style.borderColor = '#6366f1')}
                  onBlur={(e) => (e.target.style.borderColor = 'var(--border-color)')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={styles.eyeBtn}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Password strength rules */}
              {newPassword && (
                <div style={styles.rules}>
                  {rules.map((r) => (
                    <div key={r.label} style={styles.rule(r.passed)}>
                      <CheckCircle2 size={13} />
                      <span>{r.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Confirm Password</label>
              <div style={styles.inputWrap}>
                <Lock size={16} style={styles.inputIcon} />
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  required
                  style={{
                    ...styles.input,
                    borderColor: confirmPassword
                      ? passwordsMatch
                        ? '#16a34a'
                        : '#ef4444'
                      : 'var(--border-color)',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  style={styles.eyeBtn}
                  aria-label="Toggle confirm password visibility"
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {confirmPassword && !passwordsMatch && (
                <p style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>
                  Passwords do not match
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !passwordStrong || !passwordsMatch}
              style={styles.submitBtn(loading || !passwordStrong || !passwordsMatch)}
            >
              {loading ? (
                'Activating…'
              ) : (
                <>
                  <span>Activate Account</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <p
            style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: 'var(--text-muted)' }}
          >
            Already have an account?{' '}
            <Link
              to={ROUTES.LOGIN}
              style={{ color: '#6366f1', fontWeight: 600, textDecoration: 'none' }}
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

// ─── Inline styles ──────────────────────────────────────────────────────────
const styles = {
  wrap: {
    minHeight: '100vh',
    display: 'flex',
  },
  leftPanel: {
    flex: 1,
    background: 'linear-gradient(135deg, #312e81 0%, #4f46e5 50%, #7c3aed 100%)',
    padding: '48px 56px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leftContent: {
    maxWidth: 400,
    color: '#fff',
  },
  logoArea: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 48,
  },
  logoIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    background: 'rgba(255,255,255,0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 20,
    fontWeight: 700,
    color: '#fff',
    letterSpacing: '-0.02em',
  },
  brandHeading: {
    fontSize: 36,
    fontWeight: 800,
    color: '#fff',
    margin: '0 0 16px',
    lineHeight: 1.2,
    letterSpacing: '-0.03em',
  },
  brandBody: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.75)',
    lineHeight: 1.7,
    margin: '0 0 32px',
  },
  featureList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  featureItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    fontSize: 15,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 1.5,
  },
  rightPanel: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--bg)',
    padding: '32px 24px',
    minHeight: '100vh',
  },
  card: {
    background: 'var(--surface-dark)',
    border: '1px solid var(--border-color)',
    borderRadius: 20,
    padding: '40px 36px',
    width: '100%',
    maxWidth: 460,
    boxShadow: '0 8px 40px rgba(0,0,0,0.12)',
  },
  iconWrap: (bg) => ({
    width: 60,
    height: 60,
    borderRadius: '50%',
    background: bg,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }),
  title: {
    fontSize: 24,
    fontWeight: 700,
    color: 'var(--text-primary)',
    margin: '0 0 8px',
    letterSpacing: '-0.02em',
  },
  body: {
    fontSize: 14,
    color: 'var(--text-muted)',
    lineHeight: 1.6,
    margin: 0,
  },
  errorBox: {
    background: 'rgba(239,68,68,0.1)',
    border: '1px solid rgba(239,68,68,0.3)',
    borderRadius: 10,
    padding: '12px 14px',
    color: '#f87171',
    fontSize: 13,
    display: 'flex',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 20,
  },
  fieldGroup: {
    marginBottom: 20,
  },
  label: {
    display: 'block',
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--text-secondary)',
    marginBottom: 8,
  },
  inputWrap: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: 14,
    color: 'var(--text-muted)',
    pointerEvents: 'none',
  },
  input: {
    width: '100%',
    padding: '12px 44px',
    background: 'var(--input-bg)',
    border: '1px solid var(--border-color)',
    borderRadius: 12,
    color: 'var(--text-primary)',
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
    fontFamily: 'Inter, sans-serif',
  },
  eyeBtn: {
    position: 'absolute',
    right: 14,
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    padding: 0,
    display: 'flex',
    alignItems: 'center',
  },
  rules: {
    marginTop: 10,
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  rule: (passed) => ({
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 12,
    color: passed ? '#4ade80' : 'var(--text-muted)',
    transition: 'color 0.2s',
  }),
  submitBtn: (disabled) => ({
    width: '100%',
    padding: '14px 20px',
    background: disabled ? 'var(--surface-medium)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    border: 'none',
    borderRadius: 12,
    color: disabled ? 'var(--text-muted)' : '#fff',
    fontSize: 15,
    fontWeight: 700,
    cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    transition: 'all 0.2s',
    marginTop: 8,
  }),
  btn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    padding: '12px 28px',
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    borderRadius: 12,
    color: '#fff',
    fontWeight: 700,
    fontSize: 14,
    textDecoration: 'none',
    width: '100%',
    boxSizing: 'border-box',
  },
};

export default AcceptInvitationPage;
