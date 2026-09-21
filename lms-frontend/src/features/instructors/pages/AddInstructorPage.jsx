import { useNavigate } from 'react-router-dom';
import PageContainer from '../../../components/layout/PageContainer';
import { useToast } from '../../../components/feedback/Toast';
import InstructorForm from '../components/InstructorForm';
import { useCreateInstructor } from '../hooks/useInstructors';
import { toCreateInstructorPayload } from '../validation/instructorSchemas';
import { ROUTES } from '../../../constants/routes';

export const AddInstructorPage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { mutateAsync, error } = useCreateInstructor();

  const handleSubmit = async (values) => {
    const instructor = await mutateAsync(toCreateInstructorPayload(values));
    toast.success(
      `${instructor.fullName} onboarded — onboarding email sent to ${instructor.email}`,
    );
    navigate(ROUTES.INSTRUCTORS);
  };

  return (
    <PageContainer
      title="Add New Instructor"
      breadcrumbs={[
        { label: 'Dashboard', to: ROUTES.ROOT },
        { label: 'Instructors', to: ROUTES.INSTRUCTORS },
        { label: 'Add New Instructor' },
      ]}
    >
      {/* No reference-data gate here: the instructor form's dropdowns are all
          enum-backed, so unlike the learner form there is nothing to wait for. */}
      <InstructorForm
        onSubmit={handleSubmit}
        onCancel={() => navigate(ROUTES.INSTRUCTORS)}
        submitLabel="Add instructor"
        error={error}
      />
    </PageContainer>
  );
};

export default AddInstructorPage;
