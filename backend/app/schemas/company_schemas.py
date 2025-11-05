from datetime import datetime
from typing import Optional, List, Dict
from pydantic import BaseModel, Field, HttpUrl, validator
from app.models.company import (
    CompanySize, IndustryType, CompanyStage, TeamMember, 
    CompanyBranding, SocialLinks, CompanyLocation, 
    CompanyBenefits, RecruitmentSettings
)

class CompanyCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    tagline: Optional[str] = Field(None, max_length=100)
    website: Optional[HttpUrl] = None
    industry: IndustryType
    company_size: CompanySize
    company_stage: CompanyStage
    founded_year: Optional[int] = Field(None, ge=1800, le=2024)
    email: Optional[str] = None
    phone: Optional[str] = None
    locations: List[CompanyLocation] = []
    branding: Optional[CompanyBranding] = None
    social_links: Optional[SocialLinks] = None
    mission_statement: Optional[str] = None
    values: List[str] = []
    culture_description: Optional[str] = None
    benefits: Optional[CompanyBenefits] = None
    recruitment_settings: Optional[RecruitmentSettings] = None

class CompanyUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    tagline: Optional[str] = Field(None, max_length=100)
    website: Optional[HttpUrl] = None
    industry: Optional[IndustryType] = None
    company_size: Optional[CompanySize] = None
    company_stage: Optional[CompanyStage] = None
    founded_year: Optional[int] = Field(None, ge=1800, le=2024)
    email: Optional[str] = None
    phone: Optional[str] = None
    locations: Optional[List[CompanyLocation]] = None
    branding: Optional[CompanyBranding] = None
    social_links: Optional[SocialLinks] = None
    mission_statement: Optional[str] = None
    values: Optional[List[str]] = None
    culture_description: Optional[str] = None
    benefits: Optional[CompanyBenefits] = None
    recruitment_settings: Optional[RecruitmentSettings] = None

class TeamMemberAdd(BaseModel):
    user_id: str
    role: str
    permissions: List[str] = []

class TeamMemberUpdate(BaseModel):
    role: Optional[str] = None
    permissions: Optional[List[str]] = None
    is_active: Optional[bool] = None

class CompanyResponse(BaseModel):
    id: str = Field(..., alias="_id")
    name: str
    description: Optional[str]
    tagline: Optional[str]
    website: Optional[HttpUrl]
    industry: IndustryType
    company_size: CompanySize
    company_stage: CompanyStage
    founded_year: Optional[int]
    email: Optional[str]
    phone: Optional[str]
    locations: List[CompanyLocation]
    branding: CompanyBranding
    social_links: SocialLinks
    mission_statement: Optional[str]
    values: List[str]
    culture_description: Optional[str]
    benefits: CompanyBenefits
    team_members: List[TeamMember]
    owner_id: str
    recruitment_settings: RecruitmentSettings
    total_jobs_posted: int
    total_applications_received: int
    total_hires: int
    is_active: bool
    is_verified: bool
    verification_date: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    
    model_config = {
        "populate_by_name": True,
        "json_schema_extra": {
            "example": {
                "_id": "60d5ec9af682fbd12a0a38d7",
                "name": "TechCorp Inc.",
                "description": "Leading technology company focused on innovative solutions",
                "tagline": "Innovation at its finest",
                "website": "https://techcorp.com",
                "industry": "technology",
                "company_size": "51-200",
                "company_stage": "series_b",
                "founded_year": 2018,
                "email": "contact@techcorp.com",
                "phone": "+1-555-0123",
                "locations": [
                    {
                        "address": "123 Tech Street",
                        "city": "San Francisco",
                        "state": "CA",
                        "country": "USA",
                        "postal_code": "94105",
                        "is_headquarters": True
                    }
                ],
                "branding": {
                    "logo_url": "https://storage.example.com/logos/techcorp.png",
                    "primary_color": "#007bff",
                    "secondary_color": "#6c757d"
                },
                "social_links": {
                    "linkedin": "https://linkedin.com/company/techcorp",
                    "twitter": "https://twitter.com/techcorp"
                },
                "mission_statement": "To revolutionize technology for a better tomorrow",
                "values": ["Innovation", "Integrity", "Collaboration"],
                "culture_description": "We foster a culture of creativity and continuous learning",
                "benefits": {
                    "health_insurance": True,
                    "retirement_plan": True,
                    "flexible_hours": True,
                    "remote_work": True,
                    "professional_development": True
                },
                "team_members": [
                    {
                        "user_id": "60d5ec9af682fbd12a0a38d8",
                        "name": "Jane Smith",
                        "email": "jane@techcorp.com",
                        "role": "HR Manager",
                        "permissions": ["manage_jobs", "review_applications"],
                        "joined_at": "2023-01-15T10:00:00",
                        "is_active": True
                    }
                ],
                "owner_id": "60d5ec9af682fbd12a0a38d9",
                "recruitment_settings": {
                    "auto_reject_after_days": 30,
                    "require_cover_letter": True,
                    "enable_ai_screening": True,
                    "default_task_time_limit": 90
                },
                "total_jobs_posted": 25,
                "total_applications_received": 450,
                "total_hires": 12,
                "is_active": True,
                "is_verified": True,
                "verification_date": "2023-02-01T12:00:00",
                "created_at": "2023-01-15T10:00:00",
                "updated_at": "2023-06-21T15:30:00"
            }
        }
    }

class CompanyListResponse(BaseModel):
    companies: List[CompanyResponse]
    total: int
    page: int
    per_page: int
    total_pages: int

class CompanyFilters(BaseModel):
    industry: Optional[IndustryType] = None
    company_size: Optional[CompanySize] = None
    company_stage: Optional[CompanyStage] = None
    location: Optional[str] = None
    is_verified: Optional[bool] = None
    search_query: Optional[str] = None

class CompanyStats(BaseModel):
    total_companies: int
    by_industry: Dict[str, int]
    by_size: Dict[str, int]
    by_stage: Dict[str, int]
    verified_companies: int
    active_companies: int
    average_jobs_per_company: float
    average_applications_per_company: float

class CompanyBrandingUpdate(BaseModel):
    logo_url: Optional[str] = None
    banner_url: Optional[str] = None
    primary_color: Optional[str] = Field(None, pattern=r'^#[0-9A-Fa-f]{6}$')
    secondary_color: Optional[str] = Field(None, pattern=r'^#[0-9A-Fa-f]{6}$')
    font_family: Optional[str] = None

class CompanyVerificationRequest(BaseModel):
    company_id: str
    verification_documents: List[str] = []  # URLs to verification documents
    contact_person: str
    contact_email: str
    additional_info: Optional[str] = None

class CompanyInviteRequest(BaseModel):
    email: str
    role: str
    permissions: List[str] = []
    personal_message: Optional[str] = None

class CompanyPublicProfile(BaseModel):
    id: str = Field(..., alias="_id")
    name: str
    description: Optional[str]
    tagline: Optional[str]
    website: Optional[HttpUrl]
    industry: IndustryType
    company_size: CompanySize
    company_stage: CompanyStage
    founded_year: Optional[int]
    locations: List[CompanyLocation]
    branding: CompanyBranding
    social_links: SocialLinks
    mission_statement: Optional[str]
    values: List[str]
    culture_description: Optional[str]
    benefits: CompanyBenefits
    total_jobs_posted: int
    is_verified: bool
    
    model_config = {
        "populate_by_name": True
    }