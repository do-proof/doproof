import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import RecruiterLayout from '../../components/recruiter/RecruiterLayout';
import TaskDefinitionForm from '../../components/recruiter/TaskDefinitionForm';
import EvaluationCriteriaForm from '../../components/recruiter/EvaluationCriteriaForm';
import { Job } from '../../hooks/recruiter/useJobs';
import { useAuth } from '../../context/AuthContext';

interface JobFormData {
  title: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  salary: {
    min: number;
    max: number;
    currency: string;
  };
  location: {
    type: 'remote' | 'onsite' | 'hybrid';
    city?: string;
    country?: string;
  };
  employment_type: 'full-time' | 'part-time' | 'contract' | 'internship';
  closing_date?: string;
  task: {
    title: string;
    description: string;
    instructions: string;
    time_limit: number;
    submission_format: 'text' | 'file' | 'code' | 'presentation';
    max_file_size?: number;
    allowed_file_types?: string[];
  };
  evaluation_criteria: {
    critical_thinking: number;
    problem_solving: number;
    creativity: number;
    technical_skills: number;
    communication: number;
    attention_to_detail: number;
  };
}

const initialFormData: JobFormData = {
  title: '',
  description: '',
  requirements: [''],
  responsibilities: [''],
  salary: {
    min: 0,
    max: 0,
    currency: 'USD'
  },
  location: {
    type: 'remote'
  },
  employment_type: 'full-time',
  task: {
    title: '',
    description: '',
    instructions: '',
    time_limit: 60,
    submission_format: 'text'
  },
  evaluation_criteria: {
    critical_thinking: 20,
    problem_solving: 20,
    creativity: 15,
    technical_skills: 20,
    communication: 15,
    attention_to_detail: 10
  }
};

