// Validation utility functions and types
import React from 'react';

export interface ValidationRule<T = any> {
  validate: (value: T) => boolean;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface FieldValidation {
  value: any;
  rules: ValidationRule[];
  touched?: boolean;
}

// Common validation rules
export const validationRules = {
  required: (message = 'This field is required'): ValidationRule => ({
    validate: (value: any) => {
      if (typeof value === 'string') return value.trim().length > 0;
      if (Array.isArray(value)) return value.length > 0;
      return value !== null && value !== undefined;
    },
    message
  }),

  minLength: (min: number, message?: string): ValidationRule<string> => ({
    validate: (value: string) => !value || value.length >= min,
    message: message || `Must be at least ${min} characters long`
  }),

  maxLength: (max: number, message?: string): ValidationRule<string> => ({
    validate: (value: string) => !value || value.length <= max,
    message: message || `Must be no more than ${max} characters long`
  }),

  email: (message = 'Please enter a valid email address'): ValidationRule<string> => ({
    validate: (value: string) => {
      if (!value) return true; // Allow empty if not required
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(value);
    },
    message
  }),

  url: (message = 'Please enter a valid URL'): ValidationRule<string> => ({
    validate: (value: string) => {
      if (!value) return true; // Allow empty if not required
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    },
    message
  }),

  number: (message = 'Please enter a valid number'): ValidationRule<string | number> => ({
    validate: (value: string | number) => {
      if (!value && value !== 0) return true; // Allow empty if not required
      return !isNaN(Number(value));
    },
    message
  }),

  min: (min: number, message?: string): ValidationRule<number> => ({
    validate: (value: number) => value == null || value >= min,
    message: message || `Must be at least ${min}`
  }),

  max: (max: number, message?: string): ValidationRule<number> => ({
    validate: (value: number) => value == null || value <= max,
    message: message || `Must be no more than ${max}`
  }),

  pattern: (regex: RegExp, message: string): ValidationRule<string> => ({
    validate: (value: string) => !value || regex.test(value),
    message
  }),

  custom: <T>(validator: (value: T) => boolean, message: string): ValidationRule<T> => ({
    validate: validator,
    message
  }),

  // Job-specific validations
  salary: {
    range: (message = 'Maximum salary must be greater than minimum salary'): ValidationRule<{min: number, max: number}> => ({
      validate: (value: {min: number, max: number}) => {
        if (!value.min || !value.max) return true;
        return value.max >= value.min;
      },
      message
    })
  },

  task: {
    timeLimit: (message = 'Time limit must be between 15 minutes and 8 hours'): ValidationRule<number> => ({
      validate: (value: number) => value >= 15 && value <= 480,
      message
    }),

    fileSize: (maxSizeMB: number, message?: string): ValidationRule<number> => ({
      validate: (value: number) => !value || value <= maxSizeMB,
      message: message || `File size must be no more than ${maxSizeMB}MB`
    })
  },

  evaluation: {
    criteriaWeights: (message = 'All criteria weights must add up to 100'): ValidationRule<Record<string, number>> => ({
      validate: (criteria: Record<string, number>) => {
        const total = Object.values(criteria).reduce((sum, weight) => sum + (weight || 0), 0);
        return Math.abs(total - 100) < 0.01; // Allow for floating point precision
      },
      message
    })
  }
};

// Validate a single field
export const validateField = (value: any, rules: ValidationRule[]): ValidationResult => {
  const errors: string[] = [];
  
  for (const rule of rules) {
    if (!rule.validate(value)) {
      errors.push(rule.message);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Validate multiple fields
export const validateForm = (fields: Record<string, FieldValidation>): {
  isValid: boolean;
  errors: Record<string, string[]>;
  firstErrorField?: string;
} => {
  const errors: Record<string, string[]> = {};
  let isValid = true;
  let firstErrorField: string | undefined;
  
  for (const [fieldName, field] of Object.entries(fields)) {
    const result = validateField(field.value, field.rules);
    
    if (!result.isValid) {
      errors[fieldName] = result.errors;
      isValid = false;
      
      if (!firstErrorField) {
        firstErrorField = fieldName;
      }
    }
  }
  
  return { isValid, errors, firstErrorField };
};

// Real-time validation hook
export const useFieldValidation = (initialValue: any, rules: ValidationRule[]) => {
  const [value, setValue] = React.useState(initialValue);
  const [touched, setTouched] = React.useState(false);
  const [errors, setErrors] = React.useState<string[]>([]);
  
  const validate = React.useCallback((val: any) => {
    const result = validateField(val, rules);
    setErrors(result.errors);
    return result.isValid;
  }, [rules]);
  
  const handleChange = React.useCallback((newValue: any) => {
    setValue(newValue);
    if (touched) {
      validate(newValue);
    }
  }, [touched, validate]);
  
  const handleBlur = React.useCallback(() => {
    setTouched(true);
    validate(value);
  }, [value, validate]);
  
  const reset = React.useCallback(() => {
    setValue(initialValue);
    setTouched(false);
    setErrors([]);
  }, [initialValue]);
  
  return {
    value,
    errors,
    touched,
    isValid: errors.length === 0,
    setValue: handleChange,
    onBlur: handleBlur,
    reset,
    validate: () => validate(value)
  };
};

// Form validation hook
export const useFormValidation = <T extends Record<string, any>>(
  initialValues: T,
  validationSchema: Record<keyof T, ValidationRule[]>
) => {
  const [values, setValues] = React.useState<T>(initialValues);
  const [errors, setErrors] = React.useState<Record<keyof T, string[]>>({} as Record<keyof T, string[]>);
  const [touched, setTouched] = React.useState<Record<keyof T, boolean>>({} as Record<keyof T, boolean>);
  
  const validateSingleField = React.useCallback((fieldName: keyof T, value: any): boolean => {
    const rules = validationSchema[fieldName] || [];
    const result = validateField(value, rules);
    
    setErrors(prev => ({
      ...prev,
      [fieldName]: result.errors
    }));
    
    return result.isValid;
  }, [validationSchema]);
  
  const validateAllFields = React.useCallback((): { isValid: boolean; errors: Record<string, string[]>; firstErrorField?: string } => {
    const fields: Record<string, FieldValidation> = {};
    
    for (const [fieldName, value] of Object.entries(values)) {
      fields[fieldName] = {
        value,
        rules: validationSchema[fieldName as keyof T] || [],
        touched: touched[fieldName as keyof T]
      };
    }
    
    return validateForm(fields);
  }, [values, validationSchema, touched]);
  
  const handleChange = React.useCallback((fieldName: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [fieldName]: value }));
    
    if (touched[fieldName]) {
      validateSingleField(fieldName, value);
    }
  }, [touched, validateSingleField]);
  
  const handleBlur = React.useCallback((fieldName: keyof T) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }));
    validateSingleField(fieldName, values[fieldName]);
  }, [values, validateSingleField]);
  
  const reset = React.useCallback(() => {
    setValues(initialValues);
    setErrors({} as Record<keyof T, string[]>);
    setTouched({} as Record<keyof T, boolean>);
  }, [initialValues]);
  
  return {
    values,
    errors,
    touched,
    isValid: Object.keys(errors).length === 0 || Object.values(errors).every(errs => errs.length === 0),
    handleChange,
    handleBlur,
    validateForm: validateAllFields,
    reset
  };
};

export default validationRules;