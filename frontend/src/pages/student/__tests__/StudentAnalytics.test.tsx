import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import StudentAnalytics from '../StudentAnalytics';

jest.mock('../../../hooks/student/useAnalytics', () => ({
  useAnalytics: () => ({
    data: {
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
      },
      ranking: {
        overall_rank: 42,
        percentile: 75,
      },
      insights: {
        strengths: ['Problem solving'],
        improvement_areas: ['Communication'],
        recommendations: [],
      },
    },
    isLoading: false,
    error: null,
  }),
}));

jest.mock('../../../context/AuthContext', () => ({
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

describe('StudentAnalytics', () => {
  it('renders analytics page', async () => {
    render(<StudentAnalytics />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText(/analytics/i)).toBeInTheDocument();
    });
  });

  it('displays performance metrics', async () => {
    render(<StudentAnalytics />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText(/85%/)).toBeInTheDocument();
      expect(screen.getByText(/8.5/)).toBeInTheDocument();
    });
  });

  it('shows activity stats', async () => {
    render(<StudentAnalytics />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText(/10/)).toBeInTheDocument();
      expect(screen.getByText(/5/)).toBeInTheDocument();
    });
  });
});
