import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import StudentProfile from '../StudentProfile';

jest.mock('../../../hooks/student/useStudentProfile', () => ({
  useStudentProfile: () => ({
    data: {
      _id: '1',
      personal_info: {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
      },
      skills: ['React', 'TypeScript'],
      profile_completeness: 75,
    },
    isLoading: false,
    error: null,
  }),
  useUpdateStudentProfile: () => ({
    mutate: jest.fn(),
    isLoading: false,
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

describe('StudentProfile', () => {
  it('renders profile page', async () => {
    render(<StudentProfile />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText(/profile/i)).toBeInTheDocument();
    });
  });

  it('displays profile information', async () => {
    render(<StudentProfile />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('John')).toBeInTheDocument();
      expect(screen.getByText('Doe')).toBeInTheDocument();
    });
  });

  it('shows profile completeness', async () => {
    render(<StudentProfile />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText(/75%/)).toBeInTheDocument();
    });
  });
});
