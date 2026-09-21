import { Link, useParams } from 'react-router-dom';
import PageContainer from '../../../components/layout/PageContainer';
import Spinner from '../../../components/common/Spinner';
import ErrorState from '../../../components/common/ErrorState';
import UserCard from '../components/UserCard';
import { useUser } from '../hooks/useUsers';
import { ROUTES } from '../../../constants/routes';
import { formatDateTime } from '../../../utils/dateUtils';

export const UserDetailsPage = () => {
  const { userId } = useParams();
  const { data: user, isLoading, error, refetch } = useUser(userId);

  if (isLoading) return <Spinner fullPage />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  return (
    <PageContainer
      title={user.fullName}
      subtitle={user.jobTitle}
      breadcrumbs={[{ label: 'Users', to: ROUTES.USERS }, { label: user.fullName }]}
      actions={<Link to={ROUTES.USER_EDIT(userId)}>Edit user</Link>}
    >
      <UserCard user={user} />
      <p className="u-text-sm u-text-muted u-mt-4">
        Joined {formatDateTime(user.createdAt)} &middot; Last active{' '}
        {formatDateTime(user.lastLoginAt)}
      </p>
    </PageContainer>
  );
};

export default UserDetailsPage;
