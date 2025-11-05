/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import RecruiterLayout from '../RecruiterLayout';

// Mock the navigation component
jest.mock('../RecruiterNavigation', () => {
  return function MockRecruiterNavigation({ isOpen, onToggle }: any) {
    return (
      <nav data-testid="recruiter-navigation">
        <button onClick={onToggle} data-testid="nav-toggle">
          {isOpen ? 'Close' : 'Open'}
        </button>
      </nav>
    );
  };
});

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('RecruiterLayout', () => {
  const defaultProps = {
    currentPage: 'dashboard',
    pageTitle: 'Dashboard'
  };

  test('renders layout with children', () => {
    renderWithRouter(
      <RecruiterLayout {...defaultProps}>
        <div data-testid="test-content">Test Content</div>
      </RecruiterLayout>
    );

    expect(screen.getByTestId('test-content')).toBeInTheDocument();
    expect(screen.getByTestId('recruiter-navigation')).toBeInTheDocument();
  });

  test('displays correct page title', () => {
    renderWithRouter(
      <RecruiterLayout {...defaultProps}>
        <div>Content</div>
      </RecruiterLayout>
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  test('handles mobile navigation toggle', () => {
    renderWithRouter(
      <RecruiterLayout {...defaultProps}>
        <div>Content</div>
      </RecruiterLayout>
    );

    const toggleButton = screen.getByTestId('nav-toggle');
    
    // Initially closed on mobile
    expect(screen.getByText('Open')).toBeInTheDocument();
    
    // Click to open
    fireEvent.click(toggleButton);
    expect(screen.getByText('Close')).toBeInTheDocument();
    
    // Click to close
    fireEvent.click(toggleButton);
    expect(screen.getByText('Open')).toBeInTheDocument();
  });

  test('renders breadcrumb navigation', () => {
    renderWithRouter(
      <RecruiterLayout currentPage="jobs" pageTitle="Job Postings">
        <div>Content</div>
      </RecruiterLayout>
    );

    expect(screen.getByText('Job Postings')).toBeInTheDocument();
  });

  test('applies correct CSS classes for responsive design', () => {
    const { container } = renderWithRouter(
      <RecruiterLayout {...defaultProps}>
        <div>Content</div>
      </RecruiterLayout>
    );

    const layoutContainer = container.firstChild as HTMLElement;
    expect(layoutContainer).toHaveClass('min-h-screen');
  });
});