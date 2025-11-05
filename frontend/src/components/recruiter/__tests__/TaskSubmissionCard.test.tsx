/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import TaskSubmissionCard from '../TaskSubmissionCard';

const mockSubmission = {
  id: '1',
  job_id: 'job1',
  candidate_id: 'candidate1',
  status: 'evaluated' as const,
  started_at: '2024-01-15T10:00:00Z',
  submitted_at: '2024-01-15T11:30:00Z',
  time_spent: 90,
  submission: {
    type: 'text' as const,
    content: 'This is my solution to the API design challenge...'
  },
  ai_evaluation: {
    overall_score: 85,
    criteria_scores: {
      critical_thinking: 80,
      problem_solving: 90,
      creativity: 75,
      technical_skills: 88,
      communication: 82,
      attention_to_detail: 85
    },
    feedback: 'Excellent solution with good API design principles.',
    evaluated_at: '2024-01-15T12:00:00Z',
    evaluation_model: 'gpt-4'
  },
  candidate: {
    id: 'candidate1',
    name: 'John Doe',
    email: 'john@example.com',
    profile_picture: 'https://example.com/avatar.jpg'
  },
  job: {
    id: 'job1',
    title: 'Senior Software Engineer',
    task: {
      title: 'API Design Challenge',
      time_limit: 120
    }
  }
};

const mockOnReview = jest.fn();
const mockOnViewDetails = jest.fn();
const mockOnStatusChange = jest.fn();

describe('TaskSubmissionCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders submission information correctly', () => {
    render(
      <TaskSubmissionCard 
        submission={mockSubmission}
        onReview={mockOnReview}
        onViewDetails={mockOnViewDetails}
        onStatusChange={mockOnStatusChange}
      />
    );

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('API Design Challenge')).toBeInTheDocument();
    expect(screen.getByText('90 minutes')).toBeInTheDocument();
  });

  test('displays AI evaluation score correctly', () => {
    render(
      <TaskSubmissionCard 
        submission={mockSubmission}
        onReview={mockOnReview}
        onViewDetails={mockOnViewDetails}
        onStatusChange={mockOnStatusChange}
      />
    );

    expect(screen.getByText('85')).toBeInTheDocument();
    expect(screen.getByText(/overall score/i)).toBeInTheDocument();
  });

  test('shows criteria scores breakdown', () => {
    render(
      <TaskSubmissionCard 
        submission={mockSubmission}
        onReview={mockOnReview}
        onViewDetails={mockOnViewDetails}
        onStatusChange={mockOnStatusChange}
      />
    );

    expect(screen.getByText('Problem Solving: 90')).toBeInTheDocument();
    expect(screen.getByText('Technical Skills: 88')).toBeInTheDocument();
    expect(screen.getByText('Critical Thinking: 80')).toBeInTheDocument();
  });

  test('displays correct status badge', () => {
    render(
      <TaskSubmissionCard 
        submission={mockSubmission}
        onReview={mockOnReview}
        onViewDetails={mockOnViewDetails}
        onStatusChange={mockOnStatusChange}
      />
    );

    const statusBadge = screen.getByText('Evaluated');
    expect(statusBadge).toBeInTheDocument();
    expect(statusBadge).toHaveClass('bg-blue-100', 'text-blue-800');
  });

  test('handles review button click', () => {
    render(
      <TaskSubmissionCard 
        submission={mockSubmission}
        onReview={mockOnReview}
        onViewDetails={mockOnViewDetails}
        onStatusChange={mockOnStatusChange}
      />
    );

    const reviewButton = screen.getByRole('button', { name: /review/i });
    fireEvent.click(reviewButton);
    
    expect(mockOnReview).toHaveBeenCalledWith(mockSubmission.id);
  });

  test('handles view details button click', () => {
    render(
      <TaskSubmissionCard 
        submission={mockSubmission}
        onReview={mockOnReview}
        onViewDetails={mockOnViewDetails}
        onStatusChange={mockOnStatusChange}
      />
    );

    const viewButton = screen.getByRole('button', { name: /view details/i });
    fireEvent.click(viewButton);
    
    expect(mockOnViewDetails).toHaveBeenCalledWith(mockSubmission.id);
  });

  test('shows time efficiency indicator', () => {
    render(
      <TaskSubmissionCard 
        submission={mockSubmission}
        onReview={mockOnReview}
        onViewDetails={mockOnViewDetails}
        onStatusChange={mockOnStatusChange}
      />
    );

    // 90 minutes used out of 120 minutes limit = 75%
    expect(screen.getByText('75%')).toBeInTheDocument();
    expect(screen.getByText(/time used/i)).toBeInTheDocument();
  });

  test('displays submission without AI evaluation', () => {
    const submissionWithoutAI = {
      ...mockSubmission,
      ai_evaluation: undefined,
      status: 'submitted' as const
    };

    render(
      <TaskSubmissionCard 
        submission={submissionWithoutAI}
        onReview={mockOnReview}
        onViewDetails={mockOnViewDetails}
        onStatusChange={mockOnStatusChange}
      />
    );

    expect(screen.getByText('Pending Evaluation')).toBeInTheDocument();
    expect(screen.queryByText('85')).not.toBeInTheDocument();
  });

  test('shows file submission type correctly', () => {
    const fileSubmission = {
      ...mockSubmission,
      submission: {
        type: 'file' as const,
        file_url: 'https://example.com/submission.pdf',
        file_name: 'solution.pdf',
        file_size: 1024000
      }
    };

    render(
      <TaskSubmissionCard 
        submission={fileSubmission}
        onReview={mockOnReview}
        onViewDetails={mockOnViewDetails}
        onStatusChange={mockOnStatusChange}
      />
    );

    expect(screen.getByText('solution.pdf')).toBeInTheDocument();
    expect(screen.getByText('1.0 MB')).toBeInTheDocument();
  });

  test('handles status change dropdown', () => {
    render(
      <TaskSubmissionCard 
        submission={mockSubmission}
        onReview={mockOnReview}
        onViewDetails={mockOnViewDetails}
        onStatusChange={mockOnStatusChange}
      />
    );

    const statusSelect = screen.getByDisplayValue('evaluated');
    fireEvent.change(statusSelect, { target: { value: 'shortlisted' } });
    
    expect(mockOnStatusChange).toHaveBeenCalledWith(mockSubmission.id, 'shortlisted');
  });

  test('displays candidate profile picture', () => {
    render(
      <TaskSubmissionCard 
        submission={mockSubmission}
        onReview={mockOnReview}
        onViewDetails={mockOnViewDetails}
        onStatusChange={mockOnStatusChange}
      />
    );

    const profileImage = screen.getByAltText('John Doe');
    expect(profileImage).toBeInTheDocument();
    expect(profileImage).toHaveAttribute('src', 'https://example.com/avatar.jpg');
  });

  test('shows submission date and time', () => {
    render(
      <TaskSubmissionCard 
        submission={mockSubmission}
        onReview={mockOnReview}
        onViewDetails={mockOnViewDetails}
        onStatusChange={mockOnStatusChange}
      />
    );

    expect(screen.getByText(/submitted on/i)).toBeInTheDocument();
    expect(screen.getByText(/Jan 15, 2024/)).toBeInTheDocument();
  });

  test('highlights high-scoring submissions', () => {
    const highScoreSubmission = {
      ...mockSubmission,
      ai_evaluation: {
        ...mockSubmission.ai_evaluation!,
        overall_score: 95
      }
    };

    const { container } = render(
      <TaskSubmissionCard 
        submission={highScoreSubmission}
        onReview={mockOnReview}
        onViewDetails={mockOnViewDetails}
        onStatusChange={mockOnStatusChange}
      />
    );

    expect(container.firstChild).toHaveClass('border-green-200');
  });
});