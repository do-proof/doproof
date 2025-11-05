import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../utils/api';
import { useErrorHandler } from '../useErrorHandler';
import { Job } from './useJobs';
import { TaskSubmission } from './useTaskSubmissions';

// Types for student applications
export interface StudentApplication {
  _id: string;
  job_id: string;
  student_id: string;
  status: 'enrolled' | 'in_progress' | 'submitted' | 'evaluated' | 'reviewed' | 'shortlisted' | 'rejected';
  enrolled_at: string;
  submission_id?: string;
  time_spent: number; // in minutes
  
  // Progress tracking
  progress?: {
    time_spent: number; // in minutes
    last_activity: string;
    completion_percentage: number;
  };
  
  // Related data
  job?: Job;
  submission?: TaskSubmission;
  
  // AI Evaluation data (from submission)
  ai_evaluation?: {
    overall_score: number;
    criteria_scores: Record<string, number>;
    feedback: string;
    evaluated_at: string;
  };
  
  // Recruiter review
  recruiter_review?: {
    decision: 'shortlist' | 'reject' | 'pending';
    rating: number;
    notes: string;
    reviewed_at: string;
  };
  
  created_at: string;
  updated_at: string;
}

export interface ApplicationSummary {
  total: number;
  by_status: Record<string, number>;
  completion_rate: number;
  average_score: number;
  recent_activity: {
    applications: number;
    submissions: number;
    evaluations: number;
  };
}

export interface ApplicationFilters {
  status?: string[];
  job_id?: string;
  date_range?: {
    start: string;
    end: string;
  };
  has_evaluation?: boolean;
  has_recruiter_review?: boolean;
  min_score?: number;
  max_score?: number;
}

