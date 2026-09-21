import { useState, useEffect } from 'react';
import {
  Megaphone, Plus, Trash2, ToggleLeft, ToggleRight,
  AlertCircle, Info, AlertTriangle, Wrench, Send, X, Clock
} from 'lucide-react';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import TextArea from '../../../components/common/TextArea';
import Alert from '../../../components/feedback/Alert';
import Badge from '../../../components/common/Badge';
import announcementService from '../services/announcementService';

const TYPE_CONFIG = {
  INFO: { icon: Info, color: '#3b82f6', label: 'Info', tone: 'blue' },
  WARNING: { icon: AlertTriangle, color: '#f59e0b', label: 'Warning', tone: 'warning' },
  CRITICAL: { icon: AlertCircle, color: '#ef4444', label: 'Critical', tone: 'error' },
  MAINTENANCE: { icon: Wrench, color: '#8b5cf6', label: 'Maintenance', tone: 'purple' },
};

const TYPE_OPTIONS = Object.keys(TYPE_CONFIG);

export const AnnouncementComposer = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form state
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('INFO');
  const [expiresAt, setExpiresAt] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await announcementService.list();
      setAnnouncements(res?.data?.data || res?.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    setSaving(true);
    setError(null);
    try {
      await announcementService.create({
        title: title.trim(),
        message: message.trim(),
        type,
        expiresAt: expiresAt || null,
      });
      setTitle('');
      setMessage('');
      setType('INFO');
      setExpiresAt('');
      setShowCreate(false);
      fetchAnnouncements();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to create announcement');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id, currentActive) => {
    try {
      await announcementService.toggle(id, !currentActive);
      fetchAnnouncements();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to toggle announcement');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this announcement permanently?')) return;
    try {
      await announcementService.remove(id);
      fetchAnnouncements();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to delete announcement');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Megaphone size={20} style={{ color: '#3b82f6' }} />
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
              Announcements
            </h2>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
              Broadcast messages to all students across your courses
            </p>
          </div>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)} variant={showCreate ? 'ghost' : 'primary'} size="sm">
          {showCreate ? <><X size={14} style={{ marginRight: 4 }} /> Cancel</> : <><Plus size={14} style={{ marginRight: 4 }} /> New Announcement</>}
        </Button>
      </div>

      {error && <Alert tone="error">{error}</Alert>}

      {/* Create Form */}
      {showCreate && (
        <form onSubmit={handleCreate} style={createFormStyle}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
            📢 Compose Announcement
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Input
              label="Title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. System maintenance scheduled for tonight"
            />

            <TextArea
              label="Message"
              required
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write the full announcement message that will be shown to all students..."
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={labelStyle}>Type</label>
                <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                  {TYPE_OPTIONS.map(t => {
                    const cfg = TYPE_CONFIG[t];
                    const selected = type === t;
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setType(t)}
                        style={{
                          padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                          border: selected ? `2px solid ${cfg.color}` : '1px solid var(--border-color)',
                          background: selected ? `${cfg.color}15` : 'transparent',
                          color: selected ? cfg.color : 'var(--text-secondary)',
                          cursor: 'pointer', fontFamily: 'inherit',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {cfg.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <Input
                label="Expires At (optional)"
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border-color)' }}>
            <Button type="button" variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={saving} disabled={!title.trim() || !message.trim()}>
              <Send size={14} style={{ marginRight: 6 }} /> Publish Announcement
            </Button>
          </div>
        </form>
      )}

      {/* Announcement List */}
      {loading ? (
        <p style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading announcements...</p>
      ) : announcements.length === 0 ? (
        <div style={emptyStyle}>
          <Megaphone size={36} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
          <p style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
            No announcements yet
          </p>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
            Create your first announcement to broadcast important messages to all enrolled students.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {announcements.map(ann => {
            const cfg = TYPE_CONFIG[ann.type] || TYPE_CONFIG.INFO;
            const Icon = cfg.icon;
            return (
              <div key={ann.id} style={{
                ...announcementCardStyle,
                borderLeft: `4px solid ${cfg.color}`,
                opacity: ann.active ? 1 : 0.5,
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flex: 1 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: `${cfg.color}15`, color: cfg.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, marginTop: 2,
                  }}>
                    <Icon size={16} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                        {ann.title}
                      </h4>
                      <Badge tone={ann.active ? 'success' : 'neutral'}>
                        {ann.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {ann.message}
                    </p>
                    <div style={{ display: 'flex', gap: 12, marginTop: 6, fontSize: 11, color: 'var(--text-muted)' }}>
                      {ann.createdAt && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Clock size={11} /> {new Date(ann.createdAt).toLocaleDateString()}
                        </span>
                      )}
                      {ann.expiresAt && (
                        <span>Expires: {new Date(ann.expiresAt).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button
                    onClick={() => handleToggle(ann.id, ann.active)}
                    style={iconBtnStyle}
                    title={ann.active ? 'Deactivate' : 'Activate'}
                  >
                    {ann.active ? <ToggleRight size={18} style={{ color: '#10b981' }} /> : <ToggleLeft size={18} />}
                  </button>
                  <button
                    onClick={() => handleDelete(ann.id)}
                    style={iconBtnStyle}
                    title="Delete"
                  >
                    <Trash2 size={15} style={{ color: '#ef4444' }} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ── Styles ──
const headerStyle = {
  background: 'var(--lms-card)',
  border: '1px solid var(--border-color)',
  borderRadius: 12,
  padding: '18px 22px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: 12,
};

const createFormStyle = {
  background: 'var(--lms-card)',
  border: '2px solid var(--text-primary)',
  borderRadius: 14,
  padding: 24,
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
};

const labelStyle = {
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--text-primary)',
  display: 'block',
};

const emptyStyle = {
  textAlign: 'center',
  padding: '48px 24px',
  background: 'var(--lms-card)',
  border: '2px dashed var(--border-color)',
  borderRadius: 12,
};

const announcementCardStyle = {
  background: 'var(--lms-card)',
  border: '1px solid var(--border-color)',
  borderRadius: 10,
  padding: '16px 18px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: 12,
  transition: 'opacity 0.2s ease',
};

const iconBtnStyle = {
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  padding: 6,
  borderRadius: 6,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'var(--text-muted)',
};

export default AnnouncementComposer;
