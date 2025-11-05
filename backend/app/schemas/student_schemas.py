from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

# Enrollment request schema
class EnrollmentRequest(BaseModel):
    cover_letter: Optional[str] = Field(None, max_length=2000, description="Optional cover letter")
    expected_completion_time: Optional[int] = Field(None, ge=1, description="Expected completion time in minutes")

# Job details for student responses
class StudentJobDetails(BaseModel):
    title: str
    description: str
    task: Dict[str, Any]  # Task definition
    closing_date: Optional[str] = None

# Application progress tracking
class ApplicationProgress(BaseModel):
    time_spent: int = Field(..., ge=0, description="Time spent in minutes")
    last_activity: str = Field(..., description="ISO timestamp of last activity")
    completion_percentage: int = Field(..., ge=0, le=100, description="Completion percentage")

# AI evaluation details
class StudentEvaluation(BaseModel):
    ai_score: float = Field(..., ge=0, le=100)
    criteria_scores: Dict[str, float]
    feedback: str
    evaluated_at: str

# Recruiter review details
class StudentRecruiterReview(BaseModel):
    decision: str = Field(..., pattern="^(shortlist|reject|pending)$")
    rating: int = Field(..., ge=1, le=5)
    notes: str
    reviewed_at: str

# Student application response
class StudentApplicationResponse(BaseModel):
    id: str = Field(..., alias="_id")
    job_id: str
    student_id: str
    status: str
    enrolled_at: str
    submission_id: Optional[str] = None
    progress: ApplicationProgress
    job: Optional[StudentJobDetails] = None
    evaluation: Optional[StudentEvaluation] = None
    recruiter_review: Optional[StudentRecruiterReview] = None
    created_at: str
    updated_at: str
    
    model_config = {
        "populate_by_name": True,
        "json_schema_extra": {
            "example": {
                "_id": "60d5ec9af682fbd12a0a38d7",
                "job_id": "60d5ec9af682fbd12a0a38d8",
                "student_id": "60d5ec9af682fbd12a0a38d9",
                "status": "in_progress",
                "enrolled_at": "2023-06-21T15:30:00Z",
                "submission_id": "60d5ec9af682fbd12a0a38d7",
                "progress": {
                    "time_spent": 45,
                    "last_activity": "2023-06-21T16:15:00Z",
                    "completion_percentage": 60
                },
                "job": {
                    "title": "Frontend Developer",
                    "description": "Build React applications",
                    "task": {
                        "title": "Build a landing page",
                        "time_limit": 120,
                        "submission_format": "code"
                    },
                    "closing_date": "2023-12-31T23:59:59Z"
                },
                "created_at": "2023-06-21T15:30:00Z",
                "updated_at": "2023-06-21T16:15:00Z"
            }
        }
    }

# Application summary statistics
class RecentActivity(BaseModel):
    applications: int = Field(..., ge=0, description="Recent applications count")
    submissions: int = Field(..., ge=0, description="Recent submissions count")
    evaluations: int = Field(..., ge=0, description="Recent evaluations count")

class StudentApplicationSummary(BaseModel):
    total: int = Field(..., ge=0, description="Total applications")
    by_status: Dict[str, int] = Field(..., description="Applications count by status")
    completion_rate: float = Field(..., ge=0, le=100, description="Completion rate percentage")
    average_score: float = Field(..., ge=0, le=100, description="Average AI evaluation score")
    recent_activity: RecentActivity
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "total": 15,
                "by_status": {
                    "in_progress": 3,
                    "submitted": 2,
                    "completed": 8,
                    "rejected": 2
                },
                "completion_rate": 86.7,
                "average_score": 78.5,
                "recent_activity": {
                    "applications": 2,
                    "submissions": 1,
                    "evaluations": 3
                }
            }
        }
    }

# Applications list response
class StudentApplicationsResponse(BaseModel):
    applications: List[StudentApplicationResponse]
    summary: StudentApplicationSummary
    total: int
    page: int
    per_page: int
    total_pages: int

# Progress update request
class ApplicationProgressUpdate(BaseModel):
    time_spent: int = Field(..., ge=0, description="Total time spent in minutes")
    completion_percentage: Optional[int] = Field(None, ge=0, le=100, description="Completion percentage")