export interface ApplicationsResponse {
  applications: StudentApplication[];
  summary: ApplicationSummary;
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

// Query keys
export const applicationKeys = {
  all: ['applications'] as const,
  lists: () => [...applicationKeys.all, 'list'] as const,
  list: (filters: ApplicationFilters) => [...applicationKeys.lists(), filters] as const,
  details: () => [...applicationKeys.all, 'detail'] as const,
  detail: (id: string) => [...applicationKeys.details(), id] as const,
  summary: () => [...applicationKeys.all, 'summary'] as const,
  byJob: (jobId: string) => [...applicationKeys.all, 'by-job', jobId] as const,
  recent: () => [...applicationKeys.all, 'recent'] as const,
};

export const useApplications = (filters: ApplicationFilters = {}, options?: { enabled?: boolean }) => {
  const { handleError } = useErrorHandler();

  return useQuery({
    queryKey: applicationKeys.list(filters),
    queryFn: async (): Promise<ApplicationsResponse> => {
      const params = new URLSearchParams();
      
      if (filters.status?.length) {
        filters.status.forEach(status => params.append('status', status));
      }
      if (filters.job_id) params.append('job_id', filters.job_id);
      if (filters.date_range?.start) params.append('start_date', filters.date_range.start);
      if (filters.date_range?.end) params.append('end_date', filters.date_range.end);
      if (filters.has_evaluation !== undefined) params.append('has_evaluation', filters.has_evaluation.toString());
      if (filters.has_recruiter_review !== undefined) params.append('has_recruiter_review', filters.has_recruiter_review.toString());
      if (filters.min_score) params.append('min_score', filters.min_score.toString());
      if (filters.max_score) params.append('max_score', filters.max_score.toString());

      const endpoint = `/api/students/applications?${params.toString()}`;
      const response = await api.get<ApplicationsResponse>(endpoint);

      if (!response.success) {
        throw response.error;
      }

      return response.data!;
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    enabled: options?.enabled !== false,
    retry: (failureCount, error: any) => {
      if (error?.status >= 400 && error?.status < 500 && error?.status !== 429) {
        return false;
      }
      return failureCount < 3;
    },
  });
};

export const useApplication = (applicationId: string, options?: { enabled?: boolean }) => {
  const { handleError } = useErrorHandler();

  return useQuery({
    queryKey: applicationKeys.detail(applicationId),
    queryFn: async (): Promise<StudentApplication> => {
      const response = await api.get<StudentApplication>(`/api/students/applications/${applicationId}`);

      if (!response.success) {
        throw response.error;
      }

      return response.data!;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!applicationId && options?.enabled !== false,
    retry: (failureCount, error: any) => {
      if (error?.status >= 400 && error?.status < 500) {
        return false;
      }
      return failureCount < 3;
    },
  });
};

export const useApplicationSummary = (options?: { enabled?: boolean }) => {
  const { handleError } = useErrorHandler();

  return useQuery({
    queryKey: applicationKeys.summary(),
    queryFn: async (): Promise<ApplicationSummary> => {
      const response = await api.get<ApplicationSummary>('/api/students/applications/summary');

      if (!response.success) {
        throw response.error;
      }

      return response.data!;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    enabled: options?.enabled !== false,
    retry: (failureCount, error: any) => {
      if (error?.status >= 400 && error?.status < 500 && error?.status !== 429) {
        return false;
      }
      return failureCount < 3;
    },
  });
};

export const useRecentApplications = (limit: number = 5, options?: { enabled?: boolean }) => {
  const { handleError } = useErrorHandler();

  return useQuery({
    queryKey: [...applicationKeys.recent(), limit],
    queryFn: async (): Promise<StudentApplication[]> => {
      const response = await api.get<{ applications: StudentApplication[] }>(`/api/students/applications/recent?limit=${limit}`);

      if (!response.success) {
        throw response.error;
      }

      return response.data!.applications;
    },
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
    enabled: options?.enabled !== false,
    retry: (failureCount, error: any) => {
      if (error?.status >= 400 && error?.status < 500 && error?.status !== 429) {
        return false;
      }
      return failureCount < 2;
    },
  });
};

export const useApplicationByJob = (jobId: string, options?: { enabled?: boolean }) => {
  const { handleError } = useErrorHandler();

  return useQuery({
    queryKey: applicationKeys.byJob(jobId),
    queryFn: async (): Promise<StudentApplication | null> => {
      const response = await api.get<{ application: StudentApplication | null }>(`/api/students/applications/by-job/${jobId}`);

      if (!response.success) {
        throw response.error;
      }

      return response.data!.application;
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!jobId && options?.enabled !== false,
    retry: (failureCount, error: any) => {
      if (error?.status >= 400 && error?.status < 500) {
        return false;
      }
      return failureCount < 3;
    },
  });
};

export const useEnrollInJob = () => {
  const queryClient = useQueryClient();
  const { handleError } = useErrorHandler();

  return useMutation({
    mutationFn: async ({ 
      jobId, 
      coverLetter, 
      expectedCompletionTime 
    }: { 
      jobId: string; 
      coverLetter?: string; 
      expectedCompletionTime?: number; 
    }): Promise<StudentApplication> => {
      const response = await api.post<StudentApplication>(`/api/students/applications/${jobId}/enroll`, {
        cover_letter: coverLetter,
        expected_completion_time: expectedCompletionTime,
      });
      
      if (!response.success) {
        throw response.error;
      }
      
      return response.data!;
    },
    onSuccess: (newApplication) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: applicationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: applicationKeys.summary() });
      queryClient.invalidateQueries({ queryKey: applicationKeys.recent() });
      queryClient.invalidateQueries({ queryKey: applicationKeys.byJob(newApplication.job_id) });
      
      // Invalidate job queries to refresh application status
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      
      // Add to cache
      queryClient.setQueryData(applicationKeys.detail(newApplication._id), newApplication);
    },
  });
};

export const useUpdateApplicationProgress = () => {
  const queryClient = useQueryClient();
  const { handleError } = useErrorHandler();

  return useMutation({
    mutationFn: async ({ 
      applicationId, 
      timeSpent, 
      completionPercentage 
    }: { 
      applicationId: string; 
      timeSpent: number; 
      completionPercentage: number; 
    }): Promise<StudentApplication> => {
      const response = await api.patch<StudentApplication>(`/api/students/applications/${applicationId}/progress`, {
        time_spent: timeSpent,
        completion_percentage: completionPercentage,
      });
      
      if (!response.success) {
        throw response.error;
      }
      
      return response.data!;
    },
    onSuccess: (updatedApplication) => {
      // Update cache
      queryClient.setQueryData(applicationKeys.detail(updatedApplication._id), updatedApplication);
      
      // Invalidate lists to refresh progress
      queryClient.invalidateQueries({ queryKey: applicationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: applicationKeys.summary() });
    },
  });
};

export const useWithdrawApplication = () => {
  const queryClient = useQueryClient();
  const { handleError } = useErrorHandler();

  return useMutation({
    mutationFn: async (applicationId: string): Promise<void> => {
      const response = await api.delete(`/api/students/applications/${applicationId}`);
      
      if (!response.success) {
        throw response.error;
      }
    },
    onSuccess: (_, applicationId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: applicationKeys.detail(applicationId) });
      
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: applicationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: applicationKeys.summary() });
      queryClient.invalidateQueries({ queryKey: applicationKeys.recent() });
    },
  });
};

// Hook for getting application statistics
export const useApplicationStats = (dateRange?: { start: string; end: string }, options?: { enabled?: boolean }) => {
  const { handleError } = useErrorHandler();

  return useQuery({
    queryKey: [...applicationKeys.all, 'stats', dateRange],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (dateRange?.start) params.append('start_date', dateRange.start);
      if (dateRange?.end) params.append('end_date', dateRange.end);

      const endpoint = `/api/students/applications/stats?${params.toString()}`;
      const response = await api.get(endpoint);

      if (!response.success) {
        throw response.error;
      }

      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    enabled: options?.enabled !== false,
    retry: (failureCount, error: any) => {
      if (error?.status >= 400 && error?.status < 500 && error?.status !== 429) {
        return false;
      }
      return failureCount < 2;
    },
  });
};

// Hook for invalidating application queries
export const useInvalidateApplications = () => {
  const queryClient = useQueryClient();

  return {
    invalidateAll: () => queryClient.invalidateQueries({ queryKey: applicationKeys.all }),
    invalidateLists: () => queryClient.invalidateQueries({ queryKey: applicationKeys.lists() }),
    invalidateDetail: (applicationId: string) => queryClient.invalidateQueries({ queryKey: applicationKeys.detail(applicationId) }),
    invalidateSummary: () => queryClient.invalidateQueries({ queryKey: applicationKeys.summary() }),
    invalidateRecent: () => queryClient.invalidateQueries({ queryKey: applicationKeys.recent() }),
    invalidateByJob: (jobId: string) => queryClient.invalidateQueries({ queryKey: applicationKeys.byJob(jobId) }),
  };
};

export default useApplications;