import PageContainer from '../../../components/layout/PageContainer';
import AnnouncementComposer from '../components/AnnouncementComposer';

export const AnnouncementsPage = () => {
  return (
    <PageContainer
      title="Announcements"
      subtitle="Create and manage broadcast announcements for your students."
    >
      <AnnouncementComposer />
    </PageContainer>
  );
};

export default AnnouncementsPage;
