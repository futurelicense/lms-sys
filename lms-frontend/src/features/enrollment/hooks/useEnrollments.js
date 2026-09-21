import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { enrollmentService } from '../services/enrollmentService';
import { useToast } from '../../../components/feedback/Toast';

export const enrollmentKeys = {
  all: ['enrollments'],
  adminLists: () => [...enrollmentKeys.all, 'admin', 'list'],
  adminList: (filters) => [...enrollmentKeys.adminLists(), { filters }],
  adminDetails: () => [...enrollmentKeys.all, 'admin', 'detail'],
  adminDetail: (id) => [...enrollmentKeys.adminDetails(), id],

  instructorLists: () => [...enrollmentKeys.all, 'instructor', 'list'],
  instructorList: (filters) => [...enrollmentKeys.instructorLists(), { filters }],
  instructorDetails: () => [...enrollmentKeys.all, 'instructor', 'detail'],
  instructorDetail: (id) => [...enrollmentKeys.instructorDetails(), id],
};

// --- Admin Hooks ---

export const useAdminEnrollments = (filters) => {
  return useQuery({
    queryKey: enrollmentKeys.adminList(filters),
    queryFn: () => enrollmentService.getAdminEnrollments(filters),
    keepPreviousData: true,
  });
};

export const useAdminEnrollment = (id) => {
  return useQuery({
    queryKey: enrollmentKeys.adminDetail(id),
    queryFn: () => enrollmentService.getAdminEnrollmentById(id),
    enabled: !!id,
  });
};

export const useCreateAdminEnrollment = () => {
  const queryClient = useQueryClient();
  const { success, error: toastError } = useToast();
  return useMutation({
    mutationFn: enrollmentService.createAdminEnrollment,
    onSuccess: () => {
      queryClient.invalidateQueries(enrollmentKeys.adminLists());
      success('Enrollment created successfully');
    },
    onError: (error) => {
      toastError(error?.response?.data?.message || 'Failed to create enrollment');
    },
  });
};

export const useUpdateAdminEnrollmentStatus = () => {
  const queryClient = useQueryClient();
  const { success, error: toastError } = useToast();
  return useMutation({
    mutationFn: ({ id, status }) => enrollmentService.updateAdminEnrollmentStatus(id, status),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(enrollmentKeys.adminLists());
      queryClient.invalidateQueries(enrollmentKeys.adminDetail(variables.id));
      success('Status updated successfully');
    },
    onError: (error) => {
      toastError(error?.response?.data?.message || 'Failed to update status');
    },
  });
};

// --- Instructor Hooks ---

export const useInstructorEnrollments = (filters) => {
  return useQuery({
    queryKey: enrollmentKeys.instructorList(filters),
    queryFn: () => enrollmentService.getInstructorEnrollments(filters),
    keepPreviousData: true,
  });
};

export const useInstructorEnrollment = (id) => {
  return useQuery({
    queryKey: enrollmentKeys.instructorDetail(id),
    queryFn: () => enrollmentService.getInstructorEnrollmentById(id),
    enabled: !!id,
  });
};

export const useCreateInstructorEnrollment = () => {
  const queryClient = useQueryClient();
  const { success, error: toastError } = useToast();
  return useMutation({
    mutationFn: enrollmentService.createInstructorEnrollment,
    onSuccess: () => {
      queryClient.invalidateQueries(enrollmentKeys.instructorLists());
      success('Enrollment created successfully');
    },
    onError: (error) => {
      toastError(error?.response?.data?.message || 'Failed to create enrollment');
    },
  });
};

export const useUpdateInstructorEnrollmentStatus = () => {
  const queryClient = useQueryClient();
  const { success, error: toastError } = useToast();
  return useMutation({
    mutationFn: ({ id, status }) => enrollmentService.updateInstructorEnrollmentStatus(id, status),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(enrollmentKeys.instructorLists());
      queryClient.invalidateQueries(enrollmentKeys.instructorDetail(variables.id));
      success('Status updated successfully');
    },
    onError: (error) => {
      toastError(error?.response?.data?.message || 'Failed to update status');
    },
  });
};

