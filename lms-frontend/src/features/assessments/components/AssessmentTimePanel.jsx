import { useState } from 'react';
import {
  Clock, BarChart2, HelpCircle, RefreshCw, CheckCircle, XCircle,
  CalendarClock, AlarmClock, Zap, Hourglass, PlusCircle, ShieldAlert,
  Calendar, Check, AlertCircle, Edit3
} from 'lucide-react';
import { useAssessmentTimeState } from '../hooks/useAssessmentTimeState';
import { formatDate } from '../../../utils/dateUtils';
import Button from '../../../components/common/Button';
import Badge from '../../../components/common/Badge';

/**
 * AssessmentTimePanel
 *
 * Displays live assessment window countdown, progress bar, duration & mark statistics,
 * and quick-action triggers for Admins and Instructors (e.g. Extend by 1h, 1d, or Close Now).
 */
export const AssessmentTimePanel = ({ assessment, onExtend, onClose, isUpdating = false }) => {
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [customMinutes, setCustomMinutes] = useState(60);

  const startTime = assessment?.startTime;
  const endTime = assessment?.endTime;
  const { state, countdown, secondsLeft, windowPct, isClosingSoon } = useAssessmentTimeState(startTime, endTime);

  // Status configuration
  const STATE_CONFIG = {
    locked: {
      label: 'Scheduled',
      sub: `Opens in ${countdown}`,
      tone: 'warning',
      badgeBg: 'rgba(245, 158, 11, 0.15)',
      badgeColor: '#fbbf24',
      badgeBorder: 'rgba(245, 158, 11, 0.3)',
      icon: CalendarClock,
    },
    open: {
      label: 'Window Active',
      sub: countdown ? `Closes in ${countdown}` : 'Open',
      tone: 'success',
      badgeBg: 'rgba(16, 185, 129, 0.15)',
      badgeColor: '#34d399',
      badgeBorder: 'rgba(16, 185, 129, 0.3)',
      icon: CheckCircle,
    },
    closing_soon: {
      label: 'Closing Soon!',
      sub: `${countdown} remaining`,
      tone: 'danger',
      badgeBg: 'rgba(239, 68, 68, 0.2)',
      badgeColor: '#f87171',
      badgeBorder: 'rgba(239, 68, 68, 0.4)',
      icon: AlarmClock,
    },
    expired: {
      label: 'Window Closed',
      sub: 'Submission deadline passed',
      tone: 'neutral',
      badgeBg: 'rgba(148, 163, 184, 0.15)',
      badgeColor: '#94a3b8',
      badgeBorder: 'rgba(148, 163, 184, 0.3)',
      icon: XCircle,
    },
    open_ended: {
      label: 'Always Open',
      sub: 'No schedule deadline set',
      tone: 'info',
      badgeBg: 'rgba(59, 130, 246, 0.15)',
      badgeColor: '#60a5fa',
      badgeBorder: 'rgba(59, 130, 246, 0.3)',
      icon: Clock,
    },
  };

  const currentCfg = STATE_CONFIG[state] || STATE_CONFIG.open_ended;
  const StateIcon = currentCfg.icon;

  return (
    <div
      style={{
        background: 'linear-gradient(180deg, #161922 0%, #11131a 100%)',
        border: isClosingSoon ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: isClosingSoon ? '0 0 20px rgba(239, 68, 68, 0.15)' : '0 4px 20px rgba(0, 0, 0, 0.3)',
        transition: 'all 0.3s ease',
      }}
    >
      {/* Head */}
      <div
        style={{
          padding: '16px 20px',
          background: 'rgba(255, 255, 255, 0.03)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Hourglass size={16} style={{ color: '#6366f1' }} />
          <span style={{ fontSize: 14, fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.2px' }}>
            Time & Details
          </span>
        </div>
        <span
          style={{
            padding: '3px 10px',
            borderRadius: 99,
            fontSize: 11,
            fontWeight: 700,
            background: currentCfg.badgeBg,
            color: currentCfg.badgeColor,
            border: `1px solid ${currentCfg.badgeBorder}`,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            animation: isClosingSoon ? 'pulse 1.5s infinite' : 'none',
          }}
        >
          <StateIcon size={12} />
          {currentCfg.label}
        </span>
      </div>

      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Countdown Banner */}
        {state !== 'open_ended' && (
          <div
            style={{
              padding: '12px 14px',
              borderRadius: 12,
              background: isClosingSoon ? 'rgba(239, 68, 68, 0.1)' : 'rgba(99, 102, 241, 0.08)',
              border: isClosingSoon ? '1px solid rgba(239, 68, 68, 0.25)' : '1px solid rgba(99, 102, 241, 0.2)',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>
                {state === 'locked' ? 'Window Opens' : state === 'expired' ? 'Window Status' : 'Remaining Time'}
              </span>
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 800,
                  color: isClosingSoon ? '#f87171' : '#a5b4fc',
                  fontFamily: 'monospace',
                }}
              >
                {currentCfg.sub}
              </span>
            </div>

            {/* Progress Bar for open window */}
            {state === 'open' || state === 'closing_soon' ? (
              <div style={{ width: '100%', height: 6, background: 'rgba(255, 255, 255, 0.08)', borderRadius: 99, overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${windowPct}%`,
                    background: isClosingSoon
                      ? 'linear-gradient(90deg, #f59e0b 0%, #ef4444 100%)'
                      : 'linear-gradient(90deg, #6366f1 0%, #3b82f6 100%)',
                    borderRadius: 99,
                    transition: 'width 1s linear',
                    boxShadow: isClosingSoon ? '0 0 8px rgba(239,68,68,0.5)' : '0 0 8px rgba(99,102,241,0.5)',
                  }}
                />
              </div>
            ) : null}
          </div>
        )}

        {/* Stats Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#94a3b8' }}>
              <Clock size={14} style={{ color: '#38bdf8' }} /> Duration
            </span>
            <span style={{ fontWeight: 700, color: '#f8fafc' }}>
              {assessment?.durationMinutes || 0} min
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#94a3b8' }}>
              <BarChart2 size={14} style={{ color: '#818cf8' }} /> Total Marks
            </span>
            <span style={{ fontWeight: 700, color: '#f8fafc' }}>
              {assessment?.totalMarks || 0}%
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#94a3b8' }}>
              <RefreshCw size={14} style={{ color: '#fbbf24' }} /> Max Attempts
            </span>
            <span style={{ fontWeight: 700, color: '#f8fafc' }}>
              {assessment?.maxAttempts || 1}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#94a3b8' }}>
              <HelpCircle size={14} style={{ color: '#34d399' }} /> Questions
            </span>
            <span style={{ fontWeight: 700, color: '#f8fafc' }}>
              {assessment?.questionCount ?? '—'}
            </span>
          </div>

          {startTime && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#94a3b8' }}>
                <CheckCircle size={14} style={{ color: '#34d399' }} /> Window Opens
              </span>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#cbd5e1' }}>
                {formatDate(startTime)}
              </span>
            </div>
          )}

          {endTime && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#94a3b8' }}>
                <XCircle size={14} style={{ color: '#f87171' }} /> Window Closes
              </span>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#cbd5e1' }}>
                {formatDate(endTime)}
              </span>
            </div>
          )}
        </div>

        {/* Quick Time Triggers for Instructor/Admin */}
        {(onExtend || onClose) && (
          <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <Zap size={13} style={{ color: '#fbbf24' }} /> Time Triggers
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {onExtend && (
                <>
                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={() => onExtend(60)}
                    style={{
                      flex: 1,
                      padding: '7px 10px',
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 600,
                      background: 'rgba(99, 102, 241, 0.15)',
                      border: '1px solid rgba(99, 102, 241, 0.3)',
                      color: '#a5b4fc',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 5,
                      transition: 'all 0.2s',
                    }}
                  >
                    <PlusCircle size={13} /> +1 Hour
                  </button>
                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={() => onExtend(1440)}
                    style={{
                      flex: 1,
                      padding: '7px 10px',
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 600,
                      background: 'rgba(99, 102, 241, 0.15)',
                      border: '1px solid rgba(99, 102, 241, 0.3)',
                      color: '#a5b4fc',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 5,
                      transition: 'all 0.2s',
                    }}
                  >
                    <PlusCircle size={13} /> +1 Day
                  </button>
                </>
              )}

              {onClose && state !== 'expired' && (
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={onClose}
                  style={{
                    padding: '7px 12px',
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 600,
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#f87171',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    transition: 'all 0.2s',
                  }}
                >
                  <XCircle size={13} /> Close Now
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssessmentTimePanel;
