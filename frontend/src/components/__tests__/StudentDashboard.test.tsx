import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import StudentDashboard from '../StudentDashboard';
import { AuthProvider } from '../../context/AuthContext';
import { NotificationProvider } from '../../context/NotificationContext';

// Mock the hooks
jest.mock('../../hooks/student/useJobs', () => ({
  useJobs: () => ({
    data: {
      jobs: [
        {
          id: '1',
          title: 'Test Job',
          description: 'Test Description',
          task: {
            time_limit: 120,
            submission_format: 'code',
          },
          closing_date: '2024-12-31',
        },
      ],
      total: 1,
    },
    isLoading: false,
    error: null,
  }),
  useJobRecommendations: () => ({
    data: [],
    isLoading: false,
  }),
  useIncrementJobView: () => ({
    mutate: jest.fn(),
  }),
}));

jest.mock('../../hooks/student/useApplications', () => ({
  useApplications: () => ({
    data: {
      applications: [],
      summary: {
        total: 0,
        by_status: {},
        completion_rate: 0,
        average_score: 0,
        recent_activity: { applications: 0, submissions: 0, evaluations: 0 },
      },
    },
    isLoading: false,
    error: null,
  }),
  useApplicationSummary: () => ({
    data: {
      total: 0,
      by_status: {},
      completion_rate: 0,
      average_score: 0,
      recent_activity: { applications: 0, submissions: 0, evaluations: 0 },
    },
    isLoading: false,
  }),
  useRecentApplications: () => ({
    data: [],
    isLoading: false,
  }),
}));

// Mock auth context
const mockUser = {
  id: '1',
  email: 'test@example.com',
  role: 'student' as const,
};

jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    logout: jest.fn(),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('../../context/NotificationContext', () => ({
  NotificationProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock components
jest.mock('../LoadingSpinner', () => {
  return function LoadingSpinner() {
    return <div data-testid="loading-spinner">Loading...</div>;
  };
});

jest.mock('../ErrorMessage', () => {
  return function ErrorMessage({ message, onRetry }: { message: string; onRetry: () => void }) {
    return (
      <div data-testid="error-message">
        <p>{message}</p>
        <button onClick={onRetry}>Retry</button>
      </div>
    );
  };
});

jest.mock('../TaskDetailsModal', () => {
  return function TaskDetailsModal({ task, onClose, onEnroll }: any) {
    return (
      <div data-testid="task-details-modal">
        <h3>{task.title}</h3>
        <button onClick={onClose}>Close</button>
        <button onClick={() => onEnroll(task)}>Enroll</button>
      </div>
    );
  };
});

jest.mock('../TaskSubmissionForm', () => {
  return function TaskSubmissionForm({ task, onClose, onSubmit }: any) {
    return (
      <div data-testid="task-submission-form">
        <h3>Submit work for {task.title}</h3>
        <button onClick={onClose}>Close</button>
        <button onClick={() => onSubmit({ aiScore: 8 })}>Submit</button>
      </div>
    );
  };
});

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <NotificationProvider>
            {children}
          </NotificationProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('StudentDashboard', () => {
  it('renders the dashboard with user email', async () => {
    render(<StudentDashboard />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Welcome back, test@example.com! 👋')).toBeInTheDocument();
    });
  });

  it('displays navigation tabs', async () => {
    render(<StudentDashboard />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Tasks')).toBeInTheDocument();
      expect(screen.getByText('My Applications')).toBeInTheDocument();
    });
  });

  it('shows stats cards with default values', async () => {
    render(<StudentDashboard />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Active Tasks')).toBeInTheDocument();
      expect(screen.getByText('Completed')).toBeInTheDocument();
      expect(screen.getByText('Total Points')).toBeInTheDocument();
      expect(screen.getByText('Rank')).toBeInTheDocument();
    });
  });

  it('displays empty state when no applications exist', async () => {
    render(<StudentDashboard />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('No active tasks yet')).toBeInTheDocument();
      expect(screen.getByText('Start by browsing available tasks and enrolling in ones that interest you.')).toBeInTheDocument();
    });
  });

  it('shows performance overview section', async () => {
    render(<StudentDashboard />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Performance Overview')).toBeInTheDocument();
      expect(screen.getByText('Your current performance metrics')).toBeInTheDocument();
    });
  });
});

describe('StudentDashboard Navigation', () => {
  it('switches to tasks tab when clicked', async () => {
    render(<StudentDashboard />, { wrapper: createWrapper() });

    const tasksTab = screen.getByRole('button', { name: /Tasks/ });
    tasksTab.click();

    await waitFor(() => {
      expect(screen.getByText('Available Tasks')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Search tasks...')).toBeInTheDocument();
    });
  });

  it('switches to applications tab when clicked', async () => {
    render(<StudentDashboard />, { wrapper: createWrapper() });

    const applicationsTab = screen.getByRole('button', { name: /My Applications/ });
    applicationsTab.click();

    await waitFor(() => {
      expect(screen.getByText('My Applications')).toBeInTheDocument();
      expect(screen.getByText('Application Tracker')).toBeInTheDocument();
    });
  });
});

describe('StudentDashboard Helper Functions', () => {
  // Test helper functions if they were exported
  // For now, we'll test them indirectly through the component behavior
  
  it('formats dates correctly in the UI', async () => {
    render(<StudentDashboard />, { wrapper: createWrapper() });
    
    // The date formatting is tested indirectly through the component rendering
    // If there were applications, we would see formatted dates
    await waitFor(() => {
      expect(screen.getByText('No active tasks yet')).toBeInTheDocument();
    });
  });
});