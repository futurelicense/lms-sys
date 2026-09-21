import { useState } from 'react';
import { format } from 'date-fns';
import PageContainer from '../../../components/layout/PageContainer';
import DataTable from '../../../components/common/DataTable/DataTable';
import Button from '../../../components/common/Button/Button';
import Badge from '../../../components/common/Badge/Badge';
import { useInstructorEnrollments } from '../hooks/useEnrollments';
import EnrollmentFormModal from '../components/EnrollmentFormModal';

export const InstructorEnrollmentListPage = () => {
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data, isLoading } = useInstructorEnrollments({ page, size });
  const enrollments = data?.data?.content || [];
  const totalElements = data?.data?.page?.totalElements || 0;

  const columns = [
    {
      key: 'student',
      header: 'Student',
      accessor: (row) => row.student?.fullName || row.student?.email,
    },
    {
      key: 'course',
      header: 'Course',
      accessor: (row) => row.course?.title,
    },
    {
      key: 'status',
      header: 'Status',
      accessor: 'status',
      render: (status) => (
        <Badge variant={status === 'ACTIVE' ? 'success' : status === 'COMPLETED' ? 'info' : 'warning'}>
          {status}
        </Badge>
      ),
    },
    {
      key: 'enrolledAt',
      header: 'Enrolled At',
      accessor: 'enrolledAt',
      render: (date) => (date ? format(new Date(date), 'MMM d, yyyy') : '-'),
    },
  ];

  return (
    <PageContainer
      title="My Course Enrollments"
      subtitle="Manage enrollments for your courses."
      action={<Button onClick={() => setIsModalOpen(true)}>+ Enroll Student</Button>}
    >
      <DataTable
        columns={columns}
        rows={enrollments}
        isLoading={isLoading}
        pagination={{
          page,
          size,
          totalElements,
          onPageChange: setPage,
          onSizeChange: setSize,
        }}
      />
      <EnrollmentFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </PageContainer>
  );
};

export default InstructorEnrollmentListPage;
