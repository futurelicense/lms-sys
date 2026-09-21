import { z } from 'zod';
import { PASSWORD_POLICY } from '../../../utils/validationUtils';

const email = z.string().trim().min(1, 'Email is required').email('Enter a valid email address');

const password = z
  .string()
  .min(PASSWORD_POLICY.minLength, `At least ${PASSWORD_POLICY.minLength} characters`)
  .regex(/[A-Z]/, 'Include an uppercase letter')
  .regex(/[a-z]/, 'Include a lowercase letter')
  .regex(/[0-9]/, 'Include a number')
  .regex(/[^A-Za-z0-9]/, 'Include a symbol');

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Password is required'),
  tenantSlug: z.string().trim().optional(),
  rememberMe: z.boolean().optional().default(false),
});

export const forgotPasswordSchema = z.object({ email });

/** Used by ResetPasswordForm — field name MUST match backend ResetPasswordRequest.newPassword */
export const resetPasswordSchema = z
  .object({
    token: z.string().min(1),
    newPassword: password,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
