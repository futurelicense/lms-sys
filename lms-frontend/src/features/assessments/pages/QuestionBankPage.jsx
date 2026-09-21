import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpen, Search, Filter, Plus, Code2, CheckCircle2,
  ListFilter, Sparkles, Copy, Check, Eye, Trash2, Tag,
  Clock, Database, Layers, ArrowUpRight, CheckSquare, Square,
  Upload, Download, FileText
} from 'lucide-react';
import Button from '../../../components/common/Button';
import Badge from '../../../components/common/Badge';
import Alert from '../../../components/feedback/Alert';
import { useToast } from '../../../components/feedback/Toast';
import { questionBankService, QUESTION_CATEGORIES } from '../services/questionBankService';
import QuestionPreviewModal from '../components/QuestionPreviewModal';
import ExportToAssessmentModal from '../components/ExportToAssessmentModal';
import ImportQuestionsFileModal from '../components/ImportQuestionsFileModal';
import { AdminConfirmModal } from '../../../components/ui/AdminModal';

export default function QuestionBankPage() {
  const toast = useToast();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');
  const [previewQuestion, setPreviewQuestion] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Bulk selection, Import, and Export states
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportQuestionsList, setExportQuestionsList] = useState([]);
  const [importFileModalOpen, setImportFileModalOpen] = useState(false);

  useEffect(() => {
    loadBank();
  }, [selectedCategory, selectedDifficulty, selectedType, search]);

  const loadBank = async () => {
    setLoading(true);
    try {
      const data = await questionBankService.getQuestions({
        category: selectedCategory,
        difficulty: selectedDifficulty,
        type: selectedType,
        search,
      });
      setQuestions(data);
    } catch (err) {
      console.error('Failed to load questions:', err);
      toast.error('Failed to load Question Bank.');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === questions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(questions.map(q => q.id)));
    }
  };

  const handleExportSelected = () => {
    const toExport = questions.filter(q => selectedIds.has(q.id));
    if (toExport.length === 0) {
      // Default to all currently filtered questions
      setExportQuestionsList(questions);
    } else {
      setExportQuestionsList(toExport);
    }
    setExportModalOpen(true);
  };

  const handleExportSingle = (q) => {
    setExportQuestionsList([q]);
    setExportModalOpen(true);
  };

  const handleExportFile = (format) => {
    const toExport = selectedIds.size > 0
      ? questions.filter((q) => selectedIds.has(q.id))
      : questions;

    if (toExport.length === 0) {
      toast.error('No questions available to export.');
      return;
    }

    const timestamp = new Date().toISOString().slice(0, 10);
    if (format === 'csv') {
      questionBankService.exportToCsv(toExport, `question-bank-${timestamp}.csv`);
      toast.success(`Exported ${toExport.length} questions to CSV.`);
    } else {
      questionBankService.exportToJson(toExport, `question-bank-${timestamp}.json`);
      toast.success(`Exported ${toExport.length} questions to JSON.`);
    }
  };

  const handleImportSuccess = async (importedList) => {
    try {
      await questionBankService.saveBatchToBank(importedList);
      toast.success(`Imported ${importedList.length} questions into Question Bank!`);
      loadBank();
    } catch (err) {
      console.error('Import error:', err);
      toast.error('Failed to save imported questions.');
    }
  };

  const stats = useMemo(() => {
    const total = questions.length;
    const coding = questions.filter((q) => q.questionType === 'CODING').length;
    const mcq = questions.filter((q) => q.questionType === 'MULTIPLE_CHOICE').length;
    return { total, coding, mcq };
  }, [questions]);

  const handleCopyQuestion = (q) => {
    const textToCopy = `Title: ${q.title}\nDifficulty: ${q.difficulty}\nType: ${q.questionType}\n\nDescription:\n${q.description}\n\nInput Format: ${q.inputFormat}\nOutput Format: ${q.outputFormat}\nConstraints: ${q.constraints}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedId(q.id);
    toast.success(`Copied "${q.title}" to clipboard!`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDeleteCustom = (id, title) => {
    setDeleteTarget({ id, title, loading: false });
  };

  const confirmDeleteCustom = async () => {
    if (!deleteTarget) return;
    setDeleteTarget((prev) => ({ ...prev, loading: true }));
    try {
      await questionBankService.deleteFromBank(deleteTarget.id);
      toast.success('Question removed from bank.');
      setDeleteTarget(null);
      loadBank();
    } catch {
      toast.error('Failed to delete question.');
      setDeleteTarget(null);
    }
  };

  return (
    <div style={{ width: '100%', minHeight: '80vh' }}>
      
      {/* ── Page Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: 'rgba(59, 130, 246, 0.12)',
                color: '#3b82f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <BookOpen size={20} />
            </div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>
              Global Question Bank
            </h1>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: 'uppercase',
                padding: '2px 8px',
                borderRadius: 20,
                background: 'rgba(99, 102, 241, 0.12)',
                color: '#818cf8',
                border: '1px solid rgba(99, 102, 241, 0.25)',
              }}
            >
              Curated Repository
            </span>
          </div>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--text-muted)' }}>
            Standardized repository of coding challenges, algorithmic exercises, and multiple choice questions ready to transform into assessments.
          </p>
        </div>

        {/* Header Actions: Import, Export, Export to Assessment */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <Button
            variant="secondary"
            onClick={() => setImportFileModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              padding: '9px 14px',
              fontWeight: 600,
            }}
          >
            <Upload size={15} />
            <span>Import Questions</span>
          </Button>

          <Button
            variant="secondary"
            onClick={() => handleExportFile('json')}
            disabled={questions.length === 0}
            title="Download questions as JSON"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '9px 12px',
              fontWeight: 500,
              fontSize: 13,
            }}
          >
            <Download size={14} />
            <span>Export JSON</span>
          </Button>

          <Button
            variant="secondary"
            onClick={() => handleExportFile('csv')}
            disabled={questions.length === 0}
            title="Download questions as CSV spreadsheet"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '9px 12px',
              fontWeight: 500,
              fontSize: 13,
            }}
          >
            <Download size={14} />
            <span>Export CSV</span>
          </Button>

          <Button
            variant="primary"
            onClick={handleExportSelected}
            disabled={questions.length === 0}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '9px 16px',
              fontWeight: 600,
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.25)',
            }}
          >
            <Sparkles size={15} />
            <span>
              {selectedIds.size > 0
                ? `Export (${selectedIds.size}) to Assessment`
                : 'Export to Assessment'}
            </span>
          </Button>
        </div>
      </div>


      {/* ── Quick Stats Strip ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div style={statCardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Questions Available</span>
            <Layers size={16} color="#3b82f6" />
          </div>
          <span style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)' }}>
            {stats.total}
          </span>
        </div>

        <div style={statCardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Coding Challenges</span>
            <Code2 size={16} color="#10b981" />
          </div>
          <span style={{ fontSize: 24, fontWeight: 800, color: '#10b981' }}>
            {stats.coding}
          </span>
        </div>

        <div style={statCardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>MCQ Pools</span>
            <ListFilter size={16} color="#a855f7" />
          </div>
          <span style={{ fontSize: 24, fontWeight: 800, color: '#a855f7' }}>
            {stats.mcq}
          </span>
        </div>
      </div>

      {/* ── Category Tabs & Filter Toolbar ── */}
      <div
        style={{
          background: 'var(--lms-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 14,
          padding: 16,
          marginBottom: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        {/* Category Pills */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
          {QUESTION_CATEGORIES.map((cat) => {
            const active = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 20,
                  fontSize: 13,
                  fontWeight: active ? 600 : 500,
                  border: active ? '1px solid #3b82f6' : '1px solid var(--border-color)',
                  background: active ? 'rgba(59, 130, 246, 0.12)' : 'transparent',
                  color: active ? '#3b82f6' : 'var(--text-muted)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease',
                }}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Search & Select Filters */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
          <div style={{ flex: '1 1 240px', minWidth: 220, position: 'relative' }}>
            <Search
              size={15}
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }}
            />
            <input
              type="text"
              placeholder="Search by title, keyword, or tag..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px 9px 36px',
                borderRadius: 8,
                border: '1px solid var(--border-color)',
                background: 'var(--surface-medium, rgba(255, 255, 255, 0.03))',
                color: 'var(--text-primary)',
                fontSize: 13,
                outline: 'none',
              }}
            />
          </div>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            style={selectStyle}
          >
            <option value="ALL">All Question Formats</option>
            <option value="CODING">💻 Coding Challenges</option>
            <option value="MULTIPLE_CHOICE">🔘 Multiple Choice (MCQ)</option>
          </select>

          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            style={selectStyle}
          >
            <option value="ALL">All Difficulties</option>
            <option value="EASY">Easy</option>
            <option value="MEDIUM">Medium</option>
            <option value="HARD">Hard</option>
          </select>
        </div>

        {/* ── Bulk Selection & Export Control Strip ── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
            paddingTop: 12,
            borderTop: '1px solid var(--border-color)',
            fontSize: 13,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                cursor: 'pointer',
                userSelect: 'none',
                color: 'var(--text-primary)',
              }}
            >
              <input
                type="checkbox"
                checked={questions.length > 0 && selectedIds.size === questions.length}
                onChange={selectAll}
                style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#3b82f6' }}
              />
              <span style={{ fontWeight: 600 }}>Select All ({questions.length})</span>
            </label>

            {selectedIds.size > 0 && (
              <>
                <span style={{ color: 'var(--text-muted)' }}>•</span>
                <span style={{ color: '#3b82f6', fontWeight: 600 }}>
                  {selectedIds.size} selected
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedIds(new Set())}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    fontSize: 12,
                    padding: 0,
                  }}
                >
                  Clear
                </button>
              </>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              type="button"
              onClick={handleExportSelected}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 14px',
                borderRadius: 8,
                border: selectedIds.size > 0 ? '1px solid #3b82f6' : '1px solid var(--border-color)',
                background: selectedIds.size > 0 ? '#3b82f6' : 'var(--surface-medium, rgba(255, 255, 255, 0.04))',
                color: selectedIds.size > 0 ? '#ffffff' : 'var(--text-primary)',
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
                boxShadow: selectedIds.size > 0 ? '0 2px 8px rgba(59, 130, 246, 0.3)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <Sparkles size={14} />
              <span>
                {selectedIds.size > 0
                  ? `Transform ${selectedIds.size} to Assessment`
                  : 'Transform All Filtered to Assessment'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Questions Grid ── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          Loading questions repository...
        </div>
      ) : questions.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '60px 20px',
            background: 'var(--lms-card)',
            borderRadius: 14,
            border: '1px dashed var(--border-color)',
          }}
        >
          <BookOpen size={36} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ margin: '0 0 6px', fontSize: 16, color: 'var(--text-primary)' }}>
            No questions found
          </h3>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
            Try adjusting your search keywords or filter selections.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: 20,
          }}
        >
          {questions.map((q) => {
            const isCoding = q.questionType === 'CODING';
            const isSelected = selectedIds.has(q.id);
            const diffColor =
              q.difficulty === 'EASY'
                ? '#10b981'
                : q.difficulty === 'MEDIUM'
                ? '#f59e0b'
                : '#ef4444';

            return (
              <div
                key={q.id}
                style={{
                  background: isSelected ? 'rgba(59, 130, 246, 0.05)' : 'var(--lms-card)',
                  border: isSelected ? '1px solid #3b82f6' : '1px solid var(--border-color)',
                  borderRadius: 14,
                  padding: 20,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                  boxShadow: isSelected ? '0 0 0 1px #3b82f6, 0 4px 12px rgba(59, 130, 246, 0.1)' : '0 2px 4px rgba(0,0,0,0.03)',
                  transition: 'all 0.15s ease',
                  position: 'relative',
                }}
              >
                {/* Top Row: Selection Checkbox, Format & Difficulty Badges */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        cursor: 'pointer',
                      }}
                      onClick={(e) => e.stopPropagation()}
                      title={isSelected ? 'Deselect challenge' : 'Select for assessment export'}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(q.id)}
                        style={{ width: 17, height: 17, cursor: 'pointer', accentColor: '#3b82f6' }}
                      />
                    </label>

                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: 11,
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: 6,
                        background: isCoding ? 'rgba(59, 130, 246, 0.12)' : 'rgba(168, 85, 247, 0.12)',
                        color: isCoding ? '#3b82f6' : '#a855f7',
                      }}
                    >
                      {isCoding ? <Code2 size={12} /> : <ListFilter size={12} />}
                      {isCoding ? 'Coding Challenge' : 'Multiple Choice'}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 6,
                        background: `${diffColor}18`,
                        color: diffColor,
                      }}
                    >
                      {q.difficulty}
                    </span>
                  </div>

                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>
                    {q.marks} pts
                  </span>
                </div>

                {/* Question Title */}
                <div>
                  <h3
                    style={{
                      margin: '0 0 6px',
                      fontSize: 16,
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      lineHeight: 1.3,
                    }}
                  >
                    {q.title}
                  </h3>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 13,
                      color: 'var(--text-muted)',
                      lineHeight: 1.5,
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {q.description}
                  </p>
                </div>

                {/* Tags */}
                {q.tags && q.tags.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {q.tags.map((tag) => (
                      <span
                        key={tag}
                        style={{
                          fontSize: 11,
                          padding: '2px 8px',
                          borderRadius: 6,
                          background: 'var(--surface-medium, rgba(255,255,255,0.05))',
                          color: 'var(--text-muted)',
                        }}
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Specs Pill info */}
                <div
                  style={{
                    padding: '8px 12px',
                    borderRadius: 8,
                    background: 'var(--surface-medium, rgba(255, 255, 255, 0.03))',
                    fontSize: 12,
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span>
                    {isCoding
                      ? `${q.testCases?.length || 0} Test Cases (${q.testCases?.filter((t) => t.sample).length || 0} visible)`
                      : `${q.options?.length || 0} Answer Options`}
                  </span>
                  <span>{isCoding ? `${q.timeLimitMs}ms / ${q.memoryLimitMb}MB` : 'Instant Grading'}</span>
                </div>

                {/* Bottom Actions */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: 'auto',
                    paddingTop: 12,
                    borderTop: '1px solid var(--border-color)',
                  }}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPreviewQuestion(q)}
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <Eye size={13} />
                    <span>Preview & Test</span>
                  </Button>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {/* Quick Export Single Question to Assessment Button */}
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleExportSingle(q)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                        fontSize: 12,
                        padding: '5px 10px',
                        boxShadow: '0 2px 6px rgba(59, 130, 246, 0.25)',
                      }}
                      title="Export this question to an Assessment"
                    >
                      <Sparkles size={12} />
                      <span>Export</span>
                    </Button>

                    <button
                      type="button"
                      onClick={() => handleCopyQuestion(q)}
                      title="Copy Question Summary to Clipboard"
                      style={{
                        padding: '6px 10px',
                        borderRadius: 6,
                        border: '1px solid var(--border-color)',
                        background: 'transparent',
                        color: copiedId === q.id ? '#10b981' : 'var(--text-muted)',
                        cursor: 'pointer',
                        fontSize: 12,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {copiedId === q.id ? <Check size={13} /> : <Copy size={13} />}
                      <span>{copiedId === q.id ? 'Copied' : 'Copy'}</span>
                    </button>

                    {q.isCustom && (
                      <button
                        type="button"
                        onClick={() => handleDeleteCustom(q.id, q.title)}
                        title="Delete custom question"
                        style={{
                          padding: '6px 8px',
                          borderRadius: 6,
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          background: 'rgba(239, 68, 68, 0.08)',
                          color: '#ef4444',
                          cursor: 'pointer',
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Preview and Interactive Test Runner Modal */}
      {previewQuestion && (
        <QuestionPreviewModal
          isOpen={true}
          onClose={() => setPreviewQuestion(null)}
          questionData={previewQuestion}
        />
      )}

      {/* Export to Assessment Modal */}
      <ExportToAssessmentModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        selectedQuestions={exportQuestionsList}
        onSuccess={() => {
          setSelectedIds(new Set());
          loadBank();
        }}
      />

      {/* Bulk Import Questions Modal (CSV/JSON) */}
      <ImportQuestionsFileModal
        isOpen={importFileModalOpen}
        onClose={() => setImportFileModalOpen(false)}
        onImportSuccess={handleImportSuccess}
        target="bank"
        targetTitle="Question Bank"
      />

      {deleteTarget && (
        <AdminConfirmModal
          open={Boolean(deleteTarget)}
          onClose={() => setDeleteTarget(null)}
          onConfirm={confirmDeleteCustom}
          title="Delete Question Template"
          message={`Are you sure you want to delete "${deleteTarget.title}" from the question bank? This action cannot be undone.`}
          confirmLabel="Delete Question"
          variant="danger"
          loading={deleteTarget.loading}
        />
      )}
    </div>
  );
}

const statCardStyle = {
  background: 'var(--lms-card)',
  border: '1px solid var(--border-color)',
  borderRadius: 14,
  padding: 16,
  display: 'flex',
  flexDirection: 'column',
  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
};

const selectStyle = {
  padding: '8px 12px',
  borderRadius: 8,
  border: '1px solid var(--border-color)',
  background: 'var(--surface-medium, rgba(255, 255, 255, 0.03))',
  color: 'var(--text-primary)',
  fontSize: 13,
  outline: 'none',
  cursor: 'pointer',
};
