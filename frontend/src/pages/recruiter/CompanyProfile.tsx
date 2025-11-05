import React, { useState, useEffect } from 'react';
import RecruiterLayout from '../../components/recruiter/RecruiterLayout';
import CompanyForm from '../../components/recruiter/CompanyForm';
import TeamMemberManagement from '../../components/recruiter/TeamMemberManagement';
import CompanyPreview from '../../components/recruiter/CompanyPreview';
import { useCompany, CompanyCreate, CompanyUpdate } from '../../hooks/recruiter/useCompany';

type TabType = 'profile' | 'team' | 'settings' | 'preview';

const CompanyProfile: React.FC = () => {
  const {
    company,
    loading,
    error,
    createCompanyProfile,
    updateCompanyProfile,
    inviteTeamMember,
    updateTeamMember,
    removeTeamMember,
  } = useCompany();

  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [showPreview, setShowPreview] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');

  useEffect(() => {
    // Get current user ID from localStorage or auth context
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      setCurrentUserId(user._id || user.id || '');
    }
  }, []);

  const handleFormSubmit = async (data: CompanyCreate | CompanyUpdate) => {
    try {
      if (company) {
        await updateCompanyProfile(data as CompanyUpdate);
      } else {
        await createCompanyProfile(data as CompanyCreate);
      }
    } catch (error) {
      console.error('Failed to save company profile:', error);
    }
  };

  const tabs = [
    { id: 'profile' as TabType, name: 'Company Profile', icon: '🏢' },
    { id: 'team' as TabType, name: 'Team Management', icon: '👥' },
    { id: 'settings' as TabType, name: 'Settings', icon: '⚙️' },
  ];

  if (error && !company) {
    return (
      <RecruiterLayout pageTitle="Company Profile">
        <div className="space-y-6">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error Loading Company Profile</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </RecruiterLayout>
    );
  }

  return (
    <RecruiterLayout pageTitle="Company Profile">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Company Profile</h1>
            <p className="text-gray-600 mt-1">
              {company 
                ? 'Manage your company information, team, and settings' 
                : 'Create your company profile to get started'
              }
            </p>
          </div>
          {company && (
            <div className="flex space-x-3">
              <button
                onClick={() => setShowPreview(true)}
                className="btn-secondary"
              >
                Preview Profile
              </button>
              {company.is_verified && (
                <span className="inline-flex items-center px-3 py-2 rounded-md text-sm font-medium bg-green-100 text-green-800">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Verified Company
                </span>
              )}
            </div>
          )}
        </div>

        {company ? (
          <>
            {/* Tabs */}
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <span className="mr-2">{tab.icon}</span>
                    {tab.name}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="mt-6">
              {activeTab === 'profile' && (
                <CompanyForm
                  company={company}
                  onSubmit={handleFormSubmit}
                  loading={loading}
                />
              )}

              {activeTab === 'team' && (
                <TeamMemberManagement
                  teamMembers={company.team_members}
                  ownerId={company.owner_id}
                  currentUserId={currentUserId}
                  onInviteMember={inviteTeamMember}
                  onUpdateMember={updateTeamMember}
                  onRemoveMember={removeTeamMember}
                  loading={loading}
                />
              )}

              {activeTab === 'settings' && (
                <div className="space-y-6">
                  {/* Recruitment Settings */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Recruitment Settings</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Auto-reject applications after (days)
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="365"
                          value={company.recruitment_settings.auto_reject_after_days || ''}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Leave empty to disable"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Default task time limit (minutes)
                        </label>
                        <input
                          type="number"
                          min="15"
                          max="480"
                          value={company.recruitment_settings.default_task_time_limit}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="mt-6 space-y-4">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="require_cover_letter"
                          checked={company.recruitment_settings.require_cover_letter}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="require_cover_letter" className="ml-2 block text-sm text-gray-900">
                          Require cover letter for all applications
                        </label>
                      </div>

                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="require_portfolio"
                          checked={company.recruitment_settings.require_portfolio}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="require_portfolio" className="ml-2 block text-sm text-gray-900">
                          Require portfolio for all applications
                        </label>
                      </div>

                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="enable_ai_screening"
                          checked={company.recruitment_settings.enable_ai_screening}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="enable_ai_screening" className="ml-2 block text-sm text-gray-900">
                          Enable AI-powered candidate screening
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Notification Preferences */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Preferences</h3>
                    <div className="space-y-4">
                      {Object.entries(company.recruitment_settings.notification_preferences).map(([key, value]) => {
                        const label = key.split('_').map(word => 
                          word.charAt(0).toUpperCase() + word.slice(1)
                        ).join(' ');
                        
                        return (
                          <div key={key} className="flex items-center">
                            <input
                              type="checkbox"
                              id={`notification_${key}`}
                              checked={value}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label htmlFor={`notification_${key}`} className="ml-2 block text-sm text-gray-900">
                              {label}
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Default Evaluation Criteria */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Default AI Evaluation Criteria</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Set default weights for AI evaluation criteria. These will be used as defaults when creating new job postings.
                    </p>
                    <div className="space-y-4">
                      {Object.entries(company.recruitment_settings.default_evaluation_criteria).map(([key, value]) => {
                        const label = key.split('_').map(word => 
                          word.charAt(0).toUpperCase() + word.slice(1)
                        ).join(' ');
                        
                        return (
                          <div key={key}>
                            <div className="flex items-center justify-between mb-2">
                              <label className="block text-sm font-medium text-gray-700">
                                {label}
                              </label>
                              <span className="text-sm text-gray-600">{value}%</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="50"
                              value={value}
                              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                            />
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-4 p-3 bg-blue-50 rounded-md">
                      <p className="text-sm text-blue-800">
                        Total: {Object.values(company.recruitment_settings.default_evaluation_criteria).reduce((sum, val) => sum + val, 0)}%
                        {Object.values(company.recruitment_settings.default_evaluation_criteria).reduce((sum, val) => sum + val, 0) !== 100 && (
                          <span className="text-red-600 ml-2">
                            (Should total 100%)
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Company Statistics */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Company Statistics</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-blue-600">{company.total_jobs_posted}</div>
                        <div className="text-sm text-gray-600">Total Jobs Posted</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-green-600">{company.total_applications_received}</div>
                        <div className="text-sm text-gray-600">Applications Received</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-purple-600">{company.total_hires}</div>
                        <div className="text-sm text-gray-600">Successful Hires</div>
                      </div>
                    </div>
                  </div>

                  {/* Danger Zone */}
                  <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
                    <h3 className="text-lg font-medium text-red-900 mb-4">Danger Zone</h3>
                    <p className="text-sm text-red-700 mb-4">
                      These actions are irreversible. Please proceed with caution.
                    </p>
                    <div className="space-y-3">
                      {!company.is_verified && (
                        <button className="btn-secondary text-blue-600 border-blue-300 hover:bg-blue-50">
                          Request Company Verification
                        </button>
                      )}
                      <button className="btn-secondary text-red-600 border-red-300 hover:bg-red-50">
                        Delete Company Profile
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          /* Create Company Profile */
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Create Company Profile</h2>
              <p className="text-sm text-gray-600 mt-1">
                Set up your company profile to start posting jobs and managing candidates.
              </p>
            </div>
            <div className="p-6">
              <CompanyForm
                onSubmit={handleFormSubmit}
                loading={loading}
              />
            </div>
          </div>
        )}

        {/* Preview Modal */}
        {showPreview && company && (
          <CompanyPreview
            company={company}
            onClose={() => setShowPreview(false)}
          />
        )}
      </div>
    </RecruiterLayout>
  );
};

export default CompanyProfile;