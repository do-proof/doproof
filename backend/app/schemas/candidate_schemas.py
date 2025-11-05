from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, EmailStr
from app.models.user import UserRole

class CandidateProfile(BaseModel):
    id: str = Field(..., alias="_id")
    name: str
    email: EmailStr
    role: UserRole
    company: Optional[str]
    
    # Extended profile information
    title: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    phone: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    resume_url: Optional[str] = None
    
    # Skills and experience
    skills: List[str] = []
    experience_years: Optional[int] = None
    education: List[Dict] = []
    work_experience: List[Dict] = []
    
    # Availability and preferences
    availability: Optional[str] = None  # "immediate", "2_weeks", "1_month", etc.
    salary_expectation: Optional[Dict] = None
    preferred_locations: List[str] = []
    remote_preference: Optional[str] = None  # "remote", "onsite", "hybrid", "flexible"
    
    # DoProof specific data
    total_submissions: int = 0
    completed_tasks: int = 0
    average_score: Optional[float] = None
    best_score: Optional[float] = None
    task_completion_rate: Optional[float] = None
    
    # Profile completeness and activity
    profile_completeness: float = 0.0
    last_active: Optional[datetime] = None
    joined_date: datetime
    
    model_config = {
        "populate_by_name": True,
        "json_schema_extra": {
            "example": {
                "_id": "60d5ec9af682fbd12a0a38d7",
                "name": "Jane Doe",
                "email": "jane.doe@example.com",
                "role": "student",
                "title": "Full Stack Developer",
                "bio": "Passionate developer with 3 years of experience in web technologies",
                "location": "San Francisco, CA",
                "phone": "+1-555-0123",
                "linkedin_url": "https://linkedin.com/in/janedoe",
                "github_url": "https://github.com/janedoe",
                "portfolio_url": "https://janedoe.dev",
                "skills": ["JavaScript", "React", "Node.js", "Python", "SQL"],
                "experience_years": 3,
                "education": [
                    {
                        "degree": "Bachelor of Science in Computer Science",
                        "institution": "University of California, Berkeley",
                        "year": 2021
                    }
                ],
                "work_experience": [
                    {
                        "title": "Software Engineer",
                        "company": "Tech Startup Inc.",
                        "duration": "2021-2024",
                        "description": "Developed web applications using React and Node.js"
                    }
                ],
                "availability": "2_weeks",
                "salary_expectation": {
                    "min": 80000,
                    "max": 100000,
                    "currency": "USD"
                },
                "preferred_locations": ["San Francisco", "Remote"],
                "remote_preference": "hybrid",
                "total_submissions": 15,
                "completed_tasks": 12,
                "average_score": 82.5,
                "best_score": 95.0,
                "task_completion_rate": 80.0,
                "profile_completeness": 85.0,
                "last_active": "2023-06-21T15:30:00",
                "joined_date": "2023-01-15T10:00:00"
            }
        }
    }

class CandidateSearchFilters(BaseModel):
    skills: Optional[List[str]] = None
    experience_min: Optional[int] = Field(None, ge=0)
    experience_max: Optional[int] = Field(None, ge=0)
    location: Optional[str] = None
    remote_preference: Optional[str] = None
    availability: Optional[str] = None
    min_salary: Optional[int] = None
    max_salary: Optional[int] = None
    min_score: Optional[float] = Field(None, ge=0, le=100)
    max_score: Optional[float] = Field(None, ge=0, le=100)
    min_completeness: Optional[float] = Field(None, ge=0, le=100)
    has_portfolio: Optional[bool] = None
    has_github: Optional[bool] = None
    active_since: Optional[datetime] = None
    search_query: Optional[str] = None  # Search in name, bio, skills

class CandidateListResponse(BaseModel):
    candidates: List[CandidateProfile]
    total: int
    page: int
    per_page: int
    total_pages: int

class CandidateStats(BaseModel):
    total_candidates: int
    by_experience_level: Dict[str, int]
    by_location: Dict[str, int]
    by_skills: Dict[str, int]
    by_availability: Dict[str, int]
    average_score: Optional[float]
    active_candidates: int
    new_candidates_this_month: int

class CandidateMessage(BaseModel):
    recipient_id: str
    subject: str
    message: str
    job_id: Optional[str] = None  # If inviting for a specific job
    include_job_details: bool = False

class CandidateInvitation(BaseModel):
    candidate_ids: List[str]
    job_id: str
    personal_message: Optional[str] = None
    send_immediately: bool = True

class CandidateShortlist(BaseModel):
    name: str
    description: Optional[str] = None
    candidate_ids: List[str]
    job_id: Optional[str] = None  # If shortlist is for a specific job

class CandidateShortlistResponse(BaseModel):
    id: str = Field(..., alias="_id")
    name: str
    description: Optional[str]
    candidate_ids: List[str]
    job_id: Optional[str]
    recruiter_id: str
    created_at: datetime
    updated_at: datetime
    
    model_config = {
        "populate_by_name": True
    }

class CandidateComparison(BaseModel):
    candidate_ids: List[str] = Field(..., min_items=2, max_items=5)
    comparison_criteria: List[str] = ["skills", "experience", "scores", "availability"]

class ComparisonResult(BaseModel):
    candidates: List[CandidateProfile]
    comparison_matrix: Dict[str, Dict[str, Any]]
    recommendations: List[str]
    best_matches: List[Dict[str, Any]]