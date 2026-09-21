import { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  BookOpen, Layers, ArrowLeft, Eye, CheckCircle2, AlertCircle, Shield, Trash2
} from 'lucide-react';
import PageContainer from '../../../components/layout/PageContainer';
import Spinner from '../../../components/common/Spinner';
import ErrorState from '../../../components/common/ErrorState';
import Badge from '../../../components/common/Badge';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import CourseForm from '../components/CourseForm';
import CurriculumBuilder from '../components/CurriculumBuilder';
import PublishChecklist from '../components/PublishChecklist';
import useCourse from '../hooks/useCourse';
import { useUpdateCourse, useDeleteCourse } from '../hooks/useCourses';
import courseService from '../services/courseService';
import { useToast } from '../../../components/feedback/Toast';
import { ROUTES } from '../../../constants/routes';
import { COURSE_STATUS_TONE } from '../constants/courseConstants';

export const EditCoursePage = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { data: course, isLoading, error, refetch } = useCourse(courseId);
  const { mutateAsync, error: saveError } = useUpdateCourse(courseId);
  const deleteMutation = useDeleteCourse();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const searchTab = new URLSearchParams(location.search).get('tab');
  const [activeTab, setActiveTab] = useState(searchTab || 'basic');

  const isAdmin = location.pathname.startsWith('/admin');
  const coursesRoute = isAdmin ? ROUTES.ADMIN_COURSES : ROUTES.COURSES;
  const detailsRoute = isAdmin ? ROUTES.ADMIN_COURSE_DETAILS(courseId) : ROUTES.COURSE_DETAILS(courseId);

  if (isLoading) return <Spinner fullPage />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  const handleSubmit = async (values) => {
    try {
      await mutateAsync(values);
      toast.success('Course updated successfully!');
      navigate(detailsRoute);
    } catch (e) {
      toast.error(e?.message || 'Failed to save course changes.');
    }
  };

  const handleDeleteCourse = async () => {
    setIsDeleting(true);
    try {
      if (course?.status === 'PUBLISHED') {
        await courseService.unpublish(courseId);
      }
      await deleteMutation.mutateAsync(courseId);
      toast.success('Course deleted successfully.');
      navigate(coursesRoute);
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to delete course.');
    } finally {
      setIsDeleting(false);
    }
  };

  const statusTone = COURSE_STATUS_TONE[course?.status] || 'neutral';

  return (
    <PageContainer
      title={`Edit: ${course?.title || 'Course'}`}
      breadcrumbs={[
        { label: 'Courses', to: coursesRoute },
        { label: course?.title || 'Details', to: detailsRoute },
        { label: 'Edit' },
      ]}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, fontFamily: 'system-ui, -apple-system, sans-serif' }}>

        {/* ── Top Header Banner ── */}
        <div style={{
          background: 'var(--lms-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 14,
          padding: '20px 24px',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button
              onClick={() => navigate(-1)}
              style={{
                width: 36, height: 36, borderRadius: 10,
                border: '1px solid var(--border-color)',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer'
              }}
              title="Back"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.4px' }}>
                  Edit: {course.title}
                </h1>
                <Badge tone={statusTone}>{course.status || 'DRAFT'}</Badge>
              </div>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
                {course.level} • {course.durationMinutes || 60} mins estimated duration
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button
              onClick={() => navigate(detailsRoute)}
              style={{
                padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                border: '1px solid var(--border-color)', background: 'transparent',
                color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
              }}
            >
              <Eye size={14} /> Preview Course
            </button>
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              style={{
                padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                border: '1px solid rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.08)',
                color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.18)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)'; }}
            >
              <Trash2 size={14} /> Delete Course
            </button>
          </div>
        </div>

        {/* ── Glassmorphic Pill Tab Bar ── */}
        <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid var(--border-color)', paddingBottom: 12 }}>
          <button
            onClick={() => setActiveTab('basic')}
            style={{
              padding: '10px 20px',
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontFamily: 'inherit',
              border: activeTab === 'basic' ? '1px solid var(--text-primary)' : '1px solid var(--border-color)',
              background: activeTab === 'basic' ? 'var(--text-primary)' : 'var(--lms-card)',
              color: activeTab === 'basic' ? 'var(--lms-background)' : 'var(--text-secondary)',
              transition: 'all 0.15s ease'
            }}
          >
            <BookOpen size={16} /> Basic Information
          </button>

          <button
            onClick={() => setActiveTab('curriculum')}
            style={{
              padding: '10px 20px',
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontFamily: 'inherit',
              border: activeTab === 'curriculum' ? '1px solid var(--text-primary)' : '1px solid var(--border-color)',
              background: activeTab === 'curriculum' ? 'var(--text-primary)' : 'var(--lms-card)',
              color: activeTab === 'curriculum' ? 'var(--lms-background)' : 'var(--text-secondary)',
              transition: 'all 0.15s ease'
            }}
          >
            <Layers size={16} /> Curriculum Builder
          </button>
        </div>

        {/* ── Active Tab Content with Publish Checklist Sidebar ── */}
        <div style={{
          display: activeTab === 'curriculum' ? 'grid' : 'block',
          gridTemplateColumns: activeTab === 'curriculum' ? '1fr 280px' : '1fr',
          gap: 20,
          alignItems: 'start',
        }}>
          <div>
            {activeTab === 'basic' ? (
              <CourseForm
                defaultValues={course}
                onSubmit={handleSubmit}
                onCancel={() => navigate(-1)}
                error={saveError}
              />
            ) : (
              <CurriculumBuilder course={course} />
            )}
          </div>

          {activeTab === 'curriculum' && (
            <div style={{ position: 'sticky', top: 20 }}>
              <PublishChecklist
                course={course}
                modules={course?.modules || []}
                onPublish={course?.status === 'DRAFT' ? async () => {
                  try {
                    await mutateAsync({ ...course, status: 'PUBLISHED' });
                    toast.success('Course published successfully! 🎉');
                    refetch();
                  } catch (e) {
                    toast.error(e?.message || 'Failed to publish course.');
                  }
                } : undefined}
              />
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onCancel={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteCourse}
        title="Delete Course"
        message={
          course?.status === 'PUBLISHED'
            ? `"${course?.title}" is currently PUBLISHED. To safely delete it, it will be unpublished first and then permanently removed. Are you sure?`
            : `Are you sure you want to delete "${course?.title}"? This action cannot be undone.`
        }
        confirmLabel="Delete"
        isDestructive
        isLoading={isDeleting}
      />
    </PageContainer>
  );
};

export default EditCoursePage;

