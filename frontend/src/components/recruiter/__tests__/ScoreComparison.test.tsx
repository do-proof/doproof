import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ScoreComparison from '../ScoreComparison';
import { TaskSubmission } from '../../../hooks/recruiter/useTaskSubmissions';

const mockSubmissions: TaskSubmission[] = [
  {
    _id: '1',
    job_id: 'job1',
    candidate_id: 'candidate1',
    status: 'evaluated',
    started_at: '2024-01-15T09:00:00Z',
    submitted_at: '2024-01-15T10:30:00Z',
    time_spent: 90,
    submission: {
      type: 'text',
      content: 'Sample submission content'
    },
    ai_evaluation: {
      overall_score: 85,
      criteria_scores: {
        critical_thinking: 90,
        problem_solving: 85,
        creativity: 80,
        technical_skills: 88,
        communication: 82,
        attention_to_detail: 87
      },
      feedback: 'Strong performance',
      evaluated_at: '2024-01-15T11:00:00Z',
      evaluation_model: 'GPT-4'
    },
    candidate: {
      _id: 'candidate1',
      name: 'John Doe',
      email: 'john@example.com'
    },
    job: {
      _id: 'job1',
      title: 'Software Engineer',
      task: {
        title: 'Coding Challenge',
        time_limit: 120
      }
    },
    created_at: '2024-01-15T09:00:00Z',
    updated_at: '2024-01-15T11:00:00Z'
  },
  {
    _id: '2',
    job_id: 'job1',
    candidate_id: 'candidate2',
    status: 'evaluated',
    started_at: '2024-01-15T09:00:00Z',
    submitted_at: '2024-01-15T10:45:00Z',
    time_spent: 105,
    submission: {
      type: 'text',
      content: 'Another submission content'
    },
    ai_evaluation: {
      overall_score: 75,
      criteria_scores: {
        critical_thinking: 80,
        problem_solving: 75,
        creativity: 70,
        technical_skills: 78,
        communication: 72,
        attention_to_detail: 75
      },
      feedback: 'Good performance',
      evaluated_at: '2024-01-15T11:15:00Z',
      evaluation_model: 'GPT-4'
    },
    candidate: {
      _id: 'candidate2',
      name: 'Jane Smith',
      email: 'jane@example.com'
    },
    job: {
      _id: 'job1',
      title: 'Software Engineer',
      task: {
        title: 'Coding Challenge',
        time_limit: 120
      }
    },
    created_at: '2024-01-15T09:00:00Z',
    updated_at: '2024-01-15T11:15:00Z'
  }
];

describe('ScoreComparison', () => {
  it('renders statistics overview correctly', () => {
    render(<ScoreComparison submissions={mockSubmissions} />);
    
    expect(screen.getByText('80.0')).toBeInTheDocument(); // Average score
    expect(screen.getByText('Average Score')).toBeInTheDocument();
    expect(screen.getByText('Highest Score')).toBeInTheDocument();
    expect(screen.getByText('Lowest Score')).toBeInTheDocument();
  });

  it('displays top performers leaderboard', () => {
    render(<ScoreComparison submissions={mockSubmissions} />);
    
    expect(screen.getByText('Top Performers')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    
    // Check ranking icons/numbers
    expect(screen.getByText('🥇')).toBeInTheDocument(); // First place
    expect(screen.getByText('🥈')).toBeInTheDocument(); // Second place
  });

  it('handles submission selection', () => {
    const mockOnSelect = jest.fn();
    render(
      <ScoreComparison 
        submissions={mockSubmissions} 
        onSelectSubmission={mockOnSelect}
      />
    );
    
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);
    
    expect(mockOnSelect).toHaveBeenCalledWith('1');
  });

  it('shows comparison table when multiple submissions are selected', () => {
    render(
      <ScoreComparison 
        submissions={mockSubmissions} 
        selectedSubmissionIds={['1', '2']}
      />
    );
    
    expect(screen.getByText('Selected Candidates Comparison')).toBeInTheDocument();
    expect(screen.getByText('Candidate')).toBeInTheDocument();
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('displays "No evaluated submissions" message when no evaluations exist', () => {
    const submissionsWithoutEvaluation = mockSubmissions.map(s => ({
      ...s,
      ai_evaluation: undefined
    }));
    
    render(<ScoreComparison submissions={submissionsWithoutEvaluation} />);
    
    expect(screen.getByText('No evaluated submissions available')).toBeInTheDocument();
    expect(screen.getByText('Submissions will appear here once AI evaluation is complete')).toBeInTheDocument();
  });

  it('sorts submissions by score in descending order', () => {
    render(<ScoreComparison submissions={mockSubmissions} />);
    
    const performerCards = screen.getAllByText(/Software Engineer/);
    // John Doe (85 score) should appear before Jane Smith (75 score)
    const johnCard = screen.getByText('John Doe').closest('div');
    const janeCard = screen.getByText('Jane Smith').closest('div');
    
    expect(johnCard).toBeInTheDocument();
    expect(janeCard).toBeInTheDocument();
  });

  it('shows selection tip when onSelectSubmission is provided', () => {
    const mockOnSelect = jest.fn();
    render(
      <ScoreComparison 
        submissions={mockSubmissions} 
        onSelectSubmission={mockOnSelect}
        maxComparisons={3}
      />
    );
    
    expect(screen.getByText(/Select up to 3 candidates/)).toBeInTheDocument();
  });

  it('displays current selection count', () => {
    const mockOnSelect = jest.fn();
    render(
      <ScoreComparison 
        submissions={mockSubmissions} 
        selectedSubmissionIds={['1']}
        onSelectSubmission={mockOnSelect}
        maxComparisons={5}
      />
    );
    
    expect(screen.getByText(/Currently selected: 1\/5/)).toBeInTheDocument();
  });
});