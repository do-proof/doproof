import { useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';

export interface AnalyticsMetrics {
  // Task completion metrics
  task_completion_rate: number;
  average_completion_time: number;
  total_submissions: number;
  completed_submissions: number;
  
  // AI score analytics
  average_ai_score: number;
  score_distribution: {
    range: string;
    count: number;
    percentage: number;
  }[];
  
  // Criteria-wise performance
  criteria_performance: {
    critical_thinking: number;
    problem_solving: number;
    creativity: number;
    technical_skills: number;
    communication: number;
    attention_to_detail: number;
  };
  
  // Time-based trends
  submission_trends: {
    date: string;
    submissions: number;
    average_score: number;
  }[];
  
  // Job performance
  job_performance: {
    job_id: string;
    job_title: string;
    submissions: number;
    average_score: number;
    completion_rate: number;
  }[];
  
  // Candidate ranking data
  top_candidates: {
    candidate_id: string;
    candidate_name: string;
    overall_score: number;
    job_title: string;
    submission_date: string;
  }[];
}

export interface AnalyticsFilters {
  date_from?: string;
  date_to?: string;
  job_ids?: string[];
  criteria?: string[];
  min_score?: number;
  max_score?: number;
}

export const useAnalytics = () => {
  const [metrics, setMetrics] = useState<AnalyticsMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const { user } = useAuth();

  const MAX_RETRY_ATTEMPTS = 3;
  const RETRY_DELAY = 1000;

  const buildQueryString = (filters: AnalyticsFilters) => {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(item => params.append(key, item.toString()));
        } else {
          params.append(key, value.toString());
        }
      }
    });
    
    return params.toString();
  };

  const fetchAnalytics = useCallback(async (filters: AnalyticsFilters = {}, attempt: number = 0) => {
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
      const queryString = buildQueryString(filters);
      const response = await fetch(`http://localhost:8000/analytics?${queryString}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed. Please log in again.');
        }
        if (response.status >= 500 && attempt < MAX_RETRY_ATTEMPTS) {
          throw new Error('RETRY_NEEDED');
        }
        throw new Error(`Failed to fetch analytics: ${response.statusText}`);
      }

      const data: AnalyticsMetrics = await response.json();
      setMetrics(data);
      setRetryCount(0);
    } catch (err) {
      if (err instanceof Error && err.message === 'RETRY_NEEDED' && attempt < MAX_RETRY_ATTEMPTS) {
        setRetryCount(attempt + 1);
        setTimeout(() => {
          fetchAnalytics(filters, attempt + 1);
        }, RETRY_DELAY * Math.pow(2, attempt));
        return;
      }
      
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics');
      setMetrics(null);
    } finally {
      setLoading(false);
    }
  }, [user, MAX_RETRY_ATTEMPTS, RETRY_DELAY]);

  const exportReport = async (filters: AnalyticsFilters = {}, format: 'pdf' | 'csv' = 'pdf') => {
    const token = localStorage.getItem('token');
    if (!user || !token) return null;
    
    try {
      const exportFilters = { ...filters };
      const params = new URLSearchParams();
      
      Object.entries(exportFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(item => params.append(key, item.toString()));
          } else {
            params.append(key, value.toString());
          }
        }
      });
      
      params.append('format', format);
      
      const response = await fetch(`http://localhost:8000/analytics/export?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to export report: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `analytics-report-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export report');
      return false;
    }
  };

  // Utility functions
  const getDateRangePresets = useCallback(() => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const lastQuarter = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    return {
      today: { date_from: today, date_to: today },
      yesterday: { date_from: yesterday, date_to: yesterday },
      last7days: { date_from: lastWeek, date_to: today },
      last30days: { date_from: lastMonth, date_to: today },
      last90days: { date_from: lastQuarter, date_to: today }
    };
  }, []);

  const calculateTrends = useCallback((current: AnalyticsMetrics, previous: AnalyticsMetrics) => {
    const trends = {
      submissionsTrend: ((current.total_submissions - previous.total_submissions) / previous.total_submissions) * 100,
      scoreTrend: ((current.average_ai_score - previous.average_ai_score) / previous.average_ai_score) * 100,
      completionRateTrend: ((current.task_completion_rate - previous.task_completion_rate) / previous.task_completion_rate) * 100
    };

    return trends;
  }, []);

  const refreshAnalytics = useCallback((filters?: AnalyticsFilters) => {
    fetchAnalytics(filters || {});
  }, [fetchAnalytics]);

  const retryLastOperation = useCallback(() => {
    refreshAnalytics();
  }, [refreshAnalytics]);

  return {
    metrics,
    loading,
    error,
    retryCount,
    fetchAnalytics,
    exportReport,
    // Utility functions
    getDateRangePresets,
    calculateTrends,
    refreshAnalytics,
    retryLastOperation,
    clearError: () => setError(null)
  };
};