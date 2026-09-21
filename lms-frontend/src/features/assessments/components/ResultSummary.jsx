import React from 'react';
import { Award, Clock, CheckCircle2, XCircle, FileText, RotateCcw } from 'lucide-react';
import Badge from '../../../components/common/Badge';

export const ResultSummary = ({ report }) => {
  if (!report) return null;

  const {
    assessmentTitle,
    status,
    finalScore,
    totalMarks,
    percentage,
    passed,
    retakePolicy,
    attemptsUsed,
    maxAttemptsAllowed,
    timeSpentSeconds,
    questionResults = [],
    attemptHistory = [],
  } = report;

  const minutesSpent = Math.floor((timeSpentSeconds || 0) / 60);
  const secondsSpent = (timeSpentSeconds || 0) % 60;

  return (
    <div style={{ padding: '24px 0', width: '100%' }}>
      {/* Banner */}
      <div
        style={{
          background: passed
            ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)'
            : 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
          color: '#ffffff',
          borderRadius: 12,
          padding: '32px 24px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            {passed ? <CheckCircle2 size={32} /> : <XCircle size={32} />}
            <span style={{ fontSize: '1.5rem', fontWeight: 800 }}>
              {passed ? 'Passed Assessment!' : 'Assessment Not Passed'}
            </span>
          </div>
          <h2 style={{ fontSize: '1.1rem', opacity: 0.9 }}>{assessmentTitle}</h2>
          <p style={{ fontSize: '0.875rem', opacity: 0.8, marginTop: 4 }}>
            Status: {status} | Retake Policy: {retakePolicy}
          </p>
        </div>

        <div style={{ textAlign: 'right', background: 'rgba(255, 255, 255, 0.15)', padding: '16px 24px', borderRadius: 8 }}>
          <div style={{ fontSize: '2.5rem', fontWeight: 900 }}>{percentage}%</div>
          <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>
            Score: {finalScore ?? 0} / {totalMarks} pts
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 16 }}>
          <span style={{ fontSize: '0.8rem', color: '#6b7280', textTransform: 'uppercase', fontWeight: 600 }}>Time Elapsed</span>
          <p style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock size={18} color="#4f46e5" /> {minutesSpent}m {secondsSpent}s
          </p>
        </div>

        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 16 }}>
          <span style={{ fontSize: '0.8rem', color: '#6b7280', textTransform: 'uppercase', fontWeight: 600 }}>Attempts Used</span>
          <p style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
            <RotateCcw size={18} color="#4f46e5" /> {attemptsUsed} of {maxAttemptsAllowed} max
          </p>
        </div>

        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 16 }}>
          <span style={{ fontSize: '0.8rem', color: '#6b7280', textTransform: 'uppercase', fontWeight: 600 }}>Questions Evaluated</span>
          <p style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText size={18} color="#4f46e5" /> {questionResults.length} problems
          </p>
        </div>
      </div>

      {/* Question Results Table */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 20, marginBottom: 24 }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 16 }}>Question &amp; Rubric Breakdown</h3>
        {questionResults.length === 0 ? (
          <p style={{ color: '#6b7280' }}>No detailed question records available.</p>
        ) : (
          <div>
            {questionResults.map((q, idx) => (
              <div key={q.questionId} style={{ borderBottom: '1px solid #f3f4f6', padding: '16px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Q{idx + 1}. {q.questionTitle}</span>
                    <span style={{ marginLeft: 10, fontSize: '0.75rem', background: '#f3f4f6', padding: '2px 8px', borderRadius: 4 }}>{q.questionType}</span>
                  </div>
                  <div>
                    <span style={{ fontWeight: 700, color: q.scoreEarned > 0 ? '#10b981' : '#ef4444' }}>
                      {q.scoreEarned} / {q.maxMarks} pts
                    </span>
                    <span style={{ marginLeft: 8 }}>
                      <Badge tone={q.submissionStatus === 'ACCEPTED' ? 'success' : 'neutral'}>{q.submissionStatus}</Badge>
                    </span>
                  </div>
                </div>

                {/* Rubric evaluations */}
                {q.rubricEvaluations && q.rubricEvaluations.length > 0 && (
                  <div style={{ marginTop: 12, background: '#f9fafb', padding: 12, borderRadius: 6 }}>
                    <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#4f46e5', textTransform: 'uppercase', marginBottom: 6 }}>
                      Rubric Evaluations
                    </p>
                    {q.rubricEvaluations.map((r, rIdx) => (
                      <div key={rIdx} style={{ fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                        <span>{r.criterionName}: {r.feedback || 'No feedback comment'}</span>
                        <span style={{ fontWeight: 600 }}>{r.score} / {r.maxPoints} pts</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Attempt History */}
      {attemptHistory.length > 0 && (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 20 }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 16 }}>Retake History</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ background: '#f9fafb', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ padding: '10px 12px' }}>Attempt #</th>
                <th style={{ padding: '10px 12px' }}>Status</th>
                <th style={{ padding: '10px 12px' }}>Score</th>
                <th style={{ padding: '10px 12px' }}>Percentage</th>
                <th style={{ padding: '10px 12px' }}>Started At</th>
                <th style={{ padding: '10px 12px' }}>Submitted At</th>
              </tr>
            </thead>
            <tbody>
              {attemptHistory.map((att) => (
                <tr key={att.attemptId} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '10px 12px', fontWeight: 600 }}>Attempt #{att.attemptNumber}</td>
                  <td style={{ padding: '10px 12px' }}><Badge tone="neutral">{att.status}</Badge></td>
                  <td style={{ padding: '10px 12px', fontWeight: 600 }}>{att.score ?? 0} / {att.totalMarks}</td>
                  <td style={{ padding: '10px 12px', fontWeight: 700, color: '#4f46e5' }}>{att.percentage}%</td>
                  <td style={{ padding: '10px 12px', color: '#6b7280' }}>{new Date(att.startedAt).toLocaleString()}</td>
                  <td style={{ padding: '10px 12px', color: '#6b7280' }}>{att.submittedAt ? new Date(att.submittedAt).toLocaleString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ResultSummary;
