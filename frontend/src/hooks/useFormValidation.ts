import { useState, useCallback, useEffect } from 'react';

export interface ValidationRule {
  validator: (value: any) => boolean | string;
  message?: string;
}

export interface FieldValidation {
  value: any;
  rules: ValidationRule[];
  touched?: boolean;
  error?: string;
}

export interface UseFormValidationOptions {
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  showErrorsAfterSubmit?: boolean;
}

/**
 * Hook for form validation with real-time feedback
 */
export const useFormValidation = <T extends Record<string, any>>(
  initialValues: T,
  validationRules: Partial<Record<keyof T, ValidationRule[]>>,
  options: UseFormValidationOptions = {}
) => {
  const {
    validateOnChange = true,
    validateOnBlur = true,
    showErrorsAfterSubmit = true
  } = options;

  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  /**
   * Validate a single field
   */
  const validateField = useCallback(
    (fieldName: keyof T, value: any): string | undefined => {
      const rules = validationRules[fieldName];
      if (!rules || rules.length === 0) {
        return undefined;
      }

      for (const rule of rules) {
        const result = rule.validator(value);
        if (result !== true) {
          return typeof result === 'string' ? result : rule.message || 'Invalid value';
        }
      }

      return undefined;
    },
    [validationRules]
  );

  /**
   * Validate all fields
   */
  const validateAll = useCallback((): boolean => {
    const newErrors: Partial<Record<keyof T, string>> = {};

    (Object.keys(validationRules) as Array<keyof T>).forEach((fieldName) => {
      const error = validateField(fieldName, values[fieldName]);
      if (error) {
        newErrors[fieldName] = error;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [values, validationRules, validateField]);

  /**
   * Set field value
   */
  const setValue = useCallback(
    (fieldName: keyof T, value: any) => {
      setValues((prev) => ({ ...prev, [fieldName]: value }));

      if (validateOnChange && (touched[fieldName] || isSubmitted)) {
        const error = validateField(fieldName, value);
        setErrors((prev) => {
          if (error) {
            return { ...prev, [fieldName]: error };
          } else {
            const newErrors = { ...prev };
            delete newErrors[fieldName];
            return newErrors;
          }
        });
      }
    },
    [validateOnChange, touched, isSubmitted, validateField]
  );

  /**
   * Set multiple field values
   */
  const setMultipleValues = useCallback(
    (newValues: Partial<T>) => {
      setValues((prev) => ({ ...prev, ...newValues }));

      if (validateOnChange && isSubmitted) {
        const newErrors: Partial<Record<keyof T, string>> = {};
        (Object.keys(newValues) as Array<keyof T>).forEach((fieldName) => {
          const error = validateField(fieldName, newValues[fieldName]);
          if (error) {
            newErrors[fieldName] = error;
          }
        });

        setErrors((prev) => {
          const updated = { ...prev, ...newErrors };
          // Remove errors for fields that are now valid
          Object.keys(newErrors).forEach((key) => {
            if (!newErrors[key as keyof T]) {
              delete updated[key as keyof T];
            }
          });
          return updated;
        });
      }
    },
    [validateOnChange, isSubmitted, validateField]
  );

  /**
   * Handle field blur
   */
  const handleBlur = useCallback(
    (fieldName: keyof T) => {
      setTouched((prev) => ({ ...prev, [fieldName]: true }));

      if (validateOnBlur) {
        const error = validateField(fieldName, values[fieldName]);
        setErrors((prev) => {
          if (error) {
            return { ...prev, [fieldName]: error };
          } else {
            const newErrors = { ...prev };
            delete newErrors[fieldName];
            return newErrors;
          }
        });
      }
    },
    [validateOnBlur, values, validateField]
  );

  /**
   * Handle form submit
   */
  const handleSubmit = useCallback(
    async (onSubmit: (values: T) => Promise<void> | void) => {
      setIsSubmitted(true);
      const isValid = validateAll();

      if (!isValid) {
        return;
      }

      setIsSubmitting(true);
      try {
        await onSubmit(values);
      } catch (error) {
        throw error;
      } finally {
        setIsSubmitting(false);
      }
    },
    [values, validateAll]
  );

  /**
   * Reset form
   */
  const reset = useCallback((newValues?: T) => {
    setValues(newValues || initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitted(false);
    setIsSubmitting(false);
  }, [initialValues]);

  /**
   * Get field props for easy integration
   */
  const getFieldProps = useCallback(
    (fieldName: keyof T) => ({
      value: values[fieldName],
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setValue(fieldName, e.target.value);
      },
      onBlur: () => handleBlur(fieldName),
      error: (touched[fieldName] || (isSubmitted && showErrorsAfterSubmit)) ? errors[fieldName] : undefined,
      touched: touched[fieldName] || false
    }),
    [values, touched, errors, isSubmitted, showErrorsAfterSubmit, setValue, handleBlur]
  );

    return {
    values,
    errors,
    touched,
    isSubmitting,
    isSubmitted,
    isValid: Object.keys(errors).length === 0,
    setValue,
    setValues: setMultipleValues,
    handleBlur,
    handleSubmit,
    validateField,
    validateAll,
    reset,
    getFieldProps
  };
};

// Common validation rules
export const validationRules = {
  required: (message = 'This field is required'): ValidationRule => ({
    validator: (value: any) => {
      if (value === null || value === undefined || value === '') {
        return message;
      }
      if (typeof value === 'string' && value.trim() === '') {
        return message;
      }
      return true;
    },
    message
  }),

  email: (message = 'Please enter a valid email address'): ValidationRule => ({
    validator: (value: string) => {
      if (!value) return true; // Let required rule handle empty values
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(value) || message;
    },
    message
  }),

  minLength: (min: number, message?: string): ValidationRule => ({
    validator: (value: string) => {
      if (!value) return true;
      return value.length >= min || (message || `Must be at least ${min} characters`);
    },
    message: message || `Must be at least ${min} characters`
  }),

  maxLength: (max: number, message?: string): ValidationRule => ({
    validator: (value: string) => {
      if (!value) return true;
      return value.length <= max || (message || `Must be no more than ${max} characters`);
    },
    message: message || `Must be no more than ${max} characters`
  }),

  url: (message = 'Please enter a valid URL'): ValidationRule => ({
    validator: (value: string) => {
      if (!value) return true;
      try {
        new URL(value);
        return true;
      } catch {
        return message;
      }
    },
    message
  }),

  pattern: (regex: RegExp, message: string): ValidationRule => ({
    validator: (value: string) => {
      if (!value) return true;
      return regex.test(value) || message;
    },
    message
  }),

  number: (message = 'Please enter a valid number'): ValidationRule => ({
    validator: (value: any) => {
      if (value === null || value === undefined || value === '') return true;
      return !isNaN(Number(value)) || message;
    },
    message
  }),

  min: (min: number, message?: string): ValidationRule => ({
    validator: (value: number) => {
      if (value === null || value === undefined || value === '') return true;
      return Number(value) >= min || (message || `Must be at least ${min}`);
    },
    message: message || `Must be at least ${min}`
  }),

  max: (max: number, message?: string): ValidationRule => ({
    validator: (value: number) => {
      if (value === null || value === undefined || value === '') return true;
      return Number(value) <= max || (message || `Must be no more than ${max}`);
    },
    message: message || `Must be no more than ${max}`
  })
};

export default useFormValidation;

