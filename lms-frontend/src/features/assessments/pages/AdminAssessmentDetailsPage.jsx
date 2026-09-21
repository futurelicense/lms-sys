import { Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Clock, BarChart2, HelpCircle, Rocket, ArchiveIcon, XCircle,
  Edit2, Trash2, Plus, FileQuestion, Timer, Cpu, ChevronRight,
  Info, CheckCircle, RefreshCw, Eye, EyeOff, Database, Upload, Copy,
  CalendarClock, CalendarX2, AlarmClock, Zap, Hourglass, X,
  Trophy
} from 'lucide-react';
import { useState } from 'react';
import Spinner from '../../../components/common/Spinner';
import Alert from '../../../components/feedback/Alert';
import Button from '../../../components/common/Button';
import Badge from '../../../components/common/Badge';
import { AdminConfirmModal } from '../../../components/ui/AdminModal';
import AssessmentStatusBadge from '../components/AssessmentStatusBadge';
import AdminQuestionForm from '../components/AdminQuestionForm';
import ImportQuestionBankModal from '../components/ImportQuestionBankModal';
import ImportQuestionsFileModal from '../components/ImportQuestionsFileModal';
import adminAssessmentService from '../services/adminAssessmentService';
import { DIFFICULTY_TONE } from '../constants/assessmentConstants';
import {
  useAdminAssessment,
  useAdminAssessmentQuestions,
  usePublishAssessment,
  useUnpublishAssessment,
  useCloseAssessment,
  useArchiveAssessment,
  useAddQuestion,
  useUpdateQuestion,
  useRemoveQuestion,
  useDeleteAdminAssessment,
  useToggleResultAnalytics,
} from '../hooks/useAdminAssessments';
import {
  useAdminSections,
  useCreateSection,
  useUpdateSection,
  useDeleteSection,
  useAddQuestionToSection,
  useMoveQuestion,
} from '../hooks/useAdminSections';
import AssessmentAnalyticsTab from '../components/AssessmentAnalyticsTab';
import AssessmentLeaderboardTab from '../components/AssessmentLeaderboardTab';
import { useToast } from '../../../components/feedback/Toast';
import { ROUTES } from '../../../constants/routes';
import { formatDate } from '../../../utils/dateUtils';
import s from './AssessmentDetails.module.css';
import { useAssessmentTimeState } from '../hooks/useAssessmentTimeState';
import AssessmentTimePanel from '../components/AssessmentTimePanel';
import { useExtendAssessment } from '../hooks/useAdminAssessments';

