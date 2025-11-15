# DoProof Application

A full-stack recruitment and task management platform connecting recruiters with students. Recruiters can post jobs, create tasks, evaluate submissions with AI, and manage candidates. Students can browse tasks, submit work, track applications, and receive AI-powered feedback.

## Project Structure

```
├── frontend/                    # React frontend application
│   ├── public/                 # Static files
│   ├── src/
│   │   ├── components/         # React components
│   │   │   ├── recruiter/      # Recruiter-specific components
│   │   │   ├── student/        # Student-specific components
│   │   │   ├── forms/          # Reusable form components
│   │   │   └── __tests__/      # Component tests
│   │   ├── context/            # React context providers (Auth, Notifications, WebSocket)
│   │   ├── hooks/              # Custom React hooks
│   │   │   ├── recruiter/      # Recruiter hooks
│   │   │   └── student/        # Student hooks
│   │   ├── pages/              # Page components
│   │   │   ├── recruiter/      # Recruiter pages
│   │   │   └── student/        # Student pages
│   │   ├── types/              # TypeScript type definitions
│   │   └── utils/              # Utility functions
│   ├── package.json
│   └── tsconfig.json
│
├── backend/                     # FastAPI backend application
│   ├── app/
│   │   ├── core/               # Core functionality
│   │   │   ├── auth.py         # Authentication utilities
│   │   │   ├── config.py       # Application settings
│   │   │   ├── database.py     # Database connection
│   │   │   └── security.py     # Security utilities
│   │   ├── middleware/         # Custom middleware
│   │   │   ├── csrf.py         # CSRF protection
│   │   │   ├── rate_limiting.py # Rate limiting
│   │   │   └── security.py     # Security headers
│   │   ├── models/             # Database models
│   │   │   ├── user.py         # User model
│   │   │   ├── job.py          # Job model
│   │   │   ├── task.py         # Task model
│   │   │   ├── task_submission.py # Task submission model
│   │   │   ├── company.py      # Company model
│   │   │   ├── interview.py    # Interview model
│   │   │   └── ai_evaluation.py # AI evaluation model
│   │   ├── routers/            # API route handlers
│   │   │   ├── users.py        # User management
│   │   │   ├── jobs.py         # Job management
│   │   │   ├── tasks.py        # Task management
│   │   │   ├── task_submissions.py # Submission handling
│   │   │   ├── students.py     # Student endpoints
│   │   │   ├── candidates.py   # Candidate management
│   │   │   ├── company.py      # Company management
│   │   │   ├── interviews.py   # Interview scheduling
│   │   │   ├── ai_evaluation.py # AI evaluation
│   │   │   ├── analytics.py    # Analytics
│   │   │   ├── notifications.py # Notifications
│   │   │   ├── file_upload.py  # File upload handling
│   │   │   └── websocket.py    # WebSocket support
│   │   ├── schemas/            # Pydantic schemas
│   │   └── main.py             # FastAPI application
│   ├── tests/                  # Backend tests
│   ├── uploads/                # File uploads directory
│   ├── main.py                 # Application entry point
│   ├── requirements.txt        # Python dependencies
│   ├── env.example             # Environment variables template
│   ├── init_db.py              # Database initialization
│   └── README.md               # Backend-specific documentation
│
├── cypress/                     # E2E testing
│   ├── e2e/                    # End-to-end test specs
│   └── support/                # Cypress support files
│
├── scripts/                     # Utility scripts
│   ├── run-tests.bat           # Windows test runner
│   └── run-tests.sh            # Linux/Mac test runner
│
├── package.json                 # Root package.json
├── TESTING.md                   # Testing documentation
├── PERFORMANCE_OPTIMIZATIONS.md # Performance guide
└── README.md                    # This file
```

## Getting Started

### Prerequisites

- **Node.js** (v16 or higher)
- **Python** (3.8 or higher)
- **npm** or **yarn**

### Installation

1. **Install root dependencies:**
   ```bash
   npm install
   ```

