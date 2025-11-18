"""
Security-related schemas for validation and sanitization.
"""

from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, validator, field_validator
from datetime import datetime
import re


class SanitizedString(str):
    """Custom string type that is automatically sanitized."""
    
    @classmethod
    def __get_validators__(cls):
        yield cls.validate
    
    @classmethod
    def validate(cls, v):
        if not isinstance(v, str):
            raise TypeError('string required')
        
        from app.core.security import InputSanitizer
        return InputSanitizer.sanitize_string(v)


class AuditLogQuery(BaseModel):
    """Query parameters for audit log retrieval."""
    
    user_id: Optional[str] = None
    action: Optional[str] = None
    resource_type: Optional[str] = None
    resource_id: Optional[str] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    status: Optional[str] = Field(None, pattern="^(success|failure|error)$")
    page: int = Field(1, ge=1)
    per_page: int = Field(50, ge=1, le=100)


class SecurityEventQuery(BaseModel):
    """Query parameters for security event retrieval."""
    
    event_type: Optional[str] = None
    severity: Optional[str] = Field(None, pattern="^(low|medium|high|critical)$")
    user_id: Optional[str] = None
    ip_address: Optional[str] = None
    resolved: Optional[bool] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    page: int = Field(1, ge=1)
    per_page: int = Field(50, ge=1, le=100)


class AuditLogResponse(BaseModel):
    """Response model for audit log entries."""
    
    id: str = Field(..., alias="_id")
    user_id: str
    action: str
    resource_type: str
    resource_id: Optional[str] = None
    details: Dict[str, Any] = {}
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    status: str
    error_message: Optional[str] = None
    timestamp: datetime
    
    class Config:
        populate_by_name = True


class SecurityEventResponse(BaseModel):
    """Response model for security events."""
    
    id: str = Field(..., alias="_id")
    event_type: str
    severity: str
    user_id: Optional[str] = None
    ip_address: str
    description: str
    details: Dict[str, Any] = {}
    resolved: bool
    resolved_at: Optional[datetime] = None
    resolved_by: Optional[str] = None
    timestamp: datetime
    
    class Config:
        populate_by_name = True


class DataAccessRequest(BaseModel):
    """Request model for data access validation."""
    
    user_id: str
    resource_type: str
    resource_id: str
    action: str = Field(..., pattern="^(read|write|delete|update)$")


class DataAccessResponse(BaseModel):
    """Response model for data access validation."""
    
    allowed: bool
    reason: Optional[str] = None
    user_role: str
    resource_owner: Optional[str] = None


class InputValidationError(BaseModel):
    """Model for input validation errors."""
    
    field: str
    message: str
    value: Optional[Any] = None


class SecurityCheckResult(BaseModel):
    """Result of security checks."""
    
    passed: bool
    checks: Dict[str, bool]
    violations: List[str] = []
    warnings: List[str] = []
