import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import ResponsiveLayout from '../ResponsiveLayout';
import ResponsiveCard from '../ResponsiveCard';
import ResponsiveGrid from '../ResponsiveGrid';
import AccessibleButton from '../../AccessibleButton';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock hooks
jest.mock('../../../hooks/useResponsive', () => ({
  useResponsive: () => ({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isLargeDesktop: false,
    width: 1024,
    height: 768,
    orientation: 'landscape',
    isTouchDevice: false,
    isBreakpoint: () => true,
    isBelowBreakpoint: () => false,
    isBetweenBreakpoints: () => false,
    getResponsiveValue: (values: any) => values.lg || values.base,
  }),
  usePrefersReducedMotion: () => false,
}));

jest.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({
    user: { email: 'test@example.com' },
    logout: jest.fn(),
  }),
}));

jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: '/student/dashboard' }),
}));

describe('Accessibility Tests', () => {
  describe('ResponsiveLayout', () => {
    it('should not have accessibility violations', async () => {
      const { container } = render(
        <ResponsiveLayout pageTitle="Test Page">
          <div>Test content</div>
        </ResponsiveLayout>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper ARIA landmarks', () => {
      render(
        <ResponsiveLayout pageTitle="Test Page">
          <div>Test content</div>
        </ResponsiveLayout>
      );

      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    it('should have skip link', () => {
      render(
        <ResponsiveLayout pageTitle="Test Page">
          <div>Test content</div>
        </ResponsiveLayout>
      );

      const skipLink = screen.getByText(/skip to main content/i);
      expect(skipLink).toBeInTheDocument();
    });

    it('should have proper page title', () => {
      render(
        <ResponsiveLayout pageTitle="Test Page">
          <div>Test content</div>
        </ResponsiveLayout>
      );

      expect(screen.getByText('Test Page')).toBeInTheDocument();
    });
  });

  describe('ResponsiveCard', () => {
    it('should not have accessibility violations', async () => {
      const { container } = render(
        <ResponsiveCard title="Card Title">
          <p>Card content</p>
        </ResponsiveCard>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper heading structure', () => {
      render(
        <ResponsiveCard title="Card Title">
          <p>Card content</p>
        </ResponsiveCard>
      );

      expect(screen.getByRole('heading', { name: 'Card Title' })).toBeInTheDocument();
    });

    it('should be keyboard accessible when interactive', () => {
      const handleClick = jest.fn();
      render(
        <ResponsiveCard
          title="Interactive Card"
          interactive
          onClick={handleClick}
        >
          <p>Card content</p>
        </ResponsiveCard>
      );

      const card = screen.getByRole('button', { name: 'Interactive Card' });
      expect(card).toBeInTheDocument();
    });
  });

  describe('ResponsiveGrid', () => {
    it('should not have accessibility violations', async () => {
      const { container } = render(
        <ResponsiveGrid columns={{ base: 1, md: 2, lg: 3 }}>
          <div>Item 1</div>
          <div>Item 2</div>
          <div>Item 3</div>
        </ResponsiveGrid>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('AccessibleButton', () => {
    it('should not have accessibility violations', async () => {
      const { container } = render(
        <AccessibleButton aria-label="Test button">
          Click me
        </AccessibleButton>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper ARIA attributes', () => {
      render(
        <AccessibleButton aria-label="Test button">
          Click me
        </AccessibleButton>
      );

      const button = screen.getByRole('button', { name: 'Test button' });
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('aria-label', 'Test button');
    });

    it('should indicate loading state', () => {
      render(
        <AccessibleButton loading aria-label="Submit">
          Submit
        </AccessibleButton>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-busy', 'true');
      expect(button).toBeDisabled();
    });

    it('should have minimum touch target size', () => {
      render(
        <AccessibleButton aria-label="Test button">
          Click me
        </AccessibleButton>
      );

      const button = screen.getByRole('button');
      const styles = window.getComputedStyle(button);
      
      // Check that button has minimum height class
      expect(button.className).toMatch(/min-h-/);
    });
  });

  describe('Keyboard Navigation', () => {
    it('should support Enter key on buttons', () => {
      const handleClick = jest.fn();
      render(
        <AccessibleButton onClick={handleClick} aria-label="Test">
          Click me
        </AccessibleButton>
      );

      const button = screen.getByRole('button');
      button.focus();
      
      // Simulate Enter key
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      button.dispatchEvent(enterEvent);
      
      expect(handleClick).toHaveBeenCalled();
    });
  });

  describe('Color Contrast', () => {
    it('should have sufficient contrast for primary button', () => {
      render(
        <AccessibleButton variant="primary" aria-label="Primary">
          Primary Button
        </AccessibleButton>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-blue-600', 'text-white');
    });

    it('should have sufficient contrast for secondary button', () => {
      render(
        <AccessibleButton variant="secondary" aria-label="Secondary">
          Secondary Button
        </AccessibleButton>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-gray-600', 'text-white');
    });
  });

  describe('Focus Management', () => {
    it('should have visible focus indicator', () => {
      render(
        <AccessibleButton aria-label="Test">
          Click me
        </AccessibleButton>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveClass('focus:outline-none', 'focus:ring-2');
    });
  });

  describe('Screen Reader Support', () => {
    it('should have proper aria-label', () => {
      render(
        <AccessibleButton aria-label="Submit form">
          Submit
        </AccessibleButton>
      );

      const button = screen.getByRole('button', { name: 'Submit form' });
      expect(button).toBeInTheDocument();
    });

    it('should announce loading state', () => {
      render(
        <AccessibleButton loading aria-label="Loading">
          Loading...
        </AccessibleButton>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-busy', 'true');
    });
  });
});
