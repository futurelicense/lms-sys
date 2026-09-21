import { describe, it, expect } from 'vitest';
import {
  instructorSchema,
  toCreateInstructorPayload,
  toUpdateInstructorPayload,
  toInstructorFormValues,
} from '../../src/features/instructors/validation/instructorSchemas';

const validInstructor = () => ({
  fullName: 'Grace Hopper',
  email: 'Grace@Centre.Test',
  phone: '9876543210',
  employeeCode: 'EMP-001',
  dateOfBirth: '1980-12-09',
  gender: 'FEMALE',
  joiningDate: '2024-06-01',
  employmentType: 'FULL_TIME',
  photoKey: 'instructors/photos/abc.png',
  specialization: 'Java, Spring Boot',
  yearsOfExperience: 12.5,
  bio: 'Teaches backend engineering.',
  highestQualification: 'M.Tech Computer Science',
  institution: 'State University',
  yearOfCompletion: 2005,
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
  emergencyContact: { name: 'Vivian', relation: 'Sibling', phone: '111', email: '' },
});

describe('instructorSchema', () => {
  it('accepts a complete instructor', () => {
    expect(instructorSchema.safeParse(validInstructor()).success).toBe(true);
  });

  it('accepts one with only the required fields', () => {
    const result = instructorSchema.safeParse({
      ...validInstructor(),
      dateOfBirth: '',
      gender: '',
      joiningDate: '',
      specialization: '',
      yearsOfExperience: '',
      bio: '',
      highestQualification: '',
      institution: '',
      yearOfCompletion: '',
      idProofType: '',
      idProofNumber: '',
      address: { line1: '', line2: '', city: '', state: '', country: '', postalCode: '' },
      emergencyContact: { name: '', relation: '', phone: '', email: '' },
    });

    expect(result.success).toBe(true);
  });

  it('rejects a missing employee code', () => {
    const result = instructorSchema.safeParse({ ...validInstructor(), employeeCode: '' });
    expect(result.success).toBe(false);
    expect(result.error.issues.map((issue) => issue.path.join('.'))).toContain('employeeCode');
  });

  it('rejects an ID type without its number', () => {
    const result = instructorSchema.safeParse({
      ...validInstructor(),
      idProofType: 'PAN',
      idProofNumber: '',
    });

    expect(result.success).toBe(false);
    expect(result.error.issues.map((issue) => issue.path.join('.'))).toContain('idProofNumber');
  });

  it('rejects an ID number without its type', () => {
    const result = instructorSchema.safeParse({
      ...validInstructor(),
      idProofType: '',
      idProofNumber: 'ABCDE1234F',
    });

    expect(result.success).toBe(false);
    expect(result.error.issues.map((issue) => issue.path.join('.'))).toContain('idProofType');
  });

  it('rejects a joining date before the date of birth', () => {
    const result = instructorSchema.safeParse({
      ...validInstructor(),
      dateOfBirth: '1990-01-01',
      joiningDate: '1985-01-01',
    });

    expect(result.success).toBe(false);
    expect(result.error.issues.map((issue) => issue.path.join('.'))).toContain('joiningDate');
  });

  it('rejects a date of birth in the future', () => {
    const nextYear = new Date().getFullYear() + 1;
    const result = instructorSchema.safeParse({
      ...validInstructor(),
      dateOfBirth: `${nextYear}-01-01`,
    });

    expect(result.success).toBe(false);
  });
});

describe('toCreateInstructorPayload', () => {
  it('normalizes the email and nulls out empty optional fields', () => {
    const payload = toCreateInstructorPayload({
      ...validInstructor(),
      gender: '',
      specialization: '   ',
    });

    expect(payload.email).toBe('grace@centre.test');
    expect(payload.gender).toBeNull();
    expect(payload.specialization).toBeNull();
  });

  it('sends null rather than an object when a whole section is blank', () => {
    const payload = toCreateInstructorPayload({
      ...validInstructor(),
      emergencyContact: { name: '', relation: '', phone: '', email: '' },
    });

    expect(payload.emergencyContact).toBeNull();
  });

  it('keeps a section that has any field filled in', () => {
    const payload = toCreateInstructorPayload({
      ...validInstructor(),
      address: { line1: '', line2: '', city: 'Chennai', state: '', country: '', postalCode: '' },
    });

    expect(payload.address).toEqual({
      line1: null,
      line2: null,
      city: 'Chennai',
      state: null,
      country: null,
      postalCode: null,
    });
  });
});

describe('toUpdateInstructorPayload', () => {
  it('omits the employee code, which is fixed at onboarding', () => {
    const payload = toUpdateInstructorPayload(validInstructor());

    expect(payload).not.toHaveProperty('employeeCode');
    expect(payload.fullName).toBe('Grace Hopper');
  });
});

describe('toInstructorFormValues', () => {
  it('round-trips a response back through the payload builder unchanged', () => {
    const response = {
      fullName: 'Grace Hopper',
      email: 'grace@centre.test',
      phone: '9876543210',
      employeeCode: 'EMP-001',
      dateOfBirth: '1980-12-09',
      gender: 'FEMALE',
      joiningDate: '2024-06-01',
      employmentType: 'FULL_TIME',
      photoKey: null,
      specialization: 'Java',
      yearsOfExperience: 12.5,
      bio: null,
      highestQualification: null,
      institution: null,
      yearOfCompletion: null,
      address: { line1: '12 Main Street', line2: null, city: 'Chennai', state: null, country: null, postalCode: null },
      idProofType: null,
      idProofNumber: null,
      emergencyContact: null,
    };

    const payload = toCreateInstructorPayload(toInstructorFormValues(response));

    expect(payload.employeeCode).toBe('EMP-001');
    expect(payload.specialization).toBe('Java');
    expect(payload.yearsOfExperience).toBe(12.5);
    expect(payload.address.city).toBe('Chennai');
    // Absent on the response, so it must not come back as an object of empty strings.
    expect(payload.emergencyContact).toBeNull();
    expect(payload.bio).toBeNull();
  });

  it('turns nulls into empty strings the form controls can render', () => {
    const values = toInstructorFormValues({ fullName: 'X', email: 'x@y.z', specialization: null });

    expect(values.specialization).toBe('');
    expect(values.address.city).toBe('');
    expect(values.emergencyContact.name).toBe('');
  });
});
