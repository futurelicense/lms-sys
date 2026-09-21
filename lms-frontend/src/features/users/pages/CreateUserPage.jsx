import { useNavigate } from 'react-router-dom';
import PageContainer from '../../../components/layout/PageContainer';
import UserForm from '../components/UserForm';
import { useSaveUser } from '../hooks/useUsers';
import { useToast } from '../../../components/feedback/Toast';
import { ROUTES } from '../../../constants/routes';

export const CreateUserPage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { mutateAsync, error } = useSaveUser(null);

  const handleSubmit = async (values) => {
    await mutateAsync(values);
    toast.success('User created');
    navigate(ROUTES.USERS);
  };

  return (
    <PageContainer
      title="Add user"
      breadcrumbs={[{ label: 'Users', to: ROUTES.USERS }, { label: 'Add user' }]}
    >
      <UserForm onSubmit={handleSubmit} onCancel={() => navigate(ROUTES.USERS)} error={error} />
    </PageContainer>
  );
};

export default CreateUserPage;
