import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import batchService from '../services/batchService';
import { QUERY_KEYS } from '../../../constants/appConstants';

export const useBatches = (params = {}) =>
  useQuery({
    queryKey: [...QUERY_KEYS.BATCHES, params],
    queryFn: () => batchService.list(params),
    placeholderData: (previous) => previous,
  });

export const useCreateBatch = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: batchService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BATCHES });
      // The learner intake form lists open batches, so its reference data is stale.
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.STUDENTS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.INSTRUCTORS });
    },
  });
};

export const useUpdateBatch = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }) => batchService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BATCHES });
      // The learner intake form lists open batches, so its reference data is stale.
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.STUDENTS });
      // An instructor's profile shows the batches assigned to them.
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.INSTRUCTORS });
    },
  });
};

export const useDeleteBatch = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: batchService.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BATCHES });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.STUDENTS });
    },
  });
};

export default useBatches;
