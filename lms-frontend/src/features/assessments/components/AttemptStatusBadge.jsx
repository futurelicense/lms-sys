import { ATTEMPT_STATUS } from '../constants/assessmentConstants';

const STATUS_CONFIG = {
  [ATTEMPT_STATUS.IN_PROGRESS]: {
    label: 'In Progress',
    bg: 'rgba(251, 191, 36, 0.15)',
    color: '#f59e0b',
    dot: '#f59e0b',
  },
  [ATTEMPT_STATUS.SUBMITTED]: {
    label: 'Submitted',
    bg: 'rgba(99, 102, 241, 0.12)',
    color: '#6366f1',
    dot: '#6366f1',
  },
  [ATTEMPT_STATUS.TIMED_OUT]: {
    label: 'Timed Out',
    bg: 'rgba(239, 68, 68, 0.1)',
    color: '#ef4444',
    dot: '#ef4444',
  },
  EXPIRED: {
    label: 'Expired',
    bg: 'rgba(239, 68, 68, 0.1)',
    color: '#ef4444',
    dot: '#ef4444',
  },
  GRADED: {
    label: 'Graded',
    bg: 'rgba(34, 197, 94, 0.12)',
    color: '#22c55e',
    dot: '#22c55e',
  },
};

const DEFAULT_CONFIG = {
  label: 'Unknown',
  bg: 'rgba(148, 163, 184, 0.15)',
  color: '#94a3b8',
  dot: '#94a3b8',
};

/**
 * Compact badge with a pulsing dot indicator for attempt status.
 */
export const AttemptStatusBadge = ({ status, size = 'md' }) => {
  const cfg = STATUS_CONFIG[status] ?? DEFAULT_CONFIG;
  const fontSize = size === 'sm' ? 11 : 12;

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      padding: size === 'sm' ? '2px 7px' : '3px 10px',
      borderRadius: 20,
      background: cfg.bg,
      color: cfg.color,
      fontSize,
      fontWeight: 600,
      letterSpacing: '0.01em',
      whiteSpace: 'nowrap',
    }}>
      <span style={{
        width: 6,
        height: 6,
        borderRadius: '50%',
        background: cfg.dot,
        display: 'inline-block',
        animation: status === ATTEMPT_STATUS.IN_PROGRESS ? 'dotPulse 1.5s infinite' : 'none',
      }} />
      {cfg.label}

      <style>{`
        @keyframes dotPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.4; transform: scale(0.7); }
        }
      `}</style>
    </span>
  );
};

export default AttemptStatusBadge;
