import { useNavigate, Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import AdminAssessmentForm from '../components/AdminAssessmentForm';
import { useCreateAdminAssessment } from '../hooks/useAdminAssessments';
import { useToast } from '../../../components/feedback/Toast';
import { ROUTES } from '../../../constants/routes';

const headStyle = {
  marginBottom: 24,
};
const breadStyle = {
  display: 'flex', alignItems: 'center', gap: 6,
  fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: 10,
};
const titleStyle = {
  fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text)',
  margin: 0, letterSpacing: '-0.02em',
};
const subStyle = {
  fontSize: '0.825rem', color: 'var(--color-text-muted)', margin: '4px 0 0',
};

export const AdminCreateAssessmentPage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { mutateAsync, error } = useCreateAdminAssessment();

  const handleSubmit = async (values) => {
    const assessment = await mutateAsync(values);
    toast.success('Assessment created — now add questions!');
    navigate(ROUTES.ADMIN_ASSESSMENT_DETAILS(assessment.id));
  };

  return (
    <div>
      <div style={headStyle}>
        <div style={breadStyle}>
          <Link to={ROUTES.ADMIN_ASSESSMENTS} style={{ color: 'var(--color-text-muted)', textDecoration: 'none' }}>
            Assessments
          </Link>
          <ChevronRight size={12} />
          <span>New Assessment</span>
        </div>
        <h1 style={titleStyle}>Create New Assessment</h1>
        <p style={subStyle}>Set up the basics, then add coding questions on the next screen.</p>
      </div>

      <AdminAssessmentForm
        onSubmit={handleSubmit}
        onCancel={() => navigate(ROUTES.ADMIN_ASSESSMENTS)}
        error={error}
      />
    </div>
  );
};

export default AdminCreateAssessmentPage;
