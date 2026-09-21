import { useNavigate, useParams } from 'react-router-dom';
import PageContainer from '../../../components/layout/PageContainer';
import Spinner from '../../../components/common/Spinner';
import ErrorState from '../../../components/common/ErrorState';
import Alert from '../../../components/feedback/Alert';
import { useToast } from '../../../components/feedback/Toast';
import InstructorForm from '../components/InstructorForm';
import { useInstructor, useUpdateInstructor } from '../hooks/useInstructors';
import { toInstructorFormValues, toUpdateInstructorPayload } from '../validation/instructorSchemas';
import { ROUTES } from '../../../constants/routes';

export const EditInstructorPage = () => {
  const { instructorId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const { data: instructor, isLoading, error, refetch } = useInstructor(instructorId);
  const { mutateAsync, error: submitError } = useUpdateInstructor(instructorId);

  const handleSubmit = async (values) => {
    const emailChanged = values.email.trim().toLowerCase() !== instructor.email;
    const updated = await mutateAsync(toUpdateInstructorPayload(values));

    toast.success(
      emailChanged
        ? `Saved. Sign-in email is now ${updated.email} — resend the invitation so it reaches them.`
        : `${updated.fullName} updated`,
    );
    navigate(ROUTES.INSTRUCTORS);
  };

  return (
    <PageContainer
      title={instructor ? `Edit ${instructor.fullName}` : 'Edit instructor'}
      breadcrumbs={[
        { label: 'Dashboard', to: ROUTES.ROOT },
        { label: 'Instructors', to: ROUTES.INSTRUCTORS },
        { label: instructor ? instructor.employeeCode : 'Edit' },
      ]}
    >
      {isLoading && <Spinner />}
      {error && (
        <ErrorState title="Could not load the instructor" error={error} onRetry={refetch} />
      )}

      {instructor && (
        <>
          {/* Pending means the invitation is unaccepted, which is exactly when a
              wrong address matters most — the mail went nowhere. */}
          {!instructor.active && (
            <Alert tone="warning">
              This account has not been activated yet. If you correct the email, resend the
              invitation from the Invitations page so the onboarding mail reaches the new address.
            </Alert>
          )}

          <InstructorForm
            isEdit
            defaultValues={toInstructorFormValues(instructor)}
            onSubmit={handleSubmit}
            onCancel={() => navigate(ROUTES.INSTRUCTORS)}
            submitLabel="Save changes"
            error={submitError}
          />
        </>
      )}
    </PageContainer>
  );
};

export default EditInstructorPage;
