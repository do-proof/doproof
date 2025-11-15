import React, { useState } from 'react';
import { useStudentProfile, useProfileCompleteness, useUpdateProfileSection } from '../../hooks/student/useStudentProfile';
import { PersonalInfoForm } from '../../components/student/ProfileForm';
import { SkillsForm } from '../../components/student/ProfileForm';
import { ExperienceForm } from '../../components/student/ProfileForm';
import { PreferencesForm } from '../../components/student/ProfileForm';
import { PortfolioForm } from '../../components/student/ProfileForm';
import { NotificationPreferencesForm } from '../../components/student/ProfileForm';
import { PrivacySettingsForm } from '../../components/student/ProfileForm';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import { ProfilePageSkeleton } from '../../components/student/StudentPageSkeletons';

const StudentProfile: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'personal' | 'skills' | 'experience' | 'preferences' | 'portfolio' | 'notifications' | 'privacy'>('personal');
  const [editingSection, setEditingSection] = useState<string | null>(null);

  const { 
    data: profile, 
    isLoading: profileLoading, 
    error: profileError,
    refetch: refetchProfile
  } = useStudentProfile();

  const { 
    data: completenessAnalysis, 
    isLoading: completenessLoading 
  } = useProfileCompleteness();

  const profileUpdater = useUpdateProfileSection();

  if (profileLoading && !profile) {
    return <ProfilePageSkeleton />;
  }

  if (profileError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <ErrorMessage
          title="Failed to Load Profile"
          message="We couldn't load your profile information. Please try again."
          onRetry={refetchProfile}
        />
      </div>
    );
  }

  const tabs = [
    { id: 'personal', label: 'Personal Info', icon: '👤' },
    { id: 'skills', label: 'Skills', icon: '🎯' },
    { id: 'experience', label: 'Experience', icon: '💼' },
    { id: 'preferences', label: 'Preferences', icon: '⚙️' },
    { id: 'portfolio', label: 'Portfolio', icon: '🔗' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'privacy', label: 'Privacy', icon: '🔒' },
  ];

  const getCompletenessColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    if (score >= 40) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getCompletenessLabel = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Very Good';
    if (score >= 70) return 'Good';
    if (score >= 60) return 'Fair';
    if (score >= 40) return 'Needs Improvement';
    return 'Incomplete';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
                <p className="mt-2 text-gray-600">
                  Manage your profile information and preferences
                </p>
              </div>
              
              {/* Profile Completeness */}
              {profile && (
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Profile Completeness</div>
                    <div className={`text-lg font-semibold ${getCompletenessColor(profile.profile_completeness).split(' ')[0]}`}>
                      {profile.profile_completeness.toFixed(0)}% - {getCompletenessLabel(profile.profile_completeness)}
                    </div>
                  </div>
                  <div className="relative w-16 h-16">
                    <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-gray-200"
                        stroke="currentColor"
                        strokeWidth="3"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className={getCompletenessColor(profile.profile_completeness).split(' ')[0]}
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeDasharray={`${profile.profile_completeness}, 100`}
                        strokeLinecap="round"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-semibold text-gray-700">
                        {profile.profile_completeness.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <nav className="space-y-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-lg">{tab.icon}</span>
                    <span className="font-medium">{tab.label}</span>
                  </button>
                ))}
              </nav>

              {/* Completeness Suggestions */}
              {completenessAnalysis && completenessAnalysis.suggestions.length > 0 && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="text-sm font-medium text-blue-900 mb-2">💡 Quick Improvements</h3>
                  <ul className="text-xs text-blue-700 space-y-1">
                    {completenessAnalysis.suggestions.slice(0, 3).map((suggestion, index) => (
                      <li key={index}>• {suggestion}</li>
                    ))}
                  </ul>
                  {completenessAnalysis.suggestions.length > 3 && (
                    <p className="text-xs text-blue-600 mt-2">
                      +{completenessAnalysis.suggestions.length - 3} more suggestions
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              {profile && (
                <>
                  {activeTab === 'personal' && (
                    <PersonalInfoForm
                      personalInfo={profile.personal_info}
                      onSave={profileUpdater.updatePersonalInfo}
                      isLoading={profileUpdater.isLoading}
                      isEditing={editingSection === 'personal'}
                      onEdit={() => setEditingSection('personal')}
                      onCancel={() => setEditingSection(null)}
                    />
                  )}

                  {activeTab === 'skills' && (
                    <SkillsForm
                      skills={profile.skills}
                      onSave={profileUpdater.updateSkills}
                      isLoading={profileUpdater.isLoading}
                      isEditing={editingSection === 'skills'}
                      onEdit={() => setEditingSection('skills')}
                      onCancel={() => setEditingSection(null)}
                    />
                  )}

                  {activeTab === 'experience' && (
                    <ExperienceForm
                      experience={profile.experience}
                      onSave={profileUpdater.updateExperience}
                      isLoading={profileUpdater.isLoading}
                      isEditing={editingSection === 'experience'}
                      onEdit={() => setEditingSection('experience')}
                      onCancel={() => setEditingSection(null)}
                    />
                  )}

                  {activeTab === 'preferences' && (
                    <PreferencesForm
                      preferences={profile.preferences}
                      onSave={profileUpdater.updatePreferences}
                      isLoading={profileUpdater.isLoading}
                      isEditing={editingSection === 'preferences'}
                      onEdit={() => setEditingSection('preferences')}
                      onCancel={() => setEditingSection(null)}
                    />
                  )}

                  {activeTab === 'portfolio' && (
                    <PortfolioForm
                      portfolio={profile.portfolio}
                      onSave={profileUpdater.updatePortfolio}
                      isLoading={profileUpdater.isLoading}
                      isEditing={editingSection === 'portfolio'}
                      onEdit={() => setEditingSection('portfolio')}
                      onCancel={() => setEditingSection(null)}
                    />
                  )}

                  {activeTab === 'notifications' && (
                    <NotificationPreferencesForm
                      preferences={profile.notification_preferences}
                      onSave={profileUpdater.updateNotificationPreferences}
                      isLoading={profileUpdater.isLoading}
                      isEditing={editingSection === 'notifications'}
                      onEdit={() => setEditingSection('notifications')}
                      onCancel={() => setEditingSection(null)}
                    />
                  )}

                  {activeTab === 'privacy' && (
                    <PrivacySettingsForm
                      settings={profile.privacy_settings}
                      onSave={profileUpdater.updatePrivacySettings}
                      isLoading={profileUpdater.isLoading}
                      isEditing={editingSection === 'privacy'}
                      onEdit={() => setEditingSection('privacy')}
                      onCancel={() => setEditingSection(null)}
                    />
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentProfile;