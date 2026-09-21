import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import studentService from '../services/studentService';
import userService from '../../users/services/userService';
import { QUERY_KEYS } from '../../../constants/appConstants';

export const useStudentReferenceData = () =>
  useQuery({
    queryKey: [...QUERY_KEYS.STUDENTS, 'reference-data'],
    queryFn: studentService.referenceData,
    // Academic years and classes change once a year, not once a page view.
    staleTime: 15 * 60 * 1000,
  });

export const useStudents = (params = {}) =>
  useQuery({
    queryKey: [...QUERY_KEYS.STUDENTS, params],
    queryFn: () => studentService.list(params),
    placeholderData: (previous) => previous,
  });

export const useStudent = (id) =>
  useQuery({
    queryKey: [...QUERY_KEYS.STUDENTS, id],
    queryFn: () => studentService.getById(id),
    enabled: Boolean(id),
  });

export const useCreateStudent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: studentService.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.STUDENTS }),
  });
};

export const useUpdateStudent = (id) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => studentService.update(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.STUDENTS }),
  });
};

/**
 * Suspend / reinstate a learner.
 *
 * Suspension locks the account rather than deactivating it: the learner keeps
 * their enrolments and records but cannot sign in. Lock lives on the user
 * resource, so this goes through userService and then refreshes the learner.
 */
export const useSuspendStudent = (studentId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, suspend }) =>
      suspend ? userService.lock(userId) : userService.unlock(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...QUERY_KEYS.STUDENTS, studentId] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.STUDENTS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USERS });
    },
  });
};

export default useStudents;
