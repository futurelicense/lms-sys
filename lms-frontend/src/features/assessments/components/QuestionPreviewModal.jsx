import React, { useState, useMemo } from 'react';
import { X, Eye, Play, Sparkles, CheckCircle2, AlertTriangle, Monitor, RotateCcw } from 'lucide-react';
import Button from '../../../components/common/Button';
import Badge from '../../../components/common/Badge';
import CodingQuestionPanel from './CodingQuestionPanel';
import McqQuestionPanel from './McqQuestionPanel';

/**
 * QuestionPreviewModal
 * 
 * Allows instructors to preview and test questions exactly as a student would experience them.
 * Supports running code against test cases with live output verification.
 */
export default function QuestionPreviewModal({
  isOpen,
  onClose,
  questionData,
}) {
  if (!isOpen || !questionData) return null;

  const isCoding = (questionData.questionType || 'CODING') === 'CODING';

  // Normalize question data into student taking view model
  const normalizedQuestion = useMemo(() => {
    const rawTestCases = questionData.testCases || [];
    const formattedTestCases = rawTestCases.map((tc, idx) => ({
      id: tc.id || `tc-${idx + 1}`,
      label: tc.sample ? `Sample Case ${idx + 1}` : `Hidden Case ${idx + 1}`,
      input: tc.inputData ?? tc.input ?? '',
      expectedOutput: tc.expectedOutput ?? '',
      sample: Boolean(tc.sample),
      hidden: Boolean(tc.hidden),
      weight: tc.weight || 1,
    }));

    const rawOptions = questionData.options || [];
    const formattedOptions = rawOptions.map((opt, idx) => ({
      id: opt.id || `opt-${idx + 1}`,
      optionText: opt.optionText || '',
      isCorrect: Boolean(opt.isCorrect),
      explanation: opt.explanation || '',
    }));

    return {
      id: questionData.id || 'preview-question-id',
      title: questionData.title || 'Untitled Question',
      description: questionData.description || 'No description provided.',
      questionType: questionData.questionType || 'CODING',
      difficulty: questionData.difficulty || 'MEDIUM',
      marks: questionData.marks ?? 10,
      compiler: questionData.compiler || 'ALL',
      timeLimitMs: questionData.timeLimitMs ?? 2000,
      memoryLimitMb: questionData.memoryLimitMb ?? 256,
      inputFormat: questionData.inputFormat || '',
      outputFormat: questionData.outputFormat || '',
      constraints: questionData.constraints || '',
      testCases: formattedTestCases,
      sampleTestCases: formattedTestCases.filter((tc) => tc.sample),
      options: formattedOptions,
    };
  }, [questionData]);

  // Draft state for coding/mcq simulation
  const [draft, setDraft] = useState({
    language: 'java',
    sourceCode: '',
  });

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.82)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Top Bar / Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 24px',
          background: 'var(--surface-dark, #0d0d12)',
          borderBottom: '1px solid var(--border-color, #222)',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 34,
              height: 34,
              borderRadius: 8,
              background: 'rgba(99, 102, 241, 0.15)',
              color: '#818cf8',
            }}
          >
            <Monitor size={18} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary, #fff)' }}>
                Student Experience Preview
              </span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  padding: '2px 6px',
                  borderRadius: 4,
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#10b981',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                }}
              >
                Interactive Test Environment
              </span>
            </div>
            <span style={{ fontSize: 12, color: 'var(--text-muted, #94a3b8)' }}>
              Testing "{normalizedQuestion.title}" ({normalizedQuestion.difficulty} · {normalizedQuestion.marks} marks)
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setDraft({ language: isCoding ? 'java' : 'MCQ', sourceCode: '' })}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <RotateCcw size={13} />
            <span>Reset Test</span>
          </Button>

          <button
            type="button"
            onClick={onClose}
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              border: '1px solid var(--border-color, #333)',
              background: 'transparent',
              color: 'var(--text-muted, #94a3b8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
              e.currentTarget.style.color = '#ef4444';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--text-muted, #94a3b8)';
            }}
            title="Close Preview"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Main Interactive Preview Container */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {isCoding ? (
          <CodingQuestionPanel
            question={normalizedQuestion}
            draft={draft}
            saveStatus="saved"
            onDraftChange={setDraft}
            isReadOnly={false}
          />
        ) : (
          <div style={{ padding: 24, overflowY: 'auto', maxWidth: 900, margin: '0 auto', width: '100%' }}>
            <McqQuestionPanel
              question={normalizedQuestion}
              draft={draft}
              saveStatus="saved"
              onDraftChange={setDraft}
            />
            {normalizedQuestion.options.some((o) => o.explanation) && (
              <div
                style={{
                  marginTop: 24,
                  padding: 16,
                  borderRadius: 10,
                  background: 'rgba(59, 130, 246, 0.08)',
                  border: '1px solid rgba(59, 130, 246, 0.2)',
                }}
              >
                <h4 style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700, color: '#60a5fa' }}>
                  Instructor Answers & Explanations:
                </h4>
                {normalizedQuestion.options.map((opt, i) => (
                  <div key={opt.id} style={{ fontSize: 12, marginBottom: 6, color: 'var(--text-primary, #fff)' }}>
                    <strong>Option {String.fromCharCode(65 + i)}:</strong> {opt.optionText}{' '}
                    {opt.isCorrect && <span style={{ color: '#10b981', fontWeight: 700 }}>(Correct)</span>}
                    {opt.explanation && (
                      <p style={{ margin: '2px 0 0', color: 'var(--text-muted, #94a3b8)', fontStyle: 'italic' }}>
                        Explanation: {opt.explanation}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
