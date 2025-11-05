# DoProof Testing Guide

This document provides comprehensive information about the testing strategy and implementation for the DoProof application.

## Overview

The DoProof testing suite includes:
- **Unit Tests**: Testing individual components and functions
- **Integration Tests**: Testing API endpoints and database interactions
- **End-to-End Tests**: Testing complete user workflows
- **Accessibility Tests**: Ensuring WCAG 2.1 AA compliance
- **Performance Tests**: Validating application performance under load

## Test Coverage Goals

- **Frontend**: 80% minimum coverage, 85% for recruiter components
- **Backend**: 90% minimum coverage
- **Critical Paths**: 100% coverage required

## Running Tests

### All Tests
```bash
# Windows
scripts/run-tests.bat

# Linux/Mac
./scripts/run-tests.sh
```

### Backend Tests Only
```bash
cd backend

# Unit tests
python -m pytest tests/ -v -m "not slow and not performance"

# Integration tests
python -m pytest tests/ -v -m "integration"

# Performance tests
python -m pytest tests/ -v -m "performance"

# With coverage
python -m pytest tests/ --cov=app --cov-report=html
```

### Frontend Tests Only
```bash
cd frontend

# Unit tests with coverage
npm run test:coverage

# Accessibility tests
npm run test:a11y

# Performance tests
npm run test:performance
```

### E2E Tests Only
```bash
cd frontend

# Interactive mode
npm run cypress:open

# Headless mode
npm run cypress:run
```

## Test Structure

### Backend Tests (`backend/tests/`)
```
tests/
├── conftest.py              # Test configuration and fixtures
├── test_jobs.py            # Job management endpoint tests
├── test_task_submissions.py # Task submission tests
├── test_ai_evaluation.py   # AI evaluation tests
├── test_security.py        # Security and authentication tests
└── test_performance.py     # Performance and load tests
```

### Frontend Tests (`frontend/src/`)
```
src/
├── components/
│   └── recruiter/
│       └── __tests__/
│           ├── RecruiterLayout.test.tsx
│           ├── JobCard.test.tsx
│           ├── TaskSubmissionCard.test.tsx
│           ├── AIScoreDisplay.test.tsx
│           ├── accessibility.test.tsx
│           └── performance.test.tsx
├── hooks/
│   └── recruiter/
│       └── __tests__/
│           └── useJobs.test.ts
└── setupTests.ts           # Test configuration
```

### E2E Tests (`cypress/`)
```
cypress/
├── e2e/
│   ├── recruiter-job-management.cy.js
│   └── task-submission-management.cy.js
├── support/
│   ├── commands.js         # Custom Cypress commands
│   └── e2e.js             # Global test setup
└── fixtures/              # Test data files
```

## Test Categories

### 1. Unit Tests

**Frontend Unit Tests**
- Component rendering and props
- User interactions (clicks, form submissions)
- State management and hooks
- Utility functions

**Backend Unit Tests**
- Model validation and serialization
- Business logic functions
- Database query builders
- Authentication and authorization

### 2. Integration Tests

**API Integration Tests**
- Endpoint functionality
- Request/response validation
- Database operations
- Authentication flows
- Error handling

**Component Integration Tests**
- Component interactions
- Data flow between components
- API integration with React hooks

### 3. End-to-End Tests

**Critical User Journeys**
- Recruiter job creation workflow
- Task submission management
- AI evaluation review process
- Candidate search and filtering
- Interview scheduling

**Cross-browser Testing**
- Chrome, Firefox, Safari, Edge
- Mobile and desktop viewports
- Different screen resolutions

### 4. Accessibility Tests

**WCAG 2.1 AA Compliance**
- Keyboard navigation
- Screen reader compatibility
- Color contrast ratios
- Focus management
- ARIA attributes
- Semantic HTML structure

**Tools Used**
- jest-axe for automated accessibility testing
- Manual testing with screen readers
- Lighthouse accessibility audits

### 5. Performance Tests

**Frontend Performance**
- Component render times
- Bundle size optimization
- Memory usage patterns
- Virtual scrolling efficiency
- Image loading optimization

**Backend Performance**
- API response times
- Database query performance
- Concurrent user handling
- Memory and CPU usage
- Load testing scenarios

## Test Data Management

### Fixtures and Factories

**Backend Test Data**
```python
# conftest.py
@pytest.fixture
def sample_job_data():
    return {
        "title": "Software Engineer",
        "description": "Job description",
        # ... complete job data
    }
```

