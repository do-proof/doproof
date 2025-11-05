import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import TaskCard from '../TaskCard';
import { Job, JobWithRecommendation } from '../../hooks/student/useJobs';

// Mock the useApplicationByJob hook
jest.mock('../../hooks/student/useApplications', () => ({
  useApplicationByJob: jest.fn(() => ({
    data: null,
    isLoading: false,
  })),
}));

const mockJob: Job = {
  id: '1',
  title: 'Frontend Developer',
  description: 'Build responsive web applications using React and TypeScript',
  requirements: ['React', 'TypeScript', 'CSS'],
  responsibilities: ['Develop UI components', 'Write tests'],
  salary: {
    min: 50000,
    max: 80000,
    currency: 'USD'
  },
  location: {
    type: 'remote',
    city: 'San Francisco',
    country: 'USA'
  },
  employment_type: 'full-time',
  status: 'active',
  posted_date: '2024-01-01T00:00:00Z',
  closing_date: '2024-12-31T23:59:59Z',
  task: {
    title: 'Build a landing page',
    description: 'Create a responsive landing page',
    instructions: 'Use React and Tailwind CSS',
    time_limit: 120,
    submission_format: 'code',
    max_file_size: 10,
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
  application_count: 5,
  submission_count: 3,
  view_count: 20,
  company_id: 'company1',
  recruiter_id: 'recruiter1'
};

const mockRecommendedJob: JobWithRecommendation = {
  ...mockJob,
  id: '2',
  title: 'Recommended Job',
  match_score: 95,
  match_reasons: ['Skills match', 'Experience level'],
  is_recommended: true,
  skill_gaps: ['Advanced React patterns']
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

describe('TaskCard', () => {
  const mockOnViewDetails = jest.fn();
  const mockOnEnroll = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders job information correctly', () => {
    render(
      <TaskCard
        job={mockJob}
        onViewDetails={mockOnViewDetails}
        onEnroll={mockOnEnroll}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('Frontend Developer')).toBeInTheDocument();
    expect(screen.getByText('Company • Remote')).toBeInTheDocument();
    expect(screen.getByText('Build responsive web applications using React and TypeScript')).toBeInTheDocument();
    expect(screen.getByText('Build a landing page')).toBeInTheDocument();
    expect(screen.getByText('120 minutes')).toBeInTheDocument();
    expect(screen.getByText('Code')).toBeInTheDocument();
  });

  it('displays difficulty based on time limit', () => {
    render(
      <TaskCard
        job={mockJob}
        onViewDetails={mockOnViewDetails}
        onEnroll={mockOnEnroll}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('Medium')).toBeInTheDocument();
  });

  it('calculates and displays reward points', () => {
    render(
      <TaskCard
        job={mockJob}
        onViewDetails={mockOnViewDetails}
        onEnroll={mockOnEnroll}
      />,
      { wrapper: createWrapper() }
    );

    // Should calculate points based on time limit and submission format
    expect(screen.getByText(/pts/)).toBeInTheDocument();
  });

  it('shows match score for recommended jobs', () => {
    render(
      <TaskCard
        job={mockRecommendedJob}
        isRecommended={true}
        showMatchScore={true}
        onViewDetails={mockOnViewDetails}
        onEnroll={mockOnEnroll}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('95% match')).toBeInTheDocument();
    expect(screen.getByText('Recommended')).toBeInTheDocument();
  });

  it('displays deadline status correctly', () => {
    const jobWithSoonDeadline = {
      ...mockJob,
      closing_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days from now
    };

    render(
      <TaskCard
        job={jobWithSoonDeadline}
        onViewDetails={mockOnViewDetails}
        onEnroll={mockOnEnroll}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('2 days left')).toBeInTheDocument();
  });

  it('shows urgent warning for jobs with 1 day left', () => {
    const urgentJob = {
      ...mockJob,
      closing_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 1 day from now
    };

    render(
      <TaskCard
        job={urgentJob}
        onViewDetails={mockOnViewDetails}
        onEnroll={mockOnEnroll}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('⚠️ Urgent')).toBeInTheDocument();
    expect(screen.getByText('1 day left')).toBeInTheDocument();
  });

  it('handles expired jobs correctly', () => {
    const expiredJob = {
      ...mockJob,
      closing_date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // 1 day ago
    };

    render(
      <TaskCard
        job={expiredJob}
        onViewDetails={mockOnViewDetails}
        onEnroll={mockOnEnroll}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('Expired')).toBeInTheDocument();
    
    // Should have disabled primary action
    const expiredButton = screen.getByRole('button', { name: 'Expired' });
    expect(expiredButton).toBeDisabled();
  });

  it('calls onViewDetails when card is clicked', () => {
    render(
      <TaskCard
        job={mockJob}
        onViewDetails={mockOnViewDetails}
        onEnroll={mockOnEnroll}
      />,
      { wrapper: createWrapper() }
    );

    const card = screen.getByText('Frontend Developer').closest('div');
    fireEvent.click(card!);

    expect(mockOnViewDetails).toHaveBeenCalledWith(mockJob);
  });

  it('calls onEnroll when enroll button is clicked', () => {
    render(
      <TaskCard
        job={mockJob}
        onViewDetails={mockOnViewDetails}
        onEnroll={mockOnEnroll}
      />,
      { wrapper: createWrapper() }
    );

    const enrollButton = screen.getByRole('button', { name: 'Enroll' });
    fireEvent.click(enrollButton);

    expect(mockOnEnroll).toHaveBeenCalledWith(mockJob);
    expect(mockOnViewDetails).not.toHaveBeenCalled(); // Should not trigger card click
  });

  it('calls onViewDetails when view details button is clicked', () => {
    render(
      <TaskCard
        job={mockJob}
        onViewDetails={mockOnViewDetails}
        onEnroll={mockOnEnroll}
      />,
      { wrapper: createWrapper() }
    );

    const viewDetailsButton = screen.getByRole('button', { name: 'View Details' });
    fireEvent.click(viewDetailsButton);

    expect(mockOnViewDetails).toHaveBeenCalledWith(mockJob);
  });

  it('applies hover effects', async () => {
    render(
      <TaskCard
        job={mockJob}
        onViewDetails={mockOnViewDetails}
        onEnroll={mockOnEnroll}
      />,
      { wrapper: createWrapper() }
    );

    const card = screen.getByText('Frontend Developer').closest('div');
    
    fireEvent.mouseEnter(card!);
    
    await waitFor(() => {
      expect(card).toHaveClass('shadow-xl', '-translate-y-1', 'border-blue-300');
    });

    fireEvent.mouseLeave(card!);
    
    await waitFor(() => {
      expect(card).not.toHaveClass('shadow-xl', '-translate-y-1', 'border-blue-300');
    });
  });

  it('handles jobs without closing date', () => {
    const openJob = {
      ...mockJob,
      closing_date: undefined
    };

    render(
      <TaskCard
        job={openJob}
        onViewDetails={mockOnViewDetails}
        onEnroll={mockOnEnroll}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('Open')).toBeInTheDocument();
  });

  it('displays different difficulty levels correctly', () => {
    // Easy job (≤ 60 minutes)
    const easyJob = { ...mockJob, task: { ...mockJob.task, time_limit: 45 } };
    const { rerender } = render(
      <TaskCard
        job={easyJob}
        onViewDetails={mockOnViewDetails}
        onEnroll={mockOnEnroll}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('Easy')).toBeInTheDocument();

    // Hard job (> 180 minutes)
    const hardJob = { ...mockJob, task: { ...mockJob.task, time_limit: 240 } };
    rerender(
      <TaskCard
        job={hardJob}
        onViewDetails={mockOnViewDetails}
        onEnroll={mockOnEnroll}
      />
    );

    expect(screen.getByText('Hard')).toBeInTheDocument();
  });

  it('handles different submission formats', () => {
    const textJob = { 
      ...mockJob, 
      task: { ...mockJob.task, submission_format: 'text' as const }
    };

    render(
      <TaskCard
        job={textJob}
        onViewDetails={mockOnViewDetails}
        onEnroll={mockOnEnroll}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('Text')).toBeInTheDocument();
  });
});

