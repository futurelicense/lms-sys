import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Input from '../../../components/common/Input';
import Button from '../../../components/common/Button';
import Alert from '../../../components/feedback/Alert';
import { forgotPasswordSchema } from '../validation/authSchemas';
import { AUTH_MESSAGES } from '../constants/authConstants';
import authService from '../services/authService';
import { normalizeError } from '../../../utils/errorUtils';

export const ForgotPasswordForm = () => {
  const [status, setStatus] = useState({ sent: false, error: null });
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(forgotPasswordSchema), defaultValues: { email: '' } });

  const onSubmit = async (values) => {
    try {
      await authService.forgotPassword(values);
      setStatus({ sent: true, error: null });
    } catch (error) {
      setStatus({ sent: false, error: normalizeError(error) });
    }
  };

  if (status.sent) return <Alert tone="success">{AUTH_MESSAGES.RESET_LINK_SENT}</Alert>;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="u-flex-col u-gap-4">
      {status.error && <Alert tone="error">{status.error.message}</Alert>}
      <Input
        label="Email"
        type="email"
        required
        error={errors.email?.message}
        {...register('email')}
      />
      <Button type="submit" fullWidth isLoading={isSubmitting}>
        Send reset link
      </Button>
    </form>
  );
};

export default ForgotPasswordForm;
