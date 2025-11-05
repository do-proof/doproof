import React, { useState, useEffect } from 'react';
import { Interview, InterviewCreate, InterviewUpdate, useInterviews } from '../../hooks/recruiter/useInterviews';

interface InterviewFormProps {
  interview?: Interview;
  submissionId?: string;
  onSubmit?: (interview: Interview) => void;
  onCancel?: () => void;
  className?: string;
}

const InterviewForm: React.FC<InterviewFormProps> = ({
  interview,
  submissionId,
  onSubmit,
  onCancel,
  className = ''
}) => {
  const { createInterview, updateInterview, loading, error } = useInterviews();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    interview_type: 'video' as 'phone' | 'video' | 'onsite',
    interview_round: 'screening' as 'screening' | 'technical' | 'behavioral' | 'final' | 'culture_fit',
    scheduled_date: '',
    duration: 60,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    location: '',
    meeting_link: '',
    meeting_id: '',
    phone_number: '',
    interviewer_names: [''],
    notes: ''
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Initialize form with existing interview data
  useEffect(() => {
    if (interview) {
      const scheduledDate = new Date(interview.scheduled_date);
      const localDateTime = new Date(scheduledDate.getTime() - scheduledDate.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);

      setFormData({
        title: interview.title,
        description: interview.description || '',
        interview_type: interview.interview_type,
        interview_round: interview.interview_round,
        scheduled_date: localDateTime,
        duration: interview.duration,
        timezone: interview.timezone,
        location: interview.location || '',
        meeting_link: interview.meeting_link || '',
        meeting_id: interview.meeting_id || '',
        phone_number: interview.phone_number || '',
        interviewer_names: interview.interviewer_names.length > 0 ? interview.interviewer_names : [''],
        notes: interview.notes || ''
      });
    }
  }, [interview]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleInterviewerNameChange = (index: number, value: string) => {
    const newNames = [...formData.interviewer_names];
    newNames[index] = value;
    setFormData(prev => ({ ...prev, interviewer_names: newNames }));
  };

  const addInterviewer = () => {
    setFormData(prev => ({
      ...prev,
      interviewer_names: [...prev.interviewer_names, '']
    }));
  };

  const removeInterviewer = (index: number) => {
    if (formData.interviewer_names.length > 1) {
      const newNames = formData.interviewer_names.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, interviewer_names: newNames }));
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.title.trim()) {
      errors.title = 'Interview title is required';
    }

    if (!formData.scheduled_date) {
      errors.scheduled_date = 'Scheduled date and time is required';
    } else {
      const scheduledDate = new Date(formData.scheduled_date);
      if (scheduledDate <= new Date()) {
        errors.scheduled_date = 'Scheduled date must be in the future';
      }
    }

    if (formData.duration <= 0) {
      errors.duration = 'Duration must be greater than 0';
    }

    if (formData.interview_type === 'onsite' && !formData.location.trim()) {
      errors.location = 'Location is required for onsite interviews';
    }

    if (formData.interview_type === 'video' && !formData.meeting_link.trim()) {
      errors.meeting_link = 'Meeting link is required for video interviews';
    }

    if (formData.interview_type === 'phone' && !formData.phone_number.trim()) {
      errors.phone_number = 'Phone number is required for phone interviews';
    }

    const validInterviewerNames = formData.interviewer_names.filter(name => name.trim());
    if (validInterviewerNames.length === 0) {
      errors.interviewer_names = 'At least one interviewer name is required';
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
      // Convert local datetime to UTC ISO string
      const scheduledDate = new Date(formData.scheduled_date).toISOString();
      
      // Filter out empty interviewer names
      const validInterviewerNames = formData.interviewer_names.filter(name => name.trim());

      if (interview) {
        // Update existing interview
        const updateData: InterviewUpdate = {
          title: formData.title,
          description: formData.description || undefined,
          interview_type: formData.interview_type,
          interview_round: formData.interview_round,
          scheduled_date: scheduledDate,
          duration: formData.duration,
          timezone: formData.timezone,
          location: formData.location || undefined,
          meeting_link: formData.meeting_link || undefined,
          meeting_id: formData.meeting_id || undefined,
          phone_number: formData.phone_number || undefined,
          interviewer_names: validInterviewerNames,
          notes: formData.notes || undefined
        };

        const updatedInterview = await updateInterview(interview._id, updateData);
        if (updatedInterview) {
          onSubmit?.(updatedInterview);
        }
      } else if (submissionId) {
        // Create new interview
        const createData: InterviewCreate = {
          submission_id: submissionId,
          title: formData.title,
          description: formData.description || undefined,
          interview_type: formData.interview_type,
          interview_round: formData.interview_round,
          scheduled_date: scheduledDate,
          duration: formData.duration,
          timezone: formData.timezone,
          location: formData.location || undefined,
          meeting_link: formData.meeting_link || undefined,
          meeting_id: formData.meeting_id || undefined,
          phone_number: formData.phone_number || undefined,
          interviewer_names: validInterviewerNames,
          notes: formData.notes || undefined
        };

        const newInterview = await createInterview(createData);
        if (newInterview) {
          onSubmit?.(newInterview);
        }
      }
    } catch (err) {
      console.error('Failed to save interview:', err);
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

      {/* Basic Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Interview Title *
          </label>
          <input
            type="text"
            id="title"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              validationErrors.title ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="e.g., Technical Interview - Senior Developer"
          />
          {validationErrors.title && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.title}</p>
          )}
        </div>

        <div>
          <label htmlFor="interview_round" className="block text-sm font-medium text-gray-700 mb-2">
            Interview Round
          </label>
          <select
            id="interview_round"
            value={formData.interview_round}
            onChange={(e) => handleInputChange('interview_round', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="screening">Screening</option>
            <option value="technical">Technical</option>
            <option value="behavioral">Behavioral</option>
            <option value="culture_fit">Culture Fit</option>
            <option value="final">Final</option>
          </select>
        </div>
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Brief description of what will be covered in this interview..."
        />
      </div>

      {/* Interview Type and Scheduling */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label htmlFor="interview_type" className="block text-sm font-medium text-gray-700 mb-2">
            Interview Type *
          </label>
          <select
            id="interview_type"
            value={formData.interview_type}
            onChange={(e) => handleInputChange('interview_type', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="video">Video Call</option>
            <option value="phone">Phone Call</option>
            <option value="onsite">On-site</option>
          </select>
        </div>

        <div>
          <label htmlFor="scheduled_date" className="block text-sm font-medium text-gray-700 mb-2">
            Date & Time *
          </label>
          <input
            type="datetime-local"
            id="scheduled_date"
            value={formData.scheduled_date}
            onChange={(e) => handleInputChange('scheduled_date', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              validationErrors.scheduled_date ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {validationErrors.scheduled_date && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.scheduled_date}</p>
          )}
        </div>

        <div>
          <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-2">
            Duration (minutes) *
          </label>
          <input
            type="number"
            id="duration"
            value={formData.duration}
            onChange={(e) => handleInputChange('duration', parseInt(e.target.value) || 0)}
            min="15"
            max="480"
            step="15"
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              validationErrors.duration ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {validationErrors.duration && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.duration}</p>
          )}
        </div>
      </div>

      {/* Meeting Details */}
      {formData.interview_type === 'video' && (
        <div>
          <label htmlFor="meeting_link" className="block text-sm font-medium text-gray-700 mb-2">
            Meeting Link *
          </label>
          <input
            type="url"
            id="meeting_link"
            value={formData.meeting_link}
            onChange={(e) => handleInputChange('meeting_link', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              validationErrors.meeting_link ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="https://zoom.us/j/123456789 or https://meet.google.com/abc-defg-hij"
          />
          {validationErrors.meeting_link && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.meeting_link}</p>
          )}
        </div>
      )}

      {formData.interview_type === 'phone' && (
        <div>
          <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number *
          </label>
          <input
            type="tel"
            id="phone_number"
            value={formData.phone_number}
            onChange={(e) => handleInputChange('phone_number', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              validationErrors.phone_number ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="+1 (555) 123-4567"
          />
          {validationErrors.phone_number && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.phone_number}</p>
          )}
        </div>
      )}

      {formData.interview_type === 'onsite' && (
        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
            Location *
          </label>
          <input
            type="text"
            id="location"
            value={formData.location}
            onChange={(e) => handleInputChange('location', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              validationErrors.location ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Office address or meeting room"
          />
          {validationErrors.location && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.location}</p>
          )}
        </div>
      )}

      {/* Interviewers */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Interviewers *
        </label>
        <div className="space-y-2">
          {formData.interviewer_names.map((name, index) => (
            <div key={index} className="flex items-center space-x-2">
              <input
                type="text"
                value={name}
                onChange={(e) => handleInterviewerNameChange(index, e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Interviewer name"
              />
              {formData.interviewer_names.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeInterviewer(index)}
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
            onClick={addInterviewer}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            + Add another interviewer
          </button>
        </div>
        {validationErrors.interviewer_names && (
          <p className="mt-1 text-sm text-red-600">{validationErrors.interviewer_names}</p>
        )}
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
          Notes
        </label>
        <textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => handleInputChange('notes', e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Any additional notes or instructions..."
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
          {loading ? 'Saving...' : interview ? 'Update Interview' : 'Schedule Interview'}
        </button>
      </div>
    </form>
  );
};

export default InterviewForm;