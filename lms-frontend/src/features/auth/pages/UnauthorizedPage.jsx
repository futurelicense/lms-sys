import { useNavigate } from 'react-router-dom';
import EmptyState from '../../../components/common/EmptyState';
import Button from '../../../components/common/Button';

export const UnauthorizedPage = () => {
  const navigate = useNavigate();

  return (
    <EmptyState
      title="403 - Access denied"
      description="You do not have permission to view this page. If you believe this is a mistake, contact your administrator."
      action={
        <Button variant="secondary" onClick={() => navigate(-1)}>
          Go back
        </Button>
      }
    />
  );
};

export default UnauthorizedPage;
