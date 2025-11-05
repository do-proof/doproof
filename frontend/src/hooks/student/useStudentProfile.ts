import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../utils/api';
import { useErrorHandler } from '../useErrorHandler';

// Types for student profile
export interface PersonalInfo {
  first_name?: string;
  last_name?: string;
  phone?: string;
  bio?: string;
  location?: {
    city?: string;
    country?: string;
  };
}

export interface SkillsInfo {
  technical_skills?: string[];
  soft_skills?: string[];
  certifications?: string[];
  languages?: Array<{
    language: string;
    proficiency: string;
  }>;
}

export interface ExperienceInfo {
  level?: 'entry' | 'junior' | 'mid' | 'senior';
  years_of_experience?: number;
  previous_roles?: string[];
  education?: Array<{
    degree: string;
    school: string;
    year?: number;
    field?: string;
  }>;
}

export interface CareerPreferences {
  job_types?: string[];
  industries?: string[];
  work_arrangement?: 'remote' | 'onsite' | 'hybrid' | 'any';
  salary_expectation?: {
    min?: number;
    max?: number;
    currency?: string;
  };
  availability?: 'immediate' | '2weeks' | '1month' | '3months';
}

export interface PortfolioInfo {
  resume_url?: string;
  portfolio_url?: string;
  github_url?: string;
  linkedin_url?: string;
  website_url?: string;
}

export interface NotificationPreferences {
  email_notifications?: boolean;
  push_notifications?: boolean;
  deadline_reminders?: boolean;
  evaluation_results?: boolean;
  recruiter_updates?: boolean;
  new_recommendations?: boolean;
}

export interface PrivacySettings {
  profile_visibility?: 'public' | 'recruiters' | 'private';
  show_performance_stats?: boolean;
  allow_recruiter_contact?: boolean;
  show_salary_expectations?: boolean;
}

export interface StudentProfile {
  _id: string;
  user_id: string;
  personal_info: PersonalInfo;
  skills: SkillsInfo;
  experience: ExperienceInfo;
  preferences: CareerPreferences;
  portfolio: PortfolioInfo;
  notification_preferences: NotificationPreferences;
  privacy_settings: PrivacySettings;
  profile_completeness: number;
  created_at: string;
  updated_at: string;
}

export interface StudentProfileUpdate {
  personal_info?: PersonalInfo;
  skills?: SkillsInfo;
  experience?: ExperienceInfo;
  preferences?: CareerPreferences;
  portfolio?: PortfolioInfo;
  notification_preferences?: NotificationPreferences;
  privacy_settings?: PrivacySettings;
}

export interface ProfileCompletenessAnalysis {
  overall_score: number;
  section_scores: Record<string, number>;
  missing_fields: string[];
  suggestions: string[];
}

// Query keys
export const profileKeys = {
  all: ['student-profile'] as const,
  profile: () => [...profileKeys.all, 'profile'] as const,
  completeness: () => [...profileKeys.all, 'completeness'] as const,
};

