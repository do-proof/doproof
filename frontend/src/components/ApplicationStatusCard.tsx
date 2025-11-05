import React, { useState } from 'react';
import { StudentApplication } from '../hooks/student/useApplications';
import { Job } from '../hooks/student/useJobs';
import TaskSubmissionForm from './TaskSubmissionForm';
import LoadingSpinner from './LoadingSpinner';

interface ApplicationStatusCardProps {
  application: StudentApplication;
  job?: Job;
  compact?: boolean;
  tableView?: boolean;
}

const ApplicationStatusCard: React.FC<ApplicationStatusCardProps> = ({
  application,
  job,
  compact = false,
  tableView = false
}) => {
  const [showSubmissionForm, setShowSubmissionForm] = useState(false);

  if (!job) {
    return (
      <div className={`${tableView ? '' : 'p-4 border border-gray-200 rounded-lg'} bg-gray-50`}>
        <div className="flex items-center space-x-2">
          <LoadingSpinner size="sm" />
          <span className="text-sm text-gray-500">Loading job details...</span>
        </div>
      </div>
    );
  }

  // Calculate progress percentage
  const progressPercentage = application.progress?.completion_percentage || 0;
  
  // Format time spent
  const formatTimeSpent = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  // Get status color and label
  const getStatusConfig = (status: string) => {
    const configs = {
      enrolled: { color: 'bg-blue-100 text-blue-800', label: 'Enrolled' },
      in_progress: { color: 'bg-yellow-100 text-yellow-800', label: 'In Progress' },
      submitted: { color: 'bg-purple-100 text-purple-800', label: 'Submitted' },
      evaluated: { color: 'bg-indigo-100 text-indigo-800', label: 'AI Evaluated' },
      reviewed: { color: 'bg-orange-100 text-orange-800', label: 'Under Review' },
      shortlisted: { color: 'bg-green-100 text-green-800', label: 'Shortlisted' },
      rejected: { color: 'bg-red-100 text-red-800', label: 'Rejected' },
    };
    return configs[status as keyof typeof configs] || { color: 'bg-gray-100 text-gray-800', label: status };
  };

  const statusConfig = getStatusConfig(application.status);

  // Get action button based on status
  const getActionButton = () => {
    switch (application.status) {
      case 'enrolled':
      case 'in_progress':
        return (
          <button
            onClick={() => setShowSubmissionForm(true)}
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700"
          >
            {application.status === 'enrolled' ? 'Start Work' : 'Continue'}
          </button>
        );
      case 'submitted':
      case 'evaluated':
      case 'reviewed':
        return (
          <button
            onClick={() => setShowSubmissionForm(true)}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
          >
            View Submission
          </button>
        );
      default:
        return null;
    }
  };

  // Calculate days since application
  const daysSinceApplication = Math.floor(
    (new Date().getTime() - new Date(application.enrolled_at).getTime()) / (1000 * 60 * 60 * 24)
  );

  if (tableView) {
    return (
      <>
        <tr className="hover:bg-gray-50">
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="flex items-center">
              <div>
                <div className="text-sm font-medium text-gray-900">{job.title}</div>
                <div className="text-sm text-gray-500">Company ID: {job.company_id}</div>
              </div>
            </div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusConfig.color}`}>
              {statusConfig.label}
            </span>
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="flex items-center">
              <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
              <span className="text-sm text-gray-900">{progressPercentage}%</span>
            </div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
            {application.ai_evaluation?.overall_score ? (
              <span className="font-medium">{application.ai_evaluation.overall_score}/100</span>
            ) : (
              <span className="text-gray-400">-</span>
            )}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
            {daysSinceApplication === 0 ? 'Today' : `${daysSinceApplication} days ago`}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
            {getActionButton()}
          </td>
        </tr>
        
        {showSubmissionForm && (
          <TaskSubmissionForm
            job={job}
            onClose={() => setShowSubmissionForm(false)}
          />
        )}
      </>
    );
  }

  return (
    <>
      <div className={`bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow ${compact ? 'p-3' : 'p-4'}`}>
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className={`font-medium text-gray-900 truncate ${compact ? 'text-sm' : 'text-base'}`}>
              {job.title}
            </h3>
            <p className={`text-gray-500 truncate ${compact ? 'text-xs' : 'text-sm'}`}>
              Company ID: {job.company_id}
            </p>
          </div>
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusConfig.color}`}>
            {statusConfig.label}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="mb-3">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>Progress</span>
            <span>{progressPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>

        {/* Stats */}
        <div className={`grid grid-cols-2 gap-4 mb-3 ${compact ? 'text-xs' : 'text-sm'}`}>
          <div>
            <span className="text-gray-500">Time Spent:</span>
            <div className="font-medium text-gray-900">
              {application.time_spent ? formatTimeSpent(application.time_spent) : '0m'}
            </div>
          </div>
          <div>
            <span className="text-gray-500">Applied:</span>
            <div className="font-medium text-gray-900">
              {daysSinceApplication === 0 ? 'Today' : `${daysSinceApplication}d ago`}
            </div>
          </div>
        </div>

        {/* AI Evaluation (if available) */}
        {application.ai_evaluation && (
          <div className={`mb-3 p-2 bg-blue-50 rounded ${compact ? 'text-xs' : 'text-sm'}`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-blue-700 font-medium">AI Evaluation</span>
              <span className="text-blue-900 font-bold">
                {application.ai_evaluation.overall_score}/100
              </span>
            </div>
            {!compact && application.ai_evaluation.feedback && (
              <p className="text-blue-700 text-xs line-clamp-2">
                {application.ai_evaluation.feedback}
              </p>
            )}
          </div>
        )}

        {/* Recruiter Review (if available) */}
        {application.recruiter_review && (
          <div className={`mb-3 p-2 bg-purple-50 rounded ${compact ? 'text-xs' : 'text-sm'}`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-purple-700 font-medium">Recruiter Review</span>
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <span 
                    key={i} 
                    className={`text-xs ${i < application.recruiter_review!.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                  >
                    ⭐
                  </span>
                ))}
              </div>
            </div>
            {!compact && application.recruiter_review.notes && (
              <p className="text-purple-700 text-xs line-clamp-2">
                {application.recruiter_review.notes}
              </p>
            )}
          </div>
        )}

        {/* Deadline Warning */}
        {job.closing_date && (
          <div className={`mb-3 ${compact ? 'text-xs' : 'text-sm'}`}>
            {(() => {
              const deadline = new Date(job.closing_date);
              const now = new Date();
              const daysUntilDeadline = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
              
              if (daysUntilDeadline < 0) {
                return (
                  <div className="text-red-600 font-medium">
                    ⚠️ Deadline passed {Math.abs(daysUntilDeadline)} days ago
                  </div>
                );
              } else if (daysUntilDeadline <= 3) {
                return (
                  <div className="text-orange-600 font-medium">
                    ⏰ Due in {daysUntilDeadline} day{daysUntilDeadline !== 1 ? 's' : ''}
                  </div>
                );
              } else {
                return (
                  <div className="text-gray-600">
                    📅 Due in {daysUntilDeadline} days
                  </div>
                );
              }
            })()}
          </div>
        )}

        {/* Action Button */}
        <div className="flex justify-end">
          {getActionButton()}
        </div>
      </div>

      {/* Submission Form Modal */}
      {showSubmissionForm && (
        <TaskSubmissionForm
          job={job}
          onClose={() => setShowSubmissionForm(false)}
        />
      )}
    </>
  );
};

export default ApplicationStatusCard;