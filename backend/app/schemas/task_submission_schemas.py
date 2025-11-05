from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, validator
from app.models.task_submission import SubmissionStatus, SubmissionType

# Define the Pydantic models for schemas
class SubmissionContent(BaseModel):
    type: SubmissionType
    content: Optional[str] = None  # for text/code submissions
    file_url: Optional[str] = None  # for file submissions
    file_name: Optional[str] = None
    file_size: Optional[int] = None  # in bytes

class CriteriaScores(BaseModel):
    critical_thinking: float = Field(..., ge=0, le=100)
    problem_solving: float = Field(..., ge=0, le=100)
    creativity: float = Field(..., ge=0, le=100)
    technical_skills: float = Field(..., ge=0, le=100)
    communication: float = Field(..., ge=0, le=100)
    attention_to_detail: float = Field(..., ge=0, le=100)

class AIEvaluationResult(BaseModel):
    overall_score: float = Field(..., ge=0, le=100)
    criteria_scores: CriteriaScores
    feedback: str
    evaluated_at: datetime = Field(default_factory=datetime.now)
    evaluation_model: str

class RecruiterReview(BaseModel):
    rating: int = Field(..., ge=1, le=5)  # 1-5 stars
    notes: str
    decision: str = Field(..., pattern="^(shortlist|reject|pending)$")
    reviewed_at: datetime = Field(default_factory=datetime.now)
    reviewed_by: str  # user ID as string

class TaskSubmissionCreate(BaseModel):
    job_id: str
    cover_letter: Optional[str] = None
    resume_url: Optional[str] = None

class TaskSubmissionUpdate(BaseModel):
    status: Optional[SubmissionStatus] = None
    time_spent: Optional[int] = None
    submission: Optional[SubmissionContent] = None
    cover_letter: Optional[str] = None
    resume_url: Optional[str] = None

class TaskSubmissionSubmit(BaseModel):
    submission: SubmissionContent
    time_spent: int = Field(..., ge=0, description="Time spent in minutes")

class RecruiterReviewCreate(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    notes: str
    decision: str = Field(..., pattern="^(shortlist|reject|pending)$")

class TaskSubmissionResponse(BaseModel):
    id: str = Field(..., alias="_id")
    job_id: str
    candidate_id: str
    status: SubmissionStatus
    started_at: datetime
    submitted_at: Optional[datetime]
    time_spent: int
    submission: Optional[SubmissionContent]
    ai_evaluation: Optional[AIEvaluationResult]
    recruiter_review: Optional[RecruiterReview]
    cover_letter: Optional[str]
    resume_url: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    model_config = {
        "populate_by_name": True,
        "json_schema_extra": {
            "example": {
                "_id": "60d5ec9af682fbd12a0a38d7",
                "job_id": "60d5ec9af682fbd12a0a38d8",
                "candidate_id": "60d5ec9af682fbd12a0a38d9",
                "status": "submitted",
                "started_at": "2023-06-21T15:30:00",
                "submitted_at": "2023-06-21T17:00:00",
                "time_spent": 90,
                "submission": {
                    "type": "text",
                    "content": "Here is my solution to the API design challenge..."
                },
                "ai_evaluation": {
                    "overall_score": 85.5,
                    "criteria_scores": {
                        "critical_thinking": 80,
                        "problem_solving": 90,
                        "creativity": 75,
                        "technical_skills": 95,
                        "communication": 85,
                        "attention_to_detail": 88
                    },
                    "feedback": "Strong technical solution with good API design principles...",
                    "evaluated_at": "2023-06-21T17:05:00",
                    "evaluation_model": "gpt-4-evaluation-v1"
                },
                "cover_letter": "I am excited to apply for this position...",
                "resume_url": "https://storage.example.com/resumes/candidate123.pdf",
                "created_at": "2023-06-21T15:30:00",
                "updated_at": "2023-06-21T17:05:00"
            }
        }
    }

class TaskSubmissionListResponse(BaseModel):
    submissions: List[TaskSubmissionResponse]
    total: int
    page: int
    per_page: int
    total_pages: int

class TaskSubmissionFilters(BaseModel):
    job_id: Optional[str] = None
    status: Optional[SubmissionStatus] = None
    min_score: Optional[float] = Field(None, ge=0, le=100)
    max_score: Optional[float] = Field(None, ge=0, le=100)
    submission_type: Optional[SubmissionType] = None
    has_ai_evaluation: Optional[bool] = None
    has_recruiter_review: Optional[bool] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None

class BulkStatusUpdate(BaseModel):
    submission_ids: List[str]
    status: SubmissionStatus
    notes: Optional[str] = None

class SubmissionStats(BaseModel):
    total_submissions: int
    by_status: dict
    by_job: dict
    average_score: Optional[float]
    average_time_spent: Optional[float]
    completion_rate: float