from datetime import datetime
from enum import Enum
from sqlalchemy import Column, String, Integer, Boolean, DateTime, Enum as SQLEnum, JSON, ForeignKey
from app.models.common import BaseModel

class CompanySize(str, Enum):
    STARTUP = "1-10"
    SMALL = "11-50"
    MEDIUM = "51-200"
    LARGE = "201-1000"
    ENTERPRISE = "1000+"

class IndustryType(str, Enum):
    TECHNOLOGY = "technology"
    FINANCE = "finance"
    HEALTHCARE = "healthcare"
    EDUCATION = "education"
    RETAIL = "retail"
    MANUFACTURING = "manufacturing"
    CONSULTING = "consulting"
    MEDIA = "media"
    NONPROFIT = "nonprofit"
    OTHER = "other"

class CompanyStage(str, Enum):
    IDEA = "idea"
    SEED = "seed"
    SERIES_A = "series_a"
    SERIES_B = "series_b"
    SERIES_C = "series_c"
    GROWTH = "growth"
    PUBLIC = "public"
    ESTABLISHED = "established"

class CompanyModel(BaseModel):
    __tablename__ = "companies"
    
    # Basic information
    name = Column(String, nullable=False)
    description = Column(String)
    tagline = Column(String)
    website = Column(String)
    
    # Company details
    industry = Column(SQLEnum(IndustryType), nullable=False)
    company_size = Column(SQLEnum(CompanySize), nullable=False)
    company_stage = Column(SQLEnum(CompanyStage), nullable=False)
    founded_year = Column(Integer)
    
    # Contact information
    email = Column(String)
    phone = Column(String)
    locations = Column(JSON)  # Store as JSON array
    
    # Branding and media (stored as JSON)
    branding = Column(JSON)
    social_links = Column(JSON)
    
    # Culture and benefits
    mission_statement = Column(String)
    values = Column(JSON)  # Store as JSON array
    culture_description = Column(String)
    benefits = Column(JSON)  # Store as JSON object
    
    # Team management
    team_members = Column(JSON)  # Store as JSON array
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Recruitment settings
    recruitment_settings = Column(JSON)  # Store as JSON object
    
    # Statistics
    total_jobs_posted = Column(Integer, default=0)
    total_applications_received = Column(Integer, default=0)
    total_hires = Column(Integer, default=0)
    
    # Status
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    verification_date = Column(DateTime)