// Hook to get student profile
export const useStudentProfile = (options?: { enabled?: boolean }) => {
  const { handleError } = useErrorHandler();

  return useQuery({
    queryKey: profileKeys.profile(),
    queryFn: async (): Promise<StudentProfile> => {
      const response = await api.get<StudentProfile>('/api/students/profile');

      if (!response.success) {
        throw response.error;
      }

      return response.data!;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    enabled: options?.enabled !== false,
    retry: (failureCount, error: any) => {
      if (error?.status >= 400 && error?.status < 500 && error?.status !== 429) {
        return false;
      }
      return failureCount < 3;
    },
  });
};

// Hook to get profile completeness analysis
export const useProfileCompleteness = (options?: { enabled?: boolean }) => {
  const { handleError } = useErrorHandler();

  return useQuery({
    queryKey: profileKeys.completeness(),
    queryFn: async (): Promise<ProfileCompletenessAnalysis> => {
      const response = await api.get<ProfileCompletenessAnalysis>('/api/students/profile/completeness');

      if (!response.success) {
        throw response.error;
      }

      return response.data!;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    enabled: options?.enabled !== false,
    retry: (failureCount, error: any) => {
      if (error?.status >= 400 && error?.status < 500 && error?.status !== 429) {
        return false;
      }
      return failureCount < 3;
    },
  });
};

// Hook to update student profile
export const useUpdateStudentProfile = () => {
  const queryClient = useQueryClient();
  const { handleError } = useErrorHandler();

  return useMutation({
    mutationFn: async (profileUpdate: StudentProfileUpdate): Promise<StudentProfile> => {
      const response = await api.put<StudentProfile>('/api/students/profile', profileUpdate);

      if (!response.success) {
        throw response.error;
      }

      return response.data!;
    },
    onSuccess: (updatedProfile) => {
      // Update the profile cache
      queryClient.setQueryData(profileKeys.profile(), updatedProfile);
      
      // Invalidate completeness analysis to refresh
      queryClient.invalidateQueries({ queryKey: profileKeys.completeness() });
      
      // Invalidate analytics and recommendations as they depend on profile
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      queryClient.invalidateQueries({ queryKey: ['recommendations'] });
    },
  });
};

// Hook to update specific profile section
export const useUpdateProfileSection = () => {
  const updateProfile = useUpdateStudentProfile();

  return {
    updatePersonalInfo: (personalInfo: PersonalInfo) => 
      updateProfile.mutateAsync({ personal_info: personalInfo }),
    
    updateSkills: (skills: SkillsInfo) => 
      updateProfile.mutateAsync({ skills }),
    
    updateExperience: (experience: ExperienceInfo) => 
      updateProfile.mutateAsync({ experience }),
    
    updatePreferences: (preferences: CareerPreferences) => 
      updateProfile.mutateAsync({ preferences }),
    
    updatePortfolio: (portfolio: PortfolioInfo) => 
      updateProfile.mutateAsync({ portfolio }),
    
    updateNotificationPreferences: (notificationPreferences: NotificationPreferences) => 
      updateProfile.mutateAsync({ notification_preferences: notificationPreferences }),
    
    updatePrivacySettings: (privacySettings: PrivacySettings) => 
      updateProfile.mutateAsync({ privacy_settings: privacySettings }),
    
    isLoading: updateProfile.isPending,
    error: updateProfile.error,
  };
};

// Hook for invalidating profile queries
export const useInvalidateProfile = () => {
  const queryClient = useQueryClient();

  return {
    invalidateAll: () => queryClient.invalidateQueries({ queryKey: profileKeys.all }),
    invalidateProfile: () => queryClient.invalidateQueries({ queryKey: profileKeys.profile() }),
    invalidateCompleteness: () => queryClient.invalidateQueries({ queryKey: profileKeys.completeness() }),
  };
};

// Utility functions
export const getProfileCompletenessColor = (score: number): string => {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-yellow-600';
  if (score >= 40) return 'text-orange-600';
  return 'text-red-600';
};

export const getProfileCompletenessLabel = (score: number): string => {
  if (score >= 90) return 'Excellent';
  if (score >= 80) return 'Very Good';
  if (score >= 70) return 'Good';
  if (score >= 60) return 'Fair';
  if (score >= 40) return 'Needs Improvement';
  return 'Incomplete';
};

export const formatExperienceLevel = (level?: string): string => {
  const levels = {
    entry: 'Entry Level',
    junior: 'Junior Level',
    mid: 'Mid Level',
    senior: 'Senior Level',
  };
  return levels[level as keyof typeof levels] || 'Not Specified';
};

export const formatWorkArrangement = (arrangement?: string): string => {
  const arrangements = {
    remote: 'Remote',
    onsite: 'On-site',
    hybrid: 'Hybrid',
    any: 'Any',
  };
  return arrangements[arrangement as keyof typeof arrangements] || 'Not Specified';
};

export const formatAvailability = (availability?: string): string => {
  const availabilities = {
    immediate: 'Immediate',
    '2weeks': '2 Weeks',
    '1month': '1 Month',
    '3months': '3 Months',
  };
  return availabilities[availability as keyof typeof availabilities] || 'Not Specified';
};

export default useStudentProfile;