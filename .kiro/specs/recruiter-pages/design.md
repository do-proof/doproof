# Design Document

## Overview

The recruiter pages feature will transform the current single-dashboard approach into a comprehensive task-based recruitment management system. DoProof's unique approach allows recruiters to post jobs with specific tasks that candidates must complete within time limits. An AI evaluation agent scores submissions based on predefined criteria (critical thinking, problem-solving, etc.), and recruiters can review both scores and actual submissions. The design follows a modular architecture with dedicated pages for each major recruitment function, unified by consistent navigation and shared components.

## Architecture

### Frontend Architecture

```
frontend/src/
├── pages/
│   └── recruiter/
│       ├── RecruiterDashboard.tsx      # Main dashboard (updated)
│       ├── JobPostings.tsx             # Job management page
│       ├── JobForm.tsx                 # Create/edit job form
│       ├── CandidateSearch.tsx         # Candidate browsing page
│       ├── Applications.tsx            # Application management page
│       ├── Interviews.tsx              # Interview scheduling page
│       ├── Analytics.tsx               # Recruitment analytics page
│       └── CompanyProfile.tsx          # Company management page
├── components/
│   └── recruiter/
│       ├── RecruiterLayout.tsx         # Shared layout component
│       ├── RecruiterNavigation.tsx     # Navigation sidebar/header
│       ├── JobCard.tsx                 # Job posting with task card component
│       ├── CandidateCard.tsx           # Candidate profile card
│       ├── TaskSubmissionCard.tsx      # Task submission summary card
│       ├── AIScoreDisplay.tsx          # AI evaluation score component
│       ├── SubmissionViewer.tsx        # Task submission content viewer
│       ├── TaskDefinitionForm.tsx      # Task creation form component
│       ├── EvaluationCriteriaForm.tsx  # Criteria weight configuration
│       ├── InterviewCalendar.tsx       # Calendar component
│       ├── AnalyticsChart.tsx          # Chart components
│       └── CompanyForm.tsx             # Company profile form
└── hooks/
    └── recruiter/
        ├── useJobs.ts                  # Job with task management hooks
        ├── useCandidates.ts            # Candidate data hooks
        ├── useTaskSubmissions.ts       # Task submission management hooks
        ├── useAIEvaluation.ts          # AI evaluation data hooks
        ├── useInterviews.ts            # Interview scheduling hooks
        └── useAnalytics.ts             # Task-based analytics hooks
```

### Backend Extensions

```
backend/app/
├── models/
│   ├── job.py                          # Job posting with task model
│   ├── task_submission.py              # Task submission model
│   ├── ai_evaluation.py                # AI evaluation model
│   ├── interview.py                    # Interview model
│   └── company.py                      # Company profile model
├── routers/
│   ├── jobs.py                         # Job with task management endpoints
│   ├── task_submissions.py             # Task submission endpoints
│   ├── ai_evaluation.py                # AI evaluation service endpoints
│   ├── interviews.py                   # Interview endpoints
│   ├── candidates.py                   # Candidate search endpoints
│   └── analytics.py                    # Task-based analytics endpoints
└── schemas/
    ├── job_schemas.py                  # Job with task schemas
    ├── task_submission_schemas.py      # Task submission schemas
    ├── ai_evaluation_schemas.py        # AI evaluation schemas
    ├── interview_schemas.py            # Interview schemas
    └── analytics_schemas.py            # Task-based analytics schemas
```

## Components and Interfaces

### 1. RecruiterLayout Component

**Purpose:** Provides consistent layout and navigation for all recruiter pages

**Key Features:**
- Responsive sidebar navigation
- Header with user info and notifications
- Breadcrumb navigation
- Mobile-friendly hamburger menu

**Props Interface:**
```typescript
interface RecruiterLayoutProps {
  children: React.ReactNode;
  currentPage: string;
  pageTitle: string;
}
```

### 2. Job Management Pages

#### JobPostings Page
- **Layout:** Grid/list view toggle for job postings
- **Features:** Search, filter, sort, bulk actions
- **Actions:** Create, edit, delete, activate/deactivate jobs
- **Components:** JobCard, SearchFilters, ActionButtons

#### JobForm Page
- **Layout:** Multi-step form with validation
- **Sections:** 
  1. Basic job info (title, description, requirements, salary)
  2. Task definition (task description, instructions, time limit)
  3. Submission format (text/file/code/presentation, file constraints)
  4. Evaluation criteria (weights for different skills)
  5. Job settings (location, employment type, closing date)
- **Features:** Rich text editor, task preview, criteria weight sliders
- **Validation:** Real-time validation with error messages, task time limit validation

### 3. Candidate Management

#### CandidateSearch Page
- **Layout:** Search interface with results grid
- **Features:** Advanced filters, saved searches, candidate comparison
- **Filters:** Skills, experience, location, availability, salary
- **Actions:** View profile, message, invite to apply, save to list

### 4. Task Submission Management

