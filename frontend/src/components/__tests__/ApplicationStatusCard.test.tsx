import React from 'react';
import { render, screen } from '@testing-library/react';
import ApplicationStatusCard from '../ApplicationStatusCard';
import { StudentApplication } from '../../hooks/student/useApplications';
import { Job } from '../../hooks/student/useJobs';

const mockApplication: StudentApplication = {
  _id: 'app-1',
  job_id: 'job-1',
  student_id: 'student-1',
  status: 'in_progress',
  enrolled_at: '2024-01-01T00:00:00Z',
  time_spent: 120, // 2 hours
  progress: {
    time_spent: 120,
    last_activity: '2024-01-01T02:00:00Z',
    completion_percentage: 50
  },
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T02:00:00Z'
};

const mockJob: Job = {
  id: 'job-1',
  title: 'Frontend Developer',
  company_name: 'Tech Corp',
  description: 'Build amazing UIs',
  difficulty: 'Medium',
  reward_points: 100,
  deadline: '2024-12-31',
  task: {
    submission_format: 'code'
  }
};

describe('ApplicationStatusCard', () => {
  it('renders application information correctly', () => {
    render(
      <ApplicationStatusCard
        application={mockApplication}
        job={mockJob}
      />
    );

    expect(screen.getByText('Frontend Developer')).toBeInTheDocument();
    expect(screen.getByText('Tech Corp')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(screen.getByText('2h 0m')).toBeInTheDocument();
  });

  it('shows loading state when job is not provided', () => {
    render(
      <ApplicationStatusCard
        application={mockApplication}
      />
    );

    expect(screen.getByText('Loading job details...')).toBeInTheDocument();
  });

  it('renders in compact mode', () => {
    render(
      <ApplicationStatusCard
        application={mockApplication}
        job={mockJob}
        compact={true}
      />
    );

    expect(screen.getByText('Frontend Developer')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
  });

  it('shows AI evaluation when available', () => {
    const applicationWithEvaluation = {
      ...mockApplication,
      ai_evaluation: {
        overall_score: 85,
        criteria_scores: { technical: 8, communication: 9 },
        feedback: 'Great work!',
        evaluated_at: '2024-01-01T03:00:00Z'
      }
    };

    render(
      <ApplicationStatusCard
        application={applicationWithEvaluation}
        job={mockJob}
      />
    );

    expect(screen.getByText('AI Evaluation')).toBeInTheDocument();
    expect(screen.getByText('85/100')).toBeInTheDocument();
  });

  it('shows recruiter review when available', () => {
    const applicationWithReview = {
      ...mockApplication,
      recruiter_review: {
        decision: 'shortlist' as const,
        rating: 4,
        notes: 'Excellent candidate',
        reviewed_at: '2024-01-01T04:00:00Z'
      }
    };

    render(
      <ApplicationStatusCard
        application={applicationWithReview}
        job={mockJob}
      />
    );

    expect(screen.getByText('Recruiter Review')).toBeInTheDocument();
  });

  it('shows appropriate action button based on status', () => {
    const enrolledApplication = { ...mockApplication, status: 'enrolled' as const };
    
    render(
      <ApplicationStatusCard
        application={enrolledApplication}
        job={mockJob}
      />
    );

    expect(screen.getByText('Start Work')).toBeInTheDocument();
  });
});