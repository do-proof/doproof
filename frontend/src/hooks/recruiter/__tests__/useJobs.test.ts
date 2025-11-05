/**
 * @jest-environment jsdom
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useJobs } from '../useJobs';

// Mock the API utility
jest.mock('../../utils/api', () => ({
  apiRequest: jest.fn()
}));

import { apiRequest } from '../../utils/api';
const mockApiRequest = apiRequest as jest.MockedFunction<typeof apiRequest>;

const mockJobs = [
  {
    id: '1',
    title: 'Software Engineer',
    status: 'active',
    application_count: 10,
    submission_count: 8,
    view_count: 100,
    created_at: '2024-01-15T10:00:00Z'
  },
  {
    id: '2',
    title: 'Product Manager',
    status: 'draft',
    application_count: 0,
    submission_count: 0,
    view_count: 5,
    created_at: '2024-01-16T10:00:00Z'
  }
];

describe('useJobs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('fetches jobs successfully', async () => {
    mockApiRequest.mockResolvedValueOnce({
      jobs: mockJobs,
      total: 2,
      page: 1,
      per_page: 10,
      total_pages: 1
    });

    const { result } = renderHook(() => useJobs());

    expect(result.current.loading).toBe(true);
    expect(result.current.jobs).toEqual([]);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.jobs).toEqual(mockJobs);
    expect(result.current.total).toBe(2);
    expect(result.current.error).toBeNull();
  });

  test('handles fetch error', async () => {
    const errorMessage = 'Failed to fetch jobs';
    mockApiRequest.mockRejectedValueOnce(new Error(errorMessage));

    const { result } = renderHook(() => useJobs());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe(errorMessage);
    expect(result.current.jobs).toEqual([]);
  });

  test('creates job successfully', async () => {
    const newJob = {
      title: 'New Job',
      description: 'Job description',
      requirements: ['Requirement 1'],
      responsibilities: ['Responsibility 1'],
      salary: { min: 50000, max: 80000, currency: 'USD' },
      location: { type: 'remote' as const },
      employment_type: 'full-time' as const,
      task: {
        title: 'Test Task',
        description: 'Task description',
        instructions: 'Task instructions',
        time_limit: 60,
        submission_format: 'text' as const
      },
      evaluation_criteria: {
        critical_thinking: 25,
        problem_solving: 25,
        creativity: 25,
        technical_skills: 25,
        communication: 0,
        attention_to_detail: 0
      }
    };

    const createdJob = { ...newJob, id: '3', status: 'draft' };
    mockApiRequest.mockResolvedValueOnce(createdJob);

    const { result } = renderHook(() => useJobs());

    await act(async () => {
      const job = await result.current.createJob(newJob);
      expect(job).toEqual(createdJob);
    });

    expect(mockApiRequest).toHaveBeenCalledWith('/api/jobs', {
      method: 'POST',
      body: JSON.stringify(newJob)
    });
  });

  test('updates job successfully', async () => {
    const jobId = '1';
    const updates = { title: 'Updated Title', status: 'active' };
    const updatedJob = { ...mockJobs[0], ...updates };

    mockApiRequest.mockResolvedValueOnce(updatedJob);

    const { result } = renderHook(() => useJobs());

    await act(async () => {
      const job = await result.current.updateJob(jobId, updates);
      expect(job).toEqual(updatedJob);
    });

    expect(mockApiRequest).toHaveBeenCalledWith(`/api/jobs/${jobId}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  });

  test('deletes job successfully', async () => {
    const jobId = '1';
    mockApiRequest.mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useJobs());

    await act(async () => {
      await result.current.deleteJob(jobId);
    });

    expect(mockApiRequest).toHaveBeenCalledWith(`/api/jobs/${jobId}`, {
      method: 'DELETE'
    });
  });

  test('filters jobs by status', async () => {
    mockApiRequest.mockResolvedValueOnce({
      jobs: [mockJobs[0]], // Only active job
      total: 1,
      page: 1,
      per_page: 10,
      total_pages: 1
    });

    const { result } = renderHook(() => useJobs({ status: 'active' }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockApiRequest).toHaveBeenCalledWith('/api/jobs?status=active');
    expect(result.current.jobs).toHaveLength(1);
    expect(result.current.jobs[0].status).toBe('active');
  });

  test('searches jobs by query', async () => {
    const searchQuery = 'Software';
    mockApiRequest.mockResolvedValueOnce({
      jobs: [mockJobs[0]], // Only matching job
      total: 1,
      page: 1,
      per_page: 10,
      total_pages: 1
    });

    const { result } = renderHook(() => useJobs({ search: searchQuery }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockApiRequest).toHaveBeenCalledWith('/api/jobs?search=Software');
  });

  test('handles pagination', async () => {
    mockApiRequest.mockResolvedValueOnce({
      jobs: mockJobs,
      total: 20,
      page: 2,
      per_page: 10,
      total_pages: 2
    });

    const { result } = renderHook(() => useJobs({ page: 2, per_page: 10 }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockApiRequest).toHaveBeenCalledWith('/api/jobs?page=2&per_page=10');
    expect(result.current.page).toBe(2);
    expect(result.current.totalPages).toBe(2);
  });

  test('refetches jobs when filters change', async () => {
    mockApiRequest.mockResolvedValue({
      jobs: mockJobs,
      total: 2,
      page: 1,
      per_page: 10,
      total_pages: 1
    });

    const { result, rerender } = renderHook(
      ({ filters }) => useJobs(filters),
      { initialProps: { filters: {} } }
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockApiRequest).toHaveBeenCalledTimes(1);

    // Change filters
    rerender({ filters: { status: 'active' } });

    await waitFor(() => {
      expect(mockApiRequest).toHaveBeenCalledTimes(2);
    });

    expect(mockApiRequest).toHaveBeenLastCalledWith('/api/jobs?status=active');
  });

  test('handles job status change', async () => {
    const jobId = '1';
    const newStatus = 'paused';
    const updatedJob = { ...mockJobs[0], status: newStatus };

    mockApiRequest.mockResolvedValueOnce(updatedJob);

    const { result } = renderHook(() => useJobs());

    await act(async () => {
      await result.current.updateJobStatus(jobId, newStatus);
    });

    expect(mockApiRequest).toHaveBeenCalledWith(`/api/jobs/${jobId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: newStatus })
    });
  });

  test('gets job metrics', async () => {
    const jobId = '1';
    const metrics = {
      job_id: jobId,
      view_count: 100,
      application_count: 20,
      submission_count: 15,
      view_to_application_rate: 20.0,
      application_to_submission_rate: 75.0,
      days_active: 5
    };

    mockApiRequest.mockResolvedValueOnce(metrics);

    const { result } = renderHook(() => useJobs());

    await act(async () => {
      const jobMetrics = await result.current.getJobMetrics(jobId);
      expect(jobMetrics).toEqual(metrics);
    });

    expect(mockApiRequest).toHaveBeenCalledWith(`/api/jobs/${jobId}/metrics`);
  });
});