#### TaskSubmissions Page
- **Layout:** Kanban board or table view with AI scores
- **Stages:** In Progress, Submitted, Evaluated, Reviewed, Shortlisted, Rejected
- **Features:** 
  - View AI evaluation scores and detailed breakdown
  - Compare submissions side-by-side
  - Filter by AI score ranges and criteria
  - Bulk review actions
  - Export submission data
- **Submission Viewer:** 
  - Text submissions: Rich text display with syntax highlighting
  - File submissions: Download and preview capabilities
  - Code submissions: Syntax-highlighted code viewer
  - Time tracking: Visual indicator of time spent vs. time limit
- **AI Insights:** Score explanations, criteria breakdown, improvement suggestions

### 5. Interview Management

#### Interviews Page
- **Layout:** Calendar view with list fallback
- **Features:** Scheduling, rescheduling, feedback collection
- **Integration:** Calendar sync, email notifications
- **Components:** InterviewCalendar, InterviewForm, FeedbackForm

### 6. Analytics Dashboard

#### Analytics Page
- **Layout:** Dashboard with multiple chart widgets
- **Metrics:** 
  - Task completion rates and average time spent
  - AI evaluation score distributions
  - Criteria-wise performance analysis
  - Submission quality trends over time
  - Candidate ranking and shortlisting rates
- **Features:** Date range selection, export functionality, drill-down by job/criteria
- **Charts:** 
  - Score distribution histograms
  - Criteria radar charts
  - Time vs. performance scatter plots
  - Conversion funnel from task start to hire

### 7. Company Profile

#### CompanyProfile Page
- **Layout:** Tabbed interface for different sections
- **Sections:** Basic info, culture, benefits, team, settings
- **Features:** Media uploads, rich text editing, preview mode
- **Components:** CompanyForm, MediaUploader, TeamManager

## AI Evaluation System

### Evaluation Agent Architecture

The AI evaluation agent is a core component that automatically scores task submissions based on predefined criteria. The system uses **Langraph** as the primary framework for orchestrating the evaluation workflow, combined with natural language processing, code analysis, and structured evaluation frameworks.

#### Langraph-Based Evaluation Pipeline

The evaluation system leverages **Langraph** to create a sophisticated, multi-step evaluation workflow that ensures consistent and comprehensive assessment of candidate submissions.

**Langraph Workflow Components:**
1. **Submission Processing Node:** Parse and normalize submission content using Langraph's state management
2. **Criteria Analysis Nodes:** Parallel evaluation of each criterion using dedicated Langraph nodes
3. **Score Aggregation Node:** Weighted scoring calculation based on recruiter-defined criteria
4. **Feedback Generation Node:** Contextual feedback generation using Langraph's conditional logic
5. **Quality Assurance Node:** Final validation and consistency checks
6. **Ranking Node:** Candidate ranking and recommendation generation

**Langraph State Management:**
- **Submission State:** Track submission content, metadata, and processing status
- **Evaluation State:** Maintain scores, feedback, and evaluation progress across nodes
- **Context State:** Preserve job requirements, evaluation criteria, and historical data
- **Decision State:** Store final scores, recommendations, and next steps

#### Evaluation Criteria Framework
- **Critical Thinking:** Analyze problem approach, reasoning quality, and solution logic
- **Problem Solving:** Assess solution effectiveness, edge case handling, and optimization
- **Creativity:** Evaluate innovative approaches, unique solutions, and original thinking
- **Technical Skills:** Review code quality, best practices, and technical accuracy
- **Communication:** Analyze clarity, structure, and explanation quality
- **Attention to Detail:** Check completeness, accuracy, and thoroughness

#### AI Model Integration with Langraph
- **Text Analysis:** Use NLP models within Langraph nodes for written submissions and explanations
- **Code Analysis:** Integrate static code analysis tools as Langraph tool nodes
- **Structured Evaluation:** Implement rule-based scoring as conditional Langraph edges
- **Feedback Generation:** Use Langraph's memory and context management for personalized insights
- **Multi-Agent Coordination:** Leverage Langraph's agent orchestration for complex evaluations

## Data Models

### Job Model
```typescript
interface Job {
  id: string;
  title: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  salary: {
    min: number;
    max: number;
    currency: string;
  };
  location: {
    type: 'remote' | 'onsite' | 'hybrid';
    city?: string;
    country?: string;
  };
  employmentType: 'full-time' | 'part-time' | 'contract' | 'internship';
  status: 'draft' | 'active' | 'paused' | 'closed';
  postedDate: Date;
  closingDate?: Date;
  
  // DoProof-specific task fields
  task: {
    title: string;
    description: string;
    instructions: string;
    timeLimit: number; // in minutes
    submissionFormat: 'text' | 'file' | 'code' | 'presentation';
    maxFileSize?: number;
    allowedFileTypes?: string[];
  };
  
  // AI Evaluation criteria
  evaluationCriteria: {
    criticalThinking: number; // weight 0-100
    problemSolving: number;
    creativity: number;
    technicalSkills: number;
    communication: number;
    attentionToDetail: number;
  };
  
  applicationCount: number;
  submissionCount: number;
  viewCount: number;
  companyId: string;
  recruiterId: string;
}
```

