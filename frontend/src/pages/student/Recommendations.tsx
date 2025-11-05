import React, { useState } from 'react';
import { useRecommendations, useRecommendationReasoning } from '../../hooks/student/useRecommendations';
import RecommendationEngine from '../../components/student/RecommendationEngine';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';

const Recommendations: React.FC = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);

  const { 
    data: recommendationsData, 
    isLoading: recommendationsLoading, 
    error: recommendationsError 
  } = useRecommendations({ 
    limit: 20, 
    include_reasoning: true 
  }) as { data: any; isLoading: boolean; error: any; };

  const { 
    data: reasoning, 
    isLoading: reasoningLoading 
  } = useRecommendationReasoning();

  if (recommendationsLoading && !recommendationsData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading your personalized recommendations...</p>
        </div>
      </div>
    );
  }

  if (recommendationsError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <ErrorMessage
          title="Failed to Load Recommendations"
          message="We couldn't load your personalized recommendations. Please try again."
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  const recommendations = recommendationsData?.recommendations || [];
  const hasRecommendations = recommendations.length > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Personalized Recommendations</h1>
                <p className="mt-2 text-gray-600">
                  Discover job opportunities tailored to your skills and career goals
                </p>
              </div>
              
              {/* View Controls */}
              {hasRecommendations && (
                <div className="flex items-center space-x-4">
                  <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`px-4 py-2 text-sm font-medium ${
                        viewMode === 'grid'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`px-4 py-2 text-sm font-medium ${
                        viewMode === 'list'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Recommendation Insights */}
        {reasoning && !reasoningLoading && hasRecommendations && (
          <div className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
            <h2 className="text-xl font-semibold text-blue-900 mb-4">Your Recommendation Profile</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h3 className="font-medium text-gray-900 mb-2">Profile Strength</h3>
                <div className="flex items-center">
                  <div className="flex-1 bg-gray-200 rounded-full h-2 mr-3">
                    <div 
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${reasoning.profile_completeness}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {reasoning.profile_completeness}%
                  </span>
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h3 className="font-medium text-gray-900 mb-2">Success Probability</h3>
                <div className="text-2xl font-bold text-green-600">
                  {Math.round(reasoning.success_probability * 100)}%
                </div>
                <p className="text-sm text-gray-600">Based on similar profiles</p>
              </div>
              
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h3 className="font-medium text-gray-900 mb-2">Market Alignment</h3>
                <p className="text-sm text-gray-700">{reasoning.market_demand}</p>
              </div>
            </div>

            {reasoning.improvement_suggestions.length > 0 && (
              <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <h3 className="font-medium text-yellow-800 mb-2">💡 Improve Your Recommendations</h3>
                <ul className="text-sm text-yellow-700 space-y-1">
                  {reasoning.improvement_suggestions.map((suggestion, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-yellow-500 mr-2">•</span>
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Recommendations */}
        {hasRecommendations ? (
          <RecommendationEngine 
            limit={20}
            showReasoning={true}
            compact={viewMode === 'list'}
            className="shadow-lg"
          />
        ) : (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-6">🎯</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              No Recommendations Available Yet
            </h2>
            <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
              We need more information about your skills and preferences to provide personalized recommendations. 
              Complete your profile and apply to a few jobs to help our AI understand your career goals.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="p-6 border border-gray-200 rounded-lg">
                <div className="text-3xl mb-3">👤</div>
                <h3 className="font-semibold text-gray-900 mb-2">Complete Your Profile</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Add your skills, experience, and career preferences
                </p>
                <button
                  onClick={() => window.location.href = '/student/profile'}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Update Profile
                </button>
              </div>
              
              <div className="p-6 border border-gray-200 rounded-lg">
                <div className="text-3xl mb-3">📋</div>
                <h3 className="font-semibold text-gray-900 mb-2">Apply to Jobs</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Apply to jobs that interest you to help us learn your preferences
                </p>
                <button
                  onClick={() => window.location.href = '/student/dashboard?tab=tasks'}
                  className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Browse Jobs
                </button>
              </div>
              
              <div className="p-6 border border-gray-200 rounded-lg">
                <div className="text-3xl mb-3">⚡</div>
                <h3 className="font-semibold text-gray-900 mb-2">Complete Tasks</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Submit work to build your performance history
                </p>
                <button
                  onClick={() => window.location.href = '/student/applications'}
                  className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  View Applications
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Recommendations;