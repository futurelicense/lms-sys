import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Input from '../../../components/common/Input';
import TextArea from '../../../components/common/TextArea';
import Select from '../../../components/common/Select';
import Button from '../../../components/common/Button';
import Card from '../../../components/common/Card';
import Alert from '../../../components/feedback/Alert';
import PhotoUploadField from '../../../components/common/PhotoUploadField';
import { GENDER_OPTIONS, ID_PROOF_OPTIONS } from '../../../constants/personConstants';
import { instructorSchema } from '../validation/instructorSchemas';
import { EMPLOYMENT_TYPE_OPTIONS } from '../constants/instructorConstants';
import instructorService from '../services/instructorService';
import styles from './InstructorForm.module.css';

const EMPTY_INSTRUCTOR = {
  fullName: '',
  email: '',
  phone: '',
  employeeCode: '',
  dateOfBirth: '',
  gender: '',
  joiningDate: new Date().toISOString().slice(0, 10),
  employmentType: 'FULL_TIME',
  photoKey: '',
  specialization: '',
  yearsOfExperience: '',
  bio: '',
  highestQualification: '',
  institution: '',
  yearOfCompletion: '',
  address: { line1: '', line2: '', city: '', state: '', country: '', postalCode: '' },
  idProofType: '',
  idProofNumber: '',
  emergencyContact: { name: '', relation: '', phone: '', email: '' },
};

export const InstructorForm = ({
  defaultValues = EMPTY_INSTRUCTOR,
  onSubmit,
  onCancel,
  submitLabel = 'Save instructor',
  error = null,
  isEdit = false,
}) => {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(instructorSchema),
    defaultValues: { ...EMPTY_INSTRUCTOR, ...defaultValues },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className={styles.form}>
      {error && <Alert tone="error">{error.message}</Alert>}

      <Card title="Personal Info">
        <div className={styles.grid}>
          <Input
            label="Full Name"
            required
            placeholder="Enter full name"
            error={errors.fullName?.message}
            {...register('fullName')}
          />
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
          <Input
            label="Employee Code"
            required
            readOnly={isEdit}
            placeholder="Enter employee code"
            hint={isEdit ? 'Fixed at onboarding' : undefined}
            error={errors.employeeCode?.message}
            {...register('employeeCode')}
          />

          <Input
            label="Date Of Birth"
            type="date"
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
            label="Joining Date"
            type="date"
            error={errors.joiningDate?.message}
            {...register('joiningDate')}
          />
          <Select
            label="Employment Type"
            placeholder=""
            options={EMPLOYMENT_TYPE_OPTIONS}
            error={errors.employmentType?.message}
            {...register('employmentType')}
          />

          <Controller
            name="photoKey"
            control={control}
            render={({ field, fieldState }) => (
              <PhotoUploadField
                label="Instructor Photo"
                value={field.value}
                onChange={field.onChange}
                onUpload={instructorService.uploadPhoto}
                error={fieldState.error?.message}
              />
            )}
          />
        </div>
      </Card>

      <Card title="Teaching">
        <div className={styles.grid}>
          <Input
            label="Specialization"
            className={styles.span2}
            placeholder="e.g. Java, Spring Boot, System Design"
            error={errors.specialization?.message}
            {...register('specialization')}
          />
          <Input
            label="Years Of Experience"
            type="number"
            step="0.5"
            min="0"
            placeholder="e.g. 7.5"
            error={errors.yearsOfExperience?.message}
            {...register('yearsOfExperience')}
          />
        </div>

        <TextArea
          label="Bio"
          rows={4}
          className="u-mt-2"
          placeholder="Short profile shown alongside their batches"
          error={errors.bio?.message}
          {...register('bio')}
        />
      </Card>

      <Card title="Education">
        <div className={styles.grid}>
          <Input
            label="Highest Qualification"
            placeholder="e.g. M.Tech Computer Science"
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
            placeholder="e.g. 2015"
            error={errors.yearOfCompletion?.message}
            {...register('yearOfCompletion')}
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

export default InstructorForm;
