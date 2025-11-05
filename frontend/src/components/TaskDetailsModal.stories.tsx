import type { Meta, StoryObj } from '@storybook/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import TaskDetailsModal from './TaskDetailsModal';
import { Job, JobWithRecommendation } from '../hooks/student/useJobs';

// Mock the useApplicationByJob hook for Storybook
jest.mock('../hooks/student/useApplications', () => ({
  useApplicationByJob: () => ({
    data: null,
    isLoading: false,
  }),
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      gcTime: 0,
    },
  },
});

const meta: Meta<typeof TaskDetailsModal> = {
  title: 'Components/TaskDetailsModal',
  component: TaskDetailsModal,
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <div className="p-4">
          <Story />
        </div>
      </QueryClientProvider>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  argTypes: {
    onClose: { action: 'close clicked' },
    onEnroll: { action: 'enroll clicked' },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Base job data
const baseJob: Job = {
  id: '1',
  title: 'Senior Frontend Developer',
  description: 'Join our dynamic team to build cutting-edge web applications using modern technologies. You will work on challenging projects that impact millions of users worldwide, collaborating with designers, product managers, and other engineers to deliver exceptional user experiences.',
  requirements: [
    'Bachelor\'s degree in Computer Science or equivalent experience',
    '5+ years of experience with React and TypeScript',
    'Strong understanding of modern CSS and responsive design',
    'Experience with state management libraries (Redux, Zustand)',
    'Familiarity with testing frameworks (Jest, React Testing Library)',
    'Knowledge of build tools and CI/CD pipelines',
    'Excellent communication and collaboration skills'
  ],
  responsibilities: [
    'Develop and maintain high-quality React applications',
    'Collaborate with design team to implement pixel-perfect UIs',
    'Write comprehensive unit and integration tests',
    'Participate in code reviews and provide constructive feedback',
    'Mentor junior developers and share knowledge',
    'Optimize application performance and accessibility',
    'Stay up-to-date with latest frontend technologies and best practices'
  ],
  salary: {
    min: 120000,
    max: 180000,
    currency: 'USD'
  },
  location: {
    type: 'hybrid',
    city: 'San Francisco',
    country: 'USA'
  },
  employment_type: 'full-time',
  status: 'active',
  posted_date: '2024-01-01T00:00:00Z',
  closing_date: '2024-12-31T23:59:59Z',
  task: {
    title: 'Build a React Dashboard',
    description: 'Create a comprehensive analytics dashboard with real-time data visualization',
    instructions: `Your task is to build a modern, responsive dashboard using React and TypeScript. The dashboard should include:

1. **Data Visualization**: Implement at least 3 different chart types (line, bar, pie) using a library like Chart.js or D3.js
2. **Real-time Updates**: Simulate real-time data updates using WebSocket or polling
3. **Responsive Design**: Ensure the dashboard works well on desktop, tablet, and mobile devices
4. **Interactive Elements**: Add filters, date pickers, and other interactive controls
5. **Performance**: Optimize for performance with proper memoization and lazy loading
6. **Testing**: Include unit tests for key components and functionality

**Bonus Points:**
- Dark/light theme toggle
- Export functionality (PDF/CSV)
- Advanced animations and transitions
- Accessibility compliance (WCAG 2.1 AA)

**Submission Requirements:**
- Complete source code in a ZIP file
- README with setup instructions
- Live demo URL (optional but recommended)
- Brief documentation explaining your approach and design decisions`,
    time_limit: 240,
    submission_format: 'code',
    max_file_size: 50,
    allowed_file_types: ['zip', 'tar.gz']
  },
  evaluation_criteria: {
    critical_thinking: 20,
    problem_solving: 25,
    creativity: 15,
    technical_skills: 30,
    communication: 5,
    attention_to_detail: 5
  },
  application_count: 25,
  submission_count: 18,
  view_count: 320,
  company_id: 'company1',
  recruiter_id: 'recruiter1'
};

// Default story
export const Default: Story = {
  args: {
    job: baseJob,
  },
};

// Recommended job story
export const RecommendedJob: Story = {
  args: {
    job: {
      ...baseJob,
      id: '2',
      title: 'Recommended Frontend Role',
      match_score: 95,
      match_reasons: ['Skills match perfectly', 'Experience level aligns', 'Location preference'],
      is_recommended: true,
      skill_gaps: ['GraphQL', 'React Native']
    } as JobWithRecommendation,
  },
};

// Entry level job
export const EntryLevelJob: Story = {
  args: {
    job: {
      ...baseJob,
      id: '3',
      title: 'Junior Frontend Developer',
      description: 'Perfect opportunity for new graduates or developers with 1-2 years of experience to grow their skills in a supportive environment.',
      requirements: [
        'Bachelor\'s degree in Computer Science or related field',
        '1-2 years of experience with React',
        'Basic understanding of JavaScript and CSS',
        'Eagerness to learn and grow',
        'Good communication skills'
      ],
      responsibilities: [
        'Assist in developing React components',
        'Write basic unit tests',
        'Participate in code reviews',
        'Learn from senior developers',
        'Contribute to documentation'
      ],
      salary: {
        min: 70000,
        max: 90000,
        currency: 'USD'
      },
      task: {
        ...baseJob.task,
        title: 'Build a Simple Todo App',
        description: 'Create a basic todo application with CRUD functionality',
        instructions: 'Build a simple todo app using React. Include add, edit, delete, and mark complete functionality. Use local storage for persistence.',
        time_limit: 120
      }
    },
  },
};

// Remote job
export const RemoteJob: Story = {
  args: {
    job: {
      ...baseJob,
      id: '4',
      title: 'Remote React Developer',
      location: {
        type: 'remote',
        city: 'Anywhere',
        country: 'Global'
      },
      description: 'Work from anywhere in the world as part of our distributed team. We value work-life balance and provide all the tools you need to be successful remotely.',
    },
  },
};

// Urgent deadline job
export const UrgentDeadline: Story = {
  args: {
    job: {
      ...baseJob,
      id: '5',
      title: 'Urgent Frontend Position',
      closing_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 1 day from now
      description: 'We need to fill this position quickly due to an upcoming project deadline. Fast-track application process available.',
    },
  },
};

// Expired job
export const ExpiredJob: Story = {
  args: {
    job: {
      ...baseJob,
      id: '6',
      title: 'Expired Opportunity',
      closing_date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      description: 'This position has already closed applications, but you can still view the details for reference.',
    },
  },
};

// Job without deadline
export const OpenDeadline: Story = {
  args: {
    job: {
      ...baseJob,
      id: '7',
      title: 'Open Application Period',
      closing_date: undefined,
      description: 'We are continuously hiring for this role. Applications are reviewed on a rolling basis.',
    },
  },
};

// High salary job
export const HighSalaryJob: Story = {
  args: {
    job: {
      ...baseJob,
      id: '8',
      title: 'Senior Principal Engineer',
      salary: {
        min: 200000,
        max: 300000,
        currency: 'USD'
      },
      requirements: [
        ...baseJob.requirements,
        '10+ years of frontend development experience',
        'Experience leading large engineering teams',
        'Track record of architecting scalable systems',
        'Open source contributions preferred'
      ],
      task: {
        ...baseJob.task,
        title: 'Architecture Design Challenge',
        description: 'Design a scalable frontend architecture for a large-scale application',
        time_limit: 360, // 6 hours
      }
    },
  },
};

// Different submission formats
export const TextSubmissionJob: Story = {
  args: {
    job: {
      ...baseJob,
      id: '9',
      title: 'Technical Writer Position',
      description: 'Create technical documentation and content for our developer community.',
      task: {
        ...baseJob.task,
        title: 'Write Technical Documentation',
        description: 'Create comprehensive API documentation',
        instructions: 'Write clear, concise documentation for our REST API. Include examples, error codes, and best practices.',
        submission_format: 'text',
        time_limit: 180,
        max_file_size: undefined,
        allowed_file_types: undefined
      }
    },
  },
};

export const PresentationSubmissionJob: Story = {
  args: {
    job: {
      ...baseJob,
      id: '10',
      title: 'Product Manager Role',
      description: 'Lead product strategy and work with cross-functional teams to deliver amazing user experiences.',
      task: {
        ...baseJob.task,
        title: 'Product Strategy Presentation',
        description: 'Create a product roadmap presentation',
        instructions: 'Develop a 6-month product roadmap for our mobile app. Include market analysis, user research insights, and feature prioritization.',
        submission_format: 'presentation',
        time_limit: 300,
        max_file_size: 100,
        allowed_file_types: ['pptx', 'pdf', 'key']
      }
    },
  },
};

// Job with already applied status
export const AlreadyAppliedJob: Story = {
  args: {
    job: baseJob,
  },
  decorators: [
    (Story) => {
      // Mock the hook to return an existing application
      const { useApplicationByJob } = require('../hooks/student/useApplications');
      useApplicationByJob.mockReturnValue({
        data: {
          _id: 'app1',
          status: 'in_progress',
          progress: { completion_percentage: 65 }
        },
        isLoading: false
      });

      return (
        <QueryClientProvider client={queryClient}>
          <div className="p-4">
            <Story />
          </div>
        </QueryClientProvider>
      );
    },
  ],
};

// Loading state
export const LoadingApplicationStatus: Story = {
  args: {
    job: baseJob,
  },
  decorators: [
    (Story) => {
      // Mock the hook to return loading state
      const { useApplicationByJob } = require('../hooks/student/useApplications');
      useApplicationByJob.mockReturnValue({
        data: null,
        isLoading: true
      });

      return (
        <QueryClientProvider client={queryClient}>
          <div className="p-4">
            <Story />
          </div>
        </QueryClientProvider>
      );
    },
  ],
};