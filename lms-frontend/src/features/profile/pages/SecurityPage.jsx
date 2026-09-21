import PageContainer from '../../../components/layout/PageContainer';
import Card from '../../../components/common/Card';
import ChangePasswordForm from '../components/ChangePasswordForm';
import ActiveSessionsCard from '../components/ActiveSessionsCard';

export const SecurityPage = () => (
  <PageContainer title="Account & Security" subtitle="Keep your account safe and manage active device logins.">
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Card title="Change Password" subtitle="Ensure your account is using a strong password.">
        <ChangePasswordForm />
      </Card>
      <ActiveSessionsCard />
    </div>
  </PageContainer>
);

export default SecurityPage;
