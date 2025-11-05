import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import RecruiterLayout from '../../components/recruiter/RecruiterLayout';
import FormField from '../../components/forms/FormField';
import TextAreaField from '../../components/forms/TextAreaField';
import SelectField from '../../components/forms/SelectField';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import { useJobs, Job } from '../../hooks/recruiter/useJobs';
import { useNotifications } from '../../context/NotificationContext';
import { useFormValidation, validationRules } from '../../utils/validation';

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
    technical_skills: 25,
    communication: 10,
    attention_to_detail: 10
  }
};

// Validation schema - simplified for basic fields only
const validationSchema: Record<string, any> = {
  title: [
    validationRules.required('Job title is required'),
    validationRules.minLength(5, 'Job title must be at least 5 characters'),
    validationRules.maxLength(100, 'Job title must be no more than 100 characters')
  ],
  description: [
    validationRules.required('Job description is required'),
    validationRules.minLength(50, 'Job description must be at least 50 characters'),
    validationRules.maxLength(2000, 'Job description must be no more than 2000 characters')
  ]
};

const JobFormEnhanced: React.FC = () => {
  const navigate = useNavigate();
  const { jobId } = useParams<{ jobId: string }>();
  const isEditing = Boolean(jobId);
  
  const { createJob, updateJob, getJob } = useJobs();
  const { showSuccess, showError } = useNotifications();
  
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<JobFormData>(initialFormData);
  
  // Form validation
  const {
    values,
    errors,
    touched,
    isValid,
    handleChange,
    handleBlur,
    validateForm,
    reset
  } = useFormValidation(formData, validationSchema);

  // Load existing job data for editing
  useEffect(() => {
    if (isEditing && jobId) {
      loadJobData(jobId);
    }
  }, [isEditing, jobId]);

  const loadJobData = async (id: string) => {
    setLoading(true);
    try {
      const job = await getJob(id);
      if (job) {
        setFormData({
          title: job.title,
          description: job.description,
          requirements: job.requirements,
          responsibilities: job.responsibilities,
          salary: job.salary,
          location: job.location,
          employment_type: job.employment_type,
          closing_date: job.closing_date,
          task: job.task,
          evaluation_criteria: job.evaluation_criteria
        });
      } else {
        showError('Job not found', 'Error');
        navigate('/recruiter/jobs');
      }
    } catch (error) {
      showError('Failed to load job data', 'Error');
      navigate('/recruiter/jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = validateForm();
    if (!validation.isValid) {
      showError('Please fix the validation errors before submitting', 'Validation Error');
      return;
    }

    // Additional custom validations
    if (formData.salary.max < formData.salary.min) {
      showError('Maximum salary must be greater than minimum salary', 'Invalid Salary Range');
      return;
    }

    const criteriaTotal = Object.values(formData.evaluation_criteria).reduce((sum, val) => sum + val, 0);
    if (Math.abs(criteriaTotal - 100) > 0.01) {
      showError('Evaluation criteria weights must add up to 100%', 'Invalid Criteria Weights');
      return;
    }

    setSubmitting(true);
    try {
      let result;
      if (isEditing && jobId) {
        result = await updateJob(jobId, formData as any);
      } else {
        // Add required fields for job creation
        const jobData = {
          ...formData,
          status: 'draft' as const,
          posted_date: new Date().toISOString(),
          company_id: 'temp-company-id', // This should come from user context
          recruiter_id: 'temp-recruiter-id' // This should come from user context
        };
        result = await createJob(jobData as any);
      }

      if (result) {
        showSuccess(
          `Job ${isEditing ? 'updated' : 'created'} successfully`,
          'Success'
        );
        navigate('/recruiter/jobs');
      }
    } catch (error) {
      showError(
        `Failed to ${isEditing ? 'update' : 'create'} job`,
        'Error'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleArrayFieldChange = (field: 'requirements' | 'responsibilities', index: number, value: string) => {
    const newArray = [...formData[field]];
    newArray[index] = value;
    setFormData(prev => ({ ...prev, [field]: newArray }));
  };

  const addArrayField = (field: 'requirements' | 'responsibilities') => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const removeArrayField = (field: 'requirements' | 'responsibilities', index: number) => {
    if (formData[field].length > 1) {
      const newArray = formData[field].filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, [field]: newArray }));
    }
  };

  const handleCriteriaChange = (criteria: keyof JobFormData['evaluation_criteria'], value: number) => {
    setFormData(prev => ({
      ...prev,
      evaluation_criteria: {
        ...prev.evaluation_criteria,
        [criteria]: value
      }
    }));
  };

  const steps = [
    { id: 1, name: 'Basic Information', description: 'Job title, description, and requirements' },
    { id: 2, name: 'Job Details', description: 'Salary, location, and employment type' },
    { id: 3, name: 'Task Definition', description: 'Define the task candidates will complete' },
    { id: 4, name: 'Evaluation Criteria', description: 'Set evaluation weights and criteria' },
    { id: 5, name: 'Review & Submit', description: 'Review all information before publishing' }
  ];

  if (loading) {
    return (
      <RecruiterLayout pageTitle={isEditing ? 'Edit Job' : 'Create Job'}>
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" text="Loading job data..." />
        </div>
      </RecruiterLayout>
    );
  }

  return (
    <RecruiterLayout pageTitle={isEditing ? 'Edit Job' : 'Create Job'}>
      <div className="max-w-4xl mx-auto">
        {/* Progress Steps */}
        <div className="mb-8">
          <nav aria-label="Progress">
            <ol className="flex items-center">
              {steps.map((step, stepIdx) => (
                <li key={step.id} className={`relative ${stepIdx !== steps.length - 1 ? 'pr-8 sm:pr-20' : ''}`}>
                  <div className="flex items-center">
                    <div className={`relative flex h-8 w-8 items-center justify-center rounded-full ${
                      step.id < currentStep ? 'bg-blue-600' :
                      step.id === currentStep ? 'bg-blue-600' :
                      'bg-gray-300'
                    }`}>
                      {step.id < currentStep ? (
                        <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <span className={`text-sm font-medium ${
                          step.id === currentStep ? 'text-white' : 'text-gray-500'
                        }`}>
                          {step.id}
                        </span>
                      )}
                    </div>
                    <span className={`ml-4 text-sm font-medium ${
                      step.id <= currentStep ? 'text-blue-600' : 'text-gray-500'
                    }`}>
                      {step.name}
                    </span>
                  </div>
                  {stepIdx !== steps.length - 1 && (
                    <div className="absolute top-4 left-4 -ml-px mt-0.5 h-full w-0.5 bg-gray-300" />
                  )}
                </li>
              ))}
            </ol>
          </nav>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-white shadow-sm rounded-lg p-6">
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
                  
                  <div className="space-y-4">
                    <FormField
                      label="Job Title"
                      name="title"
                      value={formData.title}
                      onChange={(value) => setFormData(prev => ({ ...prev, title: value as string }))}
                      onBlur={() => handleBlur('title')}
                      errors={errors.title}
                      touched={touched.title}
                      required
                      placeholder="e.g. Senior Software Engineer"
                      helpText="Be specific and descriptive to attract the right candidates"
                    />

                    <TextAreaField
                      label="Job Description"
                      name="description"
                      value={formData.description}
                      onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
                      onBlur={() => handleBlur('description')}
                      errors={errors.description}
                      touched={touched.description}
                      required
                      rows={6}
                      maxLength={2000}
                      showCharCount
                      placeholder="Describe the role, company culture, and what makes this position exciting..."
                      helpText="Provide a comprehensive overview of the position and your company"
                    />

                    {/* Requirements */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Requirements <span className="text-red-500">*</span>
                      </label>
                      {formData.requirements.map((requirement, index) => (
                        <div key={index} className="flex items-center space-x-2 mb-2">
                          <input
                            type="text"
                            value={requirement}
                            onChange={(e) => handleArrayFieldChange('requirements', index, e.target.value)}
                            placeholder="e.g. 3+ years of React experience"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          />
                          {formData.requirements.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeArrayField('requirements', index)}
                              className="p-2 text-red-500 hover:text-red-700"
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
                        onClick={() => addArrayField('requirements')}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        + Add Requirement
                      </button>
                    </div>

                    {/* Responsibilities */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Responsibilities <span className="text-red-500">*</span>
                      </label>
                      {formData.responsibilities.map((responsibility, index) => (
                        <div key={index} className="flex items-center space-x-2 mb-2">
                          <input
                            type="text"
                            value={responsibility}
                            onChange={(e) => handleArrayFieldChange('responsibilities', index, e.target.value)}
                            placeholder="e.g. Design and implement new features"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          />
                          {formData.responsibilities.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeArrayField('responsibilities', index)}
                              className="p-2 text-red-500 hover:text-red-700"
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
                        onClick={() => addArrayField('responsibilities')}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        + Add Responsibility
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                disabled={currentStep === 1}
                className="btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              {currentStep < steps.length ? (
                <button
                  type="button"
                  onClick={() => setCurrentStep(Math.min(steps.length, currentStep + 1))}
                  className="btn-primary"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={submitting || !isValid}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <LoadingSpinner size="sm" color="white" className="mr-2" />
                      {isEditing ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    isEditing ? 'Update Job' : 'Create Job'
                  )}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </RecruiterLayout>
  );
};

export default JobFormEnhanced;