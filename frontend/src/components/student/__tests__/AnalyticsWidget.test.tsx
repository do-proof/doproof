import React from 'react';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AnalyticsWidget from '../AnalyticsWidget';

// Mock the analytics hook
const mockAnalyticsData = {
  performance: {
    completion_rate: 0.85,
    average_score: 87.5,
    score_trend: [
      { date: '2024-01-01', value: 80 },
      { date: '2024-01-02', value: 85 },
      { date: '2024-01-03', value: 87.5 }
    ],
    skill_progression: [],
    category_performance: []
  },
  activity: {
    tasks_completed: 12,
    total_time_spent: 720,
    streak_days: 5,
    last_activity: '2024-01-03T10:00:00Z',
    weekly_activity: [],
    monthly_activity: []
  },
  ranking: {
    overall_rank: 15,
    category_ranks: {},
    percentile: 85,
    total_students: 100,
    rank_change: 2
  },
  insights: {
    strengths: ['Strong problem-solving skills', 'Excellent code quality'],
    improvement_areas: ['Time management', 'Communication'],
    recommendations: ['Focus on backend development', 'Practice system design'],
    next_milestones: []
  },
  goals: {
    current_goals: [],
    suggested_goals: []
  }
};

jest.mock('../../../hooks/student/useAnalytics', () => ({
  usePerformanceOverview: () => ({
    data: mockAnalyticsData,
    isLoading: false,
    error: null
  })
}));

const renderWithQueryClient = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

describe('AnalyticsWidget', () => {
  it('renders analytics data correctly', () => {
    renderWithQueryClient(<AnalyticsWidget />);

    expect(screen.getByText('Performance Analytics')).toBeInTheDocument();
    expect(screen.getByText('85%')).toBeInTheDocument(); // Completion rate
    expect(screen.getByText('87.5')).toBeInTheDocument(); // Average score
    expect(screen.getByText('12')).toBeInTheDocument(); // Tasks completed
    expect(screen.getByText('5')).toBeInTheDocument(); // Streak days
  });

  it('shows insights when available', () => {
    renderWithQueryClient(<AnalyticsWidget />);

    expect(screen.getByText('💪 Top Strength')).toBeInTheDocument();
    expect(screen.getByText('Strong problem-solving skills')).toBeInTheDocument();
    expect(screen.getByText('🎯 Recommendation')).toBeInTheDocument();
    expect(screen.getByText('Focus on backend development')).toBeInTheDocument();
  });

  it('renders in compact mode', () => {
    renderWithQueryClient(<AnalyticsWidget compact={true} />);

    expect(screen.getByText('Performance Analytics')).toBeInTheDocument();
    expect(screen.getByText('85%')).toBeInTheDocument();
    expect(screen.getByText('87.5')).toBeInTheDocument();
  });

  it('shows view details link', () => {
    renderWithQueryClient(<AnalyticsWidget />);

    expect(screen.getByText('View Details →')).toBeInTheDocument();
    expect(screen.getByText('View Full Analytics')).toBeInTheDocument();
  });

  it('displays completion rate and average score', () => {
    renderWithQueryClient(<AnalyticsWidget />);

    expect(screen.getByText('Completion Rate')).toBeInTheDocument();
    expect(screen.getByText('Average Score')).toBeInTheDocument();
    expect(screen.getByText('Tasks Completed')).toBeInTheDocument();
    expect(screen.getByText('Day Streak')).toBeInTheDocument();
  });
});