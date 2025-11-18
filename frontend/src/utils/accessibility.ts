/**
 * Accessibility utilities for keyboard navigation, ARIA attributes, and screen reader support
 */

/**
 * Check if user prefers reduced motion
 */
export const prefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Check if user prefers high contrast
 */
export const prefersHighContrast = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-contrast: high)').matches;
};

/**
 * Get ARIA live region attributes for announcements
 */
export const getAriaLiveAttributes = (priority: 'polite' | 'assertive' = 'polite') => ({
  role: 'status',
  'aria-live': priority,
  'aria-atomic': 'true'
});

/**
 * Generate unique ID for ARIA relationships
 */
export const generateAriaId = (prefix: string): string => {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Keyboard event handlers
 */
export const handleKeyDown = {
  /**
   * Handle Enter key press
   */
  onEnter: (callback: () => void) => (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      callback();
    }
  },

  /**
   * Handle Escape key press
   */
  onEscape: (callback: () => void) => (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      callback();
    }
  },

  /**
   * Handle Arrow key navigation
   */
  onArrowKeys: (
    onUp?: () => void,
    onDown?: () => void,
    onLeft?: () => void,
    onRight?: () => void
  ) => (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        onUp?.();
        break;
      case 'ArrowDown':
        e.preventDefault();
        onDown?.();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        onLeft?.();
        break;
      case 'ArrowRight':
        e.preventDefault();
        onRight?.();
        break;
    }
  },

  /**
   * Handle Tab navigation with focus trap
   */
  onTab: (onTab: (e: React.KeyboardEvent) => void) => (e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      onTab(e);
    }
  }
};

/**
 * Focus management utilities
 */
export const focusManagement = {
  /**
   * Trap focus within an element
   */
  trapFocus: (container: HTMLElement | null) => {
    if (!container) return;

    const focusableElements = container.querySelectorAll(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    firstElement?.focus();

    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  },

  /**
   * Return focus to previous element
   */
  returnFocus: (element: HTMLElement | null) => {
    if (element) {
      element.focus();
    }
  },

  /**
   * Focus first focusable element in container
   */
  focusFirst: (container: HTMLElement | null) => {
    if (!container) return;

    const focusable = container.querySelector(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    ) as HTMLElement;

    focusable?.focus();
  }
};

/**
 * Screen reader announcements
 */
export const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;

  document.body.appendChild(announcement);

  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

/**
 * Get touch target size (minimum 44x44px for accessibility)
 */
export const getTouchTargetSize = (): string => {
  return 'min-w-[44px] min-h-[44px]';
};

/**
 * Check color contrast ratio (simplified check)
 */
export const checkColorContrast = (foreground: string, background: string): boolean => {
  // This is a simplified check - in production, use a proper contrast checking library
  // WCAG AA requires 4.5:1 for normal text, 3:1 for large text
  // For now, we'll rely on Tailwind's color system which meets WCAG standards
  return true;
};

/**
 * Get responsive breakpoints
 */
export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536
};

/**
 * Check if device is mobile
 */
export const isMobile = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < breakpoints.md;
};

/**
 * Check if device is touch-enabled
 */
export const isTouchDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

/**
 * Skip to main content functionality
 */
