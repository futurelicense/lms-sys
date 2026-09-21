import { useNavigate, useParams } from 'react-router-dom';
import PageContainer from '../../../components/layout/PageContainer';
import Spinner from '../../../components/common/Spinner';
import ErrorState from '../../../components/common/ErrorState';
import UserForm from '../components/UserForm';
import { useUser, useSaveUser } from '../hooks/useUsers';
import { useToast } from '../../../components/feedback/Toast';
import { ROUTES } from '../../../constants/routes';

export const EditUserPage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { data: user, isLoading, error, refetch } = useUser(userId);
  const { mutateAsync, error: saveError } = useSaveUser(userId);

  if (isLoading) return <Spinner fullPage />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  const handleSubmit = async (values) => {
    await mutateAsync(values);
    toast.success('User updated');
    navigate(ROUTES.USER_DETAILS(userId));
  };

  return (
    <PageContainer
      title={`Edit: ${user.fullName}`}
      breadcrumbs={[
        { label: 'Users', to: ROUTES.USERS },
        { label: user.fullName },
        { label: 'Edit' },
      ]}
    >
      <UserForm
        defaultValues={user}
        onSubmit={handleSubmit}
        onCancel={() => navigate(-1)}
        error={saveError}
      />
    </PageContainer>
  );
};

export default EditUserPage;
