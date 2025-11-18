import React, { useEffect } from 'react';
import { useResponsive, usePrefersReducedMotion } from '../../hooks/useResponsive';
import ResponsiveNavigation from './ResponsiveNavigation';
import SkipLink from '../SkipLink';
import { announceToScreenReader } from '../../utils/accessibility';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  pageTitle: string;
  showNavigation?: boolean;
}

/**
 * Responsive layout wrapper for student pages
 * Provides mobile-first responsive design with accessibility features
 */
const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({
  children,
  pageTitle,
  showNavigation = true,
}) => {
  const { isMobile, isTablet, isDesktop } = useResponsive();
  const prefersReducedMotion = usePrefersReducedMotion();

  // Announce page changes to screen readers
  useEffect(() => {
    announceToScreenReader(`Navigated to ${pageTitle}`, 'polite');
    document.title = `${pageTitle} - DoProof Student`;
  }, [pageTitle]);

  // Add viewport meta tag for mobile responsiveness
  useEffect(() => {
    const metaViewport = document.querySelector('meta[name="viewport"]');
    if (!metaViewport) {
      const meta = document.createElement('meta');
      meta.name = 'viewport';
      meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes';
      document.head.appendChild(meta);
    }
  }, []);

  // Add reduced motion class to body if user prefers
  useEffect(() => {
    if (prefersReducedMotion) {
      document.body.classList.add('reduce-motion');
    } else {
      document.body.classList.remove('reduce-motion');
    }
  }, [prefersReducedMotion]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Skip to main content link for keyboard navigation */}
      <SkipLink />

      {/* Navigation */}
      {showNavigation && <ResponsiveNavigation />}

      {/* Main Content */}
      <main
        id="main-content"
        role="main"
        aria-label={pageTitle}
        tabIndex={-1}
        className={`flex-1 ${isMobile ? 'pb-20' : ''}`}
      >
        {/* Page Title - Hidden visually but available to screen readers */}
        <h1 className="sr-only">{pageTitle}</h1>

        {/* Content Container */}
        <div className={`
          ${isMobile ? 'px-4 py-4' : ''}
          ${isTablet ? 'px-6 py-6' : ''}
          ${isDesktop ? 'container-responsive py-8' : ''}
        `}>
          {children}
        </div>
      </main>

      {/* Live region for dynamic announcements */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        id="live-region"
      />
    </div>
  );
};

export default ResponsiveLayout;
