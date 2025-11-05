import React from 'react';
import { usePerformanceOverview } from '../../hooks/student/useAnalytics';
import { ScoreTrendChart } from './PerformanceChart';
import LoadingSpinner from '../LoadingSpinner';

interface AnalyticsWidgetProps {
  compact?: boolean;
  showChart?: boolean;
  className?: string;
}

const AnalyticsWidget: React.FC<AnalyticsWidgetProps> = ({
  compact = false,
  showChart = true,
  className = ''
}) => {
  const { data: analyticsData, isLoading, error } = usePerformanceOverview() as { data: any; isLoading: boolean; error: any; };

  if (isLoading) {
    return (
      <div className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner />
          <span className="ml-2 text-gray-600">Loading analytics...</span>
        </div>
      </div>
    );
  }

  if (error || !analyticsData) {
    return (
      <div className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>
        <div className="text-center py-8">
          <div className="text-4xl mb-4">📊</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Analytics Coming Soon</h3>
          <p className="text-gray-600">Complete some tasks to see your performance analytics.</p>
        </div>
      </div>
    );
  }

  const hasData = analyticsData?.activity?.tasks_completed > 0;

  if (!hasData) {
    return (
      <div className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>
        <div className="text-center py-8">
          <div className="text-4xl mb-4">📊</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Start Building Your Analytics</h3>
          <p className="text-gray-600 mb-4">Complete tasks to unlock performance insights and skill tracking.</p>
          <button
            onClick={() => window.location.href = '/student/dashboard?tab=tasks'}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Browse Tasks
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl shadow-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Performance Analytics</h3>
            <p className="text-gray-600 text-sm">Your progress at a glance</p>
          </div>
          <button
            onClick={() => window.location.href = '/student/analytics'}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            View Details →
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="p-6">
        <div className={`grid gap-4 ${compact ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-4'} mb-6`}>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {Math.round(analyticsData.performance.completion_rate * 100)}%
            </div>
            <div className="text-sm text-gray-500">Completion Rate</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {analyticsData.performance.average_score.toFixed(1)}
            </div>
            <div className="text-sm text-gray-500">Average Score</div>
          </div>
          
          {!compact && (
            <>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {analyticsData?.activity?.tasks_completed || 0}
                </div>
                <div className="text-sm text-gray-500">Tasks Completed</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {analyticsData?.activity?.streak_days || 0}
                </div>
                <div className="text-sm text-gray-500">Day Streak</div>
              </div>
            </>
          )}
        </div>

        {/* Score Trend Chart */}
        {showChart && analyticsData.performance.score_trend.length > 0 && (
          <div className="mb-6">
            <ScoreTrendChart 
              data={analyticsData.performance.score_trend}
              title="Recent Score Trend"
              height={200}
            />
          </div>
        )}

        {/* Quick Insights */}
        {analyticsData.insights && (
          <div className="space-y-4">
            {analyticsData.insights.strengths.length > 0 && (
              <div className="p-3 bg-green-50 rounded-lg">
                <h4 className="text-sm font-medium text-green-800 mb-1">💪 Top Strength</h4>
                <p className="text-sm text-green-700">{analyticsData.insights.strengths[0]}</p>
              </div>
            )}
            
            {analyticsData.insights.recommendations.length > 0 && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <h4 className="text-sm font-medium text-blue-800 mb-1">🎯 Recommendation</h4>
                <p className="text-sm text-blue-700">{analyticsData.insights.recommendations[0]}</p>
              </div>
            )}
          </div>
        )}

        {/* Action Button */}
        <div className="mt-6 text-center">
          <button
            onClick={() => window.location.href = '/student/analytics'}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            View Full Analytics
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsWidget;