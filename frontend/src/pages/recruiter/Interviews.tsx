import React, { useState, useEffect } from 'react';
import RecruiterLayout from '../../components/recruiter/RecruiterLayout';
import InterviewCalendar from '../../components/recruiter/InterviewCalendar';
import InterviewForm from '../../components/recruiter/InterviewForm';
import InterviewFeedbackForm from '../../components/recruiter/InterviewFeedbackForm';
import { Interview, InterviewFilters, useInterviews } from '../../hooks/recruiter/useInterviews';
import { useJobs } from '../../hooks/recruiter/useJobs';
import { useTaskSubmissions } from '../../hooks/recruiter/useTaskSubmissions';

type ViewMode = 'calendar' | 'list';
type ModalType = 'schedule' | 'edit' | 'feedback' | 'details' | null;

const Interviews: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [modalType, setModalType] = useState<ModalType>(null);
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
  const [filters, setFilters] = useState<InterviewFilters>({});

  const { 
    interviews, 
    loading, 
    error, 
    pagination,
    fetchInterviews, 
    completeInterview, 
    cancelInterview,
    getStats
  } = useInterviews();

  const { jobs, fetchJobs } = useJobs();
  const { submissions: taskSubmissions, fetchSubmissions: fetchTaskSubmissions } = useTaskSubmissions();

  // Load initial data
  useEffect(() => {
    fetchInterviews(filters);
    fetchJobs();
    fetchTaskSubmissions();
  }, []);

  // Reload interviews when filters change
  useEffect(() => {
    fetchInterviews(filters);
  }, [filters]);

  const handleScheduleInterview = (submissionId?: string) => {
    setSelectedSubmissionId(submissionId || null);
    setSelectedInterview(null);
    setModalType('schedule');
  };

  const handleEditInterview = (interview: Interview) => {
    setSelectedInterview(interview);
    setSelectedSubmissionId(null);
    setModalType('edit');
  };

  const handleViewDetails = (interview: Interview) => {
    setSelectedInterview(interview);
    setModalType('details');
  };

  const handleAddFeedback = (interview: Interview) => {
    setSelectedInterview(interview);
    setModalType('feedback');
  };

  const handleCompleteInterview = async (interview: Interview) => {
    if (window.confirm('Mark this interview as completed?')) {
      await completeInterview(interview._id);
    }
  };

  const handleCancelInterview = async (interview: Interview) => {
    if (window.confirm('Are you sure you want to cancel this interview?')) {
      await cancelInterview(interview._id);
    }
  };

  const closeModal = () => {
    setModalType(null);
    setSelectedInterview(null);
    setSelectedSubmissionId(null);
  };

  const handleModalSubmit = (interview: Interview) => {
    closeModal();
    fetchInterviews(filters); // Refresh the list
  };

  const getStatusColor = (status: Interview['status']): string => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'rescheduled':
        return 'bg-yellow-100 text-yellow-800';
      case 'no_show':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDateTime = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getAvailableSubmissions = () => {
    return taskSubmissions.filter(submission => 
      ['evaluated', 'reviewed', 'shortlisted'].includes(submission.status) &&
      !interviews.some(interview => interview.submission_id === submission._id)
    );
  };

  return (
    <RecruiterLayout pageTitle="Interviews">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Interviews</h1>
            <p className="text-gray-600 mt-1">Schedule and manage candidate interviews</p>
          </div>
          <div className="flex items-center space-x-3">
            {/* View Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'calendar'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Calendar
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                List
              </button>
            </div>

            <button
              onClick={() => handleScheduleInterview()}
              className="btn-primary"
            >
              Schedule Interview
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                id="status-filter"
                value={filters.status || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value || undefined }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="rescheduled">Rescheduled</option>
                <option value="no_show">No Show</option>
              </select>
            </div>

            <div>
              <label htmlFor="type-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                id="type-filter"
                value={filters.interview_type || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, interview_type: e.target.value || undefined }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Types</option>
                <option value="video">Video</option>
                <option value="phone">Phone</option>
                <option value="onsite">On-site</option>
              </select>
            </div>

            <div>
              <label htmlFor="round-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Round
              </label>
              <select
                id="round-filter"
                value={filters.interview_round || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, interview_round: e.target.value || undefined }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Rounds</option>
                <option value="screening">Screening</option>
                <option value="technical">Technical</option>
                <option value="behavioral">Behavioral</option>
                <option value="culture_fit">Culture Fit</option>
                <option value="final">Final</option>
              </select>
            </div>

            <div>
              <label htmlFor="job-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Job
              </label>
              <select
                id="job-filter"
                value={filters.job_id || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, job_id: e.target.value || undefined }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Jobs</option>
                {jobs.map(job => (
                  <option key={job._id} value={job._id}>{job.title}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Content */}
        {viewMode === 'calendar' ? (
          <InterviewCalendar
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
            onInterviewSelect={handleViewDetails}
            className="min-h-[600px]"
          />
        ) : (
          <div className="bg-white rounded-lg shadow">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Loading interviews...</span>
              </div>
            ) : interviews.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4h3a1 1 0 011 1v9a1 1 0 01-1 1H5a1 1 0 01-1-1V8a1 1 0 011-1h3z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No interviews</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by scheduling your first interview.</p>
                <div className="mt-6">
                  <button
                    onClick={() => handleScheduleInterview()}
                    className="btn-primary"
                  >
                    Schedule Interview
                  </button>
                </div>
              </div>
            ) : (
              <div className="overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Interview
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date & Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Interviewers
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {interviews.map((interview) => (
                      <tr key={interview._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {interview.title}
                            </div>
                            <div className="text-sm text-gray-500">
                              {interview.interview_round}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDateTime(interview.scheduled_date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {interview.interview_type}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(interview.status)}`}>
                            {interview.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {interview.interviewer_names.join(', ')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleViewDetails(interview)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              View
                            </button>
                            {interview.status === 'scheduled' && (
                              <>
                                <button
                                  onClick={() => handleEditInterview(interview)}
                                  className="text-indigo-600 hover:text-indigo-900"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleCompleteInterview(interview)}
                                  className="text-green-600 hover:text-green-900"
                                >
                                  Complete
                                </button>
                                <button
                                  onClick={() => handleCancelInterview(interview)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  Cancel
                                </button>
                              </>
                            )}
                            {interview.status === 'completed' && !interview.feedback && (
                              <button
                                onClick={() => handleAddFeedback(interview)}
                                className="text-purple-600 hover:text-purple-900"
                              >
                                Add Feedback
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Modals */}
        {modalType && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {modalType === 'schedule' && 'Schedule Interview'}
                  {modalType === 'edit' && 'Edit Interview'}
                  {modalType === 'feedback' && 'Interview Feedback'}
                  {modalType === 'details' && 'Interview Details'}
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {modalType === 'schedule' && (
                <div>
                  {selectedSubmissionId ? (
                    <InterviewForm
                      submissionId={selectedSubmissionId}
                      onSubmit={handleModalSubmit}
                      onCancel={closeModal}
                    />
                  ) : (
                    <div className="space-y-4">
                      <p className="text-gray-600">Select a task submission to schedule an interview for:</p>
                      <div className="max-h-60 overflow-y-auto space-y-2">
                        {getAvailableSubmissions().map(submission => {
                          const job = jobs.find(j => j._id === submission.job_id);
                          return (
                            <div
                              key={submission._id}
                              className="p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
                              onClick={() => setSelectedSubmissionId(submission._id)}
                            >
                              <div className="font-medium text-gray-900">{job?.title}</div>
                              <div className="text-sm text-gray-600">
                                Candidate ID: {submission.candidate_id} • 
                                Status: {submission.status} • 
                                {submission.ai_evaluation && (
                                  <span>AI Score: {submission.ai_evaluation.overall_score.toFixed(1)}</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {getAvailableSubmissions().length === 0 && (
                        <p className="text-gray-500 text-center py-8">
                          No task submissions available for interview scheduling.
                          Submissions must be evaluated or reviewed first.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {modalType === 'edit' && selectedInterview && (
                <InterviewForm
                  interview={selectedInterview}
                  onSubmit={handleModalSubmit}
                  onCancel={closeModal}
                />
              )}

              {modalType === 'feedback' && selectedInterview && (
                <InterviewFeedbackForm
                  interview={selectedInterview}
                  onSubmit={handleModalSubmit}
                  onCancel={closeModal}
                />
              )}

              {modalType === 'details' && selectedInterview && (
                <div className="space-y-6">
                  {/* Interview Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Basic Information</h4>
                      <div className="space-y-2 text-sm">
                        <div><span className="font-medium">Title:</span> {selectedInterview.title}</div>
                        <div><span className="font-medium">Type:</span> {selectedInterview.interview_type}</div>
                        <div><span className="font-medium">Round:</span> {selectedInterview.interview_round}</div>
                        <div><span className="font-medium">Duration:</span> {selectedInterview.duration} minutes</div>
                        <div><span className="font-medium">Status:</span> 
                          <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedInterview.status)}`}>
                            {selectedInterview.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Scheduling</h4>
                      <div className="space-y-2 text-sm">
                        <div><span className="font-medium">Date:</span> {formatDateTime(selectedInterview.scheduled_date)}</div>
                        <div><span className="font-medium">Timezone:</span> {selectedInterview.timezone}</div>
                        <div><span className="font-medium">Interviewers:</span> {selectedInterview.interviewer_names.join(', ')}</div>
                        {selectedInterview.location && (
                          <div><span className="font-medium">Location:</span> {selectedInterview.location}</div>
                        )}
                        {selectedInterview.meeting_link && (
                          <div><span className="font-medium">Meeting Link:</span> 
                            <a href={selectedInterview.meeting_link} target="_blank" rel="noopener noreferrer" className="ml-1 text-blue-600 hover:text-blue-800">
                              Join Meeting
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {selectedInterview.description && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Description</h4>
                      <p className="text-sm text-gray-600">{selectedInterview.description}</p>
                    </div>
                  )}

                  {selectedInterview.feedback && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Feedback</h4>
                      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                        <div className="flex items-center">
                          <span className="text-sm font-medium">Overall Rating:</span>
                          <span className="ml-2 text-lg font-bold text-blue-600">
                            {selectedInterview.feedback.overall_rating}/5
                          </span>
                        </div>
                        
                        {selectedInterview.feedback.technical_assessment && (
                          <div>
                            <span className="text-sm font-medium">Technical Assessment:</span>
                            <p className="text-sm text-gray-600 mt-1">{selectedInterview.feedback.technical_assessment}</p>
                          </div>
                        )}
                        
                        {selectedInterview.feedback.behavioral_assessment && (
                          <div>
                            <span className="text-sm font-medium">Behavioral Assessment:</span>
                            <p className="text-sm text-gray-600 mt-1">{selectedInterview.feedback.behavioral_assessment}</p>
                          </div>
                        )}
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <span className="text-sm font-medium">Strengths:</span>
                            <ul className="text-sm text-gray-600 mt-1 list-disc list-inside">
                              {selectedInterview.feedback.strengths.map((strength, index) => (
                                <li key={index}>{strength}</li>
                              ))}
                            </ul>
                          </div>
                          
                          <div>
                            <span className="text-sm font-medium">Areas for Improvement:</span>
                            <ul className="text-sm text-gray-600 mt-1 list-disc list-inside">
                              {selectedInterview.feedback.areas_for_improvement.map((area, index) => (
                                <li key={index}>{area}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                        
                        <div className="flex items-center">
                          <span className="text-sm font-medium">Recommendation:</span>
                          <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${
                            selectedInterview.feedback.final_recommendation === 'hire' ? 'bg-green-100 text-green-800' :
                            selectedInterview.feedback.final_recommendation === 'no_hire' ? 'bg-red-100 text-red-800' :
                            selectedInterview.feedback.final_recommendation === 'maybe' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {selectedInterview.feedback.final_recommendation}
                          </span>
                        </div>
                        
                        {selectedInterview.feedback.next_steps && (
                          <div>
                            <span className="text-sm font-medium">Next Steps:</span>
                            <p className="text-sm text-gray-600 mt-1">{selectedInterview.feedback.next_steps}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {selectedInterview.notes && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Notes</h4>
                      <p className="text-sm text-gray-600">{selectedInterview.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </RecruiterLayout>
  );
};

export default Interviews;