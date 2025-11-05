import React, { useState, useEffect } from 'react';
import { Interview, InterviewFeedback, useInterviews } from '../../hooks/recruiter/useInterviews';

interface InterviewFeedbackFormProps {
  interview: Interview;
  onSubmit?: (interview: Interview) => void;
  onCancel?: () => void;
  className?: string;
}

const InterviewFeedbackForm: React.FC<InterviewFeedbackFormProps> = ({
  interview,
  onSubmit,
  onCancel,
  className = ''
}) => {
  const { addFeedback, loading, error } = useInterviews();
  const [formData, setFormData] = useState({
    overall_rating: 3,
    technical_assessment: '',
    behavioral_assessment: '',
    strengths: [''],
    areas_for_improvement: [''],
    final_recommendation: 'pending' as 'hire' | 'no_hire' | 'maybe' | 'pending',
    next_steps: ''
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Initialize form with existing feedback data
  useEffect(() => {
    if (interview.feedback) {
      setFormData({
        overall_rating: interview.feedback.overall_rating,
        technical_assessment: interview.feedback.technical_assessment || '',
        behavioral_assessment: interview.feedback.behavioral_assessment || '',
        strengths: interview.feedback.strengths.length > 0 ? interview.feedback.strengths : [''],
        areas_for_improvement: interview.feedback.areas_for_improvement.length > 0 ? interview.feedback.areas_for_improvement : [''],
        final_recommendation: interview.feedback.final_recommendation,
        next_steps: interview.feedback.next_steps || ''
      });
    }
  }, [interview.feedback]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleArrayItemChange = (field: 'strengths' | 'areas_for_improvement', index: number, value: string) => {
    const newArray = [...formData[field]];
    newArray[index] = value;
    setFormData(prev => ({ ...prev, [field]: newArray }));
  };

  const addArrayItem = (field: 'strengths' | 'areas_for_improvement') => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const removeArrayItem = (field: 'strengths' | 'areas_for_improvement', index: number) => {
    if (formData[field].length > 1) {
      const newArray = formData[field].filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, [field]: newArray }));
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (formData.overall_rating < 1 || formData.overall_rating > 5) {
      errors.overall_rating = 'Overall rating must be between 1 and 5';
    }

    const validStrengths = formData.strengths.filter(s => s.trim());
    if (validStrengths.length === 0) {
      errors.strengths = 'At least one strength must be provided';
    }

    const validImprovements = formData.areas_for_improvement.filter(s => s.trim());
    if (validImprovements.length === 0) {
      errors.areas_for_improvement = 'At least one area for improvement must be provided';
    }

    if (!formData.final_recommendation) {
      errors.final_recommendation = 'Final recommendation is required';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      // Filter out empty strings from arrays
      const validStrengths = formData.strengths.filter(s => s.trim());
      const validImprovements = formData.areas_for_improvement.filter(s => s.trim());

      const feedbackData = {
        overall_rating: formData.overall_rating,
        technical_assessment: formData.technical_assessment || undefined,
        behavioral_assessment: formData.behavioral_assessment || undefined,
        strengths: validStrengths,
        areas_for_improvement: validImprovements,
        final_recommendation: formData.final_recommendation,
        next_steps: formData.next_steps || undefined
      };

      const updatedInterview = await addFeedback(interview._id, feedbackData);
      if (updatedInterview) {
        onSubmit?.(updatedInterview);
      }
    } catch (err) {
      console.error('Failed to save feedback:', err);
    }
  };

  const getRatingColor = (rating: number): string => {
    if (rating >= 4) return 'text-green-600';
    if (rating >= 3) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRecommendationColor = (recommendation: string): string => {
    switch (recommendation) {
      case 'hire':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'no_hire':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'maybe':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-6 ${className}`}>
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Interview Information */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-2">{interview.title}</h3>
        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
          <div>
            <span className="font-medium">Date:</span> {new Date(interview.scheduled_date).toLocaleDateString()}
          </div>
          <div>
            <span className="font-medium">Duration:</span> {interview.duration} minutes
          </div>
          <div>
            <span className="font-medium">Type:</span> {interview.interview_type}
          </div>
          <div>
            <span className="font-medium">Round:</span> {interview.interview_round}
          </div>
        </div>
      </div>

      {/* Overall Rating */}
      <div>
        <label htmlFor="overall_rating" className="block text-sm font-medium text-gray-700 mb-2">
          Overall Rating *
        </label>
        <div className="flex items-center space-x-4">
          <input
            type="range"
            id="overall_rating"
            min="1"
            max="5"
            step="1"
            value={formData.overall_rating}
            onChange={(e) => handleInputChange('overall_rating', parseInt(e.target.value))}
            className="flex-1"
          />
          <div className={`text-2xl font-bold ${getRatingColor(formData.overall_rating)}`}>
            {formData.overall_rating}/5
          </div>
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Poor</span>
          <span>Fair</span>
          <span>Good</span>
          <span>Very Good</span>
          <span>Excellent</span>
        </div>
        {validationErrors.overall_rating && (
          <p className="mt-1 text-sm text-red-600">{validationErrors.overall_rating}</p>
        )}
      </div>

      {/* Technical Assessment */}
      <div>
        <label htmlFor="technical_assessment" className="block text-sm font-medium text-gray-700 mb-2">
          Technical Assessment
        </label>
        <textarea
          id="technical_assessment"
          value={formData.technical_assessment}
          onChange={(e) => handleInputChange('technical_assessment', e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Evaluate the candidate's technical skills, problem-solving approach, and knowledge..."
        />
      </div>

      {/* Behavioral Assessment */}
      <div>
        <label htmlFor="behavioral_assessment" className="block text-sm font-medium text-gray-700 mb-2">
          Behavioral Assessment
        </label>
        <textarea
          id="behavioral_assessment"
          value={formData.behavioral_assessment}
          onChange={(e) => handleInputChange('behavioral_assessment', e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Assess communication skills, cultural fit, teamwork, and soft skills..."
        />
      </div>

      {/* Strengths */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Strengths *
        </label>
        <div className="space-y-2">
          {formData.strengths.map((strength, index) => (
            <div key={index} className="flex items-center space-x-2">
              <input
                type="text"
                value={strength}
                onChange={(e) => handleArrayItemChange('strengths', index, e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Strong problem-solving skills"
              />
              {formData.strengths.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeArrayItem('strengths', index)}
                  className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => addArrayItem('strengths')}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            + Add another strength
          </button>
        </div>
        {validationErrors.strengths && (
          <p className="mt-1 text-sm text-red-600">{validationErrors.strengths}</p>
        )}
      </div>

      {/* Areas for Improvement */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Areas for Improvement *
        </label>
        <div className="space-y-2">
          {formData.areas_for_improvement.map((area, index) => (
            <div key={index} className="flex items-center space-x-2">
              <input
                type="text"
                value={area}
                onChange={(e) => handleArrayItemChange('areas_for_improvement', index, e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Could improve on system design concepts"
              />
              {formData.areas_for_improvement.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeArrayItem('areas_for_improvement', index)}
                  className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => addArrayItem('areas_for_improvement')}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            + Add another area
          </button>
        </div>
        {validationErrors.areas_for_improvement && (
          <p className="mt-1 text-sm text-red-600">{validationErrors.areas_for_improvement}</p>
        )}
      </div>

      {/* Final Recommendation */}
      <div>
        <label htmlFor="final_recommendation" className="block text-sm font-medium text-gray-700 mb-2">
          Final Recommendation *
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { value: 'hire', label: 'Hire', icon: '✓' },
            { value: 'maybe', label: 'Maybe', icon: '?' },
            { value: 'no_hire', label: 'No Hire', icon: '✗' },
            { value: 'pending', label: 'Pending', icon: '⏳' }
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleInputChange('final_recommendation', option.value)}
              className={`
                p-3 border-2 rounded-lg text-center transition-colors
                ${formData.final_recommendation === option.value 
                  ? getRecommendationColor(option.value)
                  : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                }
              `}
            >
              <div className="text-lg mb-1">{option.icon}</div>
              <div className="text-sm font-medium">{option.label}</div>
            </button>
          ))}
        </div>
        {validationErrors.final_recommendation && (
          <p className="mt-1 text-sm text-red-600">{validationErrors.final_recommendation}</p>
        )}
      </div>

      {/* Next Steps */}
      <div>
        <label htmlFor="next_steps" className="block text-sm font-medium text-gray-700 mb-2">
          Next Steps
        </label>
        <textarea
          id="next_steps"
          value={formData.next_steps}
          onChange={(e) => handleInputChange('next_steps', e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="What should happen next? Schedule another round, make an offer, etc..."
        />
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : 'Save Feedback'}
        </button>
      </div>
    </form>
  );
};

export default InterviewFeedbackForm;