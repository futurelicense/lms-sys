import { useNavigate, Link } from 'react-router-dom';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import PageContainer from '../../../components/layout/PageContainer';
import AdminAssessmentForm from '../components/AdminAssessmentForm';
import { useCreateAdminAssessment } from '../hooks/useAdminAssessments';
import { useToast } from '../../../components/feedback/Toast';
import { ROUTES } from '../../../constants/routes';

export const CreateAssessmentPage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { mutateAsync, error } = useCreateAdminAssessment();

  const handleSubmit = async (values) => {
    const assessment = await mutateAsync(values);
    toast.success('Assessment created successfully! Now add questions.');
    navigate(ROUTES.INSTRUCTOR_ASSESSMENT_DETAILS(assessment.id));
  };

  return (
    <PageContainer
      title="Create New Assessment"
      subtitle="Set up title, duration, marks, and retake policies for your students."
      actions={
        <Link
          to={ROUTES.ASSESSMENTS}
          style={{ textDecoration: 'none' }}
        >
          <button
            type="button"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 16px',
              borderRadius: 8,
              border: '1px solid var(--border-color)',
              background: 'var(--surface-medium)',
              color: 'var(--text-primary)',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <ArrowLeft size={14} /> Back to Assessments
          </button>
        </Link>
      }
    >
      <div style={{ maxWidth: 880, margin: '0 auto' }}>
        <AdminAssessmentForm
          onSubmit={handleSubmit}
          onCancel={() => navigate(ROUTES.ASSESSMENTS)}
          error={error}
        />
      </div>
    </PageContainer>
  );
};

export default CreateAssessmentPage;