**Frontend Test Data**
```typescript
// setupTests.ts
export const createMockJob = (overrides = {}) => ({
  id: '1',
  title: 'Test Job',
  // ... complete job data
  ...overrides
});
```

### Database Cleanup

Tests use isolated test databases that are cleaned between test runs:
- Backend: `mongodb://localhost:27017/doproof_test`
- Automatic cleanup in `conftest.py`

## Mocking Strategy

### API Mocking
- MSW (Mock Service Worker) for frontend API mocking
- pytest fixtures for backend database mocking
- Consistent mock data across test suites

### External Services
- AI evaluation service mocking
- File upload service mocking
- Email service mocking
- Calendar integration mocking

## Continuous Integration

### GitHub Actions Workflow
The CI pipeline runs:
1. Backend unit and integration tests
2. Frontend unit and accessibility tests
3. E2E tests with real browser automation
4. Security scans (Bandit, npm audit)
5. Coverage reporting to Codecov

### Test Environment Setup
- MongoDB service container
- Node.js and Python environment setup
- Dependency caching for faster builds
- Parallel test execution where possible

## Performance Benchmarks

### Response Time Targets
- Job creation: < 1 second average, < 2 seconds 95th percentile
- Job listing: < 500ms average, < 1 second 95th percentile
- Submission processing: < 2 seconds average
- AI evaluation: < 5 seconds average

### Load Testing Scenarios
- 100 concurrent users creating jobs
- 500 submissions processed simultaneously
- 1000+ jobs with pagination and filtering
- Large file uploads (up to 10MB)

## Debugging Tests

### Frontend Test Debugging
```bash
# Run specific test file
npm test -- JobCard.test.tsx

# Run tests in watch mode
npm test

# Debug with Chrome DevTools
npm test -- --debug
```

### Backend Test Debugging
```bash
# Run specific test
python -m pytest tests/test_jobs.py::TestJobsEndpoints::test_create_job_success -v

# Run with pdb debugger
python -m pytest tests/test_jobs.py --pdb

# Run with coverage and HTML report
python -m pytest tests/ --cov=app --cov-report=html
```

### E2E Test Debugging
```bash
# Open Cypress Test Runner
npm run cypress:open

# Run specific test file
npx cypress run --spec "cypress/e2e/recruiter-job-management.cy.js"

# Debug mode with browser open
npx cypress run --headed --no-exit
```

## Test Maintenance

### Regular Tasks
- Update test data when models change
- Review and update performance benchmarks
- Maintain browser compatibility matrix
- Update accessibility standards compliance

### Code Coverage Monitoring
- Automated coverage reports in CI
- Coverage thresholds enforced
- Regular review of uncovered code paths

### Test Performance Optimization
- Parallel test execution
- Test data optimization
- Mock service performance
- CI pipeline optimization

## Best Practices

### Writing Tests
1. **Arrange-Act-Assert** pattern
2. **Descriptive test names** that explain the scenario
3. **Independent tests** that don't rely on other tests
4. **Minimal test data** required for the scenario
5. **Clear assertions** with helpful error messages

### Test Organization
1. **Group related tests** in describe blocks
2. **Use beforeEach/afterEach** for setup/cleanup
3. **Share common fixtures** across tests
4. **Separate unit and integration tests**

### Performance Considerations
1. **Mock external dependencies** in unit tests
2. **Use test databases** for integration tests
3. **Clean up resources** after tests
4. **Optimize test data creation**

## Troubleshooting

### Common Issues

**Tests timing out**
- Increase timeout values in test configuration
- Check for unresolved promises
- Verify mock service responses

**Database connection issues**
- Ensure MongoDB is running
- Check test database URL configuration
- Verify network connectivity

**Frontend test failures**
- Check for missing test setup
- Verify component props and mocks
- Review console errors in test output

**E2E test instability**
- Add explicit waits for elements
- Use data-testid attributes consistently
- Check for race conditions in async operations

### Getting Help

1. Check test logs and error messages
2. Review test documentation and examples
3. Run tests in isolation to identify issues
4. Use debugging tools and breakpoints
5. Consult team members for complex scenarios

## Contributing

When adding new features:
1. Write tests before implementation (TDD)
2. Ensure all test categories are covered
3. Update test documentation
4. Verify CI pipeline passes
5. Review test coverage reports

For test improvements:
1. Identify gaps in current coverage
2. Add missing test scenarios
3. Optimize test performance
4. Update test utilities and helpers
5. Share knowledge with the team