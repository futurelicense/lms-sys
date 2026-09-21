import { useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { ShieldAlert, Monitor, Clock, CheckCircle2, AlertTriangle, Maximize2 } from 'lucide-react';
import { useAssessmentAttempt } from '../hooks/useAssessmentAttempt';
import { useAssessmentProctoring } from '../hooks/useAssessmentProctoring';
import { CodingQuestionPanel } from '../components/CodingQuestionPanel';
import assessmentService from '../services/assessmentService';
import Spinner from '../../../components/common/Spinner';
import ThemeSlider from '../../../components/common/ThemeSlider';

/* ─── Countdown Timer ─── */
function Timer({ seconds }) {
  if (seconds == null) return null;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const pad = (n) => String(n).padStart(2, '0');
  const isUrgent = seconds < 300;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '6px 14px', borderRadius: 8,
      background: isUrgent ? 'rgba(239,68,68,0.12)' : 'var(--surface-medium)',
      border: `1px solid ${isUrgent ? 'rgba(239,68,68,0.35)' : 'var(--border-color)'}`,
      color: isUrgent ? '#f87171' : 'var(--text-primary)',
      fontFamily: 'monospace', fontSize: 15, fontWeight: 700,
      transition: 'all 0.3s',
    }}>
      <Clock size={15} />
      {h > 0 ? `${pad(h)}:` : ''}{pad(m)}:{pad(s)}
    </div>
  );
}

