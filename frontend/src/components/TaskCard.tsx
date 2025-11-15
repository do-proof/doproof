import React, { useState } from 'react';
import { Job, JobWithRecommendation } from '../hooks/student/useJobs';
import { useApplicationByJob } from '../hooks/student/useApplications';
import EnrollmentModal from './EnrollmentModal';

export interface TaskCardProps {
  job: Job | JobWithRecommendation;
  isRecommended?: boolean;
  showMatchScore?: boolean;
  onViewDetails: (job: Job | JobWithRecommendation) => void;
  onEnroll?: (job: Job | JobWithRecommendation) => void;
  className?: string;
}

// Helper functions
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const calculateRewardPoints = (job: Job | JobWithRecommendation) => {
  const basePoints = 100;
  const timeMultiplier = Math.floor(job.task.time_limit / 60);
  const difficultyMultiplier = job.task.submission_format === 'code' ? 1.5 : 1.2;
  return Math.round(basePoints * timeMultiplier * difficultyMultiplier);
};

const getDifficultyFromTimeLimit = (timeLimit: number) => {
  if (timeLimit <= 60) return 'Easy';
  if (timeLimit <= 180) return 'Medium';
  return 'Hard';
};

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case 'Easy': return 'text-green-600 bg-green-100';
    case 'Medium': return 'text-yellow-600 bg-yellow-100';
    case 'Hard': return 'text-red-600 bg-red-100';
    default: return 'text-gray-600 bg-gray-100';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'enrolled': return 'text-blue-600 bg-blue-100';
    case 'in_progress': return 'text-orange-600 bg-orange-100';
    case 'submitted': return 'text-purple-600 bg-purple-100';
    case 'evaluated': return 'text-indigo-600 bg-indigo-100';
    case 'reviewed': return 'text-indigo-600 bg-indigo-100';
    case 'shortlisted': return 'text-green-600 bg-green-100';
    case 'rejected': return 'text-red-600 bg-red-100';
    default: return 'text-gray-600 bg-gray-100';
  }
};

const getDeadlineStatus = (closingDate?: string) => {
  if (!closingDate) return { status: 'open', color: 'text-green-600', text: 'Open' };
  
  const deadline = new Date(closingDate);
  const now = new Date();
  const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysLeft < 0) return { status: 'expired', color: 'text-red-600', text: 'Expired' };
  if (daysLeft <= 1) return { status: 'urgent', color: 'text-red-600', text: `${daysLeft} day left` };
  if (daysLeft <= 7) return { status: 'soon', color: 'text-orange-600', text: `${daysLeft} days left` };
  
  return { status: 'normal', color: 'text-gray-600', text: `${daysLeft} days left` };
};