const JobForm: React.FC = () => {
  const navigate = useNavigate();
  const { jobId } = useParams<{ jobId: string }>();
  const { user } = useAuth();
  const isEditing = Boolean(jobId && jobId !== 'new');

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<JobFormData>(initialFormData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [showPreview, setShowPreview] = useState(false);

  const steps = [
    { id: 1, name: 'Job Details', description: 'Basic job information' },
    { id: 2, name: 'Task Definition', description: 'Define the task for candidates' },
    { id: 3, name: 'Evaluation Criteria', description: 'Set scoring weights' },
    { id: 4, name: 'Review & Publish', description: 'Preview and submit' }
  ];

  // Load existing job data if editing
  useEffect(() => {
    if (isEditing && jobId) {
      loadJobData(jobId);
    }
  }, [isEditing, jobId]);

  const loadJobData = async (id: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/jobs/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load job data');
      }

      const job: Job = await response.json();
      setFormData({
        title: job.title,
        description: job.description,
        requirements: job.requirements,
        responsibilities: job.responsibilities,
        salary: job.salary,
        location: job.location,
        employment_type: job.employment_type,
        closing_date: job.closing_date ? job.closing_date.split('T')[0] : undefined,
        task: job.task,
        evaluation_criteria: job.evaluation_criteria
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load job data');
    } finally {
      setLoading(false);
    }
  };

  const validateStep = (step: number): boolean => {
    const errors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!formData.title.trim()) errors.title = 'Job title is required';
        if (!formData.description.trim()) errors.description = 'Job description is required';
        if (formData.requirements.filter(r => r.trim()).length === 0) {
          errors.requirements = 'At least one requirement is needed';
        }
        if (formData.responsibilities.filter(r => r.trim()).length === 0) {
          errors.responsibilities = 'At least one responsibility is needed';
        }
        if (formData.salary.min <= 0) errors.salaryMin = 'Minimum salary must be greater than 0';
        if (formData.salary.max <= formData.salary.min) {
          errors.salaryMax = 'Maximum salary must be greater than minimum';
        }
        if (formData.location.type !== 'remote' && !formData.location.city) {
          errors.locationCity = 'City is required for non-remote positions';
        }
        break;

      case 2:
        if (!formData.task.title.trim()) errors.taskTitle = 'Task title is required';
        if (!formData.task.description.trim()) errors.taskDescription = 'Task description is required';
        if (!formData.task.instructions.trim()) errors.taskInstructions = 'Task instructions are required';
        if (formData.task.time_limit <= 0) errors.taskTimeLimit = 'Time limit must be greater than 0';
        if (formData.task.submission_format === 'file') {
          if (!formData.task.max_file_size || formData.task.max_file_size <= 0) {
            errors.taskFileSize = 'Maximum file size is required for file submissions';
          }
          if (!formData.task.allowed_file_types || formData.task.allowed_file_types.length === 0) {
            errors.taskFileTypes = 'At least one allowed file type is required';
          }
        }
        break;

      case 3:
        const totalWeight = Object.values(formData.evaluation_criteria).reduce((sum, weight) => sum + weight, 0);
        if (Math.abs(totalWeight - 100) > 0.1) {
          errors.criteriaWeights = 'Evaluation criteria weights must sum to 100%';
        }
        break;
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (status: 'draft' | 'active' = 'draft') => {
    if (!validateStep(currentStep)) return;

    const token = localStorage.getItem('token');
    if (!token || !user) return;

    setLoading(true);
    setError(null);

    try {
      const submitData = {
        ...formData,
        status,
        requirements: formData.requirements.filter(r => r.trim()),
        responsibilities: formData.responsibilities.filter(r => r.trim()),
        company_id: 'default-company', // Simplified: using default company for all recruiters
        recruiter_id: user.id
      };

      const url = isEditing 
        ? `http://localhost:8000/jobs/${jobId}`
        : 'http://localhost:8000/jobs';
      
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to save job');
      }

      navigate('/recruiter/jobs');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save job');
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (updates: Partial<JobFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
    setValidationErrors({});
  };

  if (loading && isEditing) {
    return (
      <RecruiterLayout pageTitle={isEditing ? 'Edit Job' : 'Create Job'}>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading job data...</span>
        </div>
      </RecruiterLayout>
    );
  }

  return (
    <RecruiterLayout pageTitle={isEditing ? 'Edit Job' : 'Create Job'}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {isEditing ? 'Edit Job Posting' : 'Create New Job Posting'}
              </h1>
              <p className="text-gray-600 mt-1">
                {isEditing ? 'Update your job posting details' : 'Fill out the details to create a new job posting'}
              </p>
            </div>
            <button
              onClick={() => navigate('/recruiter/jobs')}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <nav aria-label="Progress">
            <ol className="flex items-center">
              {steps.map((step, stepIdx) => (
                <li key={step.id} className={`relative ${stepIdx !== steps.length - 1 ? 'pr-8 sm:pr-20' : ''}`}>
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    {stepIdx !== steps.length - 1 && (
                      <div className={`h-0.5 w-full ${currentStep > step.id ? 'bg-blue-600' : 'bg-gray-200'}`} />
                    )}
                  </div>
                  <div
                    className={`relative w-8 h-8 flex items-center justify-center rounded-full border-2 ${
                      currentStep > step.id
                        ? 'bg-blue-600 border-blue-600'
                        : currentStep === step.id
                        ? 'border-blue-600 bg-white'
                        : 'border-gray-300 bg-white'
                    }`}
                  >
                    {currentStep > step.id ? (
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <span className={`text-sm font-medium ${
                        currentStep === step.id ? 'text-blue-600' : 'text-gray-500'
                      }`}>
                        {step.id}
                      </span>
                    )}
                  </div>
                  <div className="mt-2">
                    <p className={`text-sm font-medium ${
                      currentStep >= step.id ? 'text-blue-600' : 'text-gray-500'
                    }`}>
                      {step.name}
                    </p>
                    <p className="text-xs text-gray-500">{step.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </nav>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-red-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium text-red-800">{error}</span>
            </div>
          </div>
        )}

        {/* Form Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6">
            {currentStep === 1 && (
              <JobDetailsStep
                formData={formData}
                updateFormData={updateFormData}
                validationErrors={validationErrors}
              />
            )}
            
            {currentStep === 2 && (
              <TaskDefinitionForm
                taskData={formData.task}
                onUpdate={(taskData) => updateFormData({ task: taskData })}
                validationErrors={validationErrors}
              />
            )}
            
            {currentStep === 3 && (
              <EvaluationCriteriaForm
                criteria={formData.evaluation_criteria}
                onUpdate={(criteria) => updateFormData({ evaluation_criteria: criteria })}
                validationErrors={validationErrors}
              />
            )}
            
            {currentStep === 4 && (
              <ReviewStep
                formData={formData}
                showPreview={showPreview}
                onTogglePreview={() => setShowPreview(!showPreview)}
              />
            )}
          </div>

          {/* Form Actions */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
            <div>
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={handlePrevious}
                  className="btn-outline"
                >
                  Previous
                </button>
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              {currentStep < steps.length ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="btn-primary"
                >
                  Next
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => handleSubmit('draft')}
                    disabled={loading}
                    className="btn-outline"
                  >
                    {loading ? 'Saving...' : 'Save as Draft'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSubmit('active')}
                    disabled={loading}
                    className="btn-primary"
                  >
                    {loading ? 'Publishing...' : 'Publish Job'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </RecruiterLayout>
  );
};

// Job Details Step Component
interface JobDetailsStepProps {
  formData: JobFormData;
  updateFormData: (updates: Partial<JobFormData>) => void;
  validationErrors: Record<string, string>;
}

const JobDetailsStep: React.FC<JobDetailsStepProps> = ({ formData, updateFormData, validationErrors }) => {
  const handleArrayChange = (field: 'requirements' | 'responsibilities', index: number, value: string) => {
    const newArray = [...formData[field]];
    newArray[index] = value;
    updateFormData({ [field]: newArray });
  };

  const addArrayItem = (field: 'requirements' | 'responsibilities') => {
    updateFormData({ [field]: [...formData[field], ''] });
  };

  const removeArrayItem = (field: 'requirements' | 'responsibilities', index: number) => {
    const newArray = formData[field].filter((_, i) => i !== index);
    updateFormData({ [field]: newArray });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Job Details</h3>
        
        {/* Job Title */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Job Title *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => updateFormData({ title: e.target.value })}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              validationErrors.title ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="e.g. Senior Software Engineer"
          />
          {validationErrors.title && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.title}</p>
          )}
        </div>

        {/* Job Description */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Job Description *
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => updateFormData({ description: e.target.value })}
            rows={4}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              validationErrors.description ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Describe the role, company culture, and what makes this position exciting..."
          />
          {validationErrors.description && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.description}</p>
          )}
        </div>

        {/* Employment Type and Location */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Employment Type *
            </label>
            <select
              value={formData.employment_type}
              onChange={(e) => updateFormData({ employment_type: e.target.value as JobFormData['employment_type'] })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="full-time">Full Time</option>
              <option value="part-time">Part Time</option>
              <option value="contract">Contract</option>
              <option value="internship">Internship</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location Type *
            </label>
            <select
              value={formData.location.type}
              onChange={(e) => updateFormData({ 
                location: { 
                  ...formData.location, 
                  type: e.target.value as JobFormData['location']['type'] 
                } 
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="remote">Remote</option>
              <option value="onsite">On-site</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </div>
        </div>

        {/* Location Details */}
        {formData.location.type !== 'remote' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City *
              </label>
              <input
                type="text"
                value={formData.location.city || ''}
                onChange={(e) => updateFormData({ 
                  location: { ...formData.location, city: e.target.value } 
                })}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  validationErrors.locationCity ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="e.g. San Francisco"
              />
              {validationErrors.locationCity && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.locationCity}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Country
              </label>
              <input
                type="text"
                value={formData.location.country || ''}
                onChange={(e) => updateFormData({ 
                  location: { ...formData.location, country: e.target.value } 
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. United States"
              />
            </div>
          </div>
        )}

        {/* Salary Range */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Salary Range *
          </label>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <input
                type="number"
                value={formData.salary.min || ''}
                onChange={(e) => updateFormData({ 
                  salary: { ...formData.salary, min: parseInt(e.target.value) || 0 } 
                })}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  validationErrors.salaryMin ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Min salary"
              />
              {validationErrors.salaryMin && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.salaryMin}</p>
              )}
            </div>
            <div>
              <input
                type="number"
                value={formData.salary.max || ''}
                onChange={(e) => updateFormData({ 
                  salary: { ...formData.salary, max: parseInt(e.target.value) || 0 } 
                })}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  validationErrors.salaryMax ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Max salary"
              />
              {validationErrors.salaryMax && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.salaryMax}</p>
              )}
            </div>
            <div>
              <select
                value={formData.salary.currency}
                onChange={(e) => updateFormData({ 
                  salary: { ...formData.salary, currency: e.target.value } 
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="INR">INR</option>
              </select>
            </div>
          </div>
        </div>

        {/* Closing Date */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Application Closing Date (Optional)
          </label>
          <input
            type="date"
            value={formData.closing_date || ''}
            onChange={(e) => updateFormData({ closing_date: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            min={new Date().toISOString().split('T')[0]}
          />
        </div>

        {/* Requirements */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Requirements *
          </label>
          {formData.requirements.map((requirement, index) => (
            <div key={index} className="flex items-center space-x-2 mb-2">
              <input
                type="text"
                value={requirement}
                onChange={(e) => handleArrayChange('requirements', index, e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. 3+ years of React experience"
              />
              {formData.requirements.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeArrayItem('requirements', index)}
                  className="p-2 text-red-600 hover:text-red-800"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => addArrayItem('requirements')}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            + Add Requirement
          </button>
          {validationErrors.requirements && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.requirements}</p>
          )}
        </div>

        {/* Responsibilities */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Responsibilities *
          </label>
          {formData.responsibilities.map((responsibility, index) => (
            <div key={index} className="flex items-center space-x-2 mb-2">
              <input
                type="text"
                value={responsibility}
                onChange={(e) => handleArrayChange('responsibilities', index, e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Develop and maintain web applications"
              />
              {formData.responsibilities.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeArrayItem('responsibilities', index)}
                  className="p-2 text-red-600 hover:text-red-800"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => addArrayItem('responsibilities')}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            + Add Responsibility
          </button>
          {validationErrors.responsibilities && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.responsibilities}</p>
          )}
        </div>
      </div>
    </div>
  );
};

// Review Step Component
interface ReviewStepProps {
  formData: JobFormData;
  showPreview: boolean;
  onTogglePreview: () => void;
}

const ReviewStep: React.FC<ReviewStepProps> = ({ formData, showPreview, onTogglePreview }) => {
  const getLocationDisplay = () => {
    const { type, city, country } = formData.location;
    if (type === 'remote') return 'Remote';
    if (city && country) return `${city}, ${country}`;
    if (city) return city;
    if (country) return country;
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const getSalaryDisplay = () => {
    const { min, max, currency } = formData.salary;
    return `${currency} ${min.toLocaleString()} - ${max.toLocaleString()}`;
  };

  const getTaskTimeDisplay = () => {
    const minutes = formData.task.time_limit;
    if (minutes < 60) return `${minutes} minutes`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours} hours`;
  };

  if (showPreview) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Job Preview</h3>
          <button
            onClick={onTogglePreview}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Back to Summary
          </button>
        </div>

        {/* Job Preview */}
        <div className="bg-gray-50 rounded-lg p-6 border">
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{formData.title}</h2>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span>{formData.employment_type.replace('-', ' ')}</span>
              <span>•</span>
              <span>{getLocationDisplay()}</span>
              <span>•</span>
              <span>{getSalaryDisplay()}</span>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">About the Role</h3>
            <p className="text-gray-700 whitespace-pre-wrap">{formData.description}</p>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Requirements</h3>
            <ul className="list-disc list-inside space-y-1">
              {formData.requirements.filter(r => r.trim()).map((requirement, index) => (
                <li key={index} className="text-gray-700">{requirement}</li>
              ))}
            </ul>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Responsibilities</h3>
            <ul className="list-disc list-inside space-y-1">
              {formData.responsibilities.filter(r => r.trim()).map((responsibility, index) => (
                <li key={index} className="text-gray-700">{responsibility}</li>
              ))}
            </ul>
          </div>

          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Task: {formData.task.title}</h3>
            <p className="text-blue-800 mb-3">{formData.task.description}</p>
            <div className="flex items-center space-x-4 text-sm text-blue-700">
              <span className="bg-blue-100 px-2 py-1 rounded">
                {formData.task.submission_format}
              </span>
              <span className="bg-blue-100 px-2 py-1 rounded">
                {getTaskTimeDisplay()}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Review & Publish</h3>
        <button
          onClick={onTogglePreview}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          Preview Job Posting
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Job Details</h4>
          <div className="space-y-1 text-sm text-gray-600">
            <p><span className="font-medium">Title:</span> {formData.title}</p>
            <p><span className="font-medium">Type:</span> {formData.employment_type.replace('-', ' ')}</p>
            <p><span className="font-medium">Location:</span> {getLocationDisplay()}</p>
            <p><span className="font-medium">Salary:</span> {getSalaryDisplay()}</p>
            <p><span className="font-medium">Requirements:</span> {formData.requirements.filter(r => r.trim()).length} items</p>
            <p><span className="font-medium">Responsibilities:</span> {formData.responsibilities.filter(r => r.trim()).length} items</p>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Task Details</h4>
          <div className="space-y-1 text-sm text-gray-600">
            <p><span className="font-medium">Title:</span> {formData.task.title}</p>
            <p><span className="font-medium">Format:</span> {formData.task.submission_format}</p>
            <p><span className="font-medium">Time Limit:</span> {getTaskTimeDisplay()}</p>
            {formData.task.submission_format === 'file' && (
              <>
                <p><span className="font-medium">Max File Size:</span> {formData.task.max_file_size}MB</p>
                <p><span className="font-medium">Allowed Types:</span> {formData.task.allowed_file_types?.join(', ')}</p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Evaluation Criteria Summary */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-2">Evaluation Criteria</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          {Object.entries(formData.evaluation_criteria).map(([key, value]) => (
            <div key={key} className="flex justify-between">
              <span className="text-gray-600 capitalize">{key.replace('_', ' ')}:</span>
              <span className="font-medium">{value}%</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <svg className="h-5 w-5 text-blue-400 mt-0.5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h4 className="text-sm font-medium text-blue-900">Ready to publish?</h4>
            <p className="text-sm text-blue-800 mt-1">
              You can save this job as a draft to continue editing later, or publish it immediately to start receiving applications.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobForm;