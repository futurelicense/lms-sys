import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Check, X, Award, FileText, Send, ChevronRight, ChevronLeft,
  MessageSquare, Trash2, CornerDownRight, Plus, Sparkles, ExternalLink
} from 'lucide-react';
import Editor from '@monaco-editor/react';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import TextArea from '../../../components/common/TextArea';
import Badge from '../../../components/common/Badge';
import Alert from '../../../components/feedback/Alert';
import gradingService from '../services/gradingService';
import rubricService from '../services/rubricService';

/** Maps submission language strings to Monaco language identifiers */
const LANG_MAP = {
  JAVA: 'java', java: 'java', Java: 'java',
  PYTHON: 'python', python: 'python', Python: 'python',
  JAVASCRIPT: 'javascript', javascript: 'javascript', JavaScript: 'javascript',
  'C++': 'cpp', CPP: 'cpp', cpp: 'cpp',
  C: 'c', c: 'c',
  TYPESCRIPT: 'typescript', typescript: 'typescript',
  GO: 'go', go: 'go',
  RUST: 'rust', rust: 'rust',
};
const getMonacoLang = (lang) => LANG_MAP[lang] || 'plaintext';

export const GradingWorkflowPage = () => {
  const [pending, setPending] = useState([]);
  const [rubrics, setRubrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSub, setSelectedSub] = useState(null);

  // Monaco Editor & Annotations state
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const decorationsRef = useRef([]);
  const [annotations, setAnnotations] = useState([]);
  const [activeLine, setActiveLine] = useState(null);
  const [commentText, setCommentText] = useState('');

  // Grading form state
  const [selectedRubricId, setSelectedRubricId] = useState('');
  const [manualScore, setManualScore] = useState('');
  const [status, setStatus] = useState('ACCEPTED');
  const [rubricScores, setRubricScores] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [pendingRes, rubricsRes] = await Promise.all([
        gradingService.getPendingSubmissions(),
        rubricService.list(),
      ]);
      setPending(pendingRes?.content ?? []);
      setRubrics(rubricsRes?.content ?? []);
      setSelectedSub(pendingRes?.content?.[0] ?? null);
      setSelectedRubricId('');
      setRubricScores({});
      setManualScore('');
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load grading queue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Load annotations when active submission changes
  useEffect(() => {
    if (!selectedSub) {
      setAnnotations([]);
      return;
    }
    const stored = localStorage.getItem(`lms_code_annotations_${selectedSub.id}`);
    if (stored) {
      try {
        setAnnotations(JSON.parse(stored));
      } catch {
        setAnnotations([]);
      }
    } else {
      setAnnotations([]);
    }
    setActiveLine(null);
    setCommentText('');
  }, [selectedSub?.id]);

  // Update Monaco decorations when annotations change
  const updateEditorDecorations = (currentAnnotations) => {
    if (!editorRef.current || !monacoRef.current) return;
    const newDecorations = currentAnnotations.map((ann) => ({
      range: new monacoRef.current.Range(ann.lineNumber, 1, ann.lineNumber, 1),
      options: {
        isWholeLine: true,
        className: 'monaco-annotated-line',
        glyphMarginClassName: 'monaco-annotation-glyph',
        glyphMarginHoverMessage: { value: `**Review Comment (Line ${ann.lineNumber})**: ${ann.comment}` },
      },
    }));
    decorationsRef.current = editorRef.current.deltaDecorations(decorationsRef.current, newDecorations);
  };

  useEffect(() => {
    updateEditorDecorations(annotations);
  }, [annotations]);

  const handleAddAnnotation = () => {
    if (!commentText.trim() || !activeLine || !selectedSub) return;
    const newAnn = {
      id: `ann-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      submissionId: selectedSub.id,
      lineNumber: activeLine,
      author: 'Instructor',
      comment: commentText.trim(),
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    const updated = [...annotations, newAnn].sort((a, b) => a.lineNumber - b.lineNumber);
    setAnnotations(updated);
    localStorage.setItem(`lms_code_annotations_${selectedSub.id}`, JSON.stringify(updated));
    setCommentText('');
    setActiveLine(null);
  };

  const handleDeleteAnnotation = (id) => {
    const updated = annotations.filter((a) => a.id !== id);
    setAnnotations(updated);
    if (selectedSub) {
      localStorage.setItem(`lms_code_annotations_${selectedSub.id}`, JSON.stringify(updated));
    }
  };

  const handleJumpToLine = (lineNumber) => {
    if (!editorRef.current) return;
    editorRef.current.revealLineInCenter(lineNumber);
    editorRef.current.setPosition({ lineNumber, column: 1 });
    editorRef.current.focus();
  };

  const handleSelectRubric = (rubricId) => {
    setSelectedRubricId(rubricId);
    const rubric = rubrics.find((r) => r.id === rubricId);
    if (rubric && rubric.criteria) {
      const initialScores = {};
      rubric.criteria.forEach((c) => {
        initialScores[c.id] = { score: c.maxPoints, feedback: '' };
      });
      setRubricScores(initialScores);
    } else {
      setRubricScores({});
    }
  };

  const handleRubricScoreChange = (criterionId, field, val) => {
    setRubricScores((prev) => ({
      ...prev,
      [criterionId]: {
        ...prev[criterionId],
        [field]: val,
      },
    }));
  };

  const handleSubmitGrade = async (e) => {
    e.preventDefault();
    if (!selectedSub) return;

    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      // Append inline annotations summary to rubric feedback
      const annotationsSummary = annotations.length > 0
        ? `\n\n[Inline Code Review Annotations]:\n` + annotations.map((a) => `• Line ${a.lineNumber}: ${a.comment}`).join('\n')
        : '';

      const rubricScoresPayload = Object.keys(rubricScores).map((critId, idx) => ({
        criterionId: critId,
        score: parseInt(rubricScores[critId].score) || 0,
        feedback: (rubricScores[critId].feedback || '') + (idx === 0 ? annotationsSummary : ''),
      }));

      await gradingService.gradeAttemptSubmission(selectedSub.attemptId, {
        submissionId: selectedSub.id,
        manualScore: manualScore ? parseInt(manualScore) : null,
        status,
        rubricScores: rubricScoresPayload,
      });

      setSuccessMsg('Submission graded successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);

      // Refresh list
      fetchData();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to save grade');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ width: '100%' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Award size={24} color="var(--primary-color, #4f46e5)" /> Instructor Grading Workflow
        </h1>
        <p style={{ color: 'var(--text-secondary, #6b7280)', fontSize: '0.9rem' }}>
          Evaluate student coding submissions, assign rubric criteria scores, and record feedback.
        </p>
      </div>

      {error && <div style={{ marginBottom: 16 }}><Alert tone="error">{error}</Alert></div>}
      {successMsg && <div style={{ marginBottom: 16 }}><Alert tone="success">{successMsg}</Alert></div>}

      {loading ? (
        <p>Loading grading queue...</p>
      ) : pending.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, background: '#f9fafb', borderRadius: 8, border: '1px solid #e5e7eb' }}>
          <Check size={40} color="#10b981" style={{ marginBottom: 12 }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>All Caught Up!</h3>
          <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>There are no pending student submissions requiring manual grading.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 24 }}>
          {/* Submission List */}
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 12 }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: 12, paddingLeft: 8 }}>
              Pending Queue ({pending.length})
            </h3>
            {pending.map((sub) => (
              <div
                key={sub.id}
                onClick={() => setSelectedSub(sub)}
                style={{
                  padding: 12,
                  borderRadius: 6,
                  cursor: 'pointer',
                  marginBottom: 8,
                  background: selectedSub?.id === sub.id ? '#eef2ff' : '#f9fafb',
                  borderLeft: selectedSub?.id === sub.id ? '4px solid #4f46e5' : '4px solid transparent',
                }}
              >
                <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>Question: {sub.questionId.slice(0, 8)}...</div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: 4 }}>
                  Language: {sub.language} | Submitted: {new Date(sub.submittedAt).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>

          {/* Submission Details & Grading Form */}
          {selectedSub && (
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Submission Code</h2>
                  <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>Attempt ID: {selectedSub.attemptId}</span>
                </div>
                <span style={{ background: '#dbeafe', color: '#1e40af', padding: '4px 10px', borderRadius: 12, fontSize: '0.8rem', fontWeight: 600 }}>
                  {selectedSub.language}
                </span>
              </div>

              {/* Syntax-highlighted code viewer with PR-Style Annotation Support */}
              <style>{`
                .monaco-annotated-line {
                  background: rgba(99, 102, 241, 0.22) !important;
                  border-left: 3px solid #6366f1 !important;
                }
                .monaco-annotation-glyph {
                  background: #6366f1;
                  border-radius: 50%;
                  margin-left: 4px;
                  width: 8px !important;
                  height: 8px !important;
                  margin-top: 5px;
                  box-shadow: 0 0 6px #6366f1;
                }
              `}</style>

              <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid #334155' }}>
                <Editor
                  height="340px"
                  language={getMonacoLang(selectedSub.language)}
                  value={selectedSub.sourceCode || '// No code submitted'}
                  theme="vs-dark"
                  onMount={(editor, monaco) => {
                    editorRef.current = editor;
                    monacoRef.current = monaco;
                    editor.onMouseDown((e) => {
                      if (e.target && e.target.position) {
                        setActiveLine(e.target.position.lineNumber);
                      }
                    });
                    updateEditorDecorations(annotations);
                  }}
                  options={{
                    readOnly: true,
                    minimap: { enabled: true, scale: 1 },
                    lineNumbers: 'on',
                    lineNumbersMinChars: 3,
                    scrollBeyondLastLine: false,
                    fontSize: 13,
                    fontFamily: "'Cascadia Code', 'Fira Code', 'JetBrains Mono', Consolas, monospace",
                    wordWrap: 'on',
                    renderLineHighlight: 'all',
                    padding: { top: 12, bottom: 12 },
                    domReadOnly: true,
                    contextmenu: false,
                    selectionHighlight: true,
                    occurrencesHighlight: 'singleFile',
                    bracketPairColorization: { enabled: true },
                    folding: true,
                    glyphMargin: true,
                  }}
                />
              </div>

              {/* ── PR-Style Inline Code Annotations Panel ── */}
              <div style={{ marginTop: 16, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <MessageSquare size={16} color="#6366f1" />
                    <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#1e293b' }}>
                      Inline Code Annotations ({annotations.length})
                    </span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    Click any line in the code editor to add line feedback
                  </span>
                </div>

                {/* Composer for Active Line */}
                {activeLine && (
                  <div style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: 6, padding: 12, marginBottom: 14, boxShadow: '0 2px 4px rgba(0,0,0,0.04)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#4f46e5', fontWeight: 600, fontSize: '0.75rem', padding: '2px 8px', borderRadius: 4 }}>
                        Reviewing Line {activeLine}
                      </span>
                      <button
                        type="button"
                        onClick={() => setActiveLine(null)}
                        style={{ border: 'none', background: 'transparent', color: '#94a3b8', cursor: 'pointer', fontSize: '0.8rem' }}
                      >
                        Cancel
                      </button>
                    </div>
                    <TextArea
                      rows={2}
                      placeholder={`Write PR-style feedback or suggestion for Line ${activeLine}...`}
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      style={{ width: '100%', marginBottom: 8, fontSize: '0.85rem' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={handleAddAnnotation}
                        disabled={!commentText.trim()}
                        style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                      >
                        Post Line Comment
                      </Button>
                    </div>
                  </div>
                )}

                {/* List of Posted Annotations */}
                {annotations.length === 0 && !activeLine ? (
                  <div style={{ textAlign: 'center', padding: '16px', color: '#94a3b8', fontSize: '0.825rem' }}>
                    No inline annotations added yet. Click any line number in the editor above to leave line-by-line feedback.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 220, overflowY: 'auto' }}>
                    {annotations.map((ann) => (
                      <div
                        key={ann.id}
                        style={{
                          background: '#fff',
                          border: '1px solid #e2e8f0',
                          borderLeft: '4px solid #6366f1',
                          borderRadius: 6,
                          padding: '10px 12px',
                          fontSize: '0.85rem',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span
                              onClick={() => handleJumpToLine(ann.lineNumber)}
                              style={{
                                background: '#e0e7ff',
                                color: '#3730a3',
                                padding: '2px 6px',
                                borderRadius: 4,
                                fontWeight: 700,
                                fontSize: '0.75rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 3,
                              }}
                              title="Jump to code line"
                            >
                              Line {ann.lineNumber} <ExternalLink size={10} />
                            </span>
                            <span style={{ fontWeight: 600, color: '#334155', fontSize: '0.8rem' }}>{ann.author}</span>
                            <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>{ann.createdAt}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteAnnotation(ann.id)}
                            style={{ border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', padding: 2 }}
                            title="Delete comment"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                        <div style={{ color: '#1e293b', lineHeight: 1.4, paddingLeft: 2 }}>{ann.comment}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Grading Form */}
              <form onSubmit={handleSubmitGrade} style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid #e5e7eb' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 16 }}>Evaluate Submission</h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: 6 }}>Attach Rubric</label>
                    <select
                      value={selectedRubricId}
                      onChange={(e) => handleSelectRubric(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #ccc' }}
                    >
                      <option value="">No Rubric (Direct Score)</option>
                      {rubrics.map((r) => (
                        <option key={r.id} value={r.id}>{r.title}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: 6 }}>Submission Decision</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #ccc' }}
                    >
                      <option value="ACCEPTED">ACCEPTED (Full Marks)</option>
                      <option value="WRONG_ANSWER">WRONG_ANSWER</option>
                      <option value="PARTIAL_SUCCESS">PARTIAL_SUCCESS</option>
                      <option value="MANUALLY_GRADED">MANUALLY_GRADED</option>
                    </select>
                  </div>
                </div>

                {/* Rubric Evaluation Form */}
                {selectedRubricId && rubrics.find((r) => r.id === selectedRubricId)?.criteria && (
                  <div style={{ background: '#f9fafb', padding: 16, borderRadius: 6, marginBottom: 16 }}>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 12 }}>Rubric Evaluation</h4>
                    {rubrics.find((r) => r.id === selectedRubricId).criteria.map((c) => (
                      <div key={c.id} style={{ marginBottom: 12, background: '#fff', padding: 12, borderRadius: 6, border: '1px solid #e5e7eb' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{c.criterionName}</span>
                          <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>Max: {c.maxPoints} pts (Weight: x{c.weight})</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12, alignItems: 'center' }}>
                          <Input
                            type="number"
                            min={0}
                            max={c.maxPoints}
                            value={rubricScores[c.id]?.score ?? c.maxPoints}
                            onChange={(e) => handleRubricScoreChange(c.id, 'score', e.target.value)}
                          />
                          <Input
                            placeholder="Feedback comment for this criterion..."
                            value={rubricScores[c.id]?.feedback ?? ''}
                            onChange={(e) => handleRubricScoreChange(c.id, 'feedback', e.target.value)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ marginBottom: 16 }}>
                  <Input
                    label="Manual Score Override (Optional)"
                    type="number"
                    value={manualScore}
                    onChange={(e) => setManualScore(e.target.value)}
                    placeholder="Auto-calculated from rubric if left empty"
                  />
                </div>

                <Button type="submit" isLoading={submitting}>
                  <Send size={16} style={{ marginRight: 6 }} /> Submit Grade Evaluation
                </Button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GradingWorkflowPage;
