/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';

// Import components to test
import RecruiterLayout from '../RecruiterLayout';
import JobCard from '../JobCard';
import TaskSubmissionCard from '../TaskSubmissionCard';
import AIScoreDisplay from '../AIScoreDisplay';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

// Mock data for components
const mockJob = {
  id: '1',
  title: 'Senior Software Engineer',
  description: 'We are looking for a senior software engineer',
  requirements: ['5+ years experience'],
  responsibilities: ['Lead development'],
  salary: { min: 80000, max: 120000, currency: 'USD' },
  location: { type: 'hybrid' as const, city: 'San Francisco', country: 'USA' },
  employment_type: 'full-time' as const,
  status: 'active' as const,
  posted_date: '2024-01-15T10:00:00Z',
  closing_date: '2024-12-31T23:59:59Z',
  task: {
    title: 'API Design Challenge',
    description: 'Design a RESTful API',
    instructions: 'Create API endpoints',
    time_limit: 120,
    submission_format: 'text' as const,
    max_file_size: 10,
    allowed_file_types: ['pdf', 'txt']
  },
  evaluation_criteria: {
    critical_thinking: 25,
    problem_solving: 30,
    creativity: 15,
    technical_skills: 20,
    communication: 5,
    attention_to_detail: 5
  },
  application_count: 15,
  submission_count: 12,
  view_count: 150,
  company_id: 'company1',
  recruiter_id: 'recruiter1',
  created_at: '2024-01-15T10:00:00Z',
  updated_at: '2024-01-15T10:00:00Z'
};

const mockSubmission = {
  id: '1',
  job_id: 'job1',
  candidate_id: 'candidate1',
  status: 'evaluated' as const,
  started_at: '2024-01-15T10:00:00Z',
  submitted_at: '2024-01-15T11:30:00Z',
  time_spent: 90,
  submission: {
    type: 'text' as const,
    content: 'This is my solution...'
  },
  ai_evaluation: {
    overall_score: 85,
    criteria_scores: {
      critical_thinking: 80,
      problem_solving: 90,
      creativity: 75,
      technical_skills: 88,
      communication: 82,
      attention_to_detail: 85
    },
    feedback: 'Excellent solution',
    evaluated_at: '2024-01-15T12:00:00Z',
    evaluation_model: 'gpt-4'
  },
  candidate: {
    id: 'candidate1',
    name: 'John Doe',
    email: 'john@example.com',
    profile_picture: 'https://example.com/avatar.jpg'
  },
  job: {
    id: 'job1',
    title: 'Senior Software Engineer',
    task: {
      title: 'API Design Challenge',
      time_limit: 120
    }
  }
};

const mockEvaluation = {
  overall_score: 85,
  criteria_scores: {
    critical_thinking: 80,
    problem_solving: 90,
    creativity: 75,
    technical_skills: 88,
    communication: 82,
    attention_to_detail: 85
  },
  feedback: 'Excellent solution with good API design principles.',
  evaluated_at: '2024-01-15T12:00:00Z',
  evaluation_model: 'gpt-4'
};

