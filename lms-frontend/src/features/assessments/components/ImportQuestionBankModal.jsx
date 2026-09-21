import React, { useState, useEffect } from 'react';
import {
  X, Search, Filter, BookOpen, Code2, CheckCircle2,
  ListFilter, Sparkles, ChevronRight, Check, Eye
} from 'lucide-react';
import Button from '../../../components/common/Button';
import Badge from '../../../components/common/Badge';
import { questionBankService, QUESTION_CATEGORIES } from '../services/questionBankService';
import QuestionPreviewModal from './QuestionPreviewModal';

/**
 * ImportQuestionBankModal
 * 
 * Allows instructors to search, browse, preview, and select questions
 * from the global question bank to import directly into an assessment.
 */
export default function ImportQuestionBankModal({
  isOpen,
  onClose,
  onImport,
  targetSectionId = null,
}) {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [difficulty, setDifficulty] = useState('ALL');
  const [type, setType] = useState('ALL');
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [previewQuestion, setPreviewQuestion] = useState(null);
  const [importing, setImporting] = useState(false);

  const loadQuestions = async () => {
    setLoading(true);
    try {
      const data = await questionBankService.getQuestions({
        category,
        difficulty,
        type,
        search,
      });
      setQuestions(data);
      if (data.length > 0 && !selectedQuestion) {
        setSelectedQuestion(data[0]);
      }
    } catch (err) {
      console.error('Failed to load question bank:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    loadQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, category, difficulty, type, search]);

  const handleConfirmImport = async () => {
    if (!selectedQuestion || !onImport) return;
    setImporting(true);
    try {
      // Clean template to match question creation payload
      const importPayload = {
        title: selectedQuestion.title,
        description: selectedQuestion.description,
        questionType: selectedQuestion.questionType,
        difficulty: selectedQuestion.difficulty,
        compiler: selectedQuestion.compiler || 'ALL',
        marks: selectedQuestion.marks,
        timeLimitMs: selectedQuestion.timeLimitMs,
        memoryLimitMb: selectedQuestion.memoryLimitMb,
        inputFormat: selectedQuestion.inputFormat || '',
        outputFormat: selectedQuestion.outputFormat || '',
        constraints: selectedQuestion.constraints || '',
        testCases: (selectedQuestion.testCases || []).map((tc) => ({
          inputData: tc.inputData,
          expectedOutput: tc.expectedOutput,
          sample: tc.sample,
          hidden: tc.hidden,
          weight: tc.weight || 1,
        })),
        options: (selectedQuestion.options || []).map((opt) => ({
          optionText: opt.optionText,
          isCorrect: opt.isCorrect,
          explanation: opt.explanation || '',
        })),
        sectionId: targetSectionId || undefined,
      };

      await onImport(importPayload);
      onClose();
    } catch (err) {
      console.error('Failed to import question:', err);
    } finally {
      setImporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9998,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        }}
      >
        <div
          style={{
            background: 'var(--lms-card, #111116)',
            border: '1px solid var(--border-color, #27272a)',
            borderRadius: 16,
            width: '100%',
            maxWidth: 1040,
            height: '85vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '16px 24px',
              borderBottom: '1px solid var(--border-color, #27272a)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--surface-dark, #0d0d12)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: 'rgba(59, 130, 246, 0.15)',
                  color: '#3b82f6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <BookOpen size={18} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary, #fff)' }}>
                  Import from Question Bank
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-muted, #a1a1aa)' }}>
                  Select from curated, pre-tested question templates across algorithms, system design, and MCQ pools.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted, #a1a1aa)',
                cursor: 'pointer',
                padding: 6,
                borderRadius: 6,
              }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Filters Bar */}
          <div
            style={{
              padding: '12px 24px',
              borderBottom: '1px solid var(--border-color, #27272a)',
              display: 'flex',
              flexWrap: 'wrap',
              gap: 12,
              alignItems: 'center',
              background: 'var(--surface-medium, #141419)',
            }}
          >
            {/* Search */}
            <div
              style={{
                position: 'relative',
                flex: '1 1 200px',
                minWidth: 200,
              }}
            >
              <Search
                size={14}
                style={{
                  position: 'absolute',
                  left: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted, #71717a)',
                }}
              />
              <input
                type="text"
                placeholder="Search templates by title or tags..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 34px',
                  borderRadius: 8,
                  border: '1px solid var(--border-color, #333)',
                  background: 'var(--lms-card, #0a0a0f)',
                  color: 'var(--text-primary, #fff)',
                  fontSize: 13,
                  outline: 'none',
                }}
              />
            </div>

            {/* Category Select */}
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid var(--border-color, #333)',
                background: 'var(--lms-card, #0a0a0f)',
                color: 'var(--text-primary, #fff)',
                fontSize: 13,
                outline: 'none',
              }}
            >
              {QUESTION_CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>

            {/* Type Select */}
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid var(--border-color, #333)',
                background: 'var(--lms-card, #0a0a0f)',
                color: 'var(--text-primary, #fff)',
                fontSize: 13,
                outline: 'none',
              }}
            >
              <option value="ALL">All Question Types</option>
              <option value="CODING">💻 Coding Challenges</option>
              <option value="MULTIPLE_CHOICE">🔘 Multiple Choice (MCQ)</option>
            </select>

            {/* Difficulty Select */}
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid var(--border-color, #333)',
                background: 'var(--lms-card, #0a0a0f)',
                color: 'var(--text-primary, #fff)',
                fontSize: 13,
                outline: 'none',
              }}
            >
              <option value="ALL">All Difficulties</option>
              <option value="EASY">Easy</option>
              <option value="MEDIUM">Medium</option>
              <option value="HARD">Hard</option>
            </select>
          </div>

          {/* Split Pane: Left List, Right Detail */}
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            {/* List */}
            <div
              style={{
                width: '42%',
                borderRight: '1px solid var(--border-color, #27272a)',
                overflowY: 'auto',
                padding: 12,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              {loading ? (
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                  Loading questions...
                </div>
              ) : questions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                  No questions found matching the selected filters.
                </div>
              ) : (
                questions.map((q) => {
                  const isSelected = selectedQuestion?.id === q.id;
                  return (
                    <div
                      key={q.id}
                      onClick={() => setSelectedQuestion(q)}
                      style={{
                        padding: '12px 14px',
                        borderRadius: 10,
                        border: isSelected ? '2px solid #3b82f6' : '1px solid var(--border-color, #27272a)',
                        background: isSelected ? 'rgba(59, 130, 246, 0.08)' : 'var(--lms-card, #13131a)',
                        cursor: 'pointer',
                        transition: 'all 0.12s ease',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary, #fff)', flex: 1, marginRight: 8 }}>
                          {q.title}
                        </span>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: 4,
                            background: q.difficulty === 'EASY' ? 'rgba(16, 185, 129, 0.15)' : q.difficulty === 'MEDIUM' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            color: q.difficulty === 'EASY' ? '#10b981' : q.difficulty === 'MEDIUM' ? '#f59e0b' : '#ef4444',
                          }}
                        >
                          {q.difficulty}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-muted, #71717a)' }}>
                        <span>{q.questionType === 'CODING' ? '💻 Coding' : '🔘 MCQ'}</span>
                        <span>•</span>
                        <span>{q.marks} pts</span>
                        <span>•</span>
                        <span>{q.questionType === 'CODING' ? `${q.testCases?.length || 0} cases` : `${q.options?.length || 0} options`}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Detail Preview Pane */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: 24,
                background: 'var(--lms-card, #0f0f14)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {selectedQuestion ? (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text-primary, #fff)' }}>
                        {selectedQuestion.title}
                      </h4>
                      <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                        {selectedQuestion.tags?.map((t) => (
                          <span
                            key={t}
                            style={{
                              fontSize: 11,
                              padding: '2px 8px',
                              borderRadius: 12,
                              background: 'rgba(255, 255, 255, 0.06)',
                              color: 'var(--text-muted, #a1a1aa)',
                            }}
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPreviewQuestion(selectedQuestion)}
                      style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      <Eye size={13} />
                      <span>Live Test</span>
                    </Button>
                  </div>

                  <div
                    style={{
                      background: 'rgba(0,0,0,0.2)',
                      border: '1px solid var(--border-color, #27272a)',
                      borderRadius: 10,
                      padding: 16,
                      fontSize: 13,
                      lineHeight: 1.6,
                      color: 'var(--text-primary, #d4d4d8)',
                      whiteSpace: 'pre-wrap',
                      marginBottom: 16,
                    }}
                  >
                    {selectedQuestion.description}
                  </div>

                  {selectedQuestion.questionType === 'CODING' ? (
                    <div>
                      <h5 style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700, color: 'var(--text-primary, #fff)' }}>
                        Test Cases ({selectedQuestion.testCases?.length || 0}):
                      </h5>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {selectedQuestion.testCases?.map((tc, idx) => (
                          <div
                            key={idx}
                            style={{
                              padding: 10,
                              borderRadius: 8,
                              background: 'var(--surface-dark, #0d0d12)',
                              border: '1px solid var(--border-color, #27272a)',
                              fontSize: 12,
                              fontFamily: 'monospace',
                            }}
                          >
                            <div style={{ color: tc.sample ? '#10b981' : '#a855f7', fontWeight: 600, marginBottom: 4 }}>
                              {tc.sample ? 'Visible Sample Case' : 'Graded Hidden Case'}
                            </div>
                            <div>Input: {tc.inputData}</div>
                            <div>Output: {tc.expectedOutput}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h5 style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700, color: 'var(--text-primary, #fff)' }}>
                        Options:
                      </h5>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {selectedQuestion.options?.map((opt, idx) => (
                          <div
                            key={idx}
                            style={{
                              padding: '8px 12px',
                              borderRadius: 8,
                              background: opt.isCorrect ? 'rgba(16, 185, 129, 0.1)' : 'var(--surface-dark, #0d0d12)',
                              border: opt.isCorrect ? '1px solid #10b981' : '1px solid var(--border-color, #27272a)',
                              fontSize: 13,
                              color: 'var(--text-primary, #fff)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                            }}
                          >
                            <strong>{String.fromCharCode(65 + idx)}.</strong>
                            <span>{opt.optionText}</span>
                            {opt.isCorrect && <Check size={14} color="#10b981" style={{ marginLeft: 'auto' }} />}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Select a question to inspect details.
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div
            style={{
              padding: '16px 24px',
              borderTop: '1px solid var(--border-color, #27272a)',
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              gap: 12,
              background: 'var(--surface-dark, #0d0d12)',
            }}
          >
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={!selectedQuestion || importing}
              isLoading={importing}
              onClick={handleConfirmImport}
            >
              Import Question to Assessment
            </Button>
          </div>
        </div>
      </div>

      {previewQuestion && (
        <QuestionPreviewModal
          isOpen={true}
          onClose={() => setPreviewQuestion(null)}
          questionData={previewQuestion}
        />
      )}
    </>
  );
}
