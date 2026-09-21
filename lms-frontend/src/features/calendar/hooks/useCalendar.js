import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '../../../constants/appConstants';
import calendarService from '../services/calendarService';

export const useCalendarEvents = () =>
  useQuery({
    queryKey: [...QUERY_KEYS.CALENDAR, 'events'],
    queryFn: () => calendarService.getEvents(),
    staleTime: 60000,
    select: (res) => res?.data ?? res ?? [],
  });

export const useUpcomingDeadlines = (days = 30) =>
  useQuery({
    queryKey: [...QUERY_KEYS.CALENDAR, 'deadlines', days],
    queryFn: () => calendarService.getDeadlines(days),
    staleTime: 60000,
    select: (res) => res?.data ?? res ?? [],
  });
