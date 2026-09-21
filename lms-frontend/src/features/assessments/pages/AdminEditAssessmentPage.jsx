import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import AdminAssessmentForm from '../components/AdminAssessmentForm';
import Spinner from '../../../components/common/Spinner';
import Alert from '../../../components/feedback/Alert';
import { useAdminAssessment, useUpdateAdminAssessment } from '../hooks/useAdminAssessments';
import { useToast } from '../../../components/feedback/Toast';
import { ROUTES } from '../../../constants/routes';

export const AdminEditAssessmentPage = () => {
  const { assessmentId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const isInstructor = location.pathname.startsWith('/instructor');
  const detailsRoute = isInstructor ? ROUTES.INSTRUCTOR_ASSESSMENT_DETAILS(assessmentId) : ROUTES.ADMIN_ASSESSMENT_DETAILS(assessmentId);
  const listRoute = isInstructor ? ROUTES.ASSESSMENTS : ROUTES.ADMIN_ASSESSMENTS;

  const { data: assessment, isLoading, error: loadErr } = useAdminAssessment(assessmentId);
  const { mutateAsync, error: saveErr } = useUpdateAdminAssessment(assessmentId);

  if (isLoading) return <Spinner fullPage />;
  if (loadErr) return <Alert tone="error">Failed to load assessment.</Alert>;

  const handleSubmit = async (values) => {
    await mutateAsync(values);
    toast.success('Changes saved');
    navigate(detailsRoute);
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: 10 }}>
          <Link to={listRoute} style={{ color: 'var(--color-text-muted)', textDecoration: 'none' }}>Assessments</Link>
          <ChevronRight size={12} />
          <Link to={detailsRoute} style={{ color: 'var(--color-text-muted)', textDecoration: 'none' }}>
            {assessment.title}
          </Link>
          <ChevronRight size={12} />
          <span>Edit</span>
        </div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text)', margin: 0, letterSpacing: '-0.02em' }}>
          Edit Assessment
        </h1>
        <p style={{ fontSize: '0.825rem', color: 'var(--color-text-muted)', margin: '4px 0 0' }}>
          Changes apply immediately after saving.
        </p>
      </div>

      <AdminAssessmentForm
        defaultValues={assessment}
        onSubmit={handleSubmit}
        onCancel={() => navigate(detailsRoute)}
        submitLabel="Save changes"
        error={saveErr}
      />
    </div>
  );
};

export default AdminEditAssessmentPage;
