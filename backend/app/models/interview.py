from datetime import datetime
from enum import Enum
from typing import Optional, List, Dict
from pydantic import Field
from bson import ObjectId
from app.models.common import PyObjectId, BaseModel

class InterviewType(str, Enum):
    PHONE = "phone"
    VIDEO = "video"
    ONSITE = "onsite"

class InterviewStatus(str, Enum):
    SCHEDULED = "scheduled"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    RESCHEDULED = "rescheduled"
    NO_SHOW = "no_show"

class InterviewRound(str, Enum):
    SCREENING = "screening"
    TECHNICAL = "technical"
    BEHAVIORAL = "behavioral"
    FINAL = "final"
    CULTURE_FIT = "culture_fit"

class InterviewerFeedback(BaseModel):
    interviewer_id: PyObjectId
    interviewer_name: str
    technical_score: Optional[int] = Field(None, ge=1, le=5)
    communication_score: Optional[int] = Field(None, ge=1, le=5)
    culture_fit_score: Optional[int] = Field(None, ge=1, le=5)
    overall_rating: Optional[int] = Field(None, ge=1, le=5)
    notes: Optional[str] = None
    recommendation: Optional[str] = Field(None, pattern="^(hire|no_hire|maybe|pending)$")
    submitted_at: datetime = Field(default_factory=datetime.now)

class InterviewFeedback(BaseModel):
    overall_rating: int = Field(..., ge=1, le=5)
    technical_assessment: Optional[str] = None
    behavioral_assessment: Optional[str] = None
    strengths: List[str] = []
    areas_for_improvement: List[str] = []
    interviewer_feedbacks: List[InterviewerFeedback] = []
    final_recommendation: str = Field(..., pattern="^(hire|no_hire|maybe|pending)$")
    next_steps: Optional[str] = None

class InterviewModel(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    submission_id: PyObjectId  # Links to task submission
    job_id: PyObjectId
    candidate_id: PyObjectId
    recruiter_id: PyObjectId
    
    # Interview details
    title: str
    description: Optional[str] = None
    interview_type: InterviewType
    interview_round: InterviewRound = InterviewRound.SCREENING
    
    # Scheduling
    scheduled_date: datetime
    duration: int = Field(..., description="Duration in minutes")
    timezone: str = "UTC"
    
    # Location/Meeting details
    location: Optional[str] = None  # For onsite interviews
    meeting_link: Optional[str] = None  # For video interviews
    meeting_id: Optional[str] = None
    phone_number: Optional[str] = None  # For phone interviews
    
    # Participants
    interviewers: List[PyObjectId] = []
    interviewer_names: List[str] = []  # Denormalized for easy access
    
    # Status and tracking
    status: InterviewStatus = InterviewStatus.SCHEDULED
    
    # Feedback and evaluation
    feedback: Optional[InterviewFeedback] = None
    notes: Optional[str] = None
    
    # Rescheduling history
    original_date: Optional[datetime] = None
    reschedule_reason: Optional[str] = None
    reschedule_count: int = 0
    
    # Notifications
    reminder_sent: bool = False
    confirmation_sent: bool = False
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    completed_at: Optional[datetime] = None
    
    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {ObjectId: str},
        "json_schema_extra": {
            "example": {
                "submission_id": "507f1f77bcf86cd799439011",
                "job_id": "507f1f77bcf86cd799439012",
                "candidate_id": "507f1f77bcf86cd799439013",
                "recruiter_id": "507f1f77bcf86cd799439014",
                "title": "Technical Interview - Senior Software Engineer",
                "description": "Technical assessment focusing on system design and coding",
                "interview_type": "video",
                "interview_round": "technical",
                "scheduled_date": "2024-01-15T14:00:00Z",
                "duration": 60,
                "timezone": "America/New_York",
                "meeting_link": "https://zoom.us/j/123456789",
                "interviewers": ["507f1f77bcf86cd799439015"],
                "interviewer_names": ["John Smith"],
                "status": "scheduled",
                "feedback": {
                    "overall_rating": 4,
                    "technical_assessment": "Strong coding skills, good system design thinking",
                    "behavioral_assessment": "Good communication, team player",
                    "strengths": ["Problem solving", "Technical depth"],
                    "areas_for_improvement": ["Could improve on scalability considerations"],
                    "interviewer_feedbacks": [
                        {
                            "interviewer_id": "507f1f77bcf86cd799439015",
                            "interviewer_name": "John Smith",
                            "technical_score": 4,
                            "communication_score": 4,
                            "culture_fit_score": 5,
                            "overall_rating": 4,
                            "notes": "Solid candidate with good potential",
                            "recommendation": "hire"
                        }
                    ],
                    "final_recommendation": "hire",
                    "next_steps": "Proceed to final round"
                }
            }
        }
    }