2. **Install frontend dependencies:**
   ```bash
   npm run install:frontend
   ```

3. **Install backend dependencies:**
   ```bash
   npm run install:backend
   ```
   
   Or install all dependencies at once:
   ```bash
   npm run install:all
   ```

4. **Set up environment variables:**
   ```bash
   cd backend
   cp env.example .env
   # Edit .env with your configuration
   ```

5. **Initialize the database:**
   ```bash
   cd backend
   python init_db.py
   ```

### Running the Application

1. **Run both frontend and backend:**
   ```bash
   npm start
   ```

2. **Run in development mode:**
   ```bash
   npm run dev
   ```

### Individual Services

- **Frontend only:**
  ```bash
  npm run start:frontend
  ```
  Frontend runs on `http://localhost:3000`

- **Backend only:**
  ```bash
  npm run start:backend
  ```
  Backend runs on `http://localhost:5000`
  - API documentation: `http://localhost:5000/docs`
  - Alternative docs: `http://localhost:5000/redoc`

## Features

### For Recruiters

- **Job Management**: Create, edit, and manage job postings
- **Task Creation**: Define tasks with requirements and evaluation criteria
- **Candidate Management**: Browse candidates, view submissions, and manage applications
- **AI Evaluation**: Automated evaluation of task submissions with detailed scoring
- **Interview Scheduling**: Schedule and manage interviews with candidates
- **Analytics Dashboard**: Track recruitment metrics and performance
- **Company Profile**: Manage company information and branding
- **Team Management**: Collaborate with team members
- **Real-time Notifications**: Receive updates on applications and submissions

### For Students

- **Task Browser**: Browse available tasks with advanced filtering and search
- **Task Submission**: Submit work for evaluation with file uploads
- **Application Tracking**: Track application status and history
- **AI Feedback**: Receive detailed AI-powered feedback on submissions
- **Performance Analytics**: View performance metrics and progress
- **Job Recommendations**: Get personalized job recommendations
- **Profile Management**: Create and update student profile
- **Real-time Updates**: WebSocket-based real-time notifications

## Frontend

The frontend is a React 18 application with TypeScript, featuring:

- **React Router** for navigation
- **Tailwind CSS** for styling
- **React Query** for data fetching and caching
- **WebSocket** support for real-time features
- **Code Splitting** for optimized performance
- **Virtual Scrolling** for large lists
- **Image Lazy Loading** for better performance
- **Accessibility** features (WCAG 2.1 AA compliant)
- **Error Boundaries** for graceful error handling
- **Offline Detection** and handling

### Frontend Scripts

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run test:coverage` - Run tests with coverage
- `npm run test:a11y` - Run accessibility tests
- `npm run test:performance` - Run performance tests

## Backend

The backend is a FastAPI application with the following features:

- **RESTful API** endpoints
- **JWT Authentication** with secure token handling
- **SQLite Database** with async support (aiosqlite)
- **WebSocket** support for real-time communication
- **File Upload** handling with validation
- **AI Evaluation** integration
- **Security Middleware**:
  - CSRF protection
  - Rate limiting
  - Security headers
  - Request validation
- **Automatic API Documentation** (Swagger/OpenAPI)
- **Database Models**:
  - Users (recruiters, students)
  - Jobs and Tasks
  - Task Submissions
  - Companies
  - Interviews
  - AI Evaluations
  - Notifications

### API Endpoints

- `/api/users` - User management and authentication
- `/api/jobs` - Job CRUD operations
- `/api/tasks` - Task management
- `/api/task-submissions` - Submission handling
- `/api/students` - Student-specific endpoints
- `/api/candidates` - Candidate management
- `/api/company` - Company management
- `/api/interviews` - Interview scheduling
- `/api/ai-evaluation` - AI evaluation endpoints
- `/api/analytics` - Analytics and metrics
- `/api/notifications` - Notification management
- `/api/upload` - File upload endpoints
- `/ws` - WebSocket endpoint

## Testing

The project includes comprehensive testing:

- **Unit Tests**: Frontend (Jest) and Backend (pytest)
- **Integration Tests**: API endpoint testing
- **E2E Tests**: Cypress for complete user workflows
- **Accessibility Tests**: WCAG 2.1 AA compliance
- **Performance Tests**: Load and performance validation

### Running Tests

**All tests:**
```bash
# Windows
scripts/run-tests.bat

