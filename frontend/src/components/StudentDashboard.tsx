import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import TaskSubmissionForm from './TaskSubmissionForm';
import TaskDetailsModal from './TaskDetailsModal';
import TaskCard from './TaskCard';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import TaskFilters, { FilterState } from './student/TaskFilters';
import { useSavedSearches } from '../hooks/student/useSavedSearches';
import RecommendationEngine from './student/RecommendationEngine';
import AnalyticsWidget from './student/AnalyticsWidget';

// Import our new hooks
import { useJobs, useIncrementJobView } from '../hooks/student/useJobs';
import { useApplications, useApplicationSummary, useRecentApplications } from '../hooks/student/useApplications';
import { Job, JobWithRecommendation } from '../hooks/student/useJobs';
import { StudentApplication } from '../hooks/student/useApplications';

// Helper functions
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const calculateRewardPoints = (job: Job) => {
  // Calculate reward points based on job complexity and time limit
  const basePoints = 100;
  const timeMultiplier = Math.floor(job.task.time_limit / 60); // Points per hour
  const difficultyMultiplier = job.task.submission_format === 'code' ? 1.5 : 1.2;
  return Math.round(basePoints * timeMultiplier * difficultyMultiplier);
};

const getDifficultyFromTimeLimit = (timeLimit: number) => {
  if (timeLimit <= 60) return 'Easy';
  if (timeLimit <= 180) return 'Medium';
  return 'Hard';
};

const getApplicationStatus = (application: StudentApplication) => {
  switch (application.status) {
    case 'enrolled': return 'Enrolled';
    case 'in_progress': return 'In Progress';
    case 'submitted': return 'Submitted';
    case 'evaluated': return 'Evaluated';
    case 'reviewed': return 'Under Review';
    case 'shortlisted': return 'Shortlisted';
    case 'rejected': return 'Rejected';
    default: return 'Unknown';
  }
};

const StudentDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('home');
  const [showSubmissionForm, setShowSubmissionForm] = useState(false);
  const [showTaskDetails, setShowTaskDetails] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Job | JobWithRecommendation | null>(null);
  
  // Enhanced filtering state
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    difficulty: [],
    category: [],
    employment_type: [],
    location_type: '',
    min_reward: null,
    max_reward: null,
    deadline_within: null,
    exclude_applied: false
  });

  // Saved searches functionality
  const { savedSearches, saveSearch, loadSearch } = useSavedSearches();

  // Fetch real data using our hooks
  const { 
    data: jobsData, 
    isLoading: jobsLoading, 
    error: jobsError 
  } = useJobs({
    search: filters.search || undefined,
    difficulty: filters.difficulty.length > 0 ? filters.difficulty : undefined,
    category: filters.category.length > 0 ? filters.category : undefined,
    employment_type: filters.employment_type.length > 0 ? filters.employment_type : undefined,
    location_type: filters.location_type || undefined,
    min_reward: filters.min_reward || undefined,
    max_reward: filters.max_reward || undefined,
    deadline_within: filters.deadline_within || undefined,
    exclude_applied: filters.exclude_applied
  });

  // Recommendations are now handled by the RecommendationEngine component

  const { 
    data: applicationsData, 
    isLoading: applicationsLoading, 
    error: applicationsError 
  } = useApplications();

  const { 
    data: applicationSummary, 
    isLoading: summaryLoading 
  } = useApplicationSummary();

  const { 
    data: recentApplications, 
    isLoading: recentLoading 
  } = useRecentApplications(5);

  const incrementViewMutation = useIncrementJobView();

  // Memoized computed values
  const stats = useMemo(() => {
    if (!applicationSummary) {
      return {
        activeTasks: 0,
        completed: 0,
        totalPoints: 0,
        rank: 0
      };
    }

    const activeTasks = (applicationSummary as any)?.by_status?.['in_progress'] || 0;
    const completed = (applicationSummary as any)?.by_status?.['completed'] || 0;
    const totalPoints = Math.round(completed * ((applicationSummary as any)?.average_score || 0) * 10) || 0;
    const rank = Math.max(1, Math.floor(Math.random() * 100)); // Placeholder for real ranking

    return { activeTasks, completed, totalPoints, rank };
  }, [applicationSummary]);

  // Jobs are now filtered by the backend based on the filters state
  const filteredJobs = (jobsData as any)?.jobs || [];

  const handleFiltersChange = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  const handleSaveSearch = (name: string, searchFilters: FilterState) => {
    saveSearch(name, searchFilters);
  };

  const handleLoadSavedSearch = (searchFilters: FilterState) => {
    setFilters(searchFilters);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'text-green-600 bg-green-100';
      case 'In Progress': return 'text-blue-600 bg-blue-100';
      case 'Submitted': return 'text-purple-600 bg-purple-100';
      case 'Under Review': return 'text-orange-600 bg-orange-100';
      case 'Enrolled': return 'text-yellow-600 bg-yellow-100';
      case 'Rejected': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'text-green-600 bg-green-100';
      case 'Medium': return 'text-yellow-600 bg-yellow-100';
      case 'Hard': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const handleViewDetails = (job: Job | JobWithRecommendation) => {
    setSelectedTask(job);
    setShowTaskDetails(true);
    
    // Track job view
    incrementViewMutation.mutate(job._id);
  };
  
  const handleEnroll = (job: Job | JobWithRecommendation) => {
    setSelectedTask(job);
    setShowTaskDetails(false);
    setShowSubmissionForm(true);
  };

  const handleSubmission = (submission: any) => {
    console.log('Submission received:', submission);
    // The actual submission will be handled by the TaskSubmissionForm component
    setShowSubmissionForm(false);
    setSelectedTask(null);
  };

  // Loading state
  if (jobsLoading || applicationsLoading || summaryLoading) {
    return (
      <main id="main-content" role="main" aria-label="Student Dashboard">
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
          <LoadingSpinner />
        </div>
      </main>
    );
  }

  // Error state
  if (jobsError || applicationsError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <ErrorMessage 
          message="Failed to load dashboard data. Please try again." 
          onRetry={() => window.location.reload()} 
        />
      </div>
    );
  }

  return (
    <main id="main-content" role="main" aria-label="Student Dashboard" className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-sm border-b border-gray-200" aria-label="Dashboard navigation">
        <div className="container-custom">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-3">
                <div className="text-2xl">🚀</div>
                <div>
                  <h1 className="text-xl font-bold gradient-text">DoProof</h1>
                  <p className="text-xs text-gray-500 -mt-1">Student Dashboard</p>
                </div>
              </div>
              
              <div className="hidden md:flex space-x-1">
                {[
                  { id: 'home', label: 'Home', icon: '🏠' },
                  { id: 'tasks', label: 'Tasks', icon: '📋' },
                  { id: 'applications', label: 'My Applications', icon: '📝' },
                  { id: 'history', label: 'History', icon: '📚' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      if (tab.id === 'applications') {
                        navigate('/student/applications');
                      } else if (tab.id === 'history') {
                        navigate('/student/history');
                      } else {
                        setActiveTab(tab.id);
                      }
                    }}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      activeTab === tab.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <span>{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user?.email}!</span>
              <button 
                onClick={handleLogout}
                className="text-sm text-red-600 hover:text-red-700 font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <div className="md:hidden bg-white border-b border-gray-200">
        <div className="flex space-x-1 p-2">
          {[
            { id: 'home', label: 'Home', icon: '🏠' },
            { id: 'tasks', label: 'Tasks', icon: '📋' },
            { id: 'applications', label: 'Applications', icon: '📝' },
            { id: 'history', label: 'History', icon: '📚' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.id === 'applications') {
                  navigate('/student/applications');
                } else if (tab.id === 'history') {
                  navigate('/student/history');
                } else {
                  setActiveTab(tab.id);
                }
              }}
              className={`flex-1 flex flex-col items-center py-2 px-1 rounded-lg text-xs font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span className="text-lg mb-1">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className="container-custom py-8">
        {/* Home Tab */}
        {activeTab === 'home' && (
          <div className="space-y-8">
            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
              <h2 className="text-2xl font-bold mb-2">Welcome back, {user?.email}! 👋</h2>
              <p className="text-blue-100">Ready to tackle some exciting challenges today?</p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Active Tasks</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.activeTasks}</p>
                  </div>
                  <div className="text-2xl">📋</div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Completed</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
                  </div>
                  <div className="text-2xl">✅</div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Points</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalPoints.toLocaleString()}</p>
                  </div>
                  <div className="text-2xl">🏆</div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Rank</p>
                    <p className="text-2xl font-bold text-gray-900">#{stats.rank}</p>
                  </div>
                  <div className="text-2xl">🥇</div>
                </div>
              </div>
            </div>

            {/* My Tasks Section */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-900">My Tasks</h3>
              </div>
              <div className="p-6">
                {recentLoading ? (
                  <div className="flex justify-center py-8">
                    <LoadingSpinner />
                  </div>
                ) : recentApplications && (recentApplications as any)?.length > 0 ? (
                  <div className="space-y-4">
                    {(recentApplications as any)?.map((application: any) => (
                      <div key={application._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-semibold text-gray-900">{application.job?.title || 'Loading...'}</h4>
                            <p className="text-sm text-gray-600">Company Name</p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(getApplicationStatus(application))}`}>
                            {getApplicationStatus(application)}
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm mb-3">{application.job?.description || 'Task description'}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>📅 {formatDate(application.enrolled_at)}</span>
                            <span>🎯 {application.job ? calculateRewardPoints(application.job) : 0} pts</span>
                            {application.job && (
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(getDifficultyFromTimeLimit(application.job.task.time_limit))}`}>
                                {getDifficultyFromTimeLimit(application.job.task.time_limit)}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${application.progress.completion_percentage}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-600">{application.progress.completion_percentage}%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">📋</div>
                    <h4 className="text-lg font-medium text-gray-900 mb-2">No active tasks yet</h4>
                    <p className="text-gray-600 mb-4">Start by browsing available tasks and enrolling in ones that interest you.</p>
                    <button 
                      onClick={() => setActiveTab('tasks')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Browse Tasks
                    </button>
                  </div>
                )}
                {recentApplications && (recentApplications as any)?.length > 0 && (
                  <div className="mt-6 text-center space-x-4">
                    <button 
                      onClick={() => navigate('/student/applications')}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      View All Applications →
                    </button>
                    <span className="text-gray-300">•</span>
                    <button 
                      onClick={() => navigate('/student/history')}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Submission History →
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Enhanced Recommendation Engine */}
            <RecommendationEngine 
              limit={6}
              showReasoning={true}
              compact={false}
            />

            {/* Enhanced Analytics Widget */}
            <AnalyticsWidget 
              compact={false}
              showChart={true}
            />
          </div>
        )}

        {/* Tasks Tab */}
        {activeTab === 'tasks' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Available Tasks</h2>
            
            {/* Enhanced Search and Filters */}
            <TaskFilters
              filters={filters}
              onFiltersChange={handleFiltersChange}
              onSaveSearch={handleSaveSearch}
              savedSearches={savedSearches.map(s => ({ name: s.name, filters: s.filters }))}
              onLoadSavedSearch={handleLoadSavedSearch}
              isLoading={jobsLoading}
            />

            {/* All Tasks */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-900">All Available Tasks</h3>
                <p className="text-gray-600 text-sm">
                  {filteredJobs.length} task{filteredJobs.length !== 1 ? 's' : ''} available
                </p>
              </div>
              <div className="p-6">
                {jobsLoading ? (
                  <div className="flex justify-center py-8">
                    <LoadingSpinner />
                  </div>
                ) : filteredJobs.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredJobs.map((job) => (
                      <TaskCard
                        key={job._id}
                        job={job}
                        isRecommended={job.is_recommended || false}
                        showMatchScore={!!job.match_score}
                        onViewDetails={handleViewDetails}
                        onEnroll={handleEnroll}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">🔍</div>
                    <h4 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h4>
                    <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Applications Tab */}
        {activeTab === 'applications' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">My Applications</h2>
            
            {/* Application Summary */}
            {applicationSummary && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg p-4 shadow">
                  <div className="text-sm text-gray-600">Total Applications</div>
                  <div className="text-2xl font-bold text-gray-900">{(applicationSummary as any)?.total || 0}</div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow">
                  <div className="text-sm text-gray-600">Completion Rate</div>
                  <div className="text-2xl font-bold text-blue-600">{((applicationSummary as any)?.completion_rate || 0).toFixed(1)}%</div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow">
                  <div className="text-sm text-gray-600">Average Score</div>
                  <div className="text-2xl font-bold text-green-600">{((applicationSummary as any)?.average_score || 0).toFixed(1)}</div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow">
                  <div className="text-sm text-gray-600">In Progress</div>
                  <div className="text-2xl font-bold text-orange-600">{(applicationSummary as any)?.by_status?.['in_progress'] || 0}</div>
                </div>
              </div>
            )}
            
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-900">Application Tracker</h3>
                <p className="text-gray-600 text-sm">Track the status of all your job applications</p>
              </div>
              <div className="p-6">
                {applicationsLoading ? (
                  <div className="flex justify-center py-8">
                    <LoadingSpinner />
                  </div>
                ) : applicationsData && (applicationsData as any)?.applications?.length > 0 ? (
                  <div className="space-y-6">
                    {(applicationsData as any)?.applications?.map((application: any) => (
                      <div key={application._id} className="border border-gray-200 rounded-lg p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="font-semibold text-gray-900 text-lg">{application.job?.title || 'Loading...'}</h4>
                            <p className="text-sm text-gray-600">Company Name</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(getApplicationStatus(application))}`}>
                            {getApplicationStatus(application)}
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm mb-4">{application.job?.description || 'Task description'}</p>
                        
                        {/* Progress Tracker */}
                        <div className="mb-4">
                          <div className="flex justify-between text-sm text-gray-600 mb-2">
                            <span>Progress</span>
                            <span>{application.progress.completion_percentage}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div 
                              className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                              style={{ width: `${application.progress.completion_percentage}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* AI Evaluation Display */}
                        {application.evaluation && (
                          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm font-medium text-gray-700">AI Evaluation</span>
                              <span className="text-lg font-bold text-blue-600">{application.evaluation.ai_score}/100</span>
                            </div>
                            <p className="text-sm text-gray-600">{application.evaluation.feedback}</p>
                          </div>
                        )}

                        {/* Recruiter Review Display */}
                        {application.recruiter_review && (
                          <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm font-medium text-gray-700">Recruiter Review</span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                application.recruiter_review.decision === 'shortlist' ? 'bg-green-100 text-green-800' :
                                application.recruiter_review.decision === 'reject' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {application.recruiter_review.decision}
                              </span>
                            </div>
                            {application.recruiter_review.notes && (
                              <p className="text-sm text-gray-600">{application.recruiter_review.notes}</p>
                            )}
                          </div>
                        )}

                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <span>📅 Applied: {formatDate(application.enrolled_at)}</span>
                          <span>⏱️ Time spent: {application.progress.time_spent} min</span>
                          {application.job && (
                            <>
                              <span>🎯 {calculateRewardPoints(application.job)} points</span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(getDifficultyFromTimeLimit(application.job.task.time_limit))}`}>
                                {getDifficultyFromTimeLimit(application.job.task.time_limit)}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">📝</div>
                    <h4 className="text-lg font-medium text-gray-900 mb-2">No applications yet</h4>
                    <p className="text-gray-600 mb-4">Start applying to tasks to track your progress here.</p>
                    <button 
                      onClick={() => setActiveTab('tasks')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Browse Available Tasks
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Task Details Modal */}
        {showTaskDetails && selectedTask && (
          <TaskDetailsModal
            job={selectedTask}
            onClose={() => {
              setShowTaskDetails(false);
              setSelectedTask(null);
            }}
            onEnroll={handleEnroll}
          />
        )}
        
        {/* Task Submission Form */}
        {showSubmissionForm && selectedTask && (
          <TaskSubmissionForm
            job={selectedTask}
            onClose={() => {
              setShowSubmissionForm(false);
              setSelectedTask(null);
            }}
            onSubmit={handleSubmission}
          />
        )}
      </main>
    </div>
  );
};

export default StudentDashboard;