import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ErrorBoundary from '../ErrorBoundary';
import ErrorMessage, { NetworkErrorMessage, ValidationErrorMessage, PermissionErrorMessage } from '../ErrorMessage';
import QueryErrorHandler, { FullPageError } from '../QueryErrorHandler';
import { FormErrorDisplay, FormFieldWrapper, FormErrorSummary, FormSuccessMessage } from '../FormErrorDisplay';

// Component that throws an error for testing
const ThrowError: React.FC<{ shouldThrow?: boolean }> = ({ shouldThrow = true }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

describe('Error Handling Components', () => {
  describe('ErrorBoundary', () => {
    // Suppress console.error for these tests
    const originalError = console.error;
    beforeAll(() => {
      console.error = jest.fn();
    });

    afterAll(() => {
      console.error = originalError;
    });

    it('renders children when there is no error', () => {
      render(
        <ErrorBoundary>
          <div>Test content</div>
        </ErrorBoundary>
      );

      expect(screen.getByText('Test content')).toBeInTheDocument();
    });

    it('renders error UI when child component throws', () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('renders custom fallback when provided', () => {
      render(
        <ErrorBoundary fallback={<div>Custom error UI</div>}>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByText('Custom error UI')).toBeInTheDocument();
    });

    it('calls onError callback when error occurs', () => {
      const onError = jest.fn();
      
      render(
        <ErrorBoundary onError={onError}>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(onError).toHaveBeenCalled();
    });

    it('allows retry after error', () => {
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();

      const retryButton = screen.getByText('Try Again');
      fireEvent.click(retryButton);

      rerender(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      expect(screen.getByText('No error')).toBeInTheDocument();
    });
  });

  describe('ErrorMessage', () => {
    it('renders error message with title', () => {
      render(
        <ErrorMessage
          title="Error Title"
          message="Error message"
          type="error"
        />
      );

      expect(screen.getByText('Error Title')).toBeInTheDocument();
      expect(screen.getByText('Error message')).toBeInTheDocument();
    });

    it('renders retry button when onRetry is provided', () => {
      const onRetry = jest.fn();
      
      render(
        <ErrorMessage
          message="Error message"
          onRetry={onRetry}
        />
      );

      const retryButton = screen.getByText('Try Again');
      fireEvent.click(retryButton);

      expect(onRetry).toHaveBeenCalled();
    });

    it('renders dismiss button when dismissible', () => {
      const onDismiss = jest.fn();
      
      render(
        <ErrorMessage
          message="Error message"
          onDismiss={onDismiss}
          dismissible={true}
        />
      );

      const dismissButton = screen.getByLabelText('Dismiss');
      fireEvent.click(dismissButton);

      expect(onDismiss).toHaveBeenCalled();
    });

    it('renders different styles for different types', () => {
      const { rerender } = render(
        <ErrorMessage message="Error" type="error" />
      );
      expect(screen.getByText('Error').closest('div')).toHaveClass('bg-red-50');

      rerender(<ErrorMessage message="Warning" type="warning" />);
      expect(screen.getByText('Warning').closest('div')).toHaveClass('bg-yellow-50');

      rerender(<ErrorMessage message="Info" type="info" />);
      expect(screen.getByText('Info').closest('div')).toHaveClass('bg-blue-50');
    });
  });

  describe('Specialized Error Messages', () => {
    it('renders NetworkErrorMessage with correct content', () => {
      render(<NetworkErrorMessage />);

      expect(screen.getByText('Connection Error')).toBeInTheDocument();
      expect(screen.getByText(/Unable to connect to the server/)).toBeInTheDocument();
    });

    it('renders ValidationErrorMessage with errors', () => {
      render(<ValidationErrorMessage errors={['Error 1', 'Error 2']} />);

      expect(screen.getByText('Validation Error')).toBeInTheDocument();
      expect(screen.getByText(/2 errors/)).toBeInTheDocument();
    });

    it('renders PermissionErrorMessage', () => {
      render(<PermissionErrorMessage />);

      expect(screen.getByText('Access Denied')).toBeInTheDocument();
    });
  });

  describe('QueryErrorHandler', () => {
    it('renders network error for network errors', () => {
      const error = { code: 'NETWORK_ERROR', message: 'Network error' };
      
      render(<QueryErrorHandler error={error} />);

      expect(screen.getByText('Connection Error')).toBeInTheDocument();
    });

    it('renders authentication error for 401', () => {
      const error = { status: 401, message: 'Unauthorized' };
      
      render(<QueryErrorHandler error={error} />);

      expect(screen.getByText('Authentication Required')).toBeInTheDocument();
    });

    it('renders permission error for 403', () => {
      const error = { status: 403, message: 'Forbidden' };
      
      render(<QueryErrorHandler error={error} />);

      expect(screen.getByText('Access Denied')).toBeInTheDocument();
    });

    it('renders not found error for 404', () => {
      const error = { status: 404, message: 'Not found' };
      
      render(<QueryErrorHandler error={error} />);

      expect(screen.getByText('Not Found')).toBeInTheDocument();
    });

    it('renders server error for 5xx', () => {
      const error = { status: 500, message: 'Server error' };
      
      render(<QueryErrorHandler error={error} />);

      expect(screen.getByText('Server Error')).toBeInTheDocument();
    });
  });

  describe('Form Error Components', () => {
    it('renders FormErrorDisplay when error and touched', () => {
      render(<FormErrorDisplay error="Field is required" touched={true} />);

      expect(screen.getByText('Field is required')).toBeInTheDocument();
    });

    it('does not render FormErrorDisplay when not touched', () => {
      render(<FormErrorDisplay error="Field is required" touched={false} />);

      expect(screen.queryByText('Field is required')).not.toBeInTheDocument();
    });

    it('renders FormFieldWrapper with label and error', () => {
      render(
        <FormFieldWrapper
          label="Email"
          htmlFor="email"
          error="Invalid email"
          touched={true}
          required={true}
        >
          <input id="email" type="email" />
        </FormFieldWrapper>
      );

      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('*')).toBeInTheDocument();
      expect(screen.getByText('Invalid email')).toBeInTheDocument();
    });

    it('renders FormErrorSummary with multiple errors', () => {
      const errors = {
        email: 'Invalid email',
        password: 'Password too short'
      };
      const touched = {
        email: true,
        password: true
      };

      render(<FormErrorSummary errors={errors} touched={touched} />);

      expect(screen.getByText(/fix the following errors/)).toBeInTheDocument();
      expect(screen.getByText('Invalid email')).toBeInTheDocument();
      expect(screen.getByText('Password too short')).toBeInTheDocument();
    });

    it('does not render FormErrorSummary when no errors', () => {
      render(<FormErrorSummary errors={{}} touched={{}} />);

      expect(screen.queryByText(/fix the following errors/)).not.toBeInTheDocument();
    });

    it('renders FormSuccessMessage', () => {
      const onDismiss = jest.fn();
      
      render(
        <FormSuccessMessage
          message="Form submitted successfully"
          onDismiss={onDismiss}
        />
      );

      expect(screen.getByText('Form submitted successfully')).toBeInTheDocument();
      
      const dismissButton = screen.getByRole('button');
      fireEvent.click(dismissButton);
      
      expect(onDismiss).toHaveBeenCalled();
    });
  });

  describe('FullPageError', () => {
    it('renders full page error with action button', () => {
      const onAction = jest.fn();
      const error = new Error('Test error');
      
      render(
        <FullPageError
          error={error}
          actionLabel="Go Home"
          onAction={onAction}
        />
      );

      expect(screen.getByText('Test error')).toBeInTheDocument();
      
      const actionButton = screen.getByText('Go Home');
      fireEvent.click(actionButton);
      
      expect(onAction).toHaveBeenCalled();
    });
  });
});
