/**
 * Accessibility tests for student components using axe-core
 */

import React from 'react';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Import student components
import TaskFilters from '../TaskFilters';
import RecommendationCard from '../RecommendationCard';
import AnalyticsWidget from '../AnalyticsWidget';
import ProfileForm from '../ProfileForm';
import SubmissionViewer from '../SubmissionViewer';
import NotificationCenter from '../NotificationCenter';

expect.extend(toHaveNoViolations);

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
};

describe('Student Components Accessibility', () => {
  describe('TaskFilters', () => {
    it('should have no accessibility violations', async () => {
      const { container } = renderWithProviders(
        <TaskFilters
          filters={{
            search: '',
            difficulty: [],
            category: [],
            employment_type: [],
            location_type: '',
            min_reward: null,
            max_reward: null,
            deadline_within: null,
            exclude_applied: false
          }}
          onFiltersChange={() => {}}
          onSaveSearch={() => {}}
          onLoadSearch={() => {}}
          savedSearches={[]}
        />
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('RecommendationCard', () => {
    const mockJob = {
      _id: '1',
      title: 'Test Job',
      description: 'Test description',
      location: { type: 'remote' as const },
      task: {
        title: 'Test Task',
        time_limit: 120,
        submission_format: 'text' as const
      }
    };

    it('should have no accessibility violations', async () => {
      const { container } = renderWithProviders(
        <RecommendationCard
          job={mockJob}
          matchScore={85}
          matchReasons={['Skills match', 'Experience match']}
          onViewDetails={() => {}}
          onEnroll={() => {}}
        />
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('AnalyticsWidget', () => {
    const mockData = {
      totalApplications: 10,
      activeApplications: 5,
      completedApplications: 5,
      averageScore: 85
    };

    it('should have no accessibility violations', async () => {
      const { container } = renderWithProviders(
        <AnalyticsWidget data={mockData} />
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('ProfileForm', () => {
    it('should have no accessibility violations', async () => {
      const { container } = renderWithProviders(
        <ProfileForm
          onSubmit={() => {}}
          onCancel={() => {}}
          initialData={null}
        />
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('SubmissionViewer', () => {
    const mockSubmission = {
      _id: '1',
      job_id: 'job1',
      candidate_id: 'candidate1',
      status: 'submitted',
      submission: {
        type: 'text',
        content: 'Test content'
      },
      time_spent: 90
    };

    const mockJob = {
      _id: 'job1',
      title: 'Test Job',
      task: {
        title: 'Test Task',
        description: 'Test description'
      }
    };

    it('should have no accessibility violations', async () => {
      const { container } = renderWithProviders(
        <SubmissionViewer
          submission={mockSubmission}
          job={mockJob}
        />
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('NotificationCenter', () => {
    it('should have no accessibility violations', async () => {
      const { container } = renderWithProviders(
        <NotificationCenter />
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});