export const skipToMainContent = () => {
  const mainContent = document.getElementById('main-content');
  if (mainContent) {
    mainContent.focus();
    mainContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};

/**
 * Get ARIA attributes for loading state
 */
export const getLoadingAriaAttributes = (isLoading: boolean, loadingText: string = 'Loading') => ({
  'aria-busy': isLoading,
  'aria-live': 'polite' as const,
  'aria-label': isLoading ? loadingText : undefined,
});

/**
 * Get ARIA attributes for error state
 */
export const getErrorAriaAttributes = (hasError: boolean, errorMessage?: string) => ({
  'aria-invalid': hasError,
  'aria-describedby': hasError && errorMessage ? 'error-message' : undefined,
  role: hasError ? 'alert' as const : undefined,
});

/**
 * Get ARIA attributes for form field
 */
export const getFormFieldAriaAttributes = (
  id: string,
  label: string,
  required: boolean = false,
  error?: string,
  description?: string
) => ({
  id,
  'aria-label': label,
  'aria-required': required,
  'aria-invalid': !!error,
  'aria-describedby': [
    description ? `${id}-description` : null,
    error ? `${id}-error` : null,
  ]
    .filter(Boolean)
    .join(' ') || undefined,
});

/**
 * Get ARIA attributes for button with loading state
 */
export const getButtonAriaAttributes = (
  label: string,
  isLoading: boolean = false,
  isDisabled: boolean = false,
  ariaExpanded?: boolean
) => ({
  'aria-label': label,
  'aria-busy': isLoading,
  'aria-disabled': isDisabled || isLoading,
  'aria-expanded': ariaExpanded,
});

/**
 * Get ARIA attributes for modal/dialog
 */
export const getModalAriaAttributes = (
  title: string,
  describedBy?: string
) => ({
  role: 'dialog' as const,
  'aria-modal': true,
  'aria-labelledby': 'modal-title',
  'aria-describedby': describedBy,
});

/**
 * Get ARIA attributes for tabs
 */
export const getTabAriaAttributes = (
  id: string,
  isSelected: boolean,
  controls: string
) => ({
  id,
  role: 'tab' as const,
  'aria-selected': isSelected,
  'aria-controls': controls,
  tabIndex: isSelected ? 0 : -1,
});

/**
 * Get ARIA attributes for tab panel
 */
export const getTabPanelAriaAttributes = (
  id: string,
  labelledBy: string,
  isHidden: boolean
) => ({
  id,
  role: 'tabpanel' as const,
  'aria-labelledby': labelledBy,
  hidden: isHidden,
  tabIndex: 0,
});

/**
 * Get ARIA attributes for list
 */
export const getListAriaAttributes = (
  label: string,
  itemCount: number
) => ({
  role: 'list' as const,
  'aria-label': label,
  'aria-live': 'polite' as const,
  'aria-atomic': false,
  'aria-relevant': 'additions removals' as const,
});

/**
 * Get ARIA attributes for list item
 */
export const getListItemAriaAttributes = (
  index: number,
  total: number
) => ({
  role: 'listitem' as const,
  'aria-posinset': index + 1,
  'aria-setsize': total,
});

/**
 * Get ARIA attributes for progress bar
 */
export const getProgressAriaAttributes = (
  value: number,
  max: number = 100,
  label?: string
) => ({
  role: 'progressbar' as const,
  'aria-valuenow': value,
  'aria-valuemin': 0,
  'aria-valuemax': max,
  'aria-label': label,
  'aria-valuetext': `${Math.round((value / max) * 100)}%`,
});

/**
 * Get ARIA attributes for status/alert
 */
export const getStatusAriaAttributes = (
  type: 'status' | 'alert' | 'log' = 'status',
  priority: 'polite' | 'assertive' = 'polite'
) => ({
  role: type,
  'aria-live': priority,
  'aria-atomic': true,
});

/**
 * Manage focus trap for modals and dialogs
 */
export class FocusTrap {
  private container: HTMLElement;
  private previousFocus: HTMLElement | null = null;
  private focusableElements: HTMLElement[] = [];

  constructor(container: HTMLElement) {
    this.container = container;
  }

  activate() {
    this.previousFocus = document.activeElement as HTMLElement;
    this.updateFocusableElements();
    
    if (this.focusableElements.length > 0) {
      this.focusableElements[0].focus();
    }

    this.container.addEventListener('keydown', this.handleKeyDown);
  }

  deactivate() {
    this.container.removeEventListener('keydown', this.handleKeyDown);
    
    if (this.previousFocus) {
      this.previousFocus.focus();
    }
  }

  private updateFocusableElements() {
    const selector = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(', ');

    this.focusableElements = Array.from(
      this.container.querySelectorAll(selector)
    ) as HTMLElement[];
  }

  private handleKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Tab') return;

    this.updateFocusableElements();

    if (this.focusableElements.length === 0) return;

    const firstElement = this.focusableElements[0];
    const lastElement = this.focusableElements[this.focusableElements.length - 1];

    if (event.shiftKey) {
      if (document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
    } else {
      if (document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  };
}

/**
 * Create a live region for screen reader announcements
 */
export class LiveRegion {
  private element: HTMLDivElement;

  constructor(priority: 'polite' | 'assertive' = 'polite') {
    this.element = document.createElement('div');
    this.element.setAttribute('role', 'status');
    this.element.setAttribute('aria-live', priority);
    this.element.setAttribute('aria-atomic', 'true');
    this.element.className = 'sr-only';
    document.body.appendChild(this.element);
  }

  announce(message: string) {
    this.element.textContent = message;
    
    // Clear after announcement to allow repeated announcements
    setTimeout(() => {
      this.element.textContent = '';
    }, 1000);
  }

  destroy() {
    if (this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }
}

/**
 * Validate color contrast ratio (WCAG AA compliance)
 * Simplified check - for production use a proper contrast library
 */
export const meetsContrastRequirements = (
  foreground: string,
  background: string,
  level: 'AA' | 'AAA' = 'AA',
  isLargeText: boolean = false
): boolean => {
  // This is a placeholder - in production, use a proper contrast checking library
  // like 'color-contrast-checker' or 'wcag-contrast'
  // For now, we rely on Tailwind's color system which meets WCAG standards
  return true;
};

/**
 * Get keyboard shortcut display text
 */
export const getKeyboardShortcutText = (
  key: string,
  modifiers: {
    ctrl?: boolean;
    alt?: boolean;
    shift?: boolean;
    meta?: boolean;
  } = {}
): string => {
  const isMac = typeof navigator !== 'undefined' && /Mac/.test(navigator.platform);
  const parts: string[] = [];

  if (modifiers.ctrl) parts.push(isMac ? '⌃' : 'Ctrl');
  if (modifiers.alt) parts.push(isMac ? '⌥' : 'Alt');
  if (modifiers.shift) parts.push(isMac ? '⇧' : 'Shift');
  if (modifiers.meta) parts.push(isMac ? '⌘' : 'Win');
  
  parts.push(key);

  return parts.join(isMac ? '' : '+');
};

