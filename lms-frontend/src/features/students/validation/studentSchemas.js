import { z } from 'zod';
import { ENROLMENT_STATUS } from '../constants/studentConstants';

const optionalText = (max, label) =>
  z
    .string()
    .trim()
    .max(max, `${label} must not exceed ${max} characters`)
    .optional()
    .or(z.literal(''));

const optionalEmail = z
  .union([z.string().trim().email('Enter a valid email address'), z.literal('')])
  .optional();

const addressSchema = z.object({
  line1: optionalText(255, 'Address line 1'),
  line2: optionalText(255, 'Address line 2'),
  city: optionalText(100, 'City'),
  state: optionalText(100, 'State'),
  country: optionalText(100, 'Country'),
  postalCode: optionalText(20, 'Postal code'),
});

const emergencyContactSchema = z.object({
  name: optionalText(150, 'Name'),
  relation: optionalText(60, 'Relationship'),
  phone: optionalText(20, 'Phone'),
  email: optionalEmail,
});

const enrolmentSchema = z.object({
  batchId: z.string().trim().min(1, 'Select a batch'),
  status: z
    .enum([
      ENROLMENT_STATUS.ACTIVE,
      ENROLMENT_STATUS.COMPLETED,
      ENROLMENT_STATUS.DROPPED,
      ENROLMENT_STATUS.ON_HOLD,
    ])
    .optional(),
});

const currentYear = new Date().getFullYear();

export const studentSchema = z
  .object({
    // ── Personal ───────────────────────────────────────────────────────────
    fullName: z
      .string()
      .trim()
      .min(2, 'Enter the full name')
      .max(100, 'Full name must not exceed 100 characters'),
    email: z.string().trim().min(1, 'Email is required').email('Enter a valid email address'),
    phone: z
      .string()
      .trim()
      .min(1, 'Phone is required')
      .max(20, 'Phone must not exceed 20 characters'),
    registrationNo: z
      .string()
      .trim()
      .min(1, 'Registration number is required')
      .max(50, 'Registration number must not exceed 50 characters'),
    dateOfBirth: z
      .string()
      .min(1, 'Date of birth is required')
      // The control is a native date input, so the value is always yyyy-mm-dd
      // and comparing strings against today is enough.
      .refine((value) => value < new Date().toISOString().slice(0, 10), {
        message: 'Date of birth must be in the past',
      }),
    gender: z.string().optional().or(z.literal('')),
    admissionDate: z.string().optional().or(z.literal('')),
    photoKey: z.string().optional().or(z.literal('')),

    // ── Education & work ───────────────────────────────────────────────────
    highestQualification: optionalText(120, 'Qualification'),
    institution: optionalText(200, 'Institution'),
    yearOfCompletion: z
      .union([
        z.coerce
          .number()
          .int('Enter a four-digit year')
          .min(1950, 'Year looks too early')
          .max(currentYear, 'Year cannot be in the future'),
        z.literal(''),
      ])
      .optional(),
    employer: optionalText(200, 'Employer'),
    workExperienceYears: z
      .union([
        z.coerce.number().min(0, 'Experience cannot be negative').max(70, 'That looks too high'),
        z.literal(''),
      ])
      .optional(),

    // ── Address & identity ─────────────────────────────────────────────────
    address: addressSchema,
    idProofType: z.string().optional().or(z.literal('')),
    idProofNumber: optionalText(60, 'ID number'),

    emergencyContact: emergencyContactSchema,

    // ── Enrolment ──────────────────────────────────────────────────────────
    enrolments: z.array(enrolmentSchema),
  })
  .superRefine((values, ctx) => {
    // A learner may sit in several batches, but not twice in the same one —
    // the API rejects it and the message is clearer coming from here.
    const seen = new Set();
    values.enrolments.forEach((enrolment, index) => {
      if (!enrolment.batchId) return;
      if (seen.has(enrolment.batchId)) {
        ctx.addIssue({
          code: 'custom',
          path: ['enrolments', index, 'batchId'],
          message: 'This batch is already selected',
        });
      }
      seen.add(enrolment.batchId);
    });

    // An ID number without its type (or the reverse) is unusable.
    const hasType = Boolean(values.idProofType);
    const hasNumber = Boolean(values.idProofNumber?.trim());
    if (hasType !== hasNumber) {
      ctx.addIssue({
        code: 'custom',
        path: [hasType ? 'idProofNumber' : 'idProofType'],
        message: 'Give both the ID type and its number, or neither',
      });
    }
  });

const blankToNull = (value) => {
  if (value === undefined || value === null || value === '') return null;
  return typeof value === 'string' ? value.trim() || null : value;
};

/** Drops a section whose fields are all blank rather than sending empty strings. */
const objectOrNull = (source, keys) => {
  const mapped = Object.fromEntries(keys.map((key) => [key, blankToNull(source?.[key])]));
  return Object.values(mapped).some((value) => value !== null) ? mapped : null;
};

/**
 * Turns the flat form state into the API payload.
 *
 * The form keeps address and emergency contact as flat groups because that is
 * how the page is laid out; the API takes nested objects and rejects empty
 * strings where it expects null.
 */
export function toCreateStudentPayload(values) {
  return {
    fullName: values.fullName.trim(),
    email: values.email.trim().toLowerCase(),
    phone: values.phone.trim(),

    registrationNo: values.registrationNo.trim(),
    dateOfBirth: values.dateOfBirth,
    gender: blankToNull(values.gender),
    admissionDate: blankToNull(values.admissionDate),
    photoKey: blankToNull(values.photoKey),

    highestQualification: blankToNull(values.highestQualification),
    institution: blankToNull(values.institution),
    yearOfCompletion: blankToNull(values.yearOfCompletion),
    employer: blankToNull(values.employer),
    workExperienceYears: blankToNull(values.workExperienceYears),

    address: objectOrNull(values.address, [
      'line1',
      'line2',
      'city',
      'state',
      'country',
      'postalCode',
    ]),
    idProofType: blankToNull(values.idProofType),
    idProofNumber: blankToNull(values.idProofNumber),

    emergencyContact: objectOrNull(values.emergencyContact, ['name', 'relation', 'phone', 'email']),

    enrolments: values.enrolments
      .filter((enrolment) => enrolment.batchId)
      .map((enrolment) => ({
        batchId: enrolment.batchId,
        status: enrolment.status || ENROLMENT_STATUS.ACTIVE,
      })),
  };
}

/**
 * Reverse of {@link toCreateStudentPayload}: turns a StudentResponse back into
 * form state. The API returns null for anything unset and nests address and
 * emergency contact, while the controls need flat groups of empty strings.
 */
export function toStudentFormValues(student) {
  const text = (value) => value ?? '';

  return {
    fullName: text(student.fullName),
    email: text(student.email),
    phone: text(student.phone),
    registrationNo: text(student.registrationNo),
    dateOfBirth: text(student.dateOfBirth),
    gender: text(student.gender),
    admissionDate: text(student.admissionDate),
    photoKey: text(student.photoKey),
    photoUrl: text(student.photoUrl),

    highestQualification: text(student.highestQualification),
    institution: text(student.institution),
    yearOfCompletion: text(student.yearOfCompletion),
    employer: text(student.employer),
    workExperienceYears: text(student.workExperienceYears),

    address: {
      line1: text(student.address?.line1),
      line2: text(student.address?.line2),
      city: text(student.address?.city),
      state: text(student.address?.state),
      country: text(student.address?.country),
      postalCode: text(student.address?.postalCode),
    },
    idProofType: text(student.idProofType),
    idProofNumber: text(student.idProofNumber),

    emergencyContact: {
      name: text(student.emergencyContact?.name),
      relation: text(student.emergencyContact?.relation),
      phone: text(student.emergencyContact?.phone),
      email: text(student.emergencyContact?.email),
    },

    enrolments: (student.enrolments ?? []).map((enrolment) => ({
      batchId: enrolment.batchId,
      status: enrolment.status,
    })),
  };
}

/**
 * Update payload. Same shape as create minus registrationNo: the registration
 * number identifies the learner and is not editable after admission.
 */
export function toUpdateStudentPayload(values) {
  const { registrationNo, ...rest } = toCreateStudentPayload(values);
  void registrationNo;
  return rest;
}

export default studentSchema;
