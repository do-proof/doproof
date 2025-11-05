import type { Meta, StoryObj } from '@storybook/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import TaskCard from './TaskCard';
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

const meta: Meta<typeof TaskCard> = {
  title: 'Components/TaskCard',
  component: TaskCard,
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <div className="p-4 bg-gray-50 min-h-screen">
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
    onViewDetails: { action: 'view details clicked' },
    onEnroll: { action: 'enroll clicked' },
    isRecommended: {
      control: 'boolean',
      description: 'Whether this job is recommended for the user',
    },
    showMatchScore: {
      control: 'boolean',
      description: 'Whether to show the match score for recommended jobs',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Base job data
const baseJob: Job = {
  id: '1',
  title: 'Frontend Developer',
  description: 'Build responsive web applications using React and TypeScript. Work with a dynamic team to create user-friendly interfaces.',
  requirements: ['React', 'TypeScript', 'CSS'],
  responsibilities: ['Develop UI components', 'Write tests', 'Collaborate with designers'],
  salary: {
    min: 50000,
    max: 80000,
    currency: 'USD'
  },
  location: {
    type: 'remote',
    city: 'San Francisco',
    country: 'USA'
  },
  employment_type: 'full-time',
  status: 'active',
  posted_date: '2024-01-01T00:00:00Z',
  closing_date: '2024-12-31T23:59:59Z',
  task: {
    title: 'Build a landing page',
    description: 'Create a responsive landing page for our new product',
    instructions: 'Use React and Tailwind CSS to build a modern, responsive landing page',
    time_limit: 120,
    submission_format: 'code',
    max_file_size: 10,
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
  application_count: 5,
  submission_count: 3,
  view_count: 20,
  company_id: 'company1',
  recruiter_id: 'recruiter1'
};

// Default story
export const Default: Story = {
  args: {
    job: baseJob,
    isRecommended: false,
    showMatchScore: false,
  },
};

// Recommended job story
export const Recommended: Story = {
  args: {
    job: {
      ...baseJob,
      id: '2',
      title: 'Senior React Developer',
      match_score: 95,
      match_reasons: ['Skills match', 'Experience level', 'Location preference'],
      is_recommended: true,
      skill_gaps: ['Advanced React patterns']
    } as JobWithRecommendation,
    isRecommended: true,
    showMatchScore: true,
  },
};

// Easy task story
export const EasyTask: Story = {
  args: {
    job: {
      ...baseJob,
      id: '3',
      title: 'Simple HTML/CSS Task',
      description: 'Create a basic webpage using HTML and CSS',
      task: {
        ...baseJob.task,
        title: 'Build a simple webpage',
        time_limit: 45,
        submission_format: 'file'
      }
    },
  },
};

// Hard task story
export const HardTask: Story = {
  args: {
    job: {
      ...baseJob,
      id: '4',
      title: 'Full-Stack Application',
      description: 'Build a complete web application with authentication, database, and API',
      task: {
        ...baseJob.task,
        title: 'Build a full-stack app',
        time_limit: 300,
        submission_format: 'code'
      }
    },
  },
};

// Urgent deadline story
export const UrgentDeadline: Story = {
  args: {
    job: {
      ...baseJob,
      id: '5',
      title: 'Urgent Frontend Fix',
      description: 'Fix critical UI bugs in our production application',
      closing_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 1 day from now
    },
  },
};

// Expired job story
export const ExpiredJob: Story = {
  args: {
    job: {
      ...baseJob,
      id: '6',
      title: 'Expired Opportunity',
      description: 'This job opportunity has already expired',
      closing_date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    },
  },
};

// Open deadline story
export const OpenDeadline: Story = {
  args: {
    job: {
      ...baseJob,
      id: '7',
      title: 'Open-Ended Project',
      description: 'Long-term project with flexible timeline',
      closing_date: undefined,
    },
  },
};

// Different submission formats
export const TextSubmission: Story = {
  args: {
    job: {
      ...baseJob,
      id: '8',
      title: 'Content Writing Task',
      description: 'Write engaging content for our blog',
      task: {
        ...baseJob.task,
        title: 'Write a blog post',
        submission_format: 'text',
        time_limit: 90
      }
    },
  },
};

export const PresentationSubmission: Story = {
  args: {
    job: {
      ...baseJob,
      id: '9',
      title: 'Product Pitch',
      description: 'Create a presentation for our new product launch',
      task: {
        ...baseJob.task,
        title: 'Create product presentation',
        submission_format: 'presentation',
        time_limit: 180
      }
    },
  },
};

// Different locations
export const OnsiteJob: Story = {
  args: {
    job: {
      ...baseJob,
      id: '10',
      title: 'Onsite Developer Position',
      location: {
        type: 'onsite',
        city: 'New York',
        country: 'USA'
      }
    },
  },
};

export const HybridJob: Story = {
  args: {
    job: {
      ...baseJob,
      id: '11',
      title: 'Hybrid Work Opportunity',
      location: {
        type: 'hybrid',
        city: 'London',
        country: 'UK'
      }
    },
  },
};

// Grid layout story
export const GridLayout: Story = {
  render: (args) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <TaskCard {...args} job={{ ...baseJob, id: '12', title: 'Job 1' }} />
      <TaskCard {...args} job={{ ...baseJob, id: '13', title: 'Job 2' }} />
      <TaskCard {...args} job={{ ...baseJob, id: '14', title: 'Job 3' }} />
      <TaskCard {...args} job={{ ...baseJob, id: '15', title: 'Job 4' }} />
      <TaskCard {...args} job={{ ...baseJob, id: '16', title: 'Job 5' }} />
      <TaskCard {...args} job={{ ...baseJob, id: '17', title: 'Job 6' }} />
    </div>
  ),
  args: {
    isRecommended: false,
    showMatchScore: false,
  },
};

// Mixed states story
export const MixedStates: Story = {
  render: (args) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <TaskCard 
        {...args} 
        job={{ ...baseJob, id: '18', title: 'Normal Job' }} 
      />
      <TaskCard 
        {...args} 
        job={{
          ...baseJob,
          id: '19',
          title: 'Recommended Job',
          match_score: 88,
          is_recommended: true
        } as JobWithRecommendation}
        isRecommended={true}
        showMatchScore={true}
      />
      <TaskCard 
        {...args} 
        job={{
          ...baseJob,
          id: '20',
          title: 'Urgent Job',
          closing_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        }}
      />
      <TaskCard 
        {...args} 
        job={{
          ...baseJob,
          id: '21',
          title: 'Expired Job',
          closing_date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        }}
      />
    </div>
  ),
  args: {
    isRecommended: false,
    showMatchScore: false,
  },
};