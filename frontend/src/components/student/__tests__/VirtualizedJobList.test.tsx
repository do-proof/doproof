import React from 'react';
import { render, screen } from '@testing-library/react';
import VirtualizedJobList from '../VirtualizedJobList';

describe('VirtualizedJobList', () => {
  const mockJobs = Array.from({ length: 100 }, (_, i) => ({
    _id: `job${i}`,
    title: `Job ${i}`,
    description: `Description ${i}`,
    task: {
      title: `Task ${i}`,
      time_limit: 120,
      submission_format: 'code' as const,
    },
    status: 'active' as const,
  }));

  it('renders virtualized list', () => {
    render(<VirtualizedJobList jobs={mockJobs} onJobClick={jest.fn()} />);

    // Should render some jobs but not all (virtualized)
    expect(screen.getByText('Job 0')).toBeInTheDocument();
  });

  it('handles empty list', () => {
    render(<VirtualizedJobList jobs={[]} onJobClick={jest.fn()} />);

    expect(screen.getByText(/no jobs/i)).toBeInTheDocument();
  });

  it('calls onJobClick when job is clicked', () => {
    const handleClick = jest.fn();
    render(<VirtualizedJobList jobs={mockJobs} onJobClick={handleClick} />);

    const firstJob = screen.getByText('Job 0');
    firstJob.click();

    expect(handleClick).toHaveBeenCalledWith(mockJobs[0]);
  });
});
