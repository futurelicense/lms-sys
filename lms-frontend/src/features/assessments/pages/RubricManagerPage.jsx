import PageContainer from '../../../components/layout/PageContainer';
import RubricManager from '../components/RubricManager';

export const RubricManagerPage = () => {
  return (
    <PageContainer
      title="Grading Rubrics"
      subtitle="Define and manage evaluation criteria for grading student assessments"
    >
      <RubricManager />
    </PageContainer>
  );
};

export default RubricManagerPage;
