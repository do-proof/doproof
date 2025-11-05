from datetime import datetime
from enum import Enum
from typing import Optional
from sqlalchemy import Column, String, DateTime, Integer, Enum as SQLEnum, ForeignKey, JSON, Text
from app.models.common import BaseModel

class JobStatus(str, Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    PAUSED = "paused"
    CLOSED = "closed"

class LocationType(str, Enum):
    REMOTE = "remote"
    ONSITE = "onsite"
    HYBRID = "hybrid"

class EmploymentType(str, Enum):
    FULL_TIME = "full-time"
    PART_TIME = "part-time"
    CONTRACT = "contract"
    INTERNSHIP = "internship"

class SubmissionFormat(str, Enum):
    TEXT = "text"
    FILE = "file"
    CODE = "code"
    PRESENTATION = "presentation"

class JobModel(BaseModel):
    __tablename__ = "jobs"
    
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    requirements = Column(JSON)  # Store as JSON array
    responsibilities = Column(JSON)  # Store as JSON array
    
    # Salary information (stored as JSON)
    salary = Column(JSON)  # {"min": int, "max": int, "currency": str}
    
    # Location information (stored as JSON)
    location = Column(JSON)  # {"type": str, "city": str, "country": str}
    
    employment_type = Column(SQLEnum(EmploymentType), nullable=False)
    status = Column(SQLEnum(JobStatus), default=JobStatus.DRAFT, nullable=False)
    posted_date = Column(DateTime, default=datetime.now)
    closing_date = Column(DateTime, nullable=True)
    
    # DoProof-specific task fields (stored as JSON)
    task = Column(JSON)  # TaskDefinition as JSON
    
    # AI Evaluation criteria (stored as JSON)
    evaluation_criteria = Column(JSON)  # EvaluationCriteria as JSON
    
    # Metrics
    application_count = Column(Integer, default=0)
    submission_count = Column(Integer, default=0)
    view_count = Column(Integer, default=0)
    
    # References
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    recruiter_id = Column(Integer, ForeignKey("users.id"), nullable=False)