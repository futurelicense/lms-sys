import { http } from '../../../services/api/axiosInstance';
import { API_ENDPOINTS } from '../../../constants/apiEndpoints';

export const calendarService = {
  /** Fetch all calendar events for the authenticated student. */
  getEvents: () => http.get(API_ENDPOINTS.calendar.events),

  /** Fetch upcoming deadlines within the given number of days. */
  getDeadlines: (days = 30) =>
    http.get(API_ENDPOINTS.calendar.deadlines, { params: { days } }),
};

export default calendarService;
