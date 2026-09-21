import { useEffect, useState } from 'react';
import { formatDuration } from '../../../utils/dateUtils';

/**
 * Countdown for timed attempts.
 * The server must also enforce the deadline - a client clock is not trustworthy.
 */
export const AssessmentTimer = ({ endsAt, onExpire }) => {
  const [remaining, setRemaining] = useState(() =>
    Math.max(0, Math.floor((new Date(endsAt).getTime() - Date.now()) / 1000)),
  );

  useEffect(() => {
    const tick = setInterval(() => {
      const next = Math.max(0, Math.floor((new Date(endsAt).getTime() - Date.now()) / 1000));
      setRemaining(next);
      if (next === 0) {
        clearInterval(tick);
        onExpire?.();
      }
    }, 1000);
    return () => clearInterval(tick);
  }, [endsAt, onExpire]);

  const isCritical = remaining <= 60;

  return (
    <span
      role="timer"
      aria-live={isCritical ? 'assertive' : 'off'}
      style={{ color: isCritical ? 'var(--color-danger)' : 'var(--color-text-muted)' }}
    >
      {formatDuration(remaining)} remaining
    </span>
  );
};

export default AssessmentTimer;
