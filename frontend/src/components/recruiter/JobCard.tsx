import React from 'react';
import { Job } from '../../hooks/recruiter/useJobs';

interface JobCardProps {
  job: Job;
  isSelected?: boolean;
  onSelect?: (jobId: string) => void;
  onStatusChange?: (jobId: string, status: Job['status']) => void;
  onEdit?: (jobId: string) => void;
  onDelete?: (jobId: string) => void;
  onViewDetails?: (jobId: string) => void;
}

const JobCard: React.FC<JobCardProps> = ({
  job,
  isSelected = false,
  onSelect,
  onStatusChange,
  onEdit,
  onDelete,
  onViewDetails
}) => {
  const getStatusColor = (status: Job['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'closed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getLocationDisplay = () => {
    const { type, city, country } = job.location;
    if (type === 'remote') return 'Remote';
    if (city && country) return `${city}, ${country}`;
    if (city) return city;
    if (country) return country;
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const getSalaryDisplay = () => {
    const { min, max, currency } = job.salary;
    return `${currency} ${min.toLocaleString()} - ${max.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDaysPosted = () => {
    const postedDate = new Date(job.posted_date);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - postedDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getTaskTimeDisplay = () => {
    const minutes = job.task.time_limit;
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border-2 transition-all duration-200 hover:shadow-md ${
      isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
    }`}>
      <div className="p-6">
        {/* Header with checkbox and status */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start space-x-3">
            {onSelect && (
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onSelect(job._id)}
                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            )}
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {job.title}
              </h3>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span>{job.employment_type.replace('-', ' ')}</span>
                <span>•</span>
                <span>{getLocationDisplay()}</span>
                <span>•</span>
                <span>{getSalaryDisplay()}</span>
              </div>
            </div>
          </div>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
            {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
          </span>
        </div>

        {/* Task Information */}
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-900">Task: {job.task.title}</h4>
            <div className="flex items-center space-x-2 text-xs text-gray-600">
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                {job.task.submission_format}
              </span>
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                {getTaskTimeDisplay()}
              </span>
            </div>
          </div>
          <p className="text-sm text-gray-600 line-clamp-2">
            {job.task.description}
          </p>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{job.view_count}</div>
            <div className="text-xs text-gray-500">Views</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{job.application_count}</div>
            <div className="text-xs text-gray-500">Applications</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{job.submission_count}</div>
            <div className="text-xs text-gray-500">Submissions</div>
          </div>
        </div>

        {/* Footer with dates and actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-500">
            {job.status === 'draft' ? (
              `Created ${formatDate(job.created_at)}`
            ) : (
              `Posted ${getDaysPosted()} days ago`
            )}
            {job.closing_date && (
              <span className="ml-2">
                • Closes {formatDate(job.closing_date)}
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Status Change Dropdown */}
            {onStatusChange && (
              <select
                value={job.status}
                onChange={(e) => onStatusChange(job._id, e.target.value as Job['status'])}
                className="text-xs border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="closed">Closed</option>
              </select>
            )}
            
            {/* Action Buttons */}
            <div className="flex items-center space-x-1">
              {onViewDetails && (
                <button
                  onClick={() => onViewDetails(job._id)}
                  className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                  title="View Details"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
              )}
              
              {onEdit && (
                <button
                  onClick={() => onEdit(job._id)}
                  className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                  title="Edit Job"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              )}
              
              {onDelete && job.application_count === 0 && (
                <button
                  onClick={() => onDelete(job._id)}
                  className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                  title="Delete Job"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobCard;