// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {
    return null;
  }
  disconnect() {
    return null;
  }
  unobserve() {
    return null;
  }
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  observe() {
    return null;
  }
  disconnect() {
    return null;
  }
  unobserve() {
    return null;
  }
};

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.sessionStorage = sessionStorageMock;

// Mock fetch
global.fetch = jest.fn();

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => 'mocked-url');
global.URL.revokeObjectURL = jest.fn();

// Mock File and FileReader
global.File = class MockFile {
  constructor(parts: any[], filename: string, properties?: any) {
    return {
      name: filename,
      size: parts.reduce((acc, part) => acc + part.length, 0),
      type: properties?.type || 'text/plain',
      lastModified: Date.now(),
    } as any;
  }
};

global.FileReader = class MockFileReader {
  result: any = null;
  error: any = null;
  readyState: number = 0;
  onload: any = null;
  onerror: any = null;
  onabort: any = null;

  readAsText() {
    this.readyState = 2;
    this.result = 'mocked file content';
    if (this.onload) {
      this.onload({ target: this });
    }
  }

  readAsDataURL() {
    this.readyState = 2;
    this.result = 'data:text/plain;base64,bW9ja2VkIGZpbGUgY29udGVudA==';
    if (this.onload) {
      this.onload({ target: this });
    }
  }

  abort() {
    this.readyState = 2;
    if (this.onabort) {
      this.onabort({ target: this });
    }
  }
} as any;

// Mock performance API
const mockPerformance = {
  mark: jest.fn(),
  measure: jest.fn(),
  getEntriesByName: jest.fn(() => []),
  getEntriesByType: jest.fn(() => []),
  now: jest.fn(() => Date.now()),
  clearMarks: jest.fn(),
  clearMeasures: jest.fn(),
};

Object.defineProperty(window, 'performance', {
  value: mockPerformance,
  writable: true,
});

// Mock console methods to reduce noise in tests
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };

  console.warn = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('componentWillReceiveProps') ||
       args[0].includes('componentWillUpdate'))
    ) {
      return;
    }
    originalWarn.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});

// Global test utilities
export const createMockJob = (overrides = {}) => ({
  id: '1',
  title: 'Test Job',
  description: 'Test job description',
  requirements: ['Test requirement'],
  responsibilities: ['Test responsibility'],
  salary: { min: 50000, max: 80000, currency: 'USD' },
  location: { type: 'remote' as const },
  employment_type: 'full-time' as const,
  status: 'active' as const,
  posted_date: new Date().toISOString(),
  closing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  task: {
    title: 'Test Task',
    description: 'Test task description',
    instructions: 'Test instructions',
    time_limit: 120,
    submission_format: 'text' as const,
    max_file_size: 10,
    allowed_file_types: ['pdf', 'txt']
  },
  evaluation_criteria: {
    critical_thinking: 25,
    problem_solving: 25,
    creativity: 25,
    technical_skills: 25,
    communication: 0,
    attention_to_detail: 0
  },
  application_count: 0,
  submission_count: 0,
  view_count: 0,
  company_id: 'company1',
  recruiter_id: 'recruiter1',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides
});

export const createMockSubmission = (overrides = {}) => ({
  id: '1',
  job_id: 'job1',
  candidate_id: 'candidate1',
  status: 'submitted' as const,
  started_at: new Date().toISOString(),
  submitted_at: new Date().toISOString(),
  time_spent: 90,
  submission: {
    type: 'text' as const,
    content: 'Test submission content'
  },
  candidate: {
    id: 'candidate1',
    name: 'Test Candidate',
    email: 'candidate@example.com',
    profile_picture: 'https://example.com/avatar.jpg'
  },
  job: {
    id: 'job1',
    title: 'Test Job',
    task: {
      title: 'Test Task',
      time_limit: 120
    }
  },
  ...overrides
});

export const createMockEvaluation = (overrides = {}) => ({
  overall_score: 85,
  criteria_scores: {
    critical_thinking: 80,
    problem_solving: 90,
    creativity: 75,
    technical_skills: 88,
    communication: 82,
    attention_to_detail: 85
  },
  feedback: 'Test feedback',
  evaluated_at: new Date().toISOString(),
  evaluation_model: 'gpt-4',
  ...overrides
});

// Test data cleanup
afterEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  sessionStorage.clear();
});