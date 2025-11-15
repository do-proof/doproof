import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { WebSocketProvider } from './context/WebSocketContext';
import ErrorBoundary from './components/ErrorBoundary';
import NotificationContainer from './components/NotificationContainer';
import RecruiterErrorBoundary from './components/recruiter/RecruiterErrorBoundary';
import StudentErrorBoundary from './components/student/StudentErrorBoundary';
import OfflineBanner from './components/OfflineBanner';
import Header from './components/Header';
import Hero from './components/Hero';
import Features from './components/Features';
import About from './components/About';
import Testimonials from './components/Testimonials';
import Footer from './components/Footer';
import AuthPage from './pages/AuthPage';
import FresherDashboard from './components/FresherDashboard';
import StudentDashboard from './components/StudentDashboard';
import RecruiterDashboard from './components/RecruiterDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import ProfileCreation from './components/ProfileCreation';
import LoadingSpinner from './components/LoadingSpinner';
import SkipLink from './components/SkipLink';

// Code splitting: Lazy load student pages
const MyApplications = lazy(() => import('./pages/student/MyApplications'));
const Recommendations = lazy(() => import('./pages/student/Recommendations'));
const StudentAnalytics = lazy(() => import('./pages/student/StudentAnalytics'));
const StudentProfile = lazy(() => import('./pages/student/StudentProfile'));
const SubmissionHistory = lazy(() => import('./pages/student/SubmissionHistory'));

// Recruiter Pages
import JobPostings from './pages/recruiter/JobPostings';
import JobForm from './pages/recruiter/JobForm';
import TaskSubmissions from './pages/recruiter/TaskSubmissions';
import CandidateSearch from './pages/recruiter/CandidateSearch';
import Interviews from './pages/recruiter/Interviews';
import Analytics from './pages/recruiter/Analytics';
import CompanyProfile from './pages/recruiter/CompanyProfile';

// Create a client with optimized caching and performance settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors except 429 (rate limit)
        if (error?.status >= 400 && error?.status < 500 && error?.status !== 429) {
          return false;
        }
        return failureCount < 3;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes - data is fresh for 5 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes - keep unused data in cache for 30 minutes
      refetchOnWindowFocus: false, // Don't refetch on window focus for better performance
      refetchOnReconnect: true, // Refetch when connection is restored
      refetchOnMount: true, // Refetch when component mounts (can be overridden per query)
      // Enable structural sharing for better performance
      structuralSharing: true,
    },
    mutations: {
      retry: (failureCount, error: any) => {
        // Don't retry mutations on 4xx errors
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        return failureCount < 2;
      },
    },
  },
});

// Landing page component
const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <Hero />
      <Features />
      <About />
      <Testimonials />
      <Footer />
    </div>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <NotificationProvider>
                  <WebSocketProvider>
                    <Router>
                      <SkipLink href="#main-content">Skip to main content</SkipLink>
                      <OfflineBanner />
                      <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route 
                path="/student-dashboard" 
                element={
                  <ProtectedRoute requiredUserType="student">
                    <StudentErrorBoundary pageTitle="Student Dashboard">
                      <StudentDashboard />
                    </StudentErrorBoundary>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/profile-creation" 
                element={
                  <ProtectedRoute requiredUserType="student">
                    <ProfileCreation />
                  </ProtectedRoute>
                } 
              />
              
              {/* Student Pages - Code Split with Suspense */}
              <Route 
                path="/student/applications" 
                element={
                  <ProtectedRoute requiredUserType="student">
                    <StudentErrorBoundary pageTitle="My Applications">
                      <Suspense fallback={<LoadingSpinner />}>
                        <MyApplications />
                      </Suspense>
                    </StudentErrorBoundary>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/student/recommendations" 
                element={
                  <ProtectedRoute requiredUserType="student">
                    <StudentErrorBoundary pageTitle="Recommendations">
                      <Suspense fallback={<LoadingSpinner />}>
                        <Recommendations />
                      </Suspense>
                    </StudentErrorBoundary>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/student/analytics" 
                element={
                  <ProtectedRoute requiredUserType="student">
                    <StudentErrorBoundary pageTitle="Analytics">
                      <Suspense fallback={<LoadingSpinner />}>
                        <StudentAnalytics />
                      </Suspense>
                    </StudentErrorBoundary>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/student/profile" 
                element={
                  <ProtectedRoute requiredUserType="student">
                    <StudentErrorBoundary pageTitle="Profile">
                      <Suspense fallback={<LoadingSpinner />}>
                        <StudentProfile />
                      </Suspense>
                    </StudentErrorBoundary>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/student/history" 
                element={
                  <ProtectedRoute requiredUserType="student">
                    <StudentErrorBoundary pageTitle="Submission History">
                      <Suspense fallback={<LoadingSpinner />}>
                        <SubmissionHistory />
                      </Suspense>
                    </StudentErrorBoundary>
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/recruiter-dashboard" 
                element={
                  <ProtectedRoute requiredUserType="recruiter">
                    <RecruiterErrorBoundary pageTitle="Dashboard">
                      <RecruiterDashboard />
                    </RecruiterErrorBoundary>
                  </ProtectedRoute>
                } 
              />
              
              {/* Recruiter Pages with Error Boundaries */}
              <Route 
                path="/recruiter/jobs" 
                element={
                  <ProtectedRoute requiredUserType="recruiter">
                    <RecruiterErrorBoundary pageTitle="Job Postings">
                      <JobPostings />
                    </RecruiterErrorBoundary>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/recruiter/jobs/new" 
                element={
                  <ProtectedRoute requiredUserType="recruiter">
                    <RecruiterErrorBoundary pageTitle="Create Job">
                      <JobForm />
                    </RecruiterErrorBoundary>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/recruiter/jobs/:jobId/edit" 
                element={
                  <ProtectedRoute requiredUserType="recruiter">
                    <RecruiterErrorBoundary pageTitle="Edit Job">
                      <JobForm />
                    </RecruiterErrorBoundary>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/recruiter/submissions" 
                element={
                  <ProtectedRoute requiredUserType="recruiter">
                    <RecruiterErrorBoundary pageTitle="Task Submissions">
                      <TaskSubmissions />
                    </RecruiterErrorBoundary>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/recruiter/candidates" 
                element={
                  <ProtectedRoute requiredUserType="recruiter">
                    <RecruiterErrorBoundary pageTitle="Candidate Search">
                      <CandidateSearch />
                    </RecruiterErrorBoundary>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/recruiter/interviews" 
                element={
                  <ProtectedRoute requiredUserType="recruiter">
                    <RecruiterErrorBoundary pageTitle="Interviews">
                      <Interviews />
                    </RecruiterErrorBoundary>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/recruiter/analytics" 
                element={
                  <ProtectedRoute requiredUserType="recruiter">
                    <RecruiterErrorBoundary pageTitle="Analytics">
                      <Analytics />
                    </RecruiterErrorBoundary>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/recruiter/company" 
                element={
                  <ProtectedRoute requiredUserType="recruiter">
                    <RecruiterErrorBoundary pageTitle="Company Profile">
                      <CompanyProfile />
                    </RecruiterErrorBoundary>
                  </ProtectedRoute>
                } 
              />
              
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            <NotificationContainer />
            <ReactQueryDevtools initialIsOpen={false} />
          </Router>
            </WebSocketProvider>
          </NotificationProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App; 