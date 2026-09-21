import { z } from 'zod';
import { ROLES } from '../../../constants/roles';
import { USER_STATUS } from '../constants/userConstants';

export const userSchema = z.object({
  fullName: z.string().trim().min(2, 'Enter the full name'),
  email: z.string().trim().email('Enter a valid email address'),
  roles: z.array(z.nativeEnum(ROLES)).min(1, 'Assign at least one role'),
  status: z.nativeEnum(USER_STATUS).default(USER_STATUS.INVITED),
  jobTitle: z.string().trim().max(80).optional(),
});
