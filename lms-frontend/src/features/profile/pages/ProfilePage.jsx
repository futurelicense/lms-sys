import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User, Shield, Laptop, BadgeInfo, CheckCircle2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PageContainer from '../../../components/layout/PageContainer';
import Card from '../../../components/common/Card';
import Spinner from '../../../components/common/Spinner';
import ErrorState from '../../../components/common/ErrorState';
import ProfileForm from '../components/ProfileForm';
import ProfileAvatar from '../components/ProfileAvatar';
import ChangePasswordForm from '../components/ChangePasswordForm';
import ActiveSessionsCard from '../components/ActiveSessionsCard';
import AccountDetailsTab from '../components/AccountDetailsTab';
import profileService from '../services/profileService';
import { QUERY_KEYS } from '../../../constants/appConstants';
import { useToast } from '../../../components/feedback/Toast';

export const ProfilePage = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const queryClient = useQueryClient();
  const toast = useToast();

  const { data: userProfile, isLoading, error, refetch } = useQuery({
    queryKey: QUERY_KEYS.PROFILE,
    queryFn: profileService.get,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PROFILE });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CURRENT_USER });
  };

  const save = useMutation({
    mutationFn: profileService.update,
    onSuccess: () => {
      toast.success('Profile updated successfully');
      invalidate();
    },
  });

  const uploadAvatar = useMutation({
    mutationFn: profileService.uploadAvatar,
    onSuccess: () => {
      toast.success('Profile photo updated');
      invalidate();
    },
  });

  if (isLoading) return <Spinner fullPage />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  const user = userProfile || {};

  const tabs = [
    { id: 'profile', label: 'Personal Profile', icon: User },
    { id: 'security', label: 'Security & Password', icon: Shield },
    { id: 'sessions', label: 'Active Sessions', icon: Laptop },
    { id: 'account', label: 'Account & Permissions', icon: BadgeInfo },
  ];

  // Calculate profile completion score
  const completionScore = [
    user.fullName || user.name,
    user.email,
    user.phone,
    user.jobTitle,
    user.bio,
    user.avatarUrl || user.profileImageUrl,
  ].filter(Boolean).length;

  const completionPercent = Math.round((completionScore / 6) * 100);

  const primaryRole = (user.roles?.[0] || 'User').toString().toUpperCase();

  return (
    <PageContainer
      title="Account & Profile Management"
      subtitle="Manage your identity settings, multi-factor security, active sessions, and system permissions."
    >
      {/* Subtle, Elegant, Light/Dark Theme Adaptive Profile Banner */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        style={{
          position: 'relative',
          borderRadius: 16,
          padding: '24px 28px',
          marginBottom: 24,
          background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 50%, #1d4ed8 100%)',
          border: '1px solid rgba(255,255,255,0.25)',
          boxShadow: '0 8px 28px rgba(37, 99, 235, 0.35), 0 1px 0 rgba(255,255,255,0.2) inset',
          overflow: 'hidden',
        }}
      >
        {/* Decorative radial glow spots */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse at 85% 50%, rgba(255,255,255,0.18) 0%, transparent 65%)',
        }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
          {/* Left: Avatar + User Identity Details */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            <ProfileAvatar
              user={user}
              onUpload={uploadAvatar.mutate}
              isUploading={uploadAvatar.isPending}
            />

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#ffffff', letterSpacing: '-0.3px', textShadow: '0 1px 3px rgba(0,0,0,0.2)' }}>
                  {user.fullName || user.name || user.email}
                </h2>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '3px 10px',
                    borderRadius: 12,
                    background: 'rgba(255,255,255,0.22)',
                    border: '1px solid rgba(255,255,255,0.35)',
                    color: '#ffffff',
                    letterSpacing: '0.5px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    backdropFilter: 'blur(6px)',
                  }}
                >
                  <Sparkles size={12} style={{ color: '#93c5fd' }} />
                  {primaryRole}
                </span>
              </div>

              <p style={{ margin: '4px 0 0', fontSize: 14, color: 'rgba(255,255,255,0.82)', fontWeight: 500 }}>
                {user.email}
              </p>

              {user.jobTitle && (
                <p style={{ margin: '2px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.65)', fontWeight: 500 }}>
                  {user.jobTitle}
                </p>
              )}
            </div>
          </div>

          {/* Right: Active Status & Profile Completion Progress */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              gap: 10,
              minWidth: 200,
            }}
          >
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                padding: '5px 12px',
                borderRadius: 16,
                background: 'rgba(255,255,255,0.15)',
                border: '1px solid rgba(255,255,255,0.28)',
                color: '#ffffff',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                backdropFilter: 'blur(4px)',
              }}
            >
              <CheckCircle2 size={14} /> Active Account
            </span>

            {/* Profile Strength Progress Meter */}
            <div style={{ width: '100%', maxWidth: 200, textAlign: 'right' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.85)', marginBottom: 4 }}>
                <span>Profile Completeness</span>
                <span style={{ color: completionPercent >= 80 ? '#86efac' : '#fcd34d' }}>
                  {completionPercent}%
                </span>
              </div>
              <div
                style={{
                  height: 6,
                  width: '100%',
                  background: 'rgba(255,255,255,0.2)',
                  borderRadius: 3,
                  overflow: 'hidden',
                }}
              >
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${completionPercent}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  style={{
                    height: '100%',
                    background:
                      completionPercent >= 80
                        ? 'linear-gradient(90deg, #1d4ed8, #2563eb)'
                        : 'linear-gradient(90deg, #d97706, #f59e0b)',
                    borderRadius: 3,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Modern Adaptive Tab Navigation Bar */}
      <div
        style={{
          display: 'flex',
          gap: 6,
          padding: 4,
          borderRadius: 12,
          background: 'var(--surface-medium, #f1f5f9)',
          border: '1px solid var(--border-color, #e2e8f0)',
          marginBottom: 24,
          overflowX: 'auto',
        }}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '9px 18px',
                border: 'none',
                borderRadius: 8,
                background: isActive
                  ? 'var(--surface-dark, #ffffff)'
                  : 'transparent',
                color: isActive ? 'var(--text-primary, #0f172a)' : 'var(--text-secondary, #475569)',
                fontWeight: isActive ? 700 : 500,
                fontSize: 14,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
                boxShadow: isActive ? '0 1px 3px rgba(0, 0, 0, 0.08)' : 'none',
              }}
            >
              <Icon size={16} style={{ color: isActive ? 'var(--primary, #0284c7)' : 'currentColor' }} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18 }}
        >
          {activeTab === 'profile' && (
            <Card
              title="Personal Details"
              subtitle="Update your name, designation, contact numbers, and bio visible across the platform."
            >
              <ProfileForm
                defaultValues={user}
                onSubmit={save.mutateAsync}
                error={save.error}
              />
            </Card>
          )}

          {activeTab === 'security' && (
            <Card
              title="Security & Password Settings"
              subtitle="Keep your account protected with a strong password and multi-factor security."
            >
              <ChangePasswordForm />
            </Card>
          )}

          {activeTab === 'sessions' && <ActiveSessionsCard />}

          {activeTab === 'account' && <AccountDetailsTab user={user} />}
        </motion.div>
      </AnimatePresence>
    </PageContainer>
  );
};

export default ProfilePage;
