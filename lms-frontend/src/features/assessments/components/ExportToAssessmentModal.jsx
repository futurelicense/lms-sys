import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  X, Sparkles, Plus, CheckCircle2, ArrowRight, Layers, FileText,
  Clock, Award, AlertCircle, RefreshCw, ChevronRight, ExternalLink,
  BookOpen, Code2, ListFilter, Trash2
} from 'lucide-react';
import Button from '../../../components/common/Button';
import Badge from '../../../components/common/Badge';
import { adminAssessmentService } from '../services/adminAssessmentService';
import { ROUTES } from '../../../constants/routes';
import { useToast } from '../../../components/feedback/Toast';

export default function ExportToAssessmentModal({
  isOpen,
  onClose,
  selectedQuestions = [],
  onSuccess,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const isAdmin = location.pathname.startsWith('/admin');

  // Mode: 'NEW' (create new assessment) | 'EXISTING' (add to existing assessment)
  const [mode, setMode] = useState('NEW');

  // Form states for New Assessment
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [maxAttempts, setMaxAttempts] = useState(1);
  const [randomizeQuestions, setRandomizeQuestions] = useState(false);

  // States for Existing Assessment list
  const [existingAssessments, setExistingAssessments] = useState([]);
  const [loadingExisting, setLoadingExisting] = useState(false);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState('');

  // Execution state
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressText, setProgressText] = useState('');
  const [createdResult, setCreatedResult] = useState(null);

  // Working copy of questions to export (allows removing individual items)
  const [questionsToExport, setQuestionsToExport] = useState([]);

  useEffect(() => {
    if (isOpen) {
      setQuestionsToExport([...selectedQuestions]);
      setCreatedResult(null);
      setIsProcessing(false);
      setProgressText('');

      // Auto-generate a descriptive title based on selected questions
      const now = new Date();
      const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const types = Array.from(new Set(selectedQuestions.map(q => q.questionType)));
      const typeLabel = types.length === 1
        ? (types[0] === 'CODING' ? 'Coding Assessment' : 'MCQ Assessment')
        : 'Comprehensive Assessment';
      setTitle(`${typeLabel} - ${dateStr} (${selectedQuestions.length} Questions)`);
      setDescription(`Generated from Question Bank on ${now.toLocaleString()} with ${selectedQuestions.length} curated problems.`);

      // Calculate reasonable duration (e.g. 15 mins per coding problem, 2 mins per MCQ)
      let estimatedMinutes = 0;
      selectedQuestions.forEach(q => {
        if (q.questionType === 'CODING') estimatedMinutes += 20;
        else estimatedMinutes += 3;
      });
      setDurationMinutes(Math.max(30, Math.min(180, estimatedMinutes || 60)));
      setMode('NEW');
    }
  }, [isOpen, selectedQuestions]);

  // Load existing draft/active assessments ONLY when switching to EXISTING tab
  const loadExistingAssessments = async () => {
    setLoadingExisting(true);
    try {
      const res = await adminAssessmentService.list({ size: 100 });
      const data = res?.data?.content || res?.data?.items || res?.content || res?.data || res || [];
      const list = Array.isArray(data) ? data : [];
      setExistingAssessments(list);
      if (list.length > 0 && !selectedAssessmentId) {
        setSelectedAssessmentId(list[0].id);
      }
    } catch (err) {
      console.warn('Could not load existing assessments:', err);
      setExistingAssessments([]);
    } finally {
      setLoadingExisting(false);
    }
  };

  useEffect(() => {
    if (isOpen && mode === 'EXISTING') {
      loadExistingAssessments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, mode]);

  const totalMarks = useMemo(() => {
    return questionsToExport.reduce((sum, q) => sum + (Number(q.marks) || 10), 0);
  }, [questionsToExport]);

  const handleRemoveQuestion = (id) => {
    setQuestionsToExport(prev => prev.filter(q => q.id !== id));
  };

  const prepareQuestionPayload = (q) => ({
    title: q.title,
    description: q.description || '',
    questionType: q.questionType || 'CODING',
    difficulty: q.difficulty || 'MEDIUM',
    marks: Number(q.marks) || 10,
    timeLimitMs: Number(q.timeLimitMs) || 2000,
    memoryLimitMb: Number(q.memoryLimitMb) || 256,
    inputFormat: q.inputFormat || '',
    outputFormat: q.outputFormat || '',
    constraints: q.constraints || '',
    testCases: (q.testCases || []).map((tc) => ({
      inputData: tc.inputData || '',
      expectedOutput: tc.expectedOutput || '',
      sample: Boolean(tc.sample),
      hidden: Boolean(tc.hidden),
      weight: Number(tc.weight) || 1,
    })),
    options: (q.options || []).map((opt, idx) => ({
      optionText: opt.optionText || '',
      isCorrect: Boolean(opt.isCorrect),
      orderIndex: opt.orderIndex ?? idx,
      explanation: opt.explanation || '',
    })),
  });

  const handleExport = async () => {
    if (questionsToExport.length === 0) {
      toast.error('Please select at least one question to export.');
      return;
    }

    setIsProcessing(true);

    try {
      let targetAssessmentId = selectedAssessmentId;
      let targetAssessmentTitle = '';

      if (mode === 'NEW') {
        if (!title.trim()) {
          toast.error('Please enter an assessment title.');
          setIsProcessing(false);
          return;
        }

        setProgressText('Creating new assessment...');
        const createPayload = {
          title: title.trim(),
          description: description.trim() || undefined,
          durationMinutes: Number(durationMinutes) || 60,
          totalMarks: totalMarks || 10,
          maxAttempts: Number(maxAttempts) || 1,
          randomizeQuestions: Boolean(randomizeQuestions),
          retakePolicy: 'BEST_SCORE',
          showResultAnalytics: true,
        };

        const res = await adminAssessmentService.create(createPayload);
        const created = res?.data?.data || res?.data || res;
        targetAssessmentId = created?.id;
        targetAssessmentTitle = created?.title || title.trim();

        if (!targetAssessmentId) {
          throw new Error('Assessment created but could not retrieve ID.');
        }
      } else {
        // Mode === 'EXISTING'
        if (!targetAssessmentId) {
          toast.error('Please select a target assessment.');
          setIsProcessing(false);
          return;
        }
        const existing = existingAssessments.find(a => a.id === targetAssessmentId);
        targetAssessmentTitle = existing?.title || 'Target Assessment';

        // Check if published: backend requires unpublish before adding questions
        if (existing?.status === 'PUBLISHED') {
          setProgressText(`Reverting "${existing.title}" to Draft to safely add questions...`);
          await adminAssessmentService.unpublish(targetAssessmentId);
        }
      }

      // Add each question to the assessment
      let addedCount = 0;
      for (let i = 0; i < questionsToExport.length; i++) {
        const q = questionsToExport[i];
        setProgressText(`Adding question ${i + 1} of ${questionsToExport.length}: "${q.title}"...`);
        const qPayload = prepareQuestionPayload(q);
        await adminAssessmentService.addQuestion(targetAssessmentId, qPayload);
        addedCount++;
      }

      toast.success(`Successfully exported ${addedCount} questions into "${targetAssessmentTitle}"! 🎉`);

      setCreatedResult({
        id: targetAssessmentId,
        title: targetAssessmentTitle,
        count: addedCount,
        totalMarks,
      });

      onSuccess?.();
    } catch (err) {
      console.error('Export to Assessment failed:', err);
      toast.error(err?.response?.data?.message || err?.message || 'Failed to export questions to assessment.');
    } finally {
      setIsProcessing(false);
      setProgressText('');
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isProcessing) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 680,
          maxHeight: '90vh',
          background: 'var(--lms-card, #111827)',
          border: '1px solid var(--border-color, #1f2937)',
          borderRadius: 16,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'scaleUp 0.15s ease-out',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid var(--border-color, #1f2937)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--surface-medium, rgba(255, 255, 255, 0.02))',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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
              <Sparkles size={18} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text-primary, #f9fafb)' }}>
                Transform to Assessment
              </h2>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted, #9ca3af)' }}>
                Export selected Question Bank challenges directly into an assessment.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted, #9ca3af)',
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              padding: 6,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: 24, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {createdResult ? (
            /* Success View */
            <div
              style={{
                textAlign: 'center',
                padding: '32px 16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 16,
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CheckCircle2 size={32} />
              </div>

              <div>
                <h3 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>
                  Assessment Ready!
                </h3>
                <p style={{ margin: 0, fontSize: 14, color: 'var(--text-muted)', maxWidth: 440 }}>
                  Successfully added <strong>{createdResult.count} questions</strong> ({createdResult.totalMarks} total pts) into:
                </p>
                <div
                  style={{
                    margin: '12px auto 0',
                    padding: '8px 16px',
                    borderRadius: 8,
                    background: 'var(--surface-medium, rgba(255, 255, 255, 0.04))',
                    border: '1px solid var(--border-color)',
                    fontSize: 15,
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    display: 'inline-block',
                  }}
                >
                  {createdResult.title}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                <Button
                  variant="secondary"
                  onClick={onClose}
                >
                  Close & Stay Here
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    onClose();
                    const dest = isAdmin
                      ? ROUTES.ADMIN_ASSESSMENT_DETAILS(createdResult.id)
                      : ROUTES.INSTRUCTOR_ASSESSMENT_DETAILS(createdResult.id);
                    navigate(dest);
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <span>Open Assessment</span>
                  <ArrowRight size={14} />
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Question Summary Pill Strip */}
              <div
                style={{
                  background: 'var(--surface-medium, rgba(255, 255, 255, 0.03))',
                  border: '1px solid var(--border-color)',
                  borderRadius: 12,
                  padding: '12px 16px',
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Badge tone="primary">{questionsToExport.length} Questions Selected</Badge>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    • Total Marks: <strong style={{ color: 'var(--text-primary)' }}>{totalMarks} pts</strong>
                  </span>
                </div>

                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {questionsToExport.filter(q => q.questionType === 'CODING').length} Coding • {questionsToExport.filter(q => q.questionType === 'MULTIPLE_CHOICE').length} MCQ
                </span>
              </div>

              {/* Mode Switcher Tabs */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 8,
                  background: 'var(--surface-medium, rgba(255, 255, 255, 0.03))',
                  padding: 4,
                  borderRadius: 10,
                  border: '1px solid var(--border-color)',
                }}
              >
                <button
                  type="button"
                  onClick={() => setMode('NEW')}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    background: mode === 'NEW' ? 'var(--text-primary)' : 'transparent',
                    color: mode === 'NEW' ? 'var(--lms-background)' : 'var(--text-muted)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Plus size={14} />
                  <span>Create New Assessment</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMode('EXISTING')}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    background: mode === 'EXISTING' ? 'var(--text-primary)' : 'transparent',
                    color: mode === 'EXISTING' ? 'var(--lms-background)' : 'var(--text-muted)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Layers size={14} />
                  <span>Add to Existing Assessment</span>
                </button>
              </div>

              {/* Tab Form Content */}
              {mode === 'NEW' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label style={labelStyle}>
                      Assessment Title <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Algorithms & Data Structures Final Exam"
                      style={inputStyle}
                      disabled={isProcessing}
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>Description / Instructions</label>
                    <textarea
                      rows={2}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Brief instructions for candidates taking this assessment..."
                      style={{ ...inputStyle, resize: 'vertical' }}
                      disabled={isProcessing}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div>
                      <label style={labelStyle}>
                        <Clock size={12} style={{ display: 'inline', marginRight: 4 }} />
                        Duration (minutes)
                      </label>
                      <input
                        type="number"
                        min={5}
                        max={1440}
                        value={durationMinutes}
                        onChange={(e) => setDurationMinutes(e.target.value)}
                        style={inputStyle}
                        disabled={isProcessing}
                      />
                    </div>

                    <div>
                      <label style={labelStyle}>
                        <Award size={12} style={{ display: 'inline', marginRight: 4 }} />
                        Max Attempts Allowed
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={maxAttempts}
                        onChange={(e) => setMaxAttempts(e.target.value)}
                        style={inputStyle}
                        disabled={isProcessing}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
                    <input
                      type="checkbox"
                      id="rand-q-check"
                      checked={randomizeQuestions}
                      onChange={(e) => setRandomizeQuestions(e.target.checked)}
                      style={{ width: 16, height: 16, cursor: 'pointer' }}
                      disabled={isProcessing}
                    />
                    <label htmlFor="rand-q-check" style={{ fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer' }}>
                      Randomize questions order for each student
                    </label>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label style={labelStyle}>
                      Select Existing Target Assessment <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    {loadingExisting ? (
                      <div style={{ padding: 12, textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
                        Loading assessments...
                      </div>
                    ) : existingAssessments.length === 0 ? (
                      <div
                        style={{
                          padding: 16,
                          borderRadius: 8,
                          background: 'rgba(239, 68, 68, 0.08)',
                          border: '1px solid rgba(239, 68, 68, 0.2)',
                          color: '#ef4444',
                          fontSize: 13,
                        }}
                      >
                        No existing assessments found. Please choose "Create New Assessment".
                      </div>
                    ) : (
                      <select
                        value={selectedAssessmentId}
                        onChange={(e) => setSelectedAssessmentId(e.target.value)}
                        style={{ ...inputStyle, cursor: 'pointer' }}
                        disabled={isProcessing}
                      >
                        {existingAssessments.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.title} ({a.status} • {a.totalMarks || 0} pts)
                          </option>
                        ))}
                      </select>
                    )}
                    <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
                      Selected questions will be appended to this assessment. If the assessment is published, it will be safely reverted to draft to attach the new questions.
                    </p>
                  </div>
                </div>
              )}

              {/* Selected Questions Mini-List (collapsible preview) */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                    Questions to be Exported ({questionsToExport.length})
                  </span>
                </div>

                <div
                  style={{
                    maxHeight: 140,
                    overflowY: 'auto',
                    border: '1px solid var(--border-color)',
                    borderRadius: 10,
                    padding: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                    background: 'var(--surface-medium, rgba(255, 255, 255, 0.02))',
                  }}
                >
                  {questionsToExport.map((q) => {
                    const isCoding = q.questionType === 'CODING';
                    return (
                      <div
                        key={q.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '6px 10px',
                          borderRadius: 6,
                          background: 'var(--lms-card)',
                          border: '1px solid var(--border-color)',
                          fontSize: 12,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 3,
                              fontSize: 11,
                              fontWeight: 600,
                              color: isCoding ? '#3b82f6' : '#a855f7',
                            }}
                          >
                            {isCoding ? <Code2 size={12} /> : <ListFilter size={12} />}
                          </span>
                          <span
                            style={{
                              fontWeight: 600,
                              color: 'var(--text-primary)',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              maxWidth: 380,
                            }}
                          >
                            {q.title}
                          </span>
                          <span style={{ color: 'var(--text-muted)' }}>({q.marks || 10} pts)</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveQuestion(q.id)}
                          title="Remove from export batch"
                          disabled={isProcessing || questionsToExport.length <= 1}
                          style={{
                            border: 'none',
                            background: 'transparent',
                            color: questionsToExport.length <= 1 ? 'var(--border-color)' : '#ef4444',
                            cursor: questionsToExport.length <= 1 ? 'not-allowed' : 'pointer',
                            padding: 2,
                            display: 'flex',
                            alignItems: 'center',
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Status Message / Progress */}
              {isProcessing && (
                <div
                  style={{
                    padding: '12px 16px',
                    borderRadius: 8,
                    background: 'rgba(59, 130, 246, 0.1)',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    color: '#3b82f6',
                    fontSize: 13,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <RefreshCw size={16} className="animate-spin" />
                  <span>{progressText || 'Exporting questions to assessment...'}</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        {!createdResult && (
          <div
            style={{
              padding: '16px 24px',
              borderTop: '1px solid var(--border-color, #1f2937)',
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              gap: 12,
              background: 'var(--surface-medium, rgba(255, 255, 255, 0.02))',
            }}
          >
            <Button
              variant="secondary"
              onClick={onClose}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleExport}
              disabled={isProcessing || questionsToExport.length === 0}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              {isProcessing ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Exporting...</span>
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  <span>
                    {mode === 'NEW'
                      ? `Create Assessment (${questionsToExport.length} Questions)`
                      : `Append to Assessment (${questionsToExport.length} Questions)`}
                  </span>
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes scaleUp {
          from { opacity: 0; transform: scale(0.96); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

const labelStyle = {
  display: 'block',
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--text-secondary, #d1d5db)',
  marginBottom: 6,
};

const inputStyle = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: 8,
  border: '1px solid var(--border-color, #374151)',
  background: 'var(--surface-medium, rgba(255, 255, 255, 0.04))',
  color: 'var(--text-primary, #f9fafb)',
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
};
