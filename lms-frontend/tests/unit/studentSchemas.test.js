import { describe, it, expect } from 'vitest';
import {
  studentSchema,
  toCreateStudentPayload,
} from '../../src/features/students/validation/studentSchemas';

const validLearner = () => ({
  fullName: 'Ada Lovelace',
  email: 'Ada@Centre.Test',
  phone: '9876543210',
  registrationNo: 'REG-001',
  dateOfBirth: '1998-12-10',
  gender: 'FEMALE',
  admissionDate: '2026-08-01',
  photoKey: 'students/photos/abc.png',
  highestQualification: 'B.Sc Computer Science',
  institution: 'State University',
  yearOfCompletion: 2020,
  employer: 'Acme Corp',
  workExperienceYears: 2.5,
  address: {
    line1: '12 Main Street',
    line2: '',
    city: 'Chennai',
    state: 'Tamil Nadu',
    country: 'India',
    postalCode: '600001',
  },
  idProofType: 'PAN',
  idProofNumber: 'ABCDE1234F',
  emergencyContact: { name: 'Byron', relation: 'Parent', phone: '111', email: '' },
  enrolments: [{ batchId: 'batch-1', status: 'ACTIVE' }],
});

describe('studentSchema', () => {
  it('accepts a complete learner', () => {
    expect(studentSchema.safeParse(validLearner()).success).toBe(true);
  });

  it('accepts a learner with no batch — enrolment can happen later', () => {
    const result = studentSchema.safeParse({ ...validLearner(), enrolments: [] });
    expect(result.success).toBe(true);
  });

  it('rejects the same batch selected twice', () => {
    const result = studentSchema.safeParse({
      ...validLearner(),
      enrolments: [
        { batchId: 'batch-1', status: 'ACTIVE' },
        { batchId: 'batch-1', status: 'ACTIVE' },
      ],
    });

    expect(result.success).toBe(false);
    expect(result.error.issues.map((issue) => issue.path.join('.'))).toContain(
      'enrolments.1.batchId',
    );
  });

  it('rejects an ID type without its number', () => {
    const result = studentSchema.safeParse({
      ...validLearner(),
      idProofType: 'PAN',
      idProofNumber: '',
    });

    expect(result.success).toBe(false);
    expect(result.error.issues.map((issue) => issue.path.join('.'))).toContain('idProofNumber');
  });

  it('rejects an ID number without its type', () => {
    const result = studentSchema.safeParse({
      ...validLearner(),
      idProofType: '',
      idProofNumber: 'ABCDE1234F',
    });

    expect(result.success).toBe(false);
    expect(result.error.issues.map((issue) => issue.path.join('.'))).toContain('idProofType');
  });

  it('rejects a date of birth in the future', () => {
    const nextYear = new Date().getFullYear() + 1;
    const result = studentSchema.safeParse({
      ...validLearner(),
      dateOfBirth: `${nextYear}-01-01`,
    });

    expect(result.success).toBe(false);
  });

  it('rejects a year of completion in the future', () => {
    const result = studentSchema.safeParse({
      ...validLearner(),
      yearOfCompletion: new Date().getFullYear() + 5,
    });

    expect(result.success).toBe(false);
  });
});

describe('toCreateStudentPayload', () => {
  it('normalizes the email and nulls out empty optional fields', () => {
    const payload = toCreateStudentPayload({
      ...validLearner(),
      gender: '',
      employer: '   ',
    });

    expect(payload.email).toBe('ada@centre.test');
    expect(payload.gender).toBeNull();
    expect(payload.employer).toBeNull();
  });

  it('sends null rather than an object when a whole section is blank', () => {
    const payload = toCreateStudentPayload({
      ...validLearner(),
      emergencyContact: { name: '', relation: '', phone: '', email: '' },
    });

    expect(payload.emergencyContact).toBeNull();
  });

  it('keeps a section that has any field filled in', () => {
    const payload = toCreateStudentPayload({
      ...validLearner(),
      emergencyContact: { name: '', relation: '', phone: '555', email: '' },
    });

    expect(payload.emergencyContact).toEqual({
      name: null,
      relation: null,
      phone: '555',
      email: null,
    });
  });

  it('drops enrolment rows with no batch selected and defaults the status', () => {
    const payload = toCreateStudentPayload({
      ...validLearner(),
      enrolments: [
        { batchId: 'batch-1', status: '' },
        { batchId: '', status: 'ACTIVE' },
      ],
    });

    expect(payload.enrolments).toEqual([{ batchId: 'batch-1', status: 'ACTIVE' }]);
  });
});
