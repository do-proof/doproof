/**
 * Validation helper functions for common validation scenarios
 */

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate URL format
 */
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Validate phone number (basic international format)
 */
export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^[\d\s\-\+\(\)]+$/;
  const digitsOnly = phone.replace(/\D/g, '');
  return phoneRegex.test(phone) && digitsOnly.length >= 10 && digitsOnly.length <= 15;
};

/**
 * Validate password strength
 */
export const validatePasswordStrength = (password: string): {
  isValid: boolean;
  strength: 'weak' | 'medium' | 'strong';
  feedback: string[];
} => {
  const feedback: string[] = [];
  let score = 0;

  if (password.length < 8) {
    feedback.push('Password must be at least 8 characters long');
  } else {
    score++;
  }

  if (!/[a-z]/.test(password)) {
    feedback.push('Password must contain at least one lowercase letter');
  } else {
    score++;
  }

  if (!/[A-Z]/.test(password)) {
    feedback.push('Password must contain at least one uppercase letter');
  } else {
    score++;
  }

  if (!/\d/.test(password)) {
    feedback.push('Password must contain at least one number');
  } else {
    score++;
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    feedback.push('Password must contain at least one special character');
  } else {
    score++;
  }

  let strength: 'weak' | 'medium' | 'strong' = 'weak';
  if (score >= 4) strength = 'strong';
  else if (score >= 3) strength = 'medium';

  return {
    isValid: score >= 3,
    strength,
    feedback
  };
};

/**
 * Validate file size
 */
export const isValidFileSize = (file: File, maxSizeMB: number): boolean => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
};

/**
 * Validate file type
 */
export const isValidFileType = (file: File, allowedTypes: string[]): boolean => {
  return allowedTypes.some(type => {
    if (type.endsWith('/*')) {
      // Handle wildcard types like 'image/*'
      const baseType = type.split('/')[0];
      return file.type.startsWith(baseType + '/');
    }
    return file.type === type;
  });
};

/**
 * Validate date is in the future
 */
export const isFutureDate = (date: Date | string): boolean => {
  const inputDate = typeof date === 'string' ? new Date(date) : date;
  return inputDate.getTime() > Date.now();
};

/**
 * Validate date is in the past
 */
export const isPastDate = (date: Date | string): boolean => {
  const inputDate = typeof date === 'string' ? new Date(date) : date;
  return inputDate.getTime() < Date.now();
};

/**
 * Validate date is within range
 */
export const isDateInRange = (
  date: Date | string,
  minDate?: Date | string,
  maxDate?: Date | string
): boolean => {
  const inputDate = typeof date === 'string' ? new Date(date) : date;
  const inputTime = inputDate.getTime();

  if (minDate) {
    const minTime = (typeof minDate === 'string' ? new Date(minDate) : minDate).getTime();
    if (inputTime < minTime) return false;
  }

  if (maxDate) {
    const maxTime = (typeof maxDate === 'string' ? new Date(maxDate) : maxDate).getTime();
    if (inputTime > maxTime) return false;
  }

  return true;
};

/**
 * Validate number is within range
 */
export const isNumberInRange = (
  value: number,
  min?: number,
  max?: number
): boolean => {
  if (min !== undefined && value < min) return false;
  if (max !== undefined && value > max) return false;
  return true;
};

/**
 * Validate string length
 */
export const isValidLength = (
  value: string,
  minLength?: number,
  maxLength?: number
): boolean => {
  if (minLength !== undefined && value.length < minLength) return false;
  if (maxLength !== undefined && value.length > maxLength) return false;
  return true;
};

/**
 * Validate array length
 */
export const isValidArrayLength = (
  array: any[],
  minLength?: number,
  maxLength?: number
): boolean => {
  if (minLength !== undefined && array.length < minLength) return false;
  if (maxLength !== undefined && array.length > maxLength) return false;
  return true;
};

