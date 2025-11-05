# DoProof Application

This is a full-stack application with separate frontend and backend directories.

## Project Structure

```
├── frontend/           # React frontend application
│   ├── public/         # Static files
│   ├── src/            # React source code
│   │   ├── components/ # React components
│   │   ├── context/    # React context providers
│   │   └── pages/      # Page components
│   ├── package.json    # Frontend dependencies
│   └── tsconfig.json   # TypeScript configuration
│
├── backend/            # FastAPI backend application
│   ├── app/            # FastAPI application package
│   │   ├── core/       # Core functionality (config, auth, db)
│   │   ├── models/     # Pydantic models
│   │   ├── routers/    # API routes
│   │   └── schemas/    # Request/response schemas
│   ├── main.py         # Entry point
│   └── requirements.txt # Python dependencies
│
├── package.json        # Root package.json for running both apps
└── README.md           # This file
```

## Getting Started

### Installation

1. Install root dependencies:
   ```
   npm install
   ```

2. Install frontend dependencies:
   ```
   npm run install:frontend
   ```

3. Install backend dependencies (requires Python):
   ```
   npm run install:backend
   ```
   
   Or install all dependencies at once:
   ```
   npm run install:all
   ```

### Running the Application

1. Run both frontend and backend:
   ```
   npm start
   ```

2. Run in development mode:
   ```
   npm run dev
   ```

### Individual Services

- Frontend only:
  ```
  npm run start:frontend
  ```

- Backend only:
  ```
  npm run start:backend
  ```

## Frontend

The frontend is a React application with TypeScript, using React Router for navigation and Tailwind CSS for styling.

## Backend

The backend is a FastAPI application with the following features:
- RESTful API endpoints
- User authentication and JWT tokens
- Task management
- MongoDB database integration
- Automatic API documentation (Swagger/OpenAPI)

## Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, React Router
- **Backend**: FastAPI, Python, MongoDB (Motor), Pydantic
- **Development**: Concurrently for running both services