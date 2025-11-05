import React from 'react';
import { TaskSubmission } from '../../hooks/recruiter/useTaskSubmissions';
import AIScoreDisplay from './AIScoreDisplay';

interface TaskSubmissionCardProps {
  submission: TaskSubmission;
  onViewDetails: (submission: TaskSubmission) => void;
  onUpdateStatus: (submissionId: string, status: TaskSubmission['status']) => void;
  isSelected?: boolean;
  onSelect?: (submissionId: string) => void;
}

const TaskSubmissionCard: React.FC<TaskSubmissionCardProps> = ({
  submission,
  onViewDetails,
  onUpdateStatus,
  isSelected = false,
  onSelect
}) => {
  const getStatusColor = (status: TaskSubmission['status']) => {
    switch (status) {
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'submitted':
        return 'bg-blue-100 text-blue-800';
      case 'evaluated':
        return 'bg-purple-100 text-purple-800';
      case 'reviewed':
        return 'bg-indigo-100 text-indigo-800';
      case 'shortlisted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatTimeSpent = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={`bg-white rounded-lg border-2 transition-all duration-200 hover:shadow-md ${
      isSelected ? 'border-blue-500 shadow-md' : 'border-gray-200'
    }`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            {onSelect && (
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onSelect(submission._id)}
                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            )}
            
            {/* Candidate Info */}
            <div className="flex items-center space-x-3">
              {submission.candidate?.profile_picture ? (
                <img
                  src={submission.candidate.profile_picture}
                  alt={submission.candidate?.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                  <span className="text-gray-600 font-medium text-sm">
                    {submission.candidate?.name?.charAt(0) || '?'}
                  </span>
                </div>
              )}
              <div>
                <h3 className="font-medium text-gray-900">
                  {submission.candidate?.name || 'Unknown Candidate'}
                </h3>
                <p className="text-sm text-gray-500">{submission.candidate?.email}</p>
              </div>
            </div>
          </div>

          {/* Status Badge */}
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(submission.status)}`}>
            {submission.status.replace('_', ' ').toUpperCase()}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Job Info */}
        <div className="mb-3">
          <p className="text-sm font-medium text-gray-900">{submission.job?.title}</p>
          <p className="text-xs text-gray-500">{submission.job?.task.title}</p>
        </div>

        {/* AI Score Display */}
        {submission.ai_evaluation && (
          <div className="mb-3">
            <AIScoreDisplay 
              aiEvaluation={submission.ai_evaluation}
              size="small"
              showBreakdown={true}
              showFeedback={false}
              className="bg-gray-50"
            />
          </div>
        )}

        {/* Submission Details */}
        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
          <div>
            <span className="text-gray-500">Submitted:</span>
            <span className="ml-1 font-medium">
              {submission.submitted_at ? formatDate(submission.submitted_at) : 'In Progress'}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Time Spent:</span>
            <span className="ml-1 font-medium">{formatTimeSpent(submission.time_spent)}</span>
          </div>
          <div>
            <span className="text-gray-500">Type:</span>
            <span className="ml-1 font-medium capitalize">{submission.submission.type}</span>
          </div>
          {submission.submission.file_name && (
            <div>
              <span className="text-gray-500">File:</span>
              <span className="ml-1 font-medium">{submission.submission.file_name}</span>
            </div>
          )}
        </div>

        {/* Recruiter Review */}
        {submission.recruiter_review && (
          <div className="mb-3 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-gray-700">Recruiter Review</span>
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className={`w-4 h-4 ${
                      i < submission.recruiter_review!.rating ? 'text-yellow-400' : 'text-gray-300'
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
            </div>
            {submission.recruiter_review.notes && (
              <p className="text-xs text-gray-600">{submission.recruiter_review.notes}</p>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
        <button
          onClick={() => onViewDetails(submission)}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          View Details
        </button>

        <div className="flex items-center space-x-2">
          {submission.status === 'evaluated' && (
            <>
              <button
                onClick={() => onUpdateStatus(submission._id, 'shortlisted')}
                className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors"
              >
                Shortlist
              </button>
              <button
                onClick={() => onUpdateStatus(submission._id, 'rejected')}
                className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-full hover:bg-red-200 transition-colors"
              >
                Reject
              </button>
            </>
          )}
          
          {submission.status === 'reviewed' && (
            <span className="text-xs text-gray-500">Reviewed</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskSubmissionCard;