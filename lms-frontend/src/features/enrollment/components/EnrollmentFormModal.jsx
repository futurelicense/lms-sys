import { useState } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import Modal from '../../../components/common/Modal/Modal';
import Button from '../../../components/common/Button/Button';
import Select from '../../../components/common/Select/Select';
import { useUsers } from '../../users/hooks/useUsers';
import { useCourses, useMyCourses } from '../../courses/hooks/useCourses';
import { useCreateAdminEnrollment, useCreateInstructorEnrollment } from '../hooks/useEnrollments';

export const EnrollmentFormModal = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const isAdmin = user?.roles?.includes('ADMIN');

  const [studentId, setStudentId] = useState('');
  const [courseId, setCourseId] = useState('');

  // Fetch data
  const { data: usersData, isLoading: loadingUsers } = useUsers({ role: 'STUDENT', size: 100 });
  const { data: allCoursesData, isLoading: loadingAllCourses } = useCourses({ size: 100 });
  const { data: myCoursesData, isLoading: loadingMyCourses } = useMyCourses({ size: 100 });

  const students = usersData?.data?.content || [];
  const courses = isAdmin ? (allCoursesData?.data?.content || []) : (myCoursesData?.data?.content || []);
  const loadingCourses = isAdmin ? loadingAllCourses : loadingMyCourses;

  // Mutations
  const createAdmin = useCreateAdminEnrollment();
  const createInstructor = useCreateInstructorEnrollment();
  const isSubmitting = createAdmin.isPending || createInstructor.isPending;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!studentId || !courseId) return;

    const payload = { studentId, courseId };

    try {
      if (isAdmin) {
        await createAdmin.mutateAsync(payload);
      } else {
        await createInstructor.mutateAsync(payload);
      }
      setStudentId('');
      setCourseId('');
      onClose();
    } catch (err) {
      // Error handled in hook toast
    }
  };

  const footer = (
    <>
      <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
        Cancel
      </Button>
      <Button onClick={handleSubmit} disabled={isSubmitting || !studentId || !courseId} loading={isSubmitting}>
        Enroll Student
      </Button>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Enroll Student" footer={footer}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Select
          label="Student"
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          options={students.map((s) => ({ value: s.id, label: `${s.name} (${s.email})` }))}
          placeholder={loadingUsers ? 'Loading students...' : 'Select a student'}
          disabled={loadingUsers}
          required
        />
        <Select
          label="Course"
          value={courseId}
          onChange={(e) => setCourseId(e.target.value)}
          options={courses.map((c) => ({ value: c.id, label: c.title }))}
          placeholder={loadingCourses ? 'Loading courses...' : 'Select a course'}
          disabled={loadingCourses}
          required
        />
      </form>
    </Modal>
  );
};

export default EnrollmentFormModal;
