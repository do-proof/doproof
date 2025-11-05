import React, { useState, useEffect } from 'react';

interface EvaluationCriteria {
  critical_thinking: number;
  problem_solving: number;
  creativity: number;
  technical_skills: number;
  communication: number;
  attention_to_detail: number;
}

interface EvaluationCriteriaFormProps {
  criteria: EvaluationCriteria;
  onUpdate: (criteria: EvaluationCriteria) => void;
  validationErrors: Record<string, string>;
}

const EvaluationCriteriaForm: React.FC<EvaluationCriteriaFormProps> = ({
  criteria,
  onUpdate,
  validationErrors
}) => {
  const [localCriteria, setLocalCriteria] = useState<EvaluationCriteria>(criteria);
  const [totalWeight, setTotalWeight] = useState(0);

  // Calculate total weight whenever criteria changes
  useEffect(() => {
    const total = Object.values(localCriteria).reduce((sum, weight) => sum + weight, 0);
    setTotalWeight(total);
  }, [localCriteria]);

  // Update parent component when local criteria changes
  useEffect(() => {
    onUpdate(localCriteria);
  }, [localCriteria, onUpdate]);

  const updateCriterion = (key: keyof EvaluationCriteria, value: number) => {
    setLocalCriteria(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const resetToDefaults = () => {
    const defaultCriteria: EvaluationCriteria = {
      critical_thinking: 20,
      problem_solving: 20,
      creativity: 15,
      technical_skills: 20,
      communication: 15,
      attention_to_detail: 10
    };
    setLocalCriteria(defaultCriteria);
  };

  const distributeEvenly = () => {
    const evenWeight = Math.floor(100 / 6);
    const remainder = 100 - (evenWeight * 6);
    
    const evenCriteria: EvaluationCriteria = {
      critical_thinking: evenWeight + (remainder > 0 ? 1 : 0),
      problem_solving: evenWeight + (remainder > 1 ? 1 : 0),
      creativity: evenWeight,
      technical_skills: evenWeight,
      communication: evenWeight,
      attention_to_detail: evenWeight
    };
    setLocalCriteria(evenCriteria);
  };

  const criteriaInfo = {
    critical_thinking: {
      title: 'Critical Thinking',
      description: 'Ability to analyze problems, evaluate information, and make reasoned decisions',
      examples: 'Logical reasoning, problem analysis, decision-making process'
    },
    problem_solving: {
      title: 'Problem Solving',
      description: 'Effectiveness in identifying solutions and implementing them',
      examples: 'Solution approach, implementation strategy, handling edge cases'
    },
    creativity: {
      title: 'Creativity',
      description: 'Innovation and original thinking in approach and solutions',
      examples: 'Unique approaches, innovative solutions, creative presentation'
    },
    technical_skills: {
      title: 'Technical Skills',
      description: 'Proficiency in relevant technical knowledge and application',
      examples: 'Code quality, best practices, technical accuracy'
    },
    communication: {
      title: 'Communication',
      description: 'Clarity in explaining ideas, solutions, and thought processes',
      examples: 'Clear explanations, documentation, presentation quality'
    },
    attention_to_detail: {
      title: 'Attention to Detail',
      description: 'Thoroughness and accuracy in work and deliverables',
      examples: 'Completeness, accuracy, following instructions precisely'
    }
  };

  const getWeightColor = (weight: number) => {
    if (weight >= 25) return 'bg-red-500';
    if (weight >= 20) return 'bg-orange-500';
    if (weight >= 15) return 'bg-yellow-500';
    if (weight >= 10) return 'bg-green-500';
    return 'bg-blue-500';
  };

  const getTotalWeightStatus = () => {
    if (totalWeight === 100) return { color: 'text-green-600', message: 'Perfect! Weights sum to 100%' };
    if (totalWeight > 100) return { color: 'text-red-600', message: `Over by ${totalWeight - 100}%` };
    return { color: 'text-orange-600', message: `Under by ${100 - totalWeight}%` };
  };

  const status = getTotalWeightStatus();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Evaluation Criteria</h3>
        <p className="text-sm text-gray-600 mb-6">
          Set the importance weights for different evaluation criteria. Our AI will score submissions based on these weights. 
          The total must equal 100%.
        </p>

        {/* Total Weight Display */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Total Weight</h4>
              <p className={`text-2xl font-bold ${status.color}`}>
                {totalWeight}%
              </p>
              <p className={`text-sm ${status.color}`}>
                {status.message}
              </p>
            </div>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={resetToDefaults}
                className="px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Reset to Defaults
              </button>
              <button
                type="button"
                onClick={distributeEvenly}
                className="px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Distribute Evenly
              </button>
            </div>
          </div>
          
          {/* Visual Weight Distribution */}
          <div className="mt-4">
            <div className="flex h-2 bg-gray-200 rounded-full overflow-hidden">
              {Object.entries(localCriteria).map(([key, weight]) => (
                <div
                  key={key}
                  className={`${getWeightColor(weight)} transition-all duration-300`}
                  style={{ width: `${(weight / 100) * 100}%` }}
                  title={`${criteriaInfo[key as keyof EvaluationCriteria].title}: ${weight}%`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Validation Error */}
        {validationErrors.criteriaWeights && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-600">{validationErrors.criteriaWeights}</p>
          </div>
        )}

        {/* Criteria Sliders */}
        <div className="space-y-6">
          {Object.entries(criteriaInfo).map(([key, info]) => {
            const weight = localCriteria[key as keyof EvaluationCriteria];
            return (
              <div key={key} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900">{info.title}</h4>
                    <p className="text-xs text-gray-600 mt-1">{info.description}</p>
                  </div>
                  <div className="ml-4 text-right">
                    <div className="text-lg font-bold text-gray-900">{weight}%</div>
                    <div className="text-xs text-gray-500">weight</div>
                  </div>
                </div>

                {/* Slider */}
                <div className="mb-3">
                  <input
                    type="range"
                    min="0"
                    max="50"
                    step="1"
                    value={weight}
                    onChange={(e) => updateCriterion(key as keyof EvaluationCriteria, parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    style={{
                      background: `linear-gradient(to right, ${getWeightColor(weight)} 0%, ${getWeightColor(weight)} ${(weight / 50) * 100}%, #e5e7eb ${(weight / 50) * 100}%, #e5e7eb 100%)`
                    }}
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0%</span>
                    <span>25%</span>
                    <span>50%</span>
                  </div>
                </div>

                {/* Examples */}
                <div className="bg-gray-50 rounded p-2">
                  <p className="text-xs text-gray-600">
                    <span className="font-medium">Examples:</span> {info.examples}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Preset Templates */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-900 mb-3">Quick Templates</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setLocalCriteria({
                critical_thinking: 25,
                problem_solving: 25,
                creativity: 10,
                technical_skills: 25,
                communication: 10,
                attention_to_detail: 5
              })}
              className="text-left p-3 bg-white border border-blue-200 rounded-md hover:bg-blue-50 transition-colors"
            >
              <div className="text-sm font-medium text-blue-900">Technical Focus</div>
              <div className="text-xs text-blue-700 mt-1">Emphasizes technical skills and problem-solving</div>
            </button>

            <button
              type="button"
              onClick={() => setLocalCriteria({
                critical_thinking: 20,
                problem_solving: 15,
                creativity: 25,
                technical_skills: 15,
                communication: 20,
                attention_to_detail: 5
              })}
              className="text-left p-3 bg-white border border-blue-200 rounded-md hover:bg-blue-50 transition-colors"
            >
              <div className="text-sm font-medium text-blue-900">Creative Focus</div>
              <div className="text-xs text-blue-700 mt-1">Values creativity and communication highly</div>
            </button>

            <button
              type="button"
              onClick={() => setLocalCriteria({
                critical_thinking: 20,
                problem_solving: 20,
                creativity: 15,
                technical_skills: 15,
                communication: 15,
                attention_to_detail: 15
              })}
              className="text-left p-3 bg-white border border-blue-200 rounded-md hover:bg-blue-50 transition-colors"
            >
              <div className="text-sm font-medium text-blue-900">Balanced</div>
              <div className="text-xs text-blue-700 mt-1">Equal emphasis on all criteria</div>
            </button>
          </div>
        </div>

        {/* AI Evaluation Info */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start">
            <svg className="h-5 w-5 text-green-400 mt-0.5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h4 className="text-sm font-medium text-green-900">How AI Evaluation Works</h4>
              <div className="text-sm text-green-800 mt-1 space-y-1">
                <p>• Our AI analyzes each submission against these criteria using advanced language models</p>
                <p>• Scores are calculated based on the weights you set here</p>
                <p>• You'll receive detailed feedback explaining the reasoning behind each score</p>
                <p>• You can always review and override AI scores with your own judgment</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tips */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <svg className="h-5 w-5 text-yellow-400 mt-0.5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <h4 className="text-sm font-medium text-yellow-900">Tips for Setting Weights</h4>
              <ul className="text-sm text-yellow-800 mt-1 space-y-1">
                <li>• Consider what's most important for success in this specific role</li>
                <li>• Technical roles might weight technical skills and problem-solving higher</li>
                <li>• Creative roles might emphasize creativity and communication</li>
                <li>• Entry-level positions might focus more on potential and communication</li>
                <li>• Senior roles might weight critical thinking and attention to detail higher</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EvaluationCriteriaForm;