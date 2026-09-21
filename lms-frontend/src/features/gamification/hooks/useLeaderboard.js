import { useQuery } from '@tanstack/react-query';
import gamificationService from '../services/gamificationService';
import { QUERY_KEYS } from '../../../constants/appConstants';

export const useLeaderboard = (params = { period: 'ALL_TIME', page: 0, size: 10 }) =>
  useQuery({
    queryKey: [...QUERY_KEYS.GAMIFICATION, 'leaderboard', params],
    queryFn: () => gamificationService.getLeaderboard(params),
    placeholderData: (previous) => previous,
  });

export default useLeaderboard;
