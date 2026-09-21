import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useMemo } from 'react';
import { Eye, EyeOff, KeyRound, ShieldCheck, Check, X, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import Input from '../../../components/common/Input';
import Button from '../../../components/common/Button';
import Alert from '../../../components/feedback/Alert';
import { changePasswordSchema } from '../validation/profileSchemas';
import profileService from '../services/profileService';
import { normalizeError } from '../../../utils/errorUtils';
import { useToast } from '../../../components/feedback/Toast';

export const ChangePasswordForm = () => {
  const toast = useToast();
  const [error, setError] = useState(null);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const newPassword = watch('newPassword') || '';

  // Password strength calculation
  const strengthMetrics = useMemo(() => {
    const checks = {
      length: newPassword.length >= 8,
      uppercase: /[A-Z]/.test(newPassword),
      number: /[0-9]/.test(newPassword),
      special: /[^A-Za-z0-9]/.test(newPassword),
    };

    const count = Object.values(checks).filter(Boolean).length;
    let score = 0;
    let label = 'Very Weak';
    let color = '#ef4444';

    if (count === 1) { score = 25; label = 'Weak'; color = '#ef4444'; }
    else if (count === 2) { score = 50; label = 'Fair'; color = '#f59e0b'; }
    else if (count === 3) { score = 75; label = 'Strong'; color = '#3b82f6'; }
    else if (count === 4) { score = 100; label = 'Excellent'; color = '#10b981'; }

    return { checks, score, label, color };
  }, [newPassword]);

  const onSubmit = async (values) => {
    try {
      await profileService.changePassword(values);
      toast.success('Password updated successfully');
      reset();
      setError(null);
    } catch (submitError) {
      setError(normalizeError(submitError));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {error && <Alert tone="error">{error.message}</Alert>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
        {/* Current Password */}
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
            <KeyRound size={15} style={{ color: 'var(--primary, #6366f1)' }} />
            Current Password <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <div style={{ position: 'relative' }}>
            <Input
              type={showCurrent ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••••••"
              error={errors.currentPassword?.message}
              {...register('currentPassword')}
            />
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              style={{
                position: 'absolute',
                right: 12,
                top: 12,
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* New Password */}
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
            <Lock size={15} style={{ color: 'var(--primary, #6366f1)' }} />
            New Password <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <div style={{ position: 'relative' }}>
            <Input
              type={showNew ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="••••••••••••"
              error={errors.newPassword?.message}
              {...register('newPassword')}
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              style={{
                position: 'absolute',
                right: 12,
                top: 12,
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Confirm Password */}
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
            <ShieldCheck size={15} style={{ color: 'var(--primary, #6366f1)' }} />
            Confirm New Password <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <div style={{ position: 'relative' }}>
            <Input
              type={showConfirm ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="••••••••••••"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              style={{
                position: 'absolute',
                right: 12,
                top: 12,
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
      </div>

      {/* Password Strength Card */}
      {newPassword.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            padding: 16,
            borderRadius: 12,
            background: 'var(--surface-medium, #1e293b)',
            border: '1px solid var(--border-color, #334155)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Password Strength:</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: strengthMetrics.color }}>
              {strengthMetrics.label}
            </span>
          </div>

          {/* Progress bar */}
          <div style={{ height: 6, width: '100%', background: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden', marginBottom: 12 }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${strengthMetrics.score}%` }}
              style={{ height: '100%', background: strengthMetrics.color, transition: 'width 0.3s ease' }}
            />
          </div>

          {/* Criteria Checklist */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8 }}>
            <span style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, color: strengthMetrics.checks.length ? '#10b981' : 'var(--text-muted)' }}>
              {strengthMetrics.checks.length ? <Check size={14} /> : <X size={14} />} At least 8 characters
            </span>
            <span style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, color: strengthMetrics.checks.uppercase ? '#10b981' : 'var(--text-muted)' }}>
              {strengthMetrics.checks.uppercase ? <Check size={14} /> : <X size={14} />} Uppercase letter (A-Z)
            </span>
            <span style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, color: strengthMetrics.checks.number ? '#10b981' : 'var(--text-muted)' }}>
              {strengthMetrics.checks.number ? <Check size={14} /> : <X size={14} />} Numeric digit (0-9)
            </span>
            <span style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, color: strengthMetrics.checks.special ? '#10b981' : 'var(--text-muted)' }}>
              {strengthMetrics.checks.special ? <Check size={14} /> : <X size={14} />} Special character (!@#$)
            </span>
          </div>
        </motion.div>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 16, borderTop: '1px solid var(--border-color)' }}>
        <Button
          type="submit"
          isLoading={isSubmitting}
          style={{
            padding: '10px 24px',
            borderRadius: 10,
            fontWeight: 600,
            boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)',
          }}
        >
          Update Password
        </Button>
      </div>
    </form>
  );
};

export default ChangePasswordForm;
