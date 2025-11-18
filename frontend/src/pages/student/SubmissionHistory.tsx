import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMySubmissions } from '../../hooks/student/useTaskSubmissions';
import { useJobs } from '../../hooks/student/useJobs';
import SubmissionViewer from '../../components/student/SubmissionViewer';
import SubmissionComparison from '../../components/student/SubmissionComparison';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import { SubmissionHistoryPageSkeleton } from '../../components/student/StudentPageSkeletons';
import { TaskSubmission } from '../../hooks/student/useTaskSubmissions';

interface SubmissionFilters {
  status?: string;
  job_id?: string;
  date_range?: 'week' | 'month' | 'quarter' | 'year' | 'all';
  sort_by?: 'date' | 'score' | 'status';
  sort_order?: 'asc' | 'desc';
}

const SubmissionHistory: React.FC = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<SubmissionFilters>({
    date_range: 'all',
    sort_by: 'date',
    sort_order: 'desc'
  });
  const [selectedSubmission, setSelectedSubmission] = useState<TaskSubmission | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [comparisonSubmissions, setComparisonSubmissions] = useState<string[]>([]);
  const [showComparisonModal, setShowComparisonModal] = useState(false);

  const {
    data: submissions = [],
    isLoading: submissionsLoading,
    error: submissionsError,
    refetch: refetchSubmissions
  } = useMySubmissions();

  const {
    data: jobsData,
    isLoading: jobsLoading
  } = useJobs({}); // Get jobs for filtering

  const jobs = jobsData?.jobs || [];
  const jobsMap = useMemo(() => {
    return jobs.reduce((acc, job) => {
      acc[job._id] = job;
      return acc;
    }, {} as Record<string, any>);
  }, [jobs]);

  // Filter submissions based on date range
  const filteredSubmissions = useMemo(() => {
    let filtered = submissions;

    // Filter by date range
    if (filters.date_range && filters.date_range !== 'all') {
      const now = new Date();
      const cutoffDate = new Date();
      
      switch (filters.date_range) {
        case 'week':
          cutoffDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          cutoffDate.setMonth(now.getMonth() - 1);
          break;
        case 'quarter':
          cutoffDate.setMonth(now.getMonth() - 3);
          break;
        case 'year':
          cutoffDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      filtered = filtered.filter(submission => 
        new Date(submission.created_at) >= cutoffDate
      );
    }

    // Filter by status
    if (filters.status) {
      filtered = filtered.filter(submission => submission.status === filters.status);
    }

    // Filter by job
    if (filters.job_id) {
      filtered = filtered.filter(submission => submission.job_id === filters.job_id);
    }

    return filtered;
  }, [submissions, filters]);

  // Sort submissions
  const sortedSubmissions = useMemo(() => {
    const sorted = [...filteredSubmissions];
    
    sorted.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (filters.sort_by) {
        case 'date':
          aValue = new Date(a.submitted_at || a.created_at);
          bValue = new Date(b.submitted_at || b.created_at);
          break;
        case 'score':
          aValue = a.ai_evaluation?.overall_score || 0;
          bValue = b.ai_evaluation?.overall_score || 0;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        default:
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
      }
      
      if (aValue < bValue) return filters.sort_order === 'asc' ? -1 : 1;
      if (aValue > bValue) return filters.sort_order === 'asc' ? 1 : -1;
      return 0;
    });
    
    return sorted;  }, 
