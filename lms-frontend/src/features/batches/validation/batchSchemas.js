import { z } from 'zod';

export const batchSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(1, 'Batch code is required')
      .max(50, 'Batch code must not exceed 50 characters'),
    name: z
      .string()
      .trim()
      .min(2, 'Batch name is required')
      .max(150, 'Batch name must not exceed 150 characters'),
    courseId: z.string().optional().or(z.literal('')),
    instructorId: z.string().optional().or(z.literal('')),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().optional().or(z.literal('')),
    schedule: z
      .string()
      .trim()
      .max(150, 'Schedule must not exceed 150 characters')
      .optional()
      .or(z.literal('')),
    deliveryMode: z.string().optional().or(z.literal('')),
    capacity: z
      .union([
        z.coerce.number().int().positive('Capacity must be greater than zero'),
        z.literal(''),
      ])
      .optional(),
    status: z.string().optional().or(z.literal('')),
  })
  .superRefine((values, ctx) => {
    // Native date inputs give yyyy-mm-dd, so a string compare is enough.
    if (values.endDate && values.endDate < values.startDate) {
      ctx.addIssue({
        code: 'custom',
        path: ['endDate'],
        message: 'The end date cannot be before the start date',
      });
    }
  });

export function toBatchPayload(values) {
  const blankToNull = (value) => (value === '' || value === undefined ? null : value);
  return {
    code: values.code.trim(),
    name: values.name.trim(),
    courseId: blankToNull(values.courseId),
    instructorId: blankToNull(values.instructorId),
    startDate: values.startDate,
    endDate: blankToNull(values.endDate),
    schedule: blankToNull(values.schedule?.trim()),
    deliveryMode: blankToNull(values.deliveryMode),
    capacity: blankToNull(values.capacity),
    status: blankToNull(values.status),
  };
}

/**
 * Update payload: same shape as create minus the code, which identifies the
 * batch and is fixed once learners are enrolled against it.
 */
export function toUpdateBatchPayload(values) {
  const { code, ...rest } = toBatchPayload(values);
  void code;
  return rest;
}

/** A BatchResponse back into form state. */
export function toBatchFormValues(batch) {
  const text = (value) => value ?? '';
  return {
    code: text(batch.code),
    name: text(batch.name),
    courseId: text(batch.courseId),
    instructorId: text(batch.instructorId),
    startDate: text(batch.startDate),
    endDate: text(batch.endDate),
    schedule: text(batch.schedule),
    deliveryMode: text(batch.deliveryMode) || 'OFFLINE',
    capacity: text(batch.capacity),
    status: text(batch.status) || 'PLANNED',
  };
}

export default batchSchema;
