import React, { useState } from 'react';
import { Job, JobWithRecommendation } from '../hooks/student/useJobs';
import { useEnrollInJob } from '../hooks/student/useApplications';
import LoadingSpinner from './LoadingSpinner';

interface EnrollmentModalProps {
  job: Job | JobWithRecommendation;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const EnrollmentModal: React.FC<EnrollmentModalProps> = ({
  job,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [coverLetter, setCoverLetter] = useState('');
  const [expectedTime, setExpectedTime] = useState<number>(job.task.time_limit);
  const [showCoverLetter, setShowCoverLetter] = useState(false);
  
  const enrollMutation = useEnrollInJob();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await enrollMutation.mutateAsync({
        jobId: job._id,
        coverLetter: coverLetter.trim() || undefined,
        expectedCompletionTime: expectedTime
      });
      
      onSuccess?.();
      onClose();
    } catch (error) {
      // Error is handled by the mutation's onError callback
    }
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getDifficultyFromTimeLimit = (timeLimit: number) => {
    if (timeLimit <= 60) return { level: 'Easy', color: 'text-green-600 bg-green-100' };
    if (timeLimit <= 180) return { level: 'Medium', color: 'text-yellow-600 bg-yellow-100' };
    return { level: 'Hard', color: 'text-red-600 bg-red-100' };
  };

  const difficulty = getDifficultyFromTimeLimit(job.task.time_limit);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Enroll in Task</h2>
              <p className="text-gray-600 mt-1">{job.title}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-light"
              disabled={enrollMutation.isPending}
            >
              ×
            </button>
          </div>
        </div>

        {/* Job Summary */}
        <div className="p-6 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Task Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Task:</span>
                  <span className="font-medium">{job.task.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Time Limit:</span>
                  <span className="font-medium">{formatTime(job.task.time_limit)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Format:</span>
                  <span className="font-medium capitalize">{job.task.submission_format}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Difficulty:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${difficulty.color}`}>
                    {difficulty.level}
                  </span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Job Information</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Location:</span>
                  <span className="font-medium">
                    {job.location.type === 'remote' ? 'Remote' : `${job.location.city}, ${job.location.country}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Type:</span>
                  <span className="font-medium capitalize">{job.employment_type.replace('-', ' ')}</span>
                </div>
                {job.closing_date && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Deadline:</span>
                    <span className="font-medium">
                      {new Date(job.closing_date).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {'match_score' in job && job.match_score && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Match:</span>
                    <span className="font-medium text-green-600">{job.match_score}%</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Enrollment Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Expected Completion Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Expected Completion Time
            </label>
            <div className="flex items-center space-x-4">
              <input
                type="range"
                min={Math.floor(job.task.time_limit * 0.5)}
                max={Math.floor(job.task.time_limit * 1.5)}
                value={expectedTime}
                onChange={(e) => setExpectedTime(Number(e.target.value))}
                className="flex-1"
              />
              <div className="text-sm font-medium text-gray-900 min-w-[60px]">
                {formatTime(expectedTime)}
              </div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>{formatTime(Math.floor(job.task.time_limit * 0.5))}</span>
              <span>Recommended: {formatTime(job.task.time_limit)}</span>
              <span>{formatTime(Math.floor(job.task.time_limit * 1.5))}</span>
            </div>
          </div>

          {/* Cover Letter Toggle */}
          <div>
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">
                Cover Letter (Optional)
              </label>
              <button
                type="button"
                onClick={() => setShowCoverLetter(!showCoverLetter)}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                {showCoverLetter ? 'Hide' : 'Add Cover Letter'}
              </button>
            </div>
            
            {showCoverLetter && (
              <div className="mt-2">
                <textarea
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Tell the recruiter why you're interested in this position and what makes you a good fit..."
                  maxLength={2000}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Optional but recommended</span>
                  <span>{coverLetter.length}/2000</span>
                </div>
              </div>
            )}
          </div>

          {/* Task Instructions Preview */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Task Instructions</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-700">{job.task.instructions}</p>
            </div>
          </div>

          {/* Requirements */}
          {job.requirements && job.requirements.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Requirements</h3>
              <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                {job.requirements.map((requirement, index) => (
                  <li key={index}>{requirement}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Submission Guidelines */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-900 mb-2">📋 What happens next?</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• You'll have access to the full task details and requirements</li>
              <li>• Your progress will be automatically tracked</li>
              <li>• Submit your work before the time limit expires</li>
              <li>• Receive AI-powered feedback and evaluation</li>
              <li>• Get notified of recruiter decisions</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={enrollMutation.isPending}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={enrollMutation.isPending}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {enrollMutation.isPending ? (
                <>
                  <LoadingSpinner />
                  <span>Enrolling...</span>
                </>
              ) : (
                <span>Enroll in Task</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EnrollmentModal;