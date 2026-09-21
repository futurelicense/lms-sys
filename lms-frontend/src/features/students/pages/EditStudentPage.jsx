import { useNavigate, useParams } from 'react-router-dom';
import PageContainer from '../../../components/layout/PageContainer';
import Spinner from '../../../components/common/Spinner';
import ErrorState from '../../../components/common/ErrorState';
import Alert from '../../../components/feedback/Alert';
import { useToast } from '../../../components/feedback/Toast';
import StudentForm from '../components/StudentForm';
import { useStudent, useStudentReferenceData, useUpdateStudent } from '../hooks/useStudents';
import { toStudentFormValues, toUpdateStudentPayload } from '../validation/studentSchemas';
import { ROUTES } from '../../../constants/routes';

export const EditStudentPage = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const {
    data: student,
    isLoading: isLoadingStudent,
    error: studentError,
    refetch: refetchStudent,
  } = useStudent(studentId);

  const {
    data: referenceData,
    isLoading: isLoadingReference,
    error: referenceError,
    refetch: refetchReference,
  } = useStudentReferenceData();

  const { mutateAsync, error: submitError } = useUpdateStudent(studentId);

  const handleSubmit = async (values) => {
    const emailChanged = values.email.trim().toLowerCase() !== student.email;
    const updated = await mutateAsync(toUpdateStudentPayload(values));

    toast.success(
      emailChanged
        ? `Saved. Sign-in email is now ${updated.email} — resend the invitation so it reaches them.`
        : `${updated.fullName} updated`,
    );
    navigate(ROUTES.STUDENTS);
  };

  const isLoading = isLoadingStudent || isLoadingReference;
  const error = studentError || referenceError;

  return (
    <PageContainer
      title={student ? `Edit ${student.fullName}` : 'Edit learner'}
      breadcrumbs={[
        { label: 'Dashboard', to: ROUTES.ROOT },
        { label: 'Learners', to: ROUTES.STUDENTS },
        { label: student ? student.registrationNo : 'Edit' },
      ]}
    >
      {isLoading && <Spinner />}

      {error && (
        <ErrorState
          title="Could not load the learner"
          error={error}
          onRetry={() => {
            refetchStudent();
            refetchReference();
          }}
        />
      )}

      {student && referenceData && (
        <>
          {/* The account is only Pending while the invitation is unaccepted, which
              is exactly when a wrong address matters most — the mail went nowhere. */}
          {!student.active && (
            <Alert tone="warning">
              This account has not been activated yet. If you correct the email, resend the
              invitation from the Invitations page so the onboarding mail reaches the new address.
            </Alert>
          )}

          <StudentForm
            isEdit
            defaultValues={toStudentFormValues(student)}
            enrolledBatches={student.enrolments ?? []}
            referenceData={referenceData}
            onSubmit={handleSubmit}
            onCancel={() => navigate(ROUTES.STUDENTS)}
            submitLabel="Save changes"
            error={submitError}
          />
        </>
      )}
    </PageContainer>
  );
};

export default EditStudentPage;
