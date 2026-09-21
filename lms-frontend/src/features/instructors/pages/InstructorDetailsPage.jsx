import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Pencil, Ban, RotateCcw } from 'lucide-react';
import PageContainer from '../../../components/layout/PageContainer';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Badge from '../../../components/common/Badge';
import Spinner from '../../../components/common/Spinner';
import ErrorState from '../../../components/common/ErrorState';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import { useToast } from '../../../components/feedback/Toast';
import {
  DASH,
  Fact,
  Field,
  addressLines,
  formatDate,
  initials,
  recordDetailStyles as styles,
} from '../../../components/common/RecordDetail';
import { useInstructor, useSuspendInstructor } from '../hooks/useInstructors';
import { EMPLOYMENT_TYPE_LABEL, EMPLOYMENT_TYPE_TONE } from '../constants/instructorConstants';
import { ROUTES } from '../../../constants/routes';

export const InstructorDetailsPage = () => {
  const { instructorId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const { data: instructor, isLoading, error, refetch } = useInstructor(instructorId);
  const { mutateAsync: setSuspended, isPending } = useSuspendInstructor(instructorId);
  const [confirming, setConfirming] = useState(false);

  const onToggleSuspend = async () => {
    const suspend = !instructor.locked;
    await setSuspended({ userId: instructor.userId, suspend });
    setConfirming(false);
    toast.success(
      suspend ? `${instructor.fullName} suspended` : `${instructor.fullName} reinstated`,
    );
  };

  const accountBadge = () => {
    if (instructor.locked) return <Badge tone="danger">Suspended</Badge>;
    if (!instructor.active) return <Badge tone="neutral">Pending</Badge>;
    return <Badge tone="success">Active</Badge>;
  };

  return (
    <PageContainer
      title="Instructor Details"
      breadcrumbs={[
        { label: 'Dashboard', to: ROUTES.ROOT },
        { label: 'Instructors', to: ROUTES.INSTRUCTORS },
        { label: instructor ? instructor.employeeCode : 'Details' },
      ]}
    >
      {isLoading && <Spinner />}
      {error && (
        <ErrorState title="Could not load the instructor" error={error} onRetry={refetch} />
      )}

      {instructor && (
        <div className={styles.page}>
          <Card>
            <div className={styles.summary}>
              <div className={styles.identity}>
                {instructor.photoUrl ? (
                  <img className={styles.avatar} src={instructor.photoUrl} alt="" />
                ) : (
                  <div className={`${styles.avatar} ${styles.avatarFallback}`} aria-hidden="true">
                    {initials(instructor.fullName)}
                  </div>
                )}

                <h3 className={styles.name}>{instructor.fullName}</h3>
                <div className={styles.regNo}>
                  Employee Code: <strong>{instructor.employeeCode}</strong>
                </div>

                <div className={styles.identityActions}>
                  <Button
                    variant={instructor.locked ? 'secondary' : 'danger'}
                    size="sm"
                    leftIcon={
                      instructor.locked ? (
                        <RotateCcw className="h-4 w-4" />
                      ) : (
                        <Ban className="h-4 w-4" />
                      )
                    }
                    onClick={() => setConfirming(true)}
                  >
                    {instructor.locked ? 'Reinstate' : 'Suspend'}
                  </Button>
                  <Button
                    size="sm"
                    leftIcon={<Pencil className="h-4 w-4" />}
                    onClick={() => navigate(ROUTES.INSTRUCTOR_EDIT(instructor.id))}
                  >
                    Edit
                  </Button>
                </div>
              </div>

              <div>
                <div className="u-flex u-justify-between u-items-center u-mb-4">
                  <h4 style={{ margin: 0 }}>Personal Info</h4>
                  {accountBadge()}
                </div>

                <dl className={styles.facts}>
                  <Fact label="Engagement">
                    <Badge tone={EMPLOYMENT_TYPE_TONE[instructor.employmentType] ?? 'neutral'}>
                      {EMPLOYMENT_TYPE_LABEL[instructor.employmentType] ??
                        instructor.employmentType}
                    </Badge>
                  </Fact>
                  <Fact label="Specialization">{instructor.specialization}</Fact>
                  <Fact label="Experience">
                    {instructor.yearsOfExperience != null
                      ? `${instructor.yearsOfExperience} years`
                      : null}
                  </Fact>
                  <Fact label="Gender">{instructor.gender}</Fact>
                  <Fact label="Date Of Birth">{formatDate(instructor.dateOfBirth)}</Fact>
                  <Fact label="Joining Date">{formatDate(instructor.joiningDate)}</Fact>
                  <Fact label="Phone Number">{instructor.phone}</Fact>
                  <Fact label="Email">{instructor.email}</Fact>
                </dl>
              </div>
            </div>
          </Card>

          <Card title="Assigned Batches">
            {instructor.batches?.length ? (
              <div className="u-flex-col u-gap-3">
                {instructor.batches.map((batch) => (
                  <div className={styles.contactRow} key={batch.id}>
                    <div>
                      <div className={styles.contactName}>{batch.name}</div>
                      <div className={styles.contactMeta}>{batch.code}</div>
                    </div>
                    <Field
                      label="Runs"
                      value={
                        batch.endDate
                          ? `${formatDate(batch.startDate)} → ${formatDate(batch.endDate)}`
                          : `${formatDate(batch.startDate)} →`
                      }
                    />
                    <Field
                      label="Enrolled"
                      value={
                        batch.capacity
                          ? `${batch.enrolledCount} / ${batch.capacity}`
                          : String(batch.enrolledCount)
                      }
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p className={styles.empty}>Not assigned to any batch yet.</p>
            )}
          </Card>

          {instructor.bio && (
            <Card title="Bio">
              <p className={styles.contactMeta}>{instructor.bio}</p>
            </Card>
          )}

          <div className={styles.pair}>
            <Card title="Education">
              <dl className={styles.facts}>
                <Fact label="Qualification">{instructor.highestQualification}</Fact>
                <Fact label="Institution">{instructor.institution}</Fact>
                <Fact label="Completed">{instructor.yearOfCompletion}</Fact>
              </dl>
            </Card>

            <Card title="Address">
              {addressLines(instructor.address).length ? (
                <div className={styles.contactMeta}>
                  {addressLines(instructor.address).map((line) => (
                    <div key={line}>{line}</div>
                  ))}
                </div>
              ) : (
                <p className={styles.empty}>No address on record.</p>
              )}
            </Card>
          </div>

          <div className={styles.pair}>
            <Card title="Identity">
              <dl className={styles.facts}>
                <Fact label="ID Type">{instructor.idProofType?.replace(/_/g, ' ')}</Fact>
                <Fact label="ID Number">{instructor.idProofNumber}</Fact>
              </dl>
            </Card>

            <Card title="Emergency Contact">
              {instructor.emergencyContact?.name ? (
                <div className={styles.contactRow}>
                  <div>
                    <div className={styles.contactName}>{instructor.emergencyContact.name}</div>
                    <div className={styles.contactMeta}>
                      {instructor.emergencyContact.relation || DASH}
                    </div>
                  </div>
                  <Field label="Phone" value={instructor.emergencyContact.phone} />
                  <Field label="Email" value={instructor.emergencyContact.email} />
                </div>
              ) : (
                <p className={styles.empty}>No emergency contact on record.</p>
              )}
            </Card>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={confirming}
        title={instructor?.locked ? 'Reinstate this instructor?' : 'Suspend this instructor?'}
        message={
          instructor?.locked
            ? 'They will be able to sign in again immediately.'
            : 'They keep their batch assignments and records, but cannot sign in until reinstated.'
        }
        confirmLabel={instructor?.locked ? 'Reinstate' : 'Suspend'}
        isDestructive={!instructor?.locked}
        isLoading={isPending}
        onConfirm={onToggleSuspend}
        onCancel={() => setConfirming(false)}
      />
    </PageContainer>
  );
};

export default InstructorDetailsPage;
