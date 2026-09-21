import React from 'react';
import { ShieldCheck, Monitor, AlertTriangle } from 'lucide-react';

/**
 * Premium top-bar proctoring status badges: Screen Recording + Anti-Cheat Shield + Violation Strikes
 */
export const ProctoringWidget = ({
  isScreenRecording = false,
  tabSwitchCount = 0,
  maxStrikes = 3,
}) => {
  const hasStrikes = tabSwitchCount > 0;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {/* Screen Recording Badge */}
      <div
        title={isScreenRecording ? 'Your screen is being actively recorded' : 'Screen monitoring initialized'}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '4px 10px',
          borderRadius: 6,
          background: isScreenRecording
            ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.08) 100%)'
            : 'rgba(148, 163, 184, 0.1)',
          border: `1px solid ${isScreenRecording ? 'rgba(239, 68, 68, 0.35)' : 'rgba(255, 255, 255, 0.08)'}`,
          color: isScreenRecording ? '#fca5a5' : '#94a3b8',
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.03em',
          backdropFilter: 'blur(8px)',
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: isScreenRecording ? '#ef4444' : '#64748b',
            boxShadow: isScreenRecording ? '0 0 8px #ef4444' : 'none',
            animation: isScreenRecording ? 'pulseDot 1.6s infinite ease-in-out' : 'none',
          }}
        />
        <Monitor size={12} style={{ color: isScreenRecording ? '#ef4444' : '#94a3b8' }} />
        <span>{isScreenRecording ? 'REC ACTIVE' : 'MONITOR READY'}</span>
      </div>

      {/* Anti-Cheat Shield Badge */}
      <div
        title="Anti-cheat lockdown active: tab switches, copy-paste and developer tools are monitored"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          padding: '4px 10px',
          borderRadius: 6,
          background: hasStrikes
            ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.08) 100%)'
            : 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.08) 100%)',
          border: `1px solid ${hasStrikes ? 'rgba(245, 158, 11, 0.35)' : 'rgba(16, 185, 129, 0.35)'}`,
          color: hasStrikes ? '#fcd34d' : '#6ee7b7',
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.02em',
          backdropFilter: 'blur(8px)',
        }}
      >
        <ShieldCheck size={13} />
        <span>ANTI-CHEAT</span>
      </div>

      {/* Strikes Counter Badge */}
      <div
        title={`${tabSwitchCount} out of ${maxStrikes} strikes recorded. Exceeding ${maxStrikes} will auto-submit the exam.`}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          padding: '4px 9px',
          borderRadius: 6,
          background: hasStrikes
            ? 'rgba(239, 68, 68, 0.15)'
            : 'rgba(255, 255, 255, 0.05)',
          border: `1px solid ${hasStrikes ? 'rgba(239, 68, 68, 0.35)' : 'rgba(255, 255, 255, 0.08)'}`,
          color: hasStrikes ? '#fca5a5' : '#94a3b8',
          fontSize: 11,
          fontWeight: 600,
          backdropFilter: 'blur(8px)',
        }}
      >
        <AlertTriangle size={12} style={{ color: hasStrikes ? '#ef4444' : '#94a3b8' }} />
        <span>Strikes: {tabSwitchCount}/{maxStrikes}</span>
      </div>

      <style>{`
        @keyframes pulseDot {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.6; }
        }
      `}</style>
    </div>
  );
};

export default ProctoringWidget;
