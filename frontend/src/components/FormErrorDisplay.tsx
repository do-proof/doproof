import React from 'react';

interface FormErrorDisplayProps {
  error?: string;
  touched?: boolean;
  showError?: boolean;
  className?: string;
}

/**
 * Component to display form field errors with consistent styling
 */
export const FormErrorDisplay: React.FC<FormErrorDisplayProps> = ({
  error,
  touched = false,
  showError = true,
  className = ''
}) => {
  if (!error || !touched || !showError) {
    return null;
  }

  return (
    <div className={`mt-1 text-sm text-red-600 flex items-start ${className}`}>
      <svg 
        className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" 
        fill="currentColor" 
        viewBox="0 0 20 20"
      >
        <path 
          fillRule="evenodd" 
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" 
          clipRule="evenodd" 
        />
      </svg>
      <span>{error}</span>
    </div>
  );
};

interface FormFieldWrapperProps {
  label: string;
  htmlFor: string;
  error?: string;
  touched?: boolean;
  required?: boolean;
  helpText?: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Wrapper component for form fields with label, error display, and help text
 */
export const FormFieldWrapper: React.FC<FormFieldWrapperProps> = ({
  label,
  htmlFor,
  error,
  touched,
  required,
  helpText,
  children,
  className = ''
}) => {
  const hasError = error && touched;

  return (
    <div className={className}>
      <label 
        htmlFor={htmlFor} 
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      {helpText && !hasError && (
        <p className="text-sm text-gray-500 mb-1">{helpText}</p>
      )}
      
      {children}
      
      <FormErrorDisplay error={error} touched={touched} />
    </div>
  );
};

interface FormErrorSummaryProps {
  errors: Record<string, string | undefined>;
  touched: Record<string, boolean | undefined>;
  title?: string;
  className?: string;
}

/**
 * Component to display a summary of all form errors
 */
export const FormErrorSummary: React.FC<FormErrorSummaryProps> = ({
  errors,
  touched,
  title = 'Please fix the following errors:',
  className = ''
}) => {
  const visibleErrors = Object.entries(errors)
    .filter(([key, error]) => error && touched[key])
    .map(([key, error]) => ({ key, error: error! }));

  if (visibleErrors.length === 0) {
    return null;
  }

  return (
    <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start">
        <svg 
          className="h-5 w-5 text-red-400 mr-2 mt-0.5 flex-shrink-0" 
          fill="currentColor" 
          viewBox="0 0 20 20"
        >
          <path 
            fillRule="evenodd" 
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" 
            clipRule="evenodd" 
          />
        </svg>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-red-800 mb-2">{title}</h3>
          <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
            {visibleErrors.map(({ key, error }) => (
              <li key={key}>{error}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

interface FormSuccessMessageProps {
  message: string;
  onDismiss?: () => void;
  className?: string;
}

/**
 * Component to display form success messages
 */
export const FormSuccessMessage: React.FC<FormSuccessMessageProps> = ({
  message,
  onDismiss,
  className = ''
}) => {
  return (
    <div className={`bg-green-50 border border-green-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start">
        <svg 
          className="h-5 w-5 text-green-400 mr-2 flex-shrink-0" 
          fill="currentColor" 
          viewBox="0 0 20 20"
        >
          <path 
            fillRule="evenodd" 
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" 
            clipRule="evenodd" 
          />
        </svg>
        <p className="text-sm text-green-700 flex-1">{message}</p>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="ml-auto text-green-400 hover:text-green-500"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path 
                fillRule="evenodd" 
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" 
                clipRule="evenodd" 
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default FormErrorDisplay;
