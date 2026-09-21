import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  CheckCircle2, XCircle, Clock, RotateCcw, FileText,
  ChevronDown, ChevronUp, Award, ArrowLeft, Video, ExternalLink,
  Lightbulb, TrendingUp, BarChart2, EyeOff, Target,
  ThumbsUp, ThumbsDown, Hash, ArrowUpRight, PlayCircle, Terminal,
  Check, X, AlertTriangle, Sparkles
} from 'lucide-react';
import PageContainer from '../../../components/layout/PageContainer';
import Spinner from '../../../components/common/Spinner';
import ErrorState from '../../../components/common/ErrorState';
import Button from '../../../components/common/Button';
import Badge from '../../../components/common/Badge';
import { ScoreRing } from '../components/ScoreRing';
import { AttemptStatusBadge } from '../components/AttemptStatusBadge';
import { CodeViewer } from '../components/CodeViewer';
import assessmentService from '../services/assessmentService';
import { ROUTES } from '../../../constants/routes';

/**
 * Full assessment result & analytics report page.
 * Enhanced with:
 * - Direct navigation from Assessment Card Result Analytics button
 * - Support for both attempted and unattempted (benchmark preview) states
 * - Grade distribution benchmark bar
 * - Full test case comparisons (Input, Expected, Actual, Pass/Fail)
 * - Code execution console and outputs
 * - Rubric scoring criteria breakdown
 * - Official explanations & solution strategy
 * - Percentile rank and score trends across attempts
 */
