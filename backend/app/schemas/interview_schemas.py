from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, validator
from app.models.interview import (
    InterviewType, InterviewStatus, InterviewRound, 
    InterviewerFeedback, InterviewFeedback
)

class InterviewCreate(BaseModel):
    submission_id: str
    title: str
    description: Optional[str] = None
    interview_type: InterviewType
    interview_round: InterviewRound = InterviewRound.SCREENING
    scheduled_date: datetime
    duration: int = Field(..., gt=0, description="Duration in minutes")
    timezone: str = "UTC"
    location: Optional[str] = None
    meeting_link: Optional[str] = None
    meeting_id: Optional[str] = None
    phone_number: Optional[str] = None
    interviewers: List[str] = []
    interviewer_names: List[str] = []
    notes: Optional[str] = None
    
    @validator('scheduled_date')
    def validate_scheduled_date(cls, v):
        if v <= datetime.now():
            raise ValueError('Scheduled date must be in the future')
        return v
    
    @validator('interviewer_names')
    def validate_interviewer_names(cls, v, values):
        if 'interviewers' in values and len(v) != len(values['interviewers']):
            raise ValueError('Number of interviewer names must match number of interviewer IDs')
        return v

class InterviewUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    interview_type: Optional[InterviewType] = None
    interview_round: Optional[InterviewRound] = None
    scheduled_date: Optional[datetime] = None
    duration: Optional[int] = Field(None, gt=0)
    timezone: Optional[str] = None
    location: Optional[str] = None
    meeting_link: Optional[str] = None
    meeting_id: Optional[str] = None
    phone_number: Optional[str] = None
    interviewers: Optional[List[str]] = None
    interviewer_names: Optional[List[str]] = None
    status: Optional[InterviewStatus] = None
    notes: Optional[str] = None
    
    @validator('scheduled_date')
    def validate_scheduled_date(cls, v):
        if v and v <= datetime.now():
            raise ValueError('Scheduled date must be in the future')
        return v

class InterviewReschedule(BaseModel):
    new_scheduled_date: datetime
    reason: str
    notify_participants: bool = True
    
    @validator('new_scheduled_date')
    def validate_new_scheduled_date(cls, v):
        if v <= datetime.now():
            raise ValueError('New scheduled date must be in the future')
        return v

class InterviewerFeedbackCreate(BaseModel):
    technical_score: Optional[int] = Field(None, ge=1, le=5)
    communication_score: Optional[int] = Field(None, ge=1, le=5)
    culture_fit_score: Optional[int] = Field(None, ge=1, le=5)
    overall_rating: Optional[int] = Field(None, ge=1, le=5)
    notes: Optional[str] = None
    recommendation: Optional[str] = Field(None, pattern="^(hire|no_hire|maybe|pending)$")

class InterviewFeedbackCreate(BaseModel):
    overall_rating: int = Field(..., ge=1, le=5)
    technical_assessment: Optional[str] = None
    behavioral_assessment: Optional[str] = None
    strengths: List[str] = []
    areas_for_improvement: List[str] = []
    final_recommendation: str = Field(..., pattern="^(hire|no_hire|maybe|pending)$")
    next_steps: Optional[str] = None

class InterviewResponse(BaseModel):
    id: str = Field(..., alias="_id")
    submission_id: str
    job_id: str
    candidate_id: str
    recruiter_id: str
    title: str
    description: Optional[str]
    interview_type: InterviewType
    interview_round: InterviewRound
    scheduled_date: datetime
    duration: int
    timezone: str
    location: Optional[str]
    meeting_link: Optional[str]
    meeting_id: Optional[str]
    phone_number: Optional[str]
    interviewers: List[str]
    interviewer_names: List[str]
    status: InterviewStatus
    feedback: Optional[InterviewFeedback]
    notes: Optional[str]
    original_date: Optional[datetime]
    reschedule_reason: Optional[str]
    reschedule_count: int
    reminder_sent: bool
    confirmation_sent: bool
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime]
    
    model_config = {
        "populate_by_name": True,
        "json_schema_extra": {
            "example": {
                "_id": "60d5ec9af682fbd12a0a38d7",
                "submission_id": "60d5ec9af682fbd12a0a38d8",
                "job_id": "60d5ec9af682fbd12a0a38d9",
                "candidate_id": "60d5ec9af682fbd12a0a38da",
                "recruiter_id": "60d5ec9af682fbd12a0a38db",
                "title": "Technical Interview - Senior Software Engineer",
                "description": "Technical assessment focusing on system design and coding",
                "interview_type": "video",
                "interview_round": "technical",
                "scheduled_date": "2024-01-15T14:00:00Z",
                "duration": 60,
                "timezone": "America/New_York",
                "meeting_link": "https://zoom.us/j/123456789",
                "interviewers": ["60d5ec9af682fbd12a0a38dc"],
                "interviewer_names": ["John Smith"],
                "status": "scheduled",
                "feedback": {
                    "overall_rating": 4,
                    "technical_assessment": "Strong coding skills, good system design thinking",
                    "behavioral_assessment": "Good communication, team player",
                    "strengths": ["Problem solving", "Technical depth"],
                    "areas_for_improvement": ["Could improve on scalability considerations"],
                    "interviewer_feedbacks": [],
                    "final_recommendation": "hire",
                    "next_steps": "Proceed to final round"
                },
                "reschedule_count": 0,
                "reminder_sent": False,
                "confirmation_sent": True,
                "created_at": "2023-06-21T15:30:00",
                "updated_at": "2023-06-21T15:30:00"
            }
        }
    }

class InterviewListResponse(BaseModel):
    interviews: List[InterviewResponse]
    total: int
    page: int
    per_page: int
    total_pages: int

class InterviewFilters(BaseModel):
    job_id: Optional[str] = None
    candidate_id: Optional[str] = None
    interview_type: Optional[InterviewType] = None
    interview_round: Optional[InterviewRound] = None
    status: Optional[InterviewStatus] = None
    interviewer_id: Optional[str] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None

class InterviewCalendarResponse(BaseModel):
    date: str
    interviews: List[InterviewResponse]
    total_duration: int
    conflicts: List[dict] = []

class InterviewStats(BaseModel):
    total_interviews: int
    by_status: dict
    by_type: dict
    by_round: dict
    average_duration: Optional[float]
    completion_rate: float
    reschedule_rate: float
    no_show_rate: float

class BulkInterviewAction(BaseModel):
    interview_ids: List[str]
    action: str = Field(..., pattern="^(cancel|reschedule|send_reminder)$")
    reason: Optional[str] = None
    new_date: Optional[datetime] = None