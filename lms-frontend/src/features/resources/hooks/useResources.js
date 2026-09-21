import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import resourceService from '../services/resourceService';

export const QUERY_KEY_RESOURCES = ['campus_resources'];

export const useResources = (filters = {}) =>
  useQuery({
    queryKey: [...QUERY_KEY_RESOURCES, filters],
    queryFn: () => resourceService.list(filters),
  });

export const useCreateResource = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => resourceService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY_RESOURCES });
    },
  });
};

export const useUpdateResource = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => resourceService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY_RESOURCES });
    },
  });
};

export const useDeleteResource = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => resourceService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY_RESOURCES });
    },
  });
};

export default useResources;
