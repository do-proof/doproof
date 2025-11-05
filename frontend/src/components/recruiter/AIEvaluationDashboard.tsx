import React, { useState, useEffect } from 'react';
import { TaskSubmission } from '../../hooks/recruiter/useTaskSubmissions';
import { useAIEvaluation } from '../../hooks/recruiter/useAIEvaluation';
import AIScoreDisplay from './AIScoreDisplay';
import EvaluationBreakdown from './EvaluationBreakdown';
import ScoreComparison from './ScoreComparison';
import EvaluationHistory from './EvaluationHistory';

interface AIEvaluationDashboardProps {
  submissions: TaskSubmission[];
  selectedSubmission?: TaskSubmission;
  onSubmissionSelect?: (submission: TaskSubmission) => void;
  className?: string;
}

type ViewMode = 'overview' | 'comparison' | 'details' | 'history';

const AIEvaluationDashboard: React.FC<AIEvaluationDashboardProps> = ({
  submissions,
  selectedSubmission,
  onSubmissionSelect,
  className = ''
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [selectedSubmissionIds, setSelectedSubmissionIds] = useState<string[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [insights, setInsights] = useState<any>(null);
  
  const { 
    calculateLocalStats, 
    generateInsights, 
    loading, 
    error,
    exportEvaluationData 
  } = useAIEvaluation();

  useEffect(() => {
    if (submissions.length > 0) {
      const calculatedStats = calculateLocalStats(submissions);
      const generatedInsights = generateInsights(submissions);
      setStats(calculatedStats);
      setInsights(generatedInsights);
    }
  }, [submissions, calculateLocalStats, generateInsights]);

  const handleSubmissionSelect = (submissionId: string) => {
    setSelectedSubmissionIds(prev => {
      if (prev.includes(submissionId)) {
        return prev.filter(id => id !== submissionId);
      } else if (prev.length < 5) {
        return [...prev, submissionId];
      }
      return prev;
    });
  };

  const handleExportData = async () => {
    const blob = await exportEvaluationData({});
    if (blob) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ai-evaluation-data-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const evaluatedSubmissions = submissions.filter(s => s.ai_evaluation);

  if (evaluatedSubmissions.length === 0) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-8 text-center ${className}`}>
        <div className="text-gray-500">
          <div className="text-6xl mb-4">🤖</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No AI Evaluations Available</h3>
          <p className="text-sm text-gray-600">
            AI evaluations will appear here once candidates submit their tasks and the AI evaluation process is complete.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">AI Evaluation System</h2>
            <p className="text-sm text-gray-600 mt-1">
              Comprehensive analysis and insights from AI-powered candidate evaluations
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={handleExportData}
              disabled={loading}
              className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              Export Data
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 mt-4">
          {[
            { key: 'overview', label: 'Overview', icon: '📊' },
            { key: 'comparison', label: 'Comparison', icon: '⚖️' },
            { key: 'details', label: 'Details', icon: '🔍' },
            { key: 'history', label: 'History', icon: '📋' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setViewMode(tab.key as ViewMode)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                viewMode === tab.key
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        {viewMode === 'overview' && stats && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{stats.totalEvaluations}</div>
                <div className="text-sm text-blue-800">Total Evaluations</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{stats.averageScore.toFixed(1)}</div>
                <div className="text-sm text-green-800">Average Score</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{stats.scoreDistribution.excellent}</div>
                <div className="text-sm text-purple-800">Excellent (90+)</div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{stats.topPerformers.length}</div>
                <div className="text-sm text-yellow-800">Top Performers</div>
              </div>
            </div>

            {/* Score Distribution */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-3">Score Distribution</h3>
              <div className="space-y-2">
                {Object.entries(stats.scoreDistribution).map(([level, count]) => {
                  const percentage = (count as number / stats.totalEvaluations) * 100;
                  const colors = {
                    excellent: 'bg-green-500',
                    good: 'bg-blue-500',
                    average: 'bg-yellow-500',
                    poor: 'bg-red-500'
                  };
                  
                  return (
                    <div key={level} className="flex items-center space-x-3">
                      <div className="w-20 text-sm text-gray-600 capitalize">{level}:</div>
                      <div className="flex-1 bg-gray-200 rounded-full h-4">
                        <div
                          className={`h-4 rounded-full ${colors[level as keyof typeof colors]}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="w-16 text-sm text-gray-600 text-right">
                        {`${count} (${percentage.toFixed(1)}%)`}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Criteria Averages */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-3">Average Performance by Criteria</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(stats.criteriaAverages).map(([key, average]) => (
                  <div key={key} className="text-center">
                    <div className={`text-xl font-bold ${
                      (average as number) >= 80 ? 'text-green-600' : 
                      (average as number) >= 60 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {(average as number).toFixed(1)}
                    </div>
                    <div className="text-xs text-gray-600 capitalize">
                      {key.replace('_', ' ')}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Insights */}
            {insights && (
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">Performance Insights</h3>
                
                {insights.strengths.length > 0 && (
                  <div className="p-3 bg-green-50 rounded-lg">
                    <h4 className="font-medium text-green-800 mb-2">💪 Key Strengths</h4>
                    <ul className="text-sm text-green-700 space-y-1">
                      {insights.strengths.map((strength: string, index: number) => (
                        <li key={index}>• Strong performance in {strength}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {insights.improvements.length > 0 && (
                  <div className="p-3 bg-yellow-50 rounded-lg">
                    <h4 className="font-medium text-yellow-800 mb-2">📈 Areas for Improvement</h4>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      {insights.improvements.map((improvement: string, index: number) => (
                        <li key={index}>• Focus needed on {improvement}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {insights.recommendations.length > 0 && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-800 mb-2">💡 Recommendations</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      {insights.recommendations.map((recommendation: string, index: number) => (
                        <li key={index}>• {recommendation}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {viewMode === 'comparison' && (
          <ScoreComparison
            submissions={evaluatedSubmissions}
            selectedSubmissionIds={selectedSubmissionIds}
            onSelectSubmission={handleSubmissionSelect}
            maxComparisons={5}
          />
        )}

        {viewMode === 'details' && selectedSubmission && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AIScoreDisplay
                aiEvaluation={selectedSubmission.ai_evaluation}
                size="large"
                showBreakdown={true}
                showFeedback={true}
              />
              <EvaluationBreakdown
                aiEvaluation={selectedSubmission.ai_evaluation}
                showInsights={true}
              />
            </div>
          </div>
        )}

        {viewMode === 'history' && selectedSubmission && (
          <EvaluationHistory
            submission={selectedSubmission}
          />
        )}

        {/* Default state for details and history modes */}
        {(viewMode === 'details' || viewMode === 'history') && !selectedSubmission && (
          <div className="text-center text-gray-500 py-8">
            <div className="text-4xl mb-4">👆</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Submission</h3>
            <p className="text-sm text-gray-600">
              Choose a submission from the task submissions page to view detailed {viewMode === 'details' ? 'evaluation breakdown' : 'history and audit trail'}.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIEvaluationDashboard;