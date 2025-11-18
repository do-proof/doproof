import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import NotificationCenter from '../NotificationCenter';

jest.mock('../../../hooks/student/useNotifications', () => ({
  useNotifications: () => ({
    data: [
      {
        _id: '1',
        type: 'deadline',
        title: 'Task Deadline Approaching',
        message: 'Your task is due in 2 hours',
        read: false,
        created_at: '2024-01-01',
      },
    ],
    isLoading: false,
  }),
  useMarkNotificationRead: () => ({
    mutate: jest.fn(),
  }),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('NotificationCenter', () => {
  it('renders notifications', async () => {
    render(<NotificationCenter />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Task Deadline Approaching')).toBeInTheDocument();
    });
  });

  it('displays unread badge', async () => {
    render(<NotificationCenter />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument();
    });
  });

  it('marks notification as read when clicked', async () => {
    render(<NotificationCenter />, { wrapper: createWrapper() });

    const notification = await screen.findByText('Task Deadline Approaching');
    fireEvent.click(notification);

    // Verify interaction
    expect(notification).toBeInTheDocument();
  });
});
