import { useState, useEffect, useCallback } from 'react';

export interface CompanyBranding {
  logo_url?: string;
  banner_url?: string;
  primary_color?: string;
  secondary_color?: string;
  font_family?: string;
}

export interface SocialLinks {
  linkedin?: string;
  twitter?: string;
  facebook?: string;
  instagram?: string;
  github?: string;
}

export interface CompanyLocation {
  address?: string;
  city: string;
  state?: string;
  country: string;
  postal_code?: string;
  is_headquarters: boolean;
}

export interface CompanyBenefits {
  health_insurance: boolean;
  dental_insurance: boolean;
  vision_insurance: boolean;
  retirement_plan: boolean;
  paid_time_off: boolean;
  flexible_hours: boolean;
  remote_work: boolean;
  professional_development: boolean;
  gym_membership: boolean;
  free_meals: boolean;
  stock_options: boolean;
  custom_benefits: string[];
}

export interface TeamMember {
  user_id: string;
  name: string;
  email: string;
  role: string;
  permissions: string[];
  joined_at: string;
  is_active: boolean;
}

export interface RecruitmentSettings {
  auto_reject_after_days?: number;
  require_cover_letter: boolean;
  require_portfolio: boolean;
  enable_ai_screening: boolean;
  notification_preferences: {
    new_applications: boolean;
    interview_reminders: boolean;
    task_submissions: boolean;
    ai_evaluations: boolean;
  };
  default_task_time_limit: number;
  default_evaluation_criteria: {
    critical_thinking: number;
    problem_solving: number;
    creativity: number;
    technical_skills: number;
    communication: number;
    attention_to_detail: number;
  };
}

export interface Company {
  _id: string;
  name: string;
  description?: string;
  tagline?: string;
  website?: string;
  industry: string;
  company_size: string;
  company_stage: string;
  founded_year?: number;
  email?: string;
  phone?: string;
  locations: CompanyLocation[];
  branding: CompanyBranding;
  social_links: SocialLinks;
  mission_statement?: string;
  values: string[];
  culture_description?: string;
  benefits: CompanyBenefits;
  team_members: TeamMember[];
  owner_id: string;
  recruitment_settings: RecruitmentSettings;
  total_jobs_posted: number;
  total_applications_received: number;
  total_hires: number;
  is_active: boolean;
  is_verified: boolean;
  verification_date?: string;
  created_at: string;
  updated_at: string;
}

export interface CompanyCreate {
  name: string;
  description?: string;
  tagline?: string;
  website?: string;
  industry: string;
  company_size: string;
  company_stage: string;
  founded_year?: number;
  email?: string;
  phone?: string;
  locations?: CompanyLocation[];
  branding?: CompanyBranding;
  social_links?: SocialLinks;
  mission_statement?: string;
  values?: string[];
  culture_description?: string;
  benefits?: CompanyBenefits;
  recruitment_settings?: RecruitmentSettings;
}

export interface CompanyUpdate {
  name?: string;
  description?: string;
  tagline?: string;
  website?: string;
  industry?: string;
  company_size?: string;
  company_stage?: string;
  founded_year?: number;
  email?: string;
  phone?: string;
  locations?: CompanyLocation[];
  branding?: CompanyBranding;
  social_links?: SocialLinks;
  mission_statement?: string;
  values?: string[];
  culture_description?: string;
  benefits?: CompanyBenefits;
  recruitment_settings?: RecruitmentSettings;
}

export interface TeamMemberInvite {
  email: string;
  role: string;
  permissions: string[];
  personal_message?: string;
}

export const useCompany = () => {
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const MAX_RETRY_ATTEMPTS = 3;
  const RETRY_DELAY = 1000;

  const fetchCompanyProfile = useCallback(async (attempt: number = 0) => {
    setLoading(true);
    if (attempt === 0) {
      setError(null);
      setRetryCount(0);
    }
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch('/api/company/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          setCompany(null);
          return;
        }
        if (response.status === 401) {
          throw new Error('Authentication failed. Please log in again.');
        }
        if (response.status >= 500 && attempt < MAX_RETRY_ATTEMPTS) {
          throw new Error('RETRY_NEEDED');
        }
        throw new Error('Failed to fetch company profile');
      }

      const data = await response.json();
      setCompany(data);
      setRetryCount(0);
    } catch (err) {
      if (err instanceof Error && err.message === 'RETRY_NEEDED' && attempt < MAX_RETRY_ATTEMPTS) {
        setRetryCount(attempt + 1);
        setTimeout(() => {
          fetchCompanyProfile(attempt + 1);
        }, RETRY_DELAY * Math.pow(2, attempt));
        return;
      }
      
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [MAX_RETRY_ATTEMPTS, RETRY_DELAY]);

  const createCompanyProfile = async (companyData: CompanyCreate): Promise<Company> => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/company/profile', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(companyData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create company profile');
      }

      const newCompany = await response.json();
      setCompany(newCompany);
      return newCompany;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const updateCompanyProfile = async (updates: CompanyUpdate): Promise<Company> => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/company/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update company profile');
      }

      const updatedCompany = await response.json();
      setCompany(updatedCompany);
      return updatedCompany;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const updateCompanyBranding = async (branding: CompanyBranding): Promise<Company> => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/company/branding', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(branding),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update company branding');
      }

      const updatedCompany = await response.json();
      setCompany(updatedCompany);
      return updatedCompany;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const inviteTeamMember = async (invite: TeamMemberInvite): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/company/team/invite', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invite),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to send invitation');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const updateTeamMember = async (userId: string, updates: { role?: string; permissions?: string[]; is_active?: boolean }): Promise<Company> => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/company/team/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update team member');
      }

      const updatedCompany = await response.json();
      setCompany(updatedCompany);
      return updatedCompany;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const removeTeamMember = async (userId: string): Promise<Company> => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/company/team/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to remove team member');
      }

      const updatedCompany = await response.json();
      setCompany(updatedCompany);
      return updatedCompany;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Utility functions
  const getCompanyStats = useCallback(() => {
    if (!company) return null;

    return {
      totalJobs: company.total_jobs_posted,
      totalApplications: company.total_applications_received,
      totalHires: company.total_hires,
      teamSize: company.team_members.length,
      activeTeamMembers: company.team_members.filter(member => member.is_active).length,
      profileCompleteness: calculateProfileCompleteness(company)
    };
  }, [company]);

  const calculateProfileCompleteness = useCallback((companyData: Company) => {
    const fields = [
      companyData.name,
      companyData.description,
      companyData.website,
      companyData.industry,
      companyData.company_size,
      companyData.locations.length > 0,
      companyData.branding.logo_url,
      companyData.mission_statement,
      companyData.values.length > 0
    ];

    const completedFields = fields.filter(field => field).length;
    return Math.round((completedFields / fields.length) * 100);
  }, []);

  const refreshCompanyProfile = useCallback(() => {
    fetchCompanyProfile();
  }, [fetchCompanyProfile]);

  const retryLastOperation = useCallback(() => {
    refreshCompanyProfile();
  }, [refreshCompanyProfile]);

  useEffect(() => {
    fetchCompanyProfile();
  }, [fetchCompanyProfile]);

  return {
    company,
    loading,
    error,
    retryCount,
    fetchCompanyProfile,
    createCompanyProfile,
    updateCompanyProfile,
    updateCompanyBranding,
    inviteTeamMember,
    updateTeamMember,
    removeTeamMember,
    // Utility functions
    getCompanyStats,
    calculateProfileCompleteness,
    refreshCompanyProfile,
    retryLastOperation,
    clearError: () => setError(null)
  };
};