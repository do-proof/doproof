import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useApplications, useApplicationSummary, useEnrollInJob, applicationKeys } from '../useApplications';
import { api } from '../../../utils/api';
import React from 'react';

// Mock the API
jest.mock('../../../utils/api');
const mockApi = api as jest.Mocked<typeof api>;

// Mock error handler
jest.mock('../../useErrorHandler', () => ({
  useErrorHandler: () => ({
    handleError: jest.fn(),
  }),
}));

// Test wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useApplications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch applications successfully', async () => {
    const mockApplicationsResponse = {
      applications: [
        {
          _id: '1',
          job_id: 'job1',
          student_id: 'student1',
          status: 'in_progress' as const,
          enrolled_at: '2024-01-01T00:00:00Z',
          progress: {
            time_spent: 60,
            last_activity: '2024-01-01T12:00:00Z',
            completion_percentage: 50,
          },
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T12:00:00Z',
        },
      ],
      summary: {
        total: 1,
        by_status: { in_progress: 1 },
        completion_rate: 50,
        average_score: 0,
        recent_activity: {
          applications: 1,
          submissions: 0,
          evaluations: 0,
        },
      },
      total: 1,
      page: 1,
      per_page: 10,
      total_pages: 1,
    };

    mockApi.get.mockResolvedValueOnce({
      success: true,
      data: mockApplicationsResponse,
    });

    const { result } = renderHook(() => useApplications(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockApplicationsResponse);
    expect(mockApi.get).toHaveBeenCalledWith('/api/students/applications?');
  });

  it('should handle filters correctly', async () => {
    const filters = {
      status: ['in_progress', 'submitted'],
      job_id: 'job1',
      has_evaluation: true,
      min_score: 70,
    };

    mockApi.get.mockResolvedValueOnce({
      success: true,
      data: {
        applications: [],
        summary: {
          total: 0,
          by_status: {},
          completion_rate: 0,
          average_score: 0,
          recent_activity: { applications: 0, submissions: 0, evaluations: 0 },
        },
        total: 0,
        page: 1,
        per_page: 10,
        total_pages: 0,
      },
    });

    renderHook(() => useApplications(filters), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(mockApi.get).toHaveBeenCalledWith(
        '/api/students/applications?status=in_progress&status=submitted&job_id=job1&has_evaluation=true&min_score=70'
      );
    });
  });

  it('should handle API errors', async () => {
    const mockError = {
      message: 'Failed to fetch applications',
      status: 500,
      code: 'SERVER_ERROR',
    };

    mockApi.get.mockResolvedValueOnce({
      success: false,
      error: mockError,
    });

    const { result } = renderHook(() => useApplications(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(mockError);
  });
});

describe('useApplicationSummary', () => {
  it('should fetch application summary successfully', async () => {
    const mockSummary = {
      total: 5,
      by_status: {
        in_progress: 2,
        submitted: 1,
        completed: 2,
      },
      completion_rate: 80,
      average_score: 85,
      recent_activity: {
        applications: 2,
        submissions: 1,
        evaluations: 1,
      },
    };

    mockApi.get.mockResolvedValueOnce({
      success: true,
      data: mockSummary,
    });

    const { result } = renderHook(() => useApplicationSummary(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockSummary);
    expect(mockApi.get).toHaveBeenCalledWith('/api/students/applications/summary');
  });
});

describe('useEnrollInJob', () => {
  it('should enroll in job successfully', async () => {
    const mockApplication = {
      _id: '1',
      job_id: 'job1',
      student_id: 'student1',
      status: 'enrolled' as const,
      enrolled_at: '2024-01-01T00:00:00Z',
      progress: {
        time_spent: 0,
        last_activity: '2024-01-01T00:00:00Z',
        completion_percentage: 0,
      },
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    mockApi.post.mockResolvedValueOnce({
      success: true,
      data: mockApplication,
    });

    const { result } = renderHook(() => useEnrollInJob(), {
      wrapper: createWrapper(),
    });

    const enrollmentData = {
      jobId: 'job1',
      coverLetter: 'I am interested in this position',
      expectedCompletionTime: 120,
    };

    result.current.mutate(enrollmentData);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockApplication);
    expect(mockApi.post).toHaveBeenCalledWith('/api/students/applications/job1/enroll', {
      cover_letter: 'I am interested in this position',
      expected_completion_time: 120,
    });
  });

  it('should handle enrollment errors', async () => {
    const mockError = {
      message: 'Already enrolled in this job',
      status: 400,
      code: 'ALREADY_ENROLLED',
    };

    mockApi.post.mockResolvedValueOnce({
      success: false,
      error: mockError,
    });

    const { result } = renderHook(() => useEnrollInJob(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ jobId: 'job1' });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(mockError);
  });
});

describe('applicationKeys', () => {
  it('should generate correct query keys', () => {
    expect(applicationKeys.all).toEqual(['applications']);
    expect(applicationKeys.lists()).toEqual(['applications', 'list']);
    expect(applicationKeys.list({ status: ['in_progress'] })).toEqual([
      'applications',
      'list',
      { status: ['in_progress'] },
    ]);
    expect(applicationKeys.details()).toEqual(['applications', 'detail']);
    expect(applicationKeys.detail('1')).toEqual(['applications', 'detail', '1']);
    expect(applicationKeys.summary()).toEqual(['applications', 'summary']);
    expect(applicationKeys.byJob('job1')).toEqual(['applications', 'by-job', 'job1']);
    expect(applicationKeys.recent()).toEqual(['applications', 'recent']);
  });
});