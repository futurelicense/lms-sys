import React, { useState, useEffect, useRef } from 'react';
import {
  CheckCircle2, Clock, ShieldCheck, Database, Cpu,
  FileCode2, AlertCircle, Award, Loader2, RefreshCw, AlertTriangle
} from 'lucide-react';
import Button from '../../../components/common/Button';

/**
 * Stage definitions mapped to UI label, icon, and progress percentage.
 */
const STAGE_CONFIG = {
  saving: {
    label: 'Packaging and formatting code solutions...',
    icon: FileCode2,
    percent: 30,
  },
  uploading: {
    label: 'Finalizing anti-cheat & proctoring telemetry...',
    icon: ShieldCheck,
    percent: 65,
  },
  submitting: {
    label: 'Synchronizing submission records with database...',
    icon: Database,
    percent: 90,
  },
  completed: {
    label: 'Submission finalized! Preparing results dashboard...',
    icon: Award,
    percent: 100,
  },
  error: {
    label: 'Submission paused due to a network error.',
    icon: AlertCircle,
    percent: 60,
  },
};

/**
 * Processing / Submission Screen:
 * Displays a live, synchronized progress dashboard showing real-time submission stages,
 * questions attended summary, and immediate transition upon completion without artificial delays.
 */
export const ProcessingScreen = ({
  stage = 'saving',
  errorMessage = null,
  questions = [],
  drafts = {},
  assessmentTitle = 'Assessment',
  onRetry,
  onCancel,
  onDone,
}) => {
  const [elapsedMs, setElapsedMs] = useState(0);
  const startTimeRef = useRef(null);
  const timerRef = useRef(null);

  // Derive questions statistics
  const totalQuestions = questions.length;
  const attendedList = questions.filter((q) => {
    const draft = drafts[q.id];
    return draft && draft.sourceCode && draft.sourceCode.trim().length > 0;
  });
  const attendedCount = attendedList.length;
  const skippedCount = totalQuestions - attendedCount;
  const completionPercent = totalQuestions > 0 ? Math.round((attendedCount / totalQuestions) * 100) : 0;

  // Real-time elapsed stopwatch ticker (updates smoothly every 100ms without freezing)
  useEffect(() => {
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setElapsedMs(Date.now() - startTimeRef.current);
    }, 100);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Stop timer once completed or error
  useEffect(() => {
    if ((stage === 'completed' || stage === 'error') && timerRef.current) {
      clearInterval(timerRef.current);
    }
  }, [stage]);

  const currentStageConfig = STAGE_CONFIG[stage] || STAGE_CONFIG.saving;
  const StageIcon = currentStageConfig.icon;
  const progressPercent = currentStageConfig.percent;
  const elapsedSecs = (elapsedMs / 1000).toFixed(1);

  const isCompleted = stage === 'completed';
  const isError = stage === 'error';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'radial-gradient(ellipse at center, #0f172a 0%, #030712 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        overflowY: 'auto',
        color: '#f8fafc',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Container Box */}
      <div
        style={{
          width: '100%',
          maxWidth: '780px',
          background: 'rgba(15, 23, 42, 0.88)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '20px',
          padding: '32px',
          boxShadow: isCompleted
            ? '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 45px rgba(16, 185, 129, 0.2)'
            : isError
            ? '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 45px rgba(239, 68, 68, 0.2)'
            : '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 45px rgba(99, 102, 241, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          animation: 'fadeSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Top Header: Spinner/Check + Title + Live Timer Badge */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '14px',
                background: isCompleted
                  ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                  : isError
                  ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                  : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: isCompleted
                  ? '0 8px 20px rgba(16, 185, 129, 0.4)'
                  : isError
                  ? '0 8px 20px rgba(239, 68, 68, 0.4)'
                  : '0 8px 20px rgba(99, 102, 241, 0.4)',
                transition: 'all 0.4s ease',
              }}
            >
              {isCompleted ? (
                <CheckCircle2 size={26} color="#ffffff" />
              ) : isError ? (
                <AlertTriangle size={26} color="#ffffff" />
              ) : (
                <Loader2 size={26} color="#ffffff" style={{ animation: 'spin360 1s linear infinite' }} />
              )}
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em', color: '#ffffff' }}>
                {isCompleted
                  ? 'Assessment Submitted!'
                  : isError
                  ? 'Submission Encountered An Error'
                  : 'Submitting Assessment'}
              </h2>
              <p style={{ margin: '3px 0 0', fontSize: 13, color: '#94a3b8' }}>
                {assessmentTitle} · Saving your responses securely
              </p>
            </div>
          </div>

          {/* Dynamic Live Status & Timer Badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: isCompleted
                ? 'rgba(16, 185, 129, 0.15)'
                : isError
                ? 'rgba(239, 68, 68, 0.15)'
                : 'rgba(99, 102, 241, 0.15)',
              border: `1px solid ${
                isCompleted
                  ? 'rgba(16, 185, 129, 0.35)'
                  : isError
                  ? 'rgba(239, 68, 68, 0.35)'
                  : 'rgba(99, 102, 241, 0.35)'
              }`,
              borderRadius: '30px',
              padding: '6px 16px',
              transition: 'all 0.3s ease',
            }}
          >
            {isCompleted ? (
              <>
                <CheckCircle2 size={16} style={{ color: '#34d399' }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#34d399' }}>
                  Completed in <strong style={{ color: '#ffffff', fontSize: 14 }}>{elapsedSecs}s</strong>
                </span>
              </>
            ) : isError ? (
              <>
                <AlertCircle size={16} style={{ color: '#f87171' }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#fca5a5' }}>
                  Paused ({elapsedSecs}s)
                </span>
              </>
            ) : (
              <>
                <Clock size={16} style={{ color: '#818cf8', animation: 'pulseGlow 1.5s infinite' }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#c7d2fe' }}>
                  Finalizing · <strong style={{ color: '#ffffff', fontSize: 14 }}>{elapsedSecs}s</strong>
                </span>
              </>
            )}
          </div>
        </div>

        {/* Animated Smooth Progress Bar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div
            style={{
              width: '100%',
              height: 8,
              background: 'rgba(255, 255, 255, 0.08)',
              borderRadius: 99,
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${progressPercent}%`,
                background: isCompleted
                  ? 'linear-gradient(90deg, #10b981 0%, #059669 100%)'
                  : isError
                  ? 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)'
                  : 'linear-gradient(90deg, #6366f1 0%, #10b981 100%)',
                borderRadius: 99,
                transition: 'width 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)',
                boxShadow: isCompleted
                  ? '0 0 16px rgba(16, 185, 129, 0.7)'
                  : isError
                  ? '0 0 16px rgba(239, 68, 68, 0.7)'
                  : '0 0 14px rgba(99, 102, 241, 0.5)',
              }}
            />
          </div>

          {/* Live Step Progress Ticker */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: 12,
              color: '#94a3b8',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <StageIcon
                size={15}
                style={{
                  color: isCompleted ? '#34d399' : isError ? '#f87171' : '#818cf8',
                }}
              />
              <span style={{ color: '#cbd5e1', fontWeight: 600 }}>
                {currentStageConfig.label}
              </span>
            </div>
            <span
              style={{
                fontFamily: 'monospace',
                fontWeight: 700,
                color: isCompleted ? '#34d399' : isError ? '#f87171' : '#818cf8',
              }}
            >
              {progressPercent}%
            </span>
          </div>
        </div>

        {/* Error Notification & Action Banner (Shown only on submission error) */}
        {isError && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 12,
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <AlertCircle size={20} style={{ color: '#f87171', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#fecaca' }}>
                  Submission could not be completed
                </div>
                <div style={{ fontSize: 12, color: '#fca5a5', marginTop: 2 }}>
                  {errorMessage || 'Your code is securely saved locally. Please check your connection and click Retry.'}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              {onCancel && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onCancel}
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    color: '#cbd5e1',
                    fontSize: 12,
                  }}
                >
                  Back to Assessment
                </Button>
              )}
              {onRetry && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={onRetry}
                  style={{
                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    fontSize: 12,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <RefreshCw size={14} />
                  Retry Submission
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Summary Metric Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 12,
          }}
        >
          {/* Total Questions */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: 12,
              padding: '12px 16px',
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.05em' }}>
              Total Questions
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#f8fafc', marginTop: 4 }}>
              {totalQuestions}
            </div>
          </div>

          {/* Attended (Answered) */}
          <div
            style={{
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              borderRadius: 12,
              padding: '12px 16px',
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#34d399', letterSpacing: '0.05em' }}>
              Attended
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#10b981', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>{attendedCount}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#34d399' }}>({completionPercent}%)</span>
            </div>
          </div>

          {/* Unattended (Skipped) */}
          <div
            style={{
              background: skippedCount > 0 ? 'rgba(245, 158, 11, 0.08)' : 'rgba(255, 255, 255, 0.03)',
              border: skippedCount > 0 ? '1px solid rgba(245, 158, 11, 0.25)' : '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: 12,
              padding: '12px 16px',
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: skippedCount > 0 ? '#fbbf24' : '#64748b', letterSpacing: '0.05em' }}>
              Unattended
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: skippedCount > 0 ? '#fbbf24' : '#94a3b8', marginTop: 4 }}>
              {skippedCount}
            </div>
          </div>
        </div>

        {/* Detailed List of Attended & Skipped Questions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0' }}>
              Questions Breakdown
            </span>
            <span style={{ fontSize: 11, color: '#64748b' }}>
              All responses are recorded and locked
            </span>
          </div>

          <div
            style={{
              maxHeight: 200,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              paddingRight: 4,
            }}
          >
            {questions.map((q, idx) => {
              const draft = drafts[q.id];
              const isAnswered = draft && draft.sourceCode && draft.sourceCode.trim().length > 0;
              const lang = draft?.language || 'java';
              const codeLines = isAnswered ? draft.sourceCode.trim().split('\n').length : 0;

              return (
                <div
                  key={q.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: isAnswered ? 'rgba(16, 185, 129, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                    border: `1px solid ${isAnswered ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.06)'}`,
                    borderRadius: 10,
                    padding: '10px 14px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 6,
                        background: isAnswered ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                        color: isAnswered ? '#34d399' : '#64748b',
                        fontSize: 11,
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {idx + 1}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#f8fafc' }}>
                        {q.title || `Question ${idx + 1}`}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2, fontSize: 11, color: '#64748b' }}>
                        <span>{q.marks || 10} Marks</span>
                        {isAnswered && (
                          <>
                            <span>·</span>
                            <span style={{ textTransform: 'capitalize', color: '#94a3b8' }}>{lang}</span>
                            <span>·</span>
                            <span>{codeLines} lines</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {isAnswered ? (
                      <span
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          fontSize: 11,
                          fontWeight: 700,
                          padding: '3px 10px',
                          borderRadius: 20,
                          background: 'rgba(16, 185, 129, 0.15)',
                          color: '#34d399',
                          border: '1px solid rgba(16, 185, 129, 0.3)',
                        }}
                      >
                        <CheckCircle2 size={12} />
                        <span>Attended</span>
                      </span>
                    ) : (
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          padding: '3px 10px',
                          borderRadius: 20,
                          background: 'rgba(255, 255, 255, 0.05)',
                          color: '#64748b',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                        }}
                      >
                        Skipped
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Security / Safe Submission Guarantee */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: '8px 14px',
            background: 'rgba(99, 102, 241, 0.06)',
            borderRadius: 8,
            border: '1px solid rgba(99, 102, 241, 0.15)',
            fontSize: 12,
            color: '#a5b4fc',
          }}
        >
          <ShieldCheck size={14} style={{ color: '#818cf8' }} />
          <span>Responses and test recordings are encrypted and saved to the database.</span>
        </div>
      </div>

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(12px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes spin360 {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes pulseGlow {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.08); }
        }
      `}</style>
    </div>
  );
};

export default ProcessingScreen;
