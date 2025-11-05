import React, { useState } from 'react';
import { useStudentAnalytics, useSkillProgression, useRankingData, AnalyticsFilters } from '../../hooks/student/useAnalytics';
import {
  ScoreTrendChart,
  SkillRadarChart,
  CategoryPerformanceChart,
  ActivityHeatmap,
  TimeVsQualityScatter,
  DifficultyDistributionPie
} from '../../components/student/PerformanceChart';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';

const StudentAnalytics: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'performance' | 'skills' | 'activity' | 'ranking'>('overview');

  const filters: AnalyticsFilters = {
    time_range: timeRange,
    categories: selectedCategories.length > 0 ? selectedCategories : undefined,
    include_comparisons: true,
    include_predictions: true
  };

  const { 
    data: analyticsData, 
    isLoading: analyticsLoading, 
    error: analyticsError,
    refetch: refetchAnalytics
  } = useStudentAnalytics(filters) as { 
    data: any; 
    isLoading: boolean; 
    error: any; 
    refetch: () => void; 
  };

  const { 
    data: skillsData, 
    isLoading: skillsLoading 
  } = useSkillProgression();

  const { 
    data: rankingData, 
    isLoading: rankingLoading 
  } = useRankingData();

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  if (analyticsLoading && !analyticsData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading your analytics...</p>
        </div>
      </div>
    );
  }

  if (analyticsError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <ErrorMessage
          title="Failed to Load Analytics"
          message="We couldn't load your performance analytics. Please try again."
          onRetry={refetchAnalytics}
        />
      </div>
    );
  }

  const hasData = analyticsData?.activity?.tasks_completed > 0;
  const categories = ['Frontend', 'Backend', 'Mobile', 'DevOps', 'Design', 'Data Science'];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Performance Analytics</h1>
                <p className="mt-2 text-gray-600">
                  Track your progress and skill development
                </p>
              </div>
              
              {/* Time Range Selector */}
              {hasData && (
                <div className="flex items-center space-x-4">
                  <select
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value as any)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="week">Last Week</option>
                    <option value="month">Last Month</option>
                    <option value="quarter">Last Quarter</option>
                    <option value="year">Last Year</option>
                  </select>
                  
                  <button
                    onClick={() => refetchAnalytics()}
                    disabled={analyticsLoading}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    <svg className={`h-4 w-4 mr-1.5 ${analyticsLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!hasData ? (
          /* Empty State */
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-6">📊</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              No Analytics Data Yet
            </h2>
            <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
              Complete some tasks to start seeing your performance analytics. 
              We'll track your progress, skill development, and provide insights to help you improve.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
              <div className="p-6 border border-gray-200 rounded-lg">
                <div className="text-3xl mb-3">📋</div>
                <h3 className="font-semibold text-gray-900 mb-2">Complete Tasks</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Apply to jobs and submit your work to start building your analytics
                </p>
                <button
                  onClick={() => window.location.href = '/student/dashboard?tab=tasks'}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Browse Tasks
                </button>
              </div>
              
              <div className="p-6 border border-gray-200 rounded-lg">
                <div className="text-3xl mb-3">📝</div>
                <h3 className="font-semibold text-gray-900 mb-2">Track Applications</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Monitor your application progress and submission status
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
        ) : (
          <>
            {/* Navigation Tabs */}
            <div className="mb-8">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                  {[
                    { id: 'overview', label: 'Overview', icon: '📊' },
                    { id: 'performance', label: 'Performance', icon: '📈' },
                    { id: 'skills', label: 'Skills', icon: '🎯' },
                    { id: 'activity', label: 'Activity', icon: '⚡' },
                    { id: 'ranking', label: 'Ranking', icon: '🏆' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <span>{tab.icon}</span>
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            {/* Category Filter */}
            <div className="mb-6">
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
                {selectedCategories.length > 0 && (
                  <button
                    onClick={() => setSelectedCategories([])}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium text-red-600 bg-red-50 border border-red-200 hover:bg-red-100"
                  >
                    Clear All
                  </button>
                )}
              </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <span className="text-blue-600 font-semibold">%</span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">Completion Rate</p>
                        <p className="text-2xl font-semibold text-gray-900">
                          {Math.round((analyticsData?.performance?.completion_rate || 0) * 100)}%
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                          <span className="text-green-600 font-semibold">★</span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">Average Score</p>
                        <p className="text-2xl font-semibold text-gray-900">
                          {(analyticsData?.performance?.average_score || 0).toFixed(1)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                          <span className="text-purple-600 font-semibold">#</span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">Tasks Completed</p>
                        <p className="text-2xl font-semibold text-gray-900">
                          {analyticsData?.activity?.tasks_completed || 0}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                          <span className="text-orange-600 font-semibold">🔥</span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">Current Streak</p>
                        <p className="text-2xl font-semibold text-gray-900">
                          {analyticsData?.activity?.streak_days || 0} days
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <ScoreTrendChart 
                    data={analyticsData?.performance?.score_trend || []}
                    title="Score Trend Over Time"
                  />
                  <ActivityHeatmap 
                    data={analyticsData?.activity?.weekly_activity || []}
                    title="Weekly Activity"
                  />
                </div>

                {/* Insights */}
                {analyticsData?.insights && (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Insights</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <h4 className="font-medium text-green-800 mb-2">💪 Strengths</h4>
                        <ul className="text-sm text-green-700 space-y-1">
                          {analyticsData?.insights?.strengths?.map((strength, index) => (
                            <li key={index}>• {strength}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium text-yellow-800 mb-2">📈 Improvement Areas</h4>
                        <ul className="text-sm text-yellow-700 space-y-1">
                          {analyticsData?.insights?.improvement_areas?.map((area, index) => (
                            <li key={index}>• {area}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium text-blue-800 mb-2">🎯 Recommendations</h4>
                        <ul className="text-sm text-blue-700 space-y-1">
                          {analyticsData?.insights?.recommendations?.map((rec, index) => (
                            <li key={index}>• {rec}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'performance' && (
              <div className="space-y-6">
                <CategoryPerformanceChart 
                  data={analyticsData?.performance?.category_performance || []}
                />
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <ScoreTrendChart 
                    data={analyticsData?.performance?.score_trend || []}
                    title="Detailed Score Progression"
                    height={400}
                  />
                  
                  {/* Time vs Quality Analysis */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Time vs Quality Analysis</h3>
                    <div className="text-center py-8 text-gray-500">
                      <p>Complete more tasks to see time vs quality insights</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'skills' && (
              <div className="space-y-6">
                {skillsData && skillsData.length > 0 ? (
                  <SkillRadarChart 
                    data={skillsData}
                    title="Skill Assessment Radar"
                    height={500}
                  />
                ) : (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                    <p className="text-gray-500">Complete more tasks to see skill progression data</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'activity' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <ActivityHeatmap 
                    data={analyticsData?.activity?.weekly_activity || []}
                    title="Weekly Activity Pattern"
                    height={300}
                  />
                  <ActivityHeatmap 
                    data={analyticsData?.activity?.monthly_activity || []}
                    title="Monthly Activity Trend"
                    height={300}
                  />
                </div>
              </div>
            )}

            {activeTab === 'ranking' && (
              <div className="space-y-6">
                {rankingData ? (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Ranking</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-blue-600">#{(rankingData as any)?.overall_rank || 'N/A'}</div>
                        <p className="text-sm text-gray-600">Overall Rank</p>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-green-600">{(rankingData as any)?.percentile || 0}%</div>
                        <p className="text-sm text-gray-600">Percentile</p>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-purple-600">{(rankingData as any)?.total_students || 0}</div>
                        <p className="text-sm text-gray-600">Total Students</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                    <p className="text-gray-500">Ranking data will be available after completing more tasks</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default StudentAnalytics;