import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import userService from '../services/userService';
import { QUERY_KEYS } from '../../../constants/appConstants';

export const useUsers = (params = {}) =>
  useQuery({
    queryKey: [...QUERY_KEYS.USERS, params],
    queryFn: () => userService.list(params),
    placeholderData: (previous) => previous,
  });

export const useUser = (userId) =>
  useQuery({
    queryKey: [...QUERY_KEYS.USERS, userId],
    queryFn: () => userService.getById(userId),
    enabled: Boolean(userId),
  });

export const useSaveUser = (userId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) =>
      userId ? userService.update(userId, payload) : userService.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USERS }),
  });
};

export default useUsers;
