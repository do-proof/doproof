import React from 'react';
import { TaskSubmission } from '../../hooks/student/useTaskSubmissions';

interface Job {
  _id: string;
  title: string;
  company: {
    name: string;
  };
}

interface SubmissionComparisonProps {
  submissions: TaskSubmission[];
  jobs: Record<string, Job>;
  onClose: () => void;
}

const SubmissionComparison: React.FC<SubmissionComparisonProps> = ({
  submissions,
  jobs,
  onClose
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTimeSpent = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'bg-blue-100 text-blue-800';
      case 'evaluated':
        return 'bg-green-100 text-green-800';
      case 'reviewed':
        return 'bg-purple-100 text-purple-800';
      case 'shortlisted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateTrend = () => {
    const scoresWithDates = submissions
      .filter(s => s.ai_evaluation?.overall_score)
      .map(s => ({
        score: s.ai_evaluation!.overall_score,
        date: new Date(s.submitted_at || s.started_at)
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    if (scoresWithDates.length < 2) return null;

    const firstScore = scoresWithDates[0].score;
    const lastScore = scoresWithDates[scoresWithDates.length - 1].score;
    return lastScore - firstScore;
  };

  const trend = calculateTrend();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full">
          {/* Header */}
          <div className="bg-white px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Submission Comparison ({submissions.length} submissions)
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Compare your performance across different submissions
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full p-1"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Performance Trend */}
          {trend !== null && (
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-700">Performance Trend:</span>
                  <div className={`flex items-center space-x-1 ${
                    trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {trend > 0 ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7H7" />
                      </svg>
                    ) : trend < 0 ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 7l-9.2 9.2M7 7v10h10" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                      </svg>
                    )}
                    <span className="font-medium">
                      {trend > 0 ? `+${trend.toFixed(1)}` : trend.toFixed(1)} points
                    </span>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  {trend > 0 ? 'Improving performance!' : 
                   trend < 0 ? 'Room for improvement' : 'Consistent performance'}
                </div>
              </div>
            </div>
          )}

          {/* Comparison Table */}
          <div className="bg-white px-6 py-6 max-h-96 overflow-y-auto">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Job & Company
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      AI Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time Spent
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Submitted
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Recruiter Rating
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {submissions.map((submission) => {
                    const job = jobs[submission.job_id];
                    return (
                      <tr key={submission._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {job?.title || 'Unknown Job'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {job?.company?.name || 'Unknown Company'}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(submission.status)}`}>
                            {submission.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {submission.ai_evaluation ? (
                            <div className="text-sm">
                              <div className={`font-medium ${getScoreColor(submission.ai_evaluation.overall_score)}`}>
                                {submission.ai_evaluation.overall_score}/100
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">Not evaluated</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatTimeSpent(submission.time_spent)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(submission.submitted_at || submission.started_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {submission.recruiter_review ? (
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
                              <span className="ml-1 text-sm text-gray-600">
                                ({submission.recruiter_review.rating}/5)
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">Not reviewed</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Skills Comparison */}
            {submissions.some(s => s.ai_evaluation?.criteria_scores) && (
              <div className="mt-8">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Skills Comparison</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Object.keys(submissions.find(s => s.ai_evaluation?.criteria_scores)?.ai_evaluation?.criteria_scores || {}).map((skill) => (
                    <div key={skill} className="bg-gray-50 rounded-lg p-4">
                      <h5 className="font-medium text-gray-900 mb-3 capitalize">
                        {skill.replace('_', ' ')}
                      </h5>
                      <div className="space-y-2">
                        {submissions.map((submission, index) => {
                          const score = submission.ai_evaluation?.criteria_scores?.[skill as keyof typeof submission.ai_evaluation.criteria_scores];
                          const job = jobs[submission.job_id];
                          return (
                            <div key={submission._id} className="flex items-center justify-between">
                              <span className="text-sm text-gray-600 truncate">
                                {job?.title?.substring(0, 20) || `Submission ${index + 1}`}
                              </span>
                              {score ? (
                                <div className="flex items-center space-x-2">
                                  <div className="w-16 bg-gray-200 rounded-full h-2">
                                    <div
                                      className={`h-2 rounded-full ${
                                        score >= 80 ? 'bg-green-500' :
                                        score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                      }`}
                                      style={{ width: `${score}%` }}
                                    ></div>
                                  </div>
                                  <span className={`text-sm font-medium ${getScoreColor(score)}`}>
                                    {score}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-sm text-gray-400">N/A</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Comparing {submissions.length} submissions • 
                Average Score: {submissions.filter(s => s.ai_evaluation?.overall_score).length > 0 
                  ? Math.round(submissions.filter(s => s.ai_evaluation?.overall_score).reduce((sum, s) => sum + s.ai_evaluation!.overall_score, 0) / submissions.filter(s => s.ai_evaluation?.overall_score).length)
                  : 'N/A'
                }
              </div>
              <button
                onClick={onClose}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubmissionComparison;