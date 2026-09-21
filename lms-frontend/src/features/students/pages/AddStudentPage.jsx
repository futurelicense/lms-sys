import { useNavigate } from 'react-router-dom';
import PageContainer from '../../../components/layout/PageContainer';
import Spinner from '../../../components/common/Spinner';
import ErrorState from '../../../components/common/ErrorState';
import { useToast } from '../../../components/feedback/Toast';
import StudentForm from '../components/StudentForm';
import { useCreateStudent, useStudentReferenceData } from '../hooks/useStudents';
import { toCreateStudentPayload } from '../validation/studentSchemas';
import { ROUTES } from '../../../constants/routes';

export const AddStudentPage = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const { data: referenceData, isLoading, error, refetch } = useStudentReferenceData();
  const { mutateAsync, error: submitError } = useCreateStudent();

  const handleSubmit = async (values) => {
    const student = await mutateAsync(toCreateStudentPayload(values));
    toast.success(`${student.fullName} admitted — onboarding email sent to ${student.email}`);
    navigate(ROUTES.STUDENTS);
  };

  return (
    <PageContainer
      title="Add New Learner"
      breadcrumbs={[
        { label: 'Dashboard', to: ROUTES.ROOT },
        { label: 'Learners', to: ROUTES.STUDENTS },
        { label: 'Add New Learner' },
      ]}
    >
      {isLoading && <Spinner />}

      {/* The dropdowns are unusable without reference data, so the form is not
          rendered at all until it arrives rather than showing empty selects. */}
      {error && <ErrorState title="Could not load the form" error={error} onRetry={refetch} />}

      {referenceData && (
        <StudentForm
          referenceData={referenceData}
          onSubmit={handleSubmit}
          onCancel={() => navigate(ROUTES.STUDENTS)}
          submitLabel="Add learner"
          error={submitError}
        />
      )}
    </PageContainer>
  );
};

export default AddStudentPage;
