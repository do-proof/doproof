import React from 'react';

interface TextAreaFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  errors?: string[];
  touched?: boolean;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  helpText?: string;
  rows?: number;
  maxLength?: number;
  showCharCount?: boolean;
}

const TextAreaField: React.FC<TextAreaFieldProps> = ({
  label,
  name,
  value,
  onChange,
  onBlur,
  errors = [],
  touched = false,
  placeholder,
  required = false,
  disabled = false,
  className = '',
  helpText,
  rows = 4,
  maxLength,
  showCharCount = false
}) => {
  const hasErrors = touched && errors.length > 0;
  const fieldId = `field-${name}`;
  const errorId = `${fieldId}-error`;
  const helpId = `${fieldId}-help`;
  const charCount = value.length;
  const isNearLimit = maxLength && charCount > maxLength * 0.8;

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className={`space-y-1 ${className}`}>
      <label htmlFor={fieldId} className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div className="relative">
        <textarea
          id={fieldId}
          name={name}
          value={value}
          onChange={handleChange}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={disabled}
          rows={rows}
          maxLength={maxLength}
          aria-invalid={hasErrors}
          aria-describedby={`${helpText ? helpId : ''} ${hasErrors ? errorId : ''}`.trim()}
          className={`
            block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 
            focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500
            disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
            resize-vertical
            ${hasErrors 
              ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500' 
              : 'border-gray-300'
            }
          `}
        />
      </div>
      
      <div className="flex justify-between items-start">
        <div className="flex-1">
          {helpText && !hasErrors && (
            <p id={helpId} className="text-sm text-gray-500">
              {helpText}
            </p>
          )}
          
          {hasErrors && (
            <div id={errorId} className="space-y-1">
              {errors.map((error, index) => (
                <p key={index} className="text-sm text-red-600 flex items-center">
                  <svg className="h-4 w-4 mr-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </p>
              ))}
            </div>
          )}
        </div>
        
        {(showCharCount || maxLength) && (
          <div className="ml-2 flex-shrink-0">
            <span className={`text-xs ${
              isNearLimit ? 'text-yellow-600' : 
              maxLength && charCount > maxLength ? 'text-red-600' : 
              'text-gray-500'
            }`}>
              {charCount}{maxLength && `/${maxLength}`}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default TextAreaField;