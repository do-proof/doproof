import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTaskSubmissions, useCreateSubmission, useUpdateSubmission } from '../useTaskSubmissions';
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

describe('useTaskSubmissions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch submissions successfully', async () => {
    const mockSubmissions = {
      submissions: [
        {
          _id: '1',
          job_id: 'job1',
          candidate_id: 'student1',
          status: 'submitted',
          created_at: '2024-01-01',
        },
      ],
      total: 1,
    };

    mockApi.get.mockResolvedValueOnce({
      success: true,
      data: mockSubmissions,
    });

    const { result } = renderHook(() => useTaskSubmissions(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockSubmissions);
  });

  it('should handle API errors', async () => {
    const mockError = { message: 'Failed to fetch', status: 500 };

    mockApi.get.mockResolvedValueOnce({
      success: false,
      error: mockError,
    });

    const { result } = renderHook(() => useTaskSubmissions(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});

describe('useCreateSubmission', () => {
  it('should create submission successfully', async () => {
    const mockSubmission = {
      _id: '1',
      job_id: 'job1',
      status: 'in_progress',
    };

    mockApi.post.mockResolvedValueOnce({
      success: true,
      data: mockSubmission,
    });

    const { result } = renderHook(() => useCreateSubmission(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      result.current.mutate({
        job_id: 'job1',
        cover_letter: 'Test',
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });
});

describe('useUpdateSubmission', () => {
  it('should update submission successfully', async () => {
    const mockUpdated = {
      _id: '1',
      status: 'submitted',
    };

    mockApi.patch.mockResolvedValueOnce({
      success: true,
      data: mockUpdated,
    });

    const { result } = renderHook(() => useUpdateSubmission(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      result.current.mutate({
        submissionId: '1',
        data: { status: 'submitted' },
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });
});
