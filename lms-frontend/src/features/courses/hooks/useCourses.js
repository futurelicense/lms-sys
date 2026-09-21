import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import courseService from '../services/courseService';
import { QUERY_KEYS } from '../../../constants/appConstants';

export const useCourses = (params = {}) =>
  useQuery({
    queryKey: [...QUERY_KEYS.COURSES, params],
    queryFn: () => courseService.list(params),
    placeholderData: (previous) => previous,
  });

/** Only the authenticated student's enrollments belong in My Courses. */
export const useMyCourses = (params = {}) =>
  useQuery({
    queryKey: [...QUERY_KEYS.COURSES, 'mine', params],
    queryFn: () => courseService.listMine(params),
  });

export const useCreateCourse = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: courseService.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.COURSES }),
  });
};

export const useUpdateCourse = (id) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => courseService.update(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.COURSES }),
  });
};

export const useDeleteCourse = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => courseService.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.COURSES }),
  });
};

export default useCourses;
