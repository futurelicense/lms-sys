import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Info, Megaphone, X } from 'lucide-react';
import platformService from '../services/platformService';

export const BroadcastBanner = () => {
  const [dismissedIds, setDismissedIds] = useState(() => {
    try {
      const stored = sessionStorage.getItem('lms_dismissed_announcements');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const { data: announcements = [] } = useQuery({
    queryKey: ['active-broadcast-announcements'],
    queryFn: platformService.listActiveAnnouncements,
    refetchInterval: 60000,
  });

  const activeVisible = announcements.filter((a) => !dismissedIds.includes(a.id));

  if (!activeVisible.length) return null;

  const current = activeVisible[0];

  const handleDismiss = (id) => {
    const updated = [...dismissedIds, id];
    setDismissedIds(updated);
    try {
      sessionStorage.setItem('lms_dismissed_announcements', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const typeConfig = {
    INFO: { bg: 'rgba(56, 189, 248, 0.15)', border: 'rgba(56, 189, 248, 0.3)', color: '#38bdf8', icon: Info },
    WARNING: { bg: 'rgba(234, 179, 8, 0.15)', border: 'rgba(234, 179, 8, 0.3)', color: '#facc15', icon: AlertTriangle },
    CRITICAL: { bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.3)', color: '#f87171', icon: AlertTriangle },
    MAINTENANCE: { bg: 'rgba(192, 132, 252, 0.15)', border: 'rgba(192, 132, 252, 0.3)', color: '#c084fc', icon: Megaphone },
  };

  const config = typeConfig[current.type] || typeConfig.INFO;
  const Icon = config.icon;

  return (
    <div
      style={{
        background: config.bg,
        borderBottom: `1px solid ${config.border}`,
        padding: '8px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 40,
        fontFamily: 'Inter, sans-serif',
        fontSize: 12,
        color: 'var(--text-primary)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1, paddingRight: 12 }}>
        <Icon size={16} style={{ color: config.color, flexShrink: 0 }} />
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            padding: '1px 6px',
            borderRadius: 4,
            background: 'var(--surface-dark)',
            border: `1px solid ${config.border}`,
            color: config.color,
            flexShrink: 0,
          }}
        >
          {current.type}
        </span>
        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{current.title}:</span>
        <span style={{ color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {current.message}
        </span>
      </div>

      <button
        onClick={() => handleDismiss(current.id)}
        style={{
          background: 'transparent',
          border: 'none',
          color: 'var(--text-muted)',
          cursor: 'pointer',
          padding: 4,
          borderRadius: 4,
          display: 'flex',
          alignItems: 'center',
          flexShrink: 0,
        }}
        title="Dismiss announcement"
        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
      >
        <X size={14} />
      </button>
    </div>
  );
};

export default BroadcastBanner;
