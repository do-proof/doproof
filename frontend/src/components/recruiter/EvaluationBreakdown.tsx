import React from 'react';
import { TaskSubmission } from '../../hooks/recruiter/useTaskSubmissions';

interface EvaluationBreakdownProps {
  aiEvaluation: TaskSubmission['ai_evaluation'];
  className?: string;
  showInsights?: boolean;
}

const EvaluationBreakdown: React.FC<EvaluationBreakdownProps> = ({
  aiEvaluation,
  className = '',
  showInsights = true
}) => {
  if (!aiEvaluation) {
    return (
      <div className={`text-center text-gray-500 p-4 ${className}`}>
        <div className="text-sm">No evaluation data available</div>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return '🟢';
    if (score >= 60) return '🟡';
    return '🔴';
  };

  const getScoreDescription = (score: number) => {
    if (score >= 90) return 'Exceptional';
    if (score >= 80) return 'Strong';
    if (score >= 70) return 'Good';
    if (score >= 60) return 'Adequate';
    if (score >= 50) return 'Below Average';
    return 'Needs Improvement';
  };

  const criteriaDetails = {
    critical_thinking: {
      label: 'Critical Thinking',
      description: 'Ability to analyze problems logically and make reasoned judgments',
      icon: '🧠'
    },
    problem_solving: {
      label: 'Problem Solving',
      description: 'Effectiveness in identifying solutions and implementing them',
      icon: '🔧'
    },
    creativity: {
      label: 'Creativity',
      description: 'Innovation and originality in approach and solutions',
      icon: '💡'
    },
    technical_skills: {
      label: 'Technical Skills',
      description: 'Proficiency in relevant technical knowledge and application',
      icon: '⚙️'
    },
    communication: {
      label: 'Communication',
      description: 'Clarity and effectiveness in expressing ideas and solutions',
      icon: '💬'
    },
    attention_to_detail: {
      label: 'Attention to Detail',
      description: 'Thoroughness and accuracy in work completion',
      icon: '🔍'
    }
  };

  const sortedCriteria = Object.entries(aiEvaluation.criteria_scores)
    .sort(([, a], [, b]) => b - a);

  const averageScore = Object.values(aiEvaluation.criteria_scores)
    .reduce((sum, score) => sum + score, 0) / Object.values(aiEvaluation.criteria_scores).length;

  const strengths = sortedCriteria.filter(([, score]) => score >= 75);
  const improvements = sortedCriteria.filter(([, score]) => score < 60);

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      <div className="p-4 border-b border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900">Detailed Evaluation Breakdown</h3>
        <p className="text-sm text-gray-600 mt-1">
          Comprehensive analysis of candidate performance across key criteria
        </p>
      </div>

      <div className="p-4">
        {/* Overall Summary */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Overall Performance</span>
            <span className={`text-2xl font-bold ${getScoreColor(aiEvaluation.overall_score)}`}>
              {aiEvaluation.overall_score}/100
            </span>
          </div>
          <div className="text-sm text-gray-600">
            {getScoreDescription(aiEvaluation.overall_score)} performance with an average score of {averageScore.toFixed(1)} across all criteria
          </div>
        </div>

        {/* Criteria Details */}
        <div className="space-y-4 mb-6">
          <h4 className="font-medium text-gray-900">Criteria Analysis</h4>
          <div className="grid gap-4">
            {sortedCriteria.map(([key, score]) => {
              const criteria = criteriaDetails[key as keyof typeof criteriaDetails];
              return (
                <div key={key} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{criteria.icon}</span>
                      <div>
                        <h5 className="font-medium text-gray-900">{criteria.label}</h5>
                        <p className="text-xs text-gray-500">{criteria.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-xl font-bold ${getScoreColor(score)}`}>
                        {score}
                      </div>
                      <div className="text-xs text-gray-500">
                        {getScoreDescription(score)}
                      </div>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>0</span>
                      <span>100</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${
                          score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${score}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Insights */}
        {showInsights && (
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Performance Insights</h4>
            
            {/* Strengths */}
            {strengths.length > 0 && (
              <div className="p-3 bg-green-50 rounded-lg">
                <h5 className="font-medium text-green-800 mb-2 flex items-center">
                  <span className="mr-2">💪</span>
                  Key Strengths
                </h5>
                <ul className="text-sm text-green-700 space-y-1">
                  {strengths.map(([key, score]) => (
                    <li key={key}>
                      • <strong>{criteriaDetails[key as keyof typeof criteriaDetails].label}</strong> ({score}/100) - 
                      Demonstrates {getScoreDescription(score).toLowerCase()} capability
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Areas for Improvement */}
            {improvements.length > 0 && (
              <div className="p-3 bg-yellow-50 rounded-lg">
                <h5 className="font-medium text-yellow-800 mb-2 flex items-center">
                  <span className="mr-2">📈</span>
                  Areas for Development
                </h5>
                <ul className="text-sm text-yellow-700 space-y-1">
                  {improvements.map(([key, score]) => (
                    <li key={key}>
                      • <strong>{criteriaDetails[key as keyof typeof criteriaDetails].label}</strong> ({score}/100) - 
                      Could benefit from additional focus and development
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* AI Feedback */}
            {aiEvaluation.feedback && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <h5 className="font-medium text-blue-800 mb-2 flex items-center">
                  <span className="mr-2">🤖</span>
                  AI Analysis
                </h5>
                <p className="text-sm text-blue-700 leading-relaxed">
                  {aiEvaluation.feedback}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EvaluationBreakdown;