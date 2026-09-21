import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import instructorService from '../services/instructorService';
import userService from '../../users/services/userService';
import { QUERY_KEYS } from '../../../constants/appConstants';

export const useInstructorReferenceData = () =>
  useQuery({
    queryKey: [...QUERY_KEYS.INSTRUCTORS, 'reference-data'],
    queryFn: instructorService.referenceData,
    // Pure enum lists — they only change when the backend does.
    staleTime: 60 * 60 * 1000,
  });

export const useInstructors = (params = {}) =>
  useQuery({
    queryKey: [...QUERY_KEYS.INSTRUCTORS, params],
    queryFn: () => instructorService.list(params),
    placeholderData: (previous) => previous,
  });

export const useInstructor = (id) =>
  useQuery({
    queryKey: [...QUERY_KEYS.INSTRUCTORS, id],
    queryFn: () => instructorService.getById(id),
    enabled: Boolean(id),
  });

export const useCreateInstructor = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: instructorService.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.INSTRUCTORS }),
  });
};

export const useUpdateInstructor = (id) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => instructorService.update(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.INSTRUCTORS }),
  });
};

/**
 * Suspend / reinstate an instructor.
 *
 * Suspension locks the account rather than deactivating it: they keep their
 * batch assignments and records but cannot sign in. Lock lives on the user
 * resource, so this goes through userService and then refreshes the instructor.
 */
export const useSuspendInstructor = (instructorId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, suspend }) =>
      suspend ? userService.lock(userId) : userService.unlock(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...QUERY_KEYS.INSTRUCTORS, instructorId] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.INSTRUCTORS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USERS });
    },
  });
};

export default useInstructors;
