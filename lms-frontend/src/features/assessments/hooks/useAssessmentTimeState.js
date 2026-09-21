import { useState, useEffect, useCallback } from 'react';

/**
 * useAssessmentTimeState
 *
 * Returns the live time state for an assessment window.
 * Ticks every second to keep countdowns current.
 *
 * @param {string|null} startTime  - ISO / Instant string. Null = no open window restriction.
 * @param {string|null} endTime    - ISO / Instant string. Null = no close deadline.
 *
 * @returns {{
 *   state: 'open_ended'|'locked'|'open'|'closing_soon'|'expired',
 *   countdown: string,
 *   secondsLeft: number,
 *   windowPct: number,
 *   isClosingSoon: boolean,
 *   startsAt: Date|null,
 *   endsAt: Date|null,
 * }}
 */
export const useAssessmentTimeState = (startTime, endTime) => {
  const compute = useCallback(() => {
    const now = Date.now();
    const start = startTime ? new Date(startTime).getTime() : null;
    const end = endTime ? new Date(endTime).getTime() : null;

    if (!start && !end) {
      return { state: 'open_ended', countdown: '', secondsLeft: Infinity, windowPct: 0, isClosingSoon: false, startsAt: null, endsAt: null };
    }

    if (end && now > end) {
      return { state: 'expired', countdown: 'Closed', secondsLeft: 0, windowPct: 100, isClosingSoon: false, startsAt: start ? new Date(start) : null, endsAt: new Date(end) };
    }

    if (start && now < start) {
      const diff = Math.floor((start - now) / 1000);
      return { state: 'locked', countdown: formatDuration(diff), secondsLeft: diff, windowPct: 0, isClosingSoon: false, startsAt: new Date(start), endsAt: end ? new Date(end) : null };
    }

    if (end) {
      const totalWindow = end - (start ?? (end - 7 * 24 * 3600 * 1000));
      const elapsed = now - (start ?? (end - 7 * 24 * 3600 * 1000));
      const windowPct = Math.min(100, Math.round((elapsed / totalWindow) * 100));
      const diff = Math.floor((end - now) / 1000);
      const isClosingSoon = diff < 30 * 60;
      return { state: isClosingSoon ? 'closing_soon' : 'open', countdown: formatDuration(diff), secondsLeft: diff, windowPct, isClosingSoon, startsAt: start ? new Date(start) : null, endsAt: new Date(end) };
    }

    return { state: 'open', countdown: '', secondsLeft: Infinity, windowPct: 0, isClosingSoon: false, startsAt: start ? new Date(start) : null, endsAt: null };
  }, [startTime, endTime]);

  const [result, setResult] = useState(compute);

  useEffect(() => {
    setResult(compute());
    const interval = setInterval(() => {
      const next = compute();
      setResult((prev) => (prev.state === next.state && prev.countdown === next.countdown ? prev : next));
    }, 1000);
    return () => clearInterval(interval);
  }, [compute]);

  return result;
};

export function formatDuration(totalSeconds) {
  if (!isFinite(totalSeconds) || totalSeconds <= 0) return '';
  const d = Math.floor(totalSeconds / 86400);
  const h = Math.floor((totalSeconds % 86400) / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${String(s).padStart(2, '0')}s`;
  return `${s}s`;
}

export default useAssessmentTimeState;
