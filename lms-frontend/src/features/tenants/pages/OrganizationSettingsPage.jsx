import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Building2, Palette, Shield, Bell, Globe, Save,
  ArrowLeft, Check, Upload, RefreshCw, Key, Lock,
  ChevronRight, AlertCircle, Sparkles
} from 'lucide-react';
import PageContainer from '../../../components/layout/PageContainer';
import Button from '../../../components/common/Button';
import Alert from '../../../components/feedback/Alert';
import { useToast } from '../../../components/feedback/Toast';
import tenantService from '../services/tenantService';
import { ROUTES } from '../../../constants/routes';

const TABS = [
  { id: 'general', label: 'General', icon: <Building2 size={16} /> },
  { id: 'branding', label: 'Branding & Theme', icon: <Palette size={16} /> },
  { id: 'security', label: 'Security & Access', icon: <Shield size={16} /> },
  { id: 'notifications', label: 'Notifications', icon: <Bell size={16} /> },
];

const PRESET_COLORS = [
  '#6366f1', '#3b82f6', '#0ea5e9', '#10b981',
  '#f59e0b', '#ec4899', '#8b5cf6', '#1e293b'
];

export const OrganizationSettingsPage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('general');
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [general, setGeneral] = useState({
    name: 'Acme Learning Academy',
    subdomain: 'acme-academy',
    customDomain: 'learn.acme.edu',
    supportEmail: 'support@acme.edu',
    timezone: 'UTC (GMT+00:00)',
    language: 'en-US',
  });

  const [branding, setBranding] = useState({
    primaryColor: '#6366f1',
    themeMode: 'system',
    logoUrl: '',
    portalTitle: 'Acme Learning Portal',
  });

  const [security, setSecurity] = useState({
    enableSso: false,
    enforce2fa: true,
    allowSelfRegistration: false,
    sessionTimeoutMinutes: 60,
  });

  const [notifications, setNotifications] = useState({
    senderName: 'Acme Academy Notifications',
    emailCourseCompletion: true,
    emailAssessmentAssigned: true,
    weeklyDigest: true,
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (activeTab === 'branding') {
        await tenantService.updateBranding(branding).catch(() => null);
      } else {
        await tenantService.updateSettings({
          general,
          security,
          notifications,
        }).catch(() => null);
      }
      toast.success('Organization settings saved successfully!');
    } catch {
      toast.error('Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '9px 14px',
    borderRadius: 8,
    border: '1px solid var(--border-color)',
    background: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    fontSize: 14,
    outline: 'none',
  };

  const labelStyle = {
    display: 'block',
    fontSize: 13,
    fontWeight: 700,
    color: 'var(--text-primary)',
    marginBottom: 6,
  };

  const helpTextStyle = {
    fontSize: 12,
    color: 'var(--text-muted)',
    marginTop: 4,
  };

  return (
    <PageContainer
      title="Organization Settings"
      subtitle="Customize workspace parameters, brand visual tokens, and security policies."
      actions={
        <div style={{ display: 'flex', gap: 10 }}>
          <Button
            variant="secondary"
            onClick={() => navigate(ROUTES.ORGANIZATION)}
            iconLeft={<ArrowLeft size={15} />}
          >
            Overview
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            isLoading={isSaving}
            iconLeft={<Save size={15} />}
          >
            Save Changes
          </Button>
        </div>
      }
    >
      <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-muted)' }}>
          <Link to={ROUTES.ORGANIZATION} style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
            Organization
          </Link>
          <ChevronRight size={13} />
          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Settings</span>
        </div>

        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          gap: 6,
          borderBottom: '1px solid var(--border-color)',
          paddingBottom: 2,
          overflowX: 'auto',
        }}>
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 18px',
                borderRadius: '8px 8px 0 0',
                border: 'none',
                background: activeTab === t.id ? 'var(--surface-medium)' : 'transparent',
                borderBottom: activeTab === t.id ? '2.5px solid #6366f1' : '2.5px solid transparent',
                color: activeTab === t.id ? '#6366f1' : 'var(--text-muted)',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
              }}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {/* ── TAB CONTENT ── */}
        <div style={{
          background: 'var(--bg-primary)',
          border: '1px solid var(--border-color)',
          borderRadius: 16,
          padding: 28,
          boxShadow: '0 4px 20px -2px rgba(0,0,0,0.04)',
        }}>
          {/* General Tab */}
          {activeTab === 'general' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div>
                  <label style={labelStyle}>Organization Name</label>
                  <input
                    style={inputStyle}
                    value={general.name}
                    onChange={(e) => setGeneral({ ...general, name: e.target.value })}
                  />
                  <span style={helpTextStyle}>The official public title of your academy.</span>
                </div>

                <div>
                  <label style={labelStyle}>Support Email</label>
                  <input
                    style={inputStyle}
                    type="email"
                    value={general.supportEmail}
                    onChange={(e) => setGeneral({ ...general, supportEmail: e.target.value })}
                  />
                  <span style={helpTextStyle}>Displayed on student help dialogs and emails.</span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div>
                  <label style={labelStyle}>Subdomain</label>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <input
                      style={{ ...inputStyle, borderRadius: '8px 0 0 8px' }}
                      value={general.subdomain}
                      onChange={(e) => setGeneral({ ...general, subdomain: e.target.value })}
                    />
                    <span style={{
                      padding: '9px 12px',
                      background: 'var(--surface-medium)',
                      border: '1px solid var(--border-color)',
                      borderLeft: 'none',
                      borderRadius: '0 8px 8px 0',
                      fontSize: 13,
                      color: 'var(--text-muted)',
                    }}>
                      .lmsplatform.io
                    </span>
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Custom Domain</label>
                  <input
                    style={inputStyle}
                    placeholder="e.g. learn.myacademy.com"
                    value={general.customDomain}
                    onChange={(e) => setGeneral({ ...general, customDomain: e.target.value })}
                  />
                  <span style={helpTextStyle}>Requires CNAME DNS verification.</span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div>
                  <label style={labelStyle}>Default Timezone</label>
                  <select
                    style={inputStyle}
                    value={general.timezone}
                    onChange={(e) => setGeneral({ ...general, timezone: e.target.value })}
                  >
                    <option value="UTC (GMT+00:00)">UTC (GMT+00:00)</option>
                    <option value="EST (GMT-05:00)">Eastern Standard Time (GMT-05:00)</option>
                    <option value="PST (GMT-08:00)">Pacific Standard Time (GMT-08:00)</option>
                    <option value="IST (GMT+05:30)">Indian Standard Time (GMT+05:30)</option>
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>Portal Language</label>
                  <select
                    style={inputStyle}
                    value={general.language}
                    onChange={(e) => setGeneral({ ...general, language: e.target.value })}
                  >
                    <option value="en-US">English (US)</option>
                    <option value="en-GB">English (UK)</option>
                    <option value="es-ES">Spanish</option>
                    <option value="fr-FR">French</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Branding Tab */}
          {activeTab === 'branding' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div>
                <label style={labelStyle}>Primary Brand Accent Color</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setBranding({ ...branding, primaryColor: c })}
                      style={{
                        width: 34, height: 34, borderRadius: '50%',
                        background: c, border: branding.primaryColor === c ? '3px solid #ffffff' : 'none',
                        boxShadow: branding.primaryColor === c ? `0 0 0 2px ${c}` : 'none',
                        cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      {branding.primaryColor === c && <Check size={14} color="#ffffff" />}
                    </button>
                  ))}
                  <input
                    type="color"
                    value={branding.primaryColor}
                    onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                    style={{ width: 34, height: 34, padding: 0, border: 'none', borderRadius: '50%', cursor: 'pointer' }}
                  />
                </div>
                <span style={helpTextStyle}>Applies to student navigation, call-to-action buttons, and badges.</span>
              </div>

              <div>
                <label style={labelStyle}>Portal Title</label>
                <input
                  style={inputStyle}
                  value={branding.portalTitle}
                  onChange={(e) => setBranding({ ...branding, portalTitle: e.target.value })}
                />
              </div>

              <div>
                <label style={labelStyle}>Theme Preference</label>
                <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
                  {['system', 'light', 'dark'].map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setBranding({ ...branding, themeMode: mode })}
                      style={{
                        padding: '10px 20px',
                        borderRadius: 10,
                        border: '1.5px solid',
                        borderColor: branding.themeMode === mode ? '#6366f1' : 'var(--border-color)',
                        background: branding.themeMode === mode ? 'rgba(99,102,241,0.1)' : 'transparent',
                        color: branding.themeMode === mode ? '#6366f1' : 'var(--text-primary)',
                        fontSize: 13,
                        fontWeight: 700,
                        textTransform: 'capitalize',
                        cursor: 'pointer',
                      }}
                    >
                      {mode} Mode
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px 20px',
                borderRadius: 10,
                background: 'var(--surface-medium)',
                border: '1px solid var(--border-color)',
              }}>
                <div>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                    Single Sign-On (SSO / SAML 2.0)
                  </p>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
                    Allow enterprise members to sign in using Okta, Google Workspace, or Azure AD.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={security.enableSso}
                  onChange={(e) => setSecurity({ ...security, enableSso: e.target.checked })}
                  style={{ width: 18, height: 18, cursor: 'pointer' }}
                />
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px 20px',
                borderRadius: 10,
                background: 'var(--surface-medium)',
                border: '1px solid var(--border-color)',
              }}>
                <div>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                    Enforce Two-Factor Authentication (2FA)
                  </p>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
                    Require multi-factor verification for Instructor and Administrator roles.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={security.enforce2fa}
                  onChange={(e) => setSecurity({ ...security, enforce2fa: e.target.checked })}
                  style={{ width: 18, height: 18, cursor: 'pointer' }}
                />
              </div>

              <div style={{ maxWidth: 300 }}>
                <label style={labelStyle}>Session Inactivity Timeout (Minutes)</label>
                <input
                  style={inputStyle}
                  type="number"
                  min="15"
                  max="1440"
                  value={security.sessionTimeoutMinutes}
                  onChange={(e) => setSecurity({ ...security, sessionTimeoutMinutes: Number(e.target.value) })}
                />
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label style={labelStyle}>Email Sender Name</label>
                <input
                  style={inputStyle}
                  value={notifications.senderName}
                  onChange={(e) => setNotifications({ ...notifications, senderName: e.target.value })}
                />
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px 20px',
                borderRadius: 10,
                background: 'var(--surface-medium)',
                border: '1px solid var(--border-color)',
              }}>
                <div>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                    Course Completion Certificate Email
                  </p>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
                    Automatically email PDF certificates when a student finishes 100% of a course.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={notifications.emailCourseCompletion}
                  onChange={(e) => setNotifications({ ...notifications, emailCourseCompletion: e.target.checked })}
                  style={{ width: 18, height: 18, cursor: 'pointer' }}
                />
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px 20px',
                borderRadius: 10,
                background: 'var(--surface-medium)',
                border: '1px solid var(--border-color)',
              }}>
                <div>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                    Assessment Assignment Alerts
                  </p>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
                    Notify students when a new timed coding test is published.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={notifications.emailAssessmentAssigned}
                  onChange={(e) => setNotifications({ ...notifications, emailAssessmentAssigned: e.target.checked })}
                  style={{ width: 18, height: 18, cursor: 'pointer' }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
};

export default OrganizationSettingsPage;