export const AdminAssessmentDetailsPage = () => {
  const { assessmentId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const isInstructor = location.pathname.startsWith('/instructor');
  const listRoute = isInstructor ? ROUTES.ASSESSMENTS : ROUTES.ADMIN_ASSESSMENTS;
  const editRoute = (id) => isInstructor ? ROUTES.INSTRUCTOR_ASSESSMENT_EDIT(id) : ROUTES.ADMIN_ASSESSMENT_EDIT(id);

  const [activeTab, setActiveTab] = useState('questions'); // 'questions' | 'analytics'
  const [showForm, setShowForm] = useState(false);
  const [targetSectionId, setTargetSectionId] = useState(null); // which section to add a question to
  const [editingQuestion, setEditingQuestion] = useState(null); // question object being edited
  const [editingSection, setEditingSection] = useState(null); // section object being edited
  const [showSectionForm, setShowSectionForm] = useState(false); // for adding a new section
  const [showBankModal, setShowBankModal] = useState(false);
  const [showImportFileModal, setShowImportFileModal] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(null);

  const { data: a, isLoading, error } = useAdminAssessment(assessmentId);
  const { data: questions = [] } = useAdminAssessmentQuestions(assessmentId);
  const { data: sections = [] } = useAdminSections(assessmentId);

  const publish   = usePublishAssessment();
  const unpublish = useUnpublishAssessment();
  const closeA    = useCloseAssessment();
  const archive   = useArchiveAssessment();
  const addQ      = useAddQuestion(assessmentId);
  const addSectionQ = useAddQuestionToSection(assessmentId);
  const removeQ   = useRemoveQuestion(assessmentId);
  const deleteA   = useDeleteAdminAssessment();
  const toggleAnalytics = useToggleResultAnalytics(assessmentId);
  const extendAssessment = useExtendAssessment(assessmentId);

  const createSection = useCreateSection(assessmentId);
  const updateSection = useUpdateSection(assessmentId);
  const deleteSection = useDeleteSection(assessmentId);
  const moveQuestion  = useMoveQuestion(assessmentId);

  // useUpdateQuestion now only needs assessmentId; questionId is passed via mutateAsync payload
  const updateQ   = useUpdateQuestion(assessmentId);

  if (isLoading) return <Spinner fullPage />;
  if (error)     return <Alert tone="error">Failed to load assessment.</Alert>;

  const isDraft     = a.status === 'DRAFT';
  const isPublished = a.status === 'PUBLISHED';
  const canPublish  = isDraft && questions.length > 0;
  const canEditQuestions = isDraft || isPublished;

  const run = async (mutation, label, redirect = false) => {
    try {
      await mutation.mutateAsync(assessmentId);
      toast.success(label);
      if (redirect) navigate(ROUTES.ADMIN_ASSESSMENTS);
    } catch (e) {
      console.error('Action failed:', e);
      toast.error(e.message || 'An unexpected error occurred');
    }
  };

  const handleAddQuestion = async (values) => {
    try {
      if (isPublished) {
        setConfirmDialog({
          title: 'Unpublish to Add Question',
          message: `"${a?.title}" is currently PUBLISHED. Backend policy requires an assessment to be in DRAFT to add questions.\n\nWould you like to unpublish it now and add this question?`,
          confirmLabel: 'Unpublish & Continue',
          variant: 'primary',
          onConfirm: async () => {
            setConfirmDialog((prev) => ({ ...prev, loading: true }));
            try {
              await unpublish.mutateAsync(assessmentId);
              if (targetSectionId) {
                await addSectionQ.mutateAsync({ sectionId: targetSectionId, data: values });
              } else {
                await addQ.mutateAsync(values);
              }
              toast.success('Question added');
              setShowForm(false);
              setTargetSectionId(null);
              setConfirmDialog(null);
            } catch (e) {
              console.error('Question add failed:', e);
              toast.error(e?.response?.data?.message || e.message || 'Failed to add question');
              setConfirmDialog(null);
            }
          },
        });
        return;
      }
      if (targetSectionId) {
        await addSectionQ.mutateAsync({ sectionId: targetSectionId, data: values });
      } else {
        await addQ.mutateAsync(values); // This adds unsectioned
      }
      toast.success('Question added');
      setShowForm(false);
      setTargetSectionId(null);
    } catch (e) {
      console.error('Question add failed:', e);
      toast.error(e?.response?.data?.message || e.message || 'Failed to add question');
    }
  };

  const handleDuplicateAssessment = async () => {
    setIsDuplicating(true);
    try {
      const res = await adminAssessmentService.duplicate(assessmentId);
      toast.success('Assessment duplicated into DRAFT!');
      const newId = res.data?.data?.id || res.data?.id;
      if (newId) {
        navigate(isInstructor ? ROUTES.INSTRUCTOR_ASSESSMENT_DETAILS(newId) : ROUTES.ADMIN_ASSESSMENT_DETAILS(newId));
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to duplicate assessment');
    } finally {
      setIsDuplicating(false);
    }
  };

  const handleImportFileQuestions = async (importedList) => {
    let count = 0;
    for (const q of importedList) {
      try {
        if (targetSectionId) {
          await addSectionQ.mutateAsync({ sectionId: targetSectionId, data: q });
        } else {
          await addQ.mutateAsync(q);
        }
        count++;
      } catch (err) {
        console.error('Failed to import question into assessment:', err);
      }
    }
    toast.success(`Successfully imported ${count} of ${importedList.length} questions into this assessment.`);
  };

  const handleDeleteQuestion = (q) => {
    if (isPublished) {
      setConfirmDialog({
        title: 'Unpublish & Delete Question',
        message: `"${a?.title}" is currently PUBLISHED. Backend policy requires an assessment to be in DRAFT to delete questions.\n\nWould you like to unpublish it now and delete "${q.title}"?`,
        confirmLabel: 'Unpublish & Delete',
        variant: 'danger',
        onConfirm: async () => {
          setConfirmDialog((prev) => ({ ...prev, loading: true }));
          try {
            await unpublish.mutateAsync(assessmentId);
            await removeQ.mutateAsync(q.id);
            toast.success(`Assessment reverted to draft and "${q.title}" removed`);
            if (editingQuestion?.id === q.id) {
              setEditingQuestion(null);
            }
            setConfirmDialog(null);
          } catch (e) {
            toast.error(e?.response?.data?.message || e.message || 'Failed to remove question');
            setConfirmDialog(null);
          }
        },
      });
      return;
    }

    setConfirmDialog({
      title: 'Delete Question',
      message: `Are you sure you want to delete question "${q.title}"? This cannot be undone.`,
      confirmLabel: 'Delete Question',
      variant: 'danger',
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, loading: true }));
        try {
          await removeQ.mutateAsync(q.id);
          toast.success('Question deleted');
          if (editingQuestion?.id === q.id) {
            setEditingQuestion(null);
          }
          setConfirmDialog(null);
        } catch (e) {
          toast.error(e?.response?.data?.message || e.message || 'Failed to delete question');
          setConfirmDialog(null);
        }
      },
    });
  };

  const handleAddSection = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    try {
      await createSection.mutateAsync({
        title: formData.get('title'),
        description: formData.get('description') || '',
      });
      toast.success('Section added');
      setShowSectionForm(false);
    } catch (err) {
      toast.error(err.message || 'Failed to add section');
    }
  };

  const handleUpdateSection = async (e) => {
    e.preventDefault();
    if (!editingSection) return;
    const formData = new FormData(e.target);
    try {
      await updateSection.mutateAsync({
        sectionId: editingSection.id,
        data: {
          title: formData.get('title'),
          description: formData.get('description') || '',
        },
      });
      toast.success('Section updated');
      setEditingSection(null);
    } catch (err) {
      console.error('Update section failed:', err);
      toast.error(err.message || 'Failed to update section');
    }
  };

  const handleUpdateQuestion = async (values) => {
    try {
      await updateQ.mutateAsync({ questionId: editingQuestion.id, ...values });
      if (values.sectionId !== undefined && values.sectionId !== (editingQuestion.sectionId || '')) {
        await moveQuestion.mutateAsync({
          questionId: editingQuestion.id,
          sectionId: values.sectionId || null,
        });
      }
      toast.success('Question updated');
      setEditingQuestion(null);
    } catch (e) {
      console.error('Question update failed:', e);
      toast.error(e?.response?.data?.message || e.message || 'Failed to update question');
    }
  };

  const handleDelete = () => {
    setConfirmDialog({
      title: 'Delete Assessment',
      message: `Are you sure you want to permanently delete "${a?.title || 'this assessment'}"?\n\nAll questions, sections, and associated test configurations will be removed. This action cannot be undone.`,
      confirmLabel: 'Delete Assessment',
      variant: 'danger',
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, loading: true }));
        try {
          await deleteA.mutateAsync(assessmentId);
          toast.success('Assessment deleted successfully');
          setConfirmDialog(null);
          navigate(listRoute);
        } catch (e) {
          console.error('Delete failed:', e);
          toast.error(e.message || 'Failed to delete assessment');
          setConfirmDialog(null);
        }
      },
    });
  };

  return (
    <div className={s.page}>

      {/* ── Hero banner ──────────────────────────────────────── */}
      <div className={s.heroBanner}>
        <div className={s.heroLeft}>
          <div className={s.heroBreadcrumb}>
            <Link to={listRoute} className={s.heroBreadcrumbLink}>Assessments</Link>
            <ChevronRight size={12} />
            <span>{a.title}</span>
          </div>
          <h1 className={s.heroTitle}>{a.title}</h1>
          <div className={s.heroMeta}>
            <AssessmentStatusBadge status={a.status} />
            <span className={s.heroDate}>Last updated {formatDate(a.updatedAt)}</span>
          </div>
        </div>
        <div className={s.heroActions}>
          <button
            className={s.heroBtn}
            onClick={handleDuplicateAssessment}
            disabled={isDuplicating}
          >
            <Copy size={13} /> {isDuplicating ? 'Duplicating...' : 'Duplicate'}
          </button>
          {canEditQuestions && (
            <button className={s.heroBtn}
              onClick={() => navigate(editRoute(assessmentId))}>
              <Edit2 size={13} /> Edit
            </button>
          )}
          {isDraft && (
            <button className={`${s.heroBtn} ${s.heroBtnDanger}`}
              onClick={handleDelete} disabled={deleteA.isPending}>
              <Trash2 size={13} /> Delete
            </button>
          )}
        </div>
      </div>

      {/* ── Two-column body ──────────────────────────────────── */}
      <div className={s.body}>

        {/* ── LEFT: Content ──────────────────────────────── */}
        <div className={s.mainCol}>

          {/* ── Tab Header ── */}
          <div style={{ display: 'flex', gap: 16, borderBottom: '1px solid var(--border-color)', marginBottom: 20 }}>
            <button
              onClick={() => setActiveTab('questions')}
              style={{
                padding: '10px 16px',
                border: 'none',
                background: 'transparent',
                borderBottom: activeTab === 'questions' ? '2px solid var(--text-primary)' : '2px solid transparent',
                color: activeTab === 'questions' ? 'var(--text-primary)' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: 14,
                cursor: 'pointer'
              }}
            >
              Questions & Structure ({questions.length})
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              style={{
                padding: '10px 16px',
                border: 'none',
                background: 'transparent',
                borderBottom: activeTab === 'analytics' ? '2px solid var(--text-primary)' : '2px solid transparent',
                color: activeTab === 'analytics' ? 'var(--text-primary)' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: 14,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <BarChart2 size={16} /> Statistics & Analytics
            </button>
            <button
              onClick={() => setActiveTab('leaderboard')}
              style={{
                padding: '10px 16px',
                border: 'none',
                background: 'transparent',
                borderBottom: activeTab === 'leaderboard' ? '2px solid var(--text-primary)' : '2px solid transparent',
                color: activeTab === 'leaderboard' ? 'var(--text-primary)' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: 14,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <Trophy size={16} /> Leaderboard & Badges
            </button>
          </div>

          {activeTab === 'analytics' ? (
            <AssessmentAnalyticsTab assessmentId={assessmentId} />
          ) : activeTab === 'leaderboard' ? (
            <AssessmentLeaderboardTab assessmentId={assessmentId} />
          ) : (
            <>
              {/* Description */}
              {a.description && (
                <div className={s.descCard}>
                  <p className={s.descCardTitle}>About this assessment</p>
                  <p className={s.descCardText}>{a.description}</p>
                </div>
              )}

              {/* Publish/Build callout — only show when assessment is completely empty */}
              {isDraft && sections.length === 0 && questions.length === 0 && (
                <div className={s.callout}>
                  <div className={s.calloutIcon}><Info size={18} /></div>
                  <div className={s.calloutText}>
                    <p className={s.calloutTitle}>Get started with your assessment</p>
                    <p className={s.calloutDesc}>Add coding and multiple choice questions directly, or organize them into sections.</p>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Button variant="primary" size="sm" onClick={() => { setTargetSectionId(null); setEditingQuestion(null); setShowForm(true); }}>
                      <Plus size={13} style={{ marginRight: 4 }} /> Add Question
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setShowSectionForm(true)}>
                      <Plus size={13} style={{ marginRight: 4 }} /> Create Section
                    </Button>
                  </div>
                </div>
              )}

              {/* Questions & Sections panel */}
              <div className={s.questionsPanel}>
                <div className={s.questionsPanelHead}>
                  <h3 className={s.questionsPanelTitle}>
                    {sections.length > 0 ? (
                      <>Assessment Sections <span className={s.qBadge}>{sections.length}</span></>
                    ) : (
                      <>Questions <span className={s.qBadge}>{questions.length}</span></>
                    )}
                  </h3>
                  {canEditQuestions && (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Button
                        variant={sections.length === 0 ? "primary" : "secondary"}
                        size="sm"
                        onClick={() => {
                          setTargetSectionId(null);
                          setEditingQuestion(null);
                          setShowForm(true);
                        }}
                      >
                        <Plus size={13} style={{ marginRight: 4 }} /> Add Question
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setTargetSectionId(null);
                          setShowBankModal(true);
                        }}
                      >
                        <Database size={13} style={{ marginRight: 4 }} /> Import from Bank
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setTargetSectionId(null);
                          setShowImportFileModal(true);
                        }}
                      >
                        <Upload size={13} style={{ marginRight: 4 }} /> Import CSV/JSON
                      </Button>
                      {!showSectionForm && (
                        <Button
                          variant={sections.length === 0 ? "outline" : "primary"}
                          size="sm"
                          onClick={() => setShowSectionForm(true)}
                        >
                          <Plus size={13} style={{ marginRight: 4 }} /> Add Section
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                {/* Edit question modal/form if global */}
                {editingQuestion && (
                  <div
                    style={{
                      border: '1px solid var(--border-color)',
                      borderRadius: 16,
                      padding: '22px',
                      marginBottom: 24,
                      background: 'var(--surface-medium)',
                      boxShadow: 'var(--shadow-sm)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, paddingBottom: 14, borderBottom: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '4px 10px',
                          borderRadius: 9999,
                          background: 'rgba(37, 99, 235, 0.12)',
                          border: '1px solid rgba(37, 99, 235, 0.25)',
                          color: 'var(--color-primary-500, #2563eb)',
                          fontSize: 12,
                          fontWeight: 700,
                          letterSpacing: '0.02em',
                        }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-primary-500, #2563eb)', boxShadow: '0 0 8px rgba(37, 99, 235, 0.4)' }} />
                          Editing Question
                        </span>
                        <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                          {editingQuestion.title}
                        </h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEditingQuestion(null)}
                        style={{
                          background: 'var(--surface-dark)',
                          border: '1px solid var(--border-color)',
                          color: 'var(--text-secondary)',
                          padding: '6px 12px',
                          borderRadius: 8,
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--hover-bg)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--surface-dark)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                      >
                        <X size={14} /> Close Editor
                      </button>
                    </div>
                    <AdminQuestionForm
                      defaultValues={editingQuestion}
                      sections={sections}
                      onSubmit={handleUpdateQuestion}
                      onCancel={() => setEditingQuestion(null)}
                      submitLabel="Update question"
                      error={updateQ.error}
                    />
                  </div>
                )}

                {/* Empty state if 0 sections and 0 questions */}
                {sections.length === 0 && questions.length === 0 && !showSectionForm && !showForm && (
                  <div className={s.emptyQuestions}>
                    <FileQuestion className={s.emptyIcon} />
                    <p className={s.emptyTitle}>No questions added yet</p>
                    <p className={s.emptyDesc}>
                      {isDraft ? 'Click "+ Add Question" to add your first question, or create sections to organize them.' : 'No questions were added to this assessment.'}
                    </p>
                    {canEditQuestions && (
                      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                        <Button variant="primary" size="sm" onClick={() => { setTargetSectionId(null); setShowForm(true); }}>
                          <Plus size={13} style={{ marginRight: 4 }} /> Add Question
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => { setTargetSectionId(null); setShowBankModal(true); }}>
                          <Database size={13} style={{ marginRight: 4 }} /> Import from Bank
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setShowSectionForm(true)}>
                          <Plus size={13} style={{ marginRight: 4 }} /> Create Section
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* Questions/Sections List */}
                <div className={s.sectionsWrap}>
                  {/* Add Section Form */}
                  {showSectionForm && (
                    <div className={s.inlineFormWrap} style={{ border: '1px solid var(--border-color)', borderRadius: 10, padding: 18, marginBottom: 20, background: 'var(--surface-medium)' }}>
                      <h4 className={s.inlineFormTitle} style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Plus size={15} /> New Section
                      </h4>
                      <form onSubmit={handleAddSection} className={s.sectionForm} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <input
                          name="title"
                          placeholder="Section Title (e.g., General Coding, Data Structures)"
                          required
                          className={s.input}
                          style={{
                            width: '100%',
                            padding: '10px 14px',
                            borderRadius: 8,
                            border: '1px solid var(--border-color)',
                            background: 'var(--bg-primary)',
                            color: 'var(--text-primary)',
                            fontSize: 14,
                            outline: 'none',
                          }}
                        />
                        <textarea
                          name="description"
                          placeholder="Section Description (optional)"
                          rows={2}
                          className={s.input}
                          style={{
                            width: '100%',
                            padding: '10px 14px',
                            borderRadius: 8,
                            border: '1px solid var(--border-color)',
                            background: 'var(--bg-primary)',
                            color: 'var(--text-primary)',
                            fontSize: 14,
                            resize: 'vertical',
                            outline: 'none',
                          }}
                        />
                        <div style={{ display: 'flex', gap: 8 }}>
                          <Button type="submit" variant="primary" size="sm" isLoading={createSection.isPending}>Save Section</Button>
                          <Button type="button" variant="ghost" size="sm" onClick={() => setShowSectionForm(false)}>Cancel</Button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Inline Form to add question when no section is targeted */}
                  {showForm && targetSectionId === null && (
                    <div className={s.inlineFormWrap} style={{ marginBottom: 20 }}>
                      <h4 className={s.inlineFormTitle}>
                        <Plus size={15} /> {sections.length > 0 ? 'New Question (Unsectioned)' : 'New Question'}
                      </h4>
                      <AdminQuestionForm
                        sections={sections}
                        onSubmit={handleAddQuestion}
                        onCancel={() => { setShowForm(false); setTargetSectionId(null); }}
                        error={addQ.error}
                      />
                    </div>
                  )}

                  {/* CASE 1: Sections exist -> render sections */}
                  {sections.length > 0 && sections.map(section => (
                    <div key={section.id} className={s.sectionCard} style={{ border: '1px solid var(--border-color)', borderRadius: 10, marginBottom: 20, overflow: 'hidden', background: 'var(--lms-card)' }}>
                      {/* Section Head or Edit Section Form */}
                      {editingSection?.id === section.id ? (
                        <div style={{ padding: '16px 18px', background: 'var(--surface-medium)', borderBottom: '1px solid var(--border-color)' }}>
                          <h4 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-primary)' }}>
                            <Edit2 size={15} /> Edit Section: {section.title}
                          </h4>
                          <form onSubmit={handleUpdateSection} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <input
                              name="title"
                              defaultValue={editingSection.title}
                              placeholder="Section Title (e.g., General Coding, Data Structures)"
                              required
                              style={{
                                width: '100%',
                                padding: '10px 14px',
                                borderRadius: 8,
                                border: '1px solid var(--border-color)',
                                background: 'var(--bg-primary)',
                                color: 'var(--text-primary)',
                                fontSize: 14,
                                outline: 'none',
                              }}
                            />
                            <textarea
                              name="description"
                              defaultValue={editingSection.description || ''}
                              placeholder="Section Description (optional)"
                              rows={2}
                              style={{
                                width: '100%',
                                padding: '10px 14px',
                                borderRadius: 8,
                                border: '1px solid var(--border-color)',
                                background: 'var(--bg-primary)',
                                color: 'var(--text-primary)',
                                fontSize: 14,
                                resize: 'vertical',
                                outline: 'none',
                              }}
                            />
                            <div style={{ display: 'flex', gap: 8 }}>
                              <Button type="submit" variant="primary" size="sm" isLoading={updateSection.isPending}>Update Section</Button>
                              <Button type="button" variant="ghost" size="sm" onClick={() => setEditingSection(null)}>Cancel</Button>
                            </div>
                          </form>
                        </div>
                      ) : (
                        <div className={s.sectionHead} style={{ background: 'var(--surface-medium)', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)' }}>
                          <div>
                            <h4 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>{section.title}</h4>
                            {section.description && <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>{section.description}</p>}
                          </div>
                          {canEditQuestions && (
                            <div style={{ display: 'flex', gap: 8 }}>
                              <Button variant="secondary" size="sm" onClick={() => {
                                setTargetSectionId(section.id);
                                setShowForm(true);
                              }}>
                                <Plus size={13} style={{ marginRight: 4 }} /> Add Question
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => setEditingSection(section)} title="Edit section">
                                <Edit2 size={13} />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => {
                                setConfirmDialog({
                                  title: 'Delete Section',
                                  message: `Are you sure you want to delete section "${section.title}"?\n\nQuestions in this section will be moved to unsectioned.`,
                                  confirmLabel: 'Delete Section',
                                  variant: 'danger',
                                  onConfirm: async () => {
                                    setConfirmDialog((prev) => ({ ...prev, loading: true }));
                                    try {
                                      await deleteSection.mutateAsync(section.id);
                                      toast.success(`Section "${section.title}" deleted`);
                                      setConfirmDialog(null);
                                    } catch (e) {
                                      toast.error(e.message || 'Failed to delete section');
                                      setConfirmDialog(null);
                                    }
                                  },
                                });
                              }} title="Delete section">
                                <Trash2 size={13} />
                              </Button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Question Form inside target section */}
                      {showForm && targetSectionId === section.id && (
                        <div className={s.inlineFormWrap} style={{ margin: 16 }}>
                          <h4 className={s.inlineFormTitle}>
                            <Plus size={15} /> {`New Question in "${section.title}"`}
                          </h4>
                          <AdminQuestionForm
                            sections={sections}
                            onSubmit={handleAddQuestion}
                            onCancel={() => { setShowForm(false); setTargetSectionId(null); }}
                            error={addQ.error}
                          />
                        </div>
                      )}

                      {/* Questions List for this Section */}
                      <div className={s.questionsList} style={{ padding: '0 18px' }}>
                        {section.questions.length === 0 ? (
                          <p style={{ padding: '18px 0', margin: 0, fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>
                            {'No questions in this section yet. Click "+ Add Question" to add one.'}
                          </p>
                        ) : (
                          section.questions.map((q, i) => (
                            <div key={q.id} className={`${s.questionRow} ${editingQuestion?.id === q.id ? s.questionRowActive : ''}`} style={{ borderBottom: i === section.questions.length - 1 ? 'none' : '1px solid var(--border-color)', padding: '14px 0', display: 'flex', alignItems: 'center' }}>
                              <div className={s.questionNum}>Q{i + 1}</div>
                              <div className={s.questionContent} style={{ flex: 1 }}>
                                <p className={s.questionTitle} style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 600 }}>{q.title}</p>
                                <div className={s.questionChips} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                  {q.questionType === 'MULTIPLE_CHOICE' ? (
                                    <Badge tone="info">MCQ</Badge>
                                  ) : (
                                    <Badge tone="neutral">Coding</Badge>
                                  )}
                                  <Badge tone={DIFFICULTY_TONE[q.difficulty] ?? 'neutral'}>{q.difficulty}</Badge>
                                  <span className={s.chip} style={{ fontSize: 12, color: 'var(--text-muted)' }}><BarChart2 size={10} /> {q.marks} marks</span>
                                </div>
                              </div>
                              {canEditQuestions && (
                                <div className={s.questionActions} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <select
                                    aria-label="Change question section"
                                    style={{
                                      background: 'var(--bg-primary)',
                                      color: 'var(--text-secondary)',
                                      border: '1px solid var(--border-color)',
                                      borderRadius: 6,
                                      padding: '5px 8px',
                                      fontSize: 12,
                                      outline: 'none',
                                      cursor: 'pointer',
                                    }}
                                    value={section.id}
                                    onChange={async (e) => {
                                      const newSecId = e.target.value;
                                      try {
                                        await moveQuestion.mutateAsync({
                                          questionId: q.id,
                                          sectionId: newSecId === 'unsectioned' ? null : newSecId,
                                        });
                                        toast.success(`Updated section for "${q.title}"`);
                                      } catch (err) {
                                        toast.error(err?.response?.data?.message || err.message || 'Failed to update section');
                                      }
                                    }}
                                  >
                                    <option value="unsectioned">Unsectioned</option>
                                    {sections.map(sec => (
                                      <option key={sec.id} value={sec.id}>{sec.title}</option>
                                    ))}
                                  </select>
                                  <Button variant="ghost" size="sm" onClick={() => { setShowForm(false); setEditingQuestion(editingQuestion?.id === q.id ? null : q); }} title="Edit question">
                                    <Edit2 size={13} />
                                  </Button>
                                  <Button variant="ghost" size="sm" onClick={() => handleDeleteQuestion(q)} title="Delete question">
                                    <Trash2 size={13} />
                                  </Button>
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  ))}

                  {/* CASE 1b: Sections exist AND some questions are unsectioned -> show Unsectioned box */}
                  {sections.length > 0 && questions.filter(q => !q.sectionId).length > 0 && (
                    <div className={s.sectionCard} style={{ border: '1px dashed var(--border-color)', borderRadius: 10, marginBottom: 20, overflow: 'hidden' }}>
                      <div className={s.sectionHead} style={{ background: 'var(--bg-primary)', padding: '12px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)' }}>
                        <h4 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--text-secondary)' }}>
                          Unsectioned Questions <span className={s.qBadge}>{questions.filter(q => !q.sectionId).length}</span>
                        </h4>
                      </div>
                      <div className={s.questionsList} style={{ padding: '0 18px' }}>
                        {questions.filter(q => !q.sectionId).map((q, i) => (
                          <div key={q.id} className={`${s.questionRow} ${editingQuestion?.id === q.id ? s.questionRowActive : ''}`} style={{ borderBottom: '1px solid var(--border-color)', padding: '12px 0', display: 'flex', alignItems: 'center' }}>
                            <div className={s.questionNum}>Q{i + 1}</div>
                            <div className={s.questionContent} style={{ flex: 1 }}>
                              <p className={s.questionTitle} style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 600 }}>{q.title}</p>
                              <div className={s.questionChips} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                {q.questionType === 'MULTIPLE_CHOICE' ? (
                                  <Badge tone="info">MCQ</Badge>
                                ) : (
                                  <Badge tone="neutral">Coding</Badge>
                                )}
                                <Badge tone={DIFFICULTY_TONE[q.difficulty] ?? 'neutral'}>{q.difficulty}</Badge>
                                <span className={s.chip} style={{ fontSize: 12, color: 'var(--text-muted)' }}><BarChart2 size={10} /> {q.marks} marks</span>
                              </div>
                            </div>
                            {canEditQuestions && (
                              <div className={s.questionActions} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <select
                                  aria-label="Move question to section"
                                  style={{
                                    background: 'var(--bg-primary)',
                                    color: 'var(--text-secondary)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: 6,
                                    padding: '5px 8px',
                                    fontSize: 12,
                                    outline: 'none',
                                    cursor: 'pointer',
                                  }}
                                  defaultValue=""
                                  onChange={async (e) => {
                                    const secId = e.target.value;
                                    if (!secId) return;
                                    try {
                                      await moveQuestion.mutateAsync({ questionId: q.id, sectionId: secId });
                                      toast.success(`Moved "${q.title}" to section`);
                                    } catch (err) {
                                      toast.error(err?.response?.data?.message || err.message || 'Failed to move question');
                                    }
                                  }}
                                >
                                  <option value="" disabled>Move to section...</option>
                                  {sections.map(sec => (
                                    <option key={sec.id} value={sec.id}>{sec.title}</option>
                                  ))}
                                </select>
                                <Button variant="ghost" size="sm" onClick={() => { setShowForm(false); setEditingQuestion(editingQuestion?.id === q.id ? null : q); }} title="Edit question">
                                  <Edit2 size={13} />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleDeleteQuestion(q)} title="Delete question">
                                  <Trash2 size={13} />
                                </Button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* CASE 2: No sections exist -> render clean standard questions list */}
                  {sections.length === 0 && questions.length > 0 && (
                    <div className={s.sectionCard} style={{ border: '1px solid var(--border-color)', borderRadius: 10, marginBottom: 20, overflow: 'hidden', background: 'var(--lms-card)' }}>
                      <div className={s.questionsList} style={{ padding: '0 18px' }}>
                        {questions.map((q, i) => (
                          <div key={q.id} className={`${s.questionRow} ${editingQuestion?.id === q.id ? s.questionRowActive : ''}`} style={{ borderBottom: i === questions.length - 1 ? 'none' : '1px solid var(--border-color)', padding: '14px 0', display: 'flex', alignItems: 'center' }}>
                            <div className={s.questionNum}>Q{i + 1}</div>
                            <div className={s.questionContent} style={{ flex: 1 }}>
                              <p className={s.questionTitle} style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 600 }}>{q.title}</p>
                              <div className={s.questionChips} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                {q.questionType === 'MULTIPLE_CHOICE' ? (
                                  <Badge tone="info">MCQ</Badge>
                                ) : (
                                  <Badge tone="neutral">Coding</Badge>
                                )}
                                <Badge tone={DIFFICULTY_TONE[q.difficulty] ?? 'neutral'}>{q.difficulty}</Badge>
                                <span className={s.chip} style={{ fontSize: 12, color: 'var(--text-muted)' }}><BarChart2 size={10} /> {q.marks} marks</span>
                              </div>
                            </div>
                            {canEditQuestions && (
                              <div className={s.questionActions} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Button variant="ghost" size="sm" onClick={() => { setShowForm(false); setEditingQuestion(editingQuestion?.id === q.id ? null : q); }} title="Edit question">
                                  <Edit2 size={13} />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleDeleteQuestion(q)} title="Delete question">
                                  <Trash2 size={13} />
                                </Button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── RIGHT: Sidebar ───────────────────────────────── */}
        <div className={s.sidebar}>

          {/* ── Assessment Details + Time Panel ── */}
          <AssessmentTimePanel
            assessment={a}
            onClose={() => run(closeA, 'Assessment closed')}
            onExtend={async (minutes) => {
              try {
                await extendAssessment.mutateAsync(minutes);
                toast.success(`Assessment window extended by ${minutes >= 60 ? `${minutes / 60} hour(s)` : `${minutes} min`}!`);
              } catch (e) {
                toast.error(e?.response?.data?.message || e.message || 'Failed to extend assessment window');
              }
            }}
            isUpdating={extendAssessment.isPending}
          />

          {/* Student Result Analytics Card */}
          <div className={s.sideCard} style={{ marginTop: 16 }}>
            <div className={s.sideCardHead} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Result Analytics</span>
              <Badge tone={a.showResultAnalytics ? 'success' : 'neutral'}>
                {a.showResultAnalytics ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
            <div className={s.sideCardBody}>
              <p style={{ margin: '0 0 12px', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                {a.showResultAnalytics
                  ? 'Students can view all question answers, correct options, and points breakdown.'
                  : 'Answers, points breakdown, and question solutions are currently hidden from students.'}
              </p>
              <Button
                variant={a.showResultAnalytics ? 'secondary' : 'primary'}
                size="sm"
                style={{ width: '100%', justifyContent: 'center' }}
                isLoading={toggleAnalytics.isPending}
                onClick={async () => {
                  try {
                    await toggleAnalytics.mutateAsync(!a.showResultAnalytics);
                    toast.success(a.showResultAnalytics ? 'Result analytics disabled for students' : 'Result analytics released to students!');
                  } catch (e) {
                    toast.error(e?.response?.data?.message || e.message || 'Failed to update result analytics');
                  }
                }}
              >
                {a.showResultAnalytics ? 'Disable for Students' : 'Release to Students'}
              </Button>
            </div>
          </div>

          {/* Actions card */}
          <div className={s.lifecycleCard}>
            <div className={s.sideCardHead}>Actions</div>
            <div className={s.lifecycleButtons}>
              {isDraft && (
                <button className={s.lifecycleBtn}
                  onClick={() => run(publish, 'Assessment published!')}
                  disabled={!canPublish || publish.isPending}
                  title={!canPublish ? 'Add questions first' : ''}>
                  <div className={`${s.lifecycleBtnIcon} ${s.publish}`}><Rocket size={15} /></div>
                  <div className={s.lifecycleBtnText}>
                    <div className={s.lifecycleBtnLabel}>Publish</div>
                    <div className={s.lifecycleBtnDesc}>
                      {canPublish ? 'Make visible to students' : 'Add questions first'}
                    </div>
                  </div>
                </button>
              )}
              {isPublished && (
                <>
                  <button className={s.lifecycleBtn}
                    onClick={() => run(unpublish, 'Moved back to Draft')}
                    disabled={unpublish.isPending}>
                    <div className={`${s.lifecycleBtnIcon} ${s.unpublish}`}><Edit2 size={15} /></div>
                    <div className={s.lifecycleBtnText}>
                      <div className={s.lifecycleBtnLabel}>Unpublish</div>
                      <div className={s.lifecycleBtnDesc}>Revert to draft</div>
                    </div>
                  </button>
                  <button className={s.lifecycleBtn}
                    onClick={() => run(closeA, 'Assessment closed')}
                    disabled={closeA.isPending}>
                    <div className={`${s.lifecycleBtnIcon} ${s.close}`}><XCircle size={15} /></div>
                    <div className={s.lifecycleBtnText}>
                      <div className={s.lifecycleBtnLabel}>Close</div>
                      <div className={s.lifecycleBtnDesc}>Stop accepting submissions</div>
                    </div>
                  </button>
                </>
              )}
              {a.status !== 'ARCHIVED' && (
                <button className={s.lifecycleBtn}
                  onClick={() => run(archive, 'Assessment archived', true)}
                  disabled={archive.isPending}>
                  <div className={`${s.lifecycleBtnIcon} ${s.archive}`}><ArchiveIcon size={15} /></div>
                  <div className={s.lifecycleBtnText}>
                    <div className={s.lifecycleBtnLabel}>Archive</div>
                    <div className={s.lifecycleBtnDesc}>Hide from all views</div>
                  </div>
                </button>
              )}
              {isDraft && (
                <button className={s.lifecycleBtn} onClick={handleDelete} disabled={deleteA.isPending}>
                  <div className={`${s.lifecycleBtnIcon} ${s.delete}`}><Trash2 size={15} /></div>
                  <div className={s.lifecycleBtnText}>
                    <div className={s.lifecycleBtnLabel} style={{ color: 'var(--color-danger)' }}>Delete</div>
                    <div className={s.lifecycleBtnDesc}>Permanently remove</div>
                  </div>
                </button>
              )}
            </div>
          </div>

        </div>
      </div>

      <ImportQuestionBankModal
        isOpen={showBankModal}
        onClose={() => setShowBankModal(false)}
        onImport={handleAddQuestion}
        targetSectionId={targetSectionId}
      />

      <ImportQuestionsFileModal
        isOpen={showImportFileModal}
        onClose={() => setShowImportFileModal(false)}
        onImportSuccess={handleImportFileQuestions}
        target="assessment"
        targetTitle={a?.title || 'Assessment'}
      />

      {confirmDialog && (
        <AdminConfirmModal
          open={Boolean(confirmDialog)}
          onClose={() => setConfirmDialog(null)}
          onConfirm={confirmDialog.onConfirm}
          title={confirmDialog.title}
          message={confirmDialog.message}
          confirmLabel={confirmDialog.confirmLabel}
          variant={confirmDialog.variant}
          loading={confirmDialog.loading}
        />
      )}
    </div>
  );
};

export default AdminAssessmentDetailsPage;
