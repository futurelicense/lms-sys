import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  MoreVertical, Eye, Edit2, Rocket, Undo2, XCircle,
  ArchiveIcon, Trash2, FileQuestion,
} from 'lucide-react';
import DataTable from '../../../components/common/DataTable';
import { ROUTES } from '../../../constants/routes';
import { formatDate, formatDuration } from '../../../utils/dateUtils';
import { ASSESSMENT_STATUS } from '../constants/assessmentConstants';
import AssessmentStatusBadge from './AssessmentStatusBadge';

/* ── Dropdown menu item ───────────────────────────────── */
const MenuItem = ({ icon, label, onClick, danger = false }) => (
  <button
    onClick={(e) => { e.stopPropagation(); onClick(); }}
    style={{
      display: 'flex', width: '100%', alignItems: 'center', gap: 10,
      padding: '8px 14px', fontSize: 13, textAlign: 'left',
      background: 'transparent', border: 'none', cursor: 'pointer',
      color: danger ? '#ef4444' : 'var(--color-text)',
      fontWeight: 500,
    }}
    onMouseEnter={e => e.currentTarget.style.background = danger ? 'rgba(239,68,68,0.08)' : 'var(--color-surface-alt)'}
    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
  >
    {icon}
    {label}
  </button>
);

/* ── Divider ──────────────────────────────────────────── */
const MenuDivider = () => (
  <div style={{ margin: '4px 0', borderTop: '1px solid var(--color-border)' }} />
);

/* ── Actions cell with dropdown ───────────────────────── */
const ActionsCell = ({ assessment, openId, setOpenId, onAction }) => {
  const ref = useRef(null);
  const isOpen = openId === assessment.id;

  const status = assessment.status;
  const isDraft     = status === ASSESSMENT_STATUS.DRAFT;
  const isPublished = status === ASSESSMENT_STATUS.PUBLISHED;
  const isClosed    = status === ASSESSMENT_STATUS.CLOSED;
  const isArchived  = status === ASSESSMENT_STATUS.ARCHIVED;

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpenId(null); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen, setOpenId]);

  const act = (type) => { setOpenId(null); onAction(type, assessment); };

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpenId(isOpen ? null : assessment.id); }}
        style={{
          background: 'transparent', border: '1px solid transparent',
          borderRadius: 6, cursor: 'pointer', color: 'var(--color-text-muted)',
          padding: 6, display: 'flex', alignItems: 'center',
          transition: 'background 0.15s ease',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-surface-alt)'; e.currentTarget.style.borderColor = 'var(--color-border)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; }}
        aria-label="Assessment actions"
      >
        <MoreVertical size={16} />
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute', right: 0, top: 36, zIndex: 50,
          width: 200, borderRadius: 10,
          border: '1px solid var(--color-border)',
          background: 'var(--color-surface)',
          padding: '4px 0',
          boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
        }}>
          {/* Always: View details */}
          <MenuItem
            icon={<Eye size={14} />}
            label="View Details"
            onClick={() => act('view')}
          />

          {/* Draft: Edit, Publish, Delete */}
          {isDraft && (
            <>
              <MenuItem
                icon={<Edit2 size={14} />}
                label="Edit Assessment"
                onClick={() => act('edit')}
              />
              <MenuItem
                icon={<FileQuestion size={14} />}
                label="Edit Questions"
                onClick={() => act('questions')}
              />
              <MenuDivider />
              <MenuItem
                icon={<Rocket size={14} />}
                label="Publish"
                onClick={() => act('publish')}
              />
              <MenuDivider />
              <MenuItem
                icon={<Trash2 size={14} />}
                label="Delete"
                onClick={() => act('delete')}
                danger
              />
            </>
          )}

          {/* Published: Unpublish, Close */}
          {isPublished && (
            <>
              <MenuDivider />
              <MenuItem
                icon={<Edit2 size={14} />}
                label="Edit Assessment"
                onClick={() => act('edit')}
              />
              <MenuItem
                icon={<FileQuestion size={14} />}
                label="Edit Questions"
                onClick={() => act('questions')}
              />
              <MenuDivider />
              <MenuItem
                icon={<Undo2 size={14} />}
                label="Unpublish (→ Draft)"
                onClick={() => act('unpublish')}
              />
              <MenuItem
                icon={<XCircle size={14} />}
                label="Close"
                onClick={() => act('close')}
                danger
              />
            </>
          )}

          {/* Closed: Archive */}
          {isClosed && (
            <>
              <MenuDivider />
              <MenuItem
                icon={<ArchiveIcon size={14} />}
                label="Archive"
                onClick={() => act('archive')}
              />
            </>
          )}

          {/* Any non-archived: Archive shortcut */}
          {!isArchived && !isClosed && (
            <>
              <MenuDivider />
              <MenuItem
                icon={<ArchiveIcon size={14} />}
                label="Archive"
                onClick={() => act('archive')}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
};

/* ── Main component ───────────────────────────────────── */
export const AssessmentTable = ({ onAction, ...rest }) => {
  const [openId, setOpenId] = useState(null);

  const columns = [
    {
      key: 'title',
      header: 'Assessment',
      sortable: true,
      render: (a) => (
        <Link
          to={ROUTES.ADMIN_ASSESSMENT_DETAILS(a.id)}
          style={{ color: 'var(--color-primary-500)', fontWeight: 600, textDecoration: 'none' }}
          onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
          onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
        >
          {a.title}
        </Link>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (a) => <AssessmentStatusBadge status={a.status} />,
    },
    {
      key: 'questionCount',
      header: 'Questions',
      render: (a) => a.questionCount ?? 0,
    },
    {
      key: 'totalMarks',
      header: 'Total Score',
      render: (a) => `${a.totalMarks ?? 0}%`,
    },
    {
      key: 'durationMinutes',
      header: 'Duration',
      render: (a) => formatDuration((a.durationMinutes ?? 0) * 60),
    },
    {
      key: 'updatedAt',
      header: 'Updated',
      sortable: true,
      render: (a) => formatDate(a.updatedAt),
    },
    {
      key: 'actions',
      header: '',
      width: '48px',
      render: (a) => (
        <ActionsCell
          assessment={a}
          openId={openId}
          setOpenId={setOpenId}
          onAction={onAction}
        />
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      emptyTitle="No assessments yet"
      emptyDescription="Create your first assessment to get started."
      {...rest}
    />
  );
};

export default AssessmentTable;
