import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../utils/api';
import { useErrorHandler } from '../useErrorHandler';

// Types for job data
export interface Job {
  _id: string;
  title: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  salary: {
    min: number;
    max: number;
    currency: string;
  };
  location: {
    type: 'remote' | 'onsite' | 'hybrid';
    city?: string;
    country?: string;
  };
  employment_type: 'full-time' | 'part-time' | 'contract' | 'internship';
  status: 'draft' | 'active' | 'paused' | 'closed';
  posted_date: string;
  closing_date?: string;
  
  // DoProof-specific task fields
  task: {
    title: string;
    description: string;
    instructions: string;
    time_limit: number; // in minutes
    submission_format: 'text' | 'file' | 'code' | 'presentation';
    max_file_size?: number;
    allowed_file_types?: string[];
  };
  
  // AI Evaluation criteria
  evaluation_criteria: {
    critical_thinking: number; // weight 0-100
    problem_solving: number;
    creativity: number;
    technical_skills: number;
    communication: number;
    attention_to_detail: number;
  };
  
  application_count: number;
  submission_count: number;
  view_count: number;
  company_id: string;
  recruiter_id: string;
}

export interface JobWithRecommendation extends Job {
  match_score?: number;
  match_reasons?: string[];
  is_recommended?: boolean;
}

export interface JobFilters {
  search?: string;
  difficulty?: string[];
  category?: string[];
  employment_type?: string[];
  location_type?: string;
  city?: string;
  country?: string;
  min_salary?: number;
  max_salary?: number;
  min_reward?: number;
  max_reward?: number;
  deadline_within?: number; // days
  exclude_applied?: boolean;
}

export interface JobListResponse {
  jobs: JobWithRecommendation[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
  recommendations?: JobWithRecommendation[];
}

// Query keys
export const jobKeys = {
  all: ['jobs'] as const,
  lists: () => [...jobKeys.all, 'list'] as const,
  list: (filters: JobFilters) => [...jobKeys.lists(), filters] as const,
  details: () => [...jobKeys.all, 'detail'] as const,
  detail: (id: string) => [...jobKeys.details(), id] as const,
  recommendations: () => [...jobKeys.all, 'recommendations'] as const,
};

export const useJobs = (filters: JobFilters = {}, options?: { enabled?: boolean }) => {
  const { handleError } = useErrorHandler();

  return useQuery({
    queryKey: jobKeys.list(filters),
    queryFn: async (): Promise<JobListResponse> => {
      // Build query parameters
      const params = new URLSearchParams();
      
      if (filters.search) params.append('search', filters.search);
      if (filters.difficulty?.length) {
        filters.difficulty.forEach(diff => params.append('difficulty', diff));
      }
      if (filters.category?.length) {
        filters.category.forEach(cat => params.append('category', cat));
      }
      if (filters.employment_type?.length) {
        filters.employment_type.forEach(type => params.append('employment_type', type));
      }
      if (filters.location_type) params.append('location_type', filters.location_type);
      if (filters.city) params.append('city', filters.city);
      if (filters.country) params.append('country', filters.country);
      if (filters.min_salary) params.append('min_salary', filters.min_salary.toString());
      if (filters.max_salary) params.append('max_salary', filters.max_salary.toString());
      if (filters.min_reward) params.append('min_reward', filters.min_reward.toString());
      if (filters.max_reward) params.append('max_reward', filters.max_reward.toString());
      if (filters.deadline_within) params.append('deadline_within', filters.deadline_within.toString());
      if (filters.exclude_applied) params.append('exclude_applied', 'true');

      const endpoint = `/api/jobs/student/browse?${params.toString()}`;
      const response = await api.get<JobListResponse>(endpoint);

      if (!response.success) {
        throw response.error;
      }

      return response.data!;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    enabled: options?.enabled !== false,
    retry: (failureCount, error: any) => {
      // Don't retry on 4xx errors except 429
      if (error?.status >= 400 && error?.status < 500 && error?.status !== 429) {
        return false;
      }
      return failureCount < 3;
    },
  });
};

export const useJob = (jobId: string, options?: { enabled?: boolean }) => {
  const { handleError } = useErrorHandler();

  return useQuery({
    queryKey: jobKeys.detail(jobId),
    queryFn: async (): Promise<Job> => {
      const response = await api.get<Job>(`/api/jobs/${jobId}`);

      if (!response.success) {
        throw response.error;
      }

      return response.data!;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    enabled: !!jobId && options?.enabled !== false,
    retry: (failureCount, error: any) => {
      // Don't retry on 404 or other 4xx errors
      if (error?.status >= 400 && error?.status < 500) {
        return false;
      }
      return failureCount < 3;
    },
  });
};

export const useJobRecommendations = (options?: { enabled?: boolean }) => {
  const { handleError } = useErrorHandler();

  return useQuery({
    queryKey: jobKeys.recommendations(),
    queryFn: async (): Promise<JobWithRecommendation[]> => {
      const response = await api.get<{ recommendations: JobWithRecommendation[] }>('/api/students/recommendations');

      if (!response.success) {
        throw response.error;
      }

      return response.data!.recommendations;
    },
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    enabled: options?.enabled !== false,
    retry: (failureCount, error: any) => {
      if (error?.status >= 400 && error?.status < 500 && error?.status !== 429) {
        return false;
      }
      return failureCount < 2; // Fewer retries for recommendations
    },
  });
};

// Mutation for incrementing job view count
export const useIncrementJobView = () => {
  const queryClient = useQueryClient();
  const { handleError } = useErrorHandler();

  return useMutation({
    mutationFn: async (jobId: string) => {
      const response = await api.post(`/api/jobs/${jobId}/view`);
      
      if (!response.success) {
        throw response.error;
      }
      
      return response.data;
    },
    onSuccess: (_, jobId) => {
      // Invalidate job details to refresh view count
      queryClient.invalidateQueries({ queryKey: jobKeys.detail(jobId) });
    },
  });
};

// Hook for prefetching job details
export const usePrefetchJob = () => {
  const queryClient = useQueryClient();

  return (jobId: string) => {
    queryClient.prefetchQuery({
      queryKey: jobKeys.detail(jobId),
      queryFn: async () => {
        const response = await api.get<Job>(`/api/jobs/${jobId}`);
        if (!response.success) throw response.error;
        return response.data!;
      },
      staleTime: 10 * 60 * 1000,
    });
  };
};

// Hook for invalidating job queries
export const useInvalidateJobs = () => {
  const queryClient = useQueryClient();

  return {
    invalidateAll: () => queryClient.invalidateQueries({ queryKey: jobKeys.all }),
    invalidateLists: () => queryClient.invalidateQueries({ queryKey: jobKeys.lists() }),
    invalidateDetail: (jobId: string) => queryClient.invalidateQueries({ queryKey: jobKeys.detail(jobId) }),
    invalidateRecommendations: () => queryClient.invalidateQueries({ queryKey: jobKeys.recommendations() }),
  };
};

export default useJobs;