import React, { useState } from 'react';
import { JobRecommendation, useSubmitRecommendationFeedback } from '../../hooks/student/useRecommendations';
import { useEnrollInJob } from '../../hooks/student/useApplications';
import TaskDetailsModal from '../TaskDetailsModal';
import LoadingSpinner from '../LoadingSpinner';

interface RecommendationCardProps {
  recommendation: JobRecommendation;
  onFeedback?: (feedback: any) => void;
  compact?: boolean;
  showReasons?: boolean;
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({
  recommendation,
  onFeedback,
  compact = false,
  showReasons = true
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackComments, setFeedbackComments] = useState('');

  const submitFeedbackMutation = useSubmitRecommendationFeedback();
  const enrollMutation = useEnrollInJob();

  const { job, match_score, match_reasons, skill_gaps, similar_successful_profiles } = recommendation;

  // Get match score color
  const getMatchScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-blue-600 bg-blue-100';
    if (score >= 40) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  // Get difficulty color
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleEnroll = async () => {
    try {
      await enrollMutation.mutateAsync({
        jobId: job._id,
        coverLetter: `I'm interested in this recommended position: ${job.title}. Based on the recommendation system, this role aligns well with my skills and career goals.`
      });
      
      // Submit positive feedback for enrollment
      await submitFeedbackMutation.mutateAsync({
        recommendation_id: `${job._id}-${Date.now()}`,
        job_id: job._id,
        feedback_type: 'applied',
        rating: 5,
        comments: 'Applied to this recommended job'
      });
    } catch (error) {
      console.error('Error enrolling in job:', error);
    }
  };

  const handleFeedback = async (type: 'helpful' | 'not_helpful' | 'irrelevant') => {
    const rating = type === 'helpful' ? 5 : type === 'not_helpful' ? 2 : 1;
    
    try {
      await submitFeedbackMutation.mutateAsync({
        recommendation_id: `${job._id}-${Date.now()}`,
        job_id: job._id,
        feedback_type: type,
        rating,
        comments: feedbackComments
      });
      
      setShowFeedback(false);
      setFeedbackComments('');
      setFeedbackRating(0);
      
      if (onFeedback) {
        onFeedback({ type, rating, comments: feedbackComments });
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
    }
  };

  const handleDetailedFeedback = async () => {
    if (feedbackRating === 0) return;
    
    const type = feedbackRating >= 4 ? 'helpful' : feedbackRating >= 3 ? 'not_helpful' : 'irrelevant';
    
    try {
      await submitFeedbackMutation.mutateAsync({
        recommendation_id: `${job._id}-${Date.now()}`,
        job_id: job._id,
        feedback_type: type,
        rating: feedbackRating,
        comments: feedbackComments
      });
      
      setShowFeedback(false);
      setFeedbackComments('');
      setFeedbackRating(0);
      
      if (onFeedback) {
        onFeedback({ type, rating: feedbackRating, comments: feedbackComments });
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
    }
  };

  return (
    <>
      <div className={`bg-white border-2 border-blue-200 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 ${compact ? 'p-4' : 'p-6'} relative overflow-hidden`}>
        {/* Recommendation Badge */}
        <div className="absolute top-0 right-0 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 py-1 rounded-bl-lg text-xs font-medium">
          ⭐ Recommended
        </div>

        {/* Header */}
        <div className="flex items-start justify-between mb-4 mt-2">
          <div className="flex-1 min-w-0">
            <h3 className={`font-bold text-gray-900 truncate ${compact ? 'text-lg' : 'text-xl'}`}>
              {job.title}
            </h3>
            <p className={`text-gray-600 truncate ${compact ? 'text-sm' : 'text-base'}`}>
              Company ID: {job.company_id}
            </p>
            {job.location && (
              <p className="text-sm text-gray-500">
                📍 {job.location.type === 'remote' ? 'Remote' : `${job.location.city}, ${job.location.country}`}
              </p>
            )}
          </div>
          
          {/* Match Score */}
          <div className={`ml-4 px-3 py-2 rounded-full font-bold text-sm ${getMatchScoreColor(match_score)}`}>
            {match_score}% Match
          </div>
        </div>

        {/* Job Details */}
        <div className="mb-4">
          <p className={`text-gray-700 ${compact ? 'text-sm' : 'text-base'} ${compact ? 'line-clamp-2' : 'line-clamp-3'}`}>
            {job.description}
          </p>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {(() => {
            const getDifficultyFromTimeLimit = (timeLimit: number) => {
              if (timeLimit <= 60) return 'Easy';
              if (timeLimit <= 180) return 'Medium';
              return 'Hard';
            };
            const difficulty = getDifficultyFromTimeLimit(job.task.time_limit);
            return (
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(difficulty)}`}>
                {difficulty}
              </span>
            );
          })()}
          {job.employment_type && (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {job.employment_type}
            </span>
          )}
          {(() => {
            const calculateRewardPoints = (job: any) => {
              const basePoints = 100;
              const timeMultiplier = Math.floor(job.task.time_limit / 60);
              return basePoints + (timeMultiplier * 50);
            };
            const rewardPoints = calculateRewardPoints(job);
            return (
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                {rewardPoints} points
              </span>
            );
          })()}
        </div>

        {/* Match Reasons */}
        {showReasons && match_reasons.length > 0 && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Why this is recommended:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              {match_reasons.slice(0, compact ? 2 : 3).map((reason, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  {reason}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Skill Gaps */}
        {!compact && skill_gaps.length > 0 && (
          <div className="mb-4 p-3 bg-yellow-50 rounded-lg">
            <h4 className="text-sm font-medium text-yellow-900 mb-2">Skills to develop:</h4>
            <div className="flex flex-wrap gap-1">
              {skill_gaps.slice(0, 3).map((skill, index) => (
                <span key={index} className="px-2 py-1 bg-yellow-200 text-yellow-800 rounded text-xs">
                  {skill}
                </span>
              ))}
              {skill_gaps.length > 3 && (
                <span className="px-2 py-1 bg-yellow-200 text-yellow-800 rounded text-xs">
                  +{skill_gaps.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Success Indicator */}
        {similar_successful_profiles > 0 && (
          <div className="mb-4 text-sm text-gray-600">
            👥 {similar_successful_profiles} similar profiles succeeded in this role
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="flex space-x-2">
            <button
              onClick={() => setShowDetails(true)}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              View Details
            </button>
            <button
              onClick={handleEnroll}
              disabled={enrollMutation.isPending}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center"
            >
              {enrollMutation.isPending ? (
                <>
                  <LoadingSpinner size="sm" color="white" />
                  <span className="ml-1">Enrolling...</span>
                </>
              ) : (
                'Apply Now'
              )}
            </button>
          </div>

          {/* Feedback Buttons */}
          <div className="flex items-center space-x-1">
            <button
              onClick={() => handleFeedback('helpful')}
              disabled={submitFeedbackMutation.isPending}
              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              title="This recommendation is helpful"
            >
              👍
            </button>
            <button
              onClick={() => handleFeedback('not_helpful')}
              disabled={submitFeedbackMutation.isPending}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="This recommendation is not helpful"
            >
              👎
            </button>
            <button
              onClick={() => setShowFeedback(true)}
              className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
              title="Provide detailed feedback"
            >
              💬
            </button>
          </div>
        </div>
      </div>

      {/* Task Details Modal */}
      {showDetails && (
        <TaskDetailsModal
          job={job}
          onClose={() => setShowDetails(false)}
        />
      )}

      {/* Detailed Feedback Modal */}
      {showFeedback && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Feedback on Recommendation</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                How helpful was this recommendation?
              </label>
              <div className="flex space-x-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => setFeedbackRating(rating)}
                    className={`w-8 h-8 rounded-full border-2 transition-colors ${
                      feedbackRating >= rating
                        ? 'bg-yellow-400 border-yellow-400 text-white'
                        : 'border-gray-300 text-gray-400 hover:border-yellow-400'
                    }`}
                  >
                    ⭐
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional comments (optional)
              </label>
              <textarea
                value={feedbackComments}
                onChange={(e) => setFeedbackComments(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Tell us what you think about this recommendation..."
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowFeedback(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDetailedFeedback}
                disabled={feedbackRating === 0 || submitFeedbackMutation.isPending}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
              >
                {submitFeedbackMutation.isPending ? (
                  <>
                    <LoadingSpinner size="sm" color="white" />
                    <span className="ml-1">Submitting...</span>
                  </>
                ) : (
                  'Submit Feedback'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default RecommendationCard;