describe('TaskCard with Application Status', () => {
  const mockOnViewDetails = jest.fn();
  const mockOnEnroll = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows application status when user has applied', () => {
    const { useApplicationByJob } = require('../../hooks/student/useApplications');
    useApplicationByJob.mockReturnValue({
      data: {
        _id: 'app1',
        status: 'in_progress',
        progress: { completion_percentage: 60 },
        evaluation: null
      },
      isLoading: false
    });

    render(
      <TaskCard
        job={mockJob}
        onViewDetails={mockOnViewDetails}
        onEnroll={mockOnEnroll}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('✓ Applied')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('60%')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continue Work' })).toBeInTheDocument();
  });

  it('shows AI evaluation score when available', () => {
    const { useApplicationByJob } = require('../../hooks/student/useApplications');
    useApplicationByJob.mockReturnValue({
      data: {
        _id: 'app1',
        status: 'completed',
        progress: { completion_percentage: 100 },
        evaluation: { ai_score: 85 }
      },
      isLoading: false
    });

    render(
      <TaskCard
        job={mockJob}
        onViewDetails={mockOnViewDetails}
        onEnroll={mockOnEnroll}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('85/100')).toBeInTheDocument();
    expect(screen.getByText('AI Score')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'View Results' })).toBeInTheDocument();
  });

  it('shows loading state when checking application status', () => {
    const { useApplicationByJob } = require('../../hooks/student/useApplications');
    useApplicationByJob.mockReturnValue({
      data: null,
      isLoading: true
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
});