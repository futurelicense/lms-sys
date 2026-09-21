import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, User, BookOpen, Clock, CheckCircle2,
  XCircle, AlertCircle, ChevronRight, RefreshCw,
} from 'lucide-react';
import { useState } from 'react';
import Spinner from '../../../components/common/Spinner';
import AdminButton from '../../../components/ui/AdminButton';
import { AdminConfirmModal } from '../../../components/ui/AdminModal';
import { useAdminEnrollment, useUpdateAdminEnrollmentStatus } from '../hooks/useEnrollments';
import { ROUTES } from '../../../constants/routes';
import { formatDateTime } from '../../../utils/dateUtils';
import { useToast } from '../../../components/feedback/Toast';

const STATUS_STYLES = {
  ACTIVE:    { bg: 'rgba(40,199,111,0.12)',  color: '#28c76f', icon: CheckCircle2 },
  INACTIVE:  { bg: 'rgba(234,84,85,0.12)',   color: '#ea5455', icon: XCircle },
  COMPLETED: { bg: 'rgba(0,207,232,0.12)',   color: '#00cfe8', icon: CheckCircle2 },
  PENDING:   { bg: 'rgba(255,159,67,0.12)',  color: '#ff9f43', icon: AlertCircle },
};

function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.PENDING;
  const Icon = s.icon;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      background: s.bg, color: s.color,
      padding: '4px 12px', borderRadius: 999, fontSize: 13, fontWeight: 700,
    }}>
      <Icon size={13} /> {status}
    </span>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border-subtle)' }}>
      <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 600, textAlign: 'right', maxWidth: '60%' }}>{value ?? '—'}</span>
    </div>
  );
}

function SectionCard({ title, icon: Icon, children }) {
  return (
    <div style={{ background: 'var(--lms-card)', border: '1px solid var(--border-color)', borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 20px', borderBottom: '1px solid var(--border-color)', background: 'var(--surface-medium)' }}>
        <Icon size={16} style={{ color: 'var(--text-muted)' }} />
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{title}</h3>
      </div>
      <div style={{ padding: '0 20px' }}>{children}</div>
    </div>
  );
}

export const EnrollmentDetailsPage = () => {
  const { enrollmentId } = useParams();
  
  const { success: toastSuccess, error: toastError } = useToast();
  const [confirmStatus, setConfirmStatus] = useState(null); // 'ACTIVE' | 'INACTIVE'

  const { data: raw, isLoading, error, refetch } = useAdminEnrollment(enrollmentId);
  const updateStatus = useUpdateAdminEnrollmentStatus();

  // backend wraps in ApiResponse: { data: EnrollmentResponse }
  const enrollment = raw?.data ?? raw;

  const handleStatusChange = async () => {
    try {
      await updateStatus.mutateAsync({ id: enrollmentId, status: confirmStatus });
      toastSuccess(`Enrollment ${confirmStatus === 'ACTIVE' ? 'activated' : 'deactivated'}.`);
      setConfirmStatus(null);
      refetch();
    } catch (err) {
      toastError(err?.response?.data?.message ?? err?.message ?? 'Failed to update status.');
      setConfirmStatus(null);
    }
  };

  if (isLoading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 64 }}>
      <Spinner />
    </div>
  );

  if (error || !enrollment) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: 64, textAlign: 'center' }}>
      <XCircle size={40} style={{ color: '#ea5455' }} />
      <p style={{ margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>
        {error?.message ?? 'Enrollment not found.'}
      </p>
      <AdminButton variant="outline" icon={<RefreshCw size={14} />} onClick={refetch}>Retry</AdminButton>
    </div>
  );

  const isActive = enrollment.status === 'ACTIVE';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Breadcrumb + header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
          <Link to={ROUTES.ENROLLMENTS} style={{ color: 'var(--text-muted)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
            <ArrowLeft size={14} /> Enrollments
          </Link>
          <ChevronRight size={12} />
          <span style={{ color: 'var(--text-primary)' }}>Enrollment Details</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.4px' }}>
              Enrollment Details
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--text-muted)' }}>
              ID: <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{enrollmentId}</span>
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <AdminButton variant="outline" icon={<RefreshCw size={14} />} onClick={refetch}>
              Refresh
            </AdminButton>
            {isActive ? (
              <AdminButton variant="danger" onClick={() => setConfirmStatus('INACTIVE')}>
                Deactivate
              </AdminButton>
            ) : (
              <AdminButton variant="success" onClick={() => setConfirmStatus('ACTIVE')}>
                Activate
              </AdminButton>
            )}
          </div>
        </div>
      </div>

      {/* Status banner */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 20px', borderRadius: 12,
        background: STATUS_STYLES[enrollment.status]?.bg ?? 'var(--surface-medium)',
        border: `1px solid ${STATUS_STYLES[enrollment.status]?.color ?? 'var(--border-color)'}22`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Current Status</span>
          <StatusBadge status={enrollment.status} />
        </div>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          Enrolled {formatDateTime(enrollment.enrolledAt)}
        </span>
      </div>

      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>

        {/* Student */}
        <SectionCard title="Student" icon={User}>
          <InfoRow label="Full Name" value={enrollment.student?.fullName} />
          <InfoRow label="Email" value={enrollment.student?.email} />
          <InfoRow label="Student ID" value={
            enrollment.student?.id
              ? <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{String(enrollment.student.id).slice(0, 8)}…</span>
              : null
          } />
        </SectionCard>

        {/* Course */}
        <SectionCard title="Course" icon={BookOpen}>
          <InfoRow label="Course Title" value={enrollment.course?.title} />
          <InfoRow label="Course ID" value={
            enrollment.course?.id
              ? <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{String(enrollment.course.id).slice(0, 8)}…</span>
              : null
          } />
          <InfoRow label="Instructor ID" value={
            enrollment.course?.instructorId
              ? <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{String(enrollment.course.instructorId).slice(0, 8)}…</span>
              : null
          } />
        </SectionCard>

        {/* Timeline */}
        <SectionCard title="Timeline" icon={Clock}>
          <InfoRow label="Enrolled At"     value={formatDateTime(enrollment.enrolledAt)} />
          <InfoRow label="Started At"      value={formatDateTime(enrollment.startedAt)} />
          <InfoRow label="Last Accessed"   value={formatDateTime(enrollment.lastAccessedAt)} />
          <InfoRow label="Completed At"    value={formatDateTime(enrollment.completedAt)} />
        </SectionCard>

      </div>

      {/* Confirm modal */}
      {confirmStatus && (
        <AdminConfirmModal
          open
          title={confirmStatus === 'ACTIVE' ? 'Activate Enrollment' : 'Deactivate Enrollment'}
          message={
            confirmStatus === 'ACTIVE'
              ? 'The student will regain access to this course.'
              : 'The student will lose access to this course. Their progress is preserved.'
          }
          confirmLabel={confirmStatus === 'ACTIVE' ? 'Activate' : 'Deactivate'}
          variant={confirmStatus === 'INACTIVE' ? 'danger' : 'success'}
          loading={updateStatus.isPending}
          onConfirm={handleStatusChange}
          onClose={() => setConfirmStatus(null)}
        />
      )}
    </div>
  );
};

export default EnrollmentDetailsPage;
