import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import ErrorBoundary from './components/ErrorBoundary';
import NotificationContainer from './components/NotificationContainer';
import RecruiterErrorBoundary from './components/recruiter/RecruiterErrorBoundary';
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

// Student Pages
import MyApplications from './pages/student/MyApplications';
import Recommendations from './pages/student/Recommendations';
import StudentAnalytics from './pages/student/StudentAnalytics';
import StudentProfile from './pages/student/StudentProfile';
import SubmissionHistory from './pages/student/SubmissionHistory';

// Recruiter Pages
import JobPostings from './pages/recruiter/JobPostings';
import JobForm from './pages/recruiter/JobForm';
import TaskSubmissions from './pages/recruiter/TaskSubmissions';
import CandidateSearch from './pages/recruiter/CandidateSearch';
import Interviews from './pages/recruiter/Interviews';
import Analytics from './pages/recruiter/Analytics';
import CompanyProfile from './pages/recruiter/CompanyProfile';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors except 429
        if (error?.status >= 400 && error?.status < 500 && error?.status !== 429) {
          return false;
        }
        return failureCount < 3;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
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
            <Router>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route 
                path="/student-dashboard" 
                element={
                  <ProtectedRoute requiredUserType="student">
                    <StudentDashboard />
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
              
              {/* Student Pages */}
              <Route 
                path="/student/applications" 
                element={
                  <ProtectedRoute requiredUserType="student">
                    <MyApplications />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/student/recommendations" 
                element={
                  <ProtectedRoute requiredUserType="student">
                    <Recommendations />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/student/analytics" 
                element={
                  <ProtectedRoute requiredUserType="student">
                    <StudentAnalytics />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/student/profile" 
                element={
                  <ProtectedRoute requiredUserType="student">
                    <StudentProfile />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/student/history" 
                element={
                  <ProtectedRoute requiredUserType="student">
                    <SubmissionHistory />
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
        </NotificationProvider>
      </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App; 