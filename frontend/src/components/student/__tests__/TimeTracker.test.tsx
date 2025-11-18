import React from 'react';
import { render, screen, act } from '@testing-library/react';
import TimeTracker from '../TimeTracker';

jest.useFakeTimers();

describe('TimeTracker', () => {
  it('renders initial time', () => {
    render(<TimeTracker initialTime={0} isRunning={false} />);

    expect(screen.getByText('00:00:00')).toBeInTheDocument();
  });

  it('increments time when running', () => {
    render(<TimeTracker initialTime={0} isRunning={true} />);

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(screen.getByText('00:00:01')).toBeInTheDocument();
  });

  it('stops when isRunning is false', () => {
    const { rerender } = render(<TimeTracker initialTime={0} isRunning={true} />);

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    rerender(<TimeTracker initialTime={5} isRunning={false} />);

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(screen.getByText('00:00:05')).toBeInTheDocument();
  });

  it('formats time correctly', () => {
    render(<TimeTracker initialTime={3665} isRunning={false} />);

    expect(screen.getByText('01:01:05')).toBeInTheDocument();
  });
});

jest.useRealTimers();
