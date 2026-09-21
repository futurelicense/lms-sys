import { useMemo, useEffect, useState, useRef } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Code2, Plus, Trash2, Eye, EyeOff, Settings, CheckCircle2,
  ListFilter, Copy, Check, ArrowRight, ArrowLeft,
  Terminal, FileCode, Sliders, Sparkles, Bold, Italic, List,
  Quote, Braces, AlertCircle, Table
} from 'lucide-react';
import Input from '../../../components/common/Input';
import Select from '../../../components/common/Select';
import Button from '../../../components/common/Button';
import Alert from '../../../components/feedback/Alert';
import { useToast } from '../../../components/feedback/Toast';
import { questionSchema } from '../validation/assessmentSchemas';
import { DIFFICULTY_OPTIONS, COMPILER_OPTIONS } from '../constants/assessmentConstants';
import QuestionPreviewModal from './QuestionPreviewModal';

const QUESTION_TYPE_OPTIONS = [
  { value: 'CODING', label: '💻 Coding Challenge' },
  { value: 'MULTIPLE_CHOICE', label: '🔘 Multiple Choice (MCQ)' },
];

const EMPTY_TC = { inputData: '', expectedOutput: '', sample: false, hidden: true, weight: 1 };
const EMPTY_OPTION = { optionText: '', isCorrect: false, explanation: '' };

const EMPTY_Q = {
  title: '',
  description: '',
  questionType: 'CODING',
  inputFormat: '',
  outputFormat: '',
  constraints: '',
  difficulty: 'MEDIUM',
  compiler: 'ALL',
  marks: 10,
  timeLimitMs: 2000,
  memoryLimitMb: 256,
  testCases: [{ inputData: '', expectedOutput: '', sample: true, hidden: false, weight: 1 }],
  options: [
    { optionText: '', isCorrect: true, explanation: '' },
    { optionText: '', isCorrect: false, explanation: '' },
  ],
};

const S = {
  card: {
    background: 'var(--surface-dark, #ffffff)',
    border: '1px solid var(--border-color, #e2e8f0)',
    borderRadius: 14,
  },
  cardHeader: {
    background: 'var(--surface-medium, #f8fafc)',
    borderBottom: '1px solid var(--border-color, #e2e8f0)',
  },
  innerCard: {
    background: 'var(--surface-medium, #f8fafc)',
    border: '1px solid var(--border-color, #e2e8f0)',
    borderRadius: 10,
  },
  textPrimary: {
    color: 'var(--text-primary, #0f172a)',
  },
  textMuted: {
    color: 'var(--text-muted, #64748b)',
  },
};

/**
 * Lightweight safe Markdown renderer for problem statement live preview
 */
