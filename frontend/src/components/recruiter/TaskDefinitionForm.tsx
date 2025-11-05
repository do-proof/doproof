import React from 'react';

interface TaskData {
  title: string;
  description: string;
  instructions: string;
  time_limit: number;
  submission_format: 'text' | 'file' | 'code' | 'presentation';
  max_file_size?: number;
  allowed_file_types?: string[];
}

interface TaskDefinitionFormProps {
  taskData: TaskData;
  onUpdate: (taskData: TaskData) => void;
  validationErrors: Record<string, string>;
}

const TaskDefinitionForm: React.FC<TaskDefinitionFormProps> = ({
  taskData,
  onUpdate,
  validationErrors
}) => {
  const updateTaskData = (updates: Partial<TaskData>) => {
    onUpdate({ ...taskData, ...updates });
  };

  const handleFileTypeChange = (fileType: string, checked: boolean) => {
    const currentTypes = taskData.allowed_file_types || [];
    let newTypes: string[];
    
    if (checked) {
      newTypes = [...currentTypes, fileType];
    } else {
      newTypes = currentTypes.filter(type => type !== fileType);
    }
    
    updateTaskData({ allowed_file_types: newTypes });
  };

  const getTimeDisplay = (minutes: number) => {
    if (minutes < 60) return `${minutes} minutes`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours} hours`;
  };

  const commonFileTypes = [
    { value: 'pdf', label: 'PDF (.pdf)' },
    { value: 'doc', label: 'Word (.doc)' },
    { value: 'docx', label: 'Word (.docx)' },
    { value: 'txt', label: 'Text (.txt)' },
    { value: 'jpg', label: 'JPEG (.jpg)' },
    { value: 'png', label: 'PNG (.png)' },
    { value: 'zip', label: 'ZIP (.zip)' },
    { value: 'ppt', label: 'PowerPoint (.ppt)' },
    { value: 'pptx', label: 'PowerPoint (.pptx)' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Task Definition</h3>
        <p className="text-sm text-gray-600 mb-6">
          Define the task that candidates will complete as part of their application. This task will be evaluated by our AI system based on the criteria you set.
        </p>

        {/* Task Title */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Task Title *
          </label>
          <input
            type="text"
            value={taskData.title}
            onChange={(e) => updateTaskData({ title: e.target.value })}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              validationErrors.taskTitle ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="e.g. Frontend Development Challenge"
          />
          {validationErrors.taskTitle && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.taskTitle}</p>
          )}
        </div>

        {/* Task Description */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Task Description *
          </label>
          <textarea
            value={taskData.description}
            onChange={(e) => updateTaskData({ description: e.target.value })}
            rows={3}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              validationErrors.taskDescription ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Brief overview of what the candidate needs to accomplish..."
          />
          {validationErrors.taskDescription && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.taskDescription}</p>
          )}
        </div>

        {/* Task Instructions */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Detailed Instructions *
          </label>
          <textarea
            value={taskData.instructions}
            onChange={(e) => updateTaskData({ instructions: e.target.value })}
            rows={6}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              validationErrors.taskInstructions ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Provide step-by-step instructions, requirements, and any specific guidelines the candidate should follow..."
          />
          {validationErrors.taskInstructions && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.taskInstructions}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Be specific about what you're looking for. Clear instructions lead to better submissions and more accurate AI evaluations.
          </p>
        </div>

        {/* Time Limit */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Time Limit *
          </label>
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <input
                type="range"
                min="15"
                max="480"
                step="15"
                value={taskData.time_limit}
                onChange={(e) => updateTaskData({ time_limit: parseInt(e.target.value) })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>15 min</span>
                <span>2 hours</span>
                <span>4 hours</span>
                <span>8 hours</span>
              </div>
            </div>
            <div className="bg-blue-50 px-3 py-2 rounded-md min-w-[100px] text-center">
              <span className="text-sm font-medium text-blue-900">
                {getTimeDisplay(taskData.time_limit)}
              </span>
            </div>
          </div>
          {validationErrors.taskTimeLimit && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.taskTimeLimit}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Consider the complexity of your task when setting the time limit. Candidates will see this before starting.
          </p>
        </div>

        {/* Submission Format */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Submission Format *
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                value: 'text',
                title: 'Text Response',
                description: 'Written answers, essays, or explanations',
                icon: (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                )
              },
              {
                value: 'code',
                title: 'Code Submission',
                description: 'Programming solutions or code snippets',
                icon: (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                )
              },
              {
                value: 'file',
                title: 'File Upload',
                description: 'Documents, images, or other files',
                icon: (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                )
              },
              {
                value: 'presentation',
                title: 'Presentation',
                description: 'Slides, videos, or multimedia content',
                icon: (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2h4a1 1 0 011 1v14a1 1 0 01-1 1H3a1 1 0 01-1-1V5a1 1 0 011-1h4zM9 4h6v10l-3-3-3 3V4z" />
                  </svg>
                )
              }
            ].map((format) => (
              <div
                key={format.value}
                className={`relative rounded-lg border-2 cursor-pointer transition-all ${
                  taskData.submission_format === format.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => updateTaskData({ submission_format: format.value as TaskData['submission_format'] })}
              >
                <div className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className={`${
                      taskData.submission_format === format.value ? 'text-blue-600' : 'text-gray-400'
                    }`}>
                      {format.icon}
                    </div>
                    <div className="flex-1">
                      <h4 className={`text-sm font-medium ${
                        taskData.submission_format === format.value ? 'text-blue-900' : 'text-gray-900'
                      }`}>
                        {format.title}
                      </h4>
                      <p className={`text-xs ${
                        taskData.submission_format === format.value ? 'text-blue-700' : 'text-gray-500'
                      }`}>
                        {format.description}
                      </p>
                    </div>
                  </div>
                </div>
                {taskData.submission_format === format.value && (
                  <div className="absolute top-2 right-2">
                    <div className="bg-blue-600 rounded-full p-1">
                      <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* File Upload Settings */}
        {taskData.submission_format === 'file' && (
          <div className="bg-gray-50 rounded-lg p-4 space-y-4">
            <h4 className="text-sm font-medium text-gray-900">File Upload Settings</h4>
            
            {/* Max File Size */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maximum File Size (MB) *
              </label>
              <select
                value={taskData.max_file_size || ''}
                onChange={(e) => updateTaskData({ max_file_size: parseInt(e.target.value) })}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  validationErrors.taskFileSize ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Select file size limit</option>
                <option value="5">5 MB</option>
                <option value="10">10 MB</option>
                <option value="25">25 MB</option>
                <option value="50">50 MB</option>
                <option value="100">100 MB</option>
              </select>
              {validationErrors.taskFileSize && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.taskFileSize}</p>
              )}
            </div>

            {/* Allowed File Types */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Allowed File Types *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {commonFileTypes.map((fileType) => (
                  <label key={fileType.value} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={taskData.allowed_file_types?.includes(fileType.value) || false}
                      onChange={(e) => handleFileTypeChange(fileType.value, e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">{fileType.label}</span>
                  </label>
                ))}
              </div>
              {validationErrors.taskFileTypes && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.taskFileTypes}</p>
              )}
            </div>
          </div>
        )}

        {/* Task Preview */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-900 mb-2">Task Preview</h4>
          <div className="text-sm text-blue-800">
            <p className="mb-1">
              <span className="font-medium">Format:</span> {taskData.submission_format}
            </p>
            <p className="mb-1">
              <span className="font-medium">Time Limit:</span> {getTimeDisplay(taskData.time_limit)}
            </p>
            {taskData.submission_format === 'file' && taskData.max_file_size && (
              <p className="mb-1">
                <span className="font-medium">Max File Size:</span> {taskData.max_file_size}MB
              </p>
            )}
            {taskData.title && (
              <p className="mt-2 font-medium">{taskData.title}</p>
            )}
            {taskData.description && (
              <p className="mt-1 text-blue-700">{taskData.description}</p>
            )}
          </div>
        </div>

        {/* Tips */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <svg className="h-5 w-5 text-yellow-400 mt-0.5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <h4 className="text-sm font-medium text-yellow-900">Tips for Better Tasks</h4>
              <ul className="text-sm text-yellow-800 mt-1 space-y-1">
                <li>• Be specific about what you want to evaluate (problem-solving, creativity, technical skills)</li>
                <li>• Provide clear success criteria so candidates know what good looks like</li>
                <li>• Consider the time limit carefully - too short may rush candidates, too long may deter applications</li>
                <li>• Include any resources or references candidates are allowed to use</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDefinitionForm;