import React, { useEffect, useState } from 'react';
import TimeTracker from './TimeTracker';
import RealtimeStatusBanner from './RealtimeStatusBanner';
import { useRealtimeApplications } from '../../hooks/student/useRealtimeApplications';
import { useRealtimeNotifications } from '../../hooks/student/useRealtimeNotifications';
import { useOptimisticUpdates } from '../../hooks/student/useOptimisticUpdates';
import { useApplication } from '../../hooks/student/useApplications';
import { useTaskSubmission } from '../../hooks/student/useTaskSubmissions';
import { ApplicationStatusUpdate } from '../../context/WebSocketContext';
import { useNotifications } from '../../context/NotificationContext';

interface RealtimeTaskWorkspaceProps {
  applicationId: string;
  submissionId: string;
  jobTitle: string;
  children: React.ReactNode;
  className?: string;
}

const RealtimeTaskWorkspace: React.FC<RealtimeTaskWorkspaceProps> = ({
  applicationId,
  submissionId,
  jobTitle,
  children,
  className = ''
}) => {
  const { showSuccess, showInfo } = useNotifications();
  const [lastStatusUpdate, setLastStatusUpdate] = useState<ApplicationStatusUpdate | null>(null);
  
  // Fetch application and submission data
  const { data: application, isLoading: applicationLoading } = useApplication(applicationId);
  const { data: submission, isLoading: submissionLoading } = useTaskSubmission(submissionId);

  // Set up optimistic updates
  const { optimisticTimeUpdate } = useOptimisticUpdates();

  // Handle real-time application status updates
  const handleStatusUpdate = (update: ApplicationStatusUpdate) => {
    setLastStatusUpdate(update);
    
    // Show appropriate notification
    if (update.status === 'evaluated' && update.ai_evaluation) {
      showSuccess(
        `Your work on "${jobTitle}" has been evaluated!`,
        'Evaluation Complete'
      );
    } else if (update.status === 'reviewed' && update.recruiter_review) {
      if (update.recruiter_review.decision === 'shortlist') {
        showSuccess(
          `Great news! You've been shortlisted for "${jobTitle}"`,
          'Application Shortlisted'
        );
      }
    }
  };

  // Enable real-time features
  useRealtimeApplications({
    enabled: true,
    onStatusUpdate: handleStatusUpdate
  });

  useRealtimeNotifications({
    enabled: true,
    autoMarkAsRead: false
  });

  // Handle time tracking sync with optimistic updates
  const handleTimeSync = (timeSpent: number) => {
    // Optimistically update the UI before server confirms
    optimisticTimeUpdate(submissionId, applicationId, timeSpent);
  };

  if (applicationLoading || submissionLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      {/* Real-time connection status */}
      <div className="bg-white border-b border-gray-200 px-4 py-2">
        <div className="max-w-7xl mx-auto">
          <RealtimeStatusBanner showWhenConnected={false} />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main content area */}
          <div className="lg:col-span-3">
            {/* Task header */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    {jobTitle}
                  </h1>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Status: <span className="font-medium ml-1 capitalize">{application?.status}</span>
                    </span>
                    {submission?.time_spent && (
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {submission.time_spent} minutes tracked
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Show evaluation results if available */}
              {lastStatusUpdate?.ai_evaluation && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="text-sm font-semibold text-blue-900 mb-2">
                    Latest Evaluation Results
                  </h3>
                  <div className="flex items-center space-x-4">
                    <div className="text-3xl font-bold text-blue-600">
                      {lastStatusUpdate.ai_evaluation.overall_score}/100
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-blue-800">
                        {lastStatusUpdate.ai_evaluation.feedback}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Show recruiter review if available */}
              {lastStatusUpdate?.recruiter_review && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h3 className="text-sm font-semibold text-green-900 mb-2">
                    Recruiter Review
                  </h3>
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-sm font-medium text-green-800">
                      Decision:
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      lastStatusUpdate.recruiter_review.decision === 'shortlist'
                        ? 'bg-green-200 text-green-800'
                        : 'bg-gray-200 text-gray-800'
                    }`}>
                      {lastStatusUpdate.recruiter_review.decision}
                    </span>
                  </div>
                  {lastStatusUpdate.recruiter_review.notes && (
                    <p className="text-sm text-green-800">
                      {lastStatusUpdate.recruiter_review.notes}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Main workspace content */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              {children}
            </div>
          </div>

          {/* Sidebar with time tracker and info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Time Tracker */}
            <TimeTracker
              submissionId={submissionId}
              applicationId={applicationId}
              initialTimeSpent={submission?.time_spent || 0}
              showControls={true}
              onSync={handleTimeSync}
            />

            {/* Quick Stats */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                Quick Stats
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">Status</span>
                  <span className="text-xs font-medium text-gray-900 capitalize">
                    {application?.status}
                  </span>
                </div>
                {application?.progress && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">Progress</span>
                    <span className="text-xs font-medium text-gray-900">
                      {application.progress.completion_percentage}%
                    </span>
                  </div>
                )}
                {application?.ai_evaluation && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">AI Score</span>
                    <span className="text-xs font-medium text-gray-900">
                      {application.ai_evaluation.overall_score}/100
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Tips */}
            <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">
                💡 Tips
              </h3>
              <ul className="text-xs text-blue-800 space-y-2">
                <li>• Your time is tracked automatically</li>
                <li>• Save your work frequently</li>
                <li>• You'll get instant notifications when evaluated</li>
                <li>• Take breaks to maintain quality</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealtimeTaskWorkspace;
