import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApplications } from '../../hooks/student/useApplications';
import { useJobs } from '../../hooks/student/useJobs';
import ApplicationStatusCard from '../../components/ApplicationStatusCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';

type ViewMode = 'kanban' | 'table';
type FilterStatus = 'all' | 'enrolled' | 'in_progress' | 'submitted' | 'evaluated' | 'reviewed' | 'shortlisted' | 'rejected';

const MyApplications: React.FC = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedApplications, setSelectedApplications] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'date' | 'status' | 'score' | 'deadline'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Fetch applications and jobs data
  const { data: applicationsData, isLoading: applicationsLoading, error: applicationsError, refetch: refetchApplications } = useApplications();
  const { data: jobsData, isLoading: jobsLoading } = useJobs();

  // Auto-refresh applications every 30 seconds for real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      refetchApplications();
    }, 30000);

    return () => clearInterval(interval);
  }, [refetchApplications]);

  // Create a map of jobs for quick lookup
  const jobsMap = useMemo(() => {
    if (!jobsData?.jobs) return new Map();
    return new Map(jobsData.jobs.map(job => [job._id, job]));
  }, [jobsData]);

  // Filter, search, and sort applications
  const filteredApplications = useMemo(() => {
    if (!applicationsData?.applications) return [];

    let filtered = applicationsData.applications;

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(app => app.status === filterStatus);
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(app => {
        const job = jobsMap.get(app.job_id);
        return (
          job?.title.toLowerCase().includes(searchLower) ||
          job?.company_name.toLowerCase().includes(searchLower) ||
          job?.description.toLowerCase().includes(searchLower)
        );
      });
    }

    // Sort applications
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'date':
          aValue = new Date(a.enrolled_at).getTime();
          bValue = new Date(b.enrolled_at).getTime();
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'score':
          aValue = a.ai_evaluation?.overall_score || 0;
          bValue = b.ai_evaluation?.overall_score || 0;
          break;
        case 'deadline':
          const jobA = jobsMap.get(a.job_id);
          const jobB = jobsMap.get(b.job_id);
          aValue = jobA?.deadline ? new Date(jobA.deadline).getTime() : Infinity;
          bValue = jobB?.deadline ? new Date(jobB.deadline).getTime() : Infinity;
          break;
        default:
          return 0;
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [applicationsData?.applications, filterStatus, searchTerm, jobsMap, sortBy, sortOrder]);

  // Group applications by status for kanban view
  const applicationsByStatus = useMemo(() => {
    const groups = {
      enrolled: [] as typeof filteredApplications,
      in_progress: [] as typeof filteredApplications,
      submitted: [] as typeof filteredApplications,
      evaluated: [] as typeof filteredApplications,
      reviewed: [] as typeof filteredApplications,
      shortlisted: [] as typeof filteredApplications,
      rejected: [] as typeof filteredApplications,
    };

    filteredApplications.forEach(app => {
      if (groups[app.status as keyof typeof groups]) {
        groups[app.status as keyof typeof groups].push(app);
      }
    });

    return groups;
  }, [filteredApplications]);

  // Status display configuration
  const statusConfig = {
    enrolled: { label: 'Enrolled', color: 'bg-blue-100 text-blue-800', count: applicationsByStatus.enrolled.length },
    in_progress: { label: 'In Progress', color: 'bg-yellow-100 text-yellow-800', count: applicationsByStatus.in_progress.length },
    submitted: { label: 'Submitted', color: 'bg-purple-100 text-purple-800', count: applicationsByStatus.submitted.length },
    evaluated: { label: 'AI Evaluated', color: 'bg-indigo-100 text-indigo-800', count: applicationsByStatus.evaluated.length },
    reviewed: { label: 'Under Review', color: 'bg-orange-100 text-orange-800', count: applicationsByStatus.reviewed.length },
    shortlisted: { label: 'Shortlisted', color: 'bg-green-100 text-green-800', count: applicationsByStatus.shortlisted.length },
    rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800', count: applicationsByStatus.rejected.length },
  };

  if (applicationsLoading || jobsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading your applications...</p>
        </div>
      </div>
    );
  }

  if (applicationsError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <ErrorMessage
          title="Failed to Load Applications"
          message="There was an error loading your applications. Please try again."
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">My Applications</h1>
                <p className="mt-2 text-gray-600">
                  Track your job applications and submission progress
                </p>
              </div>
              
              {/* Summary Stats and Actions */}
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {applicationsData?.summary?.total || 0}
                    </div>
                    <div className="text-sm text-gray-500">Total Applications</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {Math.round((applicationsData?.summary?.completion_rate || 0) * 100)}%
                    </div>
                    <div className="text-sm text-gray-500">Completion Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {applicationsData?.summary?.average_score?.toFixed(1) || 'N/A'}
                    </div>
                    <div className="text-sm text-gray-500">Avg Score</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => navigate('/student/history')}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <svg className="h-4 w-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    View History
                  </button>
                  <button
                    onClick={() => refetchApplications()}
                    disabled={applicationsLoading}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    <svg className={`h-4 w-4 mr-1.5 ${applicationsLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                  </button>
                  
                  <button
                    onClick={() => window.location.href = '/student/dashboard'}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Browse Tasks
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          {/* Search and Filter */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search applications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="enrolled">Enrolled</option>
              <option value="in_progress">In Progress</option>
              <option value="submitted">Submitted</option>
              <option value="evaluated">AI Evaluated</option>
              <option value="reviewed">Under Review</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="rejected">Rejected</option>
            </select>

            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [newSortBy, newSortOrder] = e.target.value.split('-') as [typeof sortBy, typeof sortOrder];
                setSortBy(newSortBy);
                setSortOrder(newSortOrder);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="status-asc">Status A-Z</option>
              <option value="score-desc">Highest Score</option>
              <option value="score-asc">Lowest Score</option>
              <option value="deadline-asc">Deadline Soon</option>
            </select>

            {selectedApplications.size > 0 && (
              <div className="flex items-center space-x-2 ml-4 pl-4 border-l border-gray-300">
                <span className="text-sm text-gray-600">
                  {selectedApplications.size} selected
                </span>
                <button
                  onClick={() => setSelectedApplications(new Set())}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Clear
                </button>
              </div>
            )}
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-700">View:</span>
            <div className="flex rounded-lg border border-gray-300 overflow-hidden">
              <button
                onClick={() => setViewMode('kanban')}
                className={`px-4 py-2 text-sm font-medium ${
                  viewMode === 'kanban'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Kanban
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-4 py-2 text-sm font-medium ${
                  viewMode === 'table'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Table
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {filteredApplications.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || filterStatus !== 'all' ? 'No matching applications' : 'No applications yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || filterStatus !== 'all' 
                ? 'Try adjusting your search or filter criteria.'
                : 'Start by browsing available tasks and applying to ones that interest you.'
              }
            </p>
            {!searchTerm && filterStatus === 'all' && (
              <button
                onClick={() => window.location.href = '/student/dashboard'}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Browse Tasks
              </button>
            )}
          </div>
        ) : viewMode === 'kanban' ? (
          /* Kanban View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-7 gap-4">
            {Object.entries(statusConfig).map(([status, config]) => (
              <div key={status} className="bg-white rounded-lg shadow-sm border border-gray-200 min-h-[400px] flex flex-col">
                <div className="p-4 border-b border-gray-200 flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-gray-900 text-sm">{config.label}</h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
                      {config.count}
                    </span>
                  </div>
                </div>
                <div className="p-3 space-y-3 flex-1 overflow-y-auto">
                  {applicationsByStatus[status as keyof typeof applicationsByStatus].length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <div className="text-2xl mb-2">📋</div>
                      <p className="text-sm">No applications</p>
                    </div>
                  ) : (
                    applicationsByStatus[status as keyof typeof applicationsByStatus].map((application) => (
                      <ApplicationStatusCard
                        key={application._id}
                        application={application}
                        job={jobsMap.get(application.job_id)}
                        compact={true}
                      />
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Table View */
          <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Job
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Progress
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Applied
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredApplications.map((application) => (
                    <ApplicationStatusCard
                      key={application._id}
                      application={application}
                      job={jobsMap.get(application.job_id)}
                      tableView={true}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyApplications;