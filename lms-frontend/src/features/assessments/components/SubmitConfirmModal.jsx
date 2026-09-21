import React from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, CheckCircle2, Circle, X, ArrowRight, ShieldAlert } from 'lucide-react';
import Button from '../../../components/common/Button';

/**
 * Premium Pre-Submission Confirmation Dialog
 */
export const SubmitConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
  questions = [],
  drafts = {},
  assessmentTitle = 'Assessment',
  onJumpToQuestion,
}) => {

  const answered = questions.filter((q) => drafts[q.id]?.sourceCode?.trim());
  const unanswered = questions.filter((q) => !drafts[q.id]?.sourceCode?.trim());
  const completionPct = questions.length > 0 ? Math.round((answered.length / questions.length) * 100) : 0;

  React.useEffect(() => {
    if (!isOpen || isLoading) return;
    const handleModalKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        onConfirm?.();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose?.();
      }
    };
    window.addEventListener('keydown', handleModalKey);
    return () => window.removeEventListener('keydown', handleModalKey);
  }, [isOpen, isLoading, onConfirm, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(5, 8, 16, 0.8)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      <div
        style={{
          background: '#0f172a',
          border: '1px solid rgba(99, 102, 241, 0.35)',
          borderRadius: 20,
          width: '100%',
          maxWidth: 520,
          boxShadow: '0 25px 60px rgba(0,0,0,0.6), 0 0 35px rgba(99,102,241,0.15)',
          overflow: 'hidden',
          animation: 'modalFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          color: '#ffffff',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            background: '#090d18',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: 'rgba(99, 102, 241, 0.15)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                color: '#818cf8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ShieldAlert size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#f8fafc' }}>
                Submit Assessment
              </h3>
              <p style={{ margin: 0, fontSize: 12, color: '#94a3b8' }}>
                Final Submission Confirmation
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 6,
              cursor: 'pointer',
              color: '#94a3b8',
              padding: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px' }}>
          <p style={{ fontSize: 13, color: '#94a3b8', margin: '0 0 20px', lineHeight: 1.6 }}>
            You are finalizing your test session for <strong style={{ color: '#ffffff' }}>{assessmentTitle}</strong>. Once submitted, your answers will be locked for grading and cannot be modified.
          </p>

          {/* Completion Progress Bar */}
          <div
            style={{
              background: '#090e1a',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 12,
              padding: '16px',
              marginBottom: 18,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Completion Status
              </span>
              <span style={{ fontSize: 13, fontWeight: 800, color: completionPct === 100 ? '#34d399' : '#818cf8' }}>
                {completionPct}% Complete
              </span>
            </div>

            <div style={{ height: 6, background: '#1e293b', borderRadius: 4, overflow: 'hidden', marginBottom: 14 }}>
              <div
                style={{
                  height: '100%',
                  width: `${completionPct}%`,
                  background: completionPct === 100
                    ? 'linear-gradient(90deg, #10b981 0%, #059669 100%)'
                    : 'linear-gradient(90deg, #6366f1 0%, #4f46e5 100%)',
                  borderRadius: 4,
                  transition: 'width 0.4s ease',
                }}
              />
            </div>

            {/* Answered / Unanswered stats */}
            <div style={{ display: 'flex', gap: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle2 size={15} style={{ color: '#10b981' }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#34d399' }}>{answered.length}</span>
                <span style={{ fontSize: 12, color: '#94a3b8' }}>Answered</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Circle size={15} style={{ color: unanswered.length > 0 ? '#ef4444' : '#64748b' }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: unanswered.length > 0 ? '#f87171' : '#94a3b8' }}>
                  {unanswered.length}
                </span>
                <span style={{ fontSize: 12, color: '#94a3b8' }}>Unanswered</span>
              </div>
              <div style={{ marginLeft: 'auto', fontSize: 12, color: '#64748b' }}>
                {questions.length} Total Questions
              </div>
            </div>
          </div>

          {/* Unanswered warning & quick jump links */}
          {unanswered.length > 0 ? (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: 10,
                padding: '12px 14px',
                marginBottom: 16,
              }}
            >
              <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 700, color: '#f87171' }}>
                ⚠️ Unanswered Questions ({unanswered.length}):
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {unanswered.map((q) => {
                  const idx = questions.indexOf(q);
                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => onJumpToQuestion?.(idx)}
                      title={`Jump to Question ${idx + 1}`}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 6,
                        background: 'rgba(239, 68, 68, 0.15)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        color: '#fca5a5',
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <span>Q{idx + 1}: {q.title}</span>
                      <ArrowRight size={11} />
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div
              style={{
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                borderRadius: 10,
                padding: '12px 14px',
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <CheckCircle2 size={16} style={{ color: '#10b981', flexShrink: 0 }} />
              <p style={{ margin: 0, fontSize: 12, color: '#34d399', fontWeight: 600 }}>
                All questions have been answered. You are ready to submit!
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            background: '#090d18',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 10,
          }}
        >
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isLoading}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#cbd5e1',
              fontWeight: 600,
              fontSize: 13,
            }}
          >
            Continue Editing
          </Button>

          <Button
            variant="primary"
            onClick={onConfirm}
            isLoading={isLoading}
            style={{
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              fontWeight: 700,
              fontSize: 13,
              boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)',
            }}
          >
            Confirm &amp; Submit Exam
          </Button>
        </div>
      </div>

      <style>{`
        @keyframes modalFadeIn {
          from { opacity: 0; transform: scale(0.96) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>,
    document.body,
  );
};

export default SubmitConfirmModal;
