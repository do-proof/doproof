import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import TaskDetailsModal from '../TaskDetailsModal';
import { Job, JobWithRecommendation } from '../../hooks/student/useJobs';

// Mock the hooks
jest.mock('../../hooks/student/useApplications', () => ({
  useApplicationByJob: jest.fn(() => ({
    data: null,
    isLoading: false,
  })),
}));

// Mock components
jest.mock('../EnrollmentModal', () => {
  return function EnrollmentModal({ job, isOpen, onClose, onSuccess }: any) {
    if (!isOpen) return null;
    return (
      <div data-testid="enrollment-modal">
        <h3>Enroll in {job.title}</h3>
        <button onClick={onClose}>Close</button>
        <button onClick={onSuccess}>Enroll</button>
      </div>
    );
  };
});

jest.mock('../LoadingSpinner', () => {
  return function LoadingSpinner() {
    return <div data-testid="loading-spinner">Loading...</div>;
  };
});

const mockJob: Job = {
  id: '1',
  title: 'Senior Frontend Developer',
  description: 'Build amazing user interfaces using React and TypeScript. Work with a dynamic team to create cutting-edge web applications.',
  requirements: ['React', 'TypeScript', 'CSS', '3+ years experience'],
  responsibilities: ['Develop UI components', 'Write tests', 'Code reviews', 'Mentor junior developers'],
  salary: {
    min: 80000,
    max: 120000,
    currency: 'USD'
  },
  location: {
    type: 'hybrid',
    city: 'San Francisco',
    country: 'USA'
  },
  employment_type: 'full-time',
  status: 'active',
  posted_date: '2024-01-01T00:00:00Z',
  closing_date: '2024-12-31T23:59:59Z',
  task: {
    title: 'Build a React Dashboard',
    description: 'Create a comprehensive dashboard with charts and data visualization',
    instructions: 'Use React, TypeScript, and a charting library of your choice to build a responsive dashboard. Include at least 3 different chart types and implement real-time data updates.',
    time_limit: 180,
    submission_format: 'code',
    max_file_size: 50,
    allowed_file_types: ['zip', 'tar.gz']
  },
  evaluation_criteria: {
    critical_thinking: 20,
    problem_solving: 25,
    creativity: 15,
    technical_skills: 30,
    communication: 5,
    attention_to_detail: 5
  },
  application_count: 15,
  submission_count: 12,
  view_count: 150,
  company_id: 'company1',
  recruiter_id: 'recruiter1'
};

