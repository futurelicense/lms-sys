import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Sliders, X } from 'lucide-react';
import platformService from '../services/platformService';
import AdminButton from '../../../components/ui/AdminButton';
import AdminInput from '../../../components/ui/AdminInput';
import AdminBadge from '../../../components/ui/AdminBadge';

export const TenantConfigDrawer = ({ tenant, isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    maxUsers: 500,
    maxCourses: 50,
    maxStorageGb: 20,
    aiFeaturesEnabled: true,
    advancedAnalyticsEnabled: true,
    customCertificatesEnabled: true,
    codeEvaluatorEnabled: true,
    liveProctoringEnabled: false,
    chatFileRetentionDays: 30,
  });
  const [feedback, setFeedback] = useState({ error: '', success: '' });

  const configQuery = useQuery({
    queryKey: ['tenant-config', tenant?.id],
    queryFn: () => platformService.getTenantConfig(tenant?.id),
    enabled: Boolean(isOpen && tenant?.id),
  });

  useEffect(() => {
    if (configQuery.data) {
      setFormData({
        maxUsers: configQuery.data.maxUsers ?? 500,
        maxCourses: configQuery.data.maxCourses ?? 50,
        maxStorageGb: configQuery.data.maxStorageGb ?? 20,
        aiFeaturesEnabled: configQuery.data.aiFeaturesEnabled ?? true,
        advancedAnalyticsEnabled: configQuery.data.advancedAnalyticsEnabled ?? true,
        customCertificatesEnabled: configQuery.data.customCertificatesEnabled ?? true,
        codeEvaluatorEnabled: configQuery.data.codeEvaluatorEnabled ?? true,
        liveProctoringEnabled: configQuery.data.liveProctoringEnabled ?? false,
        chatFileRetentionDays: configQuery.data.chatFileRetentionDays ?? 30,
      });
      setFeedback({ error: '', success: '' });
    }
  }, [configQuery.data]);

  const updateMutation = useMutation({
    mutationFn: (payload) => platformService.updateTenantConfig(tenant.id, payload),
    onSuccess: () => {
      setFeedback({ error: '', success: 'Configuration saved successfully!' });
      queryClient.invalidateQueries({ queryKey: ['tenant-config', tenant.id] });
      setTimeout(() => {
        setFeedback((prev) => ({ ...prev, success: '' }));
      }, 3000);
    },
    onError: (err) => {
      setFeedback({
        error: err?.response?.data?.message || 'Failed to update tenant configuration.',
        success: '',
      });
    },
  });

  if (!isOpen || !tenant) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setFeedback({ error: '', success: '' });
    updateMutation.mutate({
      maxUsers: Number(formData.maxUsers),
      maxCourses: Number(formData.maxCourses),
      maxStorageGb: Number(formData.maxStorageGb),
      aiFeaturesEnabled: formData.aiFeaturesEnabled,
      advancedAnalyticsEnabled: formData.advancedAnalyticsEnabled,
      customCertificatesEnabled: formData.customCertificatesEnabled,
      codeEvaluatorEnabled: formData.codeEvaluatorEnabled,
      liveProctoringEnabled: formData.liveProctoringEnabled,
      chatFileRetentionDays: Number(formData.chatFileRetentionDays || 30),
    });
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        justifyContent: 'flex-end',
        background: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 460,
          background: 'var(--surface-dark)',
          borderLeft: '1px solid var(--border-color)',
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          overflowY: 'auto',
          boxShadow: 'var(--shadow-lg, 0 12px 32px rgba(0, 0, 0, 0.8))',
          fontFamily: 'Inter, sans-serif',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingBottom: 16,
              borderBottom: '1px solid var(--border-color)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 8,
                  background: 'var(--surface-medium)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-primary)',
                }}
              >
                <Sliders size={18} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                  Tenant Configuration
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
                  Workspace: <span style={{ fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{tenant.slug}</span>
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                padding: 4,
                borderRadius: 6,
                display: 'flex',
                alignItems: 'center',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
            >
              <X size={18} />
            </button>
          </div>

          {/* Feedback messages */}
          {feedback.error && (
            <div
              style={{
                marginTop: 16,
                padding: '10px 14px',
                borderRadius: 8,
                background: 'rgba(239,68,68,0.12)',
                border: '1px solid rgba(239,68,68,0.3)',
                color: '#f87171',
                fontSize: 12,
              }}
            >
              {feedback.error}
            </div>
          )}
          {feedback.success && (
            <div
              style={{
                marginTop: 16,
                padding: '10px 14px',
                borderRadius: 8,
                background: 'rgba(34,197,94,0.12)',
                border: '1px solid rgba(34,197,94,0.3)',
                color: '#4ade80',
                fontSize: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Check size={14} /> {feedback.success}
            </div>
          )}

          {configQuery.isLoading ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              Loading configuration...
            </div>
          ) : (
            <form id="tenant-config-form" onSubmit={handleSubmit} style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Resource Quotas Section */}
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', display: 'block', marginBottom: 12 }}>
                  Resource Quotas
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <AdminInput
                    label="Max Users Allowed"
                    type="number"
                    min="1"
                    value={formData.maxUsers}
                    onChange={(e) => setFormData({ ...formData, maxUsers: e.target.value })}
                  />
                  <AdminInput
                    label="Max Courses Allowed"
                    type="number"
                    min="1"
                    value={formData.maxCourses}
                    onChange={(e) => setFormData({ ...formData, maxCourses: e.target.value })}
                  />
                  <AdminInput
                    label="Storage Capacity (GB)"
                    type="number"
                    min="1"
                    value={formData.maxStorageGb}
                    onChange={(e) => setFormData({ ...formData, maxStorageGb: e.target.value })}
                  />
                  <AdminInput
                    label="Chat File Retention (Days)"
                    type="number"
                    min="1"
                    max="365"
                    value={formData.chatFileRetentionDays}
                    onChange={(e) => setFormData({ ...formData, chatFileRetentionDays: e.target.value })}
                    helperText="Attachments older than this will be permanently purged from Cloudflare R2 (default: 30 days)."
                  />
                </div>
              </div>

              {/* Feature Flags Section */}
              <div style={{ paddingTop: 16, borderTop: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', display: 'block', marginBottom: 12 }}>
                  Feature Flags
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { key: 'aiFeaturesEnabled', label: 'AI Course & Assessment Generator', desc: 'GenAI automated questions and curriculum helpers' },
                    { key: 'advancedAnalyticsEnabled', label: 'Advanced Analytics Dashboard', desc: 'Detailed engagement & cohorts performance telemetry' },
                    { key: 'customCertificatesEnabled', label: 'Custom Certificate Templates', desc: 'Tenant branding & PDF certificate generation' },
                    { key: 'codeEvaluatorEnabled', label: 'Online Code Evaluator / Compiler', desc: 'Multi-language testbench execution' },
                    { key: 'liveProctoringEnabled', label: 'AI Live Proctoring Suite', desc: 'Webcam snapshot tracking and browser lockdown' },
                  ].map((flag) => (
                    <label
                      key={flag.key}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 12,
                        padding: '10px 12px',
                        borderRadius: 8,
                        background: 'var(--surface-medium)',
                        border: '1px solid var(--border-color)',
                        cursor: 'pointer',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--hover-bg)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--surface-medium)')}
                    >
                      <input
                        type="checkbox"
                        checked={formData[flag.key]}
                        onChange={(e) => setFormData({ ...formData, [flag.key]: e.target.checked })}
                        style={{
                          marginTop: 3,
                          width: 16,
                          height: 16,
                          cursor: 'pointer',
                          accentColor: '#ffffff',
                        }}
                      />
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <span style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                          {flag.label}
                        </span>
                        <span style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                          {flag.desc}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Footer Actions */}
        <div
          style={{
            paddingTop: 20,
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 10,
            marginTop: 20,
          }}
        >
          <AdminButton variant="outline" onClick={onClose}>
            Cancel
          </AdminButton>
          <AdminButton
            type="submit"
            form="tenant-config-form"
            loading={updateMutation.isPending || configQuery.isLoading}
            icon={<Check size={14} />}
          >
            Save Configuration
          </AdminButton>
        </div>
      </div>
    </div>
  );
};

export default TenantConfigDrawer;
