import { useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api, ApiError } from '../../utils/api';
import { useNotifications } from '../../context/NotificationContext';

export interface Job {
  _id: string;
  title: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  salary: {
    min: number;
    max: number;
    currency: string;
  };
  location: {
    type: 'remote' | 'onsite' | 'hybrid';
    city?: string;
    country?: string;
  };
  employment_type: 'full-time' | 'part-time' | 'contract' | 'internship';
  status: 'draft' | 'active' | 'paused' | 'closed';
  posted_date: string;
  closing_date?: string;
  task: {
    title: string;
    description: string;
    instructions: string;
    time_limit: number;
    submission_format: 'text' | 'file' | 'code' | 'presentation';
    max_file_size?: number;
    allowed_file_types?: string[];
  };
  evaluation_criteria: {
    critical_thinking: number;
    problem_solving: number;
    creativity: number;
    technical_skills: number;
    communication: number;
    attention_to_detail: number;
  };
  application_count: number;
  submission_count: number;
  view_count: number;
  company_id: string;
  recruiter_id: string;
  created_at: string;
  updated_at: string;
}

export interface JobFilters {
  status?: string;
  employment_type?: string;
  location_type?: string;
  city?: string;
  country?: string;
  min_salary?: number;
  max_salary?: number;
  search?: string;
}

