import React, { useState, useEffect } from 'react';
import RecruiterLayout from '../../components/recruiter/RecruiterLayout';
import TaskSubmissionCard from '../../components/recruiter/TaskSubmissionCard';
import SubmissionViewer from '../../components/recruiter/SubmissionViewer';
import AIEvaluationDashboard from '../../components/recruiter/AIEvaluationDashboard';
import { useTaskSubmissions, TaskSubmission, TaskSubmissionFilters } from '../../hooks/recruiter/useTaskSubmissions';
import { useJobs } from '../../hooks/recruiter/useJobs';

type ViewMode = 'kanban' | 'list' | 'ai-dashboard';

const TaskSubmissions: React.FC = () => {
  const { 
    submissions, 
    loading, 
    error, 
    fetchSubmissions, 
    updateSubmissionStatus, 
    addRecruiterReview, 
    bulkUpdateStatus 
  } = useTaskSubmissions();
  
  const { jobs, fetchJobs } = useJobs();
  
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [selectedSubmission, setSelectedSubmission] = useState<TaskSubmission | null>(null);
  const [selectedSubmissions, setSelectedSubmissions] = useState<string[]>([]);
  const [filters, setFilters] = useState<TaskSubmissionFilters>({});
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Kanban columns configuration
  const kanbanColumns = [
    { id: 'submitted', title: 'Submitted', status: 'submitted' as const },
    { id: 'evaluated', title: 'AI Evaluated', status: 'evaluated' as const },
    { id: 'reviewed', title: 'Reviewed', status: 'reviewed' as const },
    { id: 'shortlisted', title: 'Shortlisted', status: 'shortlisted' as const },
    { id: 'rejected', title: 'Rejected', status: 'rejected' as const }
  ];

  useEffect(() => {
    fetchSubmissions(filters);
    fetchJobs();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFilterChange = (newFilters: TaskSubmissionFilters) => {
    setFilters(newFilters);
    fetchSubmissions(newFilters);
  };

  const handleViewDetails = (submission: TaskSubmission) => {
    setSelectedSubmission(submission);
  };

  const handleUpdateStatus = async (submissionId: string, status: TaskSubmission['status']) => {
    await updateSubmissionStatus(submissionId, status);
  };

  const handleAddReview = async (submissionId: string, review: {
    rating: number;
    notes: string;
    decision: 'shortlist' | 'reject' | 'pending';
  }) => {
    await addRecruiterReview(submissionId, review);
  };

  const handleSelectSubmission = (submissionId: string) => {
    setSelectedSubmissions(prev => 
      prev.includes(submissionId) 
        ? prev.filter(id => id !== submissionId)
        : [...prev, submissionId]
    );
  };

  const handleSelectAll = () => {
    if (selectedSubmissions.length === submissions.length) {
      setSelectedSubmissions([]);
    } else {
      setSelectedSubmissions(submissions.map(s => s._id));
    }
  };

  const handleBulkAction = async (action: TaskSubmission['status']) => {
    if (selectedSubmissions.length === 0) return;
    
    const result = await bulkUpdateStatus(selectedSubmissions, action);
    if (result.successful > 0) {
      setSelectedSubmissions([]);
      setShowBulkActions(false);
    }
  };

  const getSubmissionsByStatus = (status: TaskSubmission['status']) => {
    return submissions.filter(submission => submission.status === status);
  };



  const renderFilters = () => (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Job Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Job</label>
          <select
            value={filters.job_id || ''}
            onChange={(e) => handleFilterChange({ ...filters, job_id: e.target.value || undefined })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Jobs</option>
            {jobs.map(job => (
              <option key={job._id} value={job._id}>{job.title}</option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            value={filters.status || ''}
            onChange={(e) => handleFilterChange({ ...filters, status: e.target.value || undefined })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="submitted">Submitted</option>
            <option value="evaluated">AI Evaluated</option>
            <option value="reviewed">Reviewed</option>
            <option value="shortlisted">Shortlisted</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {/* Score Range Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">AI Score Range</label>
          <div className="flex space-x-2">
            <input
              type="number"
              placeholder="Min"
              min="0"
              max="100"
              value={filters.min_score || ''}
              onChange={(e) => handleFilterChange({ ...filters, min_score: e.target.value ? parseInt(e.target.value) : undefined })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="number"
              placeholder="Max"
              min="0"
              max="100"
              value={filters.max_score || ''}
              onChange={(e) => handleFilterChange({ ...filters, max_score: e.target.value ? parseInt(e.target.value) : undefined })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Search */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
          <input
            type="text"
            placeholder="Candidate name or email..."
            value={filters.search || ''}
            onChange={(e) => handleFilterChange({ ...filters, search: e.target.value || undefined })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );

  const renderKanbanView = () => (
    <div className="flex space-x-6 overflow-x-auto pb-4">
      {kanbanColumns.map(column => {
        const columnSubmissions = getSubmissionsByStatus(column.status);
        return (
          <div key={column.id} className="flex-shrink-0 w-80">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-900">{column.title}</h3>
                <span className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full">
                  {columnSubmissions.length}
                </span>
              </div>
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {columnSubmissions.map(submission => (
                  <TaskSubmissionCard
                    key={submission._id}
                    submission={submission}
                    onViewDetails={handleViewDetails}
                    onUpdateStatus={handleUpdateStatus}
                    isSelected={selectedSubmissions.includes(submission._id)}
                    onSelect={handleSelectSubmission}
                  />
                ))}
                
                {columnSubmissions.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p className="text-sm">No submissions</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderListView = () => (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <input
              type="checkbox"
              checked={selectedSubmissions.length === submissions.length && submissions.length > 0}
              onChange={handleSelectAll}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-700">
              {selectedSubmissions.length > 0 ? `${selectedSubmissions.length} selected` : 'Select all'}
            </span>
          </div>
          
          {selectedSubmissions.length > 0 && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowBulkActions(!showBulkActions)}
                className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
              >
                Bulk Actions
              </button>
            </div>
          )}
        </div>
        
        {showBulkActions && selectedSubmissions.length > 0 && (
          <div className="mt-3 flex items-center space-x-2">
            <button
              onClick={() => handleBulkAction('shortlisted')}
              className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
            >
              Shortlist Selected
            </button>
            <button
              onClick={() => handleBulkAction('rejected')}
              className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
            >
              Reject Selected
            </button>
            <button
              onClick={() => handleBulkAction('reviewed')}
              className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            >
              Mark as Reviewed
            </button>
          </div>
        )}
      </div>
      
      <div className="divide-y divide-gray-200">
        {submissions.map(submission => (
          <div key={submission._id} className="p-6">
            <TaskSubmissionCard
              submission={submission}
              onViewDetails={handleViewDetails}
              onUpdateStatus={handleUpdateStatus}
              isSelected={selectedSubmissions.includes(submission._id)}
              onSelect={handleSelectSubmission}
            />
          </div>
        ))}
        
        {submissions.length === 0 && !loading && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No submissions found</h3>
            <p className="mt-1 text-sm text-gray-500">
              No task submissions match your current filters.
            </p>
          </div>
        )}
      </div>
    </div>
  );

  if (loading && submissions.length === 0) {
    return (
      <RecruiterLayout pageTitle="Task Submissions">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </RecruiterLayout>
    );
  }

  return (
    <RecruiterLayout pageTitle="Task Submissions">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Task Submissions</h1>
            <p className="text-gray-600 mt-1">Review candidate task submissions and AI evaluations</p>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('kanban')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  viewMode === 'kanban' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Kanban
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  viewMode === 'list' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                List
              </button>
              <button
                onClick={() => setViewMode('ai-dashboard')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  viewMode === 'ai-dashboard' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                🤖 AI Analytics
              </button>
            </div>
            
            {/* Stats */}
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span>Total: {submissions.length}</span>
              {submissions.filter(s => s.ai_evaluation).length > 0 && (
                <span>
                  Avg Score: {Math.round(
                    submissions
                      .filter(s => s.ai_evaluation)
                      .reduce((sum, s) => sum + s.ai_evaluation!.overall_score, 0) /
                    submissions.filter(s => s.ai_evaluation).length
                  )}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        {renderFilters()}

        {/* Content */}
        {viewMode === 'kanban' && renderKanbanView()}
        {viewMode === 'list' && renderListView()}
        {viewMode === 'ai-dashboard' && (
          <AIEvaluationDashboard
            submissions={submissions}
            selectedSubmission={selectedSubmission || undefined}
            onSubmissionSelect={setSelectedSubmission}
          />
        )}

        {/* Submission Viewer Modal */}
        {selectedSubmission && (
          <SubmissionViewer
            submission={selectedSubmission}
            onClose={() => setSelectedSubmission(null)}
            onUpdateStatus={handleUpdateStatus}
            onAddReview={handleAddReview}
          />
        )}
      </div>
    </RecruiterLayout>
  );
};

export default TaskSubmissions;