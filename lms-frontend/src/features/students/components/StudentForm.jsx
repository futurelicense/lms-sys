import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Input from '../../../components/common/Input';
import Select from '../../../components/common/Select';
import Button from '../../../components/common/Button';
import Card from '../../../components/common/Card';
import Alert from '../../../components/feedback/Alert';
import EmptyState from '../../../components/common/EmptyState';
import { studentSchema } from '../validation/studentSchemas';
import PhotoUploadField from '../../../components/common/PhotoUploadField';
import { GENDER_OPTIONS, ID_PROOF_OPTIONS } from '../../../constants/personConstants';
import { ENROLMENT_STATUS, ENROLMENT_STATUS_OPTIONS } from '../constants/studentConstants';
import studentService from '../services/studentService';
import styles from './StudentForm.module.css';

const EMPTY_STUDENT = {
  fullName: '',
  email: '',
  phone: '',
  registrationNo: '',
  dateOfBirth: '',
  gender: '',
  admissionDate: new Date().toISOString().slice(0, 10),
  photoKey: '',
  highestQualification: '',
  institution: '',
  yearOfCompletion: '',
  employer: '',
  workExperienceYears: '',
  address: { line1: '', line2: '', city: '', state: '', country: '', postalCode: '' },
  idProofType: '',
  idProofNumber: '',
  emergencyContact: { name: '', relation: '', phone: '', email: '' },
  enrolments: [],
};

