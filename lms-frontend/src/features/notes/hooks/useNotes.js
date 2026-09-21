import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '../../../constants/appConstants';
import { notesService, bookmarkService } from '../services/notesService';

// ─── Notes ───────────────────────────────────────────

export const useNotes = (params) =>
  useQuery({
    queryKey: [...QUERY_KEYS.NOTES, 'list', params],
    queryFn: () => notesService.list(params),
    staleTime: 30000,
    select: (res) => res?.data ?? res,
  });

export const useNotesByCourse = (courseId) =>
  useQuery({
    queryKey: [...QUERY_KEYS.NOTES, 'course', courseId],
    queryFn: () => notesService.byCourse(courseId),
    enabled: !!courseId,
    staleTime: 30000,
    select: (res) => res?.data ?? res ?? [],
  });

export const useNoteForLesson = (courseId, lessonId) =>
  useQuery({
    queryKey: [...QUERY_KEYS.NOTES, 'lesson', courseId, lessonId],
    queryFn: () => notesService.forLesson(courseId, lessonId),
    enabled: !!courseId && !!lessonId,
    staleTime: 10000,
    select: (res) => res?.data ?? res,
  });

export const useSaveNote = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => notesService.save(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.NOTES });
    },
  });
};

export const useDeleteNote = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (noteId) => notesService.delete(noteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.NOTES });
    },
  });
};

// ─── Bookmarks ───────────────────────────────────────

export const useBookmarks = (params) =>
  useQuery({
    queryKey: [...QUERY_KEYS.BOOKMARKS, 'list', params],
    queryFn: () => bookmarkService.list(params),
    staleTime: 30000,
    select: (res) => res?.data ?? res,
  });

export const useBookmarksByCourse = (courseId) =>
  useQuery({
    queryKey: [...QUERY_KEYS.BOOKMARKS, 'course', courseId],
    queryFn: () => bookmarkService.byCourse(courseId),
    enabled: !!courseId,
    staleTime: 30000,
    select: (res) => res?.data ?? res ?? [],
  });

export const useToggleBookmark = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => bookmarkService.toggle(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BOOKMARKS });
    },
  });
};

export const useDeleteBookmark = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (bookmarkId) => bookmarkService.delete(bookmarkId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BOOKMARKS });
    },
  });
};

