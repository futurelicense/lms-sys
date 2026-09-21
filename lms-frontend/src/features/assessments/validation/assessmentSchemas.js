import { z } from 'zod';
import { DIFFICULTY } from '../constants/assessmentConstants';

// ─── Assessment form ──────────────────────────────────────────────────────────

export const assessmentSchema = z
  .object({
    title: z.string().trim().min(1, 'Title is required').max(255, 'Title too long'),
    description: z.string().trim().optional(),
    durationMinutes: z.coerce
      .number()
      .int()
      .min(1, 'Duration must be at least 1 minute')
      .max(1440, 'Duration cannot exceed 24 hours'),
    maxAttempts: z.coerce.number().int().min(1).max(10).default(1),
    randomizeQuestions: z.boolean().default(false),
    retakePolicy: z.enum(['BEST_SCORE', 'LATEST_SCORE', 'AVERAGE_SCORE']).default('BEST_SCORE'),
    startTime: z.string().optional().nullable(),
    endTime: z.string().optional().nullable(),
    showResultAnalytics: z.boolean().default(true),
  })
  .refine(
    (data) => {
      if (data.startTime && data.endTime) {
        return new Date(data.startTime) < new Date(data.endTime);
      }
      return true;
    },
    { message: 'End time must be after start time', path: ['endTime'] },
  );

// ─── Test case sub-form ───────────────────────────────────────────────────────

export const testCaseSchema = z.object({
  id: z.any().optional(),
  inputData: z.string().nullish(),
  expectedOutput: z.string().min(1, 'Expected output is required'),
  sample: z.coerce.boolean().default(false),
  hidden: z.coerce.boolean().default(true),
  weight: z.coerce.number().int().min(1, 'Weight must be at least 1').default(1),
});

// ─── Question option sub-form ─────────────────────────────────────────────────

export const questionOptionSchema = z.object({
  id: z.string().optional(),
  optionText: z.string().optional().default(''),
  isCorrect: z.boolean().default(false),
  orderIndex: z.number().int().optional(),
  explanation: z.string().nullish(),
});

// ─── Question form ────────────────────────────────────────────────────────────

export const questionSchema = z
  .object({
    title: z.string().trim().min(1, 'Question title is required').max(500),
    description: z.string().trim().min(1, 'Problem statement is required'),
    questionType: z.enum(['CODING', 'MULTIPLE_CHOICE']).default('CODING'),
    inputFormat: z.string().trim().optional().nullable(),
    outputFormat: z.string().trim().optional().nullable(),
    constraints: z.string().trim().optional().nullable(),
    difficulty: z.nativeEnum(DIFFICULTY, { message: 'Select a difficulty level' }),
    compiler: z.string().nullish().default('ALL'),
    sectionId: z.string().nullish(),
    marks: z.coerce.number().int().min(1).max(100).default(10),
    timeLimitMs: z.coerce.number().int().min(100).max(10000).default(2000),
    memoryLimitMb: z.coerce.number().int().min(16).max(1024).default(256),
    testCases: z.array(testCaseSchema).optional().default([]),
    options: z.array(questionOptionSchema).optional().default([]),
  })
  .superRefine((data, ctx) => {
    if (data.questionType === 'CODING') {
      if (!data.testCases || data.testCases.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Add at least one test case',
          path: ['testCases'],
        });
      }
    } else if (data.questionType === 'MULTIPLE_CHOICE') {
      if (!data.options || data.options.length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Add at least 2 options for multiple choice question',
          path: ['options'],
        });
      } else {
        data.options.forEach((opt, idx) => {
          if (!opt.optionText || !opt.optionText.trim()) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: 'Option text cannot be blank',
              path: ['options', idx, 'optionText'],
            });
          }
        });
        const hasCorrect = data.options.some((opt) => opt.isCorrect);
        if (!hasCorrect) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'At least one option must be marked as correct answer',
            path: ['options'],
          });
        }
      }
    }
  });
