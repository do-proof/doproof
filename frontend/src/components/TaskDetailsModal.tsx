import React, { useState } from 'react';
import { Job, JobWithRecommendation } from '../hooks/student/useJobs';
import { useApplicationByJob } from '../hooks/student/useApplications';
import EnrollmentModal from './EnrollmentModal';
import LoadingSpinner from './LoadingSpinner';

interface TaskDetailsModalProps {
  job: Job | JobWithRecommendation;
  onClose: () => void;
  onEnroll?: (job: Job | JobWithRecommendation) => void;
}

const TaskDetailsModal: React.FC<TaskDetailsModalProps> = ({ job, onClose, onEnroll }) => {
  const [showEnrollmentModal, setShowEnrollmentModal] = useState(false);
  
  // Check if user has already applied to this job
  const { data: existingApplication, isLoading: applicationLoading } = useApplicationByJob(job._id);

  // Helper functions
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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

  const getDeadlineStatus = (closingDate?: string) => {
    if (!closingDate) return { status: 'open', color: 'text-green-600', text: 'Open Application' };
    
    const deadline = new Date(closingDate);
    const now = new Date();
    const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysLeft < 0) return { status: 'expired', color: 'text-red-600', text: 'Application Closed' };
    if (daysLeft <= 1) return { status: 'urgent', color: 'text-red-600', text: `Closes in ${daysLeft} day` };
    if (daysLeft <= 7) return { status: 'soon', color: 'text-orange-600', text: `Closes in ${daysLeft} days` };
    
    return { status: 'normal', color: 'text-gray-600', text: `Closes in ${daysLeft} days` };
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const difficulty = getDifficultyFromTimeLimit(job.task.time_limit);
  const rewardPoints = calculateRewardPoints(job);
  const deadlineStatus = getDeadlineStatus(job.closing_date);
  const hasApplied = !!existingApplication;

  const handleEnrollClick = () => {
    if (onEnroll) {
      onEnroll(job);
    } else {
      setShowEnrollmentModal(true);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">{job.title}</h2>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span>Company Name</span>
                  <span>•</span>
                  <span>{job.location.type === 'remote' ? 'Remote' : `${job.location.city}, ${job.location.country}`}</span>
                  <span>•</span>
                  <span className="capitalize">{job.employment_type.replace('-', ' ')}</span>
                </div>
                {'match_score' in job && job.match_score && (
                  <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    ✨ {job.match_score}% match with your skills
                  </div>
                )}
                {hasApplied && (
                  <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    ✓ Already Applied
                  </div>
                )}
              </div>
              <button 
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 text-2xl font-light ml-4"
              >
                ×
              </button>
            </div>
          </div>
          
          <div className="p-6 space-y-8">
            {/* Job Overview */}
            <div>
              <h3 className="text-xl font-semibold mb-4">Job Overview</h3>
              <p className="text-gray-700 leading-relaxed">{job.description}</p>
            </div>

            {/* Task Details */}
            <div>
              <h3 className="text-xl font-semibold mb-4">Task Details</h3>
              <div className="bg-blue-50 rounded-lg p-6 mb-4">
                <h4 className="text-lg font-medium text-blue-900 mb-2">{job.task.title}</h4>
                <p className="text-blue-800 mb-4">{job.task.description}</p>
                
                <div className="bg-white rounded-lg p-4">
                  <h5 className="font-medium text-gray-900 mb-2">Instructions:</h5>
                  <p className="text-gray-700 whitespace-pre-line">{job.task.instructions}</p>
                </div>
              </div>
            </div>

            {/* Key Information Grid */}
            <div>
              <h3 className="text-xl font-semibold mb-4">Key Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="text-sm text-gray-500 mb-1">Application Deadline</div>
                  <div className={`font-medium ${deadlineStatus.color}`}>
                    📅 {job.closing_date ? formatDate(job.closing_date) : 'Open'}
                  </div>
                  <div className={`text-xs ${deadlineStatus.color} mt-1`}>
                    {deadlineStatus.text}
                  </div>
                </div>
                
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="text-sm text-gray-500 mb-1">Estimated Reward</div>
                  <div className="font-medium text-green-600">🎯 {rewardPoints} points</div>
                  <div className="text-xs text-gray-500 mt-1">Based on complexity</div>
                </div>
                
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="text-sm text-gray-500 mb-1">Difficulty Level</div>
                  <div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(difficulty)}`}>
                      {difficulty}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Time: {formatTime(job.task.time_limit)}</div>
                </div>
                
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="text-sm text-gray-500 mb-1">Submission Format</div>
                  <div className="font-medium capitalize">{job.task.submission_format}</div>
                  {job.task.max_file_size && (
                    <div className="text-xs text-gray-500 mt-1">Max: {job.task.max_file_size}MB</div>
                  )}
                </div>
                
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="text-sm text-gray-500 mb-1">Time Limit</div>
                  <div className="font-medium">{formatTime(job.task.time_limit)}</div>
                  <div className="text-xs text-gray-500 mt-1">Maximum allowed</div>
                </div>
                
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="text-sm text-gray-500 mb-1">Job ID</div>
                  <div className="font-medium font-mono text-sm">#{job._id}</div>
                  <div className="text-xs text-gray-500 mt-1">Reference</div>
                </div>
              </div>
            </div>

            {/* Requirements */}
            {job.requirements && job.requirements.length > 0 && (
              <div>
                <h3 className="text-xl font-semibold mb-4">Requirements</h3>
                <ul className="list-disc pl-5 space-y-2 text-gray-700">
                  {job.requirements.map((requirement, index) => (
                    <li key={index}>{requirement}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Responsibilities */}
            {job.responsibilities && job.responsibilities.length > 0 && (
              <div>
                <h3 className="text-xl font-semibold mb-4">Responsibilities</h3>
                <ul className="list-disc pl-5 space-y-2 text-gray-700">
                  {job.responsibilities.map((responsibility, index) => (
                    <li key={index}>{responsibility}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Evaluation Criteria */}
            <div>
              <h3 className="text-xl font-semibold mb-4">Evaluation Criteria</h3>
              <div className="bg-gray-50 rounded-lg p-6">
                <p className="text-gray-600 mb-4">Your submission will be evaluated based on the following criteria:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Critical Thinking</span>
                    <span className="font-medium">{job.evaluation_criteria.critical_thinking}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Problem Solving</span>
                    <span className="font-medium">{job.evaluation_criteria.problem_solving}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Creativity</span>
                    <span className="font-medium">{job.evaluation_criteria.creativity}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Technical Skills</span>
                    <span className="font-medium">{job.evaluation_criteria.technical_skills}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Communication</span>
                    <span className="font-medium">{job.evaluation_criteria.communication}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Attention to Detail</span>
                    <span className="font-medium">{job.evaluation_criteria.attention_to_detail}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Salary Information */}
            <div>
              <h3 className="text-xl font-semibold mb-4">Compensation</h3>
              <div className="bg-green-50 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-green-800">
                      {job.salary.currency} {job.salary.min.toLocaleString()} - {job.salary.max.toLocaleString()}
                    </div>
                    <div className="text-green-600 text-sm">Annual salary range</div>
                  </div>
                  <div className="text-green-600">
                    💰
                  </div>
                </div>
              </div>
            </div>

            {/* Application Status or Action */}
            <div className="pt-6 border-t border-gray-200">
              {applicationLoading ? (
                <div className="flex items-center justify-center py-4">
                  <LoadingSpinner />
                  <span className="ml-2 text-gray-600">Checking application status...</span>
                </div>
              ) : hasApplied ? (
                <div className="text-center">
                  <div className="bg-blue-50 rounded-lg p-6 mb-4">
                    <div className="text-blue-800 font-medium mb-2">✓ You have already applied to this job</div>
                    <div className="text-blue-600 text-sm">
                      Status: {((existingApplication as any)?.status || '').replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                    </div>
                    {(existingApplication as any)?.progress && (
                      <div className="mt-3">
                        <div className="text-sm text-blue-600 mb-1">
                          Progress: {(existingApplication as any)?.progress?.completion_percentage || 0}%
                        </div>
                        <div className="w-full bg-blue-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${(existingApplication as any)?.progress?.completion_percentage || 0}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={onClose}
                    className="w-full bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors font-medium"
                  >
                    Close
                  </button>
                </div>
              ) : deadlineStatus.status === 'expired' ? (
                <div className="text-center">
                  <div className="bg-red-50 rounded-lg p-6 mb-4">
                    <div className="text-red-800 font-medium">⚠️ Application deadline has passed</div>
                    <div className="text-red-600 text-sm mt-1">This job is no longer accepting applications</div>
                  </div>
                  <button
                    onClick={onClose}
                    className="w-full bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors font-medium"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <div className="bg-blue-50 rounded-lg p-4 mb-4">
                    <div className="text-blue-800 text-sm">
                      Ready to take on this challenge? Click below to start your application process.
                    </div>
                  </div>
                  <button
                    onClick={handleEnrollClick}
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium text-center"
                  >
                    Apply for this Position
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

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
    </>
  );
};

export default TaskDetailsModal;