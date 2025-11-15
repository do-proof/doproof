import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ProfileForm from '../ProfileForm';

expect.extend(toHaveNoViolations);

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const mockOnSubmit = jest.fn();
const mockOnCancel = jest.fn();

const defaultProps = {
  onSubmit: mockOnSubmit,
  onCancel: mockOnCancel,
  initialData: null
};

const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
};

describe('ProfileForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render all form sections', () => {
    renderWithProviders(<ProfileForm {...defaultProps} />);
    
    expect(screen.getByText(/personal information/i)).toBeInTheDocument();
    expect(screen.getByText(/skills/i)).toBeInTheDocument();
    expect(screen.getByText(/experience/i)).toBeInTheDocument();
    expect(screen.getByText(/career preferences/i)).toBeInTheDocument();
  });

  it('should have no accessibility violations', async () => {
    const { container } = renderWithProviders(<ProfileForm {...defaultProps} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should handle personal information input', async () => {
    renderWithProviders(<ProfileForm {...defaultProps} />);
    
    const firstNameInput = screen.getByLabelText(/first name/i);
    fireEvent.change(firstNameInput, { target: { value: 'John' } });
    
    expect(firstNameInput).toHaveValue('John');
  });

  it('should validate required fields', async () => {
    renderWithProviders(<ProfileForm {...defaultProps} />);
    
    const submitButton = screen.getByRole('button', { name: /save profile/i });
    fireEvent.click(submitButton);
    
    // Form validation should prevent submission
    await waitFor(() => {
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  it('should handle skills input', async () => {
    renderWithProviders(<ProfileForm {...defaultProps} />);
    
    const skillsInput = screen.getByLabelText(/technical skills/i);
    fireEvent.change(skillsInput, { target: { value: 'React, TypeScript' } });
    
    expect(skillsInput).toHaveValue('React, TypeScript');
  });

  it('should handle experience input', async () => {
    renderWithProviders(<ProfileForm {...defaultProps} />);
    
    const experienceInput = screen.getByLabelText(/work experience/i);
    fireEvent.change(experienceInput, { target: { value: '5 years' } });
    
    expect(experienceInput).toHaveValue('5 years');
  });

  it('should handle career preferences', async () => {
    renderWithProviders(<ProfileForm {...defaultProps} />);
    
    const preferredLocation = screen.getByLabelText(/preferred location/i);
    fireEvent.change(preferredLocation, { target: { value: 'remote' } });
    
    expect(preferredLocation).toHaveValue('remote');
  });

  it('should be keyboard navigable', () => {
    renderWithProviders(<ProfileForm {...defaultProps} />);
    
    const firstNameInput = screen.getByLabelText(/first name/i);
    firstNameInput.focus();
    expect(firstNameInput).toHaveFocus();
  });

  it('should call onCancel when cancel button is clicked', () => {
    renderWithProviders(<ProfileForm {...defaultProps} />);
    
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);
    
    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('should handle form submission with valid data', async () => {
    renderWithProviders(<ProfileForm {...defaultProps} />);
    
    // Fill in required fields
    const firstNameInput = screen.getByLabelText(/first name/i);
    const lastNameInput = screen.getByLabelText(/last name/i);
    const emailInput = screen.getByLabelText(/email/i);
    
    fireEvent.change(firstNameInput, { target: { value: 'John' } });
    fireEvent.change(lastNameInput, { target: { value: 'Doe' } });
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    
    const submitButton = screen.getByRole('button', { name: /save profile/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalled();
    });
  });

  it('should display error messages for invalid input', async () => {
    renderWithProviders(<ProfileForm {...defaultProps} />);
    
    const emailInput = screen.getByLabelText(/email/i);
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.blur(emailInput);
    
    await waitFor(() => {
      expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
    });
  });

  it('should be responsive on mobile', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });
    
    renderWithProviders(<ProfileForm {...defaultProps} />);
    
    // Form should still be accessible on mobile
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
  });
});