# Submission response for students
class StudentSubmissionResponse(BaseModel):
    id: str = Field(..., alias="_id")
    job_id: str
    status: str
    submitted_at: Optional[str] = None
    time_spent: int
    submission: Optional[Dict[str, Any]] = None
    ai_evaluation: Optional[StudentEvaluation] = None
    recruiter_review: Optional[StudentRecruiterReview] = None
    created_at: str
    updated_at: str
    
    model_config = {
        "populate_by_name": True,
        "json_schema_extra": {
            "example": {
                "_id": "60d5ec9af682fbd12a0a38d7",
                "job_id": "60d5ec9af682fbd12a0a38d8",
                "status": "submitted",
                "submitted_at": "2023-06-21T17:30:00Z",
                "time_spent": 105,
                "submission": {
                    "type": "code",
                    "content": "// React component code here",
                    "file_url": "https://example.com/submission.zip"
                },
                "ai_evaluation": {
                    "ai_score": 85.5,
                    "criteria_scores": {
                        "technical_skills": 90,
                        "problem_solving": 85,
                        "creativity": 80
                    },
                    "feedback": "Excellent implementation with clean code structure.",
                    "evaluated_at": "2023-06-21T18:00:00Z"
                },
                "created_at": "2023-06-21T15:30:00Z",
                "updated_at": "2023-06-21T17:30:00Z"
            }
        }
    }

# Application statistics for analytics
class ApplicationStats(BaseModel):
    total_applications: int
    completion_rate: float
    average_score: float
    score_distribution: Dict[str, int]  # Score ranges
    time_spent_distribution: Dict[str, int]  # Time ranges
    status_trends: Dict[str, List[int]]  # Status counts over time
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "total_applications": 25,
                "completion_rate": 84.0,
                "average_score": 76.8,
                "score_distribution": {
                    "0-50": 2,
                    "51-70": 5,
                    "71-85": 12,
                    "86-100": 6
                },
                "time_spent_distribution": {
                    "0-60": 8,
                    "61-120": 12,
                    "121-180": 4,
                    "180+": 1
                },
                "status_trends": {
                    "completed": [2, 3, 5, 8, 12],
                    "in_progress": [1, 2, 1, 3, 2]
                }
            }
        }
    }

# Notification preferences
class NotificationPreferences(BaseModel):
    email_notifications: bool = True
    push_notifications: bool = True
    deadline_reminders: bool = True
    evaluation_results: bool = True
    recruiter_updates: bool = True
    new_recommendations: bool = True

# Personal information
class PersonalInfo(BaseModel):
    first_name: Optional[str] = Field(None, max_length=50)
    last_name: Optional[str] = Field(None, max_length=50)
    phone: Optional[str] = Field(None, max_length=20)
    bio: Optional[str] = Field(None, max_length=1000)
    location: Optional[Dict[str, str]] = None  # city, country

# Skills and experience
class SkillsInfo(BaseModel):
    technical_skills: Optional[List[str]] = None
    soft_skills: Optional[List[str]] = None
    certifications: Optional[List[str]] = None
    languages: Optional[List[Dict[str, str]]] = None  # language, proficiency

class ExperienceInfo(BaseModel):
    level: Optional[str] = Field(None, pattern="^(entry|junior|mid|senior)$")
    years_of_experience: Optional[int] = Field(None, ge=0, le=50)
    previous_roles: Optional[List[str]] = None
    education: Optional[List[Dict[str, Any]]] = None

# Career preferences
class CareerPreferences(BaseModel):
    job_types: Optional[List[str]] = None
    industries: Optional[List[str]] = None
    work_arrangement: Optional[str] = Field(None, pattern="^(remote|onsite|hybrid|any)$")
    salary_expectation: Optional[Dict[str, Any]] = None  # min, max, currency
    availability: Optional[str] = Field(None, pattern="^(immediate|2weeks|1month|3months)$")

# Portfolio and links
class PortfolioInfo(BaseModel):
    resume_url: Optional[str] = Field(None, max_length=500)
    portfolio_url: Optional[str] = Field(None, max_length=500)
    github_url: Optional[str] = Field(None, max_length=500)
    linkedin_url: Optional[str] = Field(None, max_length=500)
    website_url: Optional[str] = Field(None, max_length=500)

