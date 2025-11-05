import React, { useState } from 'react';
import { TaskSubmission } from '../../hooks/recruiter/useTaskSubmissions';

interface EvaluationHistoryProps {
  submission: TaskSubmission;
  className?: string;
}

interface EvaluationEvent {
  id: string;
  type: 'ai_evaluation' | 'recruiter_review' | 'status_change' | 'score_update';
  timestamp: string;
  actor: string;
  details: any;
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
}

const EvaluationHistory: React.FC<EvaluationHistoryProps> = ({
  submission,
  className = ''
}) => {
  const [showDetails, setShowDetails] = useState<string | null>(null);

  // Generate evaluation history from submission data
  const generateHistory = (): EvaluationEvent[] => {
    const events: EvaluationEvent[] = [];

    // Submission created
    events.push({
      id: 'submission_created',
      type: 'status_change',
      timestamp: submission.started_at,
      actor: submission.candidate?.name || 'Candidate',
      details: {
        action: 'Started task submission',
        status: 'in_progress'
      }
    });

    // Submission completed
    if (submission.submitted_at) {
      events.push({
        id: 'submission_completed',
        type: 'status_change',
        timestamp: submission.submitted_at,
        actor: submission.candidate?.name || 'Candidate',
        details: {
          action: 'Completed task submission',
          status: 'submitted',
          timeSpent: submission.time_spent
        }
      });
    }

    // AI Evaluation
    if (submission.ai_evaluation) {
      events.push({
        id: 'ai_evaluation',
        type: 'ai_evaluation',
        timestamp: submission.ai_evaluation.evaluated_at,
        actor: `AI Agent (${submission.ai_evaluation.evaluation_model})`,
        details: {
          action: 'AI evaluation completed',
          overallScore: submission.ai_evaluation.overall_score,
          criteriaScores: submission.ai_evaluation.criteria_scores,
          feedback: submission.ai_evaluation.feedback
        }
      });
    }

    // Recruiter Review
    if (submission.recruiter_review) {
      events.push({
        id: 'recruiter_review',
        type: 'recruiter_review',
        timestamp: submission.recruiter_review.reviewed_at,
        actor: submission.recruiter_review.reviewed_by,
        details: {
          action: 'Recruiter review added',
          rating: submission.recruiter_review.rating,
          decision: submission.recruiter_review.decision,
          notes: submission.recruiter_review.notes
        }
      });
    }

    // Status changes (inferred from current status)
    if (submission.status === 'shortlisted' || submission.status === 'rejected') {
      events.push({
        id: 'final_decision',
        type: 'status_change',
        timestamp: submission.updated_at,
        actor: 'Recruiter',
        details: {
          action: `Candidate ${submission.status}`,
          status: submission.status
        }
      });
    }

    return events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  };

  const history = generateHistory();

  const getEventIcon = (type: EvaluationEvent['type']) => {
    switch (type) {
      case 'ai_evaluation':
        return '🤖';
      case 'recruiter_review':
        return '👤';
      case 'status_change':
        return '📝';
      case 'score_update':
        return '📊';
      default:
        return '📋';
    }
  };

  const getEventColor = (type: EvaluationEvent['type']) => {
    switch (type) {
      case 'ai_evaluation':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'recruiter_review':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'status_change':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'score_update':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      })
    };
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const renderEventDetails = (event: EvaluationEvent) => {
    switch (event.type) {
      case 'ai_evaluation':
        return (
          <div className="mt-2 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Overall Score:</span>
              <span className={`font-bold ${getScoreColor(event.details.overallScore)}`}>
                {event.details.overallScore}/100
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {Object.entries(event.details.criteriaScores).map(([key, score]) => (
                <div key={key} className="flex justify-between">
                  <span className="text-gray-600 capitalize">
                    {key.replace('_', ' ')}:
                  </span>
                  <span className={`font-medium ${getScoreColor(score as number)}`}>
                    {(score as number).toFixed(1)}
                  </span>
                </div>
              ))}
            </div>
            {event.details.feedback && (
              <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-700">
                <strong>AI Feedback:</strong> {event.details.feedback}
              </div>
            )}
          </div>
        );

      case 'recruiter_review':
        return (
          <div className="mt-2 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Rating:</span>
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className={`w-4 h-4 ${
                      i < event.details.rating ? 'text-yellow-400' : 'text-gray-300'
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Decision:</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                event.details.decision === 'shortlist' 
                  ? 'bg-green-100 text-green-800'
                  : event.details.decision === 'reject'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {event.details.decision}
              </span>
            </div>
            {event.details.notes && (
              <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-700">
                <strong>Notes:</strong> {event.details.notes}
              </div>
            )}
          </div>
        );

      case 'status_change':
        return (
          <div className="mt-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Status:</span>
              <span className="font-medium capitalize">
                {event.details.status?.replace('_', ' ')}
              </span>
            </div>
            {event.details.timeSpent && (
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="text-gray-600">Time Spent:</span>
                <span className="font-medium">
                  {Math.floor(event.details.timeSpent / 60)}h {event.details.timeSpent % 60}m
                </span>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  if (history.length === 0) {
    return (
      <div className={`text-center text-gray-500 p-4 ${className}`}>
        <div className="text-sm">No evaluation history available</div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      <div className="p-4 border-b border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900">Evaluation History & Audit Trail</h3>
        <p className="text-sm text-gray-600 mt-1">
          Complete timeline of evaluation events and status changes
        </p>
      </div>

      <div className="p-4">
        <div className="space-y-4">
          {history.map((event, index) => {
            const { date, time } = formatTimestamp(event.timestamp);
            const isExpanded = showDetails === event.id;
            
            return (
              <div key={event.id} className="relative">
                {/* Timeline line */}
                {index < history.length - 1 && (
                  <div className="absolute left-6 top-12 w-0.5 h-8 bg-gray-200" />
                )}
                
                <div className={`border rounded-lg p-4 ${getEventColor(event.type)}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white flex items-center justify-center text-lg">
                        {getEventIcon(event.type)}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium text-gray-900">
                            {event.details.action}
                          </h4>
                          <span className="text-xs text-gray-500">
                            by {event.actor}
                          </span>
                        </div>
                        
                        <div className="text-xs text-gray-600 mt-1">
                          {date} at {time}
                        </div>

                        {/* Event details */}
                        {isExpanded && renderEventDetails(event)}
                      </div>
                    </div>

                    {/* Expand/Collapse button */}
                    <button
                      onClick={() => setShowDetails(isExpanded ? null : event.id)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <svg
                        className={`w-5 h-5 transform transition-transform ${
                          isExpanded ? 'rotate-180' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Evaluation Summary</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Total Events:</span>
              <span className="ml-2 font-medium">{history.length}</span>
            </div>
            <div>
              <span className="text-gray-600">Current Status:</span>
              <span className="ml-2 font-medium capitalize">
                {submission.status.replace('_', ' ')}
              </span>
            </div>
            <div>
              <span className="text-gray-600">AI Score:</span>
              <span className={`ml-2 font-medium ${getScoreColor(submission.ai_evaluation?.overall_score || 0)}`}>
                {submission.ai_evaluation?.overall_score || 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Time Spent:</span>
              <span className="ml-2 font-medium">
                {Math.floor(submission.time_spent / 60)}h {submission.time_spent % 60}m
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EvaluationHistory;