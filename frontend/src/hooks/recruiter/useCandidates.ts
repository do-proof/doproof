import { useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';

export interface CandidateProfile {
  _id: string;
  name: string;
  email: string;
  bio?: string;
  title?: string;
  location?: string;
  skills: string[];
  experience_years?: number;
  remote_preference?: 'remote' | 'onsite' | 'hybrid';
  availability?: 'available' | 'not_available' | 'open_to_offers';
  salary_expectation?: {
    min: number;
    max: number;
    currency: string;
  };
  portfolio_url?: string;
  github_url?: string;
  profile_picture?: string;
  joined_date: string;
  last_active?: string;
  
  // DoProof-specific metrics
  total_submissions: number;
  completed_tasks: number;
  average_score?: number;
  best_score?: number;
  task_completion_rate: number;
  profile_completeness: number;
}

export interface CandidateFilters {
  skills?: string[];
  experience_min?: number;
  experience_max?: number;
  location?: string;
  remote_preference?: string;
  availability?: string;
  min_salary?: number;
  max_salary?: number;
  min_score?: number;
  max_score?: number;
  min_completeness?: number;
  has_portfolio?: boolean;
  has_github?: boolean;
  search_query?: string;
}

export interface CandidateListResponse {
  candidates: CandidateProfile[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface CandidateMessage {
  recipient_id: string;
  subject: string;
  message: string;
  job_id?: string;
  include_job_details?: boolean;
}

export interface CandidateInvitation {
  candidate_ids: string[];
  job_id: string;
  personal_message?: string;
  send_immediately?: boolean;
}

export interface CandidateShortlist {
  name: string;
  description?: string;
  candidate_ids: string[];
  job_id?: string;
}

export interface CandidateComparison {
  candidate_ids: string[];
  comparison_criteria: string[];
}

export const useCandidates = () => {
  const [candidates, setCandidates] = useState<CandidateProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 12,
    total: 0,
    total_pages: 0
  });
  const { user } = useAuth();

  const MAX_RETRY_ATTEMPTS = 3;
  const RETRY_DELAY = 1000;

  const buildQueryString = (filters: CandidateFilters, page: number = 1, per_page: number = 12) => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('per_page', per_page.toString());
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          value.forEach(v => params.append(key, v.toString()));
        } else {
          params.append(key, value.toString());
        }
      }
    });
    
    return params.toString();
  };

  const searchCandidates = async (filters: CandidateFilters = {}, page: number = 1, per_page: number = 12) => {
    const token = localStorage.getItem('token');
    if (!user || !token) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const queryString = buildQueryString(filters, page, per_page);
      const response = await fetch(`http://localhost:8000/candidates?${queryString}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch candidates: ${response.statusText}`);
      }

      const data: CandidateListResponse = await response.json();
      setCandidates(data.candidates);
      setPagination({
        page: data.page,
        per_page: data.per_page,
        total: data.total,
        total_pages: data.total_pages
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch candidates');
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  };

  const getCandidateProfile = async (candidateId: string): Promise<CandidateProfile | null> => {
    const token = localStorage.getItem('token');
    if (!user || !token) return null;
    
    try {
      const response = await fetch(`http://localhost:8000/candidates/${candidateId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch candidate profile');
      }

      const candidate: CandidateProfile = await response.json();
      return candidate;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch candidate profile');
      return null;
    }
  };

  const sendMessage = async (messageData: CandidateMessage) => {
    const token = localStorage.getItem('token');
    if (!user || !token) return false;
    
    try {
      const response = await fetch('http://localhost:8000/candidates/message', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to send message');
      }

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
      return false;
    }
  };

  const inviteCandidates = async (invitation: CandidateInvitation) => {
    const token = localStorage.getItem('token');
    if (!user || !token) return false;
    
    try {
      const response = await fetch('http://localhost:8000/candidates/invite', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invitation),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to send invitations');
      }

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invitations');
      return false;
    }
  };

  const createShortlist = async (shortlist: CandidateShortlist) => {
    const token = localStorage.getItem('token');
    if (!user || !token) return null;
    
    try {
      const response = await fetch('http://localhost:8000/candidates/shortlists', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(shortlist),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create shortlist');
      }

      const newShortlist = await response.json();
      return newShortlist;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create shortlist');
      return null;
    }
  };

  const compareCandidates = async (comparison: CandidateComparison) => {
    const token = localStorage.getItem('token');
    if (!user || !token) return null;
    
    try {
      const response = await fetch('http://localhost:8000/candidates/compare', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(comparison),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to compare candidates');
      }

      const comparisonResult = await response.json();
      return comparisonResult;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to compare candidates');
      return null;
    }
  };

  // Utility functions
  const getCandidateById = useCallback((candidateId: string) => {
    return candidates.find(candidate => candidate._id === candidateId) || null;
  }, [candidates]);

  const getCandidatesBySkill = useCallback((skill: string) => {
    return candidates.filter(candidate => 
      candidate.skills.some(s => s.toLowerCase().includes(skill.toLowerCase()))
    );
  }, [candidates]);

  const getCandidatesStats = useCallback(() => {
    const stats = {
      total: candidates.length,
      available: 0,
      not_available: 0,
      open_to_offers: 0,
      averageScore: 0,
      averageCompleteness: 0,
      withPortfolio: 0,
      withGithub: 0
    };

    let totalScore = 0;
    let totalCompleteness = 0;
    let candidatesWithScore = 0;

    candidates.forEach(candidate => {
      if (candidate.availability) {
        stats[candidate.availability]++;
      }
      if (candidate.average_score) {
        totalScore += candidate.average_score;
        candidatesWithScore++;
      }
      totalCompleteness += candidate.profile_completeness;
      if (candidate.portfolio_url) stats.withPortfolio++;
      if (candidate.github_url) stats.withGithub++;
    });

    stats.averageScore = candidatesWithScore > 0 ? totalScore / candidatesWithScore : 0;
    stats.averageCompleteness = candidates.length > 0 ? totalCompleteness / candidates.length : 0;

    return stats;
  }, [candidates]);

  const refreshCandidates = useCallback(() => {
    if (pagination.page && pagination.per_page) {
      searchCandidates({}, pagination.page, pagination.per_page);
    }
  }, [searchCandidates, pagination.page, pagination.per_page]);

  const retryLastOperation = useCallback(() => {
    refreshCandidates();
  }, [refreshCandidates]);

  return {
    candidates,
    loading,
    error,
    retryCount,
    pagination,
    searchCandidates,
    getCandidateProfile,
    sendMessage,
    inviteCandidates,
    createShortlist,
    compareCandidates,
    // Utility functions
    getCandidateById,
    getCandidatesBySkill,
    getCandidatesStats,
    refreshCandidates,
    retryLastOperation,
    clearError: () => setError(null)
  };
};