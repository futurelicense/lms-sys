import { http } from '../../../services/api/axiosInstance';
import { API_ENDPOINTS } from '../../../constants/apiEndpoints';

export const notesService = {
  /** Get all notes for the current student (paginated). */
  list: (params) => http.get(API_ENDPOINTS.studentNotes.base, { params }),

  /** Get notes for a specific course. */
  byCourse: (courseId) => http.get(API_ENDPOINTS.studentNotes.byCourse(courseId)),

  /** Get the note for a specific lesson. */
  forLesson: (courseId, lessonId) =>
    http.get(API_ENDPOINTS.studentNotes.forLesson(courseId, lessonId)),

  /** Create or update a note (upsert). */
  save: (data) => http.post(API_ENDPOINTS.studentNotes.base, data),

  /** Delete a note. */
  delete: (noteId) => http.delete(API_ENDPOINTS.studentNotes.delete(noteId)),
};

export const bookmarkService = {
  /** Get all bookmarks for the current student (paginated). */
  list: (params) => http.get(API_ENDPOINTS.studentBookmarks.base, { params }),

  /** Get bookmarks for a specific course. */
  byCourse: (courseId) =>
    http.get(API_ENDPOINTS.studentBookmarks.byCourse(courseId)),

  /** Check if a specific lesson is bookmarked. */
  check: (courseId, lessonId) =>
    http.get(API_ENDPOINTS.studentBookmarks.check, { params: { courseId, lessonId } }),

  /** Toggle bookmark on/off for a lesson. */
  toggle: (data) => http.post(API_ENDPOINTS.studentBookmarks.toggle, data),

  /** Delete a bookmark by ID. */
  delete: (bookmarkId) =>
    http.delete(API_ENDPOINTS.studentBookmarks.delete(bookmarkId)),
};

export default { notesService, bookmarkService };
