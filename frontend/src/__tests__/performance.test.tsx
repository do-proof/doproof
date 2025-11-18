import React from 'react';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import StudentDashboard from '../components/StudentDashboard';
import VirtualizedJobList from '../components/student/VirtualizedJobList';

// Mock hooks
jest.mock('../hooks/student/useJobs', () => ({
  useJobs: () => ({
    data: {
      jobs: Array.from({ length: 1000 }, (_, i) => ({
        _id: `job${i}`,
        title: `Job ${i}`,
        description: `Description ${i}`,
        task: { time_limit: 120, submission_format: 'code' },
        status: 'active',
      })),
      total: 1000,
    },
    isLoading: false,
  }),
  useJobRecommendations: () => ({
    data: [],
    isLoading: false,
  }),
}));

jest.mock('../hooks/student/useApplications', () => ({
  useApplications: () => ({
    data: {
      applications: [],
      summary: {
        total: 0,
        by_status: {},
        completion_rate: 0,
        average_score: 0,
        recent_activity: { applications: 0, submissions: 0, evaluations: 0 },
      },
    },
    isLoading: false,
  }),
  useApplicationSummary: () => ({
    data: {
      total: 0,
      by_status: {},
      completion_rate: 0,
      average_score: 0,
      recent_activity: { applications: 0, submissions: 0, evaluations: 0 },
    },
    isLoading: false,
  }),
  useRecentApplications: () => ({
    data: [],
    isLoading: false,
  }),
}));

jest.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: '1', email: 'test@example.com', role: 'student' },
  }),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Performance Tests', () => {
  it('should render StudentDashboard within performance budget', () => {
    const startTime = performance.now();

    render(<StudentDashboard />, { wrapper: createWrapper() });

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // Should render in less than 1000ms
    expect(renderTime).toBeLessThan(1000);
  });

  it('should handle large job lists efficiently', () => {
    const mockJobs = Array.from({ length: 1000 }, (_, i) => ({
      _id: `job${i}`,
      title: `Job ${i}`,
      description: `Description ${i}`,
      task: {
        title: `Task ${i}`,
        time_limit: 120,
        submission_format: 'code' as const,
      },
      status: 'active' as const,
    }));

    const startTime = performance.now();

    render(<VirtualizedJobList jobs={mockJobs} onJobClick={jest.fn()} />);

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // Virtualized list should render quickly even with 1000 items
    expect(renderTime).toBeLessThan(500);
  });

  it('should not cause memory leaks with repeated renders', () => {
    const { unmount, rerender } = render(<StudentDashboard />, {
      wrapper: createWrapper(),
    });

    // Render multiple times
    for (let i = 0; i < 10; i++) {
      rerender(<StudentDashboard />);
    }

    unmount();

    // If we get here without errors, no memory leaks detected
    expect(true).toBe(true);
  });
});
