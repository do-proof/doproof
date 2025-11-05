import { useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';

export interface TaskSubmission {
  _id: string;
  job_id: string;
  candidate_id: string;
  status: 'in_progress' | 'submitted' | 'evaluated' | 'reviewed' | 'shortlisted' | 'rejected';
  started_at: string;
  submitted_at?: string;
  time_spent: number; // in minutes
  
  // Submission content
  submission: {
    type: 'text' | 'file' | 'code' | 'presentation';
    content?: string; // for text/code submissions
    file_url?: string; // for file submissions
    file_name?: string;
    file_size?: number;
  };
  
  // AI Evaluation results
  ai_evaluation?: {
    overall_score: number; // 0-100
    criteria_scores: {
      critical_thinking: number;
      problem_solving: number;
      creativity: number;
      technical_skills: number;
      communication: number;
      attention_to_detail: number;
    };
    feedback: string;
    evaluated_at: string;
    evaluation_model: string;
  };
  
  // Recruiter review
  recruiter_review?: {
    rating: number; // 1-5 stars
    notes: string;
    decision: 'shortlist' | 'reject' | 'pending';
    reviewed_at: string;
    reviewed_by: string;
  };
  
  // Basic application info
  cover_letter?: string;
  resume_url?: string;
  
  // Candidate info (populated)
  candidate?: {
    _id: string;
    name: string;
    email: string;
    profile_picture?: string;
  };
  
  // Job info (populated)
  job?: {
    _id: string;
    title: string;
    task: {
      title: string;
      time_limit: number;
    };
  };
  
  created_at: string;
  updated_at: string;
}

export interface TaskSubmissionFilters {
  job_id?: string;
  status?: string;
  min_score?: number;
  max_score?: number;
  criteria?: string;
  search?: string;
  date_from?: string;
  date_to?: string;
}

export interface TaskSubmissionListResponse {
  submissions: TaskSubmission[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export const useTaskSubmissions = () => {
  const [submissions, setSubmissions] = useState<TaskSubmission[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 20,
    total: 0,
    total_pages: 0
  });
  const { user } = useAuth();

  const MAX_RETRY_ATTEMPTS = 3;
  const RETRY_DELAY = 1000;

  const buildQueryString = (filters: TaskSubmissionFilters, page: number = 1, per_page: number = 20) => {
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

  const fetchSubmissions = useCallback(async (filters: TaskSubmissionFilters = {}, page: number = 1, per_page: number = 20, attempt: number = 0) => {
    const token = localStorage.getItem('token');
    if (!user || !token) {
      setError('Authentication required');
      return;
    }
    
    setLoading(true);
    if (attempt === 0) {
      setError(null);
      setRetryCount(0);
    }
    
    try {
      const queryString = buildQueryString(filters, page, per_page);
      const response = await fetch(`http://localhost:8000/task-submissions?${queryString}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed. Please log in again.');
        }
        if (response.status === 403) {
          throw new Error('Access denied. You do not have permission to view submissions.');
        }
        if (response.status >= 500 && attempt < MAX_RETRY_ATTEMPTS) {
          throw new Error('RETRY_NEEDED');
        }
        throw new Error(`Failed to fetch submissions: ${response.statusText}`);
      }

      const data: TaskSubmissionListResponse = await response.json();
      setSubmissions(data.submissions);
      setPagination({
        page: data.page,
        per_page: data.per_page,
        total: data.total,
        total_pages: data.total_pages
      });
      setRetryCount(0);
    } catch (err) {
      if (err instanceof Error && err.message === 'RETRY_NEEDED' && attempt < MAX_RETRY_ATTEMPTS) {
        setRetryCount(attempt + 1);
        setTimeout(() => {
          fetchSubmissions(filters, page, per_page, attempt + 1);
        }, RETRY_DELAY * Math.pow(2, attempt));
        return;
      }
      
      setError(err instanceof Error ? err.message : 'Failed to fetch submissions');
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  }, [user, MAX_RETRY_ATTEMPTS, RETRY_DELAY]);

  const updateSubmissionStatus = async (submissionId: string, status: TaskSubmission['status']) => {
    const token = localStorage.getItem('token');
    if (!user || !token) return false;
    
    try {
      const response = await fetch(`http://localhost:8000/task-submissions/${submissionId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update submission status: ${response.statusText}`);
      }

      const updatedSubmission: TaskSubmission = await response.json();
      setSubmissions(prevSubmissions => 
        prevSubmissions.map(submission => 
          submission._id === submissionId ? updatedSubmission : submission
        )
      );
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update submission status');
      return false;
    }
  };

  const addRecruiterReview = async (submissionId: string, review: {
    rating: number;
    notes: string;
    decision: 'shortlist' | 'reject' | 'pending';
  }) => {
    const token = localStorage.getItem('token');
    if (!user || !token) return false;
    
    try {
      const response = await fetch(`http://localhost:8000/task-submissions/${submissionId}/review`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(review),
      });

      if (!response.ok) {
        throw new Error(`Failed to add review: ${response.statusText}`);
      }

      const updatedSubmission: TaskSubmission = await response.json();
      setSubmissions(prevSubmissions => 
        prevSubmissions.map(submission => 
          submission._id === submissionId ? updatedSubmission : submission
        )
      );
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add review');
      return false;
    }
  };

  const bulkUpdateStatus = async (submissionIds: string[], status: TaskSubmission['status']) => {
    const results = await Promise.allSettled(
      submissionIds.map(submissionId => updateSubmissionStatus(submissionId, status))
    );
    
    const successful = results.filter(result => result.status === 'fulfilled' && result.value).length;
    return { successful, total: submissionIds.length };
  };

  const getSubmission = async (submissionId: string): Promise<TaskSubmission | null> => {
    const token = localStorage.getItem('token');
    if (!user || !token) return null;
    
    try {
      const response = await fetch(`http://localhost:8000/task-submissions/${submissionId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch submission');
      }

      const submission: TaskSubmission = await response.json();
      return submission;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch submission');
      return null;
    }
  };

  // Utility functions
  const getSubmissionById = useCallback((submissionId: string) => {
    return submissions.find(submission => submission._id === submissionId) || null;
  }, [submissions]);

  const getSubmissionsByStatus = useCallback((status: TaskSubmission['status']) => {
    return submissions.filter(submission => submission.status === status);
  }, [submissions]);

  const getSubmissionsByJob = useCallback((jobId: string) => {
    return submissions.filter(submission => submission.job_id === jobId);
  }, [submissions]);

  const getSubmissionsStats = useCallback(() => {
    const stats = {
      total: submissions.length,
      in_progress: 0,
      submitted: 0,
      evaluated: 0,
      reviewed: 0,
      shortlisted: 0,
      rejected: 0,
      averageScore: 0,
      totalWithScores: 0
    };

    let totalScore = 0;
    let scoredSubmissions = 0;

    submissions.forEach(submission => {
      stats[submission.status]++;
      if (submission.ai_evaluation?.overall_score) {
        totalScore += submission.ai_evaluation.overall_score;
        scoredSubmissions++;
      }
    });

    stats.averageScore = scoredSubmissions > 0 ? totalScore / scoredSubmissions : 0;
    stats.totalWithScores = scoredSubmissions;

    return stats;
  }, [submissions]);

  const refreshSubmissions = useCallback(() => {
    if (pagination.page && pagination.per_page) {
      fetchSubmissions({}, pagination.page, pagination.per_page);
    }
  }, [fetchSubmissions, pagination.page, pagination.per_page]);

  const retryLastOperation = useCallback(() => {
    refreshSubmissions();
  }, [refreshSubmissions]);

  return {
    submissions,
    loading,
    error,
    retryCount,
    pagination,
    fetchSubmissions,
    updateSubmissionStatus,
    addRecruiterReview,
    bulkUpdateStatus,
    getSubmission,
    // Utility functions
    getSubmissionById,
    getSubmissionsByStatus,
    getSubmissionsByJob,
    getSubmissionsStats,
    refreshSubmissions,
    retryLastOperation,
    clearError: () => setError(null)
  };
};