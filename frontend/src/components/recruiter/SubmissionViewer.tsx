import React, { useState } from 'react';
import { TaskSubmission } from '../../hooks/recruiter/useTaskSubmissions';

interface SubmissionViewerProps {
  submission: TaskSubmission;
  onClose: () => void;
  onUpdateStatus: (submissionId: string, status: TaskSubmission['status']) => void;
  onAddReview: (submissionId: string, review: {
    rating: number;
    notes: string;
    decision: 'shortlist' | 'reject' | 'pending';
  }) => void;
}

const SubmissionViewer: React.FC<SubmissionViewerProps> = ({
  submission,
  onClose,
  onUpdateStatus,
  onAddReview
}) => {
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewData, setReviewData] = useState({
    rating: 5,
    notes: '',
    decision: 'pending' as 'shortlist' | 'reject' | 'pending'
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTimeSpent = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours} hours ${mins} minutes`;
    }
    return `${mins} minutes`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const handleSubmitReview = () => {
    onAddReview(submission._id, reviewData);
    setShowReviewForm(false);
  };

  const renderSubmissionContent = () => {
    switch (submission.submission.type) {
      case 'text':
        return (
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Text Submission</h4>
            <div className="prose max-w-none">
              <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
                {submission.submission.content}
              </pre>
            </div>
          </div>
        );
      
      case 'code':
        return (
          <div className="bg-gray-900 rounded-lg p-4">
            <h4 className="font-medium text-white mb-2">Code Submission</h4>
            <pre className="text-sm text-green-400 overflow-x-auto">
              <code>{submission.submission.content}</code>
            </pre>
          </div>
        );
      
      case 'file':
      case 'presentation':
        return (
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">File Submission</h4>
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{submission.submission.file_name}</p>
                <p className="text-xs text-gray-500">
                  {submission.submission.file_size && 
                    `${(submission.submission.file_size / 1024 / 1024).toFixed(2)} MB`
                  }
                </p>
              </div>
              {submission.submission.file_url && (
                <a
                  href={submission.submission.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                >
                  Download
                </a>
              )}
            </div>
          </div>
        );
      
      default:
        return (
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-gray-500">No submission content available</p>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          {/* Header */}
          <div className="bg-white px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Task Submission Details</h3>
                <p className="text-sm text-gray-500">{submission.job?.title} - {submission.job?.task.title}</p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="bg-white px-6 py-4 max-h-96 overflow-y-auto">
            {/* Candidate Info */}
            <div className="mb-6">
              <h4 className="font-medium text-gray-900 mb-3">Candidate Information</h4>
              <div className="flex items-center space-x-4">
                {submission.candidate?.profile_picture ? (
                  <img
                    src={submission.candidate.profile_picture}
                    alt={submission.candidate.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center">
                    <span className="text-gray-600 font-medium">
                      {submission.candidate?.name?.charAt(0) || '?'}
                    </span>
                  </div>
                )}
                <div>
                  <p className="font-medium text-gray-900">{submission.candidate?.name}</p>
                  <p className="text-sm text-gray-500">{submission.candidate?.email}</p>
                </div>
              </div>
            </div>

            {/* Submission Metadata */}
            <div className="mb-6">
              <h4 className="font-medium text-gray-900 mb-3">Submission Details</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Started:</span>
                  <span className="ml-2 font-medium">{formatDate(submission.started_at)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Submitted:</span>
                  <span className="ml-2 font-medium">
                    {submission.submitted_at ? formatDate(submission.submitted_at) : 'In Progress'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Time Spent:</span>
                  <span className="ml-2 font-medium">{formatTimeSpent(submission.time_spent)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Time Limit:</span>
                  <span className="ml-2 font-medium">{submission.job?.task.time_limit} minutes</span>
                </div>
              </div>
            </div>

            {/* AI Evaluation */}
            {submission.ai_evaluation && (
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-3">AI Evaluation</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-lg font-medium text-gray-900">Overall Score</span>
                    <span className={`text-2xl font-bold ${getScoreColor(submission.ai_evaluation.overall_score)}`}>
                      {submission.ai_evaluation.overall_score}/100
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Critical Thinking:</span>
                        <span className="font-medium">{submission.ai_evaluation.criteria_scores.critical_thinking}/100</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Problem Solving:</span>
                        <span className="font-medium">{submission.ai_evaluation.criteria_scores.problem_solving}/100</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Creativity:</span>
                        <span className="font-medium">{submission.ai_evaluation.criteria_scores.creativity}/100</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Technical Skills:</span>
                        <span className="font-medium">{submission.ai_evaluation.criteria_scores.technical_skills}/100</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Communication:</span>
                        <span className="font-medium">{submission.ai_evaluation.criteria_scores.communication}/100</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Attention to Detail:</span>
                        <span className="font-medium">{submission.ai_evaluation.criteria_scores.attention_to_detail}/100</span>
                      </div>
                    </div>
                  </div>
                  
                  {submission.ai_evaluation.feedback && (
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">AI Feedback</h5>
                      <p className="text-sm text-gray-700">{submission.ai_evaluation.feedback}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Submission Content */}
            <div className="mb-6">
              <h4 className="font-medium text-gray-900 mb-3">Submission Content</h4>
              {renderSubmissionContent()}
            </div>

            {/* Recruiter Review */}
            {submission.recruiter_review && (
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-3">Recruiter Review</h4>
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">Rating</span>
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          className={`w-5 h-5 ${
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
                    <div>
                      <span className="font-medium text-gray-900">Notes:</span>
                      <p className="text-sm text-gray-700 mt-1">{submission.recruiter_review.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {submission.status === 'evaluated' && !submission.recruiter_review && (
                  <button
                    onClick={() => setShowReviewForm(!showReviewForm)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Add Review
                  </button>
                )}
                
                {submission.status === 'evaluated' && (
                  <>
                    <button
                      onClick={() => onUpdateStatus(submission._id, 'shortlisted')}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                    >
                      Shortlist
                    </button>
                    <button
                      onClick={() => onUpdateStatus(submission._id, 'rejected')}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Reject
                    </button>
                  </>
                )}
              </div>
              
              <button
                onClick={onClose}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Close
              </button>
            </div>

            {/* Review Form */}
            {showReviewForm && (
              <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
                <h5 className="font-medium text-gray-900 mb-3">Add Your Review</h5>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                    <div className="flex items-center space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewData({ ...reviewData, rating: star })}
                          className={`w-6 h-6 ${
                            star <= reviewData.rating ? 'text-yellow-400' : 'text-gray-300'
                          }`}
                        >
                          <svg fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea
                      value={reviewData.notes}
                      onChange={(e) => setReviewData({ ...reviewData, notes: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Add your review notes..."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Decision</label>
                    <select
                      value={reviewData.decision}
                      onChange={(e) => setReviewData({ ...reviewData, decision: e.target.value as 'shortlist' | 'reject' | 'pending' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="pending">Pending</option>
                      <option value="shortlist">Shortlist</option>
                      <option value="reject">Reject</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={handleSubmitReview}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      Submit Review
                    </button>
                    <button
                      onClick={() => setShowReviewForm(false)}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubmissionViewer;