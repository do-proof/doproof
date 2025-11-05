import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../utils/api';
import { useErrorHandler } from '../useErrorHandler';
import { Job } from './useJobs';

// Types for recommendation system
export interface JobRecommendation {
  job: Job;
  match_score: number; // 0-100
  match_reasons: string[];
  skill_gaps: string[];
  similar_successful_profiles: number;
  career_alignment_score: number;
  market_demand_score: number;
  success_probability: number;
}

export interface RecommendationReasoning {
  skill_match: string[];
  career_alignment: string;
  market_demand: string;
  success_probability: number;
  profile_completeness: number;
  improvement_suggestions: string[];
}

export interface RecommendationResponse {
  recommendations: JobRecommendation[];
  reasoning: RecommendationReasoning;
  total_available: number;
  last_updated: string;
  next_update: string;
}

export interface RecommendationFilters {
  limit?: number;
  min_match_score?: number;
  categories?: string[];
  difficulty_levels?: string[];
  exclude_applied?: boolean;
  include_reasoning?: boolean;
}

export interface RecommendationFeedback {
  recommendation_id: string;
  job_id: string;
  feedback_type: 'helpful' | 'not_helpful' | 'irrelevant' | 'applied';
  rating: number; // 1-5
  comments?: string;
}

// Query keys
export const recommendationKeys = {
  all: ['recommendations'] as const,
  lists: () => [...recommendationKeys.all, 'list'] as const,
  list: (filters: RecommendationFilters) => [...recommendationKeys.lists(), filters] as const,
  reasoning: () => [...recommendationKeys.all, 'reasoning'] as const,
  feedback: () => [...recommendationKeys.all, 'feedback'] as const,
};

export const useRecommendations = (filters: RecommendationFilters = {}, options?: { enabled?: boolean }) => {
  const { handleError } = useErrorHandler();

  return useQuery({
    queryKey: recommendationKeys.list(filters),
    queryFn: async (): Promise<RecommendationResponse> => {
      const params = new URLSearchParams();
      
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.min_match_score) params.append('min_match_score', filters.min_match_score.toString());
      if (filters.categories?.length) {
        filters.categories.forEach(cat => params.append('category', cat));
      }
      if (filters.difficulty_levels?.length) {
        filters.difficulty_levels.forEach(diff => params.append('difficulty', diff));
      }
      if (filters.exclude_applied) params.append('exclude_applied', 'true');
      if (filters.include_reasoning) params.append('include_reasoning', 'true');

      const endpoint = `/api/students/recommendations?${params.toString()}`;
      const response = await api.get<RecommendationResponse>(endpoint);

      if (!response.success) {
        throw response.error;
      }

      return response.data!;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - recommendations don't change frequently
    gcTime: 30 * 60 * 1000, // 30 minutes
    enabled: options?.enabled !== false,
    retry: (failureCount, error: any) => {
      if (error?.status >= 400 && error?.status < 500 && error?.status !== 429) {
        return false;
      }
      return failureCount < 3;
    },
  });
};

export const useRecommendationReasoning = (options?: { enabled?: boolean }) => {
  const { handleError } = useErrorHandler();

  return useQuery({
    queryKey: recommendationKeys.reasoning(),
    queryFn: async (): Promise<RecommendationReasoning> => {
      const response = await api.get<RecommendationReasoning>('/api/students/recommendations/reasoning');

      if (!response.success) {
        throw response.error;
      }

      return response.data!;
    },
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    enabled: options?.enabled !== false,
    retry: (failureCount, error: any) => {
      if (error?.status >= 400 && error?.status < 500) {
        return false;
      }
      return failureCount < 3;
    },
  });
};

export const useSubmitRecommendationFeedback = () => {
  const queryClient = useQueryClient();
  const { handleError } = useErrorHandler();

  return useMutation({
    mutationFn: async (feedback: RecommendationFeedback): Promise<void> => {
      const response = await api.post('/api/students/recommendations/feedback', feedback);
      
      if (!response.success) {
        throw response.error;
      }
    },
    onSuccess: () => {
      // Invalidate recommendations to get updated suggestions
      queryClient.invalidateQueries({ queryKey: recommendationKeys.all });
    },
  });
};

export const useRefreshRecommendations = () => {
  const queryClient = useQueryClient();
  const { handleError } = useErrorHandler();

  return useMutation({
    mutationFn: async (): Promise<RecommendationResponse> => {
      const response = await api.post<RecommendationResponse>('/api/students/recommendations/refresh');
      
      if (!response.success) {
        throw response.error;
      }
      
      return response.data!;
    },
    onSuccess: (data) => {
      // Update cache with fresh recommendations
      queryClient.setQueryData(recommendationKeys.list({}), data);
      queryClient.invalidateQueries({ queryKey: recommendationKeys.all });
    },
  });
};

// Hook for getting personalized job recommendations (legacy compatibility)
export const useJobRecommendations = (limit: number = 5) => {
  return useRecommendations({ 
    limit, 
    exclude_applied: true,
    include_reasoning: true 
  });
};

// Hook for invalidating recommendation queries
export const useInvalidateRecommendations = () => {
  const queryClient = useQueryClient();

  return {
    invalidateAll: () => queryClient.invalidateQueries({ queryKey: recommendationKeys.all }),
    invalidateLists: () => queryClient.invalidateQueries({ queryKey: recommendationKeys.lists() }),
    invalidateReasoning: () => queryClient.invalidateQueries({ queryKey: recommendationKeys.reasoning() }),
  };
};

export default useRecommendations;