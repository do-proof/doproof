import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../utils/api';
import { useErrorHandler } from '../useErrorHandler';

// Types for task submissions
export interface TaskSubmission {
  _id: string;
  job_id: string;
  candidate_id: string;
  status: 'in_progress' | 'submitted' | 'evaluated' | 'reviewed' | 'shortlisted' | 'rejected';
  started_at: string;
  submitted_at?: string;
  time_spent: number; // in minutes
  
  // Submission content
  submission?: {
    type: 'text' | 'file' | 'code' | 'presentation';
    content?: string; // for text/code submissions
    file_url?: string; // for file submissions
    file_name?: string;
    file_size?: number;
  };
  
  // AI Evaluation results
  ai_evaluation?: {
    overall_score: number; // 0-100
    criteria_scores: {
      critical_thinking: number;
      problem_solving: number;
      creativity: number;
      technical_skills: number;
      communication: number;
      attention_to_detail: number;
    };
    feedback: string;
    evaluated_at: string;
    evaluation_model: string;
  };
  
  // Recruiter review
  recruiter_review?: {
    rating: number; // 1-5 stars
    notes: string;
    decision: 'shortlist' | 'reject' | 'pending';
    reviewed_at: string;
    reviewed_by: string;
  };
  
  // Basic application info
  cover_letter?: string;
  resume_url?: string;
  created_at: string;
  updated_at: string;
}

export interface TaskSubmissionCreate {
  job_id: string;
  cover_letter?: string;
  resume_url?: string;
}

export interface TaskSubmissionUpdate {
  cover_letter?: string;
  notes?: string;
  submission?: {
    type: 'text' | 'file' | 'code' | 'presentation';
    content?: string;
    file_url?: string;
    file_name?: string;
    file_size?: number;
  };
  time_spent?: number;
}

export interface TaskSubmissionSubmit {
  submission: {
    type: 'text' | 'file' | 'code' | 'presentation';
    content?: string;
    file_url?: string;
    file_name?: string;
    file_size?: number;
  };
  time_spent: number;
}

