# Error Handling and Loading States Documentation

This document describes the comprehensive error handling and loading state system implemented for the DoProof student features.

## Overview

The error handling system provides:
- **Error Boundaries** for catching React component errors
- **Query Error Handling** for API and data fetching errors
- **Form Validation** with real-time feedback
- **Network Status Detection** with offline support
- **Retry Mechanisms** with exponential backoff
- **Error Logging** and monitoring integration
- **Loading States** with skeleton screens and spinners

## Components

### Error Boundaries

#### `ErrorBoundary`
Generic error boundary for catching React errors.

```tsx
import ErrorBoundary from './components/ErrorBoundary';

<ErrorBoundary
  fallback={<CustomErrorUI />}
  onError={(error, errorInfo) => console.log(error)}
>
  <YourComponent />
</ErrorBoundary>
```

#### `StudentErrorBoundary`
Specialized error boundary for student pages with custom fallback UI.

```tsx
import StudentErrorBoundary from './components/student/StudentErrorBoundary';

<StudentErrorBoundary pageTitle="My Applications">
  <MyApplications />
</StudentErrorBoundary>
```

### Error Display Components

#### `ErrorMessage`
Flexible error message component with retry functionality.

```tsx
import ErrorMessage from './components/ErrorMessage';

<ErrorMessage
  title="Error Title"
  message="Error description"
  type="error" // 'error' | 'warning' | 'info'
  onRetry={() => refetch()}
  onDismiss={() => setError(null)}
  dismissible={true}
/>
```

#### Specialized Error Messages

```tsx
import { 
  NetworkErrorMessage, 
  ValidationErrorMessage, 
  PermissionErrorMessage 
} from './components/ErrorMessage';

// Network error
<NetworkErrorMessage onRetry={() => refetch()} />

// Validation errors
<ValidationErrorMessage errors={['Error 1', 'Error 2']} />

// Permission error
<PermissionErrorMessage />
```

#### `QueryErrorHandler`
Intelligent error handler that displays appropriate UI based on error type.

```tsx
import QueryErrorHandler from './components/QueryErrorHandler';

<QueryErrorHandler
  error={error}
  onRetry={() => refetch()}
  fallbackMessage="Failed to load data"
/>
```

### Form Error Components

#### `FormErrorDisplay`
Display individual field errors.

```tsx
import { FormErrorDisplay } from './components/FormErrorDisplay';

<FormErrorDisplay
  error={errors.email}
  touched={touched.email}
/>
```

#### `FormFieldWrapper`
Complete form field with label, help text, and error display.

```tsx
import { FormFieldWrapper } from './components/FormErrorDisplay';

<FormFieldWrapper
  label="Email"
  htmlFor="email"
  error={errors.email}
  touched={touched.email}
  required={true}
  helpText="Enter your email address"
>
  <input id="email" type="email" {...getFieldProps('email')} />
</FormFieldWrapper>
```

#### `FormErrorSummary`
Display all form errors in a summary.

```tsx
import { FormErrorSummary } from './components/FormErrorDisplay';

<FormErrorSummary
  errors={errors}
  touched={touched}
  title="Please fix the following errors:"
/>
```

#### `FormSuccessMessage`
Display success messages after form submission.

```tsx
import { FormSuccessMessage } from './components/FormErrorDisplay';

<FormSuccessMessage
  message="Profile updated successfully!"
  onDismiss={() => setSuccess(false)}
/>
```

### Loading State Components

#### `LoadingSpinner`
Basic loading spinner with customizable size and color.

```tsx
import LoadingSpinner from './components/LoadingSpinner';

<LoadingSpinner size="lg" color="blue" text="Loading..." />
```

#### `LoadingOverlay`
Full-screen loading overlay.

```tsx
import { LoadingOverlay } from './components/LoadingStates';

<LoadingOverlay message="Saving changes..." transparent={true} />
```

#### `ButtonLoading`
Button with loading state.

```tsx
import { ButtonLoading } from './components/LoadingStates';

<ButtonLoading
  loading={isSubmitting}
  loadingText="Saving..."
  onClick={handleSubmit}
  className="btn-primary"
>
  Save Changes
</ButtonLoading>
```

#### `ProgressBar`
Progress indicator for long-running operations.

```tsx
import { ProgressBar } from './components/LoadingStates';

<ProgressBar
  progress={uploadProgress}
  label="Uploading file..."
  showPercentage={true}
  color="blue"
/>
```

#### `EmptyState`
Display when there's no data to show.

```tsx
import { EmptyState } from './components/LoadingStates';

<EmptyState
  icon="📋"
  title="No applications yet"
  message="Start by browsing available tasks"
  action={{
    label: 'Browse Tasks',
    onClick: () => navigate('/tasks')
  }}
/>
```

### Skeleton Loaders

#### `SkeletonLoader`
Basic skeleton loader for content placeholders.

```tsx
import SkeletonLoader from './components/SkeletonLoader';

<SkeletonLoader width="w-full" height="h-4" lines={3} />
```

#### Specialized Skeletons

```tsx
import { 
  CardSkeleton, 
  JobCardSkeleton, 
  CandidateCardSkeleton 
} from './components/SkeletonLoader';

<JobCardSkeleton />
```

#### Page Skeletons

```tsx
import { 
  ApplicationsPageSkeleton,
  RecommendationsPageSkeleton,
  AnalyticsPageSkeleton,
  ProfilePageSkeleton,
  SubmissionHistoryPageSkeleton
} from './components/student/StudentPageSkeletons';

<ApplicationsPageSkeleton />
```

## Hooks

### `useErrorHandler`
Hook for handling errors with notifications and logging.

```tsx
import { useErrorHandler } from './hooks/useErrorHandler';

const { handleError, handleNetworkError, handleAuthError, handleValidationError } = useErrorHandler();

try {
  await apiCall();
} catch (error) {
  handleError(error, {
    showNotification: true,
    logError: true,
    customMessage: 'Failed to save data'
  });
}
```

### `useFormValidation`
Hook for form validation with real-time feedback.

```tsx
import { useFormValidation, validationRules } from './hooks/useFormValidation';

const {
  values,
  errors,
  touched,
  isValid,
  setValue,
  handleBlur,
  handleSubmit,
  getFieldProps
} = useFormValidation(
  { email: '', password: '' },
  {
    email: [validationRules.required(), validationRules.email()],
    password: [validationRules.required(), validationRules.minLength(8)]
  }
);

<input {...getFieldProps('email')} />
```

### `useLoadingState`
Hook for managing multiple loading states.

```tsx
import { useLoadingState } from './hooks/useLoadingState';

const { loading, isLoading, setLoading, withLoading } = useLoadingState();

const fetchData = async () => {
  await withLoading('fetchData', async () => {
    const data = await api.get('/data');
    return data;
  });
};

{isLoading('fetchData') && <LoadingSpinner />}
```

### `useRetry`
Hook for retrying failed operations with exponential backoff.

```tsx
import { useRetry } from './hooks/useRetry';

const { execute, retry, state } = useRetry(
  apiCall,
  {
    maxAttempts: 3,
    delay: 1000,
    backoffMultiplier: 2,
    onRetry: (attempt) => console.log(`Retry attempt ${attempt}`)
  }
);

<button onClick={() => execute()} disabled={state.isRetrying}>
  {state.isRetrying ? `Retrying (${state.attempt}/3)...` : 'Submit'}
</button>
```

### `useOfflineDetection`
Hook for detecting online/offline status.

```tsx
import { useOfflineDetection } from './hooks/useOfflineDetection';

const { isOnline, isOffline, wasOffline } = useOfflineDetection();

{isOffline && <OfflineBanner />}
```

## Utilities

### Error Logger

```tsx
import { errorLogger } from './utils/errorLogger';

// Log an error
errorLogger.logError(error, {
  componentStack: errorInfo.componentStack,
  userId: user.id,
  metadata: { action: 'submit_form' }
});

// Log a warning
errorLogger.logWarning('Deprecated API used', {
  metadata: { endpoint: '/old-api' }
});

// Get recent logs
const recentLogs = errorLogger.getRecentLogs(10);

// Export logs for debugging
const logsJson = errorLogger.exportLogs();

// Get error statistics
const stats = errorLogger.getErrorStats();
```

### Validation Helpers