# Linux/Mac
./scripts/run-tests.sh
```

**Backend tests:**
```bash
cd backend
python -m pytest tests/ -v
python -m pytest tests/ --cov=app --cov-report=html
```

**Frontend tests:**
```bash
cd frontend
npm test
npm run test:coverage
npm run test:a11y
```

**E2E tests:**
```bash
cd frontend
npm run cypress:open  # Interactive
npm run cypress:run   # Headless
```

See [TESTING.md](./TESTING.md) for detailed testing documentation.

## Performance Optimizations

The application includes several performance optimizations:

- **Code Splitting**: Lazy-loaded pages and components
- **React Query Caching**: Intelligent data caching and background refetching
- **Virtual Scrolling**: Efficient rendering of large lists
- **Image Lazy Loading**: Images load only when needed
- **Debounced Search**: Reduced API calls during search
- **Database Indexing**: Optimized database queries

See [PERFORMANCE_OPTIMIZATIONS.md](./PERFORMANCE_OPTIMIZATIONS.md) for details.

## Technology Stack

### Frontend
- **React** 18.2.0
- **TypeScript** 4.9.0
- **React Router** 7.8.0
- **Tailwind CSS** 3.3.0
- **React Query** 5.90.2
- **React Window** 2.2.3 (Virtual scrolling)
- **Recharts** 3.2.1 (Charts)
- **Testing Library** (Jest, React Testing Library)
- **Cypress** (E2E testing)

### Backend
- **FastAPI** 0.95.1
- **Python** 3.8+
- **Uvicorn** 0.22.0 (ASGI server)
- **SQLAlchemy** 2.0.15 (ORM)
- **aiosqlite** 0.19.0 (Async SQLite)
- **Pydantic** 1.10.7 (Data validation)
- **Python-Jose** 3.3.0 (JWT)
- **Passlib** 1.7.4 (Password hashing)
- **Pytest** 7.3.1 (Testing)

### Development Tools
- **Concurrently** (Running both services)
- **ESLint** (Code linting)
- **Prettier** (Code formatting)

## Security Features

- JWT-based authentication
- Password hashing with Passlib
- CSRF protection middleware
- Rate limiting (especially for student endpoints)
- Security headers middleware
- Request validation
- File upload validation
- SQL injection prevention (SQLAlchemy ORM)

## Environment Variables

Backend environment variables (see `backend/env.example`):

```env
FRONTEND_URL=http://localhost:3000
DATABASE_URL=sqlite+aiosqlite:///./doproof.db
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NODE_ENV=development
```

## Project Scripts

### Root Level
- `npm start` - Run both frontend and backend
- `npm run dev` - Run both in development mode
- `npm run install:all` - Install all dependencies
- `npm run install:frontend` - Install frontend dependencies
- `npm run install:backend` - Install backend dependencies
- `npm run start:frontend` - Start frontend only
- `npm run start:backend` - Start backend only

## Documentation

- [Backend README](./backend/README.md) - Backend-specific documentation
- [TESTING.md](./TESTING.md) - Comprehensive testing guide
- [PERFORMANCE_OPTIMIZATIONS.md](./PERFORMANCE_OPTIMIZATIONS.md) - Performance optimization details
- [Backend SECURITY.md](./backend/SECURITY.md) - Security documentation
- [Backend MIGRATION_GUIDE.md](./backend/MIGRATION_GUIDE.md) - Database migration guide

## Contributing

When contributing to this project:

1. Write tests for new features
2. Ensure all tests pass
3. Follow code style guidelines
4. Update documentation as needed
5. Check test coverage requirements (80% minimum)

## License

[Add your license information here]
