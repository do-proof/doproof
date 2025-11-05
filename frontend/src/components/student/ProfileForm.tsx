import React, { useState, useEffect } from 'react';
import { 
  PersonalInfo, 
  SkillsInfo, 
  ExperienceInfo, 
  CareerPreferences, 
  PortfolioInfo, 
  NotificationPreferences, 
  PrivacySettings 
} from '../../hooks/student/useStudentProfile';

// Base form component props
interface BaseFormProps<T> {
  data: T;
  onSave: (data: T) => Promise<any>;
  isLoading: boolean;
  isEditing: boolean;
  onEdit: () => void;
  onCancel: () => void;
}

// Personal Info Form Component
interface PersonalInfoFormProps {
  personalInfo: PersonalInfo;
  onSave: (data: PersonalInfo) => Promise<any>;
  isLoading: boolean;
  isEditing: boolean;
  onEdit: () => void;
  onCancel: () => void;
}

export const PersonalInfoForm: React.FC<PersonalInfoFormProps> = ({
  personalInfo,
  onSave,
  isLoading,
  isEditing,
  onEdit,
  onCancel,
}) => {
  const [formData, setFormData] = useState<PersonalInfo>(personalInfo);

  useEffect(() => {
    setFormData(personalInfo);
  }, [personalInfo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onSave(formData);
      onCancel();
    } catch (error) {
      console.error('Failed to save personal info:', error);
    }
  };

  const handleInputChange = (field: keyof PersonalInfo, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleLocationChange = (field: 'city' | 'country', value: string) => {
    setFormData(prev => ({
      ...prev,
      location: {
        ...prev.location,
        [field]: value
      }
    }));
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Personal Information</h2>
          <p className="text-gray-600">Basic information about yourself</p>
        </div>
        {!isEditing && (
          <button
            onClick={onEdit}
            className="px-4 py-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            Edit
          </button>
        )}
      </div>      {
isEditing ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                First Name
              </label>
              <input
                type="text"
                value={formData.first_name || ''}
                onChange={(e) => handleInputChange('first_name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your first name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Last Name
              </label>
              <input
                type="text"
                value={formData.last_name || ''}
                onChange={(e) => handleInputChange('last_name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your last name"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              value={formData.phone || ''}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your phone number"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City
              </label>
              <input
                type="text"
                value={formData.location?.city || ''}
                onChange={(e) => handleLocationChange('city', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your city"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Country
              </label>
              <input
                type="text"
                value={formData.location?.country || ''}
                onChange={(e) => handleLocationChange('country', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your country"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bio
            </label>
            <textarea
              value={formData.bio || ''}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Tell us about yourself..."
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
            >
              {isLoading && (
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              )}
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">First Name</label>
              <p className="text-gray-900">{personalInfo.first_name || 'Not provided'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Last Name</label>
              <p className="text-gray-900">{personalInfo.last_name || 'Not provided'}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Phone Number</label>
            <p className="text-gray-900">{personalInfo.phone || 'Not provided'}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">City</label>
              <p className="text-gray-900">{personalInfo.location?.city || 'Not provided'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Country</label>
              <p className="text-gray-900">{personalInfo.location?.country || 'Not provided'}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Bio</label>
            <p className="text-gray-900 whitespace-pre-wrap">{personalInfo.bio || 'Not provided'}</p>
          </div>
        </div>
      )}
    </div>
  );
};

// Skills Form Component
interface SkillsFormProps {
  skills: SkillsInfo;
  onSave: (data: SkillsInfo) => Promise<any>;
  isLoading: boolean;
  isEditing: boolean;
  onEdit: () => void;
  onCancel: () => void;
}

export const SkillsForm: React.FC<SkillsFormProps> = ({
  skills,
  onSave,
  isLoading,
  isEditing,
  onEdit,
  onCancel,
}) => {
  const [formData, setFormData] = useState<SkillsInfo>(skills);
  const [newSkill, setNewSkill] = useState('');
  const [newCertification, setNewCertification] = useState('');

  useEffect(() => {
    setFormData(skills);
  }, [skills]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onSave(formData);
      onCancel();
    } catch (error) {
      console.error('Failed to save skills:', error);
    }
  };

  const addSkill = (type: 'technical_skills' | 'soft_skills') => {
    if (newSkill.trim()) {
      setFormData(prev => ({
        ...prev,
        [type]: [...(prev[type] || []), newSkill.trim()]
      }));
      setNewSkill('');
    }
  };

  const removeSkill = (type: 'technical_skills' | 'soft_skills', index: number) => {
    setFormData(prev => ({
      ...prev,
      [type]: prev[type]?.filter((_, i) => i !== index) || []
    }));
  };

  const addCertification = () => {
    if (newCertification.trim()) {
      setFormData(prev => ({
        ...prev,
        certifications: [...(prev.certifications || []), newCertification.trim()]
      }));
      setNewCertification('');
    }
  };

  const removeCertification = (index: number) => {
    setFormData(prev => ({
      ...prev,
      certifications: prev.certifications?.filter((_, i) => i !== index) || []
    }));
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Skills & Certifications</h2>
          <p className="text-gray-600">Your technical and soft skills</p>
        </div>
        {!isEditing && (
          <button
            onClick={onEdit}
            className="px-4 py-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            Edit
          </button>
        )}
      </div>      {
isEditing ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Technical Skills */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Technical Skills
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.technical_skills?.map((skill, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => removeSkill('technical_skills', index)}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex space-x-2">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill('technical_skills'))}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Add a technical skill"
              />
              <button
                type="button"
                onClick={() => addSkill('technical_skills')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add
              </button>
            </div>
          </div>

          {/* Soft Skills */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Soft Skills
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.soft_skills?.map((skill, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => removeSkill('soft_skills', index)}
                    className="ml-2 text-green-600 hover:text-green-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex space-x-2">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill('soft_skills'))}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Add a soft skill"
              />
              <button
                type="button"
                onClick={() => addSkill('soft_skills')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Add
              </button>
            </div>
          </div>

          {/* Certifications */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Certifications
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.certifications?.map((cert, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-800"
                >
                  {cert}
                  <button
                    type="button"
                    onClick={() => removeCertification(index)}
                    className="ml-2 text-yellow-600 hover:text-yellow-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex space-x-2">
              <input
                type="text"
                value={newCertification}
                onChange={(e) => setNewCertification(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCertification())}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Add a certification"
              />
              <button
                type="button"
                onClick={addCertification}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
              >
                Add
              </button>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Save Changes
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-2">Technical Skills</label>
            <div className="flex flex-wrap gap-2">
              {skills.technical_skills?.length ? (
                skills.technical_skills.map((skill, index) => (
                  <span key={index} className="px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                    {skill}
                  </span>
                ))
              ) : (
                <p className="text-gray-500">No technical skills added</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-2">Soft Skills</label>
            <div className="flex flex-wrap gap-2">
              {skills.soft_skills?.length ? (
                skills.soft_skills.map((skill, index) => (
                  <span key={index} className="px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
                    {skill}
                  </span>
                ))
              ) : (
                <p className="text-gray-500">No soft skills added</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-2">Certifications</label>
            <div className="flex flex-wrap gap-2">
              {skills.certifications?.length ? (
                skills.certifications.map((cert, index) => (
                  <span key={index} className="px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-800">
                    {cert}
                  </span>
                ))
              ) : (
                <p className="text-gray-500">No certifications added</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Experience Form Component
interface ExperienceFormProps {
  experience: ExperienceInfo;
  onSave: (data: ExperienceInfo) => Promise<any>;
  isLoading: boolean;
  isEditing: boolean;
  onEdit: () => void;
  onCancel: () => void;
}

export const ExperienceForm: React.FC<ExperienceFormProps> = ({
  experience,
  onSave,
  isLoading,
  isEditing,
  onEdit,
  onCancel,
}) => {
  const [formData, setFormData] = useState<ExperienceInfo>(experience);

  useEffect(() => {
    setFormData(experience);
  }, [experience]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onSave(formData);
      onCancel();
    } catch (error) {
      console.error('Failed to save experience:', error);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Experience</h2>
          <p className="text-gray-600">Your work experience and education</p>
        </div>
        {!isEditing && (
          <button onClick={onEdit} className="px-4 py-2 text-blue-600 hover:text-blue-700 font-medium">
            Edit
          </button>
        )}
      </div>

      {isEditing ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Experience Level</label>
            <select
              value={formData.level || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, level: e.target.value as any }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select level</option>
              <option value="entry">Entry Level</option>
              <option value="junior">Junior Level</option>
              <option value="mid">Mid Level</option>
              <option value="senior">Senior Level</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Years of Experience</label>
            <input
              type="number"
              min="0"
              max="50"
              value={formData.years_of_experience || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, years_of_experience: parseInt(e.target.value) || 0 }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button type="button" onClick={onCancel} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
              Cancel
            </button>
            <button type="submit" disabled={isLoading} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Save Changes
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Experience Level</label>
            <p className="text-gray-900">{experience.level || 'Not specified'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Years of Experience</label>
            <p className="text-gray-900">{experience.years_of_experience || 0} years</p>
          </div>
        </div>
      )}
    </div>
  );
};

// Career Preferences Form Component
interface PreferencesFormProps {
  preferences: CareerPreferences;
  onSave: (data: CareerPreferences) => Promise<any>;
  isLoading: boolean;
  isEditing: boolean;
  onEdit: () => void;
  onCancel: () => void;
}

export const PreferencesForm: React.FC<PreferencesFormProps> = ({
  preferences,
  onSave,
  isLoading,
  isEditing,
  onEdit,
  onCancel,
}) => {
  const [formData, setFormData] = useState<CareerPreferences>(preferences);
  const [newJobType, setNewJobType] = useState('');
  const [newIndustry, setNewIndustry] = useState('');

  useEffect(() => {
    setFormData(preferences);
  }, [preferences]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onSave(formData);
      onCancel();
    } catch (error) {
      console.error('Failed to save preferences:', error);
    }
  };

  const addJobType = () => {
    if (newJobType.trim()) {
      setFormData(prev => ({
        ...prev,
        job_types: [...(prev.job_types || []), newJobType.trim()]
      }));
      setNewJobType('');
    }
  };

  const removeJobType = (index: number) => {
    setFormData(prev => ({
      ...prev,
      job_types: prev.job_types?.filter((_, i) => i !== index) || []
    }));
  };

  const addIndustry = () => {
    if (newIndustry.trim()) {
      setFormData(prev => ({
        ...prev,
        industries: [...(prev.industries || []), newIndustry.trim()]
      }));
      setNewIndustry('');
    }
  };

  const removeIndustry = (index: number) => {
    setFormData(prev => ({
      ...prev,
      industries: prev.industries?.filter((_, i) => i !== index) || []
    }));
  };

  const handleSalaryChange = (field: 'min' | 'max' | 'currency', value: string | number) => {
    setFormData(prev => ({
      ...prev,
      salary_expectation: {
        ...prev.salary_expectation,
        [field]: value
      }
    }));
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Career Preferences</h2>
          <p className="text-gray-600">Your job preferences and requirements</p>
        </div>
        {!isEditing && (
          <button
            onClick={onEdit}
            className="px-4 py-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            Edit
          </button>
        )}
      </div>

      {isEditing ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Job Types */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preferred Job Types
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.job_types?.map((jobType, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800"
                >
                  {jobType}
                  <button
                    type="button"
                    onClick={() => removeJobType(index)}
                    className="ml-2 text-purple-600 hover:text-purple-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex space-x-2">
              <input
                type="text"
                value={newJobType}
                onChange={(e) => setNewJobType(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addJobType())}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Add a job type (e.g., Frontend Developer)"
              />
              <button
                type="button"
                onClick={addJobType}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Add
              </button>
            </div>
          </div>

          {/* Industries */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preferred Industries
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.industries?.map((industry, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-indigo-100 text-indigo-800"
                >
                  {industry}
                  <button
                    type="button"
                    onClick={() => removeIndustry(index)}
                    className="ml-2 text-indigo-600 hover:text-indigo-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex space-x-2">
              <input
                type="text"
                value={newIndustry}
                onChange={(e) => setNewIndustry(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addIndustry())}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Add an industry (e.g., Technology, Healthcare)"
              />
              <button
                type="button"
                onClick={addIndustry}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Add
              </button>
            </div>
          </div>

          {/* Work Arrangement */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Work Arrangement Preference
            </label>
            <select
              value={formData.work_arrangement || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, work_arrangement: e.target.value as any }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select preference</option>
              <option value="remote">Remote</option>
              <option value="onsite">On-site</option>
              <option value="hybrid">Hybrid</option>
              <option value="any">Any</option>
            </select>
          </div>

          {/* Salary Expectations */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Salary Expectations
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Minimum</label>
                <input
                  type="number"
                  min="0"
                  value={formData.salary_expectation?.min || ''}
                  onChange={(e) => handleSalaryChange('min', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="50000"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Maximum</label>
                <input
                  type="number"
                  min="0"
                  value={formData.salary_expectation?.max || ''}
                  onChange={(e) => handleSalaryChange('max', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="80000"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Currency</label>
                <select
                  value={formData.salary_expectation?.currency || 'USD'}
                  onChange={(e) => handleSalaryChange('currency', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="CAD">CAD</option>
                  <option value="AUD">AUD</option>
                </select>
              </div>
            </div>
          </div>

          {/* Availability */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Availability
            </label>
            <select
              value={formData.availability || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, availability: e.target.value as any }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select availability</option>
              <option value="immediate">Immediate</option>
              <option value="2weeks">2 Weeks</option>
              <option value="1month">1 Month</option>
              <option value="3months">3 Months</option>
            </select>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Save Changes
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-2">Preferred Job Types</label>
            <div className="flex flex-wrap gap-2">
              {preferences.job_types?.length ? (
                preferences.job_types.map((jobType, index) => (
                  <span key={index} className="px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800">
                    {jobType}
                  </span>
                ))
              ) : (
                <p className="text-gray-500">No job types specified</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-2">Preferred Industries</label>
            <div className="flex flex-wrap gap-2">
              {preferences.industries?.length ? (
                preferences.industries.map((industry, index) => (
                  <span key={index} className="px-3 py-1 rounded-full text-sm bg-indigo-100 text-indigo-800">
                    {industry}
                  </span>
                ))
              ) : (
                <p className="text-gray-500">No industries specified</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Work Arrangement</label>
            <p className="text-gray-900">{preferences.work_arrangement || 'Not specified'}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Salary Expectations</label>
            <p className="text-gray-900">
              {preferences.salary_expectation?.min && preferences.salary_expectation?.max
                ? `${preferences.salary_expectation.currency || 'USD'} ${preferences.salary_expectation.min.toLocaleString()} - ${preferences.salary_expectation.max.toLocaleString()}`
                : 'Not specified'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Availability</label>
            <p className="text-gray-900">{preferences.availability || 'Not specified'}</p>
          </div>
        </div>
      )}
    </div>
  );
};

// Portfolio Form Component
interface PortfolioFormProps {
  portfolio: PortfolioInfo;
  onSave: (data: PortfolioInfo) => Promise<any>;
  isLoading: boolean;
  isEditing: boolean;
  onEdit: () => void;
  onCancel: () => void;
}

export const PortfolioForm: React.FC<PortfolioFormProps> = ({
  portfolio,
  onSave,
  isLoading,
  isEditing,
  onEdit,
  onCancel,
}) => {
  const [formData, setFormData] = useState<PortfolioInfo>(portfolio);

  useEffect(() => {
    setFormData(portfolio);
  }, [portfolio]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onSave(formData);
      onCancel();
    } catch (error) {
      console.error('Failed to save portfolio:', error);
    }
  };

  const handleInputChange = (field: keyof PortfolioInfo, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateUrl = (url: string): boolean => {
    if (!url) return true; // Empty URLs are valid
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Portfolio & Links</h2>
          <p className="text-gray-600">Your portfolio and professional links</p>
        </div>
        {!isEditing && (
          <button
            onClick={onEdit}
            className="px-4 py-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            Edit
          </button>
        )}
      </div>

      {isEditing ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Resume URL
            </label>
            <input
              type="url"
              value={formData.resume_url || ''}
              onChange={(e) => handleInputChange('resume_url', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                formData.resume_url && !validateUrl(formData.resume_url)
                  ? 'border-red-300 focus:ring-red-500'
                  : 'border-gray-300'
              }`}
              placeholder="https://example.com/resume.pdf"
            />
            {formData.resume_url && !validateUrl(formData.resume_url) && (
              <p className="mt-1 text-sm text-red-600">Please enter a valid URL</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Portfolio Website
            </label>
            <input
              type="url"
              value={formData.portfolio_url || ''}
              onChange={(e) => handleInputChange('portfolio_url', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                formData.portfolio_url && !validateUrl(formData.portfolio_url)
                  ? 'border-red-300 focus:ring-red-500'
                  : 'border-gray-300'
              }`}
              placeholder="https://yourportfolio.com"
            />
            {formData.portfolio_url && !validateUrl(formData.portfolio_url) && (
              <p className="mt-1 text-sm text-red-600">Please enter a valid URL</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              GitHub Profile
            </label>
            <input
              type="url"
              value={formData.github_url || ''}
              onChange={(e) => handleInputChange('github_url', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                formData.github_url && !validateUrl(formData.github_url)
                  ? 'border-red-300 focus:ring-red-500'
                  : 'border-gray-300'
              }`}
              placeholder="https://github.com/yourusername"
            />
            {formData.github_url && !validateUrl(formData.github_url) && (
              <p className="mt-1 text-sm text-red-600">Please enter a valid URL</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              LinkedIn Profile
            </label>
            <input
              type="url"
              value={formData.linkedin_url || ''}
              onChange={(e) => handleInputChange('linkedin_url', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                formData.linkedin_url && !validateUrl(formData.linkedin_url)
                  ? 'border-red-300 focus:ring-red-500'
                  : 'border-gray-300'
              }`}
              placeholder="https://linkedin.com/in/yourusername"
            />
            {formData.linkedin_url && !validateUrl(formData.linkedin_url) && (
              <p className="mt-1 text-sm text-red-600">Please enter a valid URL</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Personal Website
            </label>
            <input
              type="url"
              value={formData.website_url || ''}
              onChange={(e) => handleInputChange('website_url', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                formData.website_url && !validateUrl(formData.website_url)
                  ? 'border-red-300 focus:ring-red-500'
                  : 'border-gray-300'
              }`}
              placeholder="https://yourwebsite.com"
            />
            {formData.website_url && !validateUrl(formData.website_url) && (
              <p className="mt-1 text-sm text-red-600">Please enter a valid URL</p>
            )}
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Save Changes
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Resume</label>
            {portfolio.resume_url ? (
              <a
                href={portfolio.resume_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 underline"
              >
                View Resume
              </a>
            ) : (
              <p className="text-gray-500">No resume uploaded</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Portfolio Website</label>
            {portfolio.portfolio_url ? (
              <a
                href={portfolio.portfolio_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 underline"
              >
                Visit Portfolio
              </a>
            ) : (
              <p className="text-gray-500">No portfolio website</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">GitHub Profile</label>
            {portfolio.github_url ? (
              <a
                href={portfolio.github_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 underline"
              >
                View GitHub
              </a>
            ) : (
              <p className="text-gray-500">No GitHub profile</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">LinkedIn Profile</label>
            {portfolio.linkedin_url ? (
              <a
                href={portfolio.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 underline"
              >
                View LinkedIn
              </a>
            ) : (
              <p className="text-gray-500">No LinkedIn profile</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Personal Website</label>
            {portfolio.website_url ? (
              <a
                href={portfolio.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 underline"
              >
                Visit Website
              </a>
            ) : (
              <p className="text-gray-500">No personal website</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Notification Preferences Form Component
interface NotificationPreferencesFormProps {
  preferences: NotificationPreferences;
  onSave: (data: NotificationPreferences) => Promise<any>;
  isLoading: boolean;
  isEditing: boolean;
  onEdit: () => void;
  onCancel: () => void;
}

export const NotificationPreferencesForm: React.FC<NotificationPreferencesFormProps> = ({
  preferences,
  onSave,
  isLoading,
  isEditing,
  onEdit,
  onCancel,
}) => {
  const [formData, setFormData] = useState<NotificationPreferences>(preferences);

  useEffect(() => {
    setFormData(preferences);
  }, [preferences]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onSave(formData);
      onCancel();
    } catch (error) {
      console.error('Failed to save notification preferences:', error);
    }
  };

  const handleToggle = (field: keyof NotificationPreferences) => {
    setFormData(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const ToggleSwitch: React.FC<{ 
    enabled: boolean; 
    onChange: () => void; 
    disabled?: boolean;
  }> = ({ enabled, onChange, disabled = false }) => (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
        enabled ? 'bg-blue-600' : 'bg-gray-200'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Notification Preferences</h2>
          <p className="text-gray-600">Manage how you receive notifications</p>
        </div>
        {!isEditing && (
          <button
            onClick={onEdit}
            className="px-4 py-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            Edit
          </button>
        )}
      </div>

      {isEditing ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Email Notifications</h3>
                <p className="text-sm text-gray-500">Receive notifications via email</p>
              </div>
              <ToggleSwitch
                enabled={formData.email_notifications ?? true}
                onChange={() => handleToggle('email_notifications')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Push Notifications</h3>
                <p className="text-sm text-gray-500">Receive browser push notifications</p>
              </div>
              <ToggleSwitch
                enabled={formData.push_notifications ?? true}
                onChange={() => handleToggle('push_notifications')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Deadline Reminders</h3>
                <p className="text-sm text-gray-500">Get reminded about task deadlines</p>
              </div>
              <ToggleSwitch
                enabled={formData.deadline_reminders ?? true}
                onChange={() => handleToggle('deadline_reminders')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Evaluation Results</h3>
                <p className="text-sm text-gray-500">Notifications when AI evaluation is complete</p>
              </div>
              <ToggleSwitch
                enabled={formData.evaluation_results ?? true}
                onChange={() => handleToggle('evaluation_results')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Recruiter Updates</h3>
                <p className="text-sm text-gray-500">Updates from recruiters about your applications</p>
              </div>
              <ToggleSwitch
                enabled={formData.recruiter_updates ?? true}
                onChange={() => handleToggle('recruiter_updates')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">New Recommendations</h3>
                <p className="text-sm text-gray-500">Notifications about new recommended tasks</p>
              </div>
              <ToggleSwitch
                enabled={formData.new_recommendations ?? true}
                onChange={() => handleToggle('new_recommendations')}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Save Changes
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Email Notifications</h3>
              <p className="text-sm text-gray-500">Receive notifications via email</p>
            </div>
            <span className={`text-sm font-medium ${preferences.email_notifications ? 'text-green-600' : 'text-gray-400'}`}>
              {preferences.email_notifications ? 'Enabled' : 'Disabled'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Push Notifications</h3>
              <p className="text-sm text-gray-500">Receive browser push notifications</p>
            </div>
            <span className={`text-sm font-medium ${preferences.push_notifications ? 'text-green-600' : 'text-gray-400'}`}>
              {preferences.push_notifications ? 'Enabled' : 'Disabled'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Deadline Reminders</h3>
              <p className="text-sm text-gray-500">Get reminded about task deadlines</p>
            </div>
            <span className={`text-sm font-medium ${preferences.deadline_reminders ? 'text-green-600' : 'text-gray-400'}`}>
              {preferences.deadline_reminders ? 'Enabled' : 'Disabled'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Evaluation Results</h3>
              <p className="text-sm text-gray-500">Notifications when AI evaluation is complete</p>
            </div>
            <span className={`text-sm font-medium ${preferences.evaluation_results ? 'text-green-600' : 'text-gray-400'}`}>
              {preferences.evaluation_results ? 'Enabled' : 'Disabled'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Recruiter Updates</h3>
              <p className="text-sm text-gray-500">Updates from recruiters about your applications</p>
            </div>
            <span className={`text-sm font-medium ${preferences.recruiter_updates ? 'text-green-600' : 'text-gray-400'}`}>
              {preferences.recruiter_updates ? 'Enabled' : 'Disabled'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">New Recommendations</h3>
              <p className="text-sm text-gray-500">Notifications about new recommended tasks</p>
            </div>
            <span className={`text-sm font-medium ${preferences.new_recommendations ? 'text-green-600' : 'text-gray-400'}`}>
              {preferences.new_recommendations ? 'Enabled' : 'Disabled'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

// Privacy Settings Form Component
interface PrivacySettingsFormProps {
  settings: PrivacySettings;
  onSave: (data: PrivacySettings) => Promise<any>;
  isLoading: boolean;
  isEditing: boolean;
  onEdit: () => void;
  onCancel: () => void;
}

export const PrivacySettingsForm: React.FC<PrivacySettingsFormProps> = ({
  settings,
  onSave,
  isLoading,
  isEditing,
  onEdit,
  onCancel,
}) => {
  const [formData, setFormData] = useState<PrivacySettings>(settings);

  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onSave(formData);
      onCancel();
    } catch (error) {
      console.error('Failed to save privacy settings:', error);
    }
  };

  const handleToggle = (field: keyof PrivacySettings) => {
    setFormData(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleVisibilityChange = (visibility: string) => {
    setFormData(prev => ({
      ...prev,
      profile_visibility: visibility as any
    }));
  };

  const ToggleSwitch: React.FC<{ 
    enabled: boolean; 
    onChange: () => void; 
    disabled?: boolean;
  }> = ({ enabled, onChange, disabled = false }) => (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
        enabled ? 'bg-blue-600' : 'bg-gray-200'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Privacy Settings</h2>
          <p className="text-gray-600">Control your profile visibility and privacy</p>
        </div>
        {!isEditing && (
          <button
            onClick={onEdit}
            className="px-4 py-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            Edit
          </button>
        )}
      </div>

      {isEditing ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Profile Visibility
            </label>
            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  type="radio"
                  id="visibility-public"
                  name="profile_visibility"
                  value="public"
                  checked={formData.profile_visibility === 'public'}
                  onChange={(e) => handleVisibilityChange(e.target.value)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <label htmlFor="visibility-public" className="ml-3">
                  <div className="text-sm font-medium text-gray-900">Public</div>
                  <div className="text-sm text-gray-500">Anyone can view your profile</div>
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="radio"
                  id="visibility-recruiters"
                  name="profile_visibility"
                  value="recruiters"
                  checked={formData.profile_visibility === 'recruiters'}
                  onChange={(e) => handleVisibilityChange(e.target.value)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <label htmlFor="visibility-recruiters" className="ml-3">
                  <div className="text-sm font-medium text-gray-900">Recruiters Only</div>
                  <div className="text-sm text-gray-500">Only verified recruiters can view your profile</div>
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="radio"
                  id="visibility-private"
                  name="profile_visibility"
                  value="private"
                  checked={formData.profile_visibility === 'private'}
                  onChange={(e) => handleVisibilityChange(e.target.value)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <label htmlFor="visibility-private" className="ml-3">
                  <div className="text-sm font-medium text-gray-900">Private</div>
                  <div className="text-sm text-gray-500">Only you can view your profile</div>
                </label>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Show Performance Statistics</h3>
                <p className="text-sm text-gray-500">Display your task completion rates and scores</p>
              </div>
              <ToggleSwitch
                enabled={formData.show_performance_stats ?? true}
                onChange={() => handleToggle('show_performance_stats')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Allow Recruiter Contact</h3>
                <p className="text-sm text-gray-500">Let recruiters contact you directly</p>
              </div>
              <ToggleSwitch
                enabled={formData.allow_recruiter_contact ?? true}
                onChange={() => handleToggle('allow_recruiter_contact')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Show Salary Expectations</h3>
                <p className="text-sm text-gray-500">Display your salary expectations to recruiters</p>
              </div>
              <ToggleSwitch
                enabled={formData.show_salary_expectations ?? true}
                onChange={() => handleToggle('show_salary_expectations')}
              />
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Privacy Notice</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    Your privacy is important to us. These settings control how your information is shared with recruiters and other users. 
                    You can change these settings at any time.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Save Changes
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-2">Profile Visibility</label>
            <div className="text-gray-900">
              {settings.profile_visibility === 'public' && (
                <div className="flex items-center">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Public
                  </span>
                  <span className="ml-2 text-sm text-gray-600">Anyone can view your profile</span>
                </div>
              )}
              {settings.profile_visibility === 'recruiters' && (
                <div className="flex items-center">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Recruiters Only
                  </span>
                  <span className="ml-2 text-sm text-gray-600">Only verified recruiters can view your profile</span>
                </div>
              )}
              {settings.profile_visibility === 'private' && (
                <div className="flex items-center">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    Private
                  </span>
                  <span className="ml-2 text-sm text-gray-600">Only you can view your profile</span>
                </div>
              )}
              {!settings.profile_visibility && (
                <p className="text-gray-500">Not specified</p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Show Performance Statistics</h3>
                <p className="text-sm text-gray-500">Display your task completion rates and scores</p>
              </div>
              <span className={`text-sm font-medium ${settings.show_performance_stats ? 'text-green-600' : 'text-gray-400'}`}>
                {settings.show_performance_stats ? 'Enabled' : 'Disabled'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Allow Recruiter Contact</h3>
                <p className="text-sm text-gray-500">Let recruiters contact you directly</p>
              </div>
              <span className={`text-sm font-medium ${settings.allow_recruiter_contact ? 'text-green-600' : 'text-gray-400'}`}>
                {settings.allow_recruiter_contact ? 'Enabled' : 'Disabled'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Show Salary Expectations</h3>
                <p className="text-sm text-gray-500">Display your salary expectations to recruiters</p>
              </div>
              <span className={`text-sm font-medium ${settings.show_salary_expectations ? 'text-green-600' : 'text-gray-400'}`}>
                {settings.show_salary_expectations ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Skills Assessment Component
interface SkillAssessmentProps {
  skills: string[];
  onAssessmentComplete: (assessments: Record<string, number>) => void;
}

export const SkillsAssessment: React.FC<SkillAssessmentProps> = ({
  skills,
  onAssessmentComplete,
}) => {
  const [assessments, setAssessments] = useState<Record<string, number>>({});
  const [currentSkillIndex, setCurrentSkillIndex] = useState(0);

  const handleSkillRating = (skill: string, rating: number) => {
    const newAssessments = { ...assessments, [skill]: rating };
    setAssessments(newAssessments);
    
    if (currentSkillIndex < skills.length - 1) {
      setCurrentSkillIndex(currentSkillIndex + 1);
    } else {
      onAssessmentComplete(newAssessments);
    }
  };

  if (skills.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Add some skills to your profile to start the assessment</p>
      </div>
    );
  }

  const currentSkill = skills[currentSkillIndex];
  const progress = ((currentSkillIndex + 1) / skills.length) * 100;

  return (
    <div className="max-w-md mx-auto">
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Progress</span>
          <span>{currentSkillIndex + 1} of {skills.length}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="text-center mb-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Rate your proficiency in
        </h3>
        <p className="text-2xl font-bold text-blue-600">{currentSkill}</p>
      </div>

      <div className="space-y-3">
        {[
          { level: 1, label: 'Beginner', description: 'Basic understanding' },
          { level: 2, label: 'Novice', description: 'Limited experience' },
          { level: 3, label: 'Intermediate', description: 'Some experience' },
          { level: 4, label: 'Advanced', description: 'Extensive experience' },
          { level: 5, label: 'Expert', description: 'Highly experienced' },
        ].map(({ level, label, description }) => (
          <button
            key={level}
            onClick={() => handleSkillRating(currentSkill, level)}
            className="w-full p-4 text-left border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">{label}</div>
                <div className="text-sm text-gray-500">{description}</div>
              </div>
              <div className="flex space-x-1">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-3 h-3 rounded-full ${
                      i < level ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};