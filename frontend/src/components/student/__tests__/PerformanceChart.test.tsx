import React from 'react';
import { render, screen } from '@testing-library/react';
import PerformanceChart from '../PerformanceChart';

describe('PerformanceChart', () => {
  const mockData = [
    { date: '2024-01-01', score: 8.5 },
    { date: '2024-01-02', score: 9.0 },
    { date: '2024-01-03', score: 8.8 },
  ];

  it('renders chart with data', () => {
    render(<PerformanceChart data={mockData} />);

    expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument();
  });

  it('shows empty state when no data', () => {
    render(<PerformanceChart data={[]} />);

    expect(screen.getByText(/no data/i)).toBeInTheDocument();
  });

  it('displays chart title', () => {
    render(<PerformanceChart data={mockData} title="Performance Trend" />);

    expect(screen.getByText('Performance Trend')).toBeInTheDocument();
  });
});
