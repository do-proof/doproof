/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import JobCard from '../JobCard';

const mockJob = {
  id: '1',
  title: 'Senior Software Engineer',
  description: 'We are looking for a senior software engineer with expertise in Python and FastAPI.',
  requirements: ['5+ years experience', 'Python expertise', 'FastAPI knowledge'],
  responsibilities: ['Lead development', 'Mentor junior developers', 'Code reviews'],
  salary: {
    min: 80000,
    max: 120000,
    currency: 'USD'
  },
  location: {
    type: 'hybrid' as const,
    city: 'San Francisco',
    country: 'USA'
  },
  employment_type: 'full-time' as const,
  status: 'active' as const,
  posted_date: '2024-01-15T10:00:00Z',
  closing_date: '2024-12-31T23:59:59Z',
  task: {
    title: 'API Design Challenge',
    description: 'Design a RESTful API for a social media platform',
    instructions: 'Create API endpoints with proper documentation.',
    time_limit: 120,
    submission_format: 'text' as const,
    max_file_size: 10,
    allowed_file_types: ['pdf', 'txt', 'md']
  },
  evaluation_criteria: {
    critical_thinking: 25,
    problem_solving: 30,
    creativity: 15,
    technical_skills: 20,
    communication: 5,
    attention_to_detail: 5
  },
  application_count: 15,
  submission_count: 12,
  view_count: 150,
  company_id: 'company1',
  recruiter_id: 'recruiter1',
  created_at: '2024-01-15T10:00:00Z',
  updated_at: '2024-01-15T10:00:00Z'
};

const mockOnEdit = jest.fn();
const mockOnDelete = jest.fn();
const mockOnStatusChange = jest.fn();

describe('JobCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders job information correctly', () => {
    render(
      <JobCard 
        job={mockJob} 
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onStatusChange={mockOnStatusChange}
      />
    );

    expect(screen.getByText('Senior Software Engineer')).toBeInTheDocument();
    expect(screen.getByText(/We are looking for a senior software engineer/)).toBeInTheDocument();
    expect(screen.getByText('$80,000 - $120,000')).toBeInTheDocument();
    expect(screen.getByText('San Francisco, USA')).toBeInTheDocument();
    expect(screen.getByText('Full-time')).toBeInTheDocument();
  });

  test('displays task information', () => {
    render(
      <JobCard 
        job={mockJob} 
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onStatusChange={mockOnStatusChange}
      />
    );

    expect(screen.getByText('API Design Challenge')).toBeInTheDocument();
    expect(screen.getByText('120 minutes')).toBeInTheDocument();
    expect(screen.getByText('Text submission')).toBeInTheDocument();
  });

  test('shows job metrics', () => {
    render(
      <JobCard 
        job={mockJob} 
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onStatusChange={mockOnStatusChange}
      />
    );

    expect(screen.getByText('150')).toBeInTheDocument(); // views
    expect(screen.getByText('15')).toBeInTheDocument(); // applications
    expect(screen.getByText('12')).toBeInTheDocument(); // submissions
  });

  test('displays correct status badge', () => {
    render(
      <JobCard 
        job={mockJob} 
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onStatusChange={mockOnStatusChange}
      />
    );

    const statusBadge = screen.getByText('Active');
    expect(statusBadge).toBeInTheDocument();
    expect(statusBadge).toHaveClass('bg-green-100', 'text-green-800');
  });

  test('handles edit button click', () => {
    render(
      <JobCard 
        job={mockJob} 
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onStatusChange={mockOnStatusChange}
      />
    );

    const editButton = screen.getByRole('button', { name: /edit/i });
    fireEvent.click(editButton);
    
    expect(mockOnEdit).toHaveBeenCalledWith(mockJob.id);
  });

  test('handles delete button click', () => {
    render(
      <JobCard 
        job={mockJob} 
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onStatusChange={mockOnStatusChange}
      />
    );

    const deleteButton = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteButton);
    
    expect(mockOnDelete).toHaveBeenCalledWith(mockJob.id);
  });

  test('handles status change', () => {
    render(
      <JobCard 
        job={mockJob} 
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onStatusChange={mockOnStatusChange}
      />
    );

    const statusSelect = screen.getByDisplayValue('active');
    fireEvent.change(statusSelect, { target: { value: 'paused' } });
    
    expect(mockOnStatusChange).toHaveBeenCalledWith(mockJob.id, 'paused');
  });

  test('shows draft status correctly', () => {
    const draftJob = { ...mockJob, status: 'draft' as const };
    
    render(
      <JobCard 
        job={draftJob} 
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onStatusChange={mockOnStatusChange}
      />
    );

    const statusBadge = screen.getByText('Draft');
    expect(statusBadge).toHaveClass('bg-gray-100', 'text-gray-800');
  });

  test('displays closing date warning for jobs closing soon', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const urgentJob = { 
      ...mockJob, 
      closing_date: tomorrow.toISOString()
    };
    
    render(
      <JobCard 
        job={urgentJob} 
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onStatusChange={mockOnStatusChange}
      />
    );

    expect(screen.getByText(/closes in 1 day/i)).toBeInTheDocument();
  });

  test('shows evaluation criteria breakdown', () => {
    render(
      <JobCard 
        job={mockJob} 
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onStatusChange={mockOnStatusChange}
      />
    );

    expect(screen.getByText('Problem Solving: 30%')).toBeInTheDocument();
    expect(screen.getByText('Critical Thinking: 25%')).toBeInTheDocument();
    expect(screen.getByText('Technical Skills: 20%')).toBeInTheDocument();
  });

  test('handles remote job location display', () => {
    const remoteJob = {
      ...mockJob,
      location: { type: 'remote' as const }
    };
    
    render(
      <JobCard 
        job={remoteJob} 
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onStatusChange={mockOnStatusChange}
      />
    );

    expect(screen.getByText('Remote')).toBeInTheDocument();
  });
});