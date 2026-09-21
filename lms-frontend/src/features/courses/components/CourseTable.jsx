import { Link } from 'react-router-dom';
import { Trash2, Edit3, Copy } from 'lucide-react';
import DataTable from '../../../components/common/DataTable';
import { ROUTES } from '../../../constants/routes';
import { formatDate, formatDuration } from '../../../utils/dateUtils';
import CourseStatusBadge from './CourseStatusBadge';

export const CourseTable = ({ onDelete, onDuplicate, ...props }) => {
  const columns = [
    {
      key: 'title',
      header: 'Course',
      sortable: true,
      render: (course) => (
        <Link
          to={ROUTES.COURSE_DETAILS(course.id)}
          style={{ fontWeight: 600, color: 'var(--text-primary)' }}
        >
          {course.title}
        </Link>
      ),
    },
    { key: 'level', header: 'Level' },
    {
      key: 'status',
      header: 'Status',
      render: (course) => <CourseStatusBadge status={course.status} />,
    },
    { key: 'enrolledCount', header: 'Enrolled', sortable: true },
    {
      key: 'durationMinutes',
      header: 'Duration',
      render: (course) => formatDuration((course.durationMinutes ?? 0) * 60),
    },
    {
      key: 'updatedAt',
      header: 'Updated',
      sortable: true,
      render: (course) => formatDate(course.updatedAt),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (course) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Link
            to={ROUTES.COURSE_EDIT(course.id)}
            style={{
              padding: '5px 10px',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Edit3 size={12} />
            <span>Edit</span>
          </Link>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate?.(course);
            }}
            title="Duplicate Course"
            style={{
              padding: '5px 10px',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              border: '1px solid var(--border-color)',
              background: 'transparent',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-medium, rgba(255,255,255,0.05))'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            <Copy size={12} />
            <span>Duplicate</span>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.(course);
            }}
            title="Delete Course"
            style={{
              padding: '6px 8px',
              borderRadius: 6,
              border: '1px solid rgba(239, 68, 68, 0.3)',
              background: 'rgba(239, 68, 68, 0.08)',
              color: '#ef4444',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)'; }}
          >
            <Trash2 size={13} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      emptyTitle="No courses yet"
      emptyDescription="Create your first course to get started."
      {...props}
    />
  );
};

export default CourseTable;
