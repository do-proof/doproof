import React, { useState } from 'react';
import { TeamMember, TeamMemberInvite } from '../../hooks/recruiter/useCompany';

interface TeamMemberManagementProps {
  teamMembers: TeamMember[];
  ownerId: string;
  currentUserId: string;
  onInviteMember: (invite: TeamMemberInvite) => Promise<void>;
  onUpdateMember: (userId: string, updates: { role?: string; permissions?: string[]; is_active?: boolean }) => Promise<any>;
  onRemoveMember: (userId: string) => Promise<any>;
  loading?: boolean;
}

const ROLE_OPTIONS = [
  { value: 'Owner', label: 'Owner', disabled: true },
  { value: 'Admin', label: 'Admin' },
  { value: 'HR Manager', label: 'HR Manager' },
  { value: 'Recruiter', label: 'Recruiter' },
  { value: 'Hiring Manager', label: 'Hiring Manager' },
  { value: 'Team Lead', label: 'Team Lead' },
  { value: 'Member', label: 'Member' },
];

const PERMISSION_OPTIONS = [
  { value: 'all', label: 'All Permissions', description: 'Full access to all features' },
  { value: 'manage_company', label: 'Manage Company', description: 'Edit company profile and settings' },
  { value: 'manage_team', label: 'Manage Team', description: 'Invite and manage team members' },
  { value: 'manage_jobs', label: 'Manage Jobs', description: 'Create and edit job postings' },
  { value: 'review_applications', label: 'Review Applications', description: 'Review and manage applications' },
  { value: 'schedule_interviews', label: 'Schedule Interviews', description: 'Schedule and manage interviews' },
  { value: 'view_analytics', label: 'View Analytics', description: 'Access recruitment analytics' },
  { value: 'manage_branding', label: 'Manage Branding', description: 'Update company branding' },
];