### TaskSubmission Model
```typescript
interface TaskSubmission {
  id: string;
  jobId: string;
  candidateId: string;
  status: 'in_progress' | 'submitted' | 'evaluated' | 'reviewed' | 'shortlisted' | 'rejected';
  startedAt: Date;
  submittedAt?: Date;
  timeSpent: number; // in minutes
  
  // Submission content
  submission: {
    type: 'text' | 'file' | 'code' | 'presentation';
    content?: string; // for text/code submissions
    fileUrl?: string; // for file submissions
    fileName?: string;
    fileSize?: number;
  };
  
  // AI Evaluation results
  aiEvaluation?: {
    overallScore: number; // 0-100
    criteriaScores: {
      criticalThinking: number;
      problemSolving: number;
      creativity: number;
      technicalSkills: number;
      communication: number;
      attentionToDetail: number;
    };
    feedback: string;
    evaluatedAt: Date;
    evaluationModel: string;
  };
  
  // Recruiter review
  recruiterReview?: {
    rating: number; // 1-5 stars
    notes: string;
    decision: 'shortlist' | 'reject' | 'pending';
    reviewedAt: Date;
    reviewedBy: string;
  };
  
  // Basic application info
  coverLetter?: string;
  resumeUrl?: string;
}
```

### Interview Model
```typescript
interface Interview {
  id: string;
  applicationId: string;
  scheduledDate: Date;
  duration: number;
  type: 'phone' | 'video' | 'onsite';
  interviewers: string[];
  location?: string;
  meetingLink?: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
  feedback?: InterviewFeedback;
  notes?: string;
}
```

## Error Handling

### Frontend Error Handling
- **Network Errors:** Retry mechanism with exponential backoff
- **Validation Errors:** Real-time field validation with clear messages
- **Permission Errors:** Redirect to appropriate page with explanation
- **Loading States:** Skeleton screens and loading indicators
- **Error Boundaries:** Catch and display component errors gracefully

### Backend Error Handling
- **Input Validation:** Pydantic schema validation with detailed error messages
- **Database Errors:** Proper error logging and user-friendly responses
- **Authentication Errors:** Clear JWT token validation and refresh handling
- **Rate Limiting:** Implement rate limiting for API endpoints
- **File Upload Errors:** Validate file types, sizes, and handle upload failures

## Testing Strategy

### Frontend Testing
- **Unit Tests:** Jest and React Testing Library for components
- **Integration Tests:** Test page interactions and data flow
- **E2E Tests:** Cypress tests for critical user journeys
- **Accessibility Tests:** Automated a11y testing with axe-core
- **Visual Regression:** Screenshot testing for UI consistency

### Backend Testing
- **Unit Tests:** pytest for individual functions and methods
- **Integration Tests:** Test API endpoints with test database
- **Authentication Tests:** Verify JWT token handling and permissions
- **Database Tests:** Test model relationships and queries
- **Performance Tests:** Load testing for critical endpoints

### Test Coverage Goals
- Frontend: 80% code coverage minimum
- Backend: 90% code coverage minimum
- Critical paths: 100% coverage required

## Performance Considerations

### Frontend Optimization
- **Code Splitting:** Lazy load recruiter pages to reduce initial bundle size
- **Caching:** Implement React Query for data caching and synchronization
- **Virtualization:** Use virtual scrolling for large candidate/application lists
- **Image Optimization:** Compress and lazy load images
- **Bundle Analysis:** Regular bundle size monitoring and optimization

### Backend Optimization
- **Database Indexing:** Proper indexes on frequently queried fields
- **Pagination:** Implement cursor-based pagination for large datasets
- **Caching:** Redis caching for frequently accessed data
- **Query Optimization:** Optimize database queries and use aggregation pipelines
- **File Storage:** Use cloud storage for resumes and company media

## Security Considerations

### Authentication & Authorization
- **Role-based Access:** Ensure recruiters can only access their own data
- **JWT Security:** Proper token expiration and refresh handling
- **Permission Checks:** Verify permissions on all sensitive operations
- **Session Management:** Secure session handling and logout

### Data Protection
- **Input Sanitization:** Sanitize all user inputs to prevent XSS
- **File Upload Security:** Validate file types and scan for malware
- **Data Encryption:** Encrypt sensitive data at rest and in transit
- **GDPR Compliance:** Implement data deletion and export capabilities
- **Audit Logging:** Log all sensitive operations for compliance

## Accessibility Features

### WCAG 2.1 AA Compliance
- **Keyboard Navigation:** Full keyboard accessibility for all interactions
- **Screen Reader Support:** Proper ARIA labels and semantic HTML
- **Color Contrast:** Ensure sufficient contrast ratios for all text
- **Focus Management:** Clear focus indicators and logical tab order
- **Alternative Text:** Descriptive alt text for all images and icons

### Responsive Design
- **Mobile First:** Design for mobile devices first, then scale up
- **Touch Targets:** Minimum 44px touch targets for mobile interactions
- **Flexible Layouts:** Use CSS Grid and Flexbox for responsive layouts
- **Breakpoints:** Support for mobile, tablet, and desktop viewports
- **Progressive Enhancement:** Core functionality works without JavaScript