export const StudentForm = ({
  defaultValues = EMPTY_STUDENT,
  referenceData,
  onSubmit,
  onCancel,
  submitLabel = 'Save learner',
  error = null,
  isEdit = false,
  enrolledBatches = [],
}) => {
  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(studentSchema),
    defaultValues: { ...EMPTY_STUDENT, ...defaultValues },
  });

  const fullName = watch('fullName');

  const { fields, append, remove } = useFieldArray({ control, name: 'enrolments' });

  // Reference data only lists batches open for enrolment. A learner already in a
  // completed or cancelled batch would otherwise face a blank select and lose that
  // enrolment on save, so their current batches are merged back in.
  const openBatches = referenceData?.batches ?? [];
  const openIds = new Set(openBatches.map((batch) => batch.id));

  const batchOptions = [
    ...openBatches.map((batch) => ({
      value: batch.id,
      label: batch.capacity
        ? `${batch.code} — ${batch.name} (${batch.enrolledCount}/${batch.capacity})`
        : `${batch.code} — ${batch.name}`,
    })),
    ...enrolledBatches
      .filter((batch) => !openIds.has(batch.batchId))
      .map((batch) => ({
        value: batch.batchId,
        label: `${batch.batchCode} — ${batch.batchName} (${batch.batchStatus.toLowerCase()})`,
      })),
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className={styles.form}>
      {error && <Alert tone="error">{error.message}</Alert>}

      <Card
        title="Personal Info"
        subtitle="Identity credentials, contact details, and admission record"
      >
        <div className={styles.personalInfoSection}>
          <Controller
            name="photoKey"
            control={control}
            render={({ field, fieldState }) => (
              <PhotoUploadField
                label="Learner Photo"
                name={fullName || defaultValues?.fullName}
                value={field.value}
                initialUrl={defaultValues?.photoUrl}
                onChange={field.onChange}
                onUpload={studentService.uploadPhoto}
                error={fieldState.error?.message}
              />
            )}
          />

          <div className={styles.formDivider} />

          <div className={styles.fieldsStack}>
            {/* Primary Student Identification */}
            <div className={styles.rowTwoCols}>
              <Input
                label="Full Name"
                required
                placeholder="Enter full name"
                error={errors.fullName?.message}
                {...register('fullName')}
              />
              <Input
                label="Registration No"
                required
                readOnly={isEdit}
                placeholder="Enter registration number"
                hint={isEdit ? 'Fixed at admission' : undefined}
                error={errors.registrationNo?.message}
                {...register('registrationNo')}
              />
            </div>

            {/* Contact Details */}
            <div className={styles.rowTwoCols}>
              <Input
                label="Email"
                type="email"
                required
                placeholder="Enter email address"
                hint={
                  isEdit
                    ? 'This is the sign-in address. Resend the invitation after changing it.'
                    : 'Onboarding details are sent here'
                }
                error={errors.email?.message}
                {...register('email')}
              />
              <Input
                label="Phone"
                required
                placeholder="Enter phone number"
                error={errors.phone?.message}
                {...register('phone')}
              />
            </div>

            {/* Demographics & Admission */}
            <div className={styles.rowThreeCols}>
              <Input
                label="Date Of Birth"
                type="date"
                required
                error={errors.dateOfBirth?.message}
                {...register('dateOfBirth')}
              />
              <Select
                label="Gender"
                placeholder="Select gender"
                options={GENDER_OPTIONS}
                error={errors.gender?.message}
                {...register('gender')}
              />
              <Input
                label="Admission Date"
                type="date"
                error={errors.admissionDate?.message}
                {...register('admissionDate')}
              />
            </div>
          </div>
        </div>
      </Card>

      <Card title="Education & Work">
        <div className={styles.grid}>
          <Input
            label="Highest Qualification"
            placeholder="e.g. B.Sc Computer Science"
            error={errors.highestQualification?.message}
            {...register('highestQualification')}
          />
          <Input
            label="Institution"
            placeholder="College or university"
            error={errors.institution?.message}
            {...register('institution')}
          />
          <Input
            label="Year Of Completion"
            type="number"
            placeholder="e.g. 2024"
            error={errors.yearOfCompletion?.message}
            {...register('yearOfCompletion')}
          />
          <Input
            label="Current Employer"
            placeholder="Leave blank if not working"
            error={errors.employer?.message}
            {...register('employer')}
          />
          <Input
            label="Work Experience (years)"
            type="number"
            step="0.5"
            min="0"
            placeholder="e.g. 2.5"
            error={errors.workExperienceYears?.message}
            {...register('workExperienceYears')}
          />
        </div>
      </Card>

      <Card title="Address & Identity">
        <div className={styles.grid}>
          <Input
            label="Address Line 1"
            className={styles.span2}
            placeholder="House / street"
            error={errors.address?.line1?.message}
            {...register('address.line1')}
          />
          <Input
            label="Address Line 2"
            className={styles.span2}
            placeholder="Area / landmark"
            error={errors.address?.line2?.message}
            {...register('address.line2')}
          />

          <Input label="City" error={errors.address?.city?.message} {...register('address.city')} />
          <Input
            label="State"
            error={errors.address?.state?.message}
            {...register('address.state')}
          />
          <Input
            label="Country"
            error={errors.address?.country?.message}
            {...register('address.country')}
          />
          <Input
            label="Postal Code"
            error={errors.address?.postalCode?.message}
            {...register('address.postalCode')}
          />

          <Select
            label="ID Proof Type"
            placeholder="Select ID type"
            options={ID_PROOF_OPTIONS}
            error={errors.idProofType?.message}
            {...register('idProofType')}
          />
          <Input
            label="ID Proof Number"
            placeholder="Enter ID number"
            error={errors.idProofNumber?.message}
            {...register('idProofNumber')}
          />
        </div>
      </Card>

      <Card title="Emergency Contact">
        <div className={styles.grid}>
          <Input
            label="Contact Name"
            placeholder="Who should we call"
            error={errors.emergencyContact?.name?.message}
            {...register('emergencyContact.name')}
          />
          <Input
            label="Relationship"
            placeholder="e.g. Spouse, Parent, Friend"
            error={errors.emergencyContact?.relation?.message}
            {...register('emergencyContact.relation')}
          />
          <Input
            label="Contact Phone"
            placeholder="Enter phone number"
            error={errors.emergencyContact?.phone?.message}
            {...register('emergencyContact.phone')}
          />
          <Input
            label="Contact Email"
            type="email"
            placeholder="Enter email address"
            error={errors.emergencyContact?.email?.message}
            {...register('emergencyContact.email')}
          />
        </div>
      </Card>

      <Card
        title="Batches"
        actions={
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={batchOptions.length === 0}
            onClick={() => append({ batchId: '', status: ENROLMENT_STATUS.ACTIVE })}
          >
            Add batch
          </Button>
        }
      >
        {batchOptions.length === 0 && (
          <EmptyState
            title="No open batches"
            description="Schedule a batch first, then enrol learners into it. A learner can be saved without one and enrolled later."
          />
        )}

        {batchOptions.length > 0 && fields.length === 0 && (
          <p className="u-text-sm u-text-muted">
            Not enrolled in any batch yet. A learner can be added now and enrolled later.
          </p>
        )}

        {fields.map((field, index) => (
          <div className={styles.enrolmentRow} key={field.id}>
            <Select
              label="Batch"
              placeholder="Select a batch"
              options={batchOptions}
              error={errors.enrolments?.[index]?.batchId?.message}
              {...register(`enrolments.${index}.batchId`)}
            />
            <Select
              label="Status"
              options={ENROLMENT_STATUS_OPTIONS}
              error={errors.enrolments?.[index]?.status?.message}
              {...register(`enrolments.${index}.status`)}
            />
            <Button
              type="button"
              variant="ghost"
              className={styles.removeEnrolment}
              onClick={() => remove(index)}
            >
              Remove
            </Button>
          </div>
        ))}
      </Card>

      <div className={styles.actions}>
        <Button type="submit" isLoading={isSubmitting}>
          {submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
};

export default StudentForm;