function renderMarkdownPreview(md) {
  if (!md || !md.trim()) {
    return '<p style="color: var(--text-muted); font-style: italic; font-size: 13px;">No description provided yet. Use the Write tab to draft the problem statement.</p>';
  }
  let html = md
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Code blocks
    .replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, (_, lang, code) => {
      return `<pre style="margin: 12px 0; padding: 12px 14px; border-radius: 8px; background: var(--surface-dark); border: 1px solid var(--border-color); font-family: monospace; font-size: 12px; color: var(--text-primary); overflow-x: auto;"><code>${code.trim()}</code></pre>`;
    })
    // Inline code
    .replace(/`([^`]+)`/g, '<code style="padding: 2px 6px; border-radius: 4px; background: var(--surface-medium); color: var(--text-primary); font-family: monospace; font-size: 12px; border: 1px solid var(--border-color);">$1</code>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong style="font-weight: 700; color: var(--text-primary);">$1</strong>')
    // Italic
    .replace(/\*([^*]+)\*/g, '<em style="font-style: italic; color: var(--text-secondary);">$1</em>')
    // Headings
    .replace(/^### (.+)$/gm, '<h4 style="font-size: 14px; font-weight: 700; color: var(--text-primary); margin: 14px 0 6px;">$1</h4>')
    .replace(/^## (.+)$/gm, '<h3 style="font-size: 16px; font-weight: 700; color: var(--text-primary); margin: 18px 0 8px;">$1</h3>')
    .replace(/^# (.+)$/gm, '<h2 style="font-size: 18px; font-weight: 800; color: var(--text-primary); margin: 20px 0 10px;">$1</h2>')
    // Blockquote
    .replace(/^> (.+)$/gm, '<blockquote style="margin: 12px 0; padding: 6px 14px; border-left: 3px solid var(--color-primary-500, #2563eb); background: var(--surface-medium); font-size: 12px; color: var(--text-secondary); border-radius: 0 8px 8px 0;">$1</blockquote>')
    // Unordered lists
    .replace(/^[-*] (.+)$/gm, '<li style="color: var(--text-secondary); margin-left: 16px; list-style: disc; margin-top: 3px; margin-bottom: 3px;">$1</li>')
    // Ordered lists
    .replace(/^\d+\. (.+)$/gm, '<li style="color: var(--text-secondary); margin-left: 16px; list-style: decimal; margin-top: 3px; margin-bottom: 3px;">$1</li>')
    // Line breaks
    .replace(/\n/g, '<br/>');

  // Wrap lists
  html = html.replace(/((<li style="[^"]*list-disc[^"]*">.*?<\/li><br\/>?)+)/g, '<ul style="margin: 8px 0; padding: 0;">$1</ul>');
  html = html.replace(/((<li style="[^"]*list-decimal[^"]*">.*?<\/li><br\/>?)+)/g, '<ol style="margin: 8px 0; padding: 0;">$1</ol>');
  return html;
}

export const AdminQuestionForm = ({
  defaultValues = EMPTY_Q,
  sections = [],
  onSubmit,
  onCancel,
  submitLabel = 'Save Question',
  error = null,
}) => {
  const toast = useToast();
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [descTab, setDescTab] = useState('write'); // 'write' | 'preview'
  const [copiedKey, setCopiedKey] = useState(null);
  const [selectedCaseIndex, setSelectedCaseIndex] = useState(0);
  const [showAllOverview, setShowAllOverview] = useState(false);
  const descTextareaRef = useRef(null);

  const initialValues = useMemo(() => {
    const qType = defaultValues?.questionType || 'CODING';
    const isCoding = qType === 'CODING';
    return {
      ...EMPTY_Q,
      ...defaultValues,
      questionType: qType,
      title: defaultValues?.title || '',
      description: defaultValues?.description || '',
      compiler: defaultValues?.compiler || 'ALL',
      difficulty: defaultValues?.difficulty || 'MEDIUM',
      sectionId: defaultValues?.sectionId || '',
      inputFormat: defaultValues?.inputFormat || '',
      outputFormat: defaultValues?.outputFormat || '',
      constraints: defaultValues?.constraints || '',
      marks: defaultValues?.marks ?? 10,
      timeLimitMs: defaultValues?.timeLimitMs ?? 2000,
      memoryLimitMb: defaultValues?.memoryLimitMb ?? 256,
      testCases: isCoding
        ? (defaultValues?.testCases && defaultValues.testCases.length > 0
            ? defaultValues.testCases.map((tc) => ({
                ...tc,
                inputData: tc.inputData ?? '',
                expectedOutput: tc.expectedOutput ?? '',
                sample: Boolean(tc.sample),
                hidden: tc.hidden !== undefined ? Boolean(tc.hidden) : !tc.sample,
                weight: tc.weight ? Number(tc.weight) : 1,
              }))
            : EMPTY_Q.testCases)
        : [],
      options: !isCoding
        ? (defaultValues?.options && defaultValues.options.length > 0
            ? defaultValues.options
            : EMPTY_Q.options)
        : [],
    };
  }, [defaultValues]);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(questionSchema),
    values: initialValues,
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'testCases' });
  const {
    fields: optionFields,
    append: appendOption,
    remove: removeOption,
  } = useFieldArray({ control, name: 'options' });

  const questionType = watch('questionType') || 'CODING';
  const difficultyWatch = watch('difficulty') || 'MEDIUM';
  const testCasesWatch = watch('testCases') || [];
  const descriptionValue = watch('description') || '';

  // Ensure options exist when switching to MULTIPLE_CHOICE
  useEffect(() => {
    if (questionType === 'MULTIPLE_CHOICE' && optionFields.length === 0) {
      appendOption([
        { optionText: '', isCorrect: true, explanation: '' },
        { optionText: '', isCorrect: false, explanation: '' },
      ]);
    }
  }, [questionType, optionFields.length, appendOption]);

  // Keep selectedCaseIndex within bounds
  useEffect(() => {
    if (fields.length > 0 && selectedCaseIndex >= fields.length) {
      setSelectedCaseIndex(fields.length - 1);
    }
  }, [fields.length, selectedCaseIndex]);

  // Summary counts
  const visibleCasesCount = testCasesWatch.filter((tc) => Boolean(tc?.sample) && !tc?.hidden).length;
  const hiddenCasesCount = testCasesWatch.filter((tc) => !tc?.sample || Boolean(tc?.hidden)).length;

  const handleAddVisibleCase = () => {
    append({
      inputData: '',
      expectedOutput: '',
      sample: true,
      hidden: false,
      weight: 1,
    });
    setSelectedCaseIndex(fields.length);
    toast.success('Sample test case added');
  };

  const handleAddHiddenCase = () => {
    append({
      inputData: '',
      expectedOutput: '',
      sample: false,
      hidden: true,
      weight: 1,
    });
    setSelectedCaseIndex(fields.length);
    toast.success('Hidden test case added');
  };

  const handleAddMultipleHiddenCases = (count = 3) => {
    const newCases = Array.from({ length: count }, () => ({
      inputData: '',
      expectedOutput: '',
      sample: false,
      hidden: true,
      weight: 1,
    }));
    append(newCases);
    setSelectedCaseIndex(fields.length);
    toast.success(`Added ${count} hidden test cases`);
  };

  const handleDuplicateTestCase = (idx) => {
    const current = watch(`testCases.${idx}`);
    append({
      inputData: current?.inputData || '',
      expectedOutput: current?.expectedOutput || '',
      sample: Boolean(current?.sample),
      hidden: current?.hidden !== undefined ? Boolean(current.hidden) : true,
      weight: current?.weight ? Number(current.weight) : 1,
    });
    setSelectedCaseIndex(fields.length);
    toast.success('Test case duplicated');
  };

  const handleRemoveTestCase = (idx) => {
    remove(idx);
    if (selectedCaseIndex >= idx && selectedCaseIndex > 0) {
      setSelectedCaseIndex(selectedCaseIndex - 1);
    }
    toast.success('Test case removed');
  };

  const handleToggleVisibility = (idx) => {
    const isSample = Boolean(watch(`testCases.${idx}.sample`));
    const isHidden = watch(`testCases.${idx}.hidden`) !== undefined ? Boolean(watch(`testCases.${idx}.hidden`)) : !isSample;
    const nowSample = isHidden || !isSample;

    setValue(`testCases.${idx}.sample`, nowSample, { shouldValidate: true, shouldDirty: true });
    setValue(`testCases.${idx}.hidden`, !nowSample, { shouldValidate: true, shouldDirty: true });
    toast.success(nowSample ? 'Set as Visible Sample' : 'Set as Hidden (Graded Only)');
  };

  const handleCopyText = (key, text) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  // Helper to insert markdown in description textarea
  const insertDescMarkdown = (before, after = '', placeholder = '') => {
    const ta = descTextareaRef.current;
    const current = watch('description') || '';
    if (!ta) {
      setValue('description', current + before + placeholder + after, { shouldValidate: true, shouldDirty: true });
      return;
    }
    const start = ta.selectionStart ?? current.length;
    const end = ta.selectionEnd ?? current.length;
    const selected = current.substring(start, end);
    const text = selected || placeholder;
    const updated = current.substring(0, start) + before + text + after + current.substring(end);
    setValue('description', updated, { shouldValidate: true, shouldDirty: true });
    requestAnimationFrame(() => {
      ta.focus();
      const newPos = start + before.length + text.length + after.length;
      ta.setSelectionRange(newPos, newPos);
    });
  };

  // Helper to insert quick template into problem statement
  const insertTemplate = (templateType) => {
    const current = watch('description') || '';
    let snippet = '';
    if (templateType === 'example') {
      snippet = `\n\n### Example 1:\n- **Input:** \`nums = [2, 7, 11, 15], target = 9\`\n- **Output:** \`0 1\`\n- **Explanation:** \`nums[0] + nums[1] == 9\`, so indices are \`0 1\`.\n`;
    } else if (templateType === 'note') {
      snippet = `\n\n> **Note:** Assume each input has exactly one valid solution, and elements cannot be reused twice.\n`;
    } else if (templateType === 'followup') {
      snippet = `\n\n**Follow-up:** Can you design an algorithm with a time complexity better than O(n²)?\n`;
    }
    setValue('description', current + snippet, { shouldValidate: true, shouldDirty: true });
    toast.success('Template section added');
  };

  // Helper for quick constraint pills
  const appendConstraint = (chip) => {
    const current = watch('constraints') || '';
    const updated = current ? `${current}\n${chip}` : chip;
    setValue('constraints', updated, { shouldValidate: true, shouldDirty: true });
    toast.success(`Appended: ${chip}`);
  };

  // Helper for format chips
  const appendFormat = (field, text) => {
    const current = watch(field) || '';
    const updated = current ? `${current}\n${text}` : text;
    setValue(field, updated, { shouldValidate: true, shouldDirty: true });
  };

  const handleFormSubmit = (data) => {
    const isCoding = data.questionType === 'CODING';
    const payload = {
      ...data,
      compiler: data.compiler || 'ALL',
      description: data.description || '',
      testCases: isCoding
        ? (data.testCases || []).map((tc) => ({
            inputData: tc.inputData || '',
            expectedOutput: tc.expectedOutput || '',
            sample: Boolean(tc.sample),
            hidden: tc.hidden !== undefined ? Boolean(tc.hidden) : !tc.sample,
            weight: tc.weight ? Number(tc.weight) : 1,
          }))
        : [],
      options: !isCoding
        ? (data.options || []).map((opt, i) => ({
            optionText: opt.optionText || '',
            isCorrect: Boolean(opt.isCorrect),
            explanation: opt.explanation || '',
            orderIndex: i + 1,
          }))
        : [],
    };
    return onSubmit(payload);
  };

  const handleFormError = (formErrors) => {
    console.error('Question form validation errors:', formErrors);
    const findFirstMessage = (errObj) => {
      if (!errObj) return null;
      if (errObj.message) return errObj.message;
      for (const key of Object.keys(errObj)) {
        if (typeof errObj[key] === 'object') {
          const msg = findFirstMessage(errObj[key]);
          if (msg) return msg;
        }
      }
      return null;
    };
    const msg = findFirstMessage(formErrors) || 'Please check all required fields.';
    toast.error(`Cannot save: ${msg}`);
  };

  const descRegister = register('description');

  return (
    <>
      <form onSubmit={handleSubmit(handleFormSubmit, handleFormError)} noValidate className="flex flex-col lg:flex-row gap-6 items-start font-sans">
      
        {/* ═══════════════════════════════════════════════════════════════════
            MAIN WORKSPACE (Left Column) — Theme-Aware Architecture (Light & Dark)
            ═══════════════════════════════════════════════════════════════════ */}
        <div className="flex-1 w-full space-y-5">
          
          {/* Error Alert */}
          {error && (
            <div className="mb-2">
              <Alert tone="error">{error?.response?.data?.message ?? error?.message}</Alert>
            </div>
          )}

          {/* ── 1. Question Title Banner ── */}
          <div 
            style={S.card}
            className="p-4 shadow-sm transition-colors focus-within:border-[var(--text-muted)]"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div 
                  style={{ background: 'var(--surface-medium)', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}
                  className="w-5 h-5 rounded flex items-center justify-center text-xs font-bold"
                >
                  <Sparkles size={11} />
                </div>
                <span style={{ color: 'var(--text-muted)' }} className="text-[11px] font-semibold uppercase tracking-wider">
                  Question Title
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <span 
                  style={{ background: 'var(--surface-medium)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
                  className="text-[11px] font-medium px-2 py-0.5 rounded"
                >
                  {difficultyWatch}
                </span>
                <span 
                  style={{ background: 'var(--surface-medium)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
                  className="text-[11px] font-medium px-2 py-0.5 rounded"
                >
                  {questionType === 'CODING' ? 'Coding' : 'MCQ'}
                </span>
                <span style={{ color: 'var(--text-muted)' }} className="text-[11px] font-mono">
                  {(watch('title') || '').length}/500
                </span>
              </div>
            </div>

            <input
              style={{ color: 'var(--text-primary)' }}
              className="w-full bg-transparent text-lg font-bold placeholder:opacity-40 outline-none border-none p-0 focus:ring-0 tracking-tight"
              placeholder="e.g. Two Sum Target Finder..."
              {...register('title')}
            />
            {errors.title && (
              <span className="text-xs text-red-500 font-medium flex items-center gap-1 mt-2">
                <AlertCircle size={12} /> {errors.title.message}
              </span>
            )}
          </div>

          {/* ── 2. Problem Statement / Question Prompt Card ── */}
          <div style={S.card} className="shadow-sm overflow-hidden">
            {/* Header with Mode Switcher (Write vs Preview) */}
            <div style={S.cardHeader} className="px-4 py-3 flex flex-wrap justify-between items-center gap-3">
              <div className="flex items-center gap-2">
                {questionType === 'MULTIPLE_CHOICE' ? (
                  <ListFilter size={15} style={{ color: 'var(--text-muted)' }} />
                ) : (
                  <Code2 size={15} style={{ color: 'var(--text-muted)' }} />
                )}
                <h3 style={{ color: 'var(--text-primary)' }} className="text-xs font-semibold uppercase tracking-wider">
                  {questionType === 'MULTIPLE_CHOICE' ? 'Question Prompt' : 'Problem Statement'}
                </h3>
                <span style={{ color: 'var(--text-muted)' }} className="text-[11px] font-mono">
                  {descriptionValue.length} chars
                </span>
              </div>

              {/* Segmented Write / Preview Toggle */}
              <div 
                style={{ background: 'var(--surface-dark)', border: '1px solid var(--border-color)' }}
                className="flex items-center gap-1 p-0.5 rounded-lg"
              >
                <button
                  type="button"
                  onClick={() => setDescTab('write')}
                  style={{
                    background: descTab === 'write' ? 'var(--text-primary)' : 'transparent',
                    color: descTab === 'write' ? 'var(--background)' : 'var(--text-muted)',
                  }}
                  className="px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer"
                >
                  Write
                </button>
                <button
                  type="button"
                  onClick={() => setDescTab('preview')}
                  style={{
                    background: descTab === 'preview' ? 'var(--text-primary)' : 'transparent',
                    color: descTab === 'preview' ? 'var(--background)' : 'var(--text-muted)',
                  }}
                  className="px-2.5 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Eye size={12} /> Preview
                </button>
              </div>
            </div>

            {/* Formatting Toolbar (Only in Write Mode) */}
            {descTab === 'write' && (
              <div 
                style={{ background: 'var(--surface-medium)', borderBottom: '1px solid var(--border-color)' }}
                className="px-4 py-1.5 flex flex-wrap items-center justify-between gap-2"
              >
                {/* Text Formatting Shortcuts */}
                <div className="flex items-center gap-1">
                  {[
                    { icon: Bold, title: 'Bold', action: () => insertDescMarkdown('**', '**', 'bold text') },
                    { icon: Italic, title: 'Italic', action: () => insertDescMarkdown('*', '*', 'italic text') },
                    { label: '</>', title: 'Inline Code', action: () => insertDescMarkdown('`', '`', 'code') },
                    { icon: Braces, title: 'Code Block', action: () => insertDescMarkdown('\n```java\n', '\n```\n', '// code here') },
                    { icon: List, title: 'Bulleted List', action: () => insertDescMarkdown('\n- ', '', 'List item') },
                    { icon: Quote, title: 'Quote', action: () => insertDescMarkdown('\n> ', '', 'Important note') },
                  ].map((btn, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={btn.action}
                      style={{ color: 'var(--text-muted)' }}
                      className="p-1.5 rounded hover:bg-[var(--hover-bg)] hover:text-[var(--text-primary)] transition-colors text-xs font-mono"
                      title={btn.title}
                    >
                      {btn.icon ? <btn.icon size={13} /> : btn.label}
                    </button>
                  ))}
                </div>

                {/* Quick Section Templates */}
                <div className="flex items-center gap-1.5">
                  <span style={{ color: 'var(--text-muted)' }} className="text-[11px] font-medium">Quick Add:</span>
                  {[
                    { label: '+ Example', type: 'example' },
                    { label: '+ Note', type: 'note' },
                    { label: '+ Follow-up', type: 'followup' },
                  ].map((t) => (
                    <button
                      key={t.type}
                      type="button"
                      onClick={() => insertTemplate(t.type)}
                      style={{
                        background: 'var(--surface-dark)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-secondary)',
                      }}
                      className="px-2 py-0.5 text-[11px] rounded hover:bg-[var(--hover-bg)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Problem Statement Body */}
            <div className="p-4">
              {descTab === 'write' ? (
                <div>
                  <textarea
                    rows={6}
                    placeholder={
                      questionType === 'MULTIPLE_CHOICE'
                        ? 'Write the question prompt or problem clearly using Markdown...'
                        : 'Describe the problem clearly. Include examples, expected behavior, and definitions.'
                    }
                    style={{
                      background: 'var(--surface-dark)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)',
                    }}
                    className="w-full rounded-lg px-3 py-2.5 text-xs focus:outline-none focus:border-[var(--text-muted)] font-sans leading-relaxed resize-y placeholder:opacity-40"
                    {...descRegister}
                    ref={(e) => {
                      descRegister.ref(e);
                      descTextareaRef.current = e;
                    }}
                  />
                  {errors.description && (
                    <p className="text-xs text-red-500 font-medium flex items-center gap-1 mt-2">
                      <AlertCircle size={12} /> {errors.description.message}
                    </p>
                  )}
                </div>
              ) : (
                <div 
                  style={{
                    background: 'var(--surface-medium)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                  }}
                  className="min-h-[140px] rounded-lg p-3.5 text-xs leading-relaxed overflow-y-auto max-h-[300px]"
                  dangerouslySetInnerHTML={{ __html: renderMarkdownPreview(descriptionValue) }}
                />
              )}

              {/* Coding Question Specific Sub-Sections: Input/Output Formats & Constraints */}
              {questionType === 'CODING' && (
                <div style={{ borderTop: '1px solid var(--border-color)' }} className="mt-4 space-y-3 pt-3.5">
                  {/* Two-Column Specification: Input & Output */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Input Format */}
                    <div 
                      style={{ background: 'var(--surface-medium)', border: '1px solid var(--border-color)' }}
                      className="rounded-xl p-3 space-y-1.5"
                    >
                      <div className="flex justify-between items-center">
                        <span style={{ color: 'var(--text-primary)' }} className="text-xs font-semibold flex items-center gap-1.5">
                          <Terminal size={13} style={{ color: 'var(--text-muted)' }} /> Input Format
                        </span>
                        <button
                          type="button"
                          onClick={() => appendFormat('inputFormat', 'First line contains space-separated integers for nums. Second line contains target integer.')}
                          style={{ color: 'var(--text-muted)' }}
                          className="text-[10px] hover:text-[var(--text-primary)] cursor-pointer"
                        >
                          + Standard
                        </button>
                      </div>
                      <textarea
                        rows={2}
                        placeholder="Describe expected input (e.g. First line: integer N...)"
                        style={{
                          background: 'var(--surface-dark)',
                          border: '1px solid var(--border-color)',
                          color: 'var(--text-primary)',
                        }}
                        className="w-full rounded-lg px-2.5 py-1.5 text-xs font-mono focus:outline-none resize-y placeholder:opacity-40"
                        {...register('inputFormat')}
                      />
                      {errors.inputFormat && (
                        <p className="text-xs text-red-500">{errors.inputFormat.message}</p>
                      )}
                    </div>

                    {/* Output Format */}
                    <div 
                      style={{ background: 'var(--surface-medium)', border: '1px solid var(--border-color)' }}
                      className="rounded-xl p-3 space-y-1.5"
                    >
                      <div className="flex justify-between items-center">
                        <span style={{ color: 'var(--text-primary)' }} className="text-xs font-semibold flex items-center gap-1.5">
                          <FileCode size={13} style={{ color: 'var(--text-muted)' }} /> Output Format
                        </span>
                        <button
                          type="button"
                          onClick={() => appendFormat('outputFormat', 'Space-separated pair of indices (e.g. "0 1").')}
                          style={{ color: 'var(--text-muted)' }}
                          className="text-[10px] hover:text-[var(--text-primary)] cursor-pointer"
                        >
                          + Standard
                        </button>
                      </div>
                      <textarea
                        rows={2}
                        placeholder="Describe expected output (e.g. Space-separated indices...)"
                        style={{
                          background: 'var(--surface-dark)',
                          border: '1px solid var(--border-color)',
                          color: 'var(--text-primary)',
                        }}
                        className="w-full rounded-lg px-2.5 py-1.5 text-xs font-mono focus:outline-none resize-y placeholder:opacity-40"
                        {...register('outputFormat')}
                      />
                      {errors.outputFormat && (
                        <p className="text-xs text-red-500">{errors.outputFormat.message}</p>
                      )}
                    </div>
                  </div>

                  {/* Constraints & Boundaries */}
                  <div 
                    style={{ background: 'var(--surface-medium)', border: '1px solid var(--border-color)' }}
                    className="rounded-xl p-3 space-y-1.5"
                  >
                    <div className="flex flex-wrap justify-between items-center gap-2">
                      <span style={{ color: 'var(--text-primary)' }} className="text-xs font-semibold flex items-center gap-1.5">
                        <Sliders size={13} style={{ color: 'var(--text-muted)' }} /> Constraints
                      </span>
                      {/* Quick Chips for Common Constraints */}
                      <div className="flex flex-wrap items-center gap-1">
                        <span style={{ color: 'var(--text-muted)' }} className="text-[10px] font-medium">Quick Add:</span>
                        {[
                          '2 <= nums.length <= 10^4',
                          '-10^9 <= nums[i] <= 10^9',
                          'Time: 2.0s',
                          'Memory: 256MB',
                        ].map((chip) => (
                          <button
                            key={chip}
                            type="button"
                            onClick={() => appendConstraint(chip)}
                            style={{
                              background: 'var(--surface-dark)',
                              border: '1px solid var(--border-color)',
                              color: 'var(--text-secondary)',
                            }}
                            className="text-[10px] px-1.5 py-0.5 rounded hover:bg-[var(--hover-bg)] font-mono transition-colors cursor-pointer"
                          >
                            + {chip}
                          </button>
                        ))}
                      </div>
                    </div>
                    <textarea
                      rows={2}
                      placeholder="e.g. 2 <= nums.length <= 10^4&#10;-10^9 <= nums[i] <= 10^9"
                      style={{
                        background: 'var(--surface-dark)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-primary)',
                      }}
                      className="w-full rounded-lg px-2.5 py-1.5 text-xs font-mono focus:outline-none resize-y placeholder:opacity-40"
                      {...register('constraints')}
                    />
                    {errors.constraints && (
                      <p className="text-xs text-red-500">{errors.constraints.message}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── 3. Multiple Choice Options Card (Only when MULTIPLE_CHOICE) ── */}
          {questionType === 'MULTIPLE_CHOICE' && (
            <div style={S.card} className="shadow-sm overflow-hidden">
              <div style={S.cardHeader} className="px-4 py-3 flex justify-between items-center">
                <div>
                  <h3 style={{ color: 'var(--text-primary)' }} className="text-xs font-semibold uppercase tracking-wider flex items-center gap-2">
                    <CheckCircle2 size={15} style={{ color: 'var(--text-muted)' }} /> Answer Options
                  </h3>
                  <p style={{ color: 'var(--text-muted)' }} className="text-[11px] mt-0.5">
                    Click an option letter to set it as the correct answer.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => appendOption({ ...EMPTY_OPTION })}
                  style={{
                    background: 'var(--surface-dark)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                  }}
                  className="text-xs font-medium px-2.5 py-1 rounded-md hover:bg-[var(--hover-bg)] transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Plus size={13} /> Add Option
                </button>
              </div>

              <div className="p-4 space-y-3">
                {errors.options?.message && (
                  <div className="p-2.5 rounded-lg bg-red-950/30 border border-red-900/40 text-red-500 text-xs font-medium flex items-center gap-1.5">
                    <AlertCircle size={13} /> {errors.options.message}
                  </div>
                )}

                {optionFields.map((field, index) => {
                  const isCorrect = watch(`options.${index}.isCorrect`);
                  const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
                  const letter = letters[index] || `#${index + 1}`;

                  return (
                    <div
                      key={field.id}
                      style={{
                        background: isCorrect ? 'var(--surface-medium)' : 'var(--surface-dark)',
                        border: isCorrect ? '1.5px solid var(--color-primary-500, #2563eb)' : '1px solid var(--border-color)',
                      }}
                      className="relative rounded-xl p-3 transition-colors shadow-sm"
                    >
                      <div className="flex items-start gap-3">
                        {/* Correct Answer Checkbox Badge */}
                        <label
                          style={{
                            background: isCorrect ? 'var(--color-primary-500, #2563eb)' : 'var(--surface-medium)',
                            color: isCorrect ? '#ffffff' : 'var(--text-muted)',
                            border: isCorrect ? '1px solid var(--color-primary-500, #2563eb)' : '1px solid var(--border-color)',
                          }}
                          className="mt-1 flex items-center justify-center w-7 h-7 rounded-lg cursor-pointer transition-colors font-bold text-xs select-none shrink-0"
                          title={isCorrect ? 'Correct answer (click to unmark)' : 'Mark as correct answer'}
                        >
                          <input
                            type="checkbox"
                            className="sr-only"
                            {...register(`options.${index}.isCorrect`)}
                          />
                          {letter}
                        </label>

                        {/* Option Text & Explanation */}
                        <div className="flex-1 space-y-2">
                          <Input
                            placeholder={`Option ${letter} text...`}
                            error={errors.options?.[index]?.optionText?.message}
                            {...register(`options.${index}.optionText`)}
                          />
                          <Input
                            placeholder="Explanation (optional)"
                            {...register(`options.${index}.explanation`)}
                          />
                        </div>

                        {/* Remove Option Button */}
                        {optionFields.length > 2 && (
                          <button
                            type="button"
                            onClick={() => removeOption(index)}
                            style={{ color: 'var(--text-muted)' }}
                            className="hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-red-500/10 shrink-0 mt-1 cursor-pointer"
                            title="Remove option"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              ── 4. LEETCODE-STYLE TABBED TEST CASES SUITE (Theme Adaptive) ──
              ═══════════════════════════════════════════════════════════════════ */}
          {questionType === 'CODING' && (
            <div style={S.card} className="shadow-sm overflow-hidden">
              {/* Header Bar */}
              <div style={S.cardHeader} className="px-4 py-3 flex flex-wrap justify-between items-center gap-3">
                <div className="flex items-center gap-2.5">
                  <div 
                    style={{ background: 'var(--surface-dark)', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}
                    className="w-6 h-6 rounded flex items-center justify-center"
                  >
                    <Terminal size={13} />
                  </div>
                  <div>
                    <h3 style={{ color: 'var(--text-primary)' }} className="text-xs font-semibold uppercase tracking-wider">
                      Test Cases Suite
                    </h3>
                    <p style={{ color: 'var(--text-muted)' }} className="text-[11px]">
                      {fields.length} Cases ({visibleCasesCount} Visible Sample · {hiddenCasesCount} Graded Hidden)
                    </p>
                  </div>
                </div>

                {/* Quick Action Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAllOverview(!showAllOverview)}
                    style={{
                      background: showAllOverview ? 'var(--text-primary)' : 'var(--surface-dark)',
                      color: showAllOverview ? 'var(--background)' : 'var(--text-secondary)',
                      border: '1px solid var(--border-color)',
                    }}
                    className="text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                    title="Toggle all cases table overview"
                  >
                    <Table size={13} /> {showAllOverview ? 'Hide Overview' : 'View All Table'}
                  </button>
                  <button
                    type="button"
                    onClick={handleAddVisibleCase}
                    style={{
                      background: 'var(--surface-dark)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)',
                    }}
                    className="text-xs font-medium px-2.5 py-1.5 rounded-lg hover:bg-[var(--hover-bg)] transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={12} /> Add Sample
                  </button>
                  <button
                    type="button"
                    onClick={handleAddHiddenCase}
                    style={{
                      background: 'var(--surface-dark)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)',
                    }}
                    className="text-xs font-medium px-2.5 py-1.5 rounded-lg hover:bg-[var(--hover-bg)] transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={12} /> Add Hidden
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddMultipleHiddenCases(3)}
                    style={{
                      background: 'var(--surface-medium)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-secondary)',
                    }}
                    className="text-[11px] font-medium px-2 py-1.5 rounded-lg hover:bg-[var(--hover-bg)] transition-colors cursor-pointer"
                    title="Batch add 3 hidden cases"
                  >
                    +3 Hidden
                  </button>
                </div>
              </div>

              {/* Error Message if any */}
              {errors.testCases?.message && (
                <div className="mx-4 mt-3 p-2.5 rounded-lg bg-red-950/30 border border-red-900/40 text-red-500 text-xs font-medium flex items-center gap-1.5">
                  <AlertCircle size={13} /> {errors.testCases.message}
                </div>
              )}

              {/* ── All Cases Overview Table (When toggled) ── */}
              {showAllOverview && (
                <div 
                  style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--surface-medium)' }}
                  className="p-4"
                >
                  <div 
                    style={{ border: '1px solid var(--border-color)', background: 'var(--surface-dark)' }}
                    className="overflow-x-auto rounded-lg"
                  >
                    <table className="w-full text-left text-xs font-mono">
                      <thead 
                        style={{ background: 'var(--surface-medium)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}
                        className="text-[11px]"
                      >
                        <tr>
                          <th className="py-2 px-3 font-semibold">Case</th>
                          <th className="py-2 px-3 font-semibold">Type</th>
                          <th className="py-2 px-3 font-semibold">Weight</th>
                          <th className="py-2 px-3 font-semibold">Input (stdin)</th>
                          <th className="py-2 px-3 font-semibold">Expected (stdout)</th>
                          <th className="py-2 px-3 text-right font-semibold">Action</th>
                        </tr>
                      </thead>
                      <tbody style={{ color: 'var(--text-primary)' }} className="divide-y divide-[var(--border-color)]">
                        {fields.map((f, i) => {
                          const isSample = Boolean(testCasesWatch[i]?.sample);
                          const isHidden = testCasesWatch[i]?.hidden !== undefined ? Boolean(testCasesWatch[i]?.hidden) : !isSample;
                          const inVal = testCasesWatch[i]?.inputData || '(empty)';
                          const outVal = testCasesWatch[i]?.expectedOutput || '(empty)';
                          const weightVal = testCasesWatch[i]?.weight || 1;
                          return (
                            <tr
                              key={f.id}
                              onClick={() => { setSelectedCaseIndex(i); setShowAllOverview(false); }}
                              style={{
                                background: selectedCaseIndex === i ? 'var(--hover-bg)' : 'transparent',
                              }}
                              className="cursor-pointer transition-colors hover:bg-[var(--hover-bg)]"
                            >
                              <td className="py-2 px-3 font-bold">#{i + 1}</td>
                              <td className="py-2 px-3">
                                <span 
                                  style={{
                                    background: isSample && !isHidden ? 'var(--surface-medium)' : 'var(--surface-dark)',
                                    color: 'var(--text-secondary)',
                                    border: '1px solid var(--border-color)',
                                  }}
                                  className="px-2 py-0.5 rounded text-[10px] font-semibold"
                                >
                                  {isSample && !isHidden ? 'Sample' : 'Hidden'}
                                </span>
                              </td>
                              <td style={{ color: 'var(--text-muted)' }} className="py-2 px-3">{weightVal} pt</td>
                              <td style={{ color: 'var(--text-muted)' }} className="py-2 px-3 max-w-[140px] truncate">{inVal}</td>
                              <td className="py-2 px-3 max-w-[140px] truncate font-bold">{outVal}</td>
                              <td className="py-2 px-3 text-right">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedCaseIndex(i);
                                    setShowAllOverview(false);
                                  }}
                                  style={{ color: 'var(--color-primary-500, #2563eb)' }}
                                  className="text-[11px] hover:underline cursor-pointer"
                                >
                                  Edit
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ── Compact Tab Selector Bar (LeetCode Style) ── */}
              <div 
                style={{ background: 'var(--surface-medium)', borderBottom: '1px solid var(--border-color)' }}
                className="px-4 py-2.5 flex items-center justify-between gap-3 overflow-x-auto"
              >
                <div className="flex items-center gap-1.5 min-w-max">
                  {fields.map((field, idx) => {
                    const isSample = Boolean(testCasesWatch[idx]?.sample);
                    const isHidden = testCasesWatch[idx]?.hidden !== undefined ? Boolean(testCasesWatch[idx]?.hidden) : !isSample;
                    const isSelected = selectedCaseIndex === idx;
                    const hasError = Boolean(errors.testCases?.[idx]);

                    return (
                      <button
                        key={field.id}
                        type="button"
                        onClick={() => setSelectedCaseIndex(idx)}
                        style={{
                          background: isSelected ? 'var(--text-primary)' : 'var(--surface-dark)',
                          color: isSelected ? 'var(--background)' : 'var(--text-secondary)',
                          border: isSelected ? '1px solid var(--text-primary)' : '1px solid var(--border-color)',
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 transition-all cursor-pointer shadow-sm"
                      >
                        <span 
                          style={{
                            background: hasError 
                              ? '#ef4444' 
                              : isSample && !isHidden 
                                ? (isSelected ? 'var(--background)' : '#2563eb')
                                : (isSelected ? 'var(--background)' : 'var(--text-muted)'),
                          }}
                          className="w-1.5 h-1.5 rounded-full" 
                        />
                        <span className="font-semibold">Case {idx + 1}</span>
                        <span 
                          style={{
                            opacity: isSelected ? 0.8 : 0.6,
                          }}
                          className="text-[10px] font-mono"
                        >
                          {isSample && !isHidden ? 'Sample' : 'Hidden'}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Inline Quick Add Buttons */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={handleAddVisibleCase}
                    style={{
                      background: 'var(--surface-dark)',
                      border: '1px dashed var(--border-color)',
                      color: 'var(--text-muted)',
                    }}
                    className="p-1.5 rounded-md hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)] transition-colors cursor-pointer"
                    title="Add Sample Test Case"
                  >
                    <Plus size={13} />
                  </button>
                </div>
              </div>

              {/* ── Active Case Focused Workspace ── */}
              {fields.length === 0 ? (
                <div style={{ background: 'var(--surface-medium)' }} className="p-8 text-center">
                  <Terminal size={24} style={{ color: 'var(--text-muted)' }} className="mx-auto mb-2" />
                  <p style={{ color: 'var(--text-primary)' }} className="text-xs font-medium">No test cases configured yet.</p>
                  <p style={{ color: 'var(--text-muted)' }} className="text-[11px] mt-1 mb-3">Add at least one sample test case for student evaluation.</p>
                  <button
                    type="button"
                    onClick={handleAddVisibleCase}
                    style={{
                      background: 'var(--surface-dark)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)',
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-[var(--hover-bg)] cursor-pointer"
                  >
                    + Add First Test Case
                  </button>
                </div>
              ) : (
                <div className="p-4">
                  {fields.map((field, idx) => {
                    const isSelected = selectedCaseIndex === idx;
                    const isSample = Boolean(testCasesWatch[idx]?.sample);
                    const isHidden = testCasesWatch[idx]?.hidden !== undefined ? Boolean(testCasesWatch[idx]?.hidden) : !isSample;
                    const inputVal = watch(`testCases.${idx}.inputData`) || '';
                    const outputVal = watch(`testCases.${idx}.expectedOutput`) || '';
                    const currentWeight = watch(`testCases.${idx}.weight`) ?? 1;

                    const inputCopyKey = `tc-${idx}-in`;
                    const outputCopyKey = `tc-${idx}-out`;

                    return (
                      <div
                        key={field.id}
                        className={isSelected ? 'block space-y-4' : 'hidden'}
                      >
                        {/* Active Case Top Control Toolbar */}
                        <div 
                          style={{ borderBottom: '1px solid var(--border-color)' }}
                          className="flex flex-wrap items-center justify-between gap-3 pb-3"
                        >
                          <div className="flex items-center gap-2.5">
                            <span style={{ color: 'var(--text-primary)' }} className="text-xs font-bold uppercase tracking-wider">
                              Editing Case #{idx + 1}
                            </span>
                            <span 
                              style={{
                                background: 'var(--surface-medium)',
                                border: '1px solid var(--border-color)',
                                color: 'var(--text-secondary)',
                              }}
                              className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold flex items-center gap-1.5"
                            >
                              <span 
                                style={{ background: isSample && !isHidden ? '#2563eb' : 'var(--text-muted)' }}
                                className="w-1.5 h-1.5 rounded-full" 
                              />
                              {isSample && !isHidden ? 'Visible Sample (Shown to Students)' : 'Hidden (Secret Graded Suite)'}
                            </span>
                          </div>

                          {/* Quick Action Controls */}
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleToggleVisibility(idx)}
                              style={{
                                background: 'var(--surface-dark)',
                                border: '1px solid var(--border-color)',
                                color: 'var(--text-primary)',
                              }}
                              className="text-xs font-medium hover:bg-[var(--hover-bg)] flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors cursor-pointer"
                            >
                              {isSample && !isHidden ? (
                                <>
                                  Make Hidden <ArrowRight size={11} />
                                </>
                              ) : (
                                <>
                                  <ArrowLeft size={11} /> Make Sample
                                </>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDuplicateTestCase(idx)}
                              style={{
                                background: 'var(--surface-dark)',
                                border: '1px solid var(--border-color)',
                                color: 'var(--text-secondary)',
                              }}
                              className="text-xs font-medium hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)] flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors cursor-pointer"
                              title="Duplicate test case"
                            >
                              <Copy size={12} /> Duplicate
                            </button>
                            {fields.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveTestCase(idx)}
                                style={{
                                  background: 'rgba(239, 68, 68, 0.08)',
                                  border: '1px solid rgba(239, 68, 68, 0.25)',
                                  color: '#ef4444',
                                }}
                                className="text-xs font-medium hover:bg-red-500/20 flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors cursor-pointer"
                                title="Remove test case"
                              >
                                <Trash2 size={12} /> Remove
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Side-by-Side Dual Terminal Consoles */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* STDIN Console */}
                          <div 
                            style={{ border: '1px solid var(--border-color)', background: 'var(--surface-dark)' }}
                            className="rounded-xl overflow-hidden shadow-sm"
                          >
                            <div 
                              style={{ background: 'var(--surface-medium)', borderBottom: '1px solid var(--border-color)' }}
                              className="px-3.5 py-2 flex justify-between items-center text-xs"
                            >
                              <span style={{ color: 'var(--text-primary)' }} className="font-mono font-semibold flex items-center gap-1.5">
                                <Terminal size={13} style={{ color: 'var(--text-muted)' }} /> stdin (Input Data)
                              </span>
                              <div className="flex items-center gap-2">
                                <span style={{ color: 'var(--text-muted)' }} className="text-[10px] font-mono">
                                  {inputVal ? `${inputVal.split('\n').length} lines` : 'empty'}
                                </span>
                                {inputVal && (
                                  <button
                                    type="button"
                                    onClick={() => handleCopyText(inputCopyKey, inputVal)}
                                    style={{
                                      background: 'var(--surface-dark)',
                                      border: '1px solid var(--border-color)',
                                      color: 'var(--text-muted)',
                                    }}
                                    className="hover:text-[var(--text-primary)] flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded cursor-pointer transition-colors"
                                  >
                                    {copiedKey === inputCopyKey ? <Check size={10} className="text-emerald-500" /> : <Copy size={10} />}
                                    {copiedKey === inputCopyKey ? 'Copied' : 'Copy'}
                                  </button>
                                )}
                              </div>
                            </div>
                            <textarea
                              rows={5}
                              placeholder="Standard input data (e.g. 2 7 11 15&#10;9)"
                              style={{
                                background: 'var(--surface-dark)',
                                color: 'var(--text-primary)',
                              }}
                              className="w-full px-3.5 py-2.5 text-xs font-mono focus:outline-none resize-y border-none leading-relaxed placeholder:opacity-40"
                              {...register(`testCases.${idx}.inputData`)}
                            />
                          </div>

                          {/* STDOUT Console */}
                          <div 
                            style={{ border: '1px solid var(--border-color)', background: 'var(--surface-dark)' }}
                            className="rounded-xl overflow-hidden shadow-sm"
                          >
                            <div 
                              style={{ background: 'var(--surface-medium)', borderBottom: '1px solid var(--border-color)' }}
                              className="px-3.5 py-2 flex justify-between items-center text-xs"
                            >
                              <span style={{ color: 'var(--text-primary)' }} className="font-mono font-semibold flex items-center gap-1.5">
                                <FileCode size={13} style={{ color: 'var(--text-muted)' }} /> stdout (Expected Output) <span className="text-red-500">*</span>
                              </span>
                              {outputVal && (
                                <button
                                  type="button"
                                  onClick={() => handleCopyText(outputCopyKey, outputVal)}
                                  style={{
                                    background: 'var(--surface-dark)',
                                    border: '1px solid var(--border-color)',
                                    color: 'var(--text-muted)',
                                  }}
                                  className="hover:text-[var(--text-primary)] flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded cursor-pointer transition-colors"
                                >
                                  {copiedKey === outputCopyKey ? <Check size={10} className="text-emerald-500" /> : <Copy size={10} />}
                                  {copiedKey === outputCopyKey ? 'Copied' : 'Copy'}
                                </button>
                              )}
                            </div>
                            <textarea
                              rows={5}
                              placeholder="Exact expected standard output (e.g. 0 1)"
                              style={{
                                background: 'var(--surface-dark)',
                                color: 'var(--text-primary)',
                              }}
                              className="w-full px-3.5 py-2.5 text-xs font-mono focus:outline-none resize-y border-none leading-relaxed placeholder:opacity-40"
                              {...register(`testCases.${idx}.expectedOutput`)}
                            />
                          </div>
                        </div>

                        {errors.testCases?.[idx]?.expectedOutput && (
                          <p className="text-xs text-red-500 flex items-center gap-1">
                            <AlertCircle size={12} /> {errors.testCases[idx].expectedOutput.message}
                          </p>
                        )}

                        {/* Bottom Meta & Points Weight Configuration */}
                        <div 
                          style={{ border: '1px solid var(--border-color)', background: 'var(--surface-medium)' }}
                          className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl text-xs"
                        >
                          <span style={{ color: 'var(--text-muted)' }} className="text-xs flex items-center gap-2">
                            {isSample && !isHidden ? (
                              <>
                                <Eye size={13} />
                                <span>Students can see this test case and run test executions against it.</span>
                              </>
                            ) : (
                              <>
                                <EyeOff size={13} />
                                <span>Secret test case evaluated only upon final submission scoring.</span>
                              </>
                            )}
                          </span>

                          <div className="flex items-center gap-2">
                            <span style={{ color: 'var(--text-muted)' }} className="text-xs font-medium uppercase tracking-wider">
                              Points Weight:
                            </span>
                            <div 
                              style={{ background: 'var(--surface-dark)', border: '1px solid var(--border-color)' }}
                              className="flex items-center gap-1 rounded-lg p-0.5"
                            >
                              {[1, 2, 5].map((pts) => (
                                <button
                                  key={pts}
                                  type="button"
                                  onClick={() => setValue(`testCases.${idx}.weight`, pts, { shouldValidate: true, shouldDirty: true })}
                                  style={{
                                    background: Number(currentWeight) === pts ? 'var(--text-primary)' : 'transparent',
                                    color: Number(currentWeight) === pts ? 'var(--background)' : 'var(--text-muted)',
                                  }}
                                  className="px-2 py-0.5 text-xs rounded font-semibold transition-colors cursor-pointer"
                                >
                                  {pts} pt{pts > 1 ? 's' : ''}
                                </button>
                              ))}
                              <div className="w-12">
                                <input
                                  type="number"
                                  min={1}
                                  style={{ color: 'var(--text-primary)' }}
                                  className="w-full bg-transparent px-1 text-center text-xs font-mono focus:outline-none border-none"
                                  {...register(`testCases.${idx}.weight`)}
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            RIGHT SIDE BAR / CONTAINER — Preserved and Untouched as Instructed
            ═══════════════════════════════════════════════════════════════════ */}
        <div className="w-full lg:w-80 flex flex-col gap-6 lg:sticky lg:top-6">
          
          {/* Actions Card */}
          <div style={S.card} className="p-5 shadow-sm flex flex-col gap-3">
            <Button type="submit" isLoading={isSubmitting} className="w-full justify-center text-base py-2.5">
              {submitLabel}
            </Button>
            <button
              type="button"
              onClick={() => setShowPreviewModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '10px 16px',
                borderRadius: 8,
                border: '1px solid rgba(99, 102, 241, 0.4)',
                background: 'rgba(99, 102, 241, 0.1)',
                color: '#6366f1',
                fontWeight: 600,
                fontSize: 14,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(99, 102, 241, 0.2)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)'; }}
            >
              <Eye size={16} />
              <span>Preview & Test</span>
            </button>
            {onCancel && (
              <button 
                type="button" 
                onClick={onCancel} 
                style={S.textMuted}
                className="w-full justify-center py-2 text-sm font-semibold hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)] rounded-lg transition-colors border border-transparent hover:border-[var(--border-color)] cursor-pointer"
              >
                Cancel
              </button>
            )}
          </div>

          {/* Configuration Card */}
          <div style={S.card} className="shadow-sm overflow-hidden">
            <div style={S.cardHeader} className="px-5 py-4">
              <h3 style={S.textPrimary} className="text-sm font-semibold flex items-center gap-2 uppercase tracking-wider">
                <Settings size={16} className="text-blue-500" /> Configuration
              </h3>
            </div>
            <div className="p-5 space-y-5">
              <Select
                label="Question Type"
                options={QUESTION_TYPE_OPTIONS}
                error={errors.questionType?.message}
                {...register('questionType')}
              />
              <Select
                label="Difficulty"
                options={DIFFICULTY_OPTIONS}
                error={errors.difficulty?.message}
                {...register('difficulty')}
              />
              {sections && sections.length > 0 && (
                <Select
                  label="Section"
                  options={[
                    { value: '', label: 'None (Unsectioned)' },
                    ...sections.map(s => ({ value: s.id, label: s.title }))
                  ]}
                  error={errors.sectionId?.message}
                  {...register('sectionId')}
                />
              )}
              <Input
                label="Marks"
                type="number"
                min={1}
                max={100}
                hint="1–100 points"
                error={errors.marks?.message}
                {...register('marks')}
              />

              {questionType === 'CODING' && (
                <>
                  <div style={{ background: 'var(--border-color)' }} className="h-px w-full my-1" />
                  <Select
                    label="Compiler / Language Engine"
                    options={COMPILER_OPTIONS}
                    error={errors.compiler?.message}
                    {...register('compiler')}
                  />
                  <Input
                    label="Time Limit"
                    type="number"
                    min={100}
                    max={10000}
                    hint="100–10000 ms"
                    error={errors.timeLimitMs?.message}
                    {...register('timeLimitMs')}
                  />
                  <Input
                    label="Memory Limit"
                    type="number"
                    min={16}
                    max={1024}
                    hint="16–1024 MB"
                    error={errors.memoryLimitMb?.message}
                    {...register('memoryLimitMb')}
                  />
                </>
              )}
            </div>
          </div>

        </div>
      </form>

      <QuestionPreviewModal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        questionData={watch()}
      />
    </>
  );
};

export default AdminQuestionForm;
