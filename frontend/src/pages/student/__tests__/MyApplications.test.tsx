import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import MyApplications from '../MyApplications';

jest.mock('../../../hooks/student/useApplications', () => ({
  useApplications: () => ({
    data: {
      applications: [
        {
          _id: '1',
          job_id: 'job1',
          status: 'in_progress',
          job_title: 'Frontend Developer',
          created_at: '2024-01-01',
        },
      ],
      summary: {
        total: 1,
        by_status: { in_progress: 1 },
        completion_rate: 0,
        average_score: 0,
      },
    },
    isLoading: false,
    error: null,
  }),
}));

jest.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: '1', email: 'test@example.com', role: 'student' },
  }),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  );
};

describe('MyApplications', () => {
  it('renders applications list', async () => {
    render(<MyApplications />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText(/my applications/i)).toBeInTheDocument();
    });
  });

  it('displays application cards', async () => {
    render(<MyApplications />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Frontend Developer')).toBeInTheDocument();
    });
  });

  it('shows application summary', async () => {
    render(<MyApplications />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText(/total/i)).toBeInTheDocument();
    });
  });
});
