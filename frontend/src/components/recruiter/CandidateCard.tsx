import React from 'react';
import { CandidateProfile } from '../../hooks/recruiter/useCandidates';

interface CandidateCardProps {
  candidate: CandidateProfile;
  onViewProfile: (candidateId: string) => void;
  onMessage: (candidateId: string) => void;
  onInvite: (candidateId: string) => void;
  onSelect?: (candidateId: string, selected: boolean) => void;
  isSelected?: boolean;
  showActions?: boolean;
}

const CandidateCard: React.FC<CandidateCardProps> = ({
  candidate,
  onViewProfile,
  onMessage,
  onInvite,
  onSelect,
  isSelected = false,
  showActions = true
}) => {
  const getScoreColor = (score?: number) => {
    if (!score) return 'text-gray-400';
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score?: number) => {
    if (!score) return 'bg-gray-100';
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const getExperienceLevel = (years?: number) => {
    if (!years) return 'Entry level';
    if (years < 1) return 'Entry level';
    if (years < 3) return 'Junior';
    if (years < 5) return 'Mid-level';
    if (years < 10) return 'Senior';
    return 'Expert';
  };

  const formatSalaryRange = (salary?: { min: number; max: number; currency: string }) => {
    if (!salary) return 'Not specified';
    return `${salary.currency} ${salary.min.toLocaleString()} - ${salary.max.toLocaleString()}`;
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow ${
      isSelected ? 'ring-2 ring-blue-500 border-blue-200' : 'border-gray-200'
    }`}>
      {/* Header with selection checkbox */}
      {onSelect && (
        <div className="px-4 pt-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => onSelect(candidate._id, e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-600">Select for comparison</span>
          </label>
        </div>
      )}

      <div className="p-4">
        {/* Profile Header */}
        <div className="flex items-start space-x-4 mb-4">
          {/* Profile Picture */}
          <div className="flex-shrink-0">
            {candidate.profile_picture ? (
              <img
                src={candidate.profile_picture}
                alt={candidate.name}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gray-300 flex items-center justify-center">
                <span className="text-gray-600 font-medium text-xl">
                  {candidate.name.charAt(0)}
                </span>
              </div>
            )}
          </div>

          {/* Basic Info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {candidate.name}
            </h3>
            {candidate.title && (
              <p className="text-sm text-gray-600 truncate">{candidate.title}</p>
            )}
            <div className="flex items-center mt-1 text-sm text-gray-500">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {candidate.location || 'Location not specified'}
            </div>
          </div>

          {/* Score Badge */}
          {candidate.average_score && (
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreBgColor(candidate.average_score)} ${getScoreColor(candidate.average_score)}`}>
              {candidate.average_score.toFixed(1)}
            </div>
          )}
        </div>

        {/* Bio */}
        {candidate.bio && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
            {candidate.bio}
          </p>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-xs text-gray-500">Experience</p>
            <p className="text-sm font-medium text-gray-900">
              {getExperienceLevel(candidate.experience_years)}
              {candidate.experience_years && ` (${candidate.experience_years}y)`}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Availability</p>
            <p className="text-sm font-medium text-gray-900 capitalize">
              {candidate.availability?.replace('_', ' ') || 'Not specified'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Tasks Completed</p>
            <p className="text-sm font-medium text-gray-900">
              {candidate.completed_tasks} / {candidate.total_submissions}
              {candidate.total_submissions > 0 && (
                <span className="text-xs text-gray-500 ml-1">
                  ({candidate.task_completion_rate.toFixed(0)}%)
                </span>
              )}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Profile Complete</p>
            <div className="flex items-center">
              <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${candidate.profile_completeness}%` }}
                ></div>
              </div>
              <span className="text-xs text-gray-600">
                {candidate.profile_completeness.toFixed(0)}%
              </span>
            </div>
          </div>
        </div>

        {/* Skills */}
        {candidate.skills && candidate.skills.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-2">Skills</p>
            <div className="flex flex-wrap gap-1">
              {candidate.skills.slice(0, 4).map((skill, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                >
                  {skill}
                </span>
              ))}
              {candidate.skills.length > 4 && (
                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                  +{candidate.skills.length - 4} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Salary Expectation */}
        {candidate.salary_expectation && (
          <div className="mb-4">
            <p className="text-xs text-gray-500">Salary Expectation</p>
            <p className="text-sm font-medium text-gray-900">
              {formatSalaryRange(candidate.salary_expectation)}
            </p>
          </div>
        )}

        {/* External Links */}
        <div className="flex items-center space-x-4 mb-4">
          {candidate.portfolio_url && (
            <a
              href={candidate.portfolio_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-sm text-blue-600 hover:text-blue-800"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Portfolio
            </a>
          )}
          {candidate.github_url && (
            <a
              href={candidate.github_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-sm text-gray-600 hover:text-gray-800"
            >
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              GitHub
            </a>
          )}
        </div>

        {/* Actions */}
        {showActions && (
          <div className="flex space-x-2">
            <button
              onClick={() => onViewProfile(candidate._id)}
              className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              View Profile
            </button>
            <button
              onClick={() => onMessage(candidate._id)}
              className="px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Message
            </button>
            <button
              onClick={() => onInvite(candidate._id)}
              className="px-3 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Invite
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CandidateCard;