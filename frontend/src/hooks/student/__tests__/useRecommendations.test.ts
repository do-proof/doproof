import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRecommendations } from '../useRecommendations';
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

describe('useRecommendations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch recommendations successfully', async () => {
    const mockRecommendations = [
      {
        _id: '1',
        title: 'Recommended Job',
        match_score: 95,
        match_reasons: ['Skills match', 'Experience level'],
        is_recommended: true,
      },
    ];

    mockApi.get.mockResolvedValueOnce({
      success: true,
      data: { recommendations: mockRecommendations },
    });

    const { result } = renderHook(() => useRecommendations(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockRecommendations);
  });

  it('should handle empty recommendations', async () => {
    mockApi.get.mockResolvedValueOnce({
      success: true,
      data: { recommendations: [] },
    });

    const { result } = renderHook(() => useRecommendations(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual([]);
  });
});
