import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAnalytics } from '../useAnalytics';
import { api } from '../../../utils/api';
import React from 'react';

jest.mock('../../../utils/api');
const mockApi = api as jest.Mocked<typeof api>;

jest.mock('../../useErrorHandler', () => ({
  useErrorHandler: () => ({
    handleError: jest.fn(),
  }),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  });

  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
  
  return Wrapper;
};

describe('useAnalytics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch analytics successfully', async () => {
    const mockAnalytics = {
      performance: {
        completion_rate: 85,
        average_score: 8.5,
        score_trend: [],
        skill_progression: [],
      },
      activity: {
        tasks_completed: 10,
        total_time_spent: 1200,
        streak_days: 5,
        last_activity: '2024-01-01',
      },
      ranking: {
        overall_rank: 42,
        category_ranks: {},
        percentile: 75,
      },
      insights: {
        strengths: ['Problem solving'],
        improvement_areas: ['Communication'],
        recommendations: ['Practice more'],
      },
    };

    mockApi.get.mockResolvedValueOnce({
      success: true,
      data: mockAnalytics,
    });

    const { result } = renderHook(() => useAnalytics(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockAnalytics);
  });

  it('should handle insufficient data', async () => {
    const mockAnalytics = {
      performance: {
        completion_rate: 0,
        average_score: 0,
        score_trend: [],
        skill_progression: [],
      },
      activity: {
        tasks_completed: 0,
        total_time_spent: 0,
        streak_days: 0,
        last_activity: null,
      },
      ranking: null,
      insights: {
        strengths: [],
        improvement_areas: [],
        recommendations: ['Complete more tasks to see insights'],
      },
    };

    mockApi.get.mockResolvedValueOnce({
      success: true,
      data: mockAnalytics,
    });

    const { result } = renderHook(() => useAnalytics(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.activity.tasks_completed).toBe(0);
  });
});
