from datetime import datetime
from enum import Enum
from typing import Optional
from sqlalchemy import Column, String, DateTime, Integer, Enum as SQLEnum, ForeignKey, JSON, Text, Index
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
    
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False, index=True)
    candidate_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    status = Column(SQLEnum(SubmissionStatus), default=SubmissionStatus.IN_PROGRESS, nullable=False, index=True)
    
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
    
    # Indexes for student-specific queries
    __table_args__ = (
        Index('idx_submission_candidate_status', 'candidate_id', 'status'),  # For student's applications by status
        Index('idx_submission_job_candidate', 'job_id', 'candidate_id'),  # For checking if student already applied
        Index('idx_submission_started_at', 'candidate_id', 'started_at'),  # For sorting student submissions by date
        Index('idx_submission_status_submitted', 'status', 'submitted_at'),  # For filtering evaluated submissions
    )