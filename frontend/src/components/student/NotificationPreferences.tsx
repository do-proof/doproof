import React, { useState } from 'react';
import { useStudentProfile, useUpdateProfileSection } from '../../hooks/student/useStudentProfile';
import { useNotifications } from '../../context/NotificationContext';
import LoadingSpinner from '../LoadingSpinner';

interface NotificationPreferencesProps {
  className?: string;
}

const NotificationPreferences: React.FC<NotificationPreferencesProps> = ({ className = '' }) => {
  const [isLoading, setIsLoading] = useState(false);
  
  const { data: profile, isLoading: profileLoading } = useStudentProfile();
  const { updateNotificationPreferences } = useUpdateProfileSection();
  const { showSuccess, showError } = useNotifications();

  const preferences = profile?.notification_preferences || {
    email_notifications: true,
    push_notifications: true,
    deadline_reminders: true,
    evaluation_results: true,
    recruiter_updates: true,
    new_recommendations: true
  };

  const handleToggle = async (key: keyof typeof preferences) => {
    setIsLoading(true);
    
    try {
      const updatedPreferences = {
        ...preferences,
        [key]: !preferences[key]
      };
      
      await updateNotificationPreferences(updatedPreferences);
      showSuccess('Notification preferences updated');
    } catch (error) {
      showError('Failed to update notification preferences');
    } finally {
      setIsLoading(false);
    }
  };

  const ToggleSwitch: React.FC<{ 
    enabled: boolean; 
    onChange: () => void; 
    disabled?: boolean;
  }> = ({ enabled, onChange, disabled = false }) => (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
        enabled ? 'bg-blue-600' : 'bg-gray-200'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );

  if (profileLoading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <LoadingSpinner size="md" />
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Notification Preferences</h3>
            <p className="text-sm text-gray-600">Manage how you receive notifications</p>
          </div>
          {isLoading && <LoadingSpinner size="sm" />}
        </div>

        <div className="space-y-6">
          {/* Email Notifications */}
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h4 className="text-sm font-medium text-gray-900">Email Notifications</h4>
              <p className="text-sm text-gray-500">Receive notifications via email</p>
            </div>
            <ToggleSwitch
              enabled={preferences.email_notifications ?? true}
              onChange={() => handleToggle('email_notifications')}
              disabled={isLoading}
            />
          </div>

          {/* Push Notifications */}
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h4 className="text-sm font-medium text-gray-900">Browser Notifications</h4>
              <p className="text-sm text-gray-500">Receive real-time browser notifications</p>
            </div>
            <ToggleSwitch
              enabled={preferences.push_notifications ?? true}
              onChange={() => handleToggle('push_notifications')}
              disabled={isLoading}
            />
          </div>

          <hr className="border-gray-200" />

          {/* Specific Notification Types */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-900">Notification Types</h4>
            
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h5 className="text-sm font-medium text-gray-800">Deadline Reminders</h5>
                <p className="text-xs text-gray-500">Get reminded about task deadlines</p>
              </div>
              <ToggleSwitch
                enabled={preferences.deadline_reminders ?? true}
                onChange={() => handleToggle('deadline_reminders')}
                disabled={isLoading}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h5 className="text-sm font-medium text-gray-800">Evaluation Results</h5>
                <p className="text-xs text-gray-500">Notifications when AI evaluation is complete</p>
              </div>
              <ToggleSwitch
                enabled={preferences.evaluation_results ?? true}
                onChange={() => handleToggle('evaluation_results')}
                disabled={isLoading}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h5 className="text-sm font-medium text-gray-800">Recruiter Updates</h5>
                <p className="text-xs text-gray-500">Updates from recruiters about your applications</p>
              </div>
              <ToggleSwitch
                enabled={preferences.recruiter_updates ?? true}
                onChange={() => handleToggle('recruiter_updates')}
                disabled={isLoading}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h5 className="text-sm font-medium text-gray-800">New Recommendations</h5>
                <p className="text-xs text-gray-500">Notifications about new recommended tasks</p>
              </div>
              <ToggleSwitch
                enabled={preferences.new_recommendations ?? true}
                onChange={() => handleToggle('new_recommendations')}
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Browser Permission Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">Browser Notifications</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>
                    To receive real-time notifications, please allow browser notifications when prompted. 
                    You can manage this in your browser settings.
                  </p>
                </div>
                <div className="mt-3">
                  <button
                    onClick={() => {
                      if ('Notification' in window) {
                        Notification.requestPermission().then(permission => {
                          if (permission === 'granted') {
                            showSuccess('Browser notifications enabled');
                          } else {
                            showError('Browser notifications denied');
                          }
                        });
                      }
                    }}
                    className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-md hover:bg-blue-200 transition-colors"
                  >
                    Enable Browser Notifications
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationPreferences;