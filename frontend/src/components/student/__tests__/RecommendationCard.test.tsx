import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import RecommendationCard from '../RecommendationCard';
import { JobRecommendation } from '../../../hooks/student/useRecommendations';

// Mock the hooks
jest.mock('../../../hooks/student/useRecommendations', () => ({
  useSubmitRecommendationFeedback: () => ({
    mutateAsync: jest.fn(),
    isPending: false
  })
}));

jest.mock('../../../hooks/student/useApplications', () => ({
  useEnrollInJob: () => ({
    mutateAsync: jest.fn(),
    isPending: false
  })
}));

const mockRecommendation: JobRecommendation = {
  job: {
    id: 'job-1',
    title: 'Frontend Developer',
    company_name: 'Tech Corp',
    description: 'Build amazing user interfaces with React and TypeScript',
    difficulty: 'Medium',
    employment_type: 'full-time',
    reward_points: 150,
    location: {
      type: 'remote'
    },
    task: {
      submission_format: 'code'
    }
  },
  match_score: 85,
  match_reasons: [
    'Strong React experience matches job requirements',
    'TypeScript skills align with tech stack',
    'Previous frontend projects show relevant experience'
  ],
  skill_gaps: ['GraphQL', 'Testing'],
  similar_successful_profiles: 12,
  career_alignment_score: 90,
  market_demand_score: 80,
  success_probability: 0.75
};

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

describe('RecommendationCard', () => {
  it('renders recommendation information correctly', () => {
    renderWithQueryClient(
      <RecommendationCard recommendation={mockRecommendation} />
    );

    expect(screen.getByText('Frontend Developer')).toBeInTheDocument();
    expect(screen.getByText('Tech Corp')).toBeInTheDocument();
    expect(screen.getByText('85% Match')).toBeInTheDocument();
    expect(screen.getByText('⭐ Recommended')).toBeInTheDocument();
  });

  it('displays match reasons when showReasons is true', () => {
    renderWithQueryClient(
      <RecommendationCard 
        recommendation={mockRecommendation} 
        showReasons={true}
      />
    );

    expect(screen.getByText('Why this is recommended:')).toBeInTheDocument();
    expect(screen.getByText('Strong React experience matches job requirements')).toBeInTheDocument();
  });

  it('shows skill gaps when not in compact mode', () => {
    renderWithQueryClient(
      <RecommendationCard 
        recommendation={mockRecommendation} 
        compact={false}
      />
    );

    expect(screen.getByText('Skills to develop:')).toBeInTheDocument();
    expect(screen.getByText('GraphQL')).toBeInTheDocument();
    expect(screen.getByText('Testing')).toBeInTheDocument();
  });

  it('displays success indicator', () => {
    renderWithQueryClient(
      <RecommendationCard recommendation={mockRecommendation} />
    );

    expect(screen.getByText('👥 12 similar profiles succeeded in this role')).toBeInTheDocument();
  });

  it('shows action buttons', () => {
    renderWithQueryClient(
      <RecommendationCard recommendation={mockRecommendation} />
    );

    expect(screen.getByText('View Details')).toBeInTheDocument();
    expect(screen.getByText('Apply Now')).toBeInTheDocument();
  });

  it('shows feedback buttons', () => {
    renderWithQueryClient(
      <RecommendationCard recommendation={mockRecommendation} />
    );

    // Check for emoji feedback buttons
    expect(screen.getByTitle('This recommendation is helpful')).toBeInTheDocument();
    expect(screen.getByTitle('This recommendation is not helpful')).toBeInTheDocument();
    expect(screen.getByTitle('Provide detailed feedback')).toBeInTheDocument();
  });

  it('renders in compact mode', () => {
    renderWithQueryClient(
      <RecommendationCard 
        recommendation={mockRecommendation} 
        compact={true}
      />
    );

    expect(screen.getByText('Frontend Developer')).toBeInTheDocument();
    // Skill gaps should not be shown in compact mode
    expect(screen.queryByText('Skills to develop:')).not.toBeInTheDocument();
  });

  it('handles different match score colors', () => {
    const highScoreRecommendation = {
      ...mockRecommendation,
      match_score: 95
    };

    renderWithQueryClient(
      <RecommendationCard recommendation={highScoreRecommendation} />
    );

    const matchBadge = screen.getByText('95% Match');
    expect(matchBadge).toHaveClass('text-green-600');
  });

  it('shows remote location correctly', () => {
    renderWithQueryClient(
      <RecommendationCard recommendation={mockRecommendation} />
    );

    expect(screen.getByText('📍 Remote')).toBeInTheDocument();
  });
});