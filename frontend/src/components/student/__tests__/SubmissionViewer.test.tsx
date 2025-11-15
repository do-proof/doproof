import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SubmissionViewer from '../SubmissionViewer';

expect.extend(toHaveNoViolations);

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const mockSubmission = {
  _id: '1',
  job_id: 'job1',
  candidate_id: 'candidate1',
  status: 'submitted',
  submission: {
    type: 'text',
    content: 'Test submission content'
  },
  time_spent: 90,
  started_at: '2024-01-01T00:00:00Z',
  submitted_at: '2024-01-01T02:00:00Z',
  ai_evaluation: {
    overall_score: 85,
    criteria_scores: {
      critical_thinking: 80,
      problem_solving: 90,
      creativity: 75,
      technical_skills: 88
    },
    feedback: 'Great work!'
  }
};

const defaultProps = {
  submission: mockSubmission,
  job: {
    _id: 'job1',
    title: 'Test Job',
    task: {
      title: 'Test Task',
      description: 'Test task description'
    }
  }
};

const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
};

describe('SubmissionViewer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render submission content', () => {
    renderWithProviders(<SubmissionViewer {...defaultProps} />);
    
    expect(screen.getByText(/test submission content/i)).toBeInTheDocument();
  });

  it('should have no accessibility violations', async () => {
    const { container } = renderWithProviders(<SubmissionViewer {...defaultProps} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should display AI evaluation scores', () => {
    renderWithProviders(<SubmissionViewer {...defaultProps} />);
    
    expect(screen.getByText(/85/i)).toBeInTheDocument();
    expect(screen.getByText(/great work/i)).toBeInTheDocument();
  });

  it('should display time spent', () => {
    renderWithProviders(<SubmissionViewer {...defaultProps} />);
    
    expect(screen.getByText(/90/i)).toBeInTheDocument();
  });

  it('should handle tab navigation', () => {
    renderWithProviders(<SubmissionViewer {...defaultProps} />);
    
    const tabs = screen.getAllByRole('tab');
    expect(tabs.length).toBeGreaterThan(0);
    
    fireEvent.click(tabs[0]);
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
  });

  it('should be keyboard navigable', () => {
    renderWithProviders(<SubmissionViewer {...defaultProps} />);
    
    const tabs = screen.getAllByRole('tab');
    tabs[0].focus();
    expect(tabs[0]).toHaveFocus();
    
    // Arrow key navigation should work
    fireEvent.keyDown(tabs[0], { key: 'ArrowRight' });
  });

  it('should display criteria scores breakdown', () => {
    renderWithProviders(<SubmissionViewer {...defaultProps} />);
    
    expect(screen.getByText(/critical thinking/i)).toBeInTheDocument();
    expect(screen.getByText(/problem solving/i)).toBeInTheDocument();
  });

  it('should handle missing evaluation gracefully', () => {
    const submissionWithoutEvaluation = {
      ...mockSubmission,
      ai_evaluation: null
    };
    
    renderWithProviders(
      <SubmissionViewer {...defaultProps} submission={submissionWithoutEvaluation} />
    );
    
    expect(screen.getByText(/evaluation pending/i)).toBeInTheDocument();
  });

  it('should be responsive on mobile', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });
    
    renderWithProviders(<SubmissionViewer {...defaultProps} />);
    
    // Content should still be accessible on mobile
    expect(screen.getByText(/test submission content/i)).toBeInTheDocument();
  });
});

