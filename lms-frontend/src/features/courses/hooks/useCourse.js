import { useQuery } from '@tanstack/react-query';
import courseService from '../services/courseService';
import { QUERY_KEYS } from '../../../constants/appConstants';

export const useCourse = (courseId) =>
  useQuery({
    queryKey: [...QUERY_KEYS.COURSES, courseId],
    queryFn: () => courseService.getById(courseId),
    enabled: Boolean(courseId),
  });

export default useCourse;
