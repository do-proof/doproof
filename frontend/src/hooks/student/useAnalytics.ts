import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../utils/api';
import { useErrorHandler } from '../useErrorHandler';

// Types for analytics data
export interface TimeSeriesData {
  date: string;
  value: number;
  label?: string;
}

export interface SkillProgressData {
  skill: string;
  category: string;
  current_level: number; // 0-100
  previous_level: number;
  improvement: number;
  tasks_completed: number;
  last_updated: string;
}

export interface CategoryPerformance {
  category: string;
  completion_rate: number;
  average_score: number;
  tasks_completed: number;
  time_spent: number;
  difficulty_distribution: {
    easy: number;
    medium: number;
    hard: number;
  };
}

export interface StudentAnalyticsResponse {
  performance: {
    completion_rate: number;
    average_score: number;
    score_trend: TimeSeriesData[];
    skill_progression: SkillProgressData[];
    category_performance: CategoryPerformance[];
  };
  activity: {
    tasks_completed: number;
    total_time_spent: number; // in minutes
    streak_days: number;
    last_activity: string;
    weekly_activity: TimeSeriesData[];
    monthly_activity: TimeSeriesData[];
  };
  ranking: {
    overall_rank: number;
    category_ranks: Record<string, number>;
    percentile: number;
    total_students: number;
    rank_change: number; // positive = improved, negative = declined
  };
  insights: {
    strengths: string[];
    improvement_areas: string[];
    recommendations: string[];
    next_milestones: string[];
  };
  goals: {
    current_goals: Array<{
      id: string;
      title: string;
      target_value: number;
      current_value: number;
      deadline: string;
      status: 'active' | 'completed' | 'overdue';
    }>;
    suggested_goals: Array<{
      title: string;
      description: string;
      target_value: number;
      timeframe: string;
    }>;
  };
}

export interface AnalyticsFilters {
  time_range?: 'week' | 'month' | 'quarter' | 'year' | 'all';
  categories?: string[];
  include_comparisons?: boolean;
  include_predictions?: boolean;
}

export interface PerformanceGoal {
  title: string;
  description: string;
  target_value: number;
  current_value: number;
  deadline: string;
  category?: string;
}

// Query keys
export const analyticsKeys = {
  all: ['analytics'] as const,
  overview: () => [...analyticsKeys.all, 'overview'] as const,
  performance: () => [...analyticsKeys.all, 'performance'] as const,
  activity: () => [...analyticsKeys.all, 'activity'] as const,
  ranking: () => [...analyticsKeys.all, 'ranking'] as const,
  insights: () => [...analyticsKeys.all, 'insights'] as const,
  goals: () => [...analyticsKeys.all, 'goals'] as const,
  filtered: (filters: AnalyticsFilters) => [...analyticsKeys.all, 'filtered', filters] as const,
};

export const useStudentAnalytics = (filters: AnalyticsFilters = {}, options?: { enabled?: boolean }) => {
  const { handleError } = useErrorHandler();

  return useQuery({
    queryKey: analyticsKeys.filtered(filters),
    queryFn: async (): Promise<StudentAnalyticsResponse> => {
      const params = new URLSearchParams();
      
      if (filters.time_range) params.append('time_range', filters.time_range);
      if (filters.categories?.length) {
        filters.categories.forEach(cat => params.append('category', cat));
      }
      if (filters.include_comparisons) params.append('include_comparisons', 'true');
      if (filters.include_predictions) params.append('include_predictions', 'true');

      const endpoint = `/api/students/analytics?${params.toString()}`;
      const response = await api.get<StudentAnalyticsResponse>(endpoint);

      if (!response.success) {
        throw response.error;
      }

      return response.data!;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    enabled: options?.enabled !== false,
    retry: (failureCount, error: any) => {
      if (error?.status >= 400 && error?.status < 500 && error?.status !== 429) {
        return false;
      }
      return failureCount < 3;
    },
  });
};

export const usePerformanceOverview = () => {
  return useStudentAnalytics({ 
    time_range: 'month', 
    include_comparisons: true 
  });
};

export const useActivityTracking = (timeRange: 'week' | 'month' = 'week') => {
  const { handleError } = useErrorHandler();

  return useQuery({
    queryKey: analyticsKeys.activity(),
    queryFn: async () => {
      const response = await api.get(`/api/students/analytics/activity?time_range=${timeRange}`);
      
      if (!response.success) {
        throw response.error;
      }
      
      return response.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useSkillProgression = () => {
  const { handleError } = useErrorHandler();

  return useQuery({
    queryKey: [...analyticsKeys.all, 'skills'],
    queryFn: async (): Promise<SkillProgressData[]> => {
      const response = await api.get<{ skills: SkillProgressData[] }>('/api/students/analytics/skills');
      
      if (!response.success) {
        throw response.error;
      }
      
      return response.data!.skills;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
};

export const useRankingData = () => {
  const { handleError } = useErrorHandler();

  return useQuery({
    queryKey: analyticsKeys.ranking(),
    queryFn: async () => {
      const response = await api.get('/api/students/analytics/ranking');
      
      if (!response.success) {
        throw response.error;
      }
      
      return response.data;
    },
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
};

export const useCreatePerformanceGoal = () => {
  const queryClient = useQueryClient();
  const { handleError } = useErrorHandler();

  return useMutation({
    mutationFn: async (goal: PerformanceGoal): Promise<void> => {
      const response = await api.post('/api/students/analytics/goals', goal);
      
      if (!response.success) {
        throw response.error;
      }
    },
    onSuccess: () => {
      // Invalidate analytics queries to refresh goals
      queryClient.invalidateQueries({ queryKey: analyticsKeys.all });
    },
  });
};

export const useUpdatePerformanceGoal = () => {
  const queryClient = useQueryClient();
  const { handleError } = useErrorHandler();

  return useMutation({
    mutationFn: async ({ goalId, updates }: { goalId: string; updates: Partial<PerformanceGoal> }): Promise<void> => {
      const response = await api.put(`/api/students/analytics/goals/${goalId}`, updates);
      
      if (!response.success) {
        throw response.error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: analyticsKeys.all });
    },
  });
};

export const useDeletePerformanceGoal = () => {
  const queryClient = useQueryClient();
  const { handleError } = useErrorHandler();

  return useMutation({
    mutationFn: async (goalId: string): Promise<void> => {
      const response = await api.delete(`/api/students/analytics/goals/${goalId}`);
      
      if (!response.success) {
        throw response.error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: analyticsKeys.all });
    },
  });
};

// Hook for invalidating analytics queries
export const useInvalidateAnalytics = () => {
  const queryClient = useQueryClient();

  return {
    invalidateAll: () => queryClient.invalidateQueries({ queryKey: analyticsKeys.all }),
    invalidateOverview: () => queryClient.invalidateQueries({ queryKey: analyticsKeys.overview() }),
    invalidatePerformance: () => queryClient.invalidateQueries({ queryKey: analyticsKeys.performance() }),
    invalidateActivity: () => queryClient.invalidateQueries({ queryKey: analyticsKeys.activity() }),
    invalidateRanking: () => queryClient.invalidateQueries({ queryKey: analyticsKeys.ranking() }),
  };
};

export default useStudentAnalytics;