export const AssessmentResultPage = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();

  const { data: raw, isLoading, error, refetch } = useQuery({
    queryKey: ['assessment-report', attemptId],
    queryFn: () => assessmentService.getReport(attemptId),
    enabled: Boolean(attemptId),
  });

  const [expandedQuestions, setExpandedQuestions] = useState({});

  const toggleQuestion = (id) =>
    setExpandedQuestions((prev) => ({ ...prev, [id]: !prev[id] }));

  if (isLoading) return <Spinner fullPage />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  // Unwrap nested API response
  const report = raw?.data?.data ?? raw?.data ?? raw;

  if (!report) return (
    <PageContainer title="Assessment Result">
      <p style={{ color: 'var(--text-muted)' }}>No result data found.</p>
    </PageContainer>
  );

  const {
    assessmentTitle,
    assessmentId,
    status,
    finalScore,
    totalMarks = 0,
    percentage = 0,
    passed = false,
    retakePolicy = 'BEST_SCORE',
    attemptsUsed = 0,
    maxAttemptsAllowed = 1,
    timeSpentSeconds = 0,
    recordingPlaybackUrl,
    showResultAnalytics = true,
    percentileRank,
    classAnalytics,
    gradeDistribution = [],
    questionResults = [],
    attemptHistory = [],
  } = report;

  const isNotStarted = attemptsUsed === 0 || status === 'NOT_STARTED' || finalScore == null;
  const minutesSpent = Math.floor((timeSpentSeconds ?? 0) / 60);
  const secondsSpent = (timeSpentSeconds ?? 0) % 60;
  const canRetake = attemptsUsed < maxAttemptsAllowed;

  // Compute strength / weakness from questionResults (if attempted)
  const sortedByPerformance = [...questionResults]
    .filter(q => q.maxMarks > 0)
    .map(q => ({
      ...q,
      pct: Math.round(((q.scoreEarned ?? 0) / q.maxMarks) * 100),
    }))
    .sort((a, b) => b.pct - a.pct);

  const strengths = sortedByPerformance.filter(q => q.pct >= 75).slice(0, 3);
  const weaknesses = sortedByPerformance.filter(q => q.pct < 50).slice(-3).reverse();

  // Sort attempt history by attemptNumber ascending for trend chart
  const sortedAttempts = [...attemptHistory].sort((a, b) => a.attemptNumber - b.attemptNumber);

  const statCard = (label, value, icon, iconColor) => (
    <div style={{
      background: 'var(--bg-primary)',
      border: '1px solid var(--border-color)',
      borderRadius: 10,
      padding: '14px 18px',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
    }}>
      <div style={{ color: iconColor, display: 'flex', alignItems: 'center' }}>{icon}</div>
      <div>
        <p style={{ margin: 0, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.06em' }}>
          {label}
        </p>
        <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
          {value}
        </p>
      </div>
    </div>
  );

  return (
    <PageContainer
      title={isNotStarted ? "Result Analytics & Solutions" : "Assessment Result & Analytics"}
      subtitle={assessmentTitle}
      actions={
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Button
            variant="secondary"
            onClick={() => navigate(ROUTES.STUDENT_ASSESSMENTS)}
            iconLeft={<ArrowLeft size={14} />}
          >
            All Assessments
          </Button>
          {(isNotStarted || canRetake) && (
            <Button
              variant="primary"
              onClick={() => navigate(ROUTES.ASSESSMENT_ATTEMPT(assessmentId))}
              iconLeft={<PlayCircle size={15} />}
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                fontWeight: 700,
                boxShadow: '0 4px 14px rgba(16,185,129,0.35)',
              }}
            >
              {isNotStarted ? "Start Assessment Now" : "Retake Assessment"}
            </Button>
          )}
        </div>
      }
    >
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* ── 1. Hero Banner ──────────────────────────────────────── */}
        {isNotStarted ? (
          <div style={{
            background: 'linear-gradient(135deg, rgba(79,70,229,0.95) 0%, rgba(30,27,75,0.95) 100%)',
            border: '1px solid rgba(129,140,248,0.4)',
            color: '#ffffff',
            borderRadius: 16,
            padding: '28px 30px',
            display: 'flex',
            alignItems: 'center',
            gap: 24,
            boxShadow: '0 12px 32px rgba(0,0,0,0.3), 0 0 20px rgba(99,102,241,0.2)',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{
              width: 80, height: 80, borderRadius: 20,
              background: 'rgba(255,255,255,0.12)',
              border: '2px solid rgba(255,255,255,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#ffffff', flexShrink: 0,
              boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
            }}>
              <BarChart2 size={40} />
            </div>

            <div style={{ flex: 1, zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                <span style={{
                  padding: '3px 10px', borderRadius: 6,
                  background: 'rgba(16, 185, 129, 0.25)',
                  border: '1px solid rgba(52, 211, 153, 0.5)',
                  fontSize: 11, fontWeight: 800, color: '#6ee7b7',
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                }}>
                  <Sparkles size={12} /> Analytics &amp; Solutions Released
                </span>
                <span style={{ fontSize: 12, opacity: 0.85, fontWeight: 600 }}>
                  Ready to Attempt
                </span>
              </div>
              <h2 style={{ margin: '0 0 6px', fontSize: 24, fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
                {assessmentTitle}
              </h2>
              <p style={{ margin: 0, fontSize: 13, opacity: 0.9, lineHeight: 1.5, color: '#e0e7ff' }}>
                Weightage: <strong>{totalMarks} Marks</strong> · Retake Policy: <strong>{retakePolicy}</strong> · {attemptsUsed} of {maxAttemptsAllowed} Attempts Used
              </p>
            </div>

            <div style={{ zIndex: 1, textAlign: 'right' }}>
              <button
                onClick={() => navigate(ROUTES.ASSESSMENT_ATTEMPT(assessmentId))}
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  border: '1px solid rgba(255,255,255,0.4)',
                  color: '#ffffff',
                  borderRadius: 10,
                  padding: '12px 24px',
                  fontSize: 14,
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  whiteSpace: 'nowrap',
                  boxShadow: '0 6px 20px rgba(16, 185, 129, 0.45)',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = ''; }}
              >
                <PlayCircle size={18} />
                Start Assessment Now
              </button>
            </div>
          </div>
        ) : (
          <div style={{
            background: passed
              ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)'
              : 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
            color: '#ffffff',
            borderRadius: 16,
            padding: '28px 28px',
            display: 'flex',
            alignItems: 'center',
            gap: 24,
            boxShadow: '0 10px 30px -5px rgba(0,0,0,0.15)',
          }}>
            {/* Score Ring */}
            <ScoreRing
              percentage={percentage ?? 0}
              size={110}
              strokeWidth={10}
              passed={passed}
            />

            {/* Text */}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                {passed ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
                <span style={{ fontSize: 22, fontWeight: 800 }}>
                  {passed ? 'Assessment Passed!' : 'Not Passed'}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: 15, opacity: 0.92, fontWeight: 600 }}>
                {assessmentTitle}
              </p>
              <p style={{ margin: '4px 0 0', fontSize: 13, opacity: 0.75 }}>
                Score: {finalScore ?? 0} / {totalMarks} pts · Retake Policy: {retakePolicy}
              </p>
            </div>

            {/* Right side — retake button */}
            {canRetake && (
              <div style={{ textAlign: 'right' }}>
                <button
                  onClick={() => navigate(ROUTES.ASSESSMENT_ATTEMPT(assessmentId))}
                  style={{
                    background: 'rgba(255,255,255,0.2)',
                    border: '1.5px solid rgba(255,255,255,0.5)',
                    color: '#ffffff',
                    borderRadius: 8,
                    padding: '8px 18px',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    whiteSpace: 'nowrap',
                    backdropFilter: 'blur(6px)',
                  }}
                >
                  <RotateCcw size={14} />
                  Retake Assessment
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── 2. Stats Row ────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          {isNotStarted ? (
            <>
              {statCard('Total Weightage', `${totalMarks} Marks`, <Award size={20} />, '#6366f1')}
              {statCard('Max Attempts', `${maxAttemptsAllowed} Allowed`, <RotateCcw size={20} />, '#8b5cf6')}
              {statCard('Questions', `${questionResults.length} Questions`, <FileText size={20} />, '#0ea5e9')}
              {statCard('Status', <span style={{ color: '#34d399', fontWeight: 800, fontSize: 14 }}>Ready to Attempt</span>, <PlayCircle size={20} />, '#10b981')}
            </>
          ) : (
            <>
              {statCard('Time Spent', `${minutesSpent}m ${secondsSpent}s`, <Clock size={20} />, '#6366f1')}
              {statCard('Attempts Used', canRetake ? `${attemptsUsed} (Retake Available)` : `${attemptsUsed} / ${maxAttemptsAllowed}`, <RotateCcw size={20} />, '#8b5cf6')}
              {showResultAnalytics ? (
                statCard('Questions', `${questionResults.length}`, <FileText size={20} />, '#0ea5e9')
              ) : (
                statCard('Solutions', 'Restricted', <EyeOff size={20} />, '#f59e0b')
              )}
              {statCard('Status', <AttemptStatusBadge status={status} />, <Award size={20} />, '#f59e0b')}
            </>
          )}
        </div>

        {/* ── 3. Proctoring Screen Recording Session (Cloudflare R2) ── */}
        {recordingPlaybackUrl && (
          <div
            style={{
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: 12,
              overflow: 'hidden',
              padding: '20px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div
                  style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: 'rgba(99, 102, 241, 0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#818cf8',
                  }}
                >
                  <Video size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
                    Proctoring Screen Recording
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
                    Full session screen activity recorded &amp; stored securely on Cloudflare R2
                  </p>
                </div>
              </div>
              <a
                href={recordingPlaybackUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  fontSize: 12, fontWeight: 600, color: '#6366f1',
                  textDecoration: 'none', padding: '5px 10px',
                  borderRadius: 6, background: 'rgba(99, 102, 241, 0.1)',
                }}
              >
                <span>Open in New Tab</span>
                <ExternalLink size={13} />
              </a>
            </div>
            <div style={{ borderRadius: 8, overflow: 'hidden', background: '#0a0a14', border: '1px solid var(--border-color)' }}>
              <video src={recordingPlaybackUrl} controls playsInline style={{ width: '100%', maxHeight: 450, display: 'block', background: '#000000' }}>
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        )}

        {/* ── 4. Class Benchmark & Result Analytics ── */}
        {showResultAnalytics && (classAnalytics || gradeDistribution?.length > 0) && (
          <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 14, padding: '22px', display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(99, 102, 241, 0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8' }}>
                  <BarChart2 size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Comparative Result Analytics</h3>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
                    Performance benchmark across all {classAnalytics?.totalParticipants ?? 0} participating students
                  </p>
                </div>
              </div>
              <Badge tone="info">Analytics Released</Badge>
            </div>

            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
              <div style={{ padding: '14px 16px', borderRadius: 10, background: 'var(--surface-medium)', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Class Average</span>
                <p style={{ margin: '4px 0 0', fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>
                  {classAnalytics?.classAverageScore ?? 0} <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)' }}>/ {totalMarks}</span>
                </p>
                {!isNotStarted && (
                  <span style={{ fontSize: 11, color: (finalScore ?? 0) >= (classAnalytics?.classAverageScore ?? 0) ? '#10b981' : '#f59e0b', fontWeight: 600 }}>
                    {(finalScore ?? 0) >= (classAnalytics?.classAverageScore ?? 0) ? 'Above Average' : 'Below Average'}
                  </span>
                )}
              </div>
              <div style={{ padding: '14px 16px', borderRadius: 10, background: 'var(--surface-medium)', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Highest Score</span>
                <p style={{ margin: '4px 0 0', fontSize: 20, fontWeight: 800, color: '#10b981' }}>
                  {classAnalytics?.highestScore ?? 0} <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)' }}>/ {totalMarks}</span>
                </p>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Top performer mark</span>
              </div>
              <div style={{ padding: '14px 16px', borderRadius: 10, background: 'var(--surface-medium)', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Pass Rate</span>
                <p style={{ margin: '4px 0 0', fontSize: 20, fontWeight: 800, color: '#6366f1' }}>
                  {classAnalytics?.passPercentage ?? 0}%
                </p>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Class passing ratio</span>
              </div>
              <div style={{ padding: '14px 16px', borderRadius: 10, background: 'var(--surface-medium)', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Submissions</span>
                <p style={{ margin: '4px 0 0', fontSize: 20, fontWeight: 800, color: '#fbbf24' }}>
                  {classAnalytics?.totalParticipants ?? 0}
                </p>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Evaluations recorded</span>
              </div>
            </div>

            {/* Grade Distribution Bar */}
            {gradeDistribution?.length > 0 && (
              <div
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 10,
                  padding: '16px 18px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h5 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)' }}>
                    Grade Distribution Benchmark
                  </h5>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Percentage breakdown</span>
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  {gradeDistribution.map((gd) => (
                    <div key={gd.gradeLetter} style={{ flex: 1, textAlign: 'center' }}>
                      <div
                        style={{
                          height: 8,
                          borderRadius: 4,
                          background:
                            gd.gradeLetter === 'A'
                              ? '#10b981'
                              : gd.gradeLetter === 'B'
                              ? '#3b82f6'
                              : gd.gradeLetter === 'C'
                              ? '#f59e0b'
                              : gd.gradeLetter === 'D'
                              ? '#fb923c'
                              : '#ef4444',
                          marginBottom: 6,
                          boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                        }}
                      />
                      <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>
                        {gd.gradeLetter}
                      </span>
                      <span style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block', marginTop: 1 }}>
                        {gd.percentage}% ({gd.count})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── 5. Percentile Rank Card ── */}
        {!isNotStarted && showResultAnalytics && percentileRank != null && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(139, 92, 246, 0.06) 100%)',
            border: '1px solid rgba(99, 102, 241, 0.2)',
            borderRadius: 12, padding: '20px 24px',
            display: 'flex', alignItems: 'center', gap: 20,
          }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: `conic-gradient(#6366f1 ${percentileRank * 3.6}deg, rgba(255,255,255,0.06) 0deg)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, position: 'relative',
            }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                background: 'var(--bg-primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexDirection: 'column',
              }}>
                <span style={{ fontSize: 18, fontWeight: 800, color: '#818cf8', lineHeight: 1 }}>{Math.round(percentileRank)}</span>
                <span style={{ fontSize: 9, fontWeight: 600, color: 'var(--text-muted)', marginTop: 1 }}>%ile</span>
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <Target size={16} style={{ color: '#818cf8' }} />
                <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Percentile Rank</h4>
              </div>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                You scored better than <strong style={{ color: '#a5b4fc' }}>{percentileRank}%</strong> of all students who attempted this assessment.
                {percentileRank >= 90 && <span style={{ color: '#10b981', fontWeight: 600 }}> Outstanding performance!</span>}
                {percentileRank >= 75 && percentileRank < 90 && <span style={{ color: '#34d399', fontWeight: 600 }}> Great job!</span>}
                {percentileRank >= 50 && percentileRank < 75 && <span style={{ color: '#fbbf24', fontWeight: 600 }}> Above median — keep going!</span>}
                {percentileRank < 50 && <span style={{ color: '#f59e0b', fontWeight: 600 }}> Room for improvement.</span>}
              </p>
            </div>
          </div>
        )}

        {/* ── 6. Score Trend Chart (Attempt-over-Attempt) ── */}
        {!isNotStarted && showResultAnalytics && sortedAttempts.length >= 2 && (
          <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 12, padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34d399' }}>
                <TrendingUp size={18} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Score Trend Across Attempts</h3>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>Your performance progression over {sortedAttempts.length} attempts</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 140, padding: '0 8px' }}>
              {sortedAttempts.map((att) => {
                const pct = att.percentage ?? 0;
                const isCurrent = att.attemptId === attemptId;
                const barColor = pct >= 75 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444';
                return (
                  <div key={att.attemptId} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer', transition: 'transform 0.2s ease' }}
                    onClick={() => navigate(ROUTES.ASSESSMENT_RESULT(att.attemptId))}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = ''; }}
                    title={`Attempt #${att.attemptNumber}: ${att.score ?? 0}/${att.totalMarks} (${pct}%) — Click to view`}
                  >
                    <span style={{ fontSize: 11, fontWeight: 700, color: isCurrent ? barColor : 'var(--text-muted)' }}>{Math.round(pct)}%</span>
                    <div style={{
                      width: '100%', maxWidth: 48, height: `${Math.max(8, pct * 1.1)}px`,
                      borderRadius: '6px 6px 2px 2px',
                      background: isCurrent ? `linear-gradient(180deg, ${barColor} 0%, ${barColor}aa 100%)` : `${barColor}44`,
                      border: isCurrent ? `2px solid ${barColor}` : '1px solid transparent',
                      transition: 'height 0.4s ease, background 0.2s ease',
                      position: 'relative',
                    }}>
                      {isCurrent && (
                        <div style={{ position: 'absolute', top: -4, left: '50%', transform: 'translateX(-50%)', width: 8, height: 8, borderRadius: '50%', background: barColor, boxShadow: `0 0 6px ${barColor}` }} />
                      )}
                    </div>
                    <span style={{
                      fontSize: 10, fontWeight: isCurrent ? 800 : 600,
                      color: isCurrent ? 'var(--text-primary)' : 'var(--text-muted)',
                      padding: '2px 6px', borderRadius: 4,
                      background: isCurrent ? 'rgba(99,102,241,0.15)' : 'transparent',
                    }}>#{att.attemptNumber}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── 7. Per-Question Score Bar Chart ── */}
        {!isNotStarted && showResultAnalytics && questionResults.length > 0 && (
          <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 12, padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(59, 130, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60a5fa' }}>
                <Hash size={18} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Per-Question Performance</h3>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>Score breakdown for each question</p>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {questionResults.map((q, idx) => {
                const scorePct = q.maxMarks > 0 ? Math.round(((q.scoreEarned ?? 0) / q.maxMarks) * 100) : 0;
                const barColor = scorePct >= 75 ? '#10b981' : scorePct >= 50 ? '#f59e0b' : '#ef4444';
                return (
                  <div key={q.questionId} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', minWidth: 28, textAlign: 'right' }}>Q{idx + 1}</span>
                    <div style={{ flex: 1, height: 22, borderRadius: 6, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden', position: 'relative' }}>
                      <div style={{ height: '100%', width: `${scorePct}%`, background: `linear-gradient(90deg, ${barColor}cc 0%, ${barColor} 100%)`, borderRadius: 6, transition: 'width 0.6s ease', minWidth: scorePct > 0 ? 4 : 0 }} />
                      <span style={{
                        position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
                        fontSize: 10, fontWeight: 700,
                        color: scorePct > 40 ? '#fff' : 'var(--text-muted)',
                        zIndex: 1, textShadow: scorePct > 40 ? '0 1px 2px rgba(0,0,0,0.3)' : 'none',
                      }}>
                        {q.questionTitle?.length > 35 ? q.questionTitle.substring(0, 35) + '...' : q.questionTitle}
                      </span>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: barColor, minWidth: 55, textAlign: 'right' }}>{q.scoreEarned ?? 0}/{q.maxMarks}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', minWidth: 36, textAlign: 'right' }}>{scorePct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── 8. Strength & Weakness Summary ── */}
        {!isNotStarted && showResultAnalytics && (strengths.length > 0 || weaknesses.length > 0) && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 14 }}>
            {strengths.length > 0 && (
              <div style={{ background: 'var(--bg-primary)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: 12, padding: '18px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34d399' }}>
                    <ThumbsUp size={14} />
                  </div>
                  <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#34d399' }}>Strengths</h4>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {strengths.map((q) => (
                    <div key={q.questionId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderRadius: 8, background: 'rgba(16, 185, 129, 0.06)', border: '1px solid rgba(16, 185, 129, 0.12)' }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', flex: 1 }}>{q.questionTitle}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#10b981', marginLeft: 10 }}>{q.scoreEarned}/{q.maxMarks} ({q.pct}%)</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {weaknesses.length > 0 && (
              <div style={{ background: 'var(--bg-primary)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 12, padding: '18px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f87171' }}>
                    <ThumbsDown size={14} />
                  </div>
                  <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#f87171' }}>Needs Improvement</h4>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {weaknesses.map((q) => (
                    <div key={q.questionId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderRadius: 8, background: 'rgba(239, 68, 68, 0.06)', border: '1px solid rgba(239, 68, 68, 0.12)' }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', flex: 1 }}>{q.questionTitle}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#ef4444', marginLeft: 10 }}>{q.scoreEarned}/{q.maxMarks} ({q.pct}%)</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── 9. Question Breakdown (Questions, Answers, Test Cases & Points) ── */}
        {showResultAnalytics ? (
          <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>
                  Questions, Answers, Test Cases &amp; Points Breakdown
                </h3>
                <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
                  Full test case comparisons, code outputs, rubric scoring, and official explanations
                </p>
              </div>
              <Badge tone="success">Answers &amp; Points Unlocked</Badge>
            </div>

            {questionResults.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
                No questions found for this assessment.
              </div>
            ) : (
              questionResults.map((q, idx) => {
                const isExpanded = expandedQuestions[q.questionId] !== false; // default expanded
                const scorePct = q.maxMarks > 0 ? Math.round((q.scoreEarned ?? 0) / q.maxMarks * 100) : 0;

                return (
                  <div key={q.questionId} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    {/* Question header row (always visible) */}
                    <button
                      onClick={() => toggleQuestion(q.questionId)}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: 14,
                        padding: '16px 22px', background: 'transparent', border: 'none',
                        cursor: 'pointer', textAlign: 'left',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <div style={{
                        width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                        background: isNotStarted ? 'rgba(99,102,241,0.15)' : scorePct >= 50 ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, fontWeight: 800,
                        color: isNotStarted ? '#818cf8' : scorePct >= 50 ? '#22c55e' : '#ef4444',
                      }}>
                        {isNotStarted ? `Q${idx + 1}` : `${scorePct}%`}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                          Q{idx + 1}. {q.questionTitle}
                        </p>
                        <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
                          {q.questionType === 'MULTIPLE_CHOICE' ? 'Multiple Choice' : 'Coding Challenge'} · {q.maxMarks} Marks
                        </p>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 14, fontWeight: 800, color: isNotStarted ? '#818cf8' : (q.scoreEarned ?? 0) > 0 ? '#10b981' : '#ef4444' }}>
                          {isNotStarted ? `${q.maxMarks} pts` : `${q.scoreEarned ?? 0} / ${q.maxMarks} pts`}
                        </span>
                        <Badge tone={isNotStarted ? 'info' : q.submissionStatus === 'ACCEPTED' ? 'success' : 'neutral'}>
                          {isNotStarted ? 'READY_TO_START' : (q.submissionStatus ?? '\u2014')}
                        </Badge>
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                    </button>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <div style={{ padding: '0 22px 24px', background: 'var(--surface-medium)', borderTop: '1px solid var(--border-color)' }}>
                        {/* Problem Statement */}
                        {q.questionDescription && (
                          <div style={{ marginTop: 16, padding: '14px 18px', borderRadius: 10, background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
                            <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
                              Problem Statement &amp; Requirements
                            </p>
                            <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                              {q.questionDescription}
                            </div>
                          </div>
                        )}

                        {q.questionType === 'MULTIPLE_CHOICE' ? (
                          <div style={{ marginTop: 16 }}>
                            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 12 }}>
                              Answer Options &amp; Explanations
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                              {q.options?.map((opt, optIdx) => {
                                const letter = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'][optIdx] || `#${optIdx + 1}`;
                                const isStudentSelected = q.sourceCode && q.sourceCode.includes(opt.id);
                                const isCorrect = Boolean(opt.isCorrect);

                                let borderStyle = '1px solid var(--border-color)';
                                let bgStyle = 'var(--bg-primary)';

                                if (isStudentSelected && isCorrect) {
                                  borderStyle = '1.5px solid #10b981';
                                  bgStyle = 'rgba(16, 185, 129, 0.08)';
                                } else if (isStudentSelected && !isCorrect) {
                                  borderStyle = '1.5px solid #ef4444';
                                  bgStyle = 'rgba(239, 68, 68, 0.08)';
                                } else if (isCorrect) {
                                  borderStyle = '1.5px solid #10b981';
                                  bgStyle = 'rgba(16, 185, 129, 0.04)';
                                }

                                return (
                                  <div key={opt.id || optIdx} style={{ padding: '12px 16px', borderRadius: 8, border: borderStyle, background: bgStyle, display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                      <span style={{
                                        width: 28, height: 28, borderRadius: 6,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontWeight: 800, fontSize: 13,
                                        background: isCorrect ? '#10b981' : isStudentSelected ? '#ef4444' : 'var(--surface-medium)',
                                        color: (isCorrect || isStudentSelected) ? '#ffffff' : 'var(--text-primary)',
                                      }}>
                                        {letter}
                                      </span>
                                      <span style={{ flex: 1, fontSize: 14, color: 'var(--text-primary)', fontWeight: isStudentSelected ? 700 : 500 }}>
                                        {opt.optionText}
                                      </span>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        {isStudentSelected && isCorrect && <Badge tone="success">Your Choice (Correct)</Badge>}
                                        {isStudentSelected && !isCorrect && <Badge tone="error">Your Choice (Incorrect)</Badge>}
                                        {!isStudentSelected && isCorrect && <Badge tone="success">Correct Answer</Badge>}
                                      </div>
                                    </div>
                                    {opt.explanation && (
                                      <div style={{ marginTop: 4, marginLeft: 40, padding: '8px 12px', borderRadius: 6, background: 'rgba(99, 102, 241, 0.08)', borderLeft: '3px solid #6366f1', fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                                        <Lightbulb size={14} style={{ color: '#818cf8', marginTop: 1, flexShrink: 0 }} />
                                        <span>{opt.explanation}</span>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                            {!q.sourceCode && !isNotStarted && (
                              <p style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                You did not select an answer for this question.
                              </p>
                            )}
                          </div>
                        ) : (
                          <>
                            {/* Submitted Code Viewer */}
                            {q.sourceCode ? (
                              <div style={{ marginTop: 16 }}>
                                <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>
                                  Your Submitted Solution ({q.language || 'Java'})
                                </p>
                                <CodeViewer
                                  sourceCode={q.sourceCode}
                                  language={q.language ?? 'java'}
                                  maxHeight={320}
                                />
                              </div>
                            ) : (
                              isNotStarted ? (
                                <div style={{ marginTop: 16, padding: '12px 16px', borderRadius: 8, background: 'rgba(99, 102, 241, 0.06)', border: '1px solid rgba(99, 102, 241, 0.2)', display: 'flex', alignItems: 'center', gap: 10 }}>
                                  <PlayCircle size={18} style={{ color: '#818cf8' }} />
                                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                                    Automated code editor and runtime sandbox will open when you begin your attempt.
                                  </span>
                                </div>
                              ) : (
                                <p style={{ marginTop: 12, fontSize: 13, color: 'var(--text-muted)' }}>
                                  No code submission was recorded for this challenge.
                                </p>
                              )
                            )}

                            {/* Execution Console & Output */}
                            {q.executionOutput && (
                              <div style={{ marginTop: 16 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                                  <Terminal size={14} style={{ color: '#34d399' }} />
                                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                    Execution Console &amp; Compiler Output
                                  </span>
                                </div>
                                <div style={{
                                  padding: '12px 16px', borderRadius: 8,
                                  background: '#090d16', border: '1px solid rgba(255,255,255,0.08)',
                                  fontFamily: 'monospace', fontSize: 12, color: '#34d399',
                                  whiteSpace: 'pre-wrap', lineHeight: 1.5,
                                }}>
                                  {q.executionOutput}
                                </div>
                              </div>
                            )}

                            {/* Full Test Case Comparisons */}
                            {q.testCases?.length > 0 && (
                              <div style={{ marginTop: 18 }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <FileText size={14} style={{ color: '#60a5fa' }} />
                                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                      Full Test Case Comparisons ({q.testCases.length} Test Cases)
                                    </span>
                                  </div>
                                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                    Input vs Expected vs Actual Output
                                  </span>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                  {q.testCases.map((tc, tcIdx) => (
                                    <div
                                      key={tc.testCaseId || tcIdx}
                                      style={{
                                        background: 'var(--bg-primary)',
                                        border: `1px solid ${tc.passed ? 'rgba(16, 185, 129, 0.35)' : tc.actualOutput ? 'rgba(239, 68, 68, 0.35)' : 'var(--border-color)'}`,
                                        borderRadius: 8,
                                        padding: '12px 16px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 10,
                                      }}
                                    >
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
                                            Test Case #{tcIdx + 1}
                                          </span>
                                          {tc.sample && (
                                            <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 4, background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' }}>
                                              Sample Case
                                            </span>
                                          )}
                                          {tc.hidden && (
                                            <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 4, background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc' }}>
                                              Evaluation Case
                                            </span>
                                          )}
                                        </div>
                                        <span
                                          style={{
                                            fontSize: 11,
                                            fontWeight: 800,
                                            padding: '2px 8px',
                                            borderRadius: 5,
                                            background: tc.passed ? 'rgba(16, 185, 129, 0.15)' : tc.actualOutput ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255,255,255,0.06)',
                                            color: tc.passed ? '#34d399' : tc.actualOutput ? '#f87171' : 'var(--text-muted)',
                                            border: `1px solid ${tc.passed ? 'rgba(16, 185, 129, 0.3)' : tc.actualOutput ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255,255,255,0.1)'}`,
                                          }}
                                        >
                                          {tc.passed ? 'PASSED' : tc.actualOutput ? 'FAILED' : 'EXPECTED'}
                                        </span>
                                      </div>

                                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
                                        <div>
                                          <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: 3 }}>
                                            Input Data
                                          </span>
                                          <div style={{ padding: '6px 10px', borderRadius: 6, background: 'rgba(0,0,0,0.25)', fontFamily: 'monospace', fontSize: 11, color: 'var(--text-secondary)' }}>
                                            {tc.inputData || '(Empty Input)'}
                                          </div>
                                        </div>
                                        <div>
                                          <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: 3 }}>
                                            Expected Output
                                          </span>
                                          <div style={{ padding: '6px 10px', borderRadius: 6, background: 'rgba(0,0,0,0.25)', fontFamily: 'monospace', fontSize: 11, color: '#34d399' }}>
                                            {tc.expectedOutput || '(None)'}
                                          </div>
                                        </div>
                                        <div>
                                          <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: 3 }}>
                                            Actual Output
                                          </span>
                                          <div style={{ padding: '6px 10px', borderRadius: 6, background: 'rgba(0,0,0,0.25)', fontFamily: 'monospace', fontSize: 11, color: tc.passed ? '#34d399' : '#f87171' }}>
                                            {tc.actualOutput || '\u2014'}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Rubric evaluations */}
                            {q.rubricEvaluations?.length > 0 && (
                              <div style={{ marginTop: 18 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                                  <Award size={14} style={{ color: '#fbbf24' }} />
                                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                    Rubric Scoring Evaluation
                                  </span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                  {q.rubricEvaluations.map((r, rIdx) => {
                                    const isFull = r.score === r.maxPoints && r.maxPoints > 0;
                                    const isPartial = r.score > 0 && r.score < r.maxPoints;
                                    return (
                                      <div key={rIdx} style={{
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                                        padding: '12px 16px', background: 'rgba(255, 255, 255, 0.02)',
                                        border: `1px solid ${isFull ? 'rgba(16, 185, 129, 0.25)' : isPartial ? 'rgba(245, 158, 11, 0.25)' : 'rgba(255, 255, 255, 0.06)'}`,
                                        borderLeft: `3px solid ${isFull ? '#10b981' : isPartial ? '#f59e0b' : 'rgba(255, 255, 255, 0.2)'}`,
                                        borderRadius: 8,
                                        gap: 14,
                                      }}>
                                        <div style={{ flex: 1 }}>
                                          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{r.criterionName}</p>
                                          {r.feedback && <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.45 }}>{r.feedback}</p>}
                                        </div>
                                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                          <span style={{
                                            fontSize: 12, fontWeight: 800,
                                            padding: '4px 10px', borderRadius: 6,
                                            background: isFull ? 'rgba(16, 185, 129, 0.15)' : isPartial ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                                            color: isFull ? '#34d399' : isPartial ? '#fbbf24' : 'var(--text-muted)',
                                            border: `1px solid ${isFull ? 'rgba(16, 185, 129, 0.3)' : isPartial ? 'rgba(245, 158, 11, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
                                            display: 'inline-flex', alignItems: 'center', gap: 4
                                          }}>
                                            {isNotStarted ? `${r.maxPoints} pts` : `${r.score} / ${r.maxPoints} pts`}
                                          </span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </>
                        )}

                        {/* Official Explanation Box */}
                        {q.officialExplanation && (
                          <div style={{
                            marginTop: 18,
                            padding: '16px 20px',
                            borderRadius: 10,
                            background: 'rgba(99, 102, 241, 0.07)',
                            border: '1px solid rgba(99, 102, 241, 0.22)',
                            borderLeft: '4px solid #6366f1',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 14,
                          }}>
                            <div style={{
                              padding: 6, borderRadius: 8,
                              background: 'rgba(99, 102, 241, 0.18)',
                              color: '#818cf8', flexShrink: 0, marginTop: 1
                            }}>
                              <Lightbulb size={16} />
                            </div>
                            <div>
                              <strong style={{ fontSize: 13, color: '#c7d2fe', display: 'block', marginBottom: 4, letterSpacing: '-0.01em' }}>
                                Official Explanation &amp; Solution Strategy
                              </strong>
                              <p style={{ margin: 0, fontSize: 13, color: 'rgba(224, 231, 255, 0.9)', lineHeight: 1.6 }}>
                                {q.officialExplanation}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        ) : (
          <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 12, padding: '36px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <EyeOff size={24} />
            </div>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>
              Result Analytics &amp; Answers Withheld
            </h3>
            <p style={{ margin: 0, fontSize: 14, color: 'var(--text-muted)', maxWidth: 520, lineHeight: 1.6 }}>
              The instructor has restricted the detailed question-by-question breakdown, answers, and points for this assessment. Once results and analytics are released by your instructor, they will automatically appear here.
            </p>
          </div>
        )}

        {/* ── 10. Attempt History ── */}
        {attemptHistory.length > 0 && (
          <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(168, 85, 247, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c084fc' }}>
                  <RotateCcw size={14} />
                </div>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Attempt History</h3>
              </div>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
                Click any row to view full report &amp; submitted code
              </span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: 'var(--surface-medium)' }}>
                    {['#', 'Status', 'Score', '%', 'Started', 'Submitted', ''].map((h) => (
                      <th key={h || 'action'} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {attemptHistory.map((att) => {
                    const isCurrent = att.attemptId === attemptId;
                    const isTerminal = ['SUBMITTED', 'TIMED_OUT', 'EVALUATED', 'EXPIRED'].includes(att.status);
                    return (
                      <tr
                        key={att.attemptId}
                        onClick={() => {
                          if (isTerminal && !isCurrent) {
                            navigate(ROUTES.ASSESSMENT_RESULT(att.attemptId));
                          }
                        }}
                        style={{
                          borderTop: '1px solid var(--border-color)',
                          cursor: isTerminal && !isCurrent ? 'pointer' : 'default',
                          background: isCurrent ? 'rgba(99, 102, 241, 0.08)' : 'transparent',
                          borderLeft: isCurrent ? '3px solid #6366f1' : '3px solid transparent',
                          transition: 'background 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                          if (isTerminal && !isCurrent) e.currentTarget.style.background = 'rgba(99, 102, 241, 0.05)';
                        }}
                        onMouseLeave={(e) => {
                          if (!isCurrent) e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        <td style={{ padding: '10px 14px', fontWeight: 700 }}>
                          #{att.attemptNumber}
                          {isCurrent && (
                            <span style={{ marginLeft: 6, fontSize: 9, fontWeight: 700, padding: '2px 5px', borderRadius: 4, background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                              Current
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <AttemptStatusBadge status={att.status} size="sm" />
                        </td>
                        <td style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {att.score ?? 0} / {att.totalMarks}
                        </td>
                        <td style={{ padding: '10px 14px', fontWeight: 700, color: '#6366f1' }}>
                          {att.percentage}%
                        </td>
                        <td style={{ padding: '10px 14px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                          {att.startedAt ? new Date(att.startedAt).toLocaleString() : '\u2014'}
                        </td>
                        <td style={{ padding: '10px 14px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                          {att.submittedAt ? new Date(att.submittedAt).toLocaleString() : '\u2014'}
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                          {isTerminal && !isCurrent && (
                            <button
                              onClick={(e) => { e.stopPropagation(); navigate(ROUTES.ASSESSMENT_RESULT(att.attemptId)); }}
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: 4,
                                padding: '4px 10px', borderRadius: 6,
                                background: 'rgba(99, 102, 241, 0.12)',
                                border: '1px solid rgba(99, 102, 241, 0.25)',
                                color: '#a5b4fc', fontSize: 11, fontWeight: 700,
                                cursor: 'pointer', transition: 'all 0.15s ease',
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(99, 102, 241, 0.2)'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(99, 102, 241, 0.12)'; }}
                            >
                              <ArrowUpRight size={12} />
                              View Report
                            </button>
                          )}
                          {isCurrent && (
                            <span style={{ fontSize: 11, fontWeight: 600, color: '#818cf8' }}>Viewing Now</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── 11. Bottom Action Bar (if not started) ── */}
        {isNotStarted && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(15,23,42,0.9) 0%, rgba(30,27,75,0.7) 100%)',
            border: '1px solid rgba(99,102,241,0.3)',
            borderRadius: 14,
            padding: '20px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            flexWrap: 'wrap',
          }}>
            <div>
              <h4 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700, color: '#e0e7ff' }}>
                Ready to take this evaluation?
              </h4>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>
                Timed challenge covering {questionResults.length} questions. Anti-cheat and screen recording will be initiated upon start.
              </p>
            </div>
            <Button
              variant="primary"
              onClick={() => navigate(ROUTES.ASSESSMENT_ATTEMPT(assessmentId))}
              iconLeft={<PlayCircle size={16} />}
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                fontWeight: 800,
                padding: '11px 26px',
                fontSize: 14,
                boxShadow: '0 4px 16px rgba(16,185,129,0.35)',
              }}
            >
              Start Assessment Now
            </Button>
          </div>
        )}
      </div>
    </PageContainer>
  );
};

export default AssessmentResultPage;
