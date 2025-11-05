from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, validator
from app.models.job import JobStatus, LocationType, EmploymentType, SubmissionFormat

# Define the missing Pydantic models
class SalaryRange(BaseModel):
    min: int
    max: int
    currency: str = "USD"

class Location(BaseModel):
    type: LocationType
    city: str
    country: str

class TaskDefinition(BaseModel):
    title: str
    description: str
    instructions: str
    time_limit: int  # in minutes
    submission_format: SubmissionFormat
    max_file_size: Optional[int] = None  # in MB
    allowed_file_types: Optional[List[str]] = None

class EvaluationCriteria(BaseModel):
    critical_thinking: int = Field(..., ge=0, le=100)
    problem_solving: int = Field(..., ge=0, le=100)
    creativity: int = Field(..., ge=0, le=100)
    technical_skills: int = Field(..., ge=0, le=100)
    communication: int = Field(..., ge=0, le=100)
    attention_to_detail: int = Field(..., ge=0, le=100)

class JobCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: str = Field(..., min_length=1)
    requirements: List[str] = Field(..., min_items=1)
    responsibilities: List[str] = Field(..., min_items=1)
    salary: SalaryRange
    location: Location
    employment_type: EmploymentType
    closing_date: Optional[datetime] = None
    task: TaskDefinition
    evaluation_criteria: EvaluationCriteria
    
    @validator('evaluation_criteria')
    def validate_criteria_weights(cls, v):
        total_weight = (
            v.critical_thinking + v.problem_solving + v.creativity +
            v.technical_skills + v.communication + v.attention_to_detail
        )
        if total_weight != 100:
            raise ValueError('Evaluation criteria weights must sum to 100')
        return v
    
    @validator('closing_date')
    def validate_closing_date(cls, v):
        if v and v <= datetime.now():
            raise ValueError('Closing date must be in the future')
        return v

class JobUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, min_length=1)
    requirements: Optional[List[str]] = None
    responsibilities: Optional[List[str]] = None
    salary: Optional[SalaryRange] = None
    location: Optional[Location] = None
    employment_type: Optional[EmploymentType] = None
    status: Optional[JobStatus] = None
    closing_date: Optional[datetime] = None
    task: Optional[TaskDefinition] = None
    evaluation_criteria: Optional[EvaluationCriteria] = None
    
    @validator('evaluation_criteria')
    def validate_criteria_weights(cls, v):
        if v is not None:
            total_weight = (
                v.critical_thinking + v.problem_solving + v.creativity +
                v.technical_skills + v.communication + v.attention_to_detail
            )
            if total_weight != 100:
                raise ValueError('Evaluation criteria weights must sum to 100')
        return v
    
    @validator('closing_date')
    def validate_closing_date(cls, v):
        if v and v <= datetime.now():
            raise ValueError('Closing date must be in the future')
        return v

class JobResponse(BaseModel):
    id: str = Field(..., alias="_id")
    title: str
    description: str
    requirements: List[str]
    responsibilities: List[str]
    salary: SalaryRange
    location: Location
    employment_type: EmploymentType
    status: JobStatus
    posted_date: datetime
    closing_date: Optional[datetime]
    task: TaskDefinition
    evaluation_criteria: EvaluationCriteria
    application_count: int
    submission_count: int
    view_count: int
    company_id: str
    recruiter_id: str
    created_at: datetime
    updated_at: datetime
    
    model_config = {
        "populate_by_name": True,
        "json_schema_extra": {
            "example": {
                "_id": "60d5ec9af682fbd12a0a38d7",
                "title": "Senior Software Engineer",
                "description": "We are looking for a senior software engineer...",
                "requirements": ["5+ years experience", "Python expertise"],
                "responsibilities": ["Lead development", "Mentor junior developers"],
                "salary": {
                    "min": 80000,
                    "max": 120000,
                    "currency": "USD"
                },
                "location": {
                    "type": "hybrid",
                    "city": "San Francisco",
                    "country": "USA"
                },
                "employment_type": "full-time",
                "status": "active",
                "posted_date": "2023-06-21T15:30:00",
                "closing_date": "2023-12-31T23:59:59",
                "task": {
                    "title": "API Design Challenge",
                    "description": "Design a RESTful API for a social media platform",
                    "instructions": "Create API endpoints with proper documentation",
                    "time_limit": 120,
                    "submission_format": "text",
                    "max_file_size": 10,
                    "allowed_file_types": ["pdf", "txt", "md"]
                },
                "evaluation_criteria": {
                    "critical_thinking": 25,
                    "problem_solving": 30,
                    "creativity": 15,
                    "technical_skills": 20,
                    "communication": 5,
                    "attention_to_detail": 5
                },
                "application_count": 15,
                "submission_count": 12,
                "view_count": 150,
                "company_id": "60d5ec9af682fbd12a0a38d8",
                "recruiter_id": "60d5ec9af682fbd12a0a38d9",
                "created_at": "2023-06-21T15:30:00",
                "updated_at": "2023-06-21T15:30:00"
            }
        }
    }

class JobListResponse(BaseModel):
    jobs: List[JobResponse]
    total: int
    page: int
    per_page: int
    total_pages: int

class JobFilters(BaseModel):
    status: Optional[JobStatus] = None
    employment_type: Optional[EmploymentType] = None
    location_type: Optional[LocationType] = None
    city: Optional[str] = None
    country: Optional[str] = None
    min_salary: Optional[int] = None
    max_salary: Optional[int] = None
    search: Optional[str] = None  # Search in title and description

# Student-specific schemas
class JobRecommendation(BaseModel):
    match_score: int = Field(..., ge=0, le=100)
    match_reasons: List[str]
    skill_gaps: Optional[List[str]] = None
    similar_successful_profiles: int = 0

class JobWithRecommendation(JobResponse):
    match_score: Optional[int] = None
    match_reasons: Optional[List[str]] = None
    is_recommended: Optional[bool] = False
    skill_gaps: Optional[List[str]] = None

class StudentJobBrowseResponse(BaseModel):
    jobs: List[JobWithRecommendation]
    total: int
    page: int
    per_page: int
    total_pages: int
    recommendations: Optional[List[JobWithRecommendation]] = None

class StudentJobFilters(BaseModel):
    search: Optional[str] = None
    difficulty: Optional[List[str]] = None  # Easy, Medium, Hard
    category: Optional[List[str]] = None  # Frontend, Backend, Mobile, etc.
    employment_type: Optional[List[EmploymentType]] = None
    location_type: Optional[LocationType] = None
    city: Optional[str] = None
    country: Optional[str] = None
    min_salary: Optional[int] = None
    max_salary: Optional[int] = None
    min_reward: Optional[int] = None  # Minimum reward points
    max_reward: Optional[int] = None  # Maximum reward points
    deadline_within: Optional[int] = None  # Days from now
    exclude_applied: Optional[bool] = False