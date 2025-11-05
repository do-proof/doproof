/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import AIScoreDisplay from '../AIScoreDisplay';

const mockEvaluation = {
  overall_score: 85,
  criteria_scores: {
    critical_thinking: 80,
    problem_solving: 90,
    creativity: 75,
    technical_skills: 88,
    communication: 82,
    attention_to_detail: 85
  },
  feedback: 'Excellent solution with good API design principles. Shows strong understanding of RESTful conventions.',
  evaluated_at: '2024-01-15T12:00:00Z',
  evaluation_model: 'gpt-4'
};

describe('AIScoreDisplay', () => {
  test('renders overall score correctly', () => {
    render(<AIScoreDisplay evaluation={mockEvaluation} />);

    expect(screen.getByText('85')).toBeInTheDocument();
    expect(screen.getByText(/overall score/i)).toBeInTheDocument();
  });

  test('displays all criteria scores', () => {
    render(<AIScoreDisplay evaluation={mockEvaluation} />);

    expect(screen.getByText('Critical Thinking')).toBeInTheDocument();
    expect(screen.getByText('80')).toBeInTheDocument();
    
    expect(screen.getByText('Problem Solving')).toBeInTheDocument();
    expect(screen.getByText('90')).toBeInTheDocument();
    
    expect(screen.getByText('Creativity')).toBeInTheDocument();
    expect(screen.getByText('75')).toBeInTheDocument();
    
    expect(screen.getByText('Technical Skills')).toBeInTheDocument();
    expect(screen.getByText('88')).toBeInTheDocument();
    
    expect(screen.getByText('Communication')).toBeInTheDocument();
    expect(screen.getByText('82')).toBeInTheDocument();
    
    expect(screen.getByText('Attention to Detail')).toBeInTheDocument();
    expect(screen.getByText('85')).toBeInTheDocument();
  });

  test('shows AI feedback', () => {
    render(<AIScoreDisplay evaluation={mockEvaluation} />);

    expect(screen.getByText(/Excellent solution with good API design principles/)).toBeInTheDocument();
  });

  test('displays evaluation metadata', () => {
    render(<AIScoreDisplay evaluation={mockEvaluation} />);

    expect(screen.getByText(/evaluated by gpt-4/i)).toBeInTheDocument();
    expect(screen.getByText(/Jan 15, 2024/)).toBeInTheDocument();
  });

  test('applies correct color coding for scores', () => {
    render(<AIScoreDisplay evaluation={mockEvaluation} />);

    // High score (90) should be green
    const problemSolvingScore = screen.getByText('90');
    expect(problemSolvingScore.closest('.score-item')).toHaveClass('text-green-600');

    // Medium score (75) should be yellow
    const creativityScore = screen.getByText('75');
    expect(creativityScore.closest('.score-item')).toHaveClass('text-yellow-600');
  });

  test('shows score distribution chart', () => {
    render(<AIScoreDisplay evaluation={mockEvaluation} showChart />);

    expect(screen.getByTestId('score-chart')).toBeInTheDocument();
  });

  test('handles compact display mode', () => {
    render(<AIScoreDisplay evaluation={mockEvaluation} compact />);

    // In compact mode, should show overall score prominently
    expect(screen.getByText('85')).toBeInTheDocument();
    
    // But criteria details might be collapsed or hidden
    expect(screen.queryByText('Critical Thinking')).not.toBeInTheDocument();
  });

  test('displays score percentiles when provided', () => {
    const evaluationWithPercentiles = {
      ...mockEvaluation,
      percentiles: {
        overall: 92,
        critical_thinking: 85,
        problem_solving: 95,
        creativity: 70,
        technical_skills: 90,
        communication: 88,
        attention_to_detail: 87
      }
    };

    render(<AIScoreDisplay evaluation={evaluationWithPercentiles} showPercentiles />);

    expect(screen.getByText('92nd percentile')).toBeInTheDocument();
  });

  test('shows improvement suggestions when available', () => {
    const evaluationWithSuggestions = {
      ...mockEvaluation,
      suggestions: [
        'Consider adding more error handling examples',
        'Include rate limiting strategies',
        'Add more detailed API documentation'
      ]
    };

    render(<AIScoreDisplay evaluation={evaluationWithSuggestions} showSuggestions />);

    expect(screen.getByText('Consider adding more error handling examples')).toBeInTheDocument();
    expect(screen.getByText('Include rate limiting strategies')).toBeInTheDocument();
  });

  test('handles missing criteria gracefully', () => {
    const incompleteEvaluation = {
      overall_score: 75,
      criteria_scores: {
        critical_thinking: 80,
        problem_solving: 70
        // Missing other criteria
      },
      feedback: 'Partial evaluation',
      evaluated_at: '2024-01-15T12:00:00Z',
      evaluation_model: 'gpt-3.5'
    };

    render(<AIScoreDisplay evaluation={incompleteEvaluation} />);

    expect(screen.getByText('75')).toBeInTheDocument();
    expect(screen.getByText('Critical Thinking')).toBeInTheDocument();
    expect(screen.getByText('Problem Solving')).toBeInTheDocument();
    
    // Should not crash when other criteria are missing
    expect(screen.queryByText('Creativity')).not.toBeInTheDocument();
  });

  test('displays confidence level when provided', () => {
    const evaluationWithConfidence = {
      ...mockEvaluation,
      confidence: 0.92
    };

    render(<AIScoreDisplay evaluation={evaluationWithConfidence} showConfidence />);

    expect(screen.getByText('92% confidence')).toBeInTheDocument();
  });

  test('shows evaluation time duration', () => {
    const evaluationWithDuration = {
      ...mockEvaluation,
      evaluation_duration: 45 // seconds
    };

    render(<AIScoreDisplay evaluation={evaluationWithDuration} showMetadata />);

    expect(screen.getByText('Evaluated in 45 seconds')).toBeInTheDocument();
  });
});