[filteredSubmissions, filters.sort_by, filters.sort_order]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const handleComparisonToggle = (submissionId: string) => {
    if (comparisonSubmissions.includes(submissionId)) {
      setComparisonSubmissions(prev => prev.filter(id => id !== submissionId));
    } else if (comparisonSubmissions.length < 3) {
      setComparisonSubmissions(prev => [...prev, submissionId]);
    }
  };

  const getUniqueJobs = () => {
    const uniqueJobIds = [...new Set(submissions.map(s => s.job_id))];
    return uniqueJobIds.map(jobId => jobsMap[jobId]).filter(Boolean);
  };

  const calculatePerformanceTrend = () => {
    const recentSubmissions = sortedSubmissions
      .filter(s => s.ai_evaluation?.overall_score)
      .slice(0, 5);
    
    if (recentSubmissions.length < 2) return null;
    
    const scores = recentSubmissions.map(s => s.ai_evaluation!.overall_score);
    const avgRecent = scores.slice(0, Math.ceil(scores.length / 2)).reduce((a, b) => a + b, 0) / Math.ceil(scores.length / 2);
    const avgOlder = scores.slice(Math.ceil(scores.length / 2)).reduce((a, b) => a + b, 0) / Math.floor(scores.length / 2);
    
    return avgRecent - avgOlder;
  };

  const performanceTrend = calculatePerformanceTrend();

  if (submissionsLoading || jobsLoading) {
    return <SubmissionHistoryPageSkeleton />;
  }

  if (submissionsError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <ErrorMessage 
          message="Failed to load submission history" 
          onRetry={refetchSubmissions}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <button
              onClick={() => navigate('/student-dashboard')}
              className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Dashboard
            </button>
            <span className="text-gray-300">•</span>
            <button
              onClick={() => navigate('/student/applications')}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              My Applications
            </button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Submission History</h1>
          <p className="mt-2 text-gray-600">
            Review your past submissions, AI evaluations, and recruiter feedback
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Submissions</p>
                <p className="text-2xl font-semibold text-gray-900">{submissions.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Completed</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {submissions.filter(s => ['evaluated', 'reviewed', 'shortlisted'].includes(s.status)).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Average Score</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {submissions.filter(s => s.ai_evaluation?.overall_score).length > 0
                    ? Math.round(
                        submissions
                          .filter(s => s.ai_evaluation?.overall_score)
                          .reduce((sum, s) => sum + s.ai_evaluation!.overall_score, 0) /
                        submissions.filter(s => s.ai_evaluation?.overall_score).length
                      )
                    : 'N/A'
                  }
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  performanceTrend === null ? 'bg-gray-100' :
                  performanceTrend > 0 ? 'bg-green-100' : 
                  performanceTrend < 0 ? 'bg-red-100' : 'bg-yellow-100'
                }`}>
                  {performanceTrend === null ? (
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                  ) : performanceTrend > 0 ? (
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7H7" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 7l-9.2 9.2M7 7v10h10" />
                    </svg>
                  )}
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Trend</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {performanceTrend === null ? 'N/A' : 
                   performanceTrend > 0 ? `+${performanceTrend.toFixed(1)}` :
                   performanceTrend.toFixed(1)
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Filter Submissions</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                <select
                  value={filters.date_range}
                  onChange={(e) => setFilters({ ...filters, date_range: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Time</option>
                  <option value="week">Last Week</option>
                  <option value="month">Last Month</option>
                  <option value="quarter">Last Quarter</option>
                  <option value="year">Last Year</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={filters.status || ''}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value || undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Statuses</option>
                  <option value="in_progress">In Progress</option>
                  <option value="submitted">Submitted</option>
                  <option value="evaluated">Evaluated</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="shortlisted">Shortlisted</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Job</label>
                <select
                  value={filters.job_id || ''}
                  onChange={(e) => setFilters({ ...filters, job_id: e.target.value || undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Jobs</option>
                  {getUniqueJobs().map((job) => (
                    <option key={job._id} value={job._id}>
                      {job.title} - {job.company.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                <div className="flex space-x-2">
                  <select
                    value={filters.sort_by}
                    onChange={(e) => setFilters({ ...filters, sort_by: e.target.value as any })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="date">Date</option>
                    <option value="score">Score</option>
                    <option value="status">Status</option>
                  </select>
                  <button
                    onClick={() => setFilters({ 
                      ...filters, 
                      sort_order: filters.sort_order === 'asc' ? 'desc' : 'asc' 
                    })}
                    className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {filters.sort_order === 'asc' ? '↑' : '↓'}
                  </button>
                </div>
              </div>
            </div>

            {/* Comparison Mode Toggle */}
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="comparison-mode"
                  checked={showComparison}
                  onChange={(e) => {
                    setShowComparison(e.target.checked);
                    if (!e.target.checked) {
                      setComparisonSubmissions([]);
                    }
                  }}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="comparison-mode" className="ml-2 text-sm text-gray-700">
                  Comparison Mode (Select up to 3 submissions)
                </label>
              </div>
              
              {showComparison && comparisonSubmissions.length > 1 && (
                <button
                  onClick={() => setShowComparisonModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Compare Selected ({comparisonSubmissions.length})
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Submissions List */}
        {sortedSubmissions.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No submissions found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {filters.status || filters.job_id || filters.date_range !== 'all'
                ? 'Try adjusting your filters to see more results.'
                : 'Start applying to jobs to see your submission history here.'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedSubmissions.map((submission) => {
              const job = jobsMap[submission.job_id];
              const isSelected = comparisonSubmissions.includes(submission._id);
              
              return (
                <div
                  key={submission._id}
                  className={`bg-white rounded-lg shadow hover:shadow-md transition-shadow ${
                    showComparison ? 'cursor-pointer' : ''
                  } ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
                  onClick={() => showComparison && handleComparisonToggle(submission._id)}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          {showComparison && (
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleComparisonToggle(submission._id)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              onClick={(e) => e.stopPropagation()}
                            />
                          )}
                          <h3 className="text-lg font-medium text-gray-900">
                            {job?.title || 'Unknown Job'}
                          </h3>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(submission.status)}`}>
                            {submission.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-3">
                          {job?.company?.name} • Submitted {formatDate(submission.submitted_at || submission.created_at)}
                        </p>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Time Spent:</span>
                            <span className="ml-2 font-medium">{formatTimeSpent(submission.time_spent)}</span>
                          </div>
                          
                          {submission.ai_evaluation && (
                            <div>
                              <span className="text-gray-500">AI Score:</span>
                              <span className={`ml-2 font-medium ${getScoreColor(submission.ai_evaluation.overall_score)}`}>
                                {submission.ai_evaluation.overall_score}/100
                              </span>
                            </div>
                          )}
                          
                          {submission.recruiter_review && (
                            <div>
                              <span className="text-gray-500">Recruiter Rating:</span>
                              <div className="ml-2 flex items-center">
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
                          )}
                          
                          <div>
                            <span className="text-gray-500">Submission Type:</span>
                            <span className="ml-2 font-medium capitalize">
                              {submission.submission?.type || 'N/A'}
                            </span>
                          </div>
                        </div>

                        {/* AI Feedback Preview */}
                        {submission.ai_evaluation?.feedback && (
                          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-700 line-clamp-2">
                              <span className="font-medium">AI Feedback:</span> {submission.ai_evaluation.feedback}
                            </p>
                          </div>
                        )}

                        {/* Recruiter Notes Preview */}
                        {submission.recruiter_review?.notes && (
                          <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                            <p className="text-sm text-gray-700 line-clamp-2">
                              <span className="font-medium">Recruiter Notes:</span> {submission.recruiter_review.notes}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex-shrink-0 ml-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSubmission(submission);
                          }}
                          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Submission Viewer Modal */}
        {selectedSubmission && (
          <SubmissionViewer
            submission={selectedSubmission}
            job={jobsMap[selectedSubmission.job_id]}
            onClose={() => setSelectedSubmission(null)}
          />
        )}

        {/* Submission Comparison Modal */}
        {showComparisonModal && comparisonSubmissions.length > 1 && (
          <SubmissionComparison
            submissions={comparisonSubmissions.map(id => submissions.find(s => s._id === id)!).filter(Boolean)}
            jobs={jobsMap}
            onClose={() => setShowComparisonModal(false)}
          />
        )}
      </div>
    </div>
  );
};

export default SubmissionHistory;