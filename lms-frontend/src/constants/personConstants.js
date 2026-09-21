/**
 * Attributes shared by every person record — learners and instructors alike.
 *
 * These live here rather than in either feature because a feature must not
 * import from another feature; see the architecture notes in the README.
 */

/** Mirrors com.lms.common.domain.Gender. */
export const GENDER_OPTIONS = [
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
  { value: 'OTHER', label: 'Other' },
];

/** Mirrors com.lms.common.domain.IdProofType. */
export const ID_PROOF_OPTIONS = [
  { value: 'AADHAAR', label: 'Aadhaar' },
  { value: 'PAN', label: 'PAN' },
  { value: 'PASSPORT', label: 'Passport' },
  { value: 'DRIVING_LICENCE', label: 'Driving Licence' },
  { value: 'VOTER_ID', label: 'Voter ID' },
  { value: 'OTHER', label: 'Other' },
];

/** Backend caps photo_key at 512 chars; these guard the upload before it starts. */
export const PHOTO_MAX_BYTES = 5 * 1024 * 1024;
export const PHOTO_ACCEPT = 'image/png,image/jpeg,image/webp';