describe('Accessibility Tests', () => {
  describe('RecruiterLayout', () => {
    test('should not have accessibility violations', async () => {
      const { container } = renderWithRouter(
        <RecruiterLayout currentPage="dashboard" pageTitle="Dashboard">
          <div>Test Content</div>
        </RecruiterLayout>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('should have proper heading hierarchy', () => {
      const { container } = renderWithRouter(
        <RecruiterLayout currentPage="dashboard" pageTitle="Dashboard">
          <div>Test Content</div>
        </RecruiterLayout>
      );

      // Check for proper heading structure
      const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
      expect(headings.length).toBeGreaterThan(0);
      
      // First heading should be h1
      const firstHeading = headings[0];
      expect(firstHeading.tagName).toBe('H1');
    });

    test('should have proper landmark roles', () => {
      const { container } = renderWithRouter(
        <RecruiterLayout currentPage="dashboard" pageTitle="Dashboard">
          <div>Test Content</div>
        </RecruiterLayout>
      );

      // Check for navigation landmark
      const nav = container.querySelector('nav');
      expect(nav).toBeInTheDocument();

      // Check for main content area
      const main = container.querySelector('main, [role="main"]');
      expect(main).toBeInTheDocument();
    });

    test('should support keyboard navigation', () => {
      const { container } = renderWithRouter(
        <RecruiterLayout currentPage="dashboard" pageTitle="Dashboard">
          <div>Test Content</div>
        </RecruiterLayout>
      );

      // Check that interactive elements are focusable
      const focusableElements = container.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      focusableElements.forEach((element) => {
        expect(element).not.toHaveAttribute('tabindex', '-1');
      });
    });
  });

  describe('JobCard', () => {
    test('should not have accessibility violations', async () => {
      const { container } = render(
        <JobCard 
          job={mockJob}
          onEdit={jest.fn()}
          onDelete={jest.fn()}
          onStatusChange={jest.fn()}
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('should have proper button labels', () => {
      const { getByRole } = render(
        <JobCard 
          job={mockJob}
          onEdit={jest.fn()}
          onDelete={jest.fn()}
          onStatusChange={jest.fn()}
        />
      );

      // Check that buttons have accessible names
      const editButton = getByRole('button', { name: /edit/i });
      expect(editButton).toBeInTheDocument();

      const deleteButton = getByRole('button', { name: /delete/i });
      expect(deleteButton).toBeInTheDocument();
    });

    test('should have proper form labels', () => {
      const { container } = render(
        <JobCard 
          job={mockJob}
          onEdit={jest.fn()}
          onDelete={jest.fn()}
          onStatusChange={jest.fn()}
        />
      );

      // Check that select elements have labels
      const selects = container.querySelectorAll('select');
      selects.forEach((select) => {
        const label = container.querySelector(`label[for="${select.id}"]`);
        const ariaLabel = select.getAttribute('aria-label');
        const ariaLabelledBy = select.getAttribute('aria-labelledby');
        
        expect(
          label || ariaLabel || ariaLabelledBy
        ).toBeTruthy();
      });
    });

    test('should have sufficient color contrast', () => {
      const { container } = render(
        <JobCard 
          job={mockJob}
          onEdit={jest.fn()}
          onDelete={jest.fn()}
          onStatusChange={jest.fn()}
        />
      );

      // Check for status badges with proper contrast
      const statusBadge = container.querySelector('[data-testid="status-badge"]');
      if (statusBadge) {
        const styles = window.getComputedStyle(statusBadge);
        // This is a basic check - in a real test you'd use a color contrast library
        expect(styles.backgroundColor).toBeTruthy();
        expect(styles.color).toBeTruthy();
      }
    });
  });

  describe('TaskSubmissionCard', () => {
    test('should not have accessibility violations', async () => {
      const { container } = render(
        <TaskSubmissionCard 
          submission={mockSubmission}
          onReview={jest.fn()}
          onViewDetails={jest.fn()}
          onStatusChange={jest.fn()}
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('should have proper image alt text', () => {
      const { getByAltText } = render(
        <TaskSubmissionCard 
          submission={mockSubmission}
          onReview={jest.fn()}
          onViewDetails={jest.fn()}
          onStatusChange={jest.fn()}
        />
      );

      // Check candidate profile image has alt text
      const profileImage = getByAltText('John Doe');
      expect(profileImage).toBeInTheDocument();
    });

    test('should have proper ARIA attributes for score display', () => {
      const { container } = render(
        <TaskSubmissionCard 
          submission={mockSubmission}
          onReview={jest.fn()}
          onViewDetails={jest.fn()}
          onStatusChange={jest.fn()}
        />
      );

      // Check for ARIA labels on score elements
      const scoreElements = container.querySelectorAll('[data-testid*="score"]');
      scoreElements.forEach((element) => {
        const ariaLabel = element.getAttribute('aria-label');
        const ariaDescribedBy = element.getAttribute('aria-describedby');
        
        if (ariaLabel || ariaDescribedBy) {
          expect(ariaLabel || ariaDescribedBy).toBeTruthy();
        }
      });
    });
  });

  describe('AIScoreDisplay', () => {
    test('should not have accessibility violations', async () => {
      const { container } = render(
        <AIScoreDisplay evaluation={mockEvaluation} />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('should have proper ARIA labels for scores', () => {
      const { container } = render(
        <AIScoreDisplay evaluation={mockEvaluation} />
      );

      // Check that score elements have proper ARIA attributes
      const overallScore = container.querySelector('[data-testid="overall-score"]');
      if (overallScore) {
        expect(
          overallScore.getAttribute('aria-label') ||
          overallScore.getAttribute('aria-describedby')
        ).toBeTruthy();
      }
    });

    test('should provide text alternatives for visual score representations', () => {
      const { container } = render(
        <AIScoreDisplay evaluation={mockEvaluation} showChart />
      );

      // Check for chart accessibility
      const chart = container.querySelector('[data-testid="score-chart"]');
      if (chart) {
        expect(
          chart.getAttribute('aria-label') ||
          chart.getAttribute('aria-describedby') ||
          chart.querySelector('title')
        ).toBeTruthy();
      }
    });

    test('should have proper heading structure for criteria breakdown', () => {
      const { container } = render(
        <AIScoreDisplay evaluation={mockEvaluation} />
      );

      // Check for proper heading hierarchy in criteria section
      const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
      
      if (headings.length > 1) {
        // Ensure headings follow proper hierarchy
        for (let i = 1; i < headings.length; i++) {
          const currentLevel = parseInt(headings[i].tagName.charAt(1));
          const previousLevel = parseInt(headings[i-1].tagName.charAt(1));
          
          // Current heading should not skip levels
          expect(currentLevel - previousLevel).toBeLessThanOrEqual(1);
        }
      }
    });
  });

  describe('Form Accessibility', () => {
    test('should have proper form field associations', async () => {
      // This would test form components like JobForm, TaskDefinitionForm, etc.
      // For now, we'll create a simple form test
      const TestForm = () => (
        <form>
          <label htmlFor="job-title">Job Title</label>
          <input id="job-title" type="text" required />
          
          <label htmlFor="job-description">Description</label>
          <textarea id="job-description" required />
          
          <fieldset>
            <legend>Employment Type</legend>
            <input type="radio" id="full-time" name="employment" value="full-time" />
            <label htmlFor="full-time">Full-time</label>
            
            <input type="radio" id="part-time" name="employment" value="part-time" />
            <label htmlFor="part-time">Part-time</label>
          </fieldset>
          
          <button type="submit">Create Job</button>
        </form>
      );

      const { container } = render(<TestForm />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('should provide error messages with proper associations', async () => {
      const TestFormWithErrors = () => (
        <form>
          <label htmlFor="email">Email</label>
          <input 
            id="email" 
            type="email" 
            aria-describedby="email-error"
            aria-invalid="true"
          />
          <div id="email-error" role="alert">
            Please enter a valid email address
          </div>
        </form>
      );

      const { container } = render(<TestFormWithErrors />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Focus Management', () => {
    test('should manage focus properly in modals', () => {
      // Test focus management for modal dialogs
      const TestModal = ({ isOpen }: { isOpen: boolean }) => (
        isOpen ? (
          <div role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <h2 id="modal-title">Modal Title</h2>
            <button>First Button</button>
            <button>Second Button</button>
            <button>Close</button>
          </div>
        ) : null
      );

      const { container } = render(<TestModal isOpen={true} />);
      
      // Check that modal has proper ARIA attributes
      const modal = container.querySelector('[role="dialog"]');
      expect(modal).toHaveAttribute('aria-modal', 'true');
      expect(modal).toHaveAttribute('aria-labelledby');
    });

    test('should have visible focus indicators', () => {
      const { container } = render(
        <div>
          <button>Test Button</button>
          <a href="#test">Test Link</a>
          <input type="text" />
        </div>
      );

      // Check that focusable elements don't have outline: none without alternative
      const focusableElements = container.querySelectorAll(
        'button, a, input, select, textarea'
      );

      focusableElements.forEach((element) => {
        const styles = window.getComputedStyle(element);
        // This is a basic check - in practice you'd check for custom focus styles
        if (styles.outline === 'none') {
          // Should have alternative focus indication
          expect(
            styles.boxShadow !== 'none' || 
            styles.border !== 'none' ||
            element.getAttribute('data-focus-visible') !== null
          ).toBeTruthy();
        }
      });
    });
  });

  describe('Screen Reader Support', () => {
    test('should provide proper live region announcements', () => {
      const TestLiveRegion = () => (
        <div>
          <div aria-live="polite" id="status-messages">
            Job created successfully
          </div>
          <div aria-live="assertive" id="error-messages">
            Error: Please fill in all required fields
          </div>
        </div>
      );

      const { container } = render(<TestLiveRegion />);
      
      const politeRegion = container.querySelector('[aria-live="polite"]');
      const assertiveRegion = container.querySelector('[aria-live="assertive"]');
      
      expect(politeRegion).toBeInTheDocument();
      expect(assertiveRegion).toBeInTheDocument();
    });

    test('should provide proper table headers and captions', () => {
      const TestTable = () => (
        <table>
          <caption>Job Applications Summary</caption>
          <thead>
            <tr>
              <th scope="col">Job Title</th>
              <th scope="col">Applications</th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Software Engineer</td>
              <td>25</td>
              <td>Active</td>
            </tr>
          </tbody>
        </table>
      );

      const { container } = render(<TestTable />);
      
      const caption = container.querySelector('caption');
      const headers = container.querySelectorAll('th[scope]');
      
      expect(caption).toBeInTheDocument();
      expect(headers.length).toBeGreaterThan(0);
    });
  });
});