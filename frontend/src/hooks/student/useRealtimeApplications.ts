import { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useWebSocket, ApplicationStatusUpdate } from '../../context/WebSocketContext';
import { applicationKeys, StudentApplication } from './useApplications';
import { submissionKeys } from './useTaskSubmissions';
import { useNotifications } from '../../context/NotificationContext';

interface UseRealtimeApplicationsOptions {
  enabled?: boolean;
  onStatusUpdate?: (update: ApplicationStatusUpdate) => void;
}

export const useRealtimeApplications = ({
  enabled = true,
  onStatusUpdate
}: UseRealtimeApplicationsOptions = {}) => {
  const queryClient = useQueryClient();
  const { setOnApplicationStatusUpdate, isConnected } = useWebSocket();
  const { showSuccess, showInfo, showWarning } = useNotifications();

  const handleApplicationStatusUpdate = useCallback((update: ApplicationStatusUpdate) => {
    console.log('Received application status update:', update);

    // Update application cache
    queryClient.setQueriesData(
      { queryKey: applicationKeys.lists() },
      (oldData: any) => {
        if (!oldData?.applications) return oldData;

        const updatedApplications = oldData.applications.map((app: StudentApplication) => {
          if (app._id === update.application_id) {
            return {
              ...app,
              status: update.status,
              ai_evaluation: update.ai_evaluation || app.ai_evaluation,
              recruiter_review: update.recruiter_review || app.recruiter_review,
              updated_at: new Date().toISOString()
            };
          }
          return app;
        });

        return {
          ...oldData,
          applications: updatedApplications
        };
      }
    );

    // Update specific application detail cache
    queryClient.setQueriesData(
      { queryKey: applicationKeys.details() },
      (oldData: StudentApplication | undefined) => {
        if (!oldData || oldData._id !== update.application_id) return oldData;

        return {
          ...oldData,
          status: update.status,
          ai_evaluation: update.ai_evaluation || oldData.ai_evaluation,
          recruiter_review: update.recruiter_review || oldData.recruiter_review,
          updated_at: new Date().toISOString()
        };
      }
    );

    // Invalidate related queries to ensure fresh data
    queryClient.invalidateQueries({ queryKey: applicationKeys.summary() });
    queryClient.invalidateQueries({ queryKey: applicationKeys.recent() });

    // If there's an AI evaluation, invalidate submission queries
    if (update.ai_evaluation) {
      queryClient.invalidateQueries({ queryKey: submissionKeys.all });
    }

    // Show appropriate notification based on status
    if (update.status === 'evaluated' && update.ai_evaluation) {
      const score = update.ai_evaluation.overall_score;
      if (score >= 80) {
        showSuccess(
          `Great job! You scored ${score}/100 on your submission.`,
          'Evaluation Complete',
          8000
        );
      } else if (score >= 60) {
        showInfo(
          `Your submission has been evaluated. Score: ${score}/100`,
          'Evaluation Complete',
          8000
        );
      } else {
        showWarning(
          `Your submission scored ${score}/100. Review the feedback to improve.`,
          'Evaluation Complete',
          10000
        );
      }
    }

    if (update.status === 'reviewed' && update.recruiter_review) {
      const decision = update.recruiter_review.decision;
      if (decision === 'shortlist') {
        showSuccess(
          'Congratulations! You have been shortlisted by the recruiter.',
          'Application Shortlisted',
          10000
        );
      } else if (decision === 'reject') {
        showInfo(
          'Your application was not selected this time. Keep applying!',
          'Application Update',
          8000
        );
      }
    }

    // Call custom handler if provided
    if (onStatusUpdate) {
      onStatusUpdate(update);
    }
  }, [queryClient, showSuccess, showInfo, showWarning, onStatusUpdate]);

  // Register the handler with WebSocket context
  useEffect(() => {
    if (enabled) {
      setOnApplicationStatusUpdate(handleApplicationStatusUpdate);
    } else {
      setOnApplicationStatusUpdate(undefined);
    }

    return () => {
      setOnApplicationStatusUpdate(undefined);
    };
  }, [enabled, handleApplicationStatusUpdate, setOnApplicationStatusUpdate]);

  return {
    isConnected,
    isEnabled: enabled
  };
};

export default useRealtimeApplications;
