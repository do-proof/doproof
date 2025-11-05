import React from 'react';
import { TaskSubmission } from '../../hooks/recruiter/useTaskSubmissions';

interface AIScoreDisplayProps {
  aiEvaluation: TaskSubmission['ai_evaluation'];
  size?: 'small' | 'medium' | 'large';
  showBreakdown?: boolean;
  showFeedback?: boolean;
  className?: string;
}

const AIScoreDisplay: React.FC<AIScoreDisplayProps> = ({
  aiEvaluation,
  size = 'medium',
  showBreakdown = true,
  showFeedback = false,
  className = ''
}) => {
  if (!aiEvaluation) {
    return (
      <div className={`text-center text-gray-500 ${className}`}>
        <div className="text-sm">No AI evaluation available</div>
      </div>
    );
  }

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

  const getProgressBarColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const sizeClasses = {
    small: {
      container: 'p-2',
      score: 'text-lg',
      title: 'text-xs',
      breakdown: 'text-xs',
      progressBar: 'h-1'
    },
    medium: {
      container: 'p-3',
      score: 'text-2xl',
      title: 'text-sm',
      breakdown: 'text-xs',
      progressBar: 'h-2'
    },
    large: {
      container: 'p-4',
      score: 'text-3xl',
      title: 'text-base',
      breakdown: 'text-sm',
      progressBar: 'h-3'
    }
  };

  const classes = sizeClasses[size];

  const criteriaLabels = {
    critical_thinking: 'Critical Thinking',
    problem_solving: 'Problem Solving',
    creativity: 'Creativity',
    technical_skills: 'Technical Skills',
    communication: 'Communication',
    attention_to_detail: 'Attention to Detail'
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${classes.container} ${className}`}>
      {/* Overall Score */}
      <div className="text-center mb-4">
        <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${getScoreBackgroundColor(aiEvaluation.overall_score)} mb-2`}>
          <span className={`font-bold ${classes.score} ${getScoreColor(aiEvaluation.overall_score)}`}>
            {aiEvaluation.overall_score}
          </span>
        </div>
        <div className={`font-medium text-gray-700 ${classes.title}`}>
          AI Evaluation Score
        </div>
        <div className="text-xs text-gray-500 mt-1">
          Evaluated on {formatDate(aiEvaluation.evaluated_at)}
        </div>
        <div className="text-xs text-gray-400">
          Model: {aiEvaluation.evaluation_model}
        </div>
      </div>

      {/* Criteria Breakdown */}
      {showBreakdown && (
        <div className="space-y-3">
          <h4 className={`font-medium text-gray-700 ${classes.title}`}>
            Criteria Breakdown
          </h4>
          <div className="space-y-2">
            {Object.entries(aiEvaluation.criteria_scores).map(([key, score]) => (
              <div key={key} className="flex items-center justify-between">
                <span className={`text-gray-600 ${classes.breakdown}`}>
                  {criteriaLabels[key as keyof typeof criteriaLabels]}
                </span>
                <div className="flex items-center space-x-2 flex-1 ml-3">
                  <div className="flex-1 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`${classes.progressBar} ${getProgressBarColor(score)} transition-all duration-300`}
                      style={{ width: `${score}%` }}
                    />
                  </div>
                  <span className={`font-medium ${classes.breakdown} ${getScoreColor(score)} min-w-[2rem] text-right`}>
                    {score}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Feedback */}
      {showFeedback && aiEvaluation.feedback && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <h4 className={`font-medium text-gray-700 mb-2 ${classes.title}`}>
            AI Feedback
          </h4>
          <div className={`text-gray-600 ${classes.breakdown} leading-relaxed`}>
            {aiEvaluation.feedback}
          </div>
        </div>
      )}
    </div>
  );
};

export default AIScoreDisplay;