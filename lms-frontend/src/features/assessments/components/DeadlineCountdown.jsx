import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

/**
 * Shows a human-readable countdown to a deadline.
 * Highlights in orange/red when within 48 hours.
 *
 * Props:
 *   deadline – ISO string or Date for the deadline
 *   prefix   – text before the countdown (default: "Closes in")
 */
export const DeadlineCountdown = ({ deadline, prefix = 'Closes in' }) => {
  const [remaining, setRemaining] = useState(() =>
    Math.max(0, Math.floor((new Date(deadline).getTime() - Date.now()) / 1000)),
  );

  useEffect(() => {
    const tick = () => {
      const next = Math.max(0, Math.floor((new Date(deadline).getTime() - Date.now()) / 1000));
      setRemaining(next);
    };
    tick();
    const id = setInterval(tick, 30_000); // Update every 30s is fine for day-level display
    return () => clearInterval(id);
  }, [deadline]);

  if (remaining <= 0) {
    return (
      <span style={{ fontSize: 12, color: '#ef4444', fontWeight: 600 }}>
        Closed
      </span>
    );
  }

  const days = Math.floor(remaining / 86400);
  const hours = Math.floor((remaining % 86400) / 3600);
  const mins = Math.floor((remaining % 3600) / 60);

  let display, color;
  if (days >= 2) {
    display = `${days}d ${hours}h`;
    color = 'var(--text-muted)';
  } else if (days >= 1) {
    display = `${days}d ${hours}h`;
    color = '#f59e0b';
  } else if (hours >= 1) {
    display = `${hours}h ${mins}m`;
    color = '#f87171';
  } else {
    display = `${mins}m`;
    color = '#ef4444';
  }

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      fontSize: 12,
      fontWeight: 600,
      color,
    }}>
      <Clock size={11} />
      {prefix} {display}
    </span>
  );
};

export default DeadlineCountdown;
