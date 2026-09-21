import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Input from '../../../components/common/Input';
import Select from '../../../components/common/Select';
import Button from '../../../components/common/Button';
import Alert from '../../../components/feedback/Alert';
import { batchSchema } from '../validation/batchSchemas';
import { BATCH_STATUS_OPTIONS, DELIVERY_MODE_OPTIONS } from '../../../constants/batchConstants';

const EMPTY_BATCH = {
  code: '',
  name: '',
  courseId: '',
  instructorId: '',
  startDate: new Date().toISOString().slice(0, 10),
  endDate: '',
  schedule: '',
  deliveryMode: 'OFFLINE',
  capacity: '',
  status: 'PLANNED',
};

/**
 * Create/edit form for a batch.
 *
 * <p>`courses` and `instructors` are passed in rather than fetched here so the
 * page can load them once and share them between the create and edit dialogs.
 */
export const BatchForm = ({
  defaultValues = EMPTY_BATCH,
  courses = [],
  instructors = [],
  onSubmit,
  onCancel,
  submitLabel = 'Save batch',
  error = null,
  isEdit = false,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(batchSchema),
    defaultValues: { ...EMPTY_BATCH, ...defaultValues },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="u-flex-col u-gap-3">
      {error && <Alert tone="error">{error.message}</Alert>}

      <Input
        label="Batch Code"
        required
        readOnly={isEdit}
        placeholder="e.g. FS-2026-01"
        hint={isEdit ? 'Fixed once the batch exists' : undefined}
        error={errors.code?.message}
        {...register('code')}
      />
      <Input
        label="Batch Name"
        required
        placeholder="e.g. Full-Stack Development — January"
        error={errors.name?.message}
        {...register('name')}
      />

      <div className="u-flex u-gap-3 u-wrap">
        <Select
          label="Course"
          placeholder="No course yet"
          options={courses.map((course) => ({ value: course.id, label: course.title }))}
          error={errors.courseId?.message}
          {...register('courseId')}
        />
        <Select
          label="Instructor"
          placeholder="Unassigned"
          options={instructors.map((instructor) => ({
            value: instructor.userId,
            label: instructor.specialization
              ? `${instructor.fullName} — ${instructor.specialization}`
              : instructor.fullName,
          }))}
          hint="Drives the Assigned Batches list on their profile"
          error={errors.instructorId?.message}
          {...register('instructorId')}
        />
      </div>

      <div className="u-flex u-gap-3 u-wrap">
        <Input
          label="Start Date"
          type="date"
          required
          error={errors.startDate?.message}
          {...register('startDate')}
        />
        <Input
          label="End Date"
          type="date"
          error={errors.endDate?.message}
          {...register('endDate')}
        />
      </div>

      <Input
        label="Schedule"
        placeholder="e.g. Mon-Fri 10:00-13:00"
        error={errors.schedule?.message}
        {...register('schedule')}
      />

      <div className="u-flex u-gap-3 u-wrap">
        <Select
          label="Delivery Mode"
          options={DELIVERY_MODE_OPTIONS}
          placeholder=""
          error={errors.deliveryMode?.message}
          {...register('deliveryMode')}
        />
        <Input
          label="Capacity"
          type="number"
          min="1"
          placeholder="Leave blank for no limit"
          hint={isEdit ? 'Cannot drop below the number already enrolled' : undefined}
          error={errors.capacity?.message}
          {...register('capacity')}
        />
        <Select
          label="Status"
          options={BATCH_STATUS_OPTIONS}
          placeholder=""
          error={errors.status?.message}
          {...register('status')}
        />
      </div>

      <div className="u-flex u-gap-2">
        <Button type="submit" isLoading={isSubmitting}>
          {submitLabel}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
};

export default BatchForm;
