import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageContainer from '../../../components/layout/PageContainer';
import DataTable from '../../../components/common/DataTable';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import Select from '../../../components/common/Select';
import Badge from '../../../components/common/Badge';
import Pagination from '../../../components/common/Pagination';
import { useStudentReferenceData, useStudents } from '../hooks/useStudents';
import { ENROLMENT_STATUS_OPTIONS, ENROLMENT_STATUS_TONE } from '../constants/studentConstants';
import { ROUTES } from '../../../constants/routes';

const PAGE_SIZE = 20;

export const StudentListPage = () => {
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [batchId, setBatchId] = useState('');
  const [enrolmentStatus, setEnrolmentStatus] = useState('');
  const [page, setPage] = useState(0);

  const { data: referenceData } = useStudentReferenceData();
  const {
    data: pageData,
    isLoading,
    error,
    refetch,
  } = useStudents({ search, batchId, enrolmentStatus, page, size: PAGE_SIZE });

  // Any filter change invalidates the current page number.
  const onFilterChange = (setter) => (value) => {
    setter(value);
    setPage(0);
  };

  const columns = [
    { key: 'registrationNo', header: 'Reg. No' },
    { key: 'fullName', header: 'Name' },
    { key: 'email', header: 'Email' },
    {
      key: 'batches',
      header: 'Batches',
      render: (row) => {
        if (!row.enrolments?.length) return '—';
        return (
          <span className="u-flex u-gap-1 u-wrap">
            {row.enrolments.map((enrolment) => (
              <Badge key={enrolment.id} tone={ENROLMENT_STATUS_TONE[enrolment.status] ?? 'neutral'}>
                {enrolment.batchCode}
              </Badge>
            ))}
          </span>
        );
      },
    },
    { key: 'employer', header: 'Employer', render: (row) => row.employer || '—' },
    { key: 'phone', header: 'Phone', render: (row) => row.phone || '—' },
    {
      key: 'active',
      header: 'Account',
      render: (row) => (
        <Badge tone={row.active ? 'success' : 'neutral'}>{row.active ? 'Active' : 'Pending'}</Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={(event) => {
            // The row itself opens details, so the button must not do both.
            event.stopPropagation();
            navigate(ROUTES.STUDENT_EDIT(row.id));
          }}
        >
          Edit
        </Button>
      ),
    },
  ];

  return (
    <PageContainer
      title="Learners"
      subtitle="Every learner admitted to the centre."
      breadcrumbs={[{ label: 'Dashboard', to: ROUTES.ROOT }, { label: 'Learners' }]}
      actions={<Button onClick={() => navigate(ROUTES.STUDENT_CREATE)}>Add New Learner</Button>}
    >
      <div className="u-flex u-gap-3 u-wrap u-mb-4">
        <Input
          label="Search"
          placeholder="Name, email, registration no or employer"
          value={search}
          onChange={(event) => onFilterChange(setSearch)(event.target.value)}
        />
        <Select
          label="Batch"
          placeholder="All batches"
          options={(referenceData?.batches ?? []).map((batch) => ({
            value: batch.id,
            label: `${batch.code} — ${batch.name}`,
          }))}
          value={batchId}
          onChange={(event) => onFilterChange(setBatchId)(event.target.value)}
        />
        <Select
          label="Enrolment status"
          placeholder="Any status"
          options={ENROLMENT_STATUS_OPTIONS}
          value={enrolmentStatus}
          onChange={(event) => onFilterChange(setEnrolmentStatus)(event.target.value)}
        />
      </div>

      <DataTable
        columns={columns}
        rows={pageData?.content ?? []}
        isLoading={isLoading}
        error={error}
        onRetry={refetch}
        onRowClick={(row) => navigate(ROUTES.STUDENT_DETAILS(row.id))}
        emptyTitle="No learners yet"
        emptyDescription="Admit your first learner to see them here."
        emptyAction={
          <Button onClick={() => navigate(ROUTES.STUDENT_CREATE)}>Add New Learner</Button>
        }
      />

      {/* Pagination is 1-based; PageResponse.page is 0-based (Spring Pageable). */}
      {pageData && (
        <Pagination
          page={pageData.page + 1}
          pageSize={pageData.size}
          totalItems={pageData.totalElements}
          totalPages={pageData.totalPages}
          onPageChange={(next) => setPage(next - 1)}
        />
      )}
    </PageContainer>
  );
};

export default StudentListPage;
