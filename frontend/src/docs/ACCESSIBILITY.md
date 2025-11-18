# Accessibility Guidelines for DoProof Student Features

## Overview

This document outlines the accessibility features and best practices implemented in the DoProof student platform. We follow WCAG 2.1 Level AA standards to ensure our application is usable by everyone, including people with disabilities.

## Key Accessibility Features

### 1. Keyboard Navigation

All interactive elements are fully accessible via keyboard:

- **Tab**: Navigate forward through interactive elements
- **Shift + Tab**: Navigate backward through interactive elements
- **Enter/Space**: Activate buttons and links
- **Escape**: Close modals and dialogs
- **Arrow Keys**: Navigate through lists, menus, and tabs

#### Implementation

```typescript
import { useKeyboardNavigation } from '../hooks/useKeyboardNavigation';

const MyComponent = () => {
  useKeyboardNavigation({
    onEnter: () => handleSubmit(),
    onEscape: () => handleClose(),
  });
};
```

### 2. Screen Reader Support

All components include proper ARIA attributes:

- **aria-label**: Provides accessible names for elements
- **aria-describedby**: Links elements to their descriptions
- **aria-live**: Announces dynamic content changes
- **aria-busy**: Indicates loading states
- **aria-invalid**: Marks form validation errors
- **role**: Defines element semantics

#### Example

```typescript
import { getFormFieldAriaAttributes } from '../utils/accessibility';

<input
  {...getFormFieldAriaAttributes(
    'email',
    'Email address',
    true,
    error,
    'Enter your email to receive notifications'
  )}
/>
```

### 3. Focus Management

- Visible focus indicators on all interactive elements
- Focus trap in modals and dialogs
- Logical tab order throughout the application
- Return focus to trigger element when closing modals

#### Focus Trap Example

```typescript
import { FocusTrap } from '../utils/accessibility';

useEffect(() => {
  if (isModalOpen) {
    const trap = new FocusTrap(modalRef.current);
    trap.activate();
    return () => trap.deactivate();
  }
}, [isModalOpen]);
```

### 4. Color Contrast

All text and interactive elements meet WCAG AA contrast requirements:

- Normal text: 4.5:1 contrast ratio
- Large text (18pt+): 3:1 contrast ratio
- UI components: 3:1 contrast ratio

### 5. Touch Targets

All interactive elements meet minimum touch target sizes:

- Minimum: 44x44 pixels (WCAG 2.1 Level AAA)
- Recommended: 48x48 pixels for primary actions
- Adequate spacing between touch targets

#### Implementation

```typescript
import { getTouchTargetSize } from '../utils/accessibility';

<button className={getTouchTargetSize()}>
  Click Me
</button>
```

### 6. Responsive Design

Mobile-first approach with progressive enhancement:

- Fluid layouts that adapt to all screen sizes
- Readable text at all viewport sizes
- Touch-friendly interface on mobile devices
- Landscape orientation support

#### Responsive Hook

```typescript
import { useResponsive } from '../hooks/useResponsive';

const MyComponent = () => {
  const { isMobile, isTablet, isDesktop } = useResponsive();
  
  return (
    <div className={isMobile ? 'p-4' : 'p-8'}>
      {/* Content */}
    </div>
  );
};
```

### 7. Motion and Animation

Respects user preferences for reduced motion:

```typescript
import { usePrefersReducedMotion } from '../hooks/useResponsive';

const MyComponent = () => {
  const prefersReducedMotion = usePrefersReducedMotion();
  
  return (
    <div className={prefersReducedMotion ? '' : 'animate-fade-in'}>
      {/* Content */}
    </div>
  );
};
```

### 8. Form Accessibility

- Clear labels for all form fields
- Inline validation with error messages
- Required field indicators
- Helpful placeholder text and descriptions
- Grouped related fields with fieldsets

#### Example

```typescript
<div className="form-field">
  <label htmlFor="email" className="form-label">
    Email Address
    <span className="text-red-600" aria-label="required">*</span>
  </label>
  <input
    id="email"
    type="email"
    aria-required="true"
    aria-invalid={!!error}
    aria-describedby="email-error email-description"
  />
  <p id="email-description" className="form-help-text">
    We'll never share your email with anyone else.
  </p>
  {error && (
    <p id="email-error" className="form-error-message" role="alert">
      {error}
    </p>
  )}
</div>
```

### 9. Skip Links

Skip navigation links allow keyboard users to bypass repetitive content:

```typescript
import SkipLink from '../components/SkipLink';

<SkipLink />
<nav>...</nav>
<main id="main-content">...</main>
```

### 10. Live Regions

Dynamic content updates are announced to screen readers:

```typescript
import { announceToScreenReader } from '../utils/accessibility';

// Announce success message
announceToScreenReader('Task submitted successfully', 'polite');

// Announce urgent alert
announceToScreenReader('Error: Please fix form errors', 'assertive');
```

## Component Accessibility Checklist

When creating new components, ensure:

- [ ] All interactive elements are keyboard accessible
- [ ] Focus indicators are visible
- [ ] ARIA attributes are properly set
- [ ] Color contrast meets WCAG AA standards
- [ ] Touch targets are at least 44x44 pixels
- [ ] Component works with screen readers
- [ ] Responsive design works on all devices
- [ ] Animations respect reduced motion preference
- [ ] Forms have proper labels and error messages
- [ ] Loading states are announced
- [ ] Error states are announced
- [ ] Success messages are announced

## Testing Accessibility

### Manual Testing

1. **Keyboard Navigation**: Navigate the entire application using only keyboard
2. **Screen Reader**: Test with NVDA (Windows), JAWS (Windows), or VoiceOver (Mac)
3. **Zoom**: Test at 200% zoom level
4. **Color Blindness**: Use browser extensions to simulate color blindness
5. **Mobile**: Test on actual mobile devices with touch

### Automated Testing

```bash
# Run accessibility tests
npm run test:a11y

# Check specific component
npm run test -- TaskCard.test.tsx
```

### Browser Extensions

- **axe DevTools**: Automated accessibility testing
- **WAVE**: Web accessibility evaluation tool
- **Lighthouse**: Accessibility audit in Chrome DevTools

## Common Patterns

### Modal Dialog

```typescript
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
  aria-describedby="modal-description"
>
  <h2 id="modal-title">Modal Title</h2>
  <p id="modal-description">Modal description</p>
  {/* Content */}
</div>
```

### Loading State

```typescript
<div aria-busy="true" aria-live="polite">
  <LoadingSpinner aria-label="Loading content" />
  <span className="sr-only">Loading, please wait...</span>
</div>
```

### Error Message

```typescript
<div role="alert" aria-live="assertive">
  <ErrorIcon aria-hidden="true" />
  <span>{errorMessage}</span>
</div>
```

### Progress Bar

```typescript
<div
  role="progressbar"
  aria-valuenow={progress}
  aria-valuemin={0}
  aria-valuemax={100}
  aria-label="Upload progress"
>
  <div style={{ width: `${progress}%` }} />
</div>
```

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM](https://webaim.org/)
- [A11y Project](https://www.a11yproject.com/)
- [Inclusive Components](https://inclusive-components.design/)

## Support

For accessibility issues or questions, please contact the development team or file an issue in the project repository.
