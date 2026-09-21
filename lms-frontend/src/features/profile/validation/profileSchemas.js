import { z } from 'zod';
import { PASSWORD_POLICY } from '../../../utils/validationUtils';

export const profileSchema = z.object({
  fullName: z.string().trim().min(2, 'Enter your full name'),
  phone: z.string().trim().max(20, 'Phone number is too long').optional().nullable(),
  jobTitle: z.string().trim().max(80).optional().nullable(),
  bio: z.string().trim().max(500, 'Keep your bio under 500 characters').optional().nullable(),
  timeZone: z.string().optional().nullable(),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Enter your current password'),
    newPassword: z
      .string()
      .min(PASSWORD_POLICY.minLength, `At least ${PASSWORD_POLICY.minLength} characters`)
      .regex(/[A-Z]/, 'Include an uppercase letter')
      .regex(/[a-z]/, 'Include a lowercase letter')
      .regex(/[0-9]/, 'Include a number')
      .regex(/[^A-Za-z0-9]/, 'Include a symbol'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
