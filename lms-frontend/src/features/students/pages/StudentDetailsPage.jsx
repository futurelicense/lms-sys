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
import { useStudent, useSuspendStudent } from '../hooks/useStudents';
import { ENROLMENT_STATUS_TONE } from '../constants/studentConstants';
import { ROUTES } from '../../../constants/routes';
import {
  DASH,
  Fact,
  Field,
  addressLines,
  formatDate,
  initials,
  recordDetailStyles as styles,
} from '../../../components/common/RecordDetail';

export const StudentDetailsPage = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const { data: student, isLoading, error, refetch } = useStudent(studentId);
  const { mutateAsync: setSuspended, isPending } = useSuspendStudent(studentId);
  const [confirming, setConfirming] = useState(false);

  const onToggleSuspend = async () => {
    const suspend = !student.locked;
    await setSuspended({ userId: student.userId, suspend });
    setConfirming(false);
    toast.success(suspend ? `${student.fullName} suspended` : `${student.fullName} reinstated`);
  };

  const accountBadge = () => {
    if (student.locked) return <Badge tone="danger">Suspended</Badge>;
    if (!student.active) return <Badge tone="neutral">Pending</Badge>;
    return <Badge tone="success">Active</Badge>;
  };

  return (
    <PageContainer
      title="Learner Details"
      breadcrumbs={[
        { label: 'Dashboard', to: ROUTES.ROOT },
        { label: 'Learners', to: ROUTES.STUDENTS },
        { label: student ? student.registrationNo : 'Details' },
      ]}
    >
      {isLoading && <Spinner />}
      {error && <ErrorState title="Could not load the learner" error={error} onRetry={refetch} />}

      {student && (
        <div className={styles.page}>
          <Card>
            <div className={styles.summary}>
              <div className={styles.identity}>
                {student.photoUrl ? (
                  <img className={styles.avatar} src={student.photoUrl} alt="" />
                ) : (
                  <div className={`${styles.avatar} ${styles.avatarFallback}`} aria-hidden="true">
                    {initials(student.fullName)}
                  </div>
                )}

                <h3 className={styles.name}>{student.fullName}</h3>
                <div className={styles.regNo}>
                  Registration No: <strong>{student.registrationNo}</strong>
                </div>

                <div className={styles.identityActions}>
                  <Button
                    variant={student.locked ? 'secondary' : 'danger'}
                    size="sm"
                    leftIcon={
                      student.locked ? (
                        <RotateCcw className="h-4 w-4" />
                      ) : (
                        <Ban className="h-4 w-4" />
                      )
                    }
                    onClick={() => setConfirming(true)}
                  >
                    {student.locked ? 'Reinstate' : 'Suspend'}
                  </Button>
                  <Button
                    size="sm"
                    leftIcon={<Pencil className="h-4 w-4" />}
                    onClick={() => navigate(ROUTES.STUDENT_EDIT(student.id))}
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
                  <Fact label="Batches">
                    {student.enrolments?.length ? (
                      <span className="u-flex u-gap-1 u-wrap">
                        {student.enrolments.map((enrolment) => (
                          <Badge
                            key={enrolment.id}
                            tone={ENROLMENT_STATUS_TONE[enrolment.status] ?? 'neutral'}
                          >
                            {enrolment.batchCode}
                          </Badge>
                        ))}
                      </span>
                    ) : null}
                  </Fact>
                  <Fact label="Gender">{student.gender}</Fact>
                  <Fact label="Date Of Birth">{formatDate(student.dateOfBirth)}</Fact>
                  <Fact label="Admission Date">{formatDate(student.admissionDate)}</Fact>
                  <Fact label="Phone Number">{student.phone}</Fact>
                  <Fact label="Email">{student.email}</Fact>
                </dl>
              </div>
            </div>
          </Card>

          <Card title="Enrolments">
            {student.enrolments?.length ? (
              <div className="u-flex-col u-gap-3">
                {student.enrolments.map((enrolment) => (
                  <div className={styles.contactRow} key={enrolment.id}>
                    <div>
                      <div className={styles.contactName}>{enrolment.batchName}</div>
                      <div className={styles.contactMeta}>{enrolment.batchCode}</div>
                    </div>
                    <Field label="Enrolled On" value={formatDate(enrolment.enrolledOn)} />
                    <div>
                      <div className={styles.fieldLabel}>Status</div>
                      <Badge tone={ENROLMENT_STATUS_TONE[enrolment.status] ?? 'neutral'}>
                        {enrolment.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className={styles.empty}>Not enrolled in any batch yet.</p>
            )}
          </Card>

          <div className={styles.pair}>
            <Card title="Education & Work">
              <dl className={styles.facts}>
                <Fact label="Qualification">{student.highestQualification}</Fact>
                <Fact label="Institution">{student.institution}</Fact>
                <Fact label="Completed">{student.yearOfCompletion}</Fact>
                <Fact label="Employer">{student.employer}</Fact>
                <Fact label="Experience">
                  {student.workExperienceYears != null
                    ? `${student.workExperienceYears} years`
                    : null}
                </Fact>
              </dl>
            </Card>

            <Card title="Address">
              {addressLines(student.address).length ? (
                <div className={styles.contactMeta}>
                  {addressLines(student.address).map((line) => (
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
                <Fact label="ID Type">{student.idProofType?.replace(/_/g, ' ')}</Fact>
                <Fact label="ID Number">{student.idProofNumber}</Fact>
              </dl>
            </Card>

            <Card title="Emergency Contact">
              {student.emergencyContact?.name ? (
                <div className={styles.contactRow}>
                  <div>
                    <div className={styles.contactName}>{student.emergencyContact.name}</div>
                    <div className={styles.contactMeta}>
                      {student.emergencyContact.relation || DASH}
                    </div>
                  </div>
                  <Field label="Phone" value={student.emergencyContact.phone} />
                  <Field label="Email" value={student.emergencyContact.email} />
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
        title={student?.locked ? 'Reinstate this learner?' : 'Suspend this learner?'}
        message={
          student?.locked
            ? 'They will be able to sign in again immediately.'
            : 'They stay enrolled and keep their records, but cannot sign in until reinstated.'
        }
        confirmLabel={student?.locked ? 'Reinstate' : 'Suspend'}
        isDestructive={!student?.locked}
        isLoading={isPending}
        onConfirm={onToggleSuspend}
        onCancel={() => setConfirming(false)}
      />
    </PageContainer>
  );
};

export default StudentDetailsPage;
