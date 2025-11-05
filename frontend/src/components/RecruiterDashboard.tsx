import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import RecruiterLayout from './recruiter/RecruiterLayout';
import { useJobs } from '../hooks/recruiter/useJobs';
import { useTaskSubmissions } from '../hooks/recruiter/useTaskSubmissions';
import { useInterviews } from '../hooks/recruiter/useInterviews';
import { useAnalytics } from '../hooks/recruiter/useAnalytics';

interface DashboardSettings {
  showWelcome: boolean;
  showQuickStats: boolean;
  showRecentActivity: boolean;
  showUrgentItems: boolean;
  cardLayout: 'grid' | 'list';
}

const RecruiterDashboard: React.FC = () => {
  const { user } = useAuth();
  const { jobs, fetchJobs } = useJobs();
  const { submissions, fetchSubmissions } = useTaskSubmissions();
  const { interviews, fetchInterviews } = useInterviews();
  const { metrics, fetchAnalytics } = useAnalytics();
  
  const [settings, setSettings] = useState<DashboardSettings>({
    showWelcome: true,
    showQuickStats: true,
    showRecentActivity: true,
    showUrgentItems: true,
    cardLayout: 'grid'
  });
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    // Load dashboard settings from localStorage
    const savedSettings = localStorage.getItem('dashboardSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }

    // Fetch initial data
    fetchJobs({ status: 'active' }, 1, 5);
    fetchSubmissions({ status: 'submitted' }, 1, 5);
    fetchInterviews({}, 1, 5);
    fetchAnalytics();
  }, [fetchJobs, fetchSubmissions, fetchInterviews, fetchAnalytics]);

  const updateSettings = (newSettings: Partial<DashboardSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    localStorage.setItem('dashboardSettings', JSON.stringify(updatedSettings));
  };

  // Calculate metrics from data
  const activeJobs = jobs.filter(job => job.status === 'active').length;
  const totalSubmissions = submissions.length;
  const upcomingInterviews = interviews.filter(interview => 
    new Date(interview.scheduled_date) > new Date() && interview.status === 'scheduled'
  ).length;
  const totalCandidates = metrics?.top_candidates?.length || 0;

  // Urgent items calculation
  const urgentItems = [
    ...jobs.filter(job => {
      const closingDate = job.closing_date ? new Date(job.closing_date) : null;
      const daysUntilClosing = closingDate ? Math.ceil((closingDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null;
      return daysUntilClosing !== null && daysUntilClosing <= 3 && daysUntilClosing > 0;
    }).map(job => ({
      type: 'job_closing' as const,
      title: `Job "${job.title}" closes soon`,
      description: `Closes in ${Math.ceil((new Date(job.closing_date!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days`,
      priority: 'high' as const,
      link: `/recruiter/jobs/${job._id}`
    })),
    ...submissions.filter(submission => {
      const submittedDate = new Date(submission.submitted_at || submission.created_at);
      const daysSinceSubmission = Math.floor((new Date().getTime() - submittedDate.getTime()) / (1000 * 60 * 60 * 24));
      return submission.status === 'submitted' && daysSinceSubmission >= 3;
    }).map(submission => ({
      type: 'pending_review' as const,
      title: `Task submission needs review`,
      description: `From ${submission.candidate?.name || 'Unknown'} - ${Math.floor((new Date().getTime() - new Date(submission.submitted_at || submission.created_at).getTime()) / (1000 * 60 * 60 * 24))} days old`,
      priority: 'medium' as const,
      link: `/recruiter/submissions/${submission._id}`
    })),
    ...interviews.filter(interview => {
      const interviewDate = new Date(interview.scheduled_date);
      const hoursUntilInterview = (interviewDate.getTime() - new Date().getTime()) / (1000 * 60 * 60);
      return hoursUntilInterview <= 24 && hoursUntilInterview > 0 && interview.status === 'scheduled';
    }).map(interview => ({
      type: 'upcoming_interview' as const,
      title: `Interview in ${Math.ceil((new Date(interview.scheduled_date).getTime() - new Date().getTime()) / (1000 * 60 * 60))} hours`,
      description: `With candidate for ${interview.title || 'Unknown position'}`,
      priority: 'high' as const,
      link: `/recruiter/interviews/${interview._id}`
    }))
  ];

  // Recent activity
  const recentActivity = [
    ...submissions.slice(0, 3).map(submission => ({
      type: 'submission' as const,
      title: `New task submission`,
      description: `${submission.candidate?.name || 'Unknown'} submitted for ${submission.job?.title || 'Unknown job'}`,
      time: submission.submitted_at || submission.created_at,
      link: `/recruiter/submissions/${submission._id}`
    })),
    ...interviews.slice(0, 2).map(interview => ({
      type: 'interview' as const,
      title: `Interview scheduled`,
      description: `${interview.interview_type} interview for ${interview.title || 'Unknown position'}`,
      time: interview.created_at,
      link: `/recruiter/interviews/${interview._id}`
    }))
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 5);

  return (
    <RecruiterLayout pageTitle="Dashboard">
      <div className="space-y-8">
        {/* Dashboard Settings Button */}
        <div className="flex justify-end">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Customize
          </button>
        </div>

        {/* Dashboard Settings Panel */}
        {showSettings && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Dashboard Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-700">Show Sections</h4>
                {[
                  { key: 'showWelcome', label: 'Welcome Message' },
                  { key: 'showQuickStats', label: 'Quick Statistics' },
                  { key: 'showRecentActivity', label: 'Recent Activity' },
                  { key: 'showUrgentItems', label: 'Urgent Items' }
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings[key as keyof DashboardSettings] as boolean}
                      onChange={(e) => updateSettings({ [key]: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    />
                    <span className="ml-2 text-sm text-gray-700">{label}</span>
                  </label>
                ))}
              </div>
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-700">Layout</h4>
                <div className="space-y-2">
                  {[
                    { value: 'grid', label: 'Grid Layout' },
                    { value: 'list', label: 'List Layout' }
                  ].map(({ value, label }) => (
                    <label key={value} className="flex items-center">
                      <input
                        type="radio"
                        name="cardLayout"
                        value={value}
                        checked={settings.cardLayout === value}
                        onChange={(e) => updateSettings({ cardLayout: e.target.value as 'grid' | 'list' })}
                        className="border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                      />
                      <span className="ml-2 text-sm text-gray-700">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Welcome Section */}
        {settings.showWelcome && (
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
            <h2 className="text-2xl font-bold mb-2">Welcome back, {user?.email}!</h2>
            <p className="text-blue-100">Find the best talent and manage your recruitment process efficiently.</p>
          </div>
        )}

        {/* Urgent Items */}
        {settings.showUrgentItems && urgentItems.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <svg className="h-5 w-5 text-red-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <h3 className="text-lg font-medium text-red-800">Urgent Items ({urgentItems.length})</h3>
            </div>
            <div className="space-y-3">
              {urgentItems.slice(0, 3).map((item, index) => (
                <Link
                  key={index}
                  to={item.link}
                  className="block p-3 bg-white rounded-lg border border-red-200 hover:border-red-300 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-red-800">{item.title}</p>
                      <p className="text-sm text-red-600">{item.description}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      item.priority === 'high' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {item.priority}
                    </span>
                  </div>
                </Link>
              ))}
              {urgentItems.length > 3 && (
                <p className="text-sm text-red-600 text-center">
                  And {urgentItems.length - 3} more urgent items...
                </p>
              )}
            </div>
          </div>
        )}

        {/* Quick Stats */}
        {settings.showQuickStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <span className="text-blue-600 text-xl">📝</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Jobs</p>
                  <p className="text-2xl font-bold text-gray-900">{activeJobs}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <span className="text-green-600 text-xl">📋</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Submissions</p>
                  <p className="text-2xl font-bold text-gray-900">{totalSubmissions}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <span className="text-purple-600 text-xl">🎤</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Interviews</p>
                  <p className="text-2xl font-bold text-gray-900">{upcomingInterviews}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <span className="text-orange-600 text-xl">👥</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Candidates</p>
                  <p className="text-2xl font-bold text-gray-900">{totalCandidates}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Activity */}
        {settings.showRecentActivity && recentActivity.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <Link
                  key={index}
                  to={activity.link}
                  className="flex items-center p-3 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className={`p-2 rounded-full mr-3 ${
                    activity.type === 'submission' ? 'bg-green-100' : 'bg-blue-100'
                  }`}>
                    <span className={`text-sm ${
                      activity.type === 'submission' ? 'text-green-600' : 'text-blue-600'
                    }`}>
                      {activity.type === 'submission' ? '📋' : '🎤'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{activity.title}</p>
                    <p className="text-sm text-gray-600">{activity.description}</p>
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(activity.time).toLocaleDateString()}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Dashboard Grid */}
        <div className={`${settings.cardLayout === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}`}>
          {/* Job Postings Card */}
          <Link to="/recruiter/jobs" className={`bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow group ${
            settings.cardLayout === 'list' ? 'flex items-center' : ''
          }`}>
            <div className={`flex items-center ${settings.cardLayout === 'list' ? 'flex-1' : 'mb-4'}`}>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-xl font-bold group-hover:bg-blue-200 transition-colors">
                📝
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">Job Postings</h3>
                <p className="text-sm text-gray-600">Manage your listings</p>
              </div>
            </div>
            {settings.cardLayout === 'grid' && (
              <>
                <p className="text-gray-600 text-sm mb-4">Create and manage job postings with task definitions.</p>
                <div className="text-blue-600 text-sm font-medium group-hover:text-blue-700">
                  Manage Jobs →
                </div>
              </>
            )}
            {settings.cardLayout === 'list' && (
              <div className="ml-4 text-blue-600 text-sm font-medium group-hover:text-blue-700">
                {activeJobs} active →
              </div>
            )}
          </Link>

          {/* Task Submissions Card */}
          <Link to="/recruiter/submissions" className={`bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow group ${
            settings.cardLayout === 'list' ? 'flex items-center' : ''
          }`}>
            <div className={`flex items-center ${settings.cardLayout === 'list' ? 'flex-1' : 'mb-4'}`}>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 text-xl font-bold group-hover:bg-purple-200 transition-colors">
                📋
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">Task Submissions</h3>
                <p className="text-sm text-gray-600">Review AI evaluations</p>
              </div>
            </div>
            {settings.cardLayout === 'grid' && (
              <>
                <p className="text-gray-600 text-sm mb-4">Review candidate task submissions and AI scores.</p>
                <div className="text-purple-600 text-sm font-medium group-hover:text-purple-700">
                  Review Submissions →
                </div>
              </>
            )}
            {settings.cardLayout === 'list' && (
              <div className="ml-4 text-purple-600 text-sm font-medium group-hover:text-purple-700">
                {totalSubmissions} submissions →
              </div>
            )}
          </Link>

          {/* Candidates Card */}
          <Link to="/recruiter/candidates" className={`bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow group ${
            settings.cardLayout === 'list' ? 'flex items-center' : ''
          }`}>
            <div className={`flex items-center ${settings.cardLayout === 'list' ? 'flex-1' : 'mb-4'}`}>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-xl font-bold group-hover:bg-green-200 transition-colors">
                👥
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-green-600 transition-colors">Candidates</h3>
                <p className="text-sm text-gray-600">Browse talent pool</p>
              </div>
            </div>
            {settings.cardLayout === 'grid' && (
              <>
                <p className="text-gray-600 text-sm mb-4">Discover and connect with qualified candidates.</p>
                <div className="text-green-600 text-sm font-medium group-hover:text-green-700">
                  Browse Candidates →
                </div>
              </>
            )}
            {settings.cardLayout === 'list' && (
              <div className="ml-4 text-green-600 text-sm font-medium group-hover:text-green-700">
                {totalCandidates} candidates →
              </div>
            )}
          </Link>

          {/* Interviews Card */}
          <Link to="/recruiter/interviews" className={`bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow group ${
            settings.cardLayout === 'list' ? 'flex items-center' : ''
          }`}>
            <div className={`flex items-center ${settings.cardLayout === 'list' ? 'flex-1' : 'mb-4'}`}>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 text-xl font-bold group-hover:bg-orange-200 transition-colors">
                🎤
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-orange-600 transition-colors">Interviews</h3>
                <p className="text-sm text-gray-600">Schedule meetings</p>
              </div>
            </div>
            {settings.cardLayout === 'grid' && (
              <>
                <p className="text-gray-600 text-sm mb-4">Schedule and manage candidate interviews.</p>
                <div className="text-orange-600 text-sm font-medium group-hover:text-orange-700">
                  Manage Interviews →
                </div>
              </>
            )}
            {settings.cardLayout === 'list' && (
              <div className="ml-4 text-orange-600 text-sm font-medium group-hover:text-orange-700">
                {upcomingInterviews} upcoming →
              </div>
            )}
          </Link>

          {/* Analytics Card */}
          <Link to="/recruiter/analytics" className={`bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow group ${
            settings.cardLayout === 'list' ? 'flex items-center' : ''
          }`}>
            <div className={`flex items-center ${settings.cardLayout === 'list' ? 'flex-1' : 'mb-4'}`}>
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 text-xl font-bold group-hover:bg-indigo-200 transition-colors">
                📊
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">Analytics</h3>
                <p className="text-sm text-gray-600">Track performance</p>
              </div>
            </div>
            {settings.cardLayout === 'grid' && (
              <>
                <p className="text-gray-600 text-sm mb-4">Monitor recruitment metrics and task performance.</p>
                <div className="text-indigo-600 text-sm font-medium group-hover:text-indigo-700">
                  View Analytics →
                </div>
              </>
            )}
            {settings.cardLayout === 'list' && (
              <div className="ml-4 text-indigo-600 text-sm font-medium group-hover:text-indigo-700">
                View Reports →
              </div>
            )}
          </Link>

          {/* Company Profile Card */}
          <Link to="/recruiter/company" className={`bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow group ${
            settings.cardLayout === 'list' ? 'flex items-center' : ''
          }`}>
            <div className={`flex items-center ${settings.cardLayout === 'list' ? 'flex-1' : 'mb-4'}`}>
              <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center text-pink-600 text-xl font-bold group-hover:bg-pink-200 transition-colors">
                🏢
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-pink-600 transition-colors">Company</h3>
                <p className="text-sm text-gray-600">Manage profile</p>
              </div>
            </div>
            {settings.cardLayout === 'grid' && (
              <>
                <p className="text-gray-600 text-sm mb-4">Update your company information and branding.</p>
                <div className="text-pink-600 text-sm font-medium group-hover:text-pink-700">
                  Edit Company →
                </div>
              </>
            )}
            {settings.cardLayout === 'list' && (
              <div className="ml-4 text-pink-600 text-sm font-medium group-hover:text-pink-700">
                Manage Profile →
              </div>
            )}
          </Link>
        </div>
      </div>
    </RecruiterLayout>
  );
};

export default RecruiterDashboard; 