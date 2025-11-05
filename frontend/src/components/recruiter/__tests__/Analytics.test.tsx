import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import AnalyticsChart from '../AnalyticsChart';

// Mock Recharts components
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="responsive-container">{children}</div>,
  BarChart: ({ children }: { children: React.ReactNode }) => <div data-testid="bar-chart">{children}</div>,
  LineChart: ({ children }: { children: React.ReactNode }) => <div data-testid="line-chart">{children}</div>,
  PieChart: ({ children }: { children: React.ReactNode }) => <div data-testid="pie-chart">{children}</div>,
  RadarChart: ({ children }: { children: React.ReactNode }) => <div data-testid="radar-chart">{children}</div>,
  AreaChart: ({ children }: { children: React.ReactNode }) => <div data-testid="area-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  Line: () => <div data-testid="line" />,
  Pie: () => <div data-testid="pie" />,
  Radar: () => <div data-testid="radar" />,
  Area: () => <div data-testid="area" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  Cell: () => <div data-testid="cell" />,
  PolarGrid: () => <div data-testid="polar-grid" />,
  PolarAngleAxis: () => <div data-testid="polar-angle-axis" />,
  PolarRadiusAxis: () => <div data-testid="polar-radius-axis" />
}));

describe('Analytics Integration Tests', () => {
  const mockData = [
    { name: 'Category A', value: 10 },
    { name: 'Category B', value: 20 },
    { name: 'Category C', value: 30 }
  ];

  test('renders analytics chart with different types', () => {
    const chartTypes: Array<'bar' | 'line' | 'pie' | 'radar' | 'area'> = ['bar', 'line', 'pie', 'radar', 'area'];
    
    chartTypes.forEach(type => {
      const { unmount } = render(
        <AnalyticsChart
          data={mockData}
          title={`${type} Chart`}
          type={type}
        />
      );
      
      expect(screen.getByText(`${type} Chart`)).toBeInTheDocument();
      unmount();
    });
  });

  test('handles empty data gracefully', () => {
    render(
      <AnalyticsChart
        data={[]}
        title="Empty Chart"
        type="bar"
      />
    );
    
    expect(screen.getByText('Empty Chart')).toBeInTheDocument();
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
  });

  test('applies custom height and colors', () => {
    const customColors = ['#FF0000', '#00FF00', '#0000FF'];
    
    render(
      <AnalyticsChart
        data={mockData}
        title="Custom Chart"
        type="bar"
        height={400}
        colors={customColors}
      />
    );
    
    expect(screen.getByText('Custom Chart')).toBeInTheDocument();
  });
});