/**
 * Sanitize HTML to prevent XSS
 */
export const sanitizeHtml = (html: string): string => {
  const div = document.createElement('div');
  div.textContent = html;
  return div.innerHTML;
};

/**
 * Validate and sanitize user input
 */
export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, ''); // Remove event handlers
};

/**
 * Validate credit card number (Luhn algorithm)
 */
export const isValidCreditCard = (cardNumber: string): boolean => {
  const digits = cardNumber.replace(/\D/g, '');
  
  if (digits.length < 13 || digits.length > 19) {
    return false;
  }

  let sum = 0;
  let isEven = false;

  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i], 10);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
};

/**
 * Validate postal code (US and international)
 */
export const isValidPostalCode = (postalCode: string, country: string = 'US'): boolean => {
  const patterns: Record<string, RegExp> = {
    US: /^\d{5}(-\d{4})?$/,
    CA: /^[A-Z]\d[A-Z] \d[A-Z]\d$/,
    UK: /^[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}$/,
    // Add more countries as needed
  };

  const pattern = patterns[country.toUpperCase()];
  return pattern ? pattern.test(postalCode) : true; // Default to true for unknown countries
};

/**
 * Validate username format
 */
export const isValidUsername = (username: string): boolean => {
  // Username must be 3-20 characters, alphanumeric with underscores and hyphens
  const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
  return usernameRegex.test(username);
};

/**
 * Validate that two values match (e.g., password confirmation)
 */
export const valuesMatch = (value1: any, value2: any): boolean => {
  return value1 === value2;
};

/**
 * Validate JSON string
 */
export const isValidJson = (jsonString: string): boolean => {
  try {
    JSON.parse(jsonString);
    return true;
  } catch {
    return false;
  }
};

/**
 * Validate hex color code
 */
export const isValidHexColor = (color: string): boolean => {
  const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  return hexColorRegex.test(color);
};

/**
 * Validate LinkedIn URL
 */
export const isValidLinkedInUrl = (url: string): boolean => {
  const linkedInRegex = /^https?:\/\/(www\.)?linkedin\.com\/(in|company)\/[\w-]+\/?$/;
  return linkedInRegex.test(url);
};

/**
 * Validate GitHub URL
 */
export const isValidGitHubUrl = (url: string): boolean => {
  const githubRegex = /^https?:\/\/(www\.)?github\.com\/[\w-]+\/?$/;
  return githubRegex.test(url);
};

/**
 * Validate portfolio URL
 */
export const isValidPortfolioUrl = (url: string): boolean => {
  return isValidUrl(url) && !url.includes('localhost');
};

/**
 * Format validation error messages
 */
export const formatValidationError = (field: string, error: string): string => {
  const fieldName = field
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .trim()
    .toLowerCase();
  
  return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}: ${error}`;
};

/**
 * Batch validate multiple fields
 */
export const batchValidate = (
  values: Record<string, any>,
  validators: Record<string, (value: any) => boolean | string>
): Record<string, string> => {
  const errors: Record<string, string> = {};

  Object.entries(validators).forEach(([field, validator]) => {
    const result = validator(values[field]);
    if (result !== true) {
      errors[field] = typeof result === 'string' ? result : 'Invalid value';
    }
  });

  return errors;
};

export default {
  isValidEmail,
  isValidUrl,
  isValidPhone,
  validatePasswordStrength,
  isValidFileSize,
  isValidFileType,
  isFutureDate,
  isPastDate,
  isDateInRange,
  isNumberInRange,
  isValidLength,
  isValidArrayLength,
  sanitizeHtml,
  sanitizeInput,
  isValidCreditCard,
  isValidPostalCode,
  isValidUsername,
  valuesMatch,
  isValidJson,
  isValidHexColor,
  isValidLinkedInUrl,
  isValidGitHubUrl,
  isValidPortfolioUrl,
  formatValidationError,
  batchValidate
};
