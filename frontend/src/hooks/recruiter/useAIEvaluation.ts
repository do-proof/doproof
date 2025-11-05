import { useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { TaskSubmission } from './useTaskSubmissions';

export interface AIEvaluationStats {
  totalEvaluations: number;
  averageScore: number;
  scoreDistribution: {
    excellent: number; // 90-100
    good: number; // 70-89
    average: number; // 50-69
    poor: number; // 0-49
  };
  criteriaAverages: {
    critical_thinking: number;
    problem_solving: number;
    creativity: number;
    technical_skills: number;
    communication: number;
    attention_to_detail: number;
  };
  topPerformers: TaskSubmission[];
  recentEvaluations: TaskSubmission[];
}

export interface EvaluationComparison {
  submissions: TaskSubmission[];
  metrics: {
    averageScore: number;
    scoreRange: { min: number; max: number };
    criteriaComparison: {
      [key: string]: {
        average: number;
        best: number;
        worst: number;
      };
    };
  };
}

export interface EvaluationInsights {
  strengths: string[];
  improvements: string[];
  recommendations: string[];
  trends: {
    scoreImprovement: boolean;
    consistentCriteria: string[];
    variableCriteria: string[];
  };
}

export const useAIEvaluation = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const { user } = useAuth();

  const MAX_RETRY_ATTEMPTS = 3;
  const RETRY_DELAY = 1000;

  const getEvaluationStats = useCallback(async (jobId?: string, attempt: number = 0): Promise<AIEvaluationStats | null> => {
    const token = localStorage.getItem('token');
    if (!user || !token) {
      setError('Authentication required');
      return null;
    }
    
    setLoading(true);
    if (attempt === 0) {
      setError(null);
      setRetryCount(0);
    }
    
    try {
      const queryParams = jobId ? `?job_id=${jobId}` : '';
      const response = await fetch(`http://localhost:8000/ai-evaluation/stats${queryParams}`, {
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
        throw new Error(`Failed to fetch evaluation stats: ${response.statusText}`);
      }

      const stats: AIEvaluationStats = await response.json();
      setRetryCount(0);
      return stats;
    } catch (err) {
      if (err instanceof Error && err.message === 'RETRY_NEEDED' && attempt < MAX_RETRY_ATTEMPTS) {
        setRetryCount(attempt + 1);
        setTimeout(() => {
          return getEvaluationStats(jobId, attempt + 1);
        }, RETRY_DELAY * Math.pow(2, attempt));
        return null;
      }
      
      setError(err instanceof Error ? err.message : 'Failed to fetch evaluation stats');
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, MAX_RETRY_ATTEMPTS, RETRY_DELAY]);

  const compareSubmissions = async (submissionIds: string[]): Promise<EvaluationComparison | null> => {
    const token = localStorage.getItem('token');
    if (!user || !token) return null;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost:8000/ai-evaluation/compare', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ submission_ids: submissionIds }),
      });

      if (!response.ok) {
        throw new Error(`Failed to compare submissions: ${response.statusText}`);
      }

      const comparison: EvaluationComparison = await response.json();
      return comparison;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to compare submissions');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getEvaluationInsights = async (submissionId: string): Promise<EvaluationInsights | null> => {
    const token = localStorage.getItem('token');
    if (!user || !token) return null;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`http://localhost:8000/ai-evaluation/${submissionId}/insights`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch evaluation insights: ${response.statusText}`);
      }

      const insights: EvaluationInsights = await response.json();
      return insights;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch evaluation insights');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const triggerReEvaluation = async (submissionId: string): Promise<boolean> => {
    const token = localStorage.getItem('token');
    if (!user || !token) return false;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`http://localhost:8000/ai-evaluation/${submissionId}/re-evaluate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to trigger re-evaluation: ${response.statusText}`);
      }

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to trigger re-evaluation');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getEvaluationHistory = async (submissionId: string): Promise<any[] | null> => {
    const token = localStorage.getItem('token');
    if (!user || !token) return null;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`http://localhost:8000/ai-evaluation/${submissionId}/history`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch evaluation history: ${response.statusText}`);
      }

      const history = await response.json();
      return history;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch evaluation history');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const exportEvaluationData = async (filters: {
    jobId?: string;
    dateFrom?: string;
    dateTo?: string;
    minScore?: number;
    maxScore?: number;
  }): Promise<Blob | null> => {
    const token = localStorage.getItem('token');
    if (!user || !token) return null;
    
    setLoading(true);
    setError(null);
    
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });

      const response = await fetch(`http://localhost:8000/ai-evaluation/export?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to export evaluation data: ${response.statusText}`);
      }

      const blob = await response.blob();
      return blob;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export evaluation data');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const calculateLocalStats = (submissions: TaskSubmission[]): AIEvaluationStats => {
    const evaluatedSubmissions = submissions.filter(s => s.ai_evaluation);
    
    if (evaluatedSubmissions.length === 0) {
      return {
        totalEvaluations: 0,
        averageScore: 0,
        scoreDistribution: { excellent: 0, good: 0, average: 0, poor: 0 },
        criteriaAverages: {
          critical_thinking: 0,
          problem_solving: 0,
          creativity: 0,
          technical_skills: 0,
          communication: 0,
          attention_to_detail: 0
        },
        topPerformers: [],
        recentEvaluations: []
      };
    }

    const scores = evaluatedSubmissions.map(s => s.ai_evaluation!.overall_score);
    const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;

    const scoreDistribution = {
      excellent: scores.filter(s => s >= 90).length,
      good: scores.filter(s => s >= 70 && s < 90).length,
      average: scores.filter(s => s >= 50 && s < 70).length,
      poor: scores.filter(s => s < 50).length
    };

    const criteriaKeys = ['critical_thinking', 'problem_solving', 'creativity', 'technical_skills', 'communication', 'attention_to_detail'] as const;
    const criteriaAverages = criteriaKeys.reduce((acc, key) => {
      const criteriaScores = evaluatedSubmissions.map(s => s.ai_evaluation!.criteria_scores[key]);
      acc[key] = criteriaScores.reduce((sum, score) => sum + score, 0) / criteriaScores.length;
      return acc;
    }, {} as any);

    const topPerformers = evaluatedSubmissions
      .sort((a, b) => b.ai_evaluation!.overall_score - a.ai_evaluation!.overall_score)
      .slice(0, 5);

    const recentEvaluations = evaluatedSubmissions
      .sort((a, b) => new Date(b.ai_evaluation!.evaluated_at).getTime() - new Date(a.ai_evaluation!.evaluated_at).getTime())
      .slice(0, 10);

    return {
      totalEvaluations: evaluatedSubmissions.length,
      averageScore,
      scoreDistribution,
      criteriaAverages,
      topPerformers,
      recentEvaluations
    };
  };

  const generateInsights = (submissions: TaskSubmission[]): EvaluationInsights => {
    const evaluatedSubmissions = submissions.filter(s => s.ai_evaluation);
    
    if (evaluatedSubmissions.length === 0) {
      return {
        strengths: [],
        improvements: [],
        recommendations: [],
        trends: {
          scoreImprovement: false,
          consistentCriteria: [],
          variableCriteria: []
        }
      };
    }

    const criteriaKeys = ['critical_thinking', 'problem_solving', 'creativity', 'technical_skills', 'communication', 'attention_to_detail'] as const;
    const criteriaLabels = {
      critical_thinking: 'Critical Thinking',
      problem_solving: 'Problem Solving',
      creativity: 'Creativity',
      technical_skills: 'Technical Skills',
      communication: 'Communication',
      attention_to_detail: 'Attention to Detail'
    };

    // Calculate criteria averages
    const criteriaAverages = criteriaKeys.reduce((acc, key) => {
      const scores = evaluatedSubmissions.map(s => s.ai_evaluation!.criteria_scores[key]);
      acc[key] = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      return acc;
    }, {} as Record<string, number>);

    // Identify strengths (criteria with average > 75)
    const strengths = Object.entries(criteriaAverages)
      .filter(([, avg]) => avg > 75)
      .map(([key]) => criteriaLabels[key as keyof typeof criteriaLabels]);

    // Identify areas for improvement (criteria with average < 60)
    const improvements = Object.entries(criteriaAverages)
      .filter(([, avg]) => avg < 60)
      .map(([key]) => criteriaLabels[key as keyof typeof criteriaLabels]);

    // Generate recommendations
    const recommendations = [];
    if (improvements.length > 0) {
      recommendations.push(`Focus on improving ${improvements.join(', ')} in future candidates`);
    }
    if (strengths.length > 0) {
      recommendations.push(`Leverage strong ${strengths.join(', ')} skills in role assignments`);
    }

    // Calculate trends (simplified)
    const recentSubmissions = evaluatedSubmissions.slice(-5);
    const olderSubmissions = evaluatedSubmissions.slice(0, -5);
    
    const recentAvg = recentSubmissions.length > 0 
      ? recentSubmissions.reduce((sum, s) => sum + s.ai_evaluation!.overall_score, 0) / recentSubmissions.length
      : 0;
    const olderAvg = olderSubmissions.length > 0
      ? olderSubmissions.reduce((sum, s) => sum + s.ai_evaluation!.overall_score, 0) / olderSubmissions.length
      : 0;

    const scoreImprovement = recentAvg > olderAvg;

    // Identify consistent vs variable criteria
    const criteriaVariance = criteriaKeys.reduce((acc, key) => {
      const scores = evaluatedSubmissions.map(s => s.ai_evaluation!.criteria_scores[key]);
      const avg = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      const variance = scores.reduce((sum, score) => sum + Math.pow(score - avg, 2), 0) / scores.length;
      acc[key] = variance;
      return acc;
    }, {} as Record<string, number>);

    const consistentCriteria = Object.entries(criteriaVariance)
      .filter(([, variance]) => variance < 100) // Low variance = consistent
      .map(([key]) => criteriaLabels[key as keyof typeof criteriaLabels]);

    const variableCriteria = Object.entries(criteriaVariance)
      .filter(([, variance]) => variance >= 100) // High variance = variable
      .map(([key]) => criteriaLabels[key as keyof typeof criteriaLabels]);

    return {
      strengths,
      improvements,
      recommendations,
      trends: {
        scoreImprovement,
        consistentCriteria,
        variableCriteria
      }
    };
  };

  // Utility functions
  const getScoreCategory = useCallback((score: number): 'excellent' | 'good' | 'average' | 'poor' => {
    if (score >= 90) return 'excellent';
    if (score >= 70) return 'good';
    if (score >= 50) return 'average';
    return 'poor';
  }, []);

  const formatCriteriaName = useCallback((key: string): string => {
    const labels = {
      critical_thinking: 'Critical Thinking',
      problem_solving: 'Problem Solving',
      creativity: 'Creativity',
      technical_skills: 'Technical Skills',
      communication: 'Communication',
      attention_to_detail: 'Attention to Detail'
    };
    return labels[key as keyof typeof labels] || key;
  }, []);

  const retryLastOperation = useCallback(() => {
    // This would retry the last failed operation
    // Implementation depends on tracking the last operation
  }, []);

  return {
    loading,
    error,
    retryCount,
    getEvaluationStats,
    compareSubmissions,
    getEvaluationInsights,
    triggerReEvaluation,
    getEvaluationHistory,
    exportEvaluationData,
    calculateLocalStats,
    generateInsights,
    // Utility functions
    getScoreCategory,
    formatCriteriaName,
    retryLastOperation,
    clearError: () => setError(null)
  };
};