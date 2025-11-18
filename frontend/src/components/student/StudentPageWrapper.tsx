import React, { Suspense } from 'react';
import StudentErrorBoundary from './StudentErrorBoundary';
import { ApplicationsPageSkeleton, RecommendationsPageSkeleton, AnalyticsPageSkeleton, ProfilePageSkeleton, SubmissionHistoryPageSkeleton } from './StudentPageSkeletons';

interface StudentPageWrapperProps {
  children: React.ReactNode;
  pageTitle: string;
  skeletonType?: 'applications' | 'recommendations' | 'analytics' | 'profile' | 'history' | 'default';
}

const StudentPageWrapper: React.FC<StudentPageWrapperProps> = ({ 
  children, 
  pageTitle,
  skeletonType = 'default'
}) => {
  const getSkeleton = () => {
    switch (skeletonType) {
      case 'applications':
        return <ApplicationsPageSkeleton />;
      case 'recommendations':
        return <RecommendationsPageSkeleton />;
      case 'analytics':
        return <AnalyticsPageSkeleton />;
      case 'profile':
        return <ProfilePageSkeleton />;
      case 'history':
        return <SubmissionHistoryPageSkeleton />;
      default:
        return (
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading {pageTitle}...</p>
            </div>
          </div>
        );
    }
  };

  return (
    <StudentErrorBoundary pageTitle={pageTitle}>
      <Suspense fallback={getSkeleton()}>
        {children}
      </Suspense>
    </StudentErrorBoundary>
  );
};

export default StudentPageWrapper;