const TeamMemberManagement: React.FC<TeamMemberManagementProps> = ({
  teamMembers,
  ownerId,
  currentUserId,
  onInviteMember,
  onUpdateMember,
  onRemoveMember,
  loading = false,
}) => {
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [editingMember, setEditingMember] = useState<string | null>(null);
  const [inviteForm, setInviteForm] = useState<TeamMemberInvite>({
    email: '',
    role: 'Member',
    permissions: ['review_applications'],
    personal_message: '',
  });
  const [editForm, setEditForm] = useState<{
    role: string;
    permissions: string[];
    is_active: boolean;
  }>({
    role: '',
    permissions: [],
    is_active: true,
  });

  const isOwner = currentUserId === ownerId;
  const canManageTeam = isOwner || teamMembers.find(m => m.user_id === currentUserId)?.permissions.includes('all') || 
                        teamMembers.find(m => m.user_id === currentUserId)?.permissions.includes('manage_team');

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onInviteMember(inviteForm);
      setInviteForm({
        email: '',
        role: 'Member',
        permissions: ['review_applications'],
        personal_message: '',
      });
      setShowInviteForm(false);
    } catch (error) {
      console.error('Failed to invite member:', error);
    }
  };

  const handleEditMember = (member: TeamMember) => {
    setEditingMember(member.user_id);
    setEditForm({
      role: member.role,
      permissions: member.permissions,
      is_active: member.is_active,
    });
  };

  const handleUpdateSubmit = async (userId: string) => {
    try {
      await onUpdateMember(userId, editForm);
      setEditingMember(null);
    } catch (error) {
      console.error('Failed to update member:', error);
    }
  };

  const handleRemoveMember = async (userId: string, memberName: string) => {
    if (window.confirm(`Are you sure you want to remove ${memberName} from the team?`)) {
      try {
        await onRemoveMember(userId);
      } catch (error) {
        console.error('Failed to remove member:', error);
      }
    }
  };

  const togglePermission = (permission: string) => {
    if (showInviteForm) {
      setInviteForm(prev => ({
        ...prev,
        permissions: prev.permissions.includes(permission)
          ? prev.permissions.filter(p => p !== permission)
          : [...prev.permissions, permission],
      }));
    } else {
      setEditForm(prev => ({
        ...prev,
        permissions: prev.permissions.includes(permission)
          ? prev.permissions.filter(p => p !== permission)
          : [...prev.permissions, permission],
      }));
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Team Members</h3>
          <p className="text-sm text-gray-600 mt-1">
            Manage your team members and their permissions
          </p>
        </div>
        {canManageTeam && (
          <button
            onClick={() => setShowInviteForm(true)}
            className="btn-primary"
            disabled={loading}
          >
            Invite Member
          </button>
        )}
      </div>

      {/* Team Members List */}
      <div className="space-y-4">
        {teamMembers.map((member) => (
          <div
            key={member.user_id}
            className={`border rounded-lg p-4 ${
              !member.is_active ? 'bg-gray-50 opacity-75' : 'bg-white'
            }`}
          >
            {editingMember === member.user_id ? (
              /* Edit Form */
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Role
                    </label>
                    <select
                      value={editForm.role}
                      onChange={(e) => setEditForm(prev => ({ ...prev, role: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={member.user_id === ownerId}
                    >
                      {ROLE_OPTIONS.map(option => (
                        <option 
                          key={option.value} 
                          value={option.value}
                          disabled={option.disabled && member.user_id !== ownerId}
                        >
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id={`active-${member.user_id}`}
                      checked={editForm.is_active}
                      onChange={(e) => setEditForm(prev => ({ ...prev, is_active: e.target.checked }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      disabled={member.user_id === ownerId}
                    />
                    <label htmlFor={`active-${member.user_id}`} className="ml-2 block text-sm text-gray-900">
                      Active Member
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Permissions
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {PERMISSION_OPTIONS.map(permission => (
                      <div key={permission.value} className="flex items-start">
                        <input
                          type="checkbox"
                          id={`edit-${permission.value}-${member.user_id}`}
                          checked={editForm.permissions.includes(permission.value)}
                          onChange={() => togglePermission(permission.value)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
                          disabled={member.user_id === ownerId}
                        />
                        <div className="ml-2">
                          <label 
                            htmlFor={`edit-${permission.value}-${member.user_id}`} 
                            className="block text-sm font-medium text-gray-900"
                          >
                            {permission.label}
                          </label>
                          <p className="text-xs text-gray-600">{permission.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => handleUpdateSubmit(member.user_id)}
                    className="btn-primary"
                    disabled={loading}
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={() => setEditingMember(null)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              /* Display Mode */
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                        <span className="text-white font-medium text-sm">
                          {member.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-medium text-gray-900">
                          {member.name}
                        </h4>
                        {member.user_id === ownerId && (
                          <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                            Owner
                          </span>
                        )}
                        {!member.is_active && (
                          <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                            Inactive
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-4 mt-1">
                        <p className="text-sm text-gray-600">{member.email}</p>
                        <p className="text-sm text-gray-600">•</p>
                        <p className="text-sm text-gray-600">{member.role}</p>
                        <p className="text-sm text-gray-600">•</p>
                        <p className="text-sm text-gray-600">
                          Joined {formatDate(member.joined_at)}
                        </p>
                      </div>
                      <div className="mt-2">
                        <div className="flex flex-wrap gap-1">
                          {member.permissions.slice(0, 3).map(permission => (
                            <span
                              key={permission}
                              className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                            >
                              {PERMISSION_OPTIONS.find(p => p.value === permission)?.label || permission}
                            </span>
                          ))}
                          {member.permissions.length > 3 && (
                            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                              +{member.permissions.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {canManageTeam && member.user_id !== ownerId && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEditMember(member)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Edit
                    </button>
                    {isOwner && (
                      <button
                        onClick={() => handleRemoveMember(member.user_id, member.name)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                        disabled={loading}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Invite Form Modal */}
      {showInviteForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Invite Team Member</h3>
              <button
                onClick={() => setShowInviteForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleInviteSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="colleague@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role *
                  </label>
                  <select
                    required
                    value={inviteForm.role}
                    onChange={(e) => setInviteForm(prev => ({ ...prev, role: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {ROLE_OPTIONS.filter(option => !option.disabled).map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Permissions *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {PERMISSION_OPTIONS.map(permission => (
                    <div key={permission.value} className="flex items-start">
                      <input
                        type="checkbox"
                        id={`invite-${permission.value}`}
                        checked={inviteForm.permissions.includes(permission.value)}
                        onChange={() => togglePermission(permission.value)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
                      />
                      <div className="ml-2">
                        <label 
                          htmlFor={`invite-${permission.value}`} 
                          className="block text-sm font-medium text-gray-900"
                        >
                          {permission.label}
                        </label>
                        <p className="text-xs text-gray-600">{permission.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Personal Message (Optional)
                </label>
                <textarea
                  rows={3}
                  value={inviteForm.personal_message}
                  onChange={(e) => setInviteForm(prev => ({ ...prev, personal_message: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Add a personal message to the invitation..."
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowInviteForm(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={loading || inviteForm.permissions.length === 0}
                >
                  {loading ? 'Sending...' : 'Send Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamMemberManagement;