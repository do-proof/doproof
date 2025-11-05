import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useJobs, useJob, useJobRecommendations, jobKeys } from '../useJobs';
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

describe('useJobs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch jobs successfully', async () => {
    const mockJobsResponse = {
      jobs: [
        {
          _id: '1',
          title: 'Frontend Developer',
          description: 'Build React apps',
          task: {
            title: 'Build a landing page',
            description: 'Create a responsive landing page',
            instructions: 'Use React and Tailwind CSS',
            time_limit: 120,
            submission_format: 'code' as const,
          },
          evaluation_criteria: {
            critical_thinking: 20,
            problem_solving: 25,
            creativity: 15,
            technical_skills: 30,
            communication: 5,
            attention_to_detail: 5,
          },
          requirements: ['React', 'TypeScript'],
          responsibilities: ['Build UI components'],
          salary: { min: 50000, max: 80000, currency: 'USD' },
          location: { type: 'remote' as const },
          employment_type: 'full-time' as const,
          status: 'active' as const,
          posted_date: '2024-01-01',
          application_count: 5,
          submission_count: 3,
          view_count: 20,
          company_id: 'company1',
          recruiter_id: 'recruiter1',
        },
      ],
      total: 1,
      page: 1,
      per_page: 10,
      total_pages: 1,
    };

    mockApi.get.mockResolvedValueOnce({
      success: true,
      data: mockJobsResponse,
    });

    const { result } = renderHook(() => useJobs(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockJobsResponse);
    expect(mockApi.get).toHaveBeenCalledWith('/api/jobs/student/browse?');
  });

  it('should handle filters correctly', async () => {
    const filters = {
      search: 'React',
      employment_type: ['full-time'],
      location_type: 'remote',
      min_salary: 50000,
    };

    mockApi.get.mockResolvedValueOnce({
      success: true,
      data: { jobs: [], total: 0, page: 1, per_page: 10, total_pages: 0 },
    });

    renderHook(() => useJobs(filters), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(mockApi.get).toHaveBeenCalledWith(
        '/api/jobs/student/browse?search=React&employment_type=full-time&location_type=remote&min_salary=50000'
      );
    });
  });

  it('should handle API errors', async () => {
    const mockError = {
      message: 'Failed to fetch jobs',
      status: 500,
      code: 'SERVER_ERROR',
    };

    mockApi.get.mockResolvedValueOnce({
      success: false,
      error: mockError,
    });

    const { result } = renderHook(() => useJobs(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(mockError);
  });
});

describe('useJob', () => {
  it('should fetch single job successfully', async () => {
    const mockJob = {
      _id: '1',
      title: 'Frontend Developer',
      description: 'Build React apps',
      task: {
        title: 'Build a landing page',
        description: 'Create a responsive landing page',
        instructions: 'Use React and Tailwind CSS',
        time_limit: 120,
        submission_format: 'code' as const,
      },
      evaluation_criteria: {
        critical_thinking: 20,
        problem_solving: 25,
        creativity: 15,
        technical_skills: 30,
        communication: 5,
        attention_to_detail: 5,
      },
      requirements: ['React', 'TypeScript'],
      responsibilities: ['Build UI components'],
      salary: { min: 50000, max: 80000, currency: 'USD' },
      location: { type: 'remote' as const },
      employment_type: 'full-time' as const,
      status: 'active' as const,
      posted_date: '2024-01-01',
      application_count: 5,
      submission_count: 3,
      view_count: 20,
      company_id: 'company1',
      recruiter_id: 'recruiter1',
    };

    mockApi.get.mockResolvedValueOnce({
      success: true,
      data: mockJob,
    });

    const { result } = renderHook(() => useJob('1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockJob);
    expect(mockApi.get).toHaveBeenCalledWith('/api/jobs/1');
  });

  it('should not fetch when jobId is empty', () => {
    const { result } = renderHook(() => useJob(''), {
      wrapper: createWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockApi.get).not.toHaveBeenCalled();
  });
});

describe('useJobRecommendations', () => {
  it('should fetch recommendations successfully', async () => {
    const mockRecommendations = [
      {
        _id: '1',
        title: 'Recommended Job',
        match_score: 95,
        match_reasons: ['Skills match', 'Experience level'],
        is_recommended: true,
        description: 'Perfect match for you',
        task: {
          title: 'Build a component',
          description: 'Create a reusable component',
          instructions: 'Use best practices',
          time_limit: 60,
          submission_format: 'code' as const,
        },
        evaluation_criteria: {
          critical_thinking: 20,
          problem_solving: 25,
          creativity: 15,
          technical_skills: 30,
          communication: 5,
          attention_to_detail: 5,
        },
        requirements: ['React'],
        responsibilities: ['Build components'],
        salary: { min: 60000, max: 90000, currency: 'USD' },
        location: { type: 'remote' as const },
        employment_type: 'full-time' as const,
        status: 'active' as const,
        posted_date: '2024-01-01',
        application_count: 2,
        submission_count: 1,
        view_count: 10,
        company_id: 'company2',
        recruiter_id: 'recruiter2',
      },
    ];

    mockApi.get.mockResolvedValueOnce({
      success: true,
      data: { recommendations: mockRecommendations },
    });

    const { result } = renderHook(() => useJobRecommendations(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockRecommendations);
    expect(mockApi.get).toHaveBeenCalledWith('/api/students/recommendations');
  });
});

describe('jobKeys', () => {
  it('should generate correct query keys', () => {
    expect(jobKeys.all).toEqual(['jobs']);
    expect(jobKeys.lists()).toEqual(['jobs', 'list']);
    expect(jobKeys.list({ search: 'React' })).toEqual(['jobs', 'list', { search: 'React' }]);
    expect(jobKeys.details()).toEqual(['jobs', 'detail']);
    expect(jobKeys.detail('1')).toEqual(['jobs', 'detail', '1']);
    expect(jobKeys.recommendations()).toEqual(['jobs', 'recommendations']);
  });
});