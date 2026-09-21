import React, { useState, useEffect, useRef } from 'react';
import {
  Monitor, Lock, Eye, Clock, Award, FileText, CheckCircle2,
  ArrowRight, ArrowLeft, XCircle, Play, Loader2, Video,
  Shield, AlertCircle, AlertTriangle, Check, RefreshCw
} from 'lucide-react';
import Button from '../../../components/common/Button';

/**
 * 2-Step Pre-Flight Assessment Lobby & Quick Launch
 *
 * Flow:
 * 1. Step 1 (RULES): Examination Rules & Security -> Honor Code Checkbox -> "Proceed to System Checks"
 * 2. Step 2 (CHECKS): Pre-Flight System Checks (Screen Share Grant + Fullscreen + Questions) -> "Enter Assessment Workspace"
 * 3. Step 3 (COUNTDOWN): 3-second quick launch countdown -> Test IDE
 */
export const ExamLockdownOverlay = ({
  stage, // 'LOBBY' | 'COUNTDOWN' | 'STARTED'
  onRequestScreen,
  onLaunchAssessment,
  onCountdownComplete,
  onRetry = null,
  isScreenRecording = false,
  screenStream = null,
  loading = false,
  error = null,
  attempt = null,
  drafts = {},
  showViolationModal,
  onDismissViolation,
  lastViolation,
  isTerminated,
  tabSwitchCount,
  maxStrikes = 3,
  assessmentTitle = 'Assessment',
  durationMinutes = 60,
  totalQuestions = 1,
  totalMarks = 100,
  maxAttempts = 1,
  attemptNumber = 1,
}) => {
  const [lobbyStep, setLobbyStep] = useState('RULES'); // 'RULES' | 'CHECKS'
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [isRequestingScreen, setIsRequestingScreen] = useState(false);
  const [launchCountdown, setLaunchCountdown] = useState(15);

  const isScreenActive = isScreenRecording || Boolean(screenStream);
  const isReadyToEnter = isScreenActive && !loading && !error;

  const onCountdownCompleteRef = useRef(onCountdownComplete);
  useEffect(() => { onCountdownCompleteRef.current = onCountdownComplete; }, [onCountdownComplete]);

  // 15-Second Launch Countdown
  useEffect(() => {
    if (stage !== 'COUNTDOWN') return;

    setLaunchCountdown(15);
    const timer = setInterval(() => {
      setLaunchCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onCountdownCompleteRef.current?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [stage]);

  // ── 1. STAGE: UNIFIED PRE-FLIGHT SYSTEM LOBBY ────────────────────────────
  if (stage === 'LOBBY') {
    const questionsCount = attempt?.questions?.length ?? totalQuestions;
    const hasResumedCode = Object.values(drafts).some((d) => d?.sourceCode?.trim());
    const realDuration = attempt?.durationMinutes ?? durationMinutes;
    const realMarks = attempt?.totalMarks ?? totalMarks;
    const realAttemptNum = attempt?.attemptNumber ?? attemptNumber;
    const realMaxAttempts = attempt?.maxAttempts ?? maxAttempts;

    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 99999,
          background: 'rgba(4, 7, 15, 0.96)',
          backdropFilter: 'blur(16px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px 20px',
          fontFamily: 'Inter, system-ui, sans-serif',
          animation: 'overlayFadeIn 0.25s ease',
          color: '#ffffff',
        }}
      >
        <div
          style={{
            maxWidth: 680,
            width: '100%',
            background: 'linear-gradient(180deg, #0f172a 0%, #090d18 100%)',
            border: '1px solid rgba(99, 102, 241, 0.35)',
            borderRadius: 20,
            boxShadow: '0 25px 70px rgba(0,0,0,0.85), 0 0 45px rgba(99,102,241,0.15)',
            overflow: 'hidden',
          }}
        >
          {/* Top Bar Header */}
          <div
            style={{
              padding: '20px 26px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              background: '#0a0f1d',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: 'linear-gradient(135deg, rgba(99,102,241,0.25) 0%, rgba(79,70,229,0.15) 100%)',
                  border: '1px solid rgba(99,102,241,0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#818cf8',
                  boxShadow: '0 0 16px rgba(99,102,241,0.25)',
                }}
              >
                <Shield size={20} />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em' }}>
                  {lobbyStep === 'RULES' ? 'Examination Rules & Security' : 'Pre-Flight System Checks'}
                </h2>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#94a3b8' }}>
                  {lobbyStep === 'RULES'
                    ? 'Step 1 of 2: Review rules and accept integrity policy'
                    : 'Step 2 of 2: Verify screen access and hardware'}
                </p>
              </div>
            </div>

            {/* Test Chips */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <span
                style={{
                  padding: '4px 10px',
                  borderRadius: 20,
                  background: 'rgba(99, 102, 241, 0.12)',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#a5b4fc',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <FileText size={12} /> {assessmentTitle}
              </span>
              <span
                style={{
                  padding: '4px 10px',
                  borderRadius: 20,
                  background: 'rgba(168, 85, 247, 0.12)',
                  border: '1px solid rgba(168, 85, 247, 0.3)',
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#d8b4fe',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <Award size={12} /> Attempt {realAttemptNum} of {realMaxAttempts}
              </span>
              <span
                style={{
                  padding: '4px 10px',
                  borderRadius: 20,
                  background: 'rgba(59, 130, 246, 0.12)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#93c5fd',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <Clock size={12} /> {realDuration} Mins
              </span>
              <span
                style={{
                  padding: '4px 10px',
                  borderRadius: 20,
                  background: 'rgba(245, 158, 11, 0.12)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#fde68a',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <Award size={12} /> {realMarks} Marks
              </span>
            </div>
          </div>

          {/* ── STEP 1: EXAMINATION RULES & SECURITY ── */}
          {lobbyStep === 'RULES' && (
            <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 18 }}>
              <p style={{ margin: 0, fontSize: 13, color: '#cbd5e1', lineHeight: 1.6 }}>
                Please review the security and integrity guidelines below before continuing to the system checks:
              </p>

              <div
                style={{
                  background: '#070a14',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 12,
                  padding: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ padding: 6, borderRadius: 8, background: 'rgba(99,102,241,0.15)', color: '#818cf8', flexShrink: 0 }}>
                    <Monitor size={16} />
                  </div>
                  <div>
                    <strong style={{ fontSize: 13, color: '#f1f5f9' }}>1. Screen Recording (Cloudflare R2):</strong>
                    <p style={{ margin: '2px 0 0', fontSize: 12, color: '#94a3b8', lineHeight: 1.4 }}>
                      Continuous screen stream is recorded and uploaded to encrypted Cloudflare R2 storage for instructor audit.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ padding: 6, borderRadius: 8, background: 'rgba(239,68,68,0.15)', color: '#f87171', flexShrink: 0 }}>
                    <Eye size={16} />
                  </div>
                  <div>
                    <strong style={{ fontSize: 13, color: '#f1f5f9' }}>2. Fullscreen &amp; Tab-Switch Lockdown:</strong>
                    <p style={{ margin: '2px 0 0', fontSize: 12, color: '#94a3b8', lineHeight: 1.4 }}>
                      Switching tabs, minimizing, or exiting fullscreen triggers strikes. Exceeding <strong>{maxStrikes} strikes</strong> automatically terminates and submits your assessment.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ padding: 6, borderRadius: 8, background: 'rgba(245,158,11,0.15)', color: '#fbbf24', flexShrink: 0 }}>
                    <Lock size={16} />
                  </div>
                  <div>
                    <strong style={{ fontSize: 13, color: '#f1f5f9' }}>3. Browser Sandboxing:</strong>
                    <p style={{ margin: '2px 0 0', fontSize: 12, color: '#94a3b8', lineHeight: 1.4 }}>
                      Right-click, developer console (F12), inspect element, and external clipboard paste are locked.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ padding: 6, borderRadius: 8, background: 'rgba(16,185,129,0.15)', color: '#34d399', flexShrink: 0 }}>
                    <Shield size={16} />
                  </div>
                  <div>
                    <strong style={{ fontSize: 13, color: '#f1f5f9' }}>4. Academic Honor Code:</strong>
                    <p style={{ margin: '2px 0 0', fontSize: 12, color: '#94a3b8', lineHeight: 1.4 }}>
                      All submitted code and answers must be authored independently without external assistance or AI tools.
                    </p>
                  </div>
                </div>
              </div>

              {/* Honor Code Checkbox */}
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '14px 16px',
                  borderRadius: 10,
                  background: agreedTerms ? 'rgba(16, 185, 129, 0.08)' : 'rgba(99, 102, 241, 0.08)',
                  border: `1.5px solid ${agreedTerms ? 'rgba(16, 185, 129, 0.4)' : 'rgba(99, 102, 241, 0.25)'}`,
                  cursor: 'pointer',
                  userSelect: 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                <input
                  type="checkbox"
                  checked={agreedTerms}
                  onChange={(e) => setAgreedTerms(e.target.checked)}
                  style={{
                    width: 18,
                    height: 18,
                    accentColor: '#10b981',
                    cursor: 'pointer',
                  }}
                />
                <span style={{ fontSize: 13, color: '#e2e8f0', fontWeight: 600, lineHeight: 1.4 }}>
                  I accept the examination rules and commit to the academic integrity honor code.
                </span>
              </label>

              {/* Step 1 Footer */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: 8,
                }}
              >
                <span style={{ fontSize: 12, color: '#94a3b8' }}>
                  {!agreedTerms ? '⚠️ Check the honor code declaration to continue' : '✅ Ready to proceed'}
                </span>
                <Button
                  variant="primary"
                  disabled={!agreedTerms}
                  onClick={() => setLobbyStep('CHECKS')}
                  iconRight={<ArrowRight size={15} />}
                  style={{
                    background: agreedTerms
                      ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)'
                      : '#334155',
                    padding: '11px 26px',
                    fontSize: 13,
                    fontWeight: 700,
                    borderRadius: 8,
                    boxShadow: agreedTerms ? '0 4px 16px rgba(99,102,241,0.4)' : 'none',
                    cursor: agreedTerms ? 'pointer' : 'not-allowed',
                    transition: 'all 0.2s ease',
                  }}
                >
                  Proceed to System Checks
                </Button>
              </div>
            </div>
          )}

          {/* ── STEP 2: PRE-FLIGHT SYSTEM CHECKS ── */}
          {lobbyStep === 'CHECKS' && (
            <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <p style={{ margin: 0, fontSize: 13, color: '#cbd5e1', lineHeight: 1.6 }}>
                Grant screen access and verify your environment before entering the assessment:
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {/* 1. Screen Share Access */}
                <div
                  style={{
                    background: '#070a14',
                    border: `1px solid ${isScreenActive ? 'rgba(16, 185, 129, 0.35)' : 'rgba(99, 102, 241, 0.35)'}`,
                    borderRadius: 10,
                    padding: '14px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        background: isScreenActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(99, 102, 241, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: isScreenActive ? '#34d399' : '#818cf8',
                      }}
                    >
                      <Video size={18} />
                    </div>
                    <div>
                      <strong style={{ fontSize: 13, color: '#f1f5f9', display: 'block' }}>
                        Screen Recording Access
                      </strong>
                      <span style={{ fontSize: 12, color: isScreenActive ? '#34d399' : '#94a3b8' }}>
                        {isScreenActive ? '● Screen Stream Active & Verified (Monitor)' : 'Select Entire Screen (Monitor) when prompted'}
                      </span>
                    </div>
                  </div>

                  {!isScreenActive ? (
                    <Button
                      variant="primary"
                      isLoading={isRequestingScreen}
                      onClick={async () => {
                        setIsRequestingScreen(true);
                        try {
                          await onRequestScreen();
                        } finally {
                          setIsRequestingScreen(false);
                        }
                      }}
                      style={{
                        padding: '7px 16px',
                        fontSize: 12,
                        fontWeight: 700,
                        borderRadius: 6,
                        background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                      }}
                    >
                      {isRequestingScreen ? 'Selecting…' : 'Grant Access'}
                    </Button>
                  ) : (
                    <div
                      style={{
                        padding: '5px 12px',
                        borderRadius: 6,
                        background: 'rgba(16, 185, 129, 0.15)',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        color: '#34d399',
                        fontSize: 12,
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                      }}
                    >
                      <CheckCircle2 size={14} /> Connected
                    </div>
                  )}
                </div>

                {/* 2. Fullscreen Lockdown */}
                <div
                  style={{
                    background: '#070a14',
                    border: '1px solid rgba(255, 255, 255, 0.07)',
                    borderRadius: 10,
                    padding: '14px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        background: 'rgba(99, 102, 241, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#818cf8',
                      }}
                    >
                      <Monitor size={18} />
                    </div>
                    <div>
                      <strong style={{ fontSize: 13, color: '#f1f5f9', display: 'block' }}>
                        Fullscreen Lockdown Mode
                      </strong>
                      <span style={{ fontSize: 12, color: '#94a3b8' }}>
                        Engages automatically upon entering workspace
                      </span>
                    </div>
                  </div>
                  <div
                    style={{
                      padding: '5px 12px',
                      borderRadius: 6,
                      background: 'rgba(16, 185, 129, 0.15)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      color: '#34d399',
                      fontSize: 12,
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                    }}
                  >
                    <CheckCircle2 size={14} /> Ready
                  </div>
                </div>

                {/* 3. Problem Statement & Compilers */}
                <div
                  style={{
                    background: '#070a14',
                    border: '1px solid rgba(255, 255, 255, 0.07)',
                    borderRadius: 10,
                    padding: '14px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        background: 'rgba(99, 102, 241, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#818cf8',
                      }}
                    >
                      {loading ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : error ? (
                        <AlertCircle size={18} style={{ color: '#ef4444' }} />
                      ) : (
                        <CheckCircle2 size={18} style={{ color: '#10b981' }} />
                      )}
                    </div>
                    <div>
                      <strong style={{ fontSize: 13, color: '#f1f5f9', display: 'block' }}>
                        Assessment Questions &amp; State
                      </strong>
                      <span style={{ fontSize: 12, color: error ? '#f87171' : '#94a3b8' }}>
                        {error
                          ? error
                          : loading
                          ? 'Syncing question drafts…'
                          : `${questionsCount} Problem${questionsCount === 1 ? '' : 's'} Ready ${hasResumedCode ? '(Drafts Restored)' : ''}`}
                      </span>
                    </div>
                  </div>
                  {error && onRetry ? (
                    <button
                      type="button"
                      onClick={onRetry}
                      disabled={loading}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '6px 14px',
                        borderRadius: 6,
                        background: 'rgba(239, 68, 68, 0.15)',
                        border: '1px solid rgba(239, 68, 68, 0.4)',
                        color: '#f87171',
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: loading ? 'not-allowed' : 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'; }}
                      title="Retry fetching assessment questions & state"
                    >
                      <RefreshCw size={12} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
                      {loading ? 'Retrying…' : 'Retry Check'}
                    </button>
                  ) : (
                    <div
                      style={{
                        padding: '5px 12px',
                        borderRadius: 6,
                        background: error
                          ? 'rgba(239, 68, 68, 0.15)'
                          : loading
                          ? 'rgba(99, 102, 241, 0.15)'
                          : 'rgba(16, 185, 129, 0.15)',
                        border: `1px solid ${error ? 'rgba(239, 68, 68, 0.3)' : loading ? 'rgba(99, 102, 241, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                        color: error ? '#f87171' : loading ? '#818cf8' : '#34d399',
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      {error ? 'Failed' : loading ? 'Syncing…' : 'Loaded'}
                    </div>
                  )}
                </div>

                {/* 4. Cloudflare R2 Proctoring Storage */}
                <div
                  style={{
                    background: '#070a14',
                    border: '1px solid rgba(255, 255, 255, 0.07)',
                    borderRadius: 10,
                    padding: '14px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        background: 'rgba(16, 185, 129, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#34d399',
                      }}
                    >
                      <Shield size={18} />
                    </div>
                    <div>
                      <strong style={{ fontSize: 13, color: '#f1f5f9', display: 'block' }}>
                        Cloudflare R2 Proctoring
                      </strong>
                      <span style={{ fontSize: 12, color: '#34d399' }}>
                        Encrypted Storage Channel Armed
                      </span>
                    </div>
                  </div>
                  <div
                    style={{
                      padding: '5px 12px',
                      borderRadius: 6,
                      background: 'rgba(16, 185, 129, 0.15)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      color: '#34d399',
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    Armed
                  </div>
                </div>
              </div>

              {/* Step 2 Footer */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: 8,
                }}
              >
                <button
                  type="button"
                  onClick={() => setLobbyStep('RULES')}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#94a3b8',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 10px',
                    borderRadius: 6,
                  }}
                >
                  <ArrowLeft size={14} /> Back to Rules
                </button>

                <Button
                  variant="primary"
                  disabled={!isReadyToEnter}
                  onClick={onLaunchAssessment}
                  iconRight={<Play size={14} fill="#ffffff" />}
                  style={{
                    background: isReadyToEnter
                      ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                      : '#334155',
                    padding: '11px 32px',
                    fontSize: 13,
                    fontWeight: 800,
                    borderRadius: 8,
                    boxShadow: isReadyToEnter ? '0 4px 20px rgba(16,185,129,0.4)' : 'none',
                    cursor: isReadyToEnter ? 'pointer' : 'not-allowed',
                    transition: 'all 0.2s ease',
                  }}
                >
                  Enter Assessment Workspace
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── 2. STAGE: 15-SECOND EXECUTIVE LAUNCH COCKPIT ─────────────────────────
  if (stage === 'COUNTDOWN') {
    const questionsCount = attempt?.questions?.length ?? totalQuestions;
    const realDuration = attempt?.durationMinutes ?? durationMinutes;
    const realMarks = attempt?.totalMarks ?? totalMarks;
    const realAttemptNum = attempt?.attemptNumber ?? attemptNumber;
    const realMaxAttempts = attempt?.maxAttempts ?? maxAttempts;
    const ringOffset = 282.74 - (282.74 * ((15 - launchCountdown) / 15));

    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 99999,
          background: 'radial-gradient(ellipse at center, rgba(15, 23, 42, 0.98) 0%, rgba(4, 7, 15, 0.99) 100%)',
          backdropFilter: 'blur(20px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px 20px',
          fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
          animation: 'overlayFadeIn 0.25s ease',
          color: '#ffffff',
        }}
      >
        <div
          style={{
            maxWidth: 720,
            width: '100%',
            background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.85) 0%, rgba(8, 12, 24, 0.95) 100%)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            borderRadius: 24,
            padding: '36px 36px 30px',
            boxShadow: '0 30px 80px rgba(0,0,0,0.9), 0 0 60px rgba(99,102,241,0.18)',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Ambient Glow Accent */}
          <div
            style={{
              position: 'absolute',
              top: -60,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 240,
              height: 120,
              background: 'radial-gradient(circle, rgba(99,102,241,0.3) 0%, rgba(0,0,0,0) 70%)',
              pointerEvents: 'none',
            }}
          />

          {/* Central Radial Countdown HUD */}
          <div
            style={{
              position: 'relative',
              width: 104,
              height: 104,
              margin: '0 auto 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg style={{ width: 104, height: 104, transform: 'rotate(-90deg)' }}>
              <circle
                cx="52"
                cy="52"
                r="45"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="5"
                fill="none"
              />
              <circle
                cx="52"
                cy="52"
                r="45"
                stroke="url(#countdownGrad)"
                strokeWidth="5"
                strokeDasharray="282.74"
                strokeDashoffset={ringOffset}
                strokeLinecap="round"
                fill="none"
                style={{ transition: 'stroke-dashoffset 1s linear' }}
              />
              <defs>
                <linearGradient id="countdownGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#818cf8" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
              </defs>
            </svg>
            <div style={{ position: 'absolute', textAlign: 'center' }}>
              <span style={{ fontSize: 32, fontWeight: 900, fontFamily: 'monospace', color: '#ffffff', display: 'block', lineHeight: 1 }}>
                {launchCountdown}
              </span>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#818cf8', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                SEC
              </span>
            </div>
          </div>

          <h2 style={{ margin: '0 0 6px', fontSize: 19, fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em' }}>
            {assessmentTitle}
          </h2>
          <p style={{ margin: '0 0 24px', fontSize: 12, color: '#94a3b8' }}>
            Preparing sandboxed compiler workspace. Assessment starts automatically.
          </p>

          {/* 4 Modular Specification Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 12,
              marginBottom: 24,
              textAlign: 'left',
            }}
          >
            {/* Card 1: Questions & Format */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.07)',
                borderRadius: 14,
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: 'rgba(99, 102, 241, 0.15)',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#818cf8',
                  flexShrink: 0,
                }}
              >
                <FileText size={18} />
              </div>
              <div>
                <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, display: 'block', textTransform: 'uppercase' }}>
                  Problem Count
                </span>
                <strong style={{ fontSize: 14, color: '#f1f5f9' }}>
                  {questionsCount} Coding Challenge{questionsCount === 1 ? '' : 's'}
                </strong>
              </div>
            </div>

            {/* Card 2: Allocated Duration */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.07)',
                borderRadius: 14,
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: 'rgba(59, 130, 246, 0.15)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#60a5fa',
                  flexShrink: 0,
                }}
              >
                <Clock size={18} />
              </div>
              <div>
                <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, display: 'block', textTransform: 'uppercase' }}>
                  Time Budget
                </span>
                <strong style={{ fontSize: 14, color: '#f1f5f9' }}>
                  {realDuration} Minutes Total
                </strong>
              </div>
            </div>

            {/* Card 3: Weightage Score */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.07)',
                borderRadius: 14,
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: 'rgba(245, 158, 11, 0.15)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fbbf24',
                  flexShrink: 0,
                }}
              >
                <Award size={18} />
              </div>
              <div>
                <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, display: 'block', textTransform: 'uppercase' }}>
                  Total Weightage
                </span>
                <strong style={{ fontSize: 14, color: '#f1f5f9' }}>
                  {realMarks} Marks Available
                </strong>
              </div>
            </div>

            {/* Card 4: Attempt Allocation */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.07)',
                borderRadius: 14,
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: 'rgba(168, 85, 247, 0.15)',
                  border: '1px solid rgba(168, 85, 247, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#c084fc',
                  flexShrink: 0,
                }}
              >
                <Shield size={18} />
              </div>
              <div>
                <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, display: 'block', textTransform: 'uppercase' }}>
                  Session Attempt
                </span>
                <strong style={{ fontSize: 14, color: '#f1f5f9' }}>
                  Attempt {realAttemptNum} of {realMaxAttempts}
                </strong>
              </div>
            </div>
          </div>

          {/* Environment Readiness Indicators Strip */}
          <div
            style={{
              padding: '10px 16px',
              borderRadius: 10,
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 16,
              fontSize: 11,
              fontWeight: 600,
              color: '#34d399',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Check size={13} /> Fullscreen Armed
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Check size={13} /> Screen Stream Connected
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Check size={13} /> Compilers Ready
            </span>
          </div>
        </div>
      </div>
    );
  }

  // ── 3. STAGE: EXAM TERMINATED (MAX VIOLATIONS EXCEEDED) ───────────────────
  if (isTerminated) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 99999,
          background: 'rgba(10, 0, 0, 0.96)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      >
        <div
          style={{
            maxWidth: 500,
            width: '100%',
            background: '#1a0d0d',
            border: '1.5px solid #ef4444',
            borderRadius: 16,
            padding: 32,
            textAlign: 'center',
            color: '#ffffff',
            boxShadow: '0 0 50px rgba(239, 68, 68, 0.35)',
          }}
        >
          <div
            style={{
              width: 54,
              height: 54,
              borderRadius: '50%',
              background: 'rgba(239,68,68,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              color: '#ef4444',
            }}
          >
            <XCircle size={32} />
          </div>
          <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 800, color: '#f87171' }}>
            Assessment Terminated
          </h2>
          <p style={{ fontSize: 13, color: '#fca5a5', lineHeight: 1.6, marginBottom: 16 }}>
            You have exceeded the maximum allowed security violation strikes (<strong>{maxStrikes} strikes</strong>).
            Your session has been terminated and auto-submitted for review.
          </p>
          <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>
            Finalizing and redirecting to results…
          </p>
        </div>
      </div>
    );
  }

  // ── 4. STAGE: LIVE VIOLATION WARNING MODAL ────────────────────────────────
  if (showViolationModal && lastViolation) {
    const remainingStrikes = Math.max(0, maxStrikes - tabSwitchCount);
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 99999,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      >
        <div
          style={{
            maxWidth: 460,
            width: '100%',
            background: '#181212',
            border: '1.5px solid #f59e0b',
            borderRadius: 16,
            padding: 28,
            color: '#ffffff',
            boxShadow: '0 0 40px rgba(245, 158, 11, 0.25)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: 'rgba(245,158,11,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#f59e0b',
                flexShrink: 0,
              }}
            >
              <AlertTriangle size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#fbbf24' }}>
                Security Strike {tabSwitchCount} of {maxStrikes}
              </h3>
              <p style={{ margin: 0, fontSize: 12, color: '#94a3b8' }}>
                Proctoring Violation Detected
              </p>
            </div>
          </div>

          <div
            style={{
              background: 'rgba(245,158,11,0.1)',
              border: '1px solid rgba(245,158,11,0.25)',
              borderRadius: 8,
              padding: '10px 12px',
              marginBottom: 16,
            }}
          >
            <p style={{ margin: '0 0 2px', fontSize: 11, fontWeight: 700, color: '#fef3c7', textTransform: 'uppercase' }}>
              Violation Reason:
            </p>
            <p style={{ margin: 0, fontSize: 12, color: '#fde68a', fontFamily: 'monospace' }}>
              {lastViolation.reason}
            </p>
          </div>

          <p style={{ fontSize: 12, color: '#cbd5e1', lineHeight: 1.5, marginBottom: 20 }}>
            Please return to your fullscreen exam window. You have <strong>{remainingStrikes} strike{remainingStrikes === 1 ? '' : 's'} remaining</strong> before your exam is automatically terminated.
          </p>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="primary"
              onClick={onDismissViolation}
              style={{
                background: '#f59e0b',
                color: '#000000',
                fontWeight: 700,
                fontSize: 12,
                border: 'none',
                padding: '8px 18px',
                borderRadius: 6,
              }}
            >
              I Understand &amp; Resume Fullscreen
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default ExamLockdownOverlay;