const TaskCard: React.FC<TaskCardProps> = ({
  job,
  isRecommended = false,
  showMatchScore = false,
  onViewDetails,
  onEnroll,
  className = ''
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showEnrollmentModal, setShowEnrollmentModal] = useState(false);
  
  // Check if user has already applied to this job
  const { data: existingApplication, isLoading: applicationLoading } = useApplicationByJob(job._id);
  
  const difficulty = getDifficultyFromTimeLimit(job.task.time_limit);
  const rewardPoints = calculateRewardPoints(job);
  const deadlineStatus = getDeadlineStatus(job.closing_date);
  const hasApplied = !!existingApplication;
  
  // Determine the primary action based on application status
  const getPrimaryAction = () => {
    if (applicationLoading) {
      return { text: 'Loading...', disabled: true, onClick: () => {} };
    }
    
    if (hasApplied) {
      const status = (existingApplication as any)?.status;
      switch (status) {
        case 'enrolled':
          return { text: 'Continue Task', disabled: false, onClick: () => onViewDetails(job) };
        case 'in_progress':
          return { text: 'Continue Work', disabled: false, onClick: () => onViewDetails(job) };
        case 'submitted':
          return { text: 'View Submission', disabled: false, onClick: () => onViewDetails(job) };
        case 'completed':
          return { text: 'View Results', disabled: false, onClick: () => onViewDetails(job) };
        default:
          return { text: 'View Application', disabled: false, onClick: () => onViewDetails(job) };
      }
    }
    
    if (deadlineStatus.status === 'expired') {
      return { text: 'Expired', disabled: true, onClick: () => {} };
    }
    
    return { 
      text: 'View Details', 
      disabled: false, 
      onClick: () => onViewDetails(job) 
    };
  };

  const primaryAction = getPrimaryAction();

  const cardId = `task-card-${job._id}`;
  
  return (
    <article 
      id={cardId}
      className={`
        relative bg-white border border-gray-200 rounded-lg p-4 sm:p-6 
        transition-all duration-300
        ${isHovered ? 'shadow-xl -translate-y-1 border-blue-300' : 'shadow-md hover:shadow-lg'}
        ${hasApplied ? 'ring-2 ring-blue-100' : ''}
        ${className}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="article"
      aria-labelledby={`${cardId}-title`}
      aria-describedby={`${cardId}-description`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 gap-2">
        <div className="flex-1 min-w-0">
          <h3 id={`${cardId}-title`} className="text-base sm:text-lg font-semibold text-gray-900 truncate">
            {job.title}
          </h3>
          <p className="text-xs sm:text-sm text-gray-600 mt-1" aria-label="Job location">
            <span className="sr-only">Company location: </span>
            {job.location.type === 'remote' ? 'Remote' : `${job.location.city}, ${job.location.country}`}
          </p>
        </div>
        
        <div className="flex flex-col items-end space-y-2 ml-4">
          {/* Match Score (for recommendations) */}
          {showMatchScore && 'match_score' in job && job.match_score && (
            <div className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">
              {job.match_score}% match
            </div>
          )}
          
          {/* Application Status */}
          {hasApplied && existingApplication && (
            <div className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusColor((existingApplication as any)?.status)}`}>
              {((existingApplication as any)?.status || '').replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
            </div>
          )}
          
          {/* Recommended Badge */}
          {isRecommended && (
            <div className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
              Recommended
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      <p id={`${cardId}-description`} className="text-gray-600 text-sm mb-4 line-clamp-2">
        {job.description}
      </p>

      {/* Task Info */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Task:</span>
          <span className="font-medium text-gray-900">{job.task.title}</span>
        </div>
        <div className="flex items-center justify-between text-sm mt-1">
          <span className="text-gray-600">Format:</span>
          <span className="font-medium text-gray-900 capitalize">{job.task.submission_format}</span>
        </div>
        <div className="flex items-center justify-between text-sm mt-1">
          <span className="text-gray-600">Time Limit:</span>
          <span className="font-medium text-gray-900">{job.task.time_limit} minutes</span>
        </div>
      </div>

      {/* Progress Bar (for applied jobs) */}
      {hasApplied && existingApplication && (existingApplication as any)?.progress && (
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Progress</span>
            <span>{(existingApplication as any)?.progress?.completion_percentage || 0}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(existingApplication as any)?.progress?.completion_percentage || 0}%` }}
            />
          </div>
        </div>
      )}

      {/* AI Evaluation (for completed submissions) */}
      {hasApplied && (existingApplication as any)?.evaluation && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">AI Score</span>
            <span className="text-lg font-bold text-blue-600">
              {(existingApplication as any)?.evaluation?.ai_score || 0}/100
            </span>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-4 border-t border-gray-100 gap-3">
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500">
          <div className="flex items-center space-x-1" aria-label={`Deadline: ${deadlineStatus.text}`}>
            <span aria-hidden="true">📅</span>
            <span className={deadlineStatus.color}>
              {deadlineStatus.text}
            </span>
          </div>
          <div className="flex items-center space-x-1" aria-label={`Reward points: ${rewardPoints}`}>
            <span aria-hidden="true">🎯</span>
            <span>{rewardPoints} pts</span>
          </div>
          <span 
            className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(difficulty)}`}
            aria-label={`Difficulty: ${difficulty}`}
          >
            {difficulty}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {/* Primary Action Button */}
          <button
            onClick={() => onViewDetails(job)}
            className={`
              flex-1 sm:flex-initial px-4 py-2 sm:px-6 sm:py-2.5
              text-sm font-medium rounded-lg
              min-h-[44px] min-w-[44px]
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              ${primaryAction.disabled 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
              }
            `}
            disabled={primaryAction.disabled}
            aria-label={`${primaryAction.text} for ${job.title}`}
          >
            {primaryAction.text}
          </button>
          
          {/* Secondary Action - Enroll (if not applied and not expired) */}
          {!hasApplied && deadlineStatus.status !== 'expired' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowEnrollmentModal(true);
              }}
              className="min-h-[44px] min-w-[44px] px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg border border-blue-600 hover:bg-blue-50 transition-colors"
              aria-label={`Enroll in ${job.title}`}
            >
              <span className="sr-only sm:not-sr-only">Enroll</span>
              <span className="sm:sr-only" aria-hidden="true">+</span>
            </button>
          )}
        </div>
      </div>

      {/* Deadline Warning Overlay */}
      {deadlineStatus.status === 'urgent' && (
        <div className="absolute top-2 right-2">
          <div className="bg-red-100 text-red-600 text-xs font-medium px-2 py-1 rounded-full animate-pulse">
            ⚠️ Urgent
          </div>
        </div>
      )}

      {/* Applied Indicator */}
      {hasApplied && (
        <div className="absolute top-2 left-2">
          <div className="bg-blue-100 text-blue-600 text-xs font-medium px-2 py-1 rounded-full">
            ✓ Applied
          </div>
        </div>
      )}

      {/* Enrollment Modal */}
      <EnrollmentModal
        job={job}
        isOpen={showEnrollmentModal}
        onClose={() => setShowEnrollmentModal(false)}
        onSuccess={() => {
          setShowEnrollmentModal(false);
          // The useApplicationByJob hook will automatically refetch and update the UI
        }}
      />
    </div>
  );
};

export default TaskCard;