import { z } from 'zod';
import { COURSE_LEVELS, COURSE_STATUS } from '../constants/courseConstants';

export const courseSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(120),
  summary: z.string().trim().max(280, 'Keep the summary under 280 characters').optional(),
  description: z.string().trim().min(20, 'Describe the course in at least 20 characters'),
  level: z.nativeEnum(COURSE_LEVELS, { message: 'Select a level' }),
  status: z.nativeEnum(COURSE_STATUS).default(COURSE_STATUS.DRAFT),
  categoryId: z.string().min(1, 'Select a category'),
  durationMinutes: z.coerce.number().int().positive('Duration must be greater than zero'),
  tags: z.array(z.string()).max(10, 'A course can have at most 10 tags').default([]),
});

export const courseFilterSchema = z.object({
  search: z.string().trim().optional(),
  status: z.nativeEnum(COURSE_STATUS).optional(),
  level: z.nativeEnum(COURSE_LEVELS).optional(),
  categoryId: z.string().optional(),
});
