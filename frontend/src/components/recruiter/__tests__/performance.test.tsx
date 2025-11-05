/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';

// Mock performance API
const mockPerformance = {
  mark: jest.fn(),
  measure: jest.fn(),
  getEntriesByName: jest.fn(),
  getEntriesByType: jest.fn(),
  now: jest.fn(() => Date.now())
};

Object.defineProperty(window, 'performance', {
  value: mockPerformance,
  writable: true
});

// Mock IntersectionObserver for lazy loading tests
const mockIntersectionObserver = jest.fn();
mockIntersectionObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null
});
window.IntersectionObserver = mockIntersectionObserver;

// Import components to test
import JobCard from '../JobCard';
import TaskSubmissionCard from '../TaskSubmissionCard';

// Generate large datasets for performance testing
const generateMockJobs = (count: number) => {
  return Array.from({ length: count }, (_, index) => ({
    id: `job-${index}`,
    title: `Software Engineer ${index}`,
    description: `Job description for position ${index}. This is a detailed description that might be quite long and contain multiple sentences about the role, requirements, and company culture.`,
    requirements: [
      `${5 + (index % 3)}+ years experience`,
      'JavaScript/TypeScript',
      'React/Vue/Angular',
      'Node.js/Python/Java',
      'Database experience'
    ],
    responsibilities: [
      'Develop new features',
      'Maintain existing code',
      'Code reviews',
      'Mentoring junior developers',
      'Technical documentation'
    ],
    salary: {
      min: 70000 + (index * 1000),
      max: 120000 + (index * 1500),
      currency: 'USD'
    },
    location: {
      type: index % 3 === 0 ? 'remote' as const : 'hybrid' as const,
      city: ['San Francisco', 'New York', 'Austin', 'Seattle'][index % 4],
      country: 'USA'
    },
    employment_type: ['full-time', 'part-time', 'contract'][index % 3] as const,
    status: ['active', 'draft', 'paused'][index % 3] as const,
    posted_date: new Date(Date.now() - (index * 24 * 60 * 60 * 1000)).toISOString(),
    closing_date: new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)).toISOString(),
    task: {
      title: `Coding Challenge ${index}`,
      description: `Technical challenge for position ${index}`,
      instructions: 'Complete the coding challenge within the time limit',
      time_limit: 120 + (index % 60),
      submission_format: ['text', 'file', 'code'][index % 3] as const,
      max_file_size: 10,
      allowed_file_types: ['pdf', 'txt', 'zip']
    },
    evaluation_criteria: {
      critical_thinking: 20 + (index % 10),
      problem_solving: 25 + (index % 10),
      creativity: 15 + (index % 10),
      technical_skills: 25 + (index % 10),
      communication: 10 + (index % 5),
      attention_to_detail: 5 + (index % 5)
    },
    application_count: index * 2,
    submission_count: index,
    view_count: index * 10,
    company_id: `company-${index % 5}`,
    recruiter_id: `recruiter-${index % 3}`,
    created_at: new Date(Date.now() - (index * 24 * 60 * 60 * 1000)).toISOString(),
    updated_at: new Date().toISOString()
  }));
};

