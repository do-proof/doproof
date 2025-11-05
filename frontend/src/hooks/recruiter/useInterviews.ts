import { useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';

export interface Interview {
  _id: string;
  submission_id: string;
  job_id: string;
  candidate_id: string;
  recruiter_id: string;
  title: string;
  description?: string;
  interview_type: 'phone' | 'video' | 'onsite';
  interview_round: 'screening' | 'technical' | 'behavioral' | 'final' | 'culture_fit';
  scheduled_date: string;
  duration: number;
  timezone: string;
  location?: string;
  meeting_link?: string;
  meeting_id?: string;
  phone_number?: string;
  interviewers: string[];
  interviewer_names: string[];
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled' | 'no_show';
  feedback?: InterviewFeedback;
  notes?: string;
  original_date?: string;
  reschedule_reason?: string;
  reschedule_count: number;
  reminder_sent: boolean;
  confirmation_sent: boolean;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface InterviewFeedback {
  overall_rating: number;
  technical_assessment?: string;
  behavioral_assessment?: string;
  strengths: string[];
  areas_for_improvement: string[];
  interviewer_feedbacks: InterviewerFeedback[];
  final_recommendation: 'hire' | 'no_hire' | 'maybe' | 'pending';
  next_steps?: string;
}

export interface InterviewerFeedback {
  interviewer_id: string;
  interviewer_name: string;
  technical_score?: number;
  communication_score?: number;
  culture_fit_score?: number;
  overall_rating?: number;
  notes?: string;
  recommendation?: 'hire' | 'no_hire' | 'maybe' | 'pending';
  submitted_at: string;
}

export interface InterviewFilters {
  job_id?: string;
  candidate_id?: string;
  interview_type?: string;
  interview_round?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
}

export interface InterviewListResponse {
  interviews: Interview[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface InterviewCreate {
  submission_id: string;
  title: string;
  description?: string;
  interview_type: 'phone' | 'video' | 'onsite';
  interview_round?: 'screening' | 'technical' | 'behavioral' | 'final' | 'culture_fit';
  scheduled_date: string;
  duration: number;
  timezone?: string;
  location?: string;
  meeting_link?: string;
  meeting_id?: string;
  phone_number?: string;
  interviewers?: string[];
  interviewer_names?: string[];
  notes?: string;
}

export interface InterviewUpdate {
  title?: string;
  description?: string;
  interview_type?: 'phone' | 'video' | 'onsite';
  interview_round?: 'screening' | 'technical' | 'behavioral' | 'final' | 'culture_fit';
  scheduled_date?: string;
  duration?: number;
  timezone?: string;
  location?: string;
  meeting_link?: string;
  meeting_id?: string;
  phone_number?: string;
  interviewers?: string[];
  interviewer_names?: string[];
  status?: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled' | 'no_show';
  notes?: string;
}

export interface InterviewCalendarDay {
  date: string;
  interviews: Interview[];
  total_duration: number;
  conflicts: any[];
}

export interface InterviewStats {
  total_interviews: number;
  by_status: Record<string, number>;
  by_type: Record<string, number>;
  by_round: Record<string, number>;
  average_duration?: number;
  completion_rate: number;
  reschedule_rate: number;
  no_show_rate: number;
}

export const useInterviews = () => {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 10,
    total: 0,
    total_pages: 0
  });
  const { user } = useAuth();

  const MAX_RETRY_ATTEMPTS = 3;
  const RETRY_DELAY = 1000;

  const buildQueryString = (filters: InterviewFilters, page: number = 1, per_page: number = 10) => {
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

  const fetchInterviews = async (filters: InterviewFilters = {}, page: number = 1, per_page: number = 10) => {
    const token = localStorage.getItem('token');
    if (!user || !token) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const queryString = buildQueryString(filters, page, per_page);
      const response = await fetch(`http://localhost:8000/interviews?${queryString}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch interviews: ${response.statusText}`);
      }

      const data: InterviewListResponse = await response.json();
      setInterviews(data.interviews);
      setPagination({
        page: data.page,
        per_page: data.per_page,
        total: data.total,
        total_pages: data.total_pages
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch interviews');
      setInterviews([]);
    } finally {
      setLoading(false);
    }
  };

  const getInterview = async (interviewId: string): Promise<Interview | null> => {
    const token = localStorage.getItem('token');
    if (!user || !token) return null;
    
    try {
      const response = await fetch(`http://localhost:8000/interviews/${interviewId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch interview');
      }

      const interview: Interview = await response.json();
      return interview;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch interview');
      return null;
    }
  };

  const createInterview = async (interviewData: InterviewCreate): Promise<Interview | null> => {
    const token = localStorage.getItem('token');
    if (!user || !token) return null;
    
    try {
      const response = await fetch('http://localhost:8000/interviews', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(interviewData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create interview');
      }

      const newInterview: Interview = await response.json();
      setInterviews(prevInterviews => [newInterview, ...prevInterviews]);
      return newInterview;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create interview');
      return null;
    }
  };

  const updateInterview = async (interviewId: string, interviewData: InterviewUpdate): Promise<Interview | null> => {
    const token = localStorage.getItem('token');
    if (!user || !token) return null;
    
    try {
      const response = await fetch(`http://localhost:8000/interviews/${interviewId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(interviewData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update interview');
      }

      const updatedInterview: Interview = await response.json();
      setInterviews(prevInterviews => 
        prevInterviews.map(interview => 
          interview._id === interviewId ? updatedInterview : interview
        )
      );
      return updatedInterview;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update interview');
      return null;
    }
  };

  const rescheduleInterview = async (interviewId: string, newDate: string, reason: string): Promise<Interview | null> => {
    const token = localStorage.getItem('token');
    if (!user || !token) return null;
    
    try {
      const response = await fetch(`http://localhost:8000/interviews/${interviewId}/reschedule`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          new_scheduled_date: newDate,
          reason: reason,
          notify_participants: true
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to reschedule interview');
      }

      const updatedInterview: Interview = await response.json();
      setInterviews(prevInterviews => 
        prevInterviews.map(interview => 
          interview._id === interviewId ? updatedInterview : interview
        )
      );
      return updatedInterview;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reschedule interview');
      return null;
    }
  };

  const completeInterview = async (interviewId: string): Promise<Interview | null> => {
    const token = localStorage.getItem('token');
    if (!user || !token) return null;
    
    try {
      const response = await fetch(`http://localhost:8000/interviews/${interviewId}/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to complete interview');
      }

      const updatedInterview: Interview = await response.json();
      setInterviews(prevInterviews => 
        prevInterviews.map(interview => 
          interview._id === interviewId ? updatedInterview : interview
        )
      );
      return updatedInterview;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete interview');
      return null;
    }
  };

  const cancelInterview = async (interviewId: string): Promise<boolean> => {
    const token = localStorage.getItem('token');
    if (!user || !token) return false;
    
    try {
      const response = await fetch(`http://localhost:8000/interviews/${interviewId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to cancel interview: ${response.statusText}`);
      }

      setInterviews(prevInterviews => 
        prevInterviews.map(interview => 
          interview._id === interviewId 
            ? { ...interview, status: 'cancelled' as const }
            : interview
        )
      );
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel interview');
      return false;
    }
  };

  const addFeedback = async (interviewId: string, feedback: Omit<InterviewFeedback, 'interviewer_feedbacks'>): Promise<Interview | null> => {
    const token = localStorage.getItem('token');
    if (!user || !token) return null;
    
    try {
      const response = await fetch(`http://localhost:8000/interviews/${interviewId}/feedback`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(feedback),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to add feedback');
      }

      const updatedInterview: Interview = await response.json();
      setInterviews(prevInterviews => 
        prevInterviews.map(interview => 
          interview._id === interviewId ? updatedInterview : interview
        )
      );
      return updatedInterview;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add feedback');
      return null;
    }
  };

  const getCalendarDay = async (date: string): Promise<InterviewCalendarDay | null> => {
    const token = localStorage.getItem('token');
    if (!user || !token) return null;
    
    try {
      const response = await fetch(`http://localhost:8000/interviews/calendar/${date}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch calendar day');
      }

      const calendarDay: InterviewCalendarDay = await response.json();
      return calendarDay;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch calendar day');
      return null;
    }
  };

  const getStats = async (jobId?: string): Promise<InterviewStats | null> => {
    const token = localStorage.getItem('token');
    if (!user || !token) return null;
    
    try {
      const queryString = jobId ? `?job_id=${jobId}` : '';
      const response = await fetch(`http://localhost:8000/interviews/stats/overview${queryString}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch interview stats');
      }

      const stats: InterviewStats = await response.json();
      return stats;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch interview stats');
      return null;
    }
  };

  // Utility functions
  const getInterviewById = useCallback((interviewId: string) => {
    return interviews.find(interview => interview._id === interviewId) || null;
  }, [interviews]);

  const getInterviewsByStatus = useCallback((status: Interview['status']) => {
    return interviews.filter(interview => interview.status === status);
  }, [interviews]);

  const getUpcomingInterviews = useCallback((days: number = 7) => {
    const now = new Date();
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    
    return interviews.filter(interview => {
      const interviewDate = new Date(interview.scheduled_date);
      return interviewDate >= now && interviewDate <= futureDate && interview.status === 'scheduled';
    }).sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime());
  }, [interviews]);

  const getInterviewsStats = useCallback(() => {
    const stats = {
      total: interviews.length,
      scheduled: 0,
      completed: 0,
      cancelled: 0,
      rescheduled: 0,
      no_show: 0,
      averageDuration: 0,
      totalDuration: 0
    };

    let totalDuration = 0;
    interviews.forEach(interview => {
      stats[interview.status]++;
      totalDuration += interview.duration;
    });

    stats.totalDuration = totalDuration;
    stats.averageDuration = interviews.length > 0 ? totalDuration / interviews.length : 0;

    return stats;
  }, [interviews]);

  const refreshInterviews = useCallback(() => {
    if (pagination.page && pagination.per_page) {
      fetchInterviews({}, pagination.page, pagination.per_page);
    }
  }, [fetchInterviews, pagination.page, pagination.per_page]);

  const retryLastOperation = useCallback(() => {
    refreshInterviews();
  }, [refreshInterviews]);

  return {
    interviews,
    loading,
    error,
    retryCount,
    pagination,
    fetchInterviews,
    getInterview,
    createInterview,
    updateInterview,
    rescheduleInterview,
    completeInterview,
    cancelInterview,
    addFeedback,
    getCalendarDay,
    getStats,
    // Utility functions
    getInterviewById,
    getInterviewsByStatus,
    getUpcomingInterviews,
    getInterviewsStats,
    refreshInterviews,
    retryLastOperation,
    clearError: () => setError(null)
  };
};