# Privacy settings
class PrivacySettings(BaseModel):
    profile_visibility: Optional[str] = Field(None, pattern="^(public|recruiters|private)$")
    show_performance_stats: Optional[bool] = None
    allow_recruiter_contact: Optional[bool] = None
    show_salary_expectations: Optional[bool] = None

# Complete student profile
class StudentProfile(BaseModel):
    id: str = Field(..., alias="_id")
    user_id: str
    personal_info: PersonalInfo
    skills: SkillsInfo
    experience: ExperienceInfo
    preferences: CareerPreferences
    portfolio: PortfolioInfo
    notification_preferences: NotificationPreferences
    privacy_settings: PrivacySettings
    profile_completeness: float = Field(..., ge=0, le=100)
    created_at: str
    updated_at: str
    
    model_config = {
        "populate_by_name": True,
        "json_schema_extra": {
            "example": {
                "_id": "60d5ec9af682fbd12a0a38d7",
                "user_id": "60d5ec9af682fbd12a0a38d8",
                "personal_info": {
                    "first_name": "John",
                    "last_name": "Doe",
                    "phone": "+1-555-0123",
                    "bio": "Passionate full-stack developer with 3 years of experience",
                    "location": {"city": "San Francisco", "country": "USA"}
                },
                "skills": {
                    "technical_skills": ["React", "Node.js", "Python", "PostgreSQL"],
                    "soft_skills": ["Communication", "Problem Solving", "Teamwork"],
                    "certifications": ["AWS Certified Developer"],
                    "languages": [{"language": "English", "proficiency": "Native"}]
                },
                "experience": {
                    "level": "junior",
                    "years_of_experience": 3,
                    "previous_roles": ["Frontend Developer", "Intern"],
                    "education": [{"degree": "BS Computer Science", "school": "University"}]
                },
                "preferences": {
                    "job_types": ["frontend", "full-stack"],
                    "industries": ["tech", "fintech"],
                    "work_arrangement": "hybrid",
                    "salary_expectation": {"min": 70000, "max": 90000, "currency": "USD"}
                },
                "portfolio": {
                    "github_url": "https://github.com/johndoe",
                    "linkedin_url": "https://linkedin.com/in/johndoe",
                    "portfolio_url": "https://johndoe.dev"
                },
                "notification_preferences": {
                    "email_notifications": True,
                    "deadline_reminders": True,
                    "evaluation_results": True
                },
                "privacy_settings": {
                    "profile_visibility": "recruiters",
                    "show_performance_stats": True,
                    "allow_recruiter_contact": True
                },
                "profile_completeness": 85.5,
                "created_at": "2023-06-21T15:30:00Z",
                "updated_at": "2023-06-21T16:15:00Z"
            }
        }
    }

# Student profile update request
class StudentProfileUpdate(BaseModel):
    personal_info: Optional[PersonalInfo] = None
    skills: Optional[SkillsInfo] = None
    experience: Optional[ExperienceInfo] = None
    preferences: Optional[CareerPreferences] = None
    portfolio: Optional[PortfolioInfo] = None
    notification_preferences: Optional[NotificationPreferences] = None
    privacy_settings: Optional[PrivacySettings] = None
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "personal_info": {
                    "first_name": "John",
                    "last_name": "Doe",
                    "bio": "Updated bio"
                },
                "skills": {
                    "technical_skills": ["React", "TypeScript", "Node.js", "Python"],
                    "soft_skills": ["Leadership", "Communication"]
                },
                "preferences": {
                    "job_types": ["frontend", "full-stack"],
                    "work_arrangement": "remote"
                }
            }
        }
    }

# Profile completeness analysis
class ProfileCompletenessAnalysis(BaseModel):
    overall_score: float = Field(..., ge=0, le=100)
    section_scores: Dict[str, float]
    missing_fields: List[str]
    suggestions: List[str]
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "overall_score": 75.0,
                "section_scores": {
                    "personal_info": 90.0,
                    "skills": 80.0,
                    "experience": 70.0,
                    "preferences": 60.0,
                    "portfolio": 50.0
                },
                "missing_fields": ["phone", "certifications", "portfolio_url"],
                "suggestions": [
                    "Add your phone number for better recruiter contact",
                    "Include relevant certifications to boost your profile",
                    "Upload a portfolio to showcase your work"
                ]
            }
        }
    }