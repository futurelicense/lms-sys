import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { User, Mail, Phone, Briefcase, FileText, Lock, Save, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import Input from '../../../components/common/Input';
import TextArea from '../../../components/common/TextArea';
import Button from '../../../components/common/Button';
import Alert from '../../../components/feedback/Alert';
import { profileSchema } from '../validation/profileSchemas';

export const ProfileForm = ({ defaultValues, onSubmit, error = null }) => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting, isDirty },
  } = useForm({
    resolver: zodResolver(profileSchema),
    values: {
      fullName: defaultValues?.fullName || defaultValues?.name || '',
      phone: defaultValues?.phone || '',
      jobTitle: defaultValues?.jobTitle || '',
      bio: defaultValues?.bio || '',
    },
  });

  const bioValue = watch('bio') || '';

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {error && <Alert tone="error">{error.message}</Alert>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
        {/* Full Name */}
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
            <User size={15} style={{ color: 'var(--primary, #6366f1)' }} />
            Full Name <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <Input
            required
            placeholder="John Doe"
            error={errors.fullName?.message}
            {...register('fullName')}
          />
        </div>

        {/* Email Address (Read-only) */}
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
            <Mail size={15} style={{ color: 'var(--primary, #6366f1)' }} />
            Email Address
            <span style={{ fontSize: 11, background: 'var(--surface-medium)', border: '1px solid var(--border-color)', padding: '1px 6px', borderRadius: 4, color: 'var(--text-muted)' }}>
              <Lock size={10} style={{ display: 'inline', marginRight: 3 }} /> System Locked
            </span>
          </label>
          <Input
            value={defaultValues?.email || ''}
            disabled
            helperText="Email is bound to your account and managed by administrators."
          />
        </div>

        {/* Phone Number */}
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
            <Phone size={15} style={{ color: 'var(--primary, #6366f1)' }} />
            Phone Number
          </label>
          <Input
            placeholder="+1 (555) 000-0000"
            error={errors.phone?.message}
            {...register('phone')}
          />
        </div>

        {/* Job Title / Role */}
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
            <Briefcase size={15} style={{ color: 'var(--primary, #6366f1)' }} />
            Job Title / Designation
          </label>
          <Input
            placeholder="e.g. Senior Software Engineer / Lead Instructor"
            error={errors.jobTitle?.message}
            {...register('jobTitle')}
          />
        </div>
      </div>

      {/* Bio Field with Character Counter */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
            <FileText size={15} style={{ color: 'var(--primary, #6366f1)' }} />
            Bio & About Me
          </label>
          <span style={{ fontSize: 11, fontWeight: 500, color: bioValue.length > 450 ? '#f59e0b' : 'var(--text-muted)' }}>
            {bioValue.length} / 500 characters
          </span>
        </div>
        <TextArea
          rows={10}
          style={{ minHeight: 200, resize: 'vertical' }}
          placeholder="Write a brief professional summary to display on your profile and course cards..."
          error={errors.bio?.message}
          {...register('bio')}
        />
      </div>

      {/* Submit Button Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12, paddingTop: 16, borderTop: '1px solid var(--border-color)' }}>
        {isDirty && (
          <span style={{ fontSize: 12, color: '#f59e0b', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
            Unsaved changes detected
          </span>
        )}
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            type="submit"
            isLoading={isSubmitting}
            style={{
              padding: '10px 24px',
              borderRadius: 10,
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'linear-gradient(135deg, #1d4ed8, #2563eb)',
              color: '#ffffff',
              boxShadow: '0 4px 16px rgba(29, 78, 216, 0.4)',
            }}
          >
            <Save size={16} />
            Save Profile Changes
          </Button>
        </motion.div>
      </div>
    </form>
  );
};

export default ProfileForm;