/* ─── Rules / agreement screen ─── */
function RulesScreen({ assessment, onAgree }) {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', fontFamily: 'Inter, sans-serif', position: 'relative',
    }}>
      <div style={{ position: 'absolute', top: 20, right: 24, zIndex: 10 }}>
        <ThemeSlider size="md" />
      </div>
      <div style={{
        maxWidth: 560, width: '100%', margin: '0 24px',
        background: 'var(--lms-card)', border: '1px solid var(--border-color)',
        borderRadius: 20, padding: '40px 36px', boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12,
            background: 'rgba(124,58,237,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <ShieldAlert size={24} color="#7c3aed" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>
              {assessment?.assessmentTitle ?? 'Assessment'}
            </h1>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
              {assessment?.durationMinutes} min · {assessment?.questions?.length ?? 0} question{assessment?.questions?.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <h2 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Exam Rules
          </h2>
          {[
            'Your screen will be recorded for the duration of the exam.',
            'The exam must be taken in fullscreen mode.',
            'Switching tabs or minimizing the window will count as a violation.',
            `3 violations will result in automatic submission.`,
            'Right-click, DevTools (F12), and Ctrl+Shift+I are disabled.',
            'Your code is autosaved every 2 seconds.',
            'Do not refresh the page — your progress will be preserved.',
          ].map((rule, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 10 }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(124,58,237,0.1)', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>
                {i + 1}
              </div>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{rule}</p>
            </div>
          ))}
        </div>

        <button
          onClick={onAgree}
          style={{
            width: '100%', padding: '12px', borderRadius: 10, border: 'none',
            background: '#7c3aed', color: '#fff', fontSize: 14, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'opacity 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
        >
          I Agree — Start Exam
        </button>
      </div>
    </div>
  );
}

/* ─── Violation Modal ─── */
function ViolationModal({ violation, maxStrikes, onDismiss, onReenter }) {
  if (!violation) return null;
  const isTerminated = violation.count >= maxStrikes;
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Inter, sans-serif',
    }}>
      <div style={{
        background: 'var(--lms-card)', borderRadius: 16, padding: '32px 28px',
        maxWidth: 420, width: '100%', margin: '0 20px',
        border: `1px solid ${isTerminated ? 'rgba(239,68,68,0.4)' : 'rgba(245,158,11,0.4)'}`,
        boxShadow: '0 16px 48px rgba(0,0,0,0.3)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <AlertTriangle size={24} color={isTerminated ? '#f87171' : '#f59e0b'} />
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: isTerminated ? '#f87171' : '#f59e0b' }}>
            {isTerminated ? 'Exam Terminated' : 'Security Violation'}
          </h2>
        </div>
        <p style={{ margin: '0 0 8px', fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          {violation.reason}
        </p>
        <p style={{ margin: '0 0 20px', fontSize: 13, color: 'var(--text-muted)' }}>
          Violation {violation.count} of {maxStrikes}
          {isTerminated ? ' — your exam has been auto-submitted.' : ''}
        </p>
        {!isTerminated && (
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={onReenter}
              style={{
                flex: 1, padding: '10px', borderRadius: 8, border: 'none',
                background: '#7c3aed', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
              }}
            >
              <Maximize2 size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
              Return to Fullscreen
            </button>
            <button
              onClick={onDismiss}
              style={{
                padding: '10px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13,
                background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-secondary)',
              }}
            >
              Dismiss
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Page ─── */
export const AssessmentPage = () => {
  const { assessmentId } = useParams();
  const suppressRef = useRef(false);

  // ── Attempt lifecycle (start / resume / autosave / submit / timer)
  const {
    attempt, loading, error,
    drafts, saveStatus,
    submitting, submitError,
    remainingSeconds,
    answeredCount, totalQuestions,
    updateDraft, handleSubmit,
  } = useAssessmentAttempt(assessmentId, {
    onTimeExpired: () => triggerAutoSubmit(),
  });

  // ── Proctoring (fullscreen + recording + strike system)
  const {
    isRulesAgreed, setIsRulesAgreed,
    tabSwitchCount, maxStrikes,
    lastViolation,
    showViolationModal, setShowViolationModal,
    isTerminated,
    isScreenRecording,
    enterFullscreen,
    startScreenRecording,
    stopAndGetRecordingBlob,
  } = useAssessmentProctoring({
    enabled: true,
    suppressRef,
    onSecurityViolationSubmit: () => triggerAutoSubmit(),
  });

  // Upload recording blob to Cloudflare R2, then submit
  const triggerAutoSubmit = useCallback(async () => {
    suppressRef.current = true;
    const blob = await stopAndGetRecordingBlob();
    const onBeforeSubmit = blob
      ? async () => {
          try {
            const durationSecs = Math.round(blob.size / 50000); // rough estimate
            await assessmentService.uploadRecordingDirect(attempt?.attemptId, blob, durationSecs);
          } catch {
            // Non-fatal — submission proceeds regardless
          }
        }
      : null;
    await handleSubmit(true, onBeforeSubmit);
  }, [attempt?.attemptId, handleSubmit, stopAndGetRecordingBlob]);

  const handleAgree = useCallback(async () => {
    setIsRulesAgreed(true);
    await enterFullscreen();
    await startScreenRecording();
  }, [enterFullscreen, setIsRulesAgreed, startScreenRecording]);

  const handleManualSubmit = useCallback(async () => {
    if (!window.confirm('Submit your exam? This cannot be undone.')) return;
    suppressRef.current = true;
    await triggerAutoSubmit();
  }, [triggerAutoSubmit]);

  /* ─── Loading / error states ─── */
  if (loading) return <Spinner fullPage />;

  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', fontFamily: 'Inter, sans-serif', gap: 16 }}>
        <AlertTriangle size={40} color="#f87171" />
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>Failed to load assessment</h2>
        <p style={{ margin: 0, fontSize: 14, color: 'var(--text-muted)', textAlign: 'center', maxWidth: 400 }}>{error}</p>
      </div>
    );
  }

  /* ─── Pre-exam rules agreement screen ─── */
  if (!isRulesAgreed) {
    return <RulesScreen assessment={attempt} onAgree={handleAgree} />;
  }

  const questions = attempt?.questions ?? [];

  /* ─── Exam UI ─── */
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'Inter, sans-serif' }}>

      {/* ── Top bar ── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 24px',
        background: 'var(--lms-card)', borderBottom: '1px solid var(--border-color)',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}>
        {/* Title + progress */}
        <div>
          <h1 style={{ margin: '0 0 2px', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
            {attempt?.assessmentTitle ?? 'Assessment'}
          </h1>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>
            {answeredCount} / {totalQuestions} answered
          </p>
        </div>

        {/* Status indicators */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Screen recording indicator */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 12, color: isScreenRecording ? '#22c55e' : '#f87171',
          }}>
            <Monitor size={14} />
            {isScreenRecording ? 'Recording' : 'Not recording'}
          </div>

          {/* Strike indicator */}
          {tabSwitchCount > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6, fontSize: 12,
              color: tabSwitchCount >= maxStrikes - 1 ? '#f87171' : '#f59e0b',
            }}>
              <ShieldAlert size={14} />
              {tabSwitchCount}/{maxStrikes} strikes
            </div>
          )}

          <Timer seconds={remainingSeconds} />
          <ThemeSlider size="sm" />

          {/* Submit button */}
          <button
            onClick={handleManualSubmit}
            disabled={submitting || isTerminated}
            style={{
              padding: '8px 18px', borderRadius: 8, border: 'none',
              background: submitting ? 'var(--border-color)' : '#7c3aed',
              color: submitting ? 'var(--text-muted)' : '#fff',
              fontSize: 13, fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer',
              fontFamily: 'Inter, sans-serif', transition: 'opacity 0.15s',
            }}
            onMouseEnter={(e) => { if (!submitting) e.currentTarget.style.opacity = '0.85'; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
          >
            {submitting ? 'Submitting…' : 'Submit Exam'}
          </button>
        </div>
      </div>

      {/* ── Questions ── */}
      <div style={{ padding: '24px 24px 80px' }}>
        {submitError && (
          <div style={{
            padding: '12px 16px', borderRadius: 10, marginBottom: 16,
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
            color: '#f87171', fontSize: 13,
          }}>
            {submitError}
          </div>
        )}

        {questions.map((question, idx) => (
          <div key={question.id} style={{ marginBottom: 28 }}>
            {/* Question number label */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12,
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: drafts[question.id]?.sourceCode?.trim()
                  ? 'rgba(34,197,94,0.12)' : 'var(--surface-medium)',
                color: drafts[question.id]?.sourceCode?.trim() ? '#22c55e' : 'var(--text-muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700, flexShrink: 0,
              }}>
                {drafts[question.id]?.sourceCode?.trim()
                  ? <CheckCircle2 size={14} />
                  : idx + 1}
              </div>
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>
                Question {idx + 1} of {totalQuestions}
                {question.marks ? ` · ${question.marks} marks` : ''}
              </span>
              {saveStatus[question.id] && (
                <span style={{
                  fontSize: 11, color:
                    saveStatus[question.id] === 'saving' ? '#f59e0b' :
                    saveStatus[question.id] === 'saved' ? '#22c55e' : '#f87171',
                }}>
                  {saveStatus[question.id] === 'saving' ? '⟳ Saving…'
                    : saveStatus[question.id] === 'saved' ? '✓ Saved'
                    : '⚠ Save failed'}
                </span>
              )}
            </div>

            <CodingQuestionPanel
              question={question}
              draft={drafts[question.id]}
              saveStatus={saveStatus[question.id]}
              onDraftChange={(patch) => updateDraft(question.id, patch)}
              isReadOnly={isTerminated || submitting}
            />
          </div>
        ))}
      </div>

      {/* ── Violation modal ── */}
      {showViolationModal && (
        <ViolationModal
          violation={lastViolation}
          maxStrikes={maxStrikes}
          onDismiss={() => setShowViolationModal(false)}
          onReenter={async () => {
            setShowViolationModal(false);
            await enterFullscreen();
          }}
        />
      )}
    </div>
  );
};

export default AssessmentPage;

