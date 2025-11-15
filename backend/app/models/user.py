from datetime import datetime
from enum import Enum
from sqlalchemy import Column, String, Enum as SQLEnum, Index
from app.models.common import BaseModel

class UserRole(str, Enum):
    STUDENT = "student"
    RECRUITER = "recruiter"
    ADMIN = "admin"

class UserModel(BaseModel):
    __tablename__ = "users"
    
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    role = Column(SQLEnum(UserRole), default=UserRole.STUDENT, nullable=False, index=True)
    
    # Indexes for student-specific queries
    __table_args__ = (
        Index('idx_user_role', 'role'),  # For filtering users by role (students, recruiters)
    )