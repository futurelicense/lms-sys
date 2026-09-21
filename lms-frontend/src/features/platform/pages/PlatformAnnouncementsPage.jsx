import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  Info,
  Megaphone,
  Plus,
  Power,
  Trash2,
  X,
} from 'lucide-react';
import platformService from '../services/platformService';
import AdminButton from '../../../components/ui/AdminButton';
import AdminBadge from '../../../components/ui/AdminBadge';
import AdminInput from '../../../components/ui/AdminInput';
import { AdminEmptyState } from '../../../components/ui/AdminPagination';

const TYPE_BADGE_VARIANTS = {
  INFO: 'info',
  WARNING: 'warning',
  CRITICAL: 'danger',
  MAINTENANCE: 'default',
};

const formatDate = (iso) =>
  iso
    ? new Intl.DateTimeFormat('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(iso))
    : 'Never';

export const PlatformAnnouncementsPage = () => {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'INFO',
    active: true,
  });
  const [actionError, setActionError] = useState('');

  const { data: announcements = [], isLoading } = useQuery({
    queryKey: ['platform-announcements'],
    queryFn: platformService.listAnnouncements,
  });

  const createMutation = useMutation({
    mutationFn: platformService.createAnnouncement,
    onSuccess: () => {
      setFormOpen(false);
      setFormData({ title: '', message: '', type: 'INFO', active: true });
      setActionError('');
      queryClient.invalidateQueries({ queryKey: ['platform-announcements'] });
      queryClient.invalidateQueries({ queryKey: ['active-broadcast-announcements'] });
    },
    onError: (err) => setActionError(err?.response?.data?.message || 'Failed to publish announcement.'),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }) => platformService.toggleAnnouncement(id, active),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-announcements'] });
      queryClient.invalidateQueries({ queryKey: ['active-broadcast-announcements'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: platformService.deleteAnnouncement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-announcements'] });
      queryClient.invalidateQueries({ queryKey: ['active-broadcast-announcements'] });
    },
  });

  const handleCreate = (e) => {
    e.preventDefault();
    setActionError('');
    createMutation.mutate(formData);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1400, margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>
      {/* ── Page Header ── */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          paddingBottom: 20,
          borderBottom: '1px solid var(--border-color)',
        }}
      >
        <div>
          <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
            Broadcasting & Notifications
          </span>
          <h1 style={{ margin: '4px 0 0', fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
            Broadcast Announcements
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
            Broadcast platform maintenance windows, critical announcements, or release notes to all workspaces.
          </p>
        </div>

        <AdminButton
          size="sm"
          onClick={() => setFormOpen((prev) => !prev)}
          icon={formOpen ? <X size={14} /> : <Plus size={14} />}
        >
          {formOpen ? 'Close Form' : 'New Broadcast'}
        </AdminButton>
      </div>

      {actionError && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 8,
            border: '1px solid rgba(239,68,68,0.3)',
            background: 'rgba(239,68,68,0.08)',
            color: '#f87171',
            fontSize: 13,
          }}
        >
          {actionError}
        </div>
      )}

      {/* ── Create Announcement Form Card ── */}
      {formOpen && (
        <div
          style={{
            background: 'var(--surface-medium)',
            border: '1px solid var(--border-color)',
            borderRadius: 12,
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 12, borderBottom: '1px solid var(--border-color)' }}>
            <Megaphone size={18} style={{ color: 'var(--text-secondary)' }} />
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
              Publish Broadcast Announcement
            </h3>
          </div>

          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
              <AdminInput
                label="Announcement Title"
                placeholder="e.g. Scheduled Cloud Maintenance Window"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />

              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>
                  Notice Level / Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  style={{
                    width: '100%',
                    height: 38,
                    padding: '0 12px',
                    background: 'var(--input-bg)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 8,
                    fontSize: 14,
                    color: 'var(--text-primary)',
                    fontFamily: 'Inter, sans-serif',
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <option value="INFO">Information (Info)</option>
                  <option value="WARNING">Warning (Amber alert)</option>
                  <option value="CRITICAL">Critical Incident (Red alert)</option>
                  <option value="MAINTENANCE">Scheduled Maintenance (Purple notice)</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>
                Broadcast Message
              </label>
              <textarea
                required
                rows={3}
                placeholder="Details of the announcement displayed at the top of all tenant workspaces..."
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                style={{
                  width: '100%',
                  padding: 12,
                  background: 'var(--input-bg)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 8,
                  fontSize: 14,
                  color: 'var(--text-primary)',
                  fontFamily: 'Inter, sans-serif',
                  outline: 'none',
                  boxSizing: 'border-box',
                  resize: 'vertical',
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: 'var(--text-secondary)' }}>
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  style={{ width: 16, height: 16, accentColor: '#ffffff', cursor: 'pointer' }}
                />
                Publish actively immediately
              </label>

              <div style={{ display: 'flex', gap: 10 }}>
                <AdminButton variant="outline" size="sm" onClick={() => setFormOpen(false)}>
                  Cancel
                </AdminButton>
                <AdminButton type="submit" size="sm" loading={createMutation.isPending}>
                  Publish Broadcast
                </AdminButton>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* ── Announcements Cards List ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {isLoading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading announcements...
          </div>
        ) : announcements.length === 0 ? (
          <div
            style={{
              padding: 40,
              background: 'var(--surface-medium)',
              border: '1px solid var(--border-color)',
              borderRadius: 12,
            }}
          >
            <AdminEmptyState
              icon={<Megaphone size={28} />}
              title="No broadcast announcements"
              message="Click 'New Broadcast' above to publish notices to all workspaces."
            />
          </div>
        ) : (
          announcements.map((item) => (
            <div
              key={item.id}
              style={{
                background: 'var(--surface-medium)',
                border: '1px solid var(--border-color)',
                borderRadius: 12,
                padding: '18px 20px',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 16,
              }}
            >
              <div style={{ minWidth: 0, flex: '1 1 300px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <AdminBadge variant={TYPE_BADGE_VARIANTS[item.type] || 'default'} dot>
                    {item.type}
                  </AdminBadge>
                  <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                    {item.title}
                  </h4>
                  <AdminBadge variant={item.active ? 'success' : 'neutral'}>
                    {item.active ? 'Active' : 'Inactive'}
                  </AdminBadge>
                </div>
                <p style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {item.message}
                </p>
                <span style={{ display: 'block', margin: '6px 0 0', fontSize: 11, color: 'var(--text-muted)' }}>
                  Published {formatDate(item.createdAt)}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <AdminButton
                  variant={item.active ? 'outline' : 'secondary'}
                  size="sm"
                  onClick={() => toggleMutation.mutate({ id: item.id, active: !item.active })}
                  icon={<Power size={14} />}
                >
                  {item.active ? 'Deactivate' : 'Activate'}
                </AdminButton>

                <AdminButton
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (window.confirm('Delete this broadcast announcement?')) {
                      deleteMutation.mutate(item.id);
                    }
                  }}
                  icon={<Trash2 size={14} style={{ color: '#f87171' }} />}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PlatformAnnouncementsPage;