const mockRecommendedJob: JobWithRecommendation = {
  ...mockJob,
  id: '2',
  title: 'Recommended Frontend Role',
  match_score: 92,
  match_reasons: ['Skills match', 'Experience level', 'Location preference'],
  is_recommended: true,
  skill_gaps: ['Advanced React patterns', 'GraphQL']
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
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('TaskDetailsModal', () => {
  const mockOnClose = jest.fn();
  const mockOnEnroll = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders job details correctly', () => {
    render(
      <TaskDetailsModal
        job={mockJob}
        onClose={mockOnClose}
        onEnroll={mockOnEnroll}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('Senior Frontend Developer')).toBeInTheDocument();
    expect(screen.getByText('Company Name')).toBeInTheDocument();
    expect(screen.getByText('San Francisco, USA')).toBeInTheDocument();
    expect(screen.getByText('Full time')).toBeInTheDocument();
    expect(screen.getByText('Build amazing user interfaces using React and TypeScript. Work with a dynamic team to create cutting-edge web applications.')).toBeInTheDocument();
  });

  it('displays task details correctly', () => {
    render(
      <TaskDetailsModal
        job={mockJob}
        onClose={mockOnClose}
        onEnroll={mockOnEnroll}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('Build a React Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Create a comprehensive dashboard with charts and data visualization')).toBeInTheDocument();
    expect(screen.getByText(/Use React, TypeScript, and a charting library/)).toBeInTheDocument();
    expect(screen.getByText('3h 0m')).toBeInTheDocument();
    expect(screen.getByText('Code')).toBeInTheDocument();
  });

  it('shows evaluation criteria', () => {
    render(
      <TaskDetailsModal
        job={mockJob}
        onClose={mockOnClose}
        onEnroll={mockOnEnroll}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('Evaluation Criteria')).toBeInTheDocument();
    expect(screen.getByText('Critical Thinking')).toBeInTheDocument();
    expect(screen.getByText('20%')).toBeInTheDocument();
    expect(screen.getByText('Problem Solving')).toBeInTheDocument();
    expect(screen.getByText('25%')).toBeInTheDocument();
    expect(screen.getByText('Technical Skills')).toBeInTheDocument();
    expect(screen.getByText('30%')).toBeInTheDocument();
  });

  it('displays salary information', () => {
    render(
      <TaskDetailsModal
        job={mockJob}
        onClose={mockOnClose}
        onEnroll={mockOnEnroll}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('Compensation')).toBeInTheDocument();
    expect(screen.getByText('USD 80,000 - 120,000')).toBeInTheDocument();
    expect(screen.getByText('Annual salary range')).toBeInTheDocument();
  });

  it('shows requirements and responsibilities', () => {
    render(
      <TaskDetailsModal
        job={mockJob}
        onClose={mockOnClose}
        onEnroll={mockOnEnroll}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('Requirements')).toBeInTheDocument();
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
    expect(screen.getByText('3+ years experience')).toBeInTheDocument();

    expect(screen.getByText('Responsibilities')).toBeInTheDocument();
    expect(screen.getByText('Develop UI components')).toBeInTheDocument();
    expect(screen.getByText('Write tests')).toBeInTheDocument();
    expect(screen.getByText('Mentor junior developers')).toBeInTheDocument();
  });

  it('displays match score for recommended jobs', () => {
    render(
      <TaskDetailsModal
        job={mockRecommendedJob}
        onClose={mockOnClose}
        onEnroll={mockOnEnroll}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('✨ 92% match with your skills')).toBeInTheDocument();
  });

  it('shows apply button when not applied', () => {
    render(
      <TaskDetailsModal
        job={mockJob}
        onClose={mockOnClose}
        onEnroll={mockOnEnroll}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByRole('button', { name: 'Apply for this Position' })).toBeInTheDocument();
  });

  it('calls onEnroll when apply button is clicked and onEnroll is provided', () => {
    render(
      <TaskDetailsModal
        job={mockJob}
        onClose={mockOnClose}
        onEnroll={mockOnEnroll}
      />,
      { wrapper: createWrapper() }
    );

    const applyButton = screen.getByRole('button', { name: 'Apply for this Position' });
    fireEvent.click(applyButton);

    expect(mockOnEnroll).toHaveBeenCalledWith(mockJob);
  });

  it('opens enrollment modal when apply button is clicked and no onEnroll provided', () => {
    render(
      <TaskDetailsModal
        job={mockJob}
        onClose={mockOnClose}
      />,
      { wrapper: createWrapper() }
    );

    const applyButton = screen.getByRole('button', { name: 'Apply for this Position' });
    fireEvent.click(applyButton);

    expect(screen.getByTestId('enrollment-modal')).toBeInTheDocument();
  });

  it('shows already applied status when user has applied', () => {
    const { useApplicationByJob } = require('../../hooks/student/useApplications');
    useApplicationByJob.mockReturnValue({
      data: {
        _id: 'app1',
        status: 'in_progress',
        progress: { completion_percentage: 45 }
      },
      isLoading: false
    });

    render(
      <TaskDetailsModal
        job={mockJob}
        onClose={mockOnClose}
        onEnroll={mockOnEnroll}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('✓ Already Applied')).toBeInTheDocument();
    expect(screen.getByText('✓ You have already applied to this job')).toBeInTheDocument();
    expect(screen.getByText('Status: In Progress')).toBeInTheDocument();
    expect(screen.getByText('Progress: 45%')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
  });

  it('shows loading state when checking application status', () => {
    const { useApplicationByJob } = require('../../hooks/student/useApplications');
    useApplicationByJob.mockReturnValue({
      data: null,
      isLoading: true
    });

    render(
      <TaskDetailsModal
        job={mockJob}
        onClose={mockOnClose}
        onEnroll={mockOnEnroll}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    expect(screen.getByText('Checking application status...')).toBeInTheDocument();
  });

  it('shows expired status for jobs past deadline', () => {
    const expiredJob = {
      ...mockJob,
      closing_date: '2023-01-01T00:00:00Z' // Past date
    };

    render(
      <TaskDetailsModal
        job={expiredJob}
        onClose={mockOnClose}
        onEnroll={mockOnEnroll}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('⚠️ Application deadline has passed')).toBeInTheDocument();
    expect(screen.getByText('This job is no longer accepting applications')).toBeInTheDocument();
    expect(screen.getByText('Application Closed')).toBeInTheDocument();
  });

  it('shows urgent status for jobs closing soon', () => {
    const urgentJob = {
      ...mockJob,
      closing_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 1 day from now
    };

    render(
      <TaskDetailsModal
        job={urgentJob}
        onClose={mockOnClose}
        onEnroll={mockOnEnroll}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('Closes in 1 day')).toBeInTheDocument();
  });

  it('handles jobs without closing date', () => {
    const openJob = {
      ...mockJob,
      closing_date: undefined
    };

    render(
      <TaskDetailsModal
        job={openJob}
        onClose={mockOnClose}
        onEnroll={mockOnEnroll}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('Open')).toBeInTheDocument();
    expect(screen.getByText('Open Application')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    render(
      <TaskDetailsModal
        job={mockJob}
        onClose={mockOnClose}
        onEnroll={mockOnEnroll}
      />,
      { wrapper: createWrapper() }
    );

    const closeButton = screen.getByRole('button', { name: '×' });
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('calculates difficulty correctly based on time limit', () => {
    const easyJob = { ...mockJob, task: { ...mockJob.task, time_limit: 45 } };
    const { rerender } = render(
      <TaskDetailsModal
        job={easyJob}
        onClose={mockOnClose}
        onEnroll={mockOnEnroll}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('Easy')).toBeInTheDocument();

    const hardJob = { ...mockJob, task: { ...mockJob.task, time_limit: 300 } };
    rerender(
      <TaskDetailsModal
        job={hardJob}
        onClose={mockOnClose}
        onEnroll={mockOnEnroll}
      />
    );

    expect(screen.getByText('Hard')).toBeInTheDocument();
  });

  it('formats time correctly', () => {
    render(
      <TaskDetailsModal
        job={mockJob}
        onClose={mockOnClose}
        onEnroll={mockOnEnroll}
      />,
      { wrapper: createWrapper() }
    );

    // 180 minutes should be displayed as "3h 0m"
    expect(screen.getByText('3h 0m')).toBeInTheDocument();
  });

  it('calculates reward points correctly', () => {
    render(
      <TaskDetailsModal
        job={mockJob}
        onClose={mockOnClose}
        onEnroll={mockOnEnroll}
      />,
      { wrapper: createWrapper() }
    );

    // Should calculate points based on time limit and submission format
    expect(screen.getByText(/points/)).toBeInTheDocument();
  });

  it('handles different submission formats', () => {
    const textJob = {
      ...mockJob,
      task: { ...mockJob.task, submission_format: 'text' as const }
    };

    render(
      <TaskDetailsModal
        job={textJob}
        onClose={mockOnClose}
        onEnroll={mockOnEnroll}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('Text')).toBeInTheDocument();
  });

  it('shows file size limits when applicable', () => {
    render(
      <TaskDetailsModal
        job={mockJob}
        onClose={mockOnClose}
        onEnroll={mockOnEnroll}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('Max: 50MB')).toBeInTheDocument();
  });
});

describe('TaskDetailsModal Accessibility', () => {
  const mockOnClose = jest.fn();

  it('has proper heading structure', () => {
    render(
      <TaskDetailsModal
        job={mockJob}
        onClose={mockOnClose}
      />,
      { wrapper: createWrapper() }
    );

    const headings = screen.getAllByRole('heading');
    expect(headings.length).toBeGreaterThan(0);
    expect(headings[0]).toHaveTextContent('Senior Frontend Developer');
  });

  it('has accessible close button', () => {
    render(
      <TaskDetailsModal
        job={mockJob}
        onClose={mockOnClose}
      />,
      { wrapper: createWrapper() }
    );

    const closeButton = screen.getByRole('button', { name: '×' });
    expect(closeButton).toBeInTheDocument();
  });

  it('has accessible apply button', () => {
    render(
      <TaskDetailsModal
        job={mockJob}
        onClose={mockOnClose}
      />,
      { wrapper: createWrapper() }
    );

    const applyButton = screen.getByRole('button', { name: 'Apply for this Position' });
    expect(applyButton).toBeInTheDocument();
  });
});