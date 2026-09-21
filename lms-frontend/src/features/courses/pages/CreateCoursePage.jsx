import React from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, BookOpen, Layers, CheckCircle2, ChevronRight,
  Sparkles, FileText, Info
} from 'lucide-react';
import PageContainer from '../../../components/layout/PageContainer';
import CourseForm from '../components/CourseForm';
import { useCreateCourse } from '../hooks/useCourses';
import { useToast } from '../../../components/feedback/Toast';
import { ROUTES } from '../../../constants/routes';

export const CreateCoursePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { mutateAsync, error } = useCreateCourse();

  const isAdmin = location.pathname.startsWith('/admin');
  const coursesRoute = isAdmin ? ROUTES.ADMIN_COURSES : ROUTES.COURSES;
  const editRoute = (id) => (isAdmin ? ROUTES.ADMIN_COURSE_EDIT(id) : ROUTES.COURSE_EDIT(id));

  const handleSubmit = async (values) => {
    try {
      const course = await mutateAsync(values);
      toast.success('Course created successfully! Ready to build curriculum.');
      // Direct redirect to the Curriculum Builder tab of the new course
      navigate(`${editRoute(course.id)}?tab=curriculum`);
    } catch (err) {
      console.error('Course creation failed:', err);
      toast.error(err?.response?.data?.message || err?.message || 'Failed to create course.');
    }
  };

  return (
    <PageContainer
      title="Create New Course"
      breadcrumbs={[
        { label: 'Courses', to: coursesRoute },
        { label: 'Create Course' },
      ]}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        
        {/* ── Top Header Banner ── */}
        <div
          style={{
            background: 'var(--lms-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 14,
            padding: '20px 24px',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 16,
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button
              type="button"
              onClick={() => navigate(coursesRoute)}
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                border: '1px solid var(--border-color)',
                background: 'var(--surface-medium, rgba(255, 255, 255, 0.05))',
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              title="Back to Courses"
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--border-color)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--surface-medium, rgba(255, 255, 255, 0.05))'; }}
            >
              <ArrowLeft size={16} />
            </button>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
                  Create New Course
                </h1>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    padding: '2px 8px',
                    borderRadius: 20,
                    background: 'rgba(59, 130, 246, 0.12)',
                    color: '#3b82f6',
                    border: '1px solid rgba(59, 130, 246, 0.25)',
                  }}
                >
                  {isAdmin ? 'Admin Authoring' : 'Instructor Authoring'}
                </span>
              </div>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
                Set up the foundational course details, level, and syllabus. You will be able to add modules and video lessons immediately after.
              </p>
            </div>
          </div>
        </div>

        {/* ── Visual 3-Step Course Creation Roadmap ── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 12,
            background: 'var(--surface-medium, rgba(255, 255, 255, 0.02))',
            border: '1px solid var(--border-color)',
            borderRadius: 12,
            padding: 12,
          }}
        >
          {/* Step 1: Current */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 14px',
              borderRadius: 8,
              background: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: '#3b82f6',
                color: '#fff',
                fontSize: 12,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              1
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#3b82f6' }}>
                1. Identity & Syllabus
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                Title, duration, & description
              </div>
            </div>
          </div>

          {/* Step 2: Next */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 14px',
              borderRadius: 8,
              background: 'transparent',
              border: '1px dashed var(--border-color)',
              opacity: 0.75,
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: 'var(--border-color)',
                color: 'var(--text-muted)',
                fontSize: 12,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              2
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                2. Curriculum Builder
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                Modules, videos, documents
              </div>
            </div>
          </div>

          {/* Step 3: Final */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 14px',
              borderRadius: 8,
              background: 'transparent',
              border: '1px dashed var(--border-color)',
              opacity: 0.75,
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: 'var(--border-color)',
                color: 'var(--text-muted)',
                fontSize: 12,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              3
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                3. Publish Readiness
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                Checklist validation & publish
              </div>
            </div>
          </div>
        </div>

        {/* ── Form Container ── */}
        <CourseForm
          onSubmit={handleSubmit}
          onCancel={() => navigate(coursesRoute)}
          submitLabel="Create Course & Proceed to Curriculum"
          error={error}
        />
      </div>
    </PageContainer>
  );
};

export default CreateCoursePage;
