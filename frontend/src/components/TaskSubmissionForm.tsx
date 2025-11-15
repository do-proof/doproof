import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Job, JobWithRecommendation } from '../hooks/student/useJobs';
import { 
  useTaskSubmission, 
  useSubmitTask, 
  useUploadSubmissionFile, 
  useUpdateTaskSubmission,
  useSubmissionByJob 
} from '../hooks/student/useTaskSubmissions';
import { useApplicationByJob, useUpdateApplicationProgress } from '../hooks/student/useApplications';
import { useWebSocket, TimeTrackingUpdate } from '../context/WebSocketContext';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage, { ValidationErrorMessage } from './ErrorMessage';
import ConnectionStatusIndicator from './ConnectionStatusIndicator';

interface TaskSubmissionFormProps {
  job: Job | JobWithRecommendation;
  onClose: () => void;
  onSubmit?: (submission: any) => void;
}

interface FormValidationErrors {
  [key: string]: string[];
}

interface FileUploadProgress {
  [fileName: string]: number;
}

const TaskSubmissionForm: React.FC<TaskSubmissionFormProps> = ({ job, onClose, onSubmit }) => {
  // Get the user's application and submission for this job
  const { data: application, isLoading: applicationLoading, error: applicationError } = useApplicationByJob(job._id);
  const { data: existingSubmission, isLoading: submissionLoading, error: submissionError } = useSubmissionByJob(job._id);

  // Mutations
  const submitTaskMutation = useSubmitTask();
  const updateSubmissionMutation = useUpdateTaskSubmission();
  const uploadFileMutation = useUploadSubmissionFile();
  const updateProgressMutation = useUpdateApplicationProgress();
  
  // WebSocket for real-time time tracking
  const { setOnTimeTrackingUpdate, isConnected } = useWebSocket();

  // Form state based on submission format
  const [formData, setFormData] = useState(() => {
    const baseData = {
      description: '',
      documentation: '',
      challenges: '',
      learnings: '',
      files: [] as File[],
      uploadedFiles: [] as { file_url: string; file_name: string; file_size: number }[]
    };

    switch (job.task?.submission_format || 'text') {
      case 'text':
        return {
          ...baseData,
          content: '',
        };
      case 'code':
        return {
          ...baseData,
          githubUrl: '',
          liveUrl: '',
          codeDescription: '',
        };
      case 'presentation':
        return {
          ...baseData,
          presentationUrl: '',
          speakerNotes: '',
        };
      default:
        return baseData;
    }
  });

  const [timeSpent, setTimeSpent] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<FileUploadProgress>({});
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'error' | null>(null);
  const [validationErrors, setValidationErrors] = useState<FormValidationErrors>({});
  const [isDirty, setIsDirty] = useState(false);
  
  // Time tracking
  const startTimeRef = useRef<number>(Date.now());
  const intervalRef = useRef<NodeJS.Timeout>();

  // Initialize form data from existing submission
  useEffect(() => {
    if ((existingSubmission as any)?.submission) {
      try {
        const submissionContent = (existingSubmission as any)?.submission?.content 
          ? JSON.parse((existingSubmission as any).submission.content) 
          : {};
        
        setFormData(prev => ({
          ...prev,
          ...submissionContent,
          uploadedFiles: (existingSubmission as any)?.submission?.file_url ? [{
            file_url: (existingSubmission as any).submission.file_url,
            file_name: (existingSubmission as any).submission.file_name || 'Uploaded file',
            file_size: (existingSubmission as any).submission.file_size || 0
          }] : []
        }));
      } catch (error) {
        console.error('Error parsing existing submission:', error);
      }
    }
    
    if ((existingSubmission as any)?.time_spent) {
      setTimeSpent((existingSubmission as any).time_spent);
    }
  }, [existingSubmission]);

  // Set up real-time time tracking update handler
  useEffect(() => {
    setOnTimeTrackingUpdate((update: TimeTrackingUpdate) => {
      // Only update if this is for the current submission
      if ((existingSubmission as any)?._id === update.submission_id) {
        setTimeSpent(update.time_spent);
      }
    });

    return () => {
      setOnTimeTrackingUpdate(undefined);
    };
  }, [setOnTimeTrackingUpdate, existingSubmission]);

  // Time tracking effect
  useEffect(() => {
    if ((existingSubmission as any)?.status === 'submitted') {
      // Don't track time for already submitted tasks
      return;
    }

    intervalRef.current = setInterval(() => {
      setTimeSpent(prev => {
        const newTime = prev + 1;
        
        // Auto-save progress every 5 minutes
        if (newTime > 0 && newTime % 5 === 0 && application && isDirty) {
          updateProgressMutation.mutate({
            applicationId: (application as any)?._id,
            timeSpent: newTime,
            completionPercentage: calculateCompletionPercentage()
          });
        }
        
        return newTime;
      });
    }, 60000); // Update every minute

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [application, timeSpent, updateProgressMutation, isDirty, existingSubmission, calculateCompletionPercentage]);

  // Auto-save effect
  useEffect(() => {
    if (!isDirty || !existingSubmission || (existingSubmission as any)?.status === 'submitted') {
      return;
    }

    const autoSaveTimer = setTimeout(() => {
      if (hasFormData()) {
        handleAutoSave();
      }
    }, 30000); // Auto-save every 30 seconds

    return () => clearTimeout(autoSaveTimer);
  }, [formData, isDirty, existingSubmission]);

  const hasFormData = useCallback(() => {
    const { files, uploadedFiles, ...otherData } = formData;
    return Object.values(otherData).some(value => 
      typeof value === 'string' ? value.trim().length > 0 : false
    ) || files.length > 0 || uploadedFiles.length > 0;
  }, [formData]);

  const calculateCompletionPercentage = useCallback(() => {
    const requiredFields = getRequiredFields();
    const completedFields = requiredFields.filter(field => {
      const value = formData[field as keyof typeof formData];
      if (typeof value === 'string') {
        return value.trim().length > 0;
      }
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      return false;
    }).length;
    
    return Math.round((completedFields / requiredFields.length) * 100);
  }, [formData]);

  const getRequiredFields = () => {
    const baseRequired = ['description'];
    
    switch (job.task?.submission_format) {
      case 'text':
        return [...baseRequired, 'content'];
      case 'code':
        return [...baseRequired, 'githubUrl'];
      case 'presentation':
        return [...baseRequired, 'presentationUrl'];
      case 'file':
        return [...baseRequired]; // Files will be checked separately
      default:
        return baseRequired;
    }
  };

  const handleAutoSave = useCallback(async () => {
    if (!(existingSubmission as any)?._id || (existingSubmission as any)?.status === 'submitted') return;
    
    setAutoSaveStatus('saving');
    try {
      await updateSubmissionMutation.mutateAsync({
        submissionId: (existingSubmission as any)?._id,
        data: {
          submission: {
            type: job.task?.submission_format || 'text',
            content: getSubmissionContent(),
          },
          time_spent: timeSpent
        }
      });
      setAutoSaveStatus('saved');
      setIsDirty(false);
      setTimeout(() => setAutoSaveStatus(null), 3000);
    } catch (error) {
      console.error('Auto-save failed:', error);
      setAutoSaveStatus('error');
      setTimeout(() => setAutoSaveStatus(null), 5000);
    }
  }, [existingSubmission, updateSubmissionMutation, timeSpent, formData]);

  const getSubmissionContent = useCallback(() => {
    const { files, ...contentData } = formData;
    return JSON.stringify(contentData);
  }, [formData]);

  const handleInputChange = useCallback((field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setIsDirty(true);
    
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [validationErrors]);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const newFiles = Array.from(e.target.files);
    const validFiles: File[] = [];
    const errors: string[] = [];

    // Validate files
    for (const file of newFiles) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        errors.push(`${file.name} is too large (max 10MB)`);
        continue;
      }

      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/zip',
        'application/x-rar-compressed',
        'image/jpeg',
        'image/png',
        'image/gif',
        'text/plain',
        'application/json'
      ];

      if (!allowedTypes.includes(file.type)) {
        errors.push(`${file.name} has an unsupported file type`);
        continue;
      }

      validFiles.push(file);
    }

    if (errors.length > 0) {
      setValidationErrors(prev => ({
        ...prev,
        files: errors
      }));
    }

    if (validFiles.length > 0) {
      setFormData(prev => ({
        ...prev,
        files: [...prev.files, ...validFiles]
      }));
      setIsDirty(true);

      // Auto-upload files
      for (const file of validFiles) {
        try {
          setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));
          
          const uploadResult = await uploadFileMutation.mutateAsync({
            file,
            onProgress: (progress) => {
              setUploadProgress(prev => ({ ...prev, [file.name]: progress }));
            }
          });

          // Add to uploaded files and remove from pending files
          setFormData(prev => ({
            ...prev,
            files: prev.files.filter(f => f.name !== file.name),
            uploadedFiles: [...prev.uploadedFiles, uploadResult]
          }));

          setUploadProgress(prev => {
            const newProgress = { ...prev };
            delete newProgress[file.name];
            return newProgress;
          });

        } catch (error) {
          console.error('File upload failed:', error);
          setValidationErrors(prev => ({
            ...prev,
            files: [...(prev.files || []), `Failed to upload ${file.name}`]
          }));
          
          // Remove failed file from pending files
          setFormData(prev => ({
            ...prev,
            files: prev.files.filter(f => f.name !== file.name)
          }));

          setUploadProgress(prev => {
            const newProgress = { ...prev };
            delete newProgress[file.name];
            return newProgress;
          });
        }
      }
    }

    // Clear the input
    e.target.value = '';
  }, [uploadFileMutation]);

  const removeFile = useCallback((index: number, isUploaded: boolean = false) => {
    if (isUploaded) {
      setFormData(prev => ({
        ...prev,
        uploadedFiles: prev.uploadedFiles.filter((_, i) => i !== index)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        files: prev.files.filter((_, i) => i !== index)
      }));
    }
    setIsDirty(true);
  }, []);

  const validateForm = useCallback(() => {
    const errors: FormValidationErrors = {};
    const requiredFields = getRequiredFields();

    // Check required fields
    for (const field of requiredFields) {
      const value = formData[field as keyof typeof formData];
      if (typeof value === 'string' && !value.trim()) {
        errors[field] = [`${field.charAt(0).toUpperCase() + field.slice(1)} is required`];
      }
    }

    // Special validation for file submissions
    if (job.task?.submission_format === 'file' && formData.uploadedFiles.length === 0 && formData.files.length === 0) {
      errors.files = ['At least one file must be uploaded for file submissions'];
    }

    // URL validation
    if ((formData as any).githubUrl && !isValidUrl((formData as any).githubUrl)) {
      errors.githubUrl = ['Please enter a valid GitHub URL'];
    }

    if ((formData as any).liveUrl && !isValidUrl((formData as any).liveUrl)) {
      errors.liveUrl = ['Please enter a valid URL'];
    }

    if ((formData as any).presentationUrl && !isValidUrl((formData as any).presentationUrl)) {
      errors.presentationUrl = ['Please enter a valid presentation URL'];
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData, job.task?.submission_format]);

  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (!existingSubmission) {
      setValidationErrors({ general: ['No submission found. Please try refreshing the page.'] });
      return;
    }

    setIsSubmitting(true);

    try {
      // First, save any pending changes
      if (isDirty) {
        await updateSubmissionMutation.mutateAsync({
          submissionId: (existingSubmission as any)?._id,
          data: {
            submission: {
              type: job.task?.submission_format || 'text',
              content: getSubmissionContent(),
              ...(formData.uploadedFiles.length > 0 && {
                file_url: formData.uploadedFiles[0].file_url,
                file_name: formData.uploadedFiles[0].file_name,
                file_size: formData.uploadedFiles[0].file_size
              })
            },
            time_spent: timeSpent
          }
        });
      }

      // Then submit the task
      const submittedTask = await submitTaskMutation.mutateAsync({
        submissionId: (existingSubmission as any)?._id,
        data: {
          submission: {
            type: job.task?.submission_format || 'text',
            content: getSubmissionContent(),
            ...(formData.uploadedFiles.length > 0 && {
              file_url: formData.uploadedFiles[0].file_url,
              file_name: formData.uploadedFiles[0].file_name,
              file_size: formData.uploadedFiles[0].file_size
            })
          },
          time_spent: timeSpent
        }
      });

      // Call the onSubmit callback if provided
      if (onSubmit) {
        onSubmit(submittedTask);
      }

      onClose();
    } catch (error: any) {
      console.error('Submission failed:', error);
      setValidationErrors({ 
        general: [error?.message || 'Failed to submit task. Please try again.'] 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (applicationLoading || submissionLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white rounded-xl shadow-2xl p-8">
          <div className="flex items-center space-x-3">
            <LoadingSpinner />
            <span className="text-gray-600">Loading submission form...</span>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (applicationError || submissionError) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md mx-4">
          <ErrorMessage
            title="Unable to Load Submission Form"
            message="There was an error loading your submission. Please try again."
            onRetry={() => window.location.reload()}
            onDismiss={onClose}
          />
        </div>
      </div>
    );
  }

  // Check if already submitted
  const isSubmitted = (existingSubmission as any)?.status === 'submitted';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto mx-4">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {isSubmitted ? 'View Submission' : 'Submit Your Work'}
                  </h2>
                  <p className="text-gray-600 mt-1">{job.title} - Company ID: {job.company_id}</p>
                </div>
                <ConnectionStatusIndicator showLabel={true} />
              </div>
              {autoSaveStatus && (
                <div className="flex items-center mt-2 text-sm">
                  {autoSaveStatus === 'saving' && (
                    <>
                      <LoadingSpinner size="sm" />
                      <span className="ml-2 text-blue-600">Saving...</span>
                    </>
                  )}
                  {autoSaveStatus === 'saved' && (
                    <span className="text-green-600">✓ Auto-saved</span>
                  )}
                  {autoSaveStatus === 'error' && (
                    <span className="text-red-600">⚠ Auto-save failed</span>
                  )}
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-light"
            >
              ×
            </button>
          </div>
        </div>

        {/* Task Info */}
        <div className="p-6 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Deadline:</span>
              <span className="ml-2 font-medium">{job.closing_date || 'No deadline'}</span>
            </div>
            <div>
              <span className="text-gray-500">Reward:</span>
              <span className="ml-2 font-medium text-green-600">{(() => {
                const calculateRewardPoints = (job: any) => {
                  const basePoints = 100;
                  const timeMultiplier = Math.floor(job.task.time_limit / 60);
                  return basePoints + (timeMultiplier * 50);
                };
                return calculateRewardPoints(job);
              })()} points</span>
            </div>
            <div>
              <span className="text-gray-500">Difficulty:</span>
              <span className="ml-2 font-medium">{(() => {
                const getDifficultyFromTimeLimit = (timeLimit: number) => {
                  if (timeLimit <= 60) return 'Easy';
                  if (timeLimit <= 180) return 'Medium';
                  return 'Hard';
                };
                return getDifficultyFromTimeLimit(job.task.time_limit);
              })()}</span>
            </div>
            <div>
              <span className="text-gray-500">Time Spent:</span>
              <span className="ml-2 font-medium text-blue-600">
                {Math.floor(timeSpent / 60)}h {timeSpent % 60}m
              </span>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Completion Progress</span>
              <span>{calculateCompletionPercentage()}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${calculateCompletionPercentage()}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* General Validation Errors */}
        {validationErrors.general && (
          <div className="p-6 border-b border-gray-200">
            <ValidationErrorMessage
              errors={validationErrors.general}
              onDismiss={() => setValidationErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors.general;
                return newErrors;
              })}
            />
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Submission Format Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-900 mb-2">
              Submission Format: {job.task?.submission_format?.toUpperCase() || 'TEXT'}
            </h3>
            <p className="text-sm text-blue-700">
              {job.task?.submission_format === 'code' && 'Please provide your code repository and live demo links along with documentation.'}
              {job.task?.submission_format === 'file' && 'Please upload your files and provide a description of your work.'}
              {job.task?.submission_format === 'presentation' && 'Please provide your presentation link and any speaker notes.'}
              {(!job.task?.submission_format || job.task?.submission_format === 'text') && 'Please provide a detailed text response to the task requirements.'}
            </p>
          </div>

          {/* Text Content (for text submissions) */}
          {(!job.task?.submission_format || job.task?.submission_format === 'text') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Response *
              </label>
              <textarea
                value={(formData as any).content || ''}
                onChange={(e) => handleInputChange('content', e.target.value)}
                rows={8}
                disabled={isSubmitted}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  validationErrors.content ? 'border-red-300' : 'border-gray-300'
                } ${isSubmitted ? 'bg-gray-50' : ''}`}
                placeholder="Provide your detailed response to the task requirements..."
                required
              />
              {validationErrors.content && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.content[0]}</p>
              )}
            </div>
          )}

          {/* Project Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Project Description *
            </label>
            <textarea
              value={(formData as any).description || ''}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={4}
              disabled={isSubmitted}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                validationErrors.description ? 'border-red-300' : 'border-gray-300'
              } ${isSubmitted ? 'bg-gray-50' : ''}`}
              placeholder="Describe your implementation, features, and approach..."
              required
            />
            {validationErrors.description && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.description[0]}</p>
            )}
          </div>

          {/* Code Submission Fields */}
          {job.task?.submission_format === 'code' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    GitHub Repository URL *
                  </label>
                  <input
                    type="url"
                    value={(formData as any).githubUrl || ''}
                    onChange={(e) => handleInputChange('githubUrl', e.target.value)}
                    disabled={isSubmitted}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      validationErrors.githubUrl ? 'border-red-300' : 'border-gray-300'
                    } ${isSubmitted ? 'bg-gray-50' : ''}`}
                    placeholder="https://github.com/username/repo"
                    required
                  />
                  {validationErrors.githubUrl && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.githubUrl[0]}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Live Demo URL
                  </label>
                  <input
                    type="url"
                    value={(formData as any).liveUrl || ''}
                    onChange={(e) => handleInputChange('liveUrl', e.target.value)}
                    disabled={isSubmitted}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      validationErrors.liveUrl ? 'border-red-300' : 'border-gray-300'
                    } ${isSubmitted ? 'bg-gray-50' : ''}`}
                    placeholder="https://your-demo.com"
                  />
                  {validationErrors.liveUrl && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.liveUrl[0]}</p>
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Code Description
                </label>
                <textarea
                  value={(formData as any).codeDescription || ''}
                  onChange={(e) => handleInputChange('codeDescription', e.target.value)}
                  rows={3}
                  disabled={isSubmitted}
                  className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    isSubmitted ? 'bg-gray-50' : ''
                  }`}
                  placeholder="Describe your code structure, key features, and implementation details..."
                />
              </div>
            </div>
          )}

          {/* Presentation Submission Fields */}
          {job.task?.submission_format === 'presentation' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Presentation URL *
                </label>
                <input
                  type="url"
                  value={(formData as any).presentationUrl || ''}
                  onChange={(e) => handleInputChange('presentationUrl', e.target.value)}
                  disabled={isSubmitted}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    validationErrors.presentationUrl ? 'border-red-300' : 'border-gray-300'
                  } ${isSubmitted ? 'bg-gray-50' : ''}`}
                  placeholder="https://docs.google.com/presentation/... or https://slides.com/..."
                  required
                />
                {validationErrors.presentationUrl && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.presentationUrl[0]}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Speaker Notes
                </label>
                <textarea
                  value={(formData as any).speakerNotes || ''}
                  onChange={(e) => handleInputChange('speakerNotes', e.target.value)}
                  rows={4}
                  disabled={isSubmitted}
                  className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    isSubmitted ? 'bg-gray-50' : ''
                  }`}
                  placeholder="Add any speaker notes, key points, or additional context for your presentation..."
                />
              </div>
            </div>
          )}

          {/* Documentation */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Documentation
            </label>
            <textarea
              value={(formData as any).documentation || ''}
              onChange={(e) => handleInputChange('documentation', e.target.value)}
              rows={3}
              disabled={isSubmitted}
              className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                isSubmitted ? 'bg-gray-50' : ''
              }`}
              placeholder="Include setup instructions, API documentation, or any relevant documentation..."
            />
          </div>

          {/* Challenges Faced */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Challenges Faced
            </label>
            <textarea
              value={(formData as any).challenges || ''}
              onChange={(e) => handleInputChange('challenges', e.target.value)}
              rows={3}
              disabled={isSubmitted}
              className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                isSubmitted ? 'bg-gray-50' : ''
              }`}
              placeholder="Describe any challenges you encountered and how you overcame them..."
            />
          </div>

          {/* Key Learnings */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Key Learnings
            </label>
            <textarea
              value={(formData as any).learnings || ''}
              onChange={(e) => handleInputChange('learnings', e.target.value)}
              rows={3}
              disabled={isSubmitted}
              className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                isSubmitted ? 'bg-gray-50' : ''
              }`}
              placeholder="What did you learn from this project? Any new technologies or concepts?"
            />
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {job.task?.submission_format === 'file' ? 'Files *' : 'Additional Files'}
            </label>
            
            {!isSubmitted && (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                  accept=".pdf,.doc,.docx,.zip,.rar,.jpg,.jpeg,.png,.gif,.txt,.json"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <div className="text-4xl mb-2">📁</div>
                  <p className="text-gray-600">Click to upload files or drag and drop</p>
                  <p className="text-sm text-gray-500 mt-1">PDF, DOC, ZIP, Images, Text files (max 10MB each)</p>
                </label>
              </div>
            )}
            
            {/* File Upload Errors */}
            {validationErrors.files && (
              <div className="mt-2">
                <ValidationErrorMessage
                  errors={validationErrors.files}
                  onDismiss={() => setValidationErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.files;
                    return newErrors;
                  })}
                />
              </div>
            )}
            
            {/* Pending Files (being uploaded) */}
            {formData.files.length > 0 && (
              <div className="mt-4 space-y-2">
                <h4 className="text-sm font-medium text-gray-700">Uploading Files:</h4>
                {formData.files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">📄</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{file.name}</p>
                        <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        {uploadProgress[file.name] !== undefined && (
                          <div className="mt-1">
                            <div className="w-full bg-gray-200 rounded-full h-1">
                              <div 
                                className="bg-blue-600 h-1 rounded-full transition-all duration-300"
                                style={{ width: `${uploadProgress[file.name]}%` }}
                              ></div>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">{uploadProgress[file.name]}% uploaded</p>
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(index, false)}
                      className="text-red-500 hover:text-red-700"
                      disabled={uploadProgress[file.name] !== undefined}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            {/* Uploaded Files */}
            {formData.uploadedFiles.length > 0 && (
              <div className="mt-4 space-y-2">
                <h4 className="text-sm font-medium text-gray-700">Uploaded Files:</h4>
                {formData.uploadedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">✅</span>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{file.file_name}</p>
                        <p className="text-xs text-gray-500">{(file.file_size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                    {!isSubmitted && (
                      <button
                        type="button"
                        onClick={() => removeFile(index, true)}
                        className="text-red-500 hover:text-red-700"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AI Evaluation Results (if submitted) */}
          {isSubmitted && (existingSubmission as any)?.ai_evaluation && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">AI Evaluation Results</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-blue-700 mb-2">Overall Score</p>
                  <p className="text-2xl font-bold text-blue-900">{(existingSubmission as any)?.ai_evaluation?.overall_score || 0}/100</p>
                </div>
                <div>
                  <p className="text-sm text-blue-700 mb-2">Criteria Scores</p>
                  <div className="space-y-1 text-sm">
                    {Object.entries((existingSubmission as any)?.ai_evaluation?.criteria_scores || {}).map(([criteria, score]: [string, any]) => (
                      <div key={criteria} className="flex justify-between">
                        <span className="capitalize">{criteria.replace('_', ' ')}</span>
                        <span className="font-medium">{score}/10</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {(existingSubmission as any)?.ai_evaluation?.feedback && (
                <div className="mt-4">
                  <p className="text-sm text-blue-700 mb-2">Feedback</p>
                  <p className="text-sm text-blue-900 bg-white p-3 rounded border">
                    {(existingSubmission as any)?.ai_evaluation?.feedback}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Recruiter Review (if available) */}
          {isSubmitted && (existingSubmission as any)?.recruiter_review && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-purple-900 mb-3">Recruiter Review</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-purple-700 mb-2">Rating</p>
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <span 
                        key={i} 
                        className={`text-lg ${i < ((existingSubmission as any)?.recruiter_review?.rating || 0) ? 'text-yellow-400' : 'text-gray-300'}`}
                      >
                        ⭐
                      </span>
                    ))}
                    <span className="ml-2 text-purple-900 font-medium">
                      {(existingSubmission as any)?.recruiter_review?.rating || 0}/5
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-purple-700 mb-2">Decision</p>
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                    (existingSubmission as any)?.recruiter_review?.decision === 'shortlist' 
                      ? 'bg-green-100 text-green-800' 
                      : (existingSubmission as any)?.recruiter_review?.decision === 'reject'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {((existingSubmission as any)?.recruiter_review?.decision || '').charAt(0).toUpperCase() + 
                     ((existingSubmission as any)?.recruiter_review?.decision || '').slice(1)}
                  </span>
                </div>
              </div>
              {(existingSubmission as any)?.recruiter_review?.notes && (
                <div className="mt-4">
                  <p className="text-sm text-purple-700 mb-2">Notes</p>
                  <p className="text-sm text-purple-900 bg-white p-3 rounded border">
                    {(existingSubmission as any)?.recruiter_review?.notes}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {isSubmitted ? 'Close' : 'Cancel'}
            </button>
            
            {!isSubmitted && (
              <>
                <button
                  type="button"
                  onClick={handleAutoSave}
                  disabled={!isDirty || updateSubmissionMutation.isPending}
                  className="px-6 py-3 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {updateSubmissionMutation.isPending ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Draft</span>
                  )}
                </button>
                
                <button
                  type="submit"
                  disabled={isSubmitting || formData.files.length > 0}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <LoadingSpinner size="sm" color="white" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <span>Submit Work</span>
                  )}
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskSubmissionForm;