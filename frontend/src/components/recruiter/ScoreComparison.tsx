import React, { useMemo } from 'react';
import { TaskSubmission } from '../../hooks/recruiter/useTaskSubmissions';

interface ScoreComparisonProps {
  submissions: TaskSubmission[];
  selectedSubmissionIds?: string[];
  onSelectSubmission?: (submissionId: string) => void;
  className?: string;
  maxComparisons?: number;
}

const ScoreComparison: React.FC<ScoreComparisonProps> = ({
  submissions,
  selectedSubmissionIds = [],
  onSelectSubmission,
  className = '',
  maxComparisons = 5
}) => {
  const evaluatedSubmissions = useMemo(() => {
    return submissions
      .filter(submission => submission.ai_evaluation)
      .sort((a, b) => (b.ai_evaluation?.overall_score || 0) - (a.ai_evaluation?.overall_score || 0));
  }, [submissions]);

  const selectedSubmissions = useMemo(() => {
    return evaluatedSubmissions.filter(submission => 
      selectedSubmissionIds.includes(submission._id)
    ).slice(0, maxComparisons);
  }, [evaluatedSubmissions, selectedSubmissionIds, maxComparisons]);

  const topPerformers = useMemo(() => {
    return evaluatedSubmissions.slice(0, 10);
  }, [evaluatedSubmissions]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBackgroundColor = (score: number) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  };

  const criteriaLabels = {
    critical_thinking: 'Critical Thinking',
    problem_solving: 'Problem Solving',
    creativity: 'Creativity',
    technical_skills: 'Technical Skills',
    communication: 'Communication',
    attention_to_detail: 'Attention to Detail'
  };

  const calculateStats = (submissions: TaskSubmission[]) => {
    if (submissions.length === 0) return null;
    
    const scores = submissions.map(s => s.ai_evaluation?.overall_score || 0);
    const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const highest = Math.max(...scores);
    const lowest = Math.min(...scores);
    
    return { average, highest, lowest };
  };

  const stats = calculateStats(evaluatedSubmissions);

  if (evaluatedSubmissions.length === 0) {
    return (
      <div className={`text-center text-gray-500 p-8 ${className}`}>
        <div className="text-lg mb-2">No evaluated submissions available</div>
        <div className="text-sm">Submissions will appear here once AI evaluation is complete</div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      <div className="p-4 border-b border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900">Score Comparison & Rankings</h3>
        <p className="text-sm text-gray-600 mt-1">
          Compare candidate performance and view rankings across all submissions
        </p>
      </div>

      <div className="p-4">
        {/* Statistics Overview */}
        {stats && (
          <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{stats.average.toFixed(1)}</div>
              <div className="text-sm text-gray-600">Average Score</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${getScoreColor(stats.highest)}`}>{stats.highest}</div>
              <div className="text-sm text-gray-600">Highest Score</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${getScoreColor(stats.lowest)}`}>{stats.lowest}</div>
              <div className="text-sm text-gray-600">Lowest Score</div>
            </div>
          </div>
        )}

        {/* Selected Submissions Comparison */}
        {selectedSubmissions.length > 1 && (
          <div className="mb-6">
            <h4 className="font-medium text-gray-900 mb-3">Selected Candidates Comparison</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-3 text-sm font-medium text-gray-700">Candidate</th>
                    <th className="text-center py-2 px-3 text-sm font-medium text-gray-700">Overall</th>
                    {Object.keys(criteriaLabels).map(key => (
                      <th key={key} className="text-center py-2 px-3 text-sm font-medium text-gray-700">
                        {criteriaLabels[key as keyof typeof criteriaLabels].split(' ')[0]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {selectedSubmissions.map((submission, index) => (
                    <tr key={submission._id} className="border-b border-gray-100">
                      <td className="py-3 px-3">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-xs font-medium">
                              {submission.candidate?.name?.charAt(0) || '?'}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {submission.candidate?.name || 'Unknown'}
                            </div>
                            <div className="text-xs text-gray-500">
                              Rank #{evaluatedSubmissions.findIndex(s => s._id === submission._id) + 1}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`font-bold ${getScoreColor(submission.ai_evaluation?.overall_score || 0)}`}>
                          {submission.ai_evaluation?.overall_score || 0}
                        </span>
                      </td>
                      {Object.entries(submission.ai_evaluation?.criteria_scores || {}).map(([key, score]) => (
                        <td key={key} className="py-3 px-3 text-center">
                          <span className={`text-sm ${getScoreColor(score)}`}>
                            {score}
                          </span>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Top Performers Leaderboard */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Top Performers</h4>
          <div className="space-y-2">
            {topPerformers.map((submission, index) => {
              const rank = index + 1;
              const isSelected = selectedSubmissionIds.includes(submission._id);
              
              return (
                <div
                  key={submission._id}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-200 cursor-pointer hover:shadow-sm ${
                    isSelected 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => onSelectSubmission?.(submission._id)}
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8">
                      <span className="text-lg font-bold text-gray-600">
                        {getRankIcon(rank)}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      {submission.candidate?.profile_picture ? (
                        <img
                          src={submission.candidate.profile_picture}
                          alt={submission.candidate?.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <span className="text-gray-600 font-medium text-sm">
                            {submission.candidate?.name?.charAt(0) || '?'}
                          </span>
                        </div>
                      )}
                      
                      <div>
                        <div className="font-medium text-gray-900">
                          {submission.candidate?.name || 'Unknown Candidate'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {submission.job?.title} • {submission.job?.task.title}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    {/* Mini criteria scores */}
                    <div className="hidden md:flex items-center space-x-2">
                      {Object.entries(submission.ai_evaluation?.criteria_scores || {}).slice(0, 3).map(([key, score]) => (
                        <div key={key} className="text-center">
                          <div className={`text-xs font-medium ${getScoreColor(score)}`}>
                            {score}
                          </div>
                          <div className="text-xs text-gray-400">
                            {criteriaLabels[key as keyof typeof criteriaLabels].split(' ')[0]}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Overall score */}
                    <div className={`text-center p-2 rounded-lg ${getScoreBackgroundColor(submission.ai_evaluation?.overall_score || 0)}`}>
                      <div className={`text-xl font-bold ${getScoreColor(submission.ai_evaluation?.overall_score || 0)}`}>
                        {submission.ai_evaluation?.overall_score || 0}
                      </div>
                      <div className="text-xs text-gray-600">Overall</div>
                    </div>

                    {/* Selection indicator */}
                    {onSelectSubmission && (
                      <div className="ml-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => onSelectSubmission(submission._id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selection Info */}
        {onSelectSubmission && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="text-sm text-blue-800">
              <strong>Tip:</strong> Select up to {maxComparisons} candidates to compare their detailed scores side by side.
              {selectedSubmissionIds.length > 0 && (
                <span className="ml-2">
                  Currently selected: {selectedSubmissionIds.length}/{maxComparisons}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScoreComparison;