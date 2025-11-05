from datetime import datetime
from enum import Enum
from typing import Optional
from sqlalchemy import Column, String, DateTime, Integer, Enum as SQLEnum, ForeignKey, JSON, Text
from app.models.common import BaseModel

class SubmissionStatus(str, Enum):
    IN_PROGRESS = "in_progress"
    SUBMITTED = "submitted"
    EVALUATED = "evaluated"
    REVIEWED = "reviewed"
    SHORTLISTED = "shortlisted"
    REJECTED = "rejected"

class SubmissionType(str, Enum):
    TEXT = "text"
    FILE = "file"
    CODE = "code"
    PRESENTATION = "presentation"

class TaskSubmissionModel(BaseModel):
    __tablename__ = "task_submissions"
    
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False)
    candidate_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(SQLEnum(SubmissionStatus), default=SubmissionStatus.IN_PROGRESS, nullable=False)
    
    # Timing
    started_at = Column(DateTime, default=datetime.now)
    submitted_at = Column(DateTime, nullable=True)
    time_spent = Column(Integer, default=0)  # in minutes
    
    # Submission content (stored as JSON)
    submission = Column(JSON)  # SubmissionContent as JSON
    
    # AI Evaluation results (stored as JSON)
    ai_evaluation = Column(JSON)  # AIEvaluationResult as JSON
    
    # Recruiter review (stored as JSON)
    recruiter_review = Column(JSON)  # RecruiterReview as JSON
    
    # Basic application info
    cover_letter = Column(Text, nullable=True)
    resume_url = Column(String, nullable=True)