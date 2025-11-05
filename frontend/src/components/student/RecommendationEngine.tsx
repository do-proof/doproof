import React, { useState } from 'react';
import { useRecommendations, useRecommendationReasoning, useRefreshRecommendations } from '../../hooks/student/useRecommendations';
import RecommendationCard from './RecommendationCard';
import LoadingSpinner from '../LoadingSpinner';
import ErrorMessage from '../ErrorMessage';

interface RecommendationEngineProps {
  limit?: number;
  showReasoning?: boolean;
  compact?: boolean;
  className?: string;
}

const RecommendationEngine: React.FC<RecommendationEngineProps> = ({
  limit = 6,
  showReasoning = true,
  compact = false,
  className = ''
}) => {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [minMatchScore, setMinMatchScore] = useState<number>(50);

  const { 
    data: recommendationsData, 
    isLoading: recommendationsLoading, 
    error: recommendationsError,
    refetch: refetchRecommendations
  } = useRecommendations({
    limit,
    min_match_score: minMatchScore,
    categories: selectedCategories.length > 0 ? selectedCategories : undefined,
    exclude_applied: true,
    include_reasoning: showReasoning
  }) as { data: any; isLoading: boolean; error: any; refetch: () => void; };

  const { 
    data: reasoning, 
    isLoading: reasoningLoading 
  } = useRecommendationReasoning({ 
    enabled: showReasoning 
  });

  const refreshMutation = useRefreshRecommendations();

  const handleRefresh = async () => {
    try {
      await refreshMutation.mutateAsync();
    } catch (error) {
      // Error is handled by the mutation
      console.error('Failed to refresh recommendations:', error);
    }
  };

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const categories = ['Frontend', 'Backend', 'Mobile', 'DevOps', 'Design', 'Data Science', 'AI/ML', 'QA'];

  if (recommendationsLoading && !recommendationsData) {
    return (
      <div className={`bg-white rounded-xl shadow-lg p-8 ${className}`}>
        <div className="flex items-center justify-center">
          <LoadingSpinner size="lg" />
          <span className="ml-3 text-gray-600">Loading personalized recommendations...</span>
        </div>
      </div>
    );
  }

  if (recommendationsError) {
    return (
      <div className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>
        <ErrorMessage
          title="Failed to Load Recommendations"
          message="We couldn't load your personalized recommendations. Please try again."
          onRetry={refetchRecommendations}
        />
      </div>
    );
  }

  const recommendations = recommendationsData?.recommendations || [];
  const hasRecommendations = recommendations.length > 0;

  return (
    <div className={`bg-white rounded-xl shadow-lg ${className}`}>
      <>
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Recommended for You</h2>
            <p className="text-gray-600 mt-1">
              {hasRecommendations 
                ? `${recommendations.length} personalized job recommendations`
                : 'No recommendations available'
              }
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={handleRefresh}
              disabled={refreshMutation.isPending || recommendationsLoading}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <svg className={`h-4 w-4 mr-1.5 ${refreshMutation.isPending ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>

        {/* Reasoning Section */}
        {showReasoning && reasoning && !reasoningLoading && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-lg font-medium text-blue-900 mb-3">Why These Recommendations?</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium text-blue-800 mb-2">Skill Matches</h4>
                <ul className="text-blue-700 space-y-1">
                  {(reasoning as any)?.skill_match?.slice(0, 3)?.map((skill: any, index: number) => (
                    <li key={index} className="flex items-center">
                      <span className="text-green-500 mr-2">✓</span>
                      {skill}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-blue-800 mb-2">Career Alignment</h4>
                <p className="text-blue-700">{(reasoning as any)?.career_alignment}</p>
                <div className="mt-2">
                  <span className="text-xs text-blue-600">Success Probability: </span>
                  <span className="font-medium text-blue-800">{Math.round(((reasoning as any)?.success_probability || 0) * 100)}%</span>
                </div>
              </div>
            </div>
            
            {(reasoning as any)?.improvement_suggestions?.length > 0 && (
              <div className="mt-4 p-3 bg-yellow-50 rounded border border-yellow-200">
                <h4 className="font-medium text-yellow-800 mb-2">💡 Profile Improvements</h4>
                <ul className="text-yellow-700 text-sm space-y-1">
                  {(reasoning as any)?.improvement_suggestions?.slice(0, 2)?.map((suggestion: any, index: number) => (
                    <li key={index}>• {suggestion}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Filters */}
        {hasRecommendations && (
          <div className="mt-6 space-y-4">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Category</label>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => handleCategoryToggle(category)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      selectedCategories.includes(category)
                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                        : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* Match Score Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Match Score: {minMatchScore}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="10"
                value={minMatchScore}
                onChange={(e) => setMinMatchScore(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>
          </div>
        )}
        </div>

        <div className="p-6">
        {hasRecommendations ? (
          <div className={`grid gap-6 ${compact ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3'}`}>
            {recommendations.map((recommendation) => (
              <RecommendationCard
                key={recommendation.job._id}
                recommendation={recommendation}
                compact={compact}
                showReasons={!compact}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎯</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Recommendations Available</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              We don't have enough information to provide personalized recommendations yet. 
              Complete your profile and apply to a few jobs to get started.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => window.location.href = '/student/profile'}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Complete Profile
              </button>
              <div className="text-sm text-gray-500">or</div>
              <button
                onClick={() => window.location.href = '/student/dashboard?tab=tasks'}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Browse All Jobs
              </button>
            </div>
          </div>
        )}
        </div>

        {hasRecommendations && recommendationsData && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-xl">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div>
                Last updated: {(recommendationsData as any)?.last_updated ? new Date((recommendationsData as any).last_updated).toLocaleDateString() : 'Unknown'}
              </div>
              <div>
                Next update: {(recommendationsData as any)?.next_update ? new Date((recommendationsData as any).next_update).toLocaleDateString() : 'Unknown'}
              </div>
            </div>
          </div>
        )}
      </>
    </div>
  );
};

export default RecommendationEngine;