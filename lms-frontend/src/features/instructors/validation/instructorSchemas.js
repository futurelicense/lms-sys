import { z } from 'zod';

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

const currentYear = new Date().getFullYear();

export const instructorSchema = z
  .object({
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
    employeeCode: z
      .string()
      .trim()
      .min(1, 'Employee code is required')
      .max(50, 'Employee code must not exceed 50 characters'),
    dateOfBirth: z
      .string()
      .optional()
      .or(z.literal(''))
      // The control is a native date input, so the value is always yyyy-mm-dd
      // and comparing strings against today is enough.
      .refine((value) => !value || value < new Date().toISOString().slice(0, 10), {
        message: 'Date of birth must be in the past',
      }),
    gender: z.string().optional().or(z.literal('')),
    joiningDate: z.string().optional().or(z.literal('')),
    employmentType: z.string().optional().or(z.literal('')),
    photoKey: z.string().optional().or(z.literal('')),

    specialization: optionalText(200, 'Specialization'),
    yearsOfExperience: z
      .union([
        z.coerce.number().min(0, 'Experience cannot be negative').max(70, 'That looks too high'),
        z.literal(''),
      ])
      .optional(),
    bio: optionalText(2000, 'Bio'),

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

    address: addressSchema,
    idProofType: z.string().optional().or(z.literal('')),
    idProofNumber: optionalText(60, 'ID number'),

    emergencyContact: emergencyContactSchema,
  })
  .superRefine((values, ctx) => {
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

    // Joining before being born is a data-entry slip worth catching here.
    if (values.dateOfBirth && values.joiningDate && values.joiningDate < values.dateOfBirth) {
      ctx.addIssue({
        code: 'custom',
        path: ['joiningDate'],
        message: 'Joining date cannot be before the date of birth',
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

/** Turns the flat form state into the API payload. */
export function toCreateInstructorPayload(values) {
  return {
    fullName: values.fullName.trim(),
    email: values.email.trim().toLowerCase(),
    phone: values.phone.trim(),

    employeeCode: values.employeeCode.trim(),
    dateOfBirth: blankToNull(values.dateOfBirth),
    gender: blankToNull(values.gender),
    joiningDate: blankToNull(values.joiningDate),
    employmentType: blankToNull(values.employmentType),
    photoKey: blankToNull(values.photoKey),

    specialization: blankToNull(values.specialization),
    yearsOfExperience: blankToNull(values.yearsOfExperience),
    bio: blankToNull(values.bio),

    highestQualification: blankToNull(values.highestQualification),
    institution: blankToNull(values.institution),
    yearOfCompletion: blankToNull(values.yearOfCompletion),

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
  };
}

/**
 * Update payload. Same shape as create minus employeeCode: the employee code
 * identifies the instructor and is not editable after onboarding.
 */
export function toUpdateInstructorPayload(values) {
  const { employeeCode, ...rest } = toCreateInstructorPayload(values);
  void employeeCode;
  return rest;
}

/** Reverse of the payload builders: a response back into form state. */
export function toInstructorFormValues(instructor) {
  const text = (value) => value ?? '';

  return {
    fullName: text(instructor.fullName),
    email: text(instructor.email),
    phone: text(instructor.phone),
    employeeCode: text(instructor.employeeCode),
    dateOfBirth: text(instructor.dateOfBirth),
    gender: text(instructor.gender),
    joiningDate: text(instructor.joiningDate),
    employmentType: text(instructor.employmentType),
    photoKey: text(instructor.photoKey),

    specialization: text(instructor.specialization),
    yearsOfExperience: text(instructor.yearsOfExperience),
    bio: text(instructor.bio),

    highestQualification: text(instructor.highestQualification),
    institution: text(instructor.institution),
    yearOfCompletion: text(instructor.yearOfCompletion),

    address: {
      line1: text(instructor.address?.line1),
      line2: text(instructor.address?.line2),
      city: text(instructor.address?.city),
      state: text(instructor.address?.state),
      country: text(instructor.address?.country),
      postalCode: text(instructor.address?.postalCode),
    },
    idProofType: text(instructor.idProofType),
    idProofNumber: text(instructor.idProofNumber),

    emergencyContact: {
      name: text(instructor.emergencyContact?.name),
      relation: text(instructor.emergencyContact?.relation),
      phone: text(instructor.emergencyContact?.phone),
      email: text(instructor.emergencyContact?.email),
    },
  };
}

export default instructorSchema;