export interface TaskSubmissionListResponse {
  submissions: TaskSubmission[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

// Query keys
export const submissionKeys = {
  all: ['task-submissions'] as const,
  lists: () => [...submissionKeys.all, 'list'] as const,
  list: (filters: any) => [...submissionKeys.lists(), filters] as const,
  details: () => [...submissionKeys.all, 'detail'] as const,
  detail: (id: string) => [...submissionKeys.details(), id] as const,
  byJob: (jobId: string) => [...submissionKeys.all, 'by-job', jobId] as const,
  mySubmissions: () => [...submissionKeys.all, 'my-submissions'] as const,
};

export const useTaskSubmissions = (filters: any = {}, options?: { enabled?: boolean }) => {
  const { handleError } = useErrorHandler();

  return useQuery({
    queryKey: submissionKeys.list(filters),
    queryFn: async (): Promise<TaskSubmissionListResponse> => {
      const params = new URLSearchParams();
      
      if (filters.job_id) params.append('job_id', filters.job_id);
      if (filters.status) params.append('status', filters.status);
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.per_page) params.append('per_page', filters.per_page.toString());

      const endpoint = `/api/task-submissions?${params.toString()}`;
      const response = await api.get<TaskSubmissionListResponse>(endpoint);

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

export const useTaskSubmission = (submissionId: string, options?: { enabled?: boolean }) => {
  const { handleError } = useErrorHandler();

  return useQuery({
    queryKey: submissionKeys.detail(submissionId),
    queryFn: async (): Promise<TaskSubmission> => {
      const response = await api.get<TaskSubmission>(`/api/task-submissions/${submissionId}`);

      if (!response.success) {
        throw response.error;
      }

      return response.data!;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!submissionId && options?.enabled !== false,
    retry: (failureCount, error: any) => {
      if (error?.status >= 400 && error?.status < 500) {
        return false;
      }
      return failureCount < 3;
    },
  });
};

export const useMySubmissions = (options?: { enabled?: boolean }) => {
  const { handleError } = useErrorHandler();

  return useQuery({
    queryKey: submissionKeys.mySubmissions(),
    queryFn: async (): Promise<TaskSubmission[]> => {
      const response = await api.get<{ submissions: TaskSubmission[] }>('/api/students/submissions');

      if (!response.success) {
        throw response.error;
      }

      return response.data!.submissions;
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

export const useCreateTaskSubmission = () => {
  const queryClient = useQueryClient();
  const { handleError } = useErrorHandler();

  return useMutation({
    mutationFn: async (data: TaskSubmissionCreate): Promise<TaskSubmission> => {
      const response = await api.post<TaskSubmission>('/api/task-submissions', data);
      
      if (!response.success) {
        throw response.error;
      }
      
      return response.data!;
    },
    onSuccess: (newSubmission) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: submissionKeys.mySubmissions() });
      queryClient.invalidateQueries({ queryKey: submissionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: submissionKeys.byJob(newSubmission.job_id) });
      
      // Add to cache
      queryClient.setQueryData(submissionKeys.detail(newSubmission._id), newSubmission);
    },
  });
};

export const useUpdateTaskSubmission = () => {
  const queryClient = useQueryClient();
  const { handleError } = useErrorHandler();

  return useMutation({
    mutationFn: async ({ submissionId, data }: { submissionId: string; data: TaskSubmissionUpdate }): Promise<TaskSubmission> => {
      const response = await api.put<TaskSubmission>(`/api/task-submissions/${submissionId}`, data);
      
      if (!response.success) {
        throw response.error;
      }
      
      return response.data!;
    },
    onSuccess: (updatedSubmission) => {
      // Update cache
      queryClient.setQueryData(submissionKeys.detail(updatedSubmission._id), updatedSubmission);
      
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: submissionKeys.mySubmissions() });
      queryClient.invalidateQueries({ queryKey: submissionKeys.lists() });
    },
  });
};

export const useSubmitTask = () => {
  const queryClient = useQueryClient();
  const { handleError } = useErrorHandler();

  return useMutation({
    mutationFn: async ({ submissionId, data }: { submissionId: string; data: TaskSubmissionSubmit }): Promise<TaskSubmission> => {
      const response = await api.post<TaskSubmission>(`/api/task-submissions/${submissionId}/submit`, data);
      
      if (!response.success) {
        throw response.error;
      }
      
      return response.data!;
    },
    onSuccess: (submittedSubmission) => {
      // Update cache
      queryClient.setQueryData(submissionKeys.detail(submittedSubmission._id), submittedSubmission);
      
      // Invalidate lists to refresh status
      queryClient.invalidateQueries({ queryKey: submissionKeys.mySubmissions() });
      queryClient.invalidateQueries({ queryKey: submissionKeys.lists() });
    },
  });
};

export const useUploadSubmissionFile = () => {
  const { handleError } = useErrorHandler();

  return useMutation({
    mutationFn: async ({ 
      file, 
      onProgress 
    }: { 
      file: File; 
      onProgress?: (progress: number) => void 
    }): Promise<{ file_url: string; file_name: string; file_size: number }> => {
      const response = await api.upload<{ file_url: string; file_name: string; file_size: number }>(
        '/api/submissions/upload',
        file,
        onProgress
      );
      
      if (!response.success) {
        throw response.error;
      }
      
      return response.data!;
    },
  });
};

// Hook for getting submission by job ID
export const useSubmissionByJob = (jobId: string, options?: { enabled?: boolean }) => {
  const { handleError } = useErrorHandler();

  return useQuery({
    queryKey: submissionKeys.byJob(jobId),
    queryFn: async (): Promise<TaskSubmission | null> => {
      const response = await api.get<{ submission: TaskSubmission | null }>(`/api/students/submissions/by-job/${jobId}`);

      if (!response.success) {
        throw response.error;
      }

      return response.data!.submission;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
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

// Hook for invalidating submission queries
export const useInvalidateSubmissions = () => {
  const queryClient = useQueryClient();

  return {
    invalidateAll: () => queryClient.invalidateQueries({ queryKey: submissionKeys.all }),
    invalidateLists: () => queryClient.invalidateQueries({ queryKey: submissionKeys.lists() }),
    invalidateDetail: (submissionId: string) => queryClient.invalidateQueries({ queryKey: submissionKeys.detail(submissionId) }),
    invalidateMySubmissions: () => queryClient.invalidateQueries({ queryKey: submissionKeys.mySubmissions() }),
    invalidateByJob: (jobId: string) => queryClient.invalidateQueries({ queryKey: submissionKeys.byJob(jobId) }),
  };
};

export default useTaskSubmissions;