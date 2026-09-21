import React, { useEffect } from 'react';
import {
  CheckCircle2, Circle, HelpCircle, RotateCcw,
  Sparkles, Check, CheckCheck, Loader2
} from 'lucide-react';
import Badge from '../../../components/common/Badge';
import { DIFFICULTY_TONE } from '../constants/assessmentConstants';

const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

/**
 * Modern, responsive MCQ Taking Panel for Students
 */
export const McqQuestionPanel = ({
  question,
  draft = { language: 'MCQ', sourceCode: '' },
  saveStatus = 'saved',
  onDraftChange,
}) => {
  const selectedOptionId = draft?.sourceCode || '';
  const options = question?.options || [];

  const handleSelectOption = (optionId) => {
    if (selectedOptionId === optionId) {
      return;
    }
    onDraftChange?.({
      language: 'MCQ',
      sourceCode: optionId,
    });
  };

  const handleClearSelection = () => {
    onDraftChange?.({
      language: 'MCQ',
      sourceCode: '',
    });
  };

  // Keyboard shortcut listener for A, B, C, D or 1, 2, 3, 4
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger if user is typing in an input/textarea
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;

      const key = e.key.toUpperCase();
      let targetIndex = -1;

      if (['1', '2', '3', '4', '5', '6', '7', '8'].includes(key)) {
        targetIndex = parseInt(key, 10) - 1;
      } else if (OPTION_LETTERS.includes(key)) {
        targetIndex = OPTION_LETTERS.indexOf(key);
      }

      if (targetIndex >= 0 && targetIndex < options.length) {
        e.preventDefault();
        onDraftChange?.({
          language: 'MCQ',
          sourceCode: options[targetIndex].id,
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [options, onDraftChange]);

  const selectedOptionIndex = options.findIndex((opt) => opt.id === selectedOptionId);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: '#0a0e1a',
        color: '#f1f5f9',
        overflow: 'hidden',
      }}
    >
      {/* ── Top Header / Status Bar ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          background: '#0d1322',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'rgba(139, 92, 246, 0.15)',
              border: '1px solid rgba(139, 92, 246, 0.35)',
              color: '#c4b5fd',
              padding: '4px 10px',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.03em',
              textTransform: 'uppercase',
            }}
          >
            <Sparkles size={13} /> Multiple Choice
          </span>

          <Badge tone={DIFFICULTY_TONE[question?.difficulty] ?? 'neutral'}>
            {question?.difficulty || 'MEDIUM'}
          </Badge>

          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: '#94a3b8',
              background: 'rgba(255, 255, 255, 0.04)',
              padding: '3px 10px',
              borderRadius: 6,
              border: '1px solid rgba(255, 255, 255, 0.07)',
            }}
          >
            {question?.marks ?? 10} Marks
          </span>
        </div>

        {/* Autosave Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              color: saveStatus === 'saving' ? '#818cf8' : '#10b981',
              fontWeight: 500,
            }}
          >
            {saveStatus === 'saving' ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                <span>Saving choice...</span>
              </>
            ) : (
              <>
                <CheckCheck size={14} />
                <span>Answer autosaved</span>
              </>
            )}
          </div>

          {selectedOptionId && (
            <button
              type="button"
              onClick={handleClearSelection}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                background: 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#94a3b8',
                padding: '4px 10px',
                borderRadius: 6,
                fontSize: 12,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#ef4444';
                e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#94a3b8';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
              }}
            >
              <RotateCcw size={12} /> Clear Choice
            </button>
          )}
        </div>
      </div>

      {/* ── Main Scrollable Content ── */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '32px 36px',
          maxWidth: 960,
          width: '100%',
          margin: '0 auto',
        }}
      >
        {/* Question Title */}
        <h2
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: '#ffffff',
            margin: '0 0 16px 0',
            lineHeight: 1.35,
          }}
        >
          {question?.title}
        </h2>

        {/* Question Prompt / Description */}
        <div
          style={{
            fontSize: 15,
            lineHeight: 1.7,
            color: '#cbd5e1',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: 12,
            padding: '20px 24px',
            marginBottom: 32,
            whiteSpace: 'pre-wrap',
            fontFamily: 'inherit',
          }}
        >
          {question?.description}
        </div>

        {/* Options Instruction */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
          }}
        >
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: '#818cf8',
            }}
          >
            Select One Correct Answer
          </span>
          <span style={{ fontSize: 12, color: '#64748b' }}>
            Tip: You can also press keys <kbd className="px-1.5 py-0.5 rounded bg-gray-800 border border-gray-700 text-gray-300 font-mono text-xs">A</kbd>–<kbd className="px-1.5 py-0.5 rounded bg-gray-800 border border-gray-700 text-gray-300 font-mono text-xs">D</kbd> or <kbd className="px-1.5 py-0.5 rounded bg-gray-800 border border-gray-700 text-gray-300 font-mono text-xs">1</kbd>–<kbd className="px-1.5 py-0.5 rounded bg-gray-800 border border-gray-700 text-gray-300 font-mono text-xs">4</kbd>
          </span>
        </div>

        {/* Options List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {options.map((opt, idx) => {
            const letter = OPTION_LETTERS[idx] || `#${idx + 1}`;
            const isSelected = selectedOptionId === opt.id;

            return (
              <div
                key={opt.id}
                onClick={() => handleSelectOption(opt.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  padding: '18px 20px',
                  borderRadius: 12,
                  cursor: 'pointer',
                  border: isSelected
                    ? '2px solid #6366f1'
                    : '1px solid rgba(255, 255, 255, 0.08)',
                  background: isSelected
                    ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(79, 70, 229, 0.08) 100%)'
                    : 'rgba(255, 255, 255, 0.02)',
                  boxShadow: isSelected
                    ? '0 0 20px rgba(99, 102, 241, 0.2), inset 0 0 10px rgba(99, 102, 241, 0.05)'
                    : 'none',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  userSelect: 'none',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.4)';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                  }
                }}
              >
                {/* Option Letter Badge */}
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 15,
                    fontWeight: 800,
                    background: isSelected ? '#6366f1' : 'rgba(255, 255, 255, 0.06)',
                    color: isSelected ? '#ffffff' : '#94a3b8',
                    border: isSelected ? 'none' : '1px solid rgba(255, 255, 255, 0.12)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {letter}
                </div>

                {/* Option Text */}
                <div
                  style={{
                    flex: 1,
                    fontSize: 15,
                    lineHeight: 1.6,
                    color: isSelected ? '#ffffff' : '#e2e8f0',
                    fontWeight: isSelected ? 600 : 400,
                  }}
                >
                  {opt.optionText}
                </div>

                {/* Radio Circle Indicator */}
                <div
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    border: isSelected ? '2px solid #6366f1' : '2px solid rgba(255, 255, 255, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'all 0.2s ease',
                    background: isSelected ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                  }}
                >
                  {isSelected && (
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        background: '#6366f1',
                      }}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Answer Confirmation Bar */}
        <div
          style={{
            marginTop: 32,
            padding: '14px 20px',
            borderRadius: 10,
            background: selectedOptionId ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255, 255, 255, 0.02)',
            border: selectedOptionId
              ? '1px solid rgba(16, 185, 129, 0.25)'
              : '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 13,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {selectedOptionId ? (
              <>
                <CheckCircle2 size={16} style={{ color: '#10b981' }} />
                <span style={{ color: '#e2e8f0' }}>
                  Current Selection:{' '}
                  <strong style={{ color: '#34d399' }}>
                    Option {OPTION_LETTERS[selectedOptionIndex] || `#${selectedOptionIndex + 1}`}
                  </strong>
                </span>
              </>
            ) : (
              <>
                <Circle size={15} style={{ color: '#64748b' }} />
                <span style={{ color: '#94a3b8' }}>No answer selected yet</span>
              </>
            )}
          </div>
          <span style={{ color: '#64748b', fontSize: 12 }}>
            Answers are saved automatically as you make choices.
          </span>
        </div>
      </div>
    </div>
  );
};

export default McqQuestionPanel;
