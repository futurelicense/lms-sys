import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Input from '../../../components/common/Input';
import Select from '../../../components/common/Select';
import Button from '../../../components/common/Button';
import Alert from '../../../components/feedback/Alert';
import { userSchema } from '../validation/userSchemas';
import { ROLES, ROLE_LABELS } from '../../../constants/roles';
import { USER_STATUS } from '../constants/userConstants';

const ROLE_OPTIONS = Object.values(ROLES).map((role) => ({
  value: role,
  label: ROLE_LABELS[role],
}));

const EMPTY_USER = {
  fullName: '',
  email: '',
  roles: [],
  status: USER_STATUS.INVITED,
  jobTitle: '',
};

export const UserForm = ({
  defaultValues = EMPTY_USER,
  onSubmit,
  onCancel,
  error = null,
  submitLabel = 'Save user',
}) => {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(userSchema), defaultValues });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="u-flex-col u-gap-4">
      {error && <Alert tone="error">{error.message}</Alert>}

      <Input
        label="Full name"
        required
        error={errors.fullName?.message}
        {...register('fullName')}
      />
      <Input
        label="Email"
        type="email"
        required
        error={errors.email?.message}
        {...register('email')}
      />
      <Input label="Job title" error={errors.jobTitle?.message} {...register('jobTitle')} />

      <Controller
        control={control}
        name="roles"
        render={({ field }) => (
          <Select
            label="Roles"
            multiple
            required
            options={ROLE_OPTIONS}
            placeholder=""
            error={errors.roles?.message}
            value={field.value}
            onChange={(event) =>
              field.onChange([...event.target.selectedOptions].map((option) => option.value))
            }
          />
        )}
      />

      <div className="u-flex u-gap-2">
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

export default UserForm;
