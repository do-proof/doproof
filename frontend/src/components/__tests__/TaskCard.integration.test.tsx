import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import TaskCard from '../TaskCard';
import { Job } from '../../hooks/student/useJobs';
import { AuthProvider } from '../../context/AuthContext';
import { NotificationProvider } from '../../context/NotificationContext';

// Mock the hooks
jest.mock('../../hooks/student/useApplications', () => ({
  useApplicationByJob: jest.fn(() => ({
    data: null,
    isLoading: false,
  })),
}));

// Mock auth context
const mockUser = {
  id: '1',
  email: 'test@example.com',
  role: 'student' as const,
};

jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    logout: jest.fn(),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('../../context/NotificationContext', () => ({
  NotificationProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const mockJob: Job = {
  id: '1',
  title: 'Integration Test Job',
  description: 'This is a test job for integration testing',
  requirements: ['React', 'TypeScript'],
  responsibilities: ['Develop components', 'Write tests'],
  salary: {
    min: 50000,
    max: 80000,
    currency: 'USD'
  },
  location: {
    type: 'remote',
    city: 'Test City',
    country: 'Test Country'
  },
  employment_type: 'full-time',
  status: 'active',
  posted_date: '2024-01-01T00:00:00Z',
  closing_date: '2024-12-31T23:59:59Z',
  task: {
    title: 'Test Task',
    description: 'Complete this test task',
    instructions: 'Follow the instructions carefully',
    time_limit: 120,
    submission_format: 'code',
    max_file_size: 10,
    allowed_file_types: ['zip']
  },
  evaluation_criteria: {
    critical_thinking: 20,
    problem_solving: 25,
    creativity: 15,
    technical_skills: 30,
    communication: 5,
    attention_to_detail: 5
  },
  application_count: 0,
  submission_count: 0,
  view_count: 0,
  company_id: 'test-company',
  recruiter_id: 'test-recruiter'
};

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
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <NotificationProvider>
            {children}
          </NotificationProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('TaskCard Integration Tests', () => {
  let mockOnViewDetails: jest.Mock;
  let mockOnEnroll: jest.Mock;

  beforeEach(() => {
    mockOnViewDetails = jest.fn();
    mockOnEnroll = jest.fn();
    jest.clearAllMocks();
  });

  it('integrates properly with React Query and context providers', async () => {
    render(
      <TaskCard
        job={mockJob}
        onViewDetails={mockOnViewDetails}
        onEnroll={mockOnEnroll}
      />,
      { wrapper: createWrapper() }
    );

    // Should render without errors
    expect(screen.getByText('Integration Test Job')).toBeInTheDocument();
    expect(screen.getByText('Company • Remote')).toBeInTheDocument();
  });

  it('handles user interactions correctly in integrated environment', async () => {
    render(
      <TaskCard
        job={mockJob}
        onViewDetails={mockOnViewDetails}
        onEnroll={mockOnEnroll}
      />,
      { wrapper: createWrapper() }
    );

    // Test enroll button
    const enrollButton = screen.getByRole('button', { name: 'Enroll' });
    fireEvent.click(enrollButton);

    expect(mockOnEnroll).toHaveBeenCalledWith(mockJob);

    // Test view details button
    const viewDetailsButton = screen.getByRole('button', { name: 'View Details' });
    fireEvent.click(viewDetailsButton);

    expect(mockOnViewDetails).toHaveBeenCalledWith(mockJob);
  });

  it('works correctly with application status checking', async () => {
    const { useApplicationByJob } = require('../../hooks/student/useApplications');
    
    // Mock an existing application
    useApplicationByJob.mockReturnValue({
      data: {
        _id: 'app1',
        status: 'in_progress',
        progress: { completion_percentage: 75 },
      },
      isLoading: false,
    });

    render(
      <TaskCard
        job={mockJob}
        onViewDetails={mockOnViewDetails}
        onEnroll={mockOnEnroll}
      />,
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(screen.getByText('✓ Applied')).toBeInTheDocument();
      expect(screen.getByText('In Progress')).toBeInTheDocument();
      expect(screen.getByText('75%')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Continue Work' })).toBeInTheDocument();
    });
  });

  it('handles loading states properly', async () => {
    const { useApplicationByJob } = require('../../hooks/student/useApplications');
    
    // Mock loading state
    useApplicationByJob.mockReturnValue({
      data: null,
      isLoading: true,
    });

    render(
      <TaskCard
        job={mockJob}
        onViewDetails={mockOnViewDetails}
        onEnroll={mockOnEnroll}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByRole('button', { name: 'Loading...' })).toBeDisabled();
  });

  it('renders correctly in a grid layout', () => {
    const jobs = [
      { ...mockJob, id: '1', title: 'Job 1' },
      { ...mockJob, id: '2', title: 'Job 2' },
      { ...mockJob, id: '3', title: 'Job 3' },
    ];

    render(
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {jobs.map((job) => (
          <TaskCard
            key={job.id}
            job={job}
            onViewDetails={mockOnViewDetails}
            onEnroll={mockOnEnroll}
          />
        ))}
      </div>,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('Job 1')).toBeInTheDocument();
    expect(screen.getByText('Job 2')).toBeInTheDocument();
    expect(screen.getByText('Job 3')).toBeInTheDocument();
  });

  it('maintains consistent styling across different states', () => {
    const { rerender } = render(
      <TaskCard
        job={mockJob}
        onViewDetails={mockOnViewDetails}
        onEnroll={mockOnEnroll}
      />,
      { wrapper: createWrapper() }
    );

    const card = screen.getByText('Integration Test Job').closest('div');
    expect(card).toHaveClass('bg-white', 'border', 'rounded-lg');

    // Test with recommended state
    rerender(
      <TaskCard
        job={{ ...mockJob, match_score: 90, is_recommended: true }}
        isRecommended={true}
        showMatchScore={true}
        onViewDetails={mockOnViewDetails}
        onEnroll={mockOnEnroll}
      />
    );

    expect(screen.getByText('90% match')).toBeInTheDocument();
    expect(screen.getByText('Recommended')).toBeInTheDocument();
  });

  it('handles edge cases gracefully', () => {
    const edgeCaseJob = {
      ...mockJob,
      closing_date: undefined, // No deadline
      task: {
        ...mockJob.task,
        time_limit: 0, // Edge case time limit
      }
    };

    render(
      <TaskCard
        job={edgeCaseJob}
        onViewDetails={mockOnViewDetails}
        onEnroll={mockOnEnroll}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('Open')).toBeInTheDocument();
    expect(screen.getByText('0 minutes')).toBeInTheDocument();
  });
});