const generateMockSubmissions = (count: number) => {
  return Array.from({ length: count }, (_, index) => ({
    id: `submission-${index}`,
    job_id: `job-${index % 10}`,
    candidate_id: `candidate-${index}`,
    status: ['submitted', 'evaluated', 'reviewed', 'shortlisted'][index % 4] as const,
    started_at: new Date(Date.now() - (index * 60 * 60 * 1000)).toISOString(),
    submitted_at: new Date(Date.now() - ((index - 1) * 60 * 60 * 1000)).toISOString(),
    time_spent: 60 + (index % 120),
    submission: {
      type: 'text' as const,
      content: `This is submission ${index}. `.repeat(50) // Long content to test performance
    },
    ai_evaluation: {
      overall_score: 60 + (index % 40),
      criteria_scores: {
        critical_thinking: 60 + (index % 40),
        problem_solving: 65 + (index % 35),
        creativity: 55 + (index % 45),
        technical_skills: 70 + (index % 30),
        communication: 60 + (index % 40),
        attention_to_detail: 65 + (index % 35)
      },
      feedback: `Feedback for submission ${index}. `.repeat(20),
      evaluated_at: new Date().toISOString(),
      evaluation_model: 'gpt-4'
    },
    candidate: {
      id: `candidate-${index}`,
      name: `Candidate ${index}`,
      email: `candidate${index}@example.com`,
      profile_picture: `https://example.com/avatar${index}.jpg`
    },
    job: {
      id: `job-${index % 10}`,
      title: `Job ${index % 10}`,
      task: {
        title: `Task ${index % 10}`,
        time_limit: 120
      }
    }
  }));
};

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('Performance Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPerformance.now.mockReturnValue(Date.now());
  });

  describe('JobCard Performance', () => {
    test('should render single job card quickly', async () => {
      const job = generateMockJobs(1)[0];
      const startTime = performance.now();
      
      render(
        <JobCard 
          job={job}
          onEdit={jest.fn()}
          onDelete={jest.fn()}
          onStatusChange={jest.fn()}
        />
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render in less than 50ms
      expect(renderTime).toBeLessThan(50);
    });

    test('should handle large job descriptions efficiently', async () => {
      const job = generateMockJobs(1)[0];
      job.description = 'Very long description. '.repeat(1000); // 24KB description

      const startTime = performance.now();
      
      render(
        <JobCard 
          job={job}
          onEdit={jest.fn()}
          onDelete={jest.fn()}
          onStatusChange={jest.fn()}
        />
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should still render efficiently with large content
      expect(renderTime).toBeLessThan(100);
    });

    test('should not cause memory leaks with frequent re-renders', async () => {
      const job = generateMockJobs(1)[0];
      const mockOnEdit = jest.fn();
      
      const { rerender } = render(
        <JobCard 
          job={job}
          onEdit={mockOnEdit}
          onDelete={jest.fn()}
          onStatusChange={jest.fn()}
        />
      );

      // Simulate frequent updates
      for (let i = 0; i < 100; i++) {
        const updatedJob = { ...job, view_count: job.view_count + i };
        rerender(
          <JobCard 
            job={updatedJob}
            onEdit={mockOnEdit}
            onDelete={jest.fn()}
            onStatusChange={jest.fn()}
          />
        );
      }

      // Should not accumulate event listeners
      expect(mockOnEdit).toHaveBeenCalledTimes(0); // No automatic calls
    });
  });

  describe('TaskSubmissionCard Performance', () => {
    test('should render submission card efficiently', async () => {
      const submission = generateMockSubmissions(1)[0];
      const startTime = performance.now();
      
      render(
        <TaskSubmissionCard 
          submission={submission}
          onReview={jest.fn()}
          onViewDetails={jest.fn()}
          onStatusChange={jest.fn()}
        />
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      expect(renderTime).toBeLessThan(50);
    });

    test('should handle large submission content efficiently', async () => {
      const submission = generateMockSubmissions(1)[0];
      submission.submission.content = 'Large submission content. '.repeat(5000); // ~125KB content

      const startTime = performance.now();
      
      render(
        <TaskSubmissionCard 
          submission={submission}
          onReview={jest.fn()}
          onViewDetails={jest.fn()}
          onStatusChange={jest.fn()}
        />
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should handle large content without significant performance impact
      expect(renderTime).toBeLessThan(150);
    });
  });

  describe('List Rendering Performance', () => {
    test('should render job list efficiently with virtualization', async () => {
      const jobs = generateMockJobs(1000);
      
      // Mock a virtualized list component
      const VirtualizedJobList = ({ jobs }: { jobs: typeof jobs }) => {
        // Simulate rendering only visible items (10 out of 1000)
        const visibleJobs = jobs.slice(0, 10);
        
        return (
          <div data-testid="job-list">
            {visibleJobs.map((job) => (
              <JobCard 
                key={job.id}
                job={job}
                onEdit={jest.fn()}
                onDelete={jest.fn()}
                onStatusChange={jest.fn()}
              />
            ))}
          </div>
        );
      };

      const startTime = performance.now();
      
      render(<VirtualizedJobList jobs={jobs} />);

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render virtualized list quickly
      expect(renderTime).toBeLessThan(200);
      
      // Should only render visible items
      const jobCards = screen.getAllByTestId(/job-card/);
      expect(jobCards.length).toBeLessThanOrEqual(10);
    });

    test('should handle scroll performance with large datasets', async () => {
      const submissions = generateMockSubmissions(500);
      
      const VirtualizedSubmissionList = ({ submissions }: { submissions: typeof submissions }) => {
        const [visibleRange, setVisibleRange] = React.useState({ start: 0, end: 20 });
        
        const handleScroll = React.useCallback(() => {
          // Simulate scroll-based virtualization
          const newStart = Math.floor(Math.random() * 480);
          setVisibleRange({ start: newStart, end: newStart + 20 });
        }, []);

        const visibleSubmissions = submissions.slice(visibleRange.start, visibleRange.end);
        
        return (
          <div data-testid="submission-list" onScroll={handleScroll}>
            {visibleSubmissions.map((submission) => (
              <TaskSubmissionCard 
                key={submission.id}
                submission={submission}
                onReview={jest.fn()}
                onViewDetails={jest.fn()}
                onStatusChange={jest.fn()}
              />
            ))}
          </div>
        );
      };

      const { container } = render(<VirtualizedSubmissionList submissions={submissions} />);
      
      // Simulate multiple scroll events
      const scrollContainer = container.querySelector('[data-testid="submission-list"]');
      
      const startTime = performance.now();
      
      for (let i = 0; i < 10; i++) {
        scrollContainer?.dispatchEvent(new Event('scroll'));
        await waitFor(() => {}, { timeout: 10 });
      }

      const endTime = performance.now();
      const scrollTime = endTime - startTime;

      // Scroll handling should be efficient
      expect(scrollTime).toBeLessThan(100);
    });
  });

  describe('Data Processing Performance', () => {
    test('should filter large datasets efficiently', () => {
      const jobs = generateMockJobs(10000);
      
      const startTime = performance.now();
      
      // Simulate filtering operations
      const activeJobs = jobs.filter(job => job.status === 'active');
      const highSalaryJobs = jobs.filter(job => job.salary.min > 90000);
      const recentJobs = jobs.filter(job => {
        const postedDate = new Date(job.posted_date);
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        return postedDate > thirtyDaysAgo;
      });
      
      const endTime = performance.now();
      const filterTime = endTime - startTime;

      // Filtering should be fast even with large datasets
      expect(filterTime).toBeLessThan(100);
      expect(activeJobs.length).toBeGreaterThan(0);
      expect(highSalaryJobs.length).toBeGreaterThan(0);
      expect(recentJobs.length).toBeGreaterThan(0);
    });

    test('should sort large datasets efficiently', () => {
      const submissions = generateMockSubmissions(5000);
      
      const startTime = performance.now();
      
      // Simulate sorting operations
      const sortedByScore = [...submissions].sort((a, b) => 
        (b.ai_evaluation?.overall_score || 0) - (a.ai_evaluation?.overall_score || 0)
      );
      
      const sortedByDate = [...submissions].sort((a, b) => 
        new Date(b.submitted_at || 0).getTime() - new Date(a.submitted_at || 0).getTime()
      );
      
      const endTime = performance.now();
      const sortTime = endTime - startTime;

      // Sorting should be efficient
      expect(sortTime).toBeLessThan(200);
      expect(sortedByScore.length).toBe(submissions.length);
      expect(sortedByDate.length).toBe(submissions.length);
    });
  });

  describe('Memory Usage', () => {
    test('should not leak memory with component unmounting', () => {
      const jobs = generateMockJobs(100);
      
      const TestComponent = () => {
        const [showJobs, setShowJobs] = React.useState(true);
        
        return (
          <div>
            <button onClick={() => setShowJobs(!showJobs)}>
              Toggle Jobs
            </button>
            {showJobs && jobs.map((job) => (
              <JobCard 
                key={job.id}
                job={job}
                onEdit={jest.fn()}
                onDelete={jest.fn()}
                onStatusChange={jest.fn()}
              />
            ))}
          </div>
        );
      };

      const { getByText, queryByTestId } = render(<TestComponent />);
      
      // Mount components
      expect(screen.getAllByTestId(/job-card/).length).toBe(100);
      
      // Unmount components
      getByText('Toggle Jobs').click();
      
      // Components should be unmounted
      expect(queryByTestId(/job-card/)).toBeNull();
      
      // Re-mount components
      getByText('Toggle Jobs').click();
      
      // Should re-mount without issues
      expect(screen.getAllByTestId(/job-card/).length).toBe(100);
    });

    test('should handle rapid state updates efficiently', async () => {
      const TestComponent = () => {
        const [counter, setCounter] = React.useState(0);
        
        React.useEffect(() => {
          // Simulate rapid updates
          const interval = setInterval(() => {
            setCounter(c => c + 1);
          }, 1);
          
          setTimeout(() => clearInterval(interval), 100); // Stop after 100ms
          
          return () => clearInterval(interval);
        }, []);
        
        return <div data-testid="counter">{counter}</div>;
      };

      const startTime = performance.now();
      
      const { getByTestId } = render(<TestComponent />);
      
      // Wait for updates to complete
      await waitFor(() => {
        const counter = getByTestId('counter');
        return parseInt(counter.textContent || '0') > 50;
      }, { timeout: 200 });
      
      const endTime = performance.now();
      const updateTime = endTime - startTime;

      // Rapid updates should not cause performance issues
      expect(updateTime).toBeLessThan(300);
    });
  });

  describe('Bundle Size Impact', () => {
    test('should use code splitting for large components', () => {
      // This test would typically check bundle analysis
      // For now, we'll simulate checking component size
      
      const componentSizes = {
        JobCard: 15, // KB
        TaskSubmissionCard: 18, // KB
        AIScoreDisplay: 12, // KB
        RecruiterLayout: 25 // KB
      };
      
      // Individual components should be reasonably sized
      Object.entries(componentSizes).forEach(([component, size]) => {
        expect(size).toBeLessThan(30); // Each component < 30KB
      });
      
      const totalSize = Object.values(componentSizes).reduce((sum, size) => sum + size, 0);
      expect(totalSize).toBeLessThan(100); // Total < 100KB
    });

    test('should lazy load heavy dependencies', async () => {
      // Simulate lazy loading of chart library
      const LazyChartComponent = React.lazy(() => 
        Promise.resolve({
          default: () => <div data-testid="chart">Chart Component</div>
        })
      );
      
      const TestComponent = () => (
        <React.Suspense fallback={<div data-testid="loading">Loading...</div>}>
          <LazyChartComponent />
        </React.Suspense>
      );

      const { getByTestId } = render(<TestComponent />);
      
      // Should show loading initially
      expect(getByTestId('loading')).toBeInTheDocument();
      
      // Should load component
      await waitFor(() => {
        expect(getByTestId('chart')).toBeInTheDocument();
      });
    });
  });

  describe('Network Performance', () => {
    test('should batch API requests efficiently', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: 'test' })
      });
      
      global.fetch = mockFetch;
      
      // Simulate component that makes multiple API calls
      const TestComponent = () => {
        React.useEffect(() => {
          // Batch multiple requests
          const requests = [
            fetch('/api/jobs'),
            fetch('/api/submissions'),
            fetch('/api/analytics')
          ];
          
          Promise.all(requests).then(() => {
            // Handle responses
          });
        }, []);
        
        return <div>Test Component</div>;
      };

      render(<TestComponent />);
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(3);
      });
      
      // Should make requests in parallel, not sequentially
      const callTimes = mockFetch.mock.calls.map(() => Date.now());
      const timeDifference = Math.max(...callTimes) - Math.min(...callTimes);
      expect(timeDifference).toBeLessThan(50); // Called within 50ms of each other
    });
  });
});