```tsx
import {
  isValidEmail,
  isValidUrl,
  isValidPhone,
  validatePasswordStrength,
  isValidFileSize,
  isValidFileType,
  sanitizeInput
} from './utils/validationHelpers';

// Validate email
if (!isValidEmail(email)) {
  setError('Invalid email address');
}

// Validate password strength
const { isValid, strength, feedback } = validatePasswordStrength(password);

// Validate file
if (!isValidFileSize(file, 5)) {
  setError('File must be less than 5MB');
}

// Sanitize user input
const clean = sanitizeInput(userInput);
```

## Best Practices

### 1. Always Wrap Pages with Error Boundaries

```tsx
<StudentErrorBoundary pageTitle="My Page">
  <MyPage />
</StudentErrorBoundary>
```

### 2. Use Skeleton Loaders for Initial Load

```tsx
if (isLoading && !data) {
  return <PageSkeleton />;
}
```

### 3. Handle Errors Gracefully

```tsx
if (error && !data) {
  return (
    <QueryErrorHandler
      error={error}
      onRetry={() => refetch()}
    />
  );
}
```

### 4. Provide Retry Options

```tsx
<ErrorMessage
  message="Failed to load data"
  onRetry={() => refetch()}
/>
```

### 5. Show Loading States for Actions

```tsx
<ButtonLoading
  loading={isSubmitting}
  loadingText="Saving..."
  onClick={handleSubmit}
>
  Save
</ButtonLoading>
```

### 6. Validate Forms in Real-Time

```tsx
const { getFieldProps } = useFormValidation(initialValues, validationRules);

<input {...getFieldProps('email')} />
```

### 7. Log Errors for Monitoring

```tsx
try {
  await apiCall();
} catch (error) {
  errorLogger.logError(error, { metadata: { action: 'api_call' } });
  handleError(error);
}
```

### 8. Handle Network Errors Specially

```tsx
if (error?.code === 'NETWORK_ERROR') {
  return <NetworkErrorMessage onRetry={() => refetch()} />;
}
```

### 9. Show Empty States

```tsx
if (!isLoading && data?.length === 0) {
  return (
    <EmptyState
      title="No data"
      message="Get started by adding some data"
      action={{ label: 'Add Data', onClick: handleAdd }}
    />
  );
}
```

### 10. Use Optimistic Updates

```tsx
const mutation = useMutation({
  mutationFn: updateData,
  onMutate: async (newData) => {
    // Optimistically update UI
    queryClient.setQueryData(['data'], newData);
  },
  onError: (error, variables, context) => {
    // Rollback on error
    queryClient.setQueryData(['data'], context.previousData);
    handleError(error);
  }
});
```

## Testing

All error handling components include comprehensive tests. Run tests with:

```bash
npm test -- ErrorHandling.test.tsx
```

## Integration with React Query

The error handling system is fully integrated with React Query:

```tsx
const { data, error, isLoading, refetch } = useQuery({
  queryKey: ['data'],
  queryFn: fetchData,
  retry: (failureCount, error) => {
    // Don't retry on 4xx errors
    if (error?.status >= 400 && error?.status < 500) {
      return false;
    }
    return failureCount < 3;
  },
  retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
});

if (isLoading) return <LoadingSpinner />;
if (error) return <QueryErrorHandler error={error} onRetry={refetch} />;
return <DataDisplay data={data} />;
```

## Network Status Handling

The app automatically handles network status changes:

```tsx
// In App.tsx
<NetworkStatusHandler 
  showNotifications={true} 
  autoRefetch={true} 
/>
```

This will:
- Show notifications when going offline/online
- Automatically refetch queries when connection is restored
- Provide visual feedback with the offline banner

## Error Monitoring

Errors are automatically logged and can be sent to monitoring services:

```tsx
// In errorLogger.ts
private sendToErrorTracking(log: ErrorLog): void {
  fetch('/api/errors/log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(log)
  });
}
```

Configure your monitoring service (Sentry, LogRocket, etc.) in the `errorLogger.ts` file.

## Accessibility

All error components follow WCAG 2.1 AA guidelines:
- Proper ARIA labels
- Keyboard navigation support
- Screen reader friendly
- Sufficient color contrast
- Focus management

## Performance

The error handling system is optimized for performance:
- Code splitting for error components
- Memoized error handlers
- Debounced validation
- Efficient re-rendering
- Lazy loading of error details