export interface JobListResponse {
  jobs: Job[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export const useJobs = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 10,
    total: 0,
    total_pages: 0
  });
  const { user } = useAuth();
  const { showError, showSuccess } = useNotifications();

  const MAX_RETRY_ATTEMPTS = 3;
  const RETRY_DELAY = 1000;

  const buildQueryString = (filters: JobFilters, page: number = 1, per_page: number = 10) => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('per_page', per_page.toString());
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });
    
    return params.toString();
  };

  const fetchJobs = useCallback(async (filters: JobFilters = {}, page: number = 1, per_page: number = 10) => {
    if (!user) {
      setError({ message: 'Authentication required', status: 401, code: 'AUTH_REQUIRED' });
      return;
    }
    
    setLoading(true);
    setError(null);
    
    const queryString = buildQueryString(filters, page, per_page);
    const response = await api.get<JobListResponse>(`/jobs?${queryString}`);
    
    if (response.success && response.data) {
      setJobs(response.data.jobs);
      setPagination({
        page: response.data.page,
        per_page: response.data.per_page,
        total: response.data.total,
        total_pages: response.data.total_pages
      });
      setRetryCount(0);
    } else if (response.error) {
      setError(response.error);
      setJobs([]);
      
      // Show user-friendly error notification
      if (response.error.status === 401) {
        showError('Please log in to view jobs', 'Authentication Required');
      } else if (response.error.status === 403) {
        showError('You do not have permission to view jobs', 'Access Denied');
      } else if (response.error.status >= 500) {
        showError('Server error. Please try again later.', 'Service Unavailable');
      } else {
        showError(response.error.message, 'Error Loading Jobs');
      }
    }
    
    setLoading(false);
  }, [user, showError]);

  const updateJobStatus = async (jobId: string, status: Job['status']) => {
    if (!user) return false;
    
    const response = await api.patch<Job>(`/jobs/${jobId}/status`, { status });
    
    if (response.success && response.data) {
      setJobs(prevJobs => 
        prevJobs.map(job => 
          job._id === jobId ? response.data! : job
        )
      );
      
      showSuccess(`Job status updated to ${status}`, 'Success');
      return true;
    } else if (response.error) {
      setError(response.error);
      showError(response.error.message, 'Failed to Update Job Status');
      return false;
    }
    
    return false;
  };

  const deleteJob = async (jobId: string) => {
    if (!user) return false;
    
    const response = await api.delete(`/jobs/${jobId}`);
    
    if (response.success) {
      setJobs(prevJobs => prevJobs.filter(job => job._id !== jobId));
      showSuccess('Job deleted successfully', 'Success');
      return true;
    } else if (response.error) {
      setError(response.error);
      showError(response.error.message, 'Failed to Delete Job');
      return false;
    }
    
    return false;
  };

  const bulkUpdateStatus = async (jobIds: string[], status: Job['status']) => {
    const results = await Promise.allSettled(
      jobIds.map(jobId => updateJobStatus(jobId, status))
    );
    
    const successful = results.filter(result => result.status === 'fulfilled' && result.value).length;
    return { successful, total: jobIds.length };
  };

  const createJob = async (jobData: Omit<Job, '_id' | 'created_at' | 'updated_at' | 'application_count' | 'submission_count' | 'view_count'>) => {
    if (!user) return null;
    
    const response = await api.post<Job>('/jobs', jobData);
    
    if (response.success && response.data) {
      setJobs(prevJobs => [response.data!, ...prevJobs]);
      showSuccess('Job created successfully', 'Success');
      return response.data;
    } else if (response.error) {
      setError(response.error);
      
      if (response.error.code === 'VALIDATION_ERROR' && response.error.details) {
        const validationErrors = response.error.details.map((err: any) => err.message).join(', ');
        showError(`Validation failed: ${validationErrors}`, 'Invalid Job Data');
      } else {
        showError(response.error.message, 'Failed to Create Job');
      }
      return null;
    }
    
    return null;
  };

  const updateJob = async (jobId: string, jobData: Partial<Job>) => {
    if (!user) return null;
    
    const response = await api.put<Job>(`/jobs/${jobId}`, jobData);
    
    if (response.success && response.data) {
      setJobs(prevJobs => 
        prevJobs.map(job => 
          job._id === jobId ? response.data! : job
        )
      );
      showSuccess('Job updated successfully', 'Success');
      return response.data;
    } else if (response.error) {
      setError(response.error);
      
      if (response.error.code === 'VALIDATION_ERROR' && response.error.details) {
        const validationErrors = response.error.details.map((err: any) => err.message).join(', ');
        showError(`Validation failed: ${validationErrors}`, 'Invalid Job Data');
      } else {
        showError(response.error.message, 'Failed to Update Job');
      }
      return null;
    }
    
    return null;
  };

  const getJob = async (jobId: string): Promise<Job | null> => {
    if (!user) return null;
    
    const response = await api.get<Job>(`/jobs/${jobId}`);
    
    if (response.success && response.data) {
      return response.data;
    } else if (response.error) {
      setError(response.error);
      showError(response.error.message, 'Failed to Load Job');
      return null;
    }
    
    return null;
  };

  // Utility functions
  const getJobById = useCallback((jobId: string) => {
    return jobs.find(job => job._id === jobId) || null;
  }, [jobs]);

  const getJobsByStatus = useCallback((status: Job['status']) => {
    return jobs.filter(job => job.status === status);
  }, [jobs]);

  const getJobsStats = useCallback(() => {
    const stats = {
      total: jobs.length,
      draft: 0,
      active: 0,
      paused: 0,
      closed: 0,
      totalApplications: 0,
      totalSubmissions: 0,
      totalViews: 0
    };

    jobs.forEach(job => {
      stats[job.status]++;
      stats.totalApplications += job.application_count;
      stats.totalSubmissions += job.submission_count;
      stats.totalViews += job.view_count;
    });

    return stats;
  }, [jobs]);

  const refreshJobs = useCallback(() => {
    if (pagination.page && pagination.per_page) {
      fetchJobs({}, pagination.page, pagination.per_page);
    }
  }, [fetchJobs, pagination.page, pagination.per_page]);

  const retryLastOperation = useCallback(() => {
    refreshJobs();
  }, [refreshJobs]);

  return {
    jobs,
    loading,
    error,
    retryCount,
    pagination,
    fetchJobs,
    createJob,
    updateJob,
    getJob,
    updateJobStatus,
    deleteJob,
    bulkUpdateStatus,
    // Utility functions
    getJobById,
    getJobsByStatus,
    getJobsStats,
    refreshJobs,
    retryLastOperation,
    clearError: () => setError(null)
  };
};