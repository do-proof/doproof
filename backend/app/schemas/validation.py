"""
Enhanced validation schemas for DoProof application.
Provides comprehensive input validation and sanitization.
"""

from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, validator, EmailStr
from datetime import datetime
from enum import Enum

from app.core.security import InputSanitizer, SecurityError

class SecureBaseModel(BaseModel):
    """Base model with automatic input sanitization."""
    
    class Config:
        # Validate assignment to catch changes after creation
        validate_assignment = True
        # Use enum values instead of names
        use_enum_values = True
        # Allow population by field name or alias
        allow_population_by_field_name = True

class SecureStringField(str):
    """String field with automatic sanitization."""
    
    @classmethod
    def __get_validators__(cls):
        yield cls.validate
    
    @classmethod
    def validate(cls, v, field=None):
        if not isinstance(v, str):
            raise ValueError('String required')
        
        # Get max length from field info
        max_length = 1000
        if field and hasattr(field.field_info, 'max_length'):
            max_length = field.field_info.max_length
        
        try:
            return InputSanitizer.sanitize_string(v, max_length=max_length)
        except SecurityError as e:
            raise ValueError(str(e))

class FileUploadValidation(SecureBaseModel):
    """Validation for file upload parameters."""
    
    filename: str = Field(..., max_length=255)
    file_size: int = Field(..., gt=0, le=50*1024*1024)  # Max 50MB
    content_type: str = Field(..., max_length=100)
    
    @validator('filename')
    def validate_filename(cls, v):
        try:
            return InputSanitizer.sanitize_filename(v)
        except SecurityError as e:
            raise ValueError(str(e))
    
    @validator('content_type')
    def validate_content_type(cls, v):
        allowed_types = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain',
            'image/jpeg',
            'image/png',
            'image/gif',
            'application/zip',
            'application/x-tar'
        ]
        if v not in allowed_types:
            raise ValueError(f'Content type {v} not allowed')
        return v

class JobValidation(SecureBaseModel):
    """Enhanced validation for job creation and updates."""
    
    title: str = Field(..., min_length=1, max_length=200)
    description: str = Field(..., min_length=10, max_length=5000)
    requirements: List[str] = Field(default_factory=list, max_items=20)
    responsibilities: List[str] = Field(default_factory=list, max_items=20)
    
    @validator('title', 'description')
    def sanitize_text_fields(cls, v):
        max_length = 200 if len(v) <= 200 else 5000
        try:
            return InputSanitizer.sanitize_string(v, max_length=max_length)
        except SecurityError as e:
            raise ValueError(str(e))
    
    @validator('requirements', 'responsibilities')
    def sanitize_list_fields(cls, v):
        if not isinstance(v, list):
            raise ValueError('Must be a list')
        
        sanitized = []
        for item in v:
            if not isinstance(item, str):
                raise ValueError('List items must be strings')
            try:
                sanitized.append(InputSanitizer.sanitize_string(item, max_length=500))
            except SecurityError as e:
                raise ValueError(f'Invalid list item: {str(e)}')
        
        return sanitized

class TaskValidation(SecureBaseModel):
    """Validation for task definitions."""
    
    title: str = Field(..., min_length=1, max_length=200)
    description: str = Field(..., min_length=10, max_length=2000)
    instructions: str = Field(..., min_length=10, max_length=2000)
    time_limit: int = Field(..., gt=0, le=480)  # Max 8 hours
    
    @validator('title', 'description', 'instructions')
    def sanitize_task_fields(cls, v):
        max_length = 200 if len(v) <= 200 else 2000
        try:
            return InputSanitizer.sanitize_string(v, max_length=max_length)
        except SecurityError as e:
            raise ValueError(str(e))

class UserValidation(SecureBaseModel):
    """Enhanced validation for user data."""
    
    name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    
    @validator('name')
    def sanitize_name(cls, v):
        try:
            return InputSanitizer.sanitize_string(v, max_length=100)
        except SecurityError as e:
            raise ValueError(str(e))
    
    @validator('email')
    def validate_email(cls, v):
        try:
            return InputSanitizer.validate_email(str(v))
        except SecurityError as e:
            raise ValueError(str(e))

class CompanyValidation(SecureBaseModel):
    """Validation for company profile data."""
    
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=2000)
    website: Optional[str] = Field(None, max_length=200)
    industry: Optional[str] = Field(None, max_length=100)
    size: Optional[str] = Field(None, max_length=50)
    
    @validator('name', 'description', 'website', 'industry', 'size')
    def sanitize_company_fields(cls, v):
        if v is None:
            return v
        
        max_length = {
            'name': 200,
            'description': 2000,
            'website': 200,
            'industry': 100,
            'size': 50
        }.get(cls.__name__, 1000)
        
        try:
            return InputSanitizer.sanitize_string(v, max_length=max_length)
        except SecurityError as e:
            raise ValueError(str(e))
    
    @validator('website')
    def validate_website_url(cls, v):
        if v is None:
            return v
        
        # Basic URL validation
        if not (v.startswith('http://') or v.startswith('https://')):
            v = 'https://' + v
        
        # Additional URL validation can be added here
        return v

class SearchValidation(SecureBaseModel):
    """Validation for search parameters."""
    
    query: Optional[str] = Field(None, max_length=100)
    filters: Optional[Dict[str, Any]] = Field(default_factory=dict)
    page: int = Field(default=1, ge=1, le=1000)
    per_page: int = Field(default=10, ge=1, le=100)
    
    @validator('query')
    def sanitize_search_query(cls, v):
        if v is None:
            return v
        
        try:
            return InputSanitizer.sanitize_string(v, max_length=100)
        except SecurityError as e:
            raise ValueError(str(e))
    
    @validator('filters')
    def validate_filters(cls, v):
        if not isinstance(v, dict):
            raise ValueError('Filters must be a dictionary')
        
        # Sanitize filter values
        sanitized_filters = {}
        for key, value in v.items():
            if isinstance(value, str):
                try:
                    sanitized_filters[key] = InputSanitizer.sanitize_string(value, max_length=100)
                except SecurityError:
                    # Skip invalid filter values
                    continue
            elif isinstance(value, (int, float, bool)):
                sanitized_filters[key] = value
        
        return sanitized_filters

class AuditLogValidation(SecureBaseModel):
    """Validation for audit log entries."""
    
    action: str = Field(..., max_length=100)
    resource_type: str = Field(..., max_length=50)
    resource_id: Optional[str] = Field(None, max_length=50)
    details: Optional[Dict[str, Any]] = Field(default_factory=dict)
    
    @validator('action', 'resource_type')
    def sanitize_audit_fields(cls, v):
        try:
            return InputSanitizer.sanitize_string(v, max_length=100)
        except SecurityError as e:
            raise ValueError(str(e))
    
    @validator('details')
    def validate_audit_details(cls, v):
        if not isinstance(v, dict):
            raise ValueError('Details must be a dictionary')
        
        # Limit the size of audit details
        if len(str(v)) > 1000:
            raise ValueError('Audit details too large')
        
        return v

class PasswordValidation(SecureBaseModel):
    """Enhanced password validation."""
    
    password: str = Field(..., min_length=8, max_length=128)
    
    @validator('password')
    def validate_password_strength(cls, v):
        # Check minimum requirements
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        
        # Check for at least one uppercase letter
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        
        # Check for at least one lowercase letter
        if not any(c.islower() for c in v):
            raise ValueError('Password must contain at least one lowercase letter')
        
        # Check for at least one digit
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one digit')
        
        # Check for common weak passwords
        weak_passwords = [
            'password', '12345678', 'qwerty123', 'admin123',
            'password123', '123456789', 'letmein123'
        ]
        if v.lower() in weak_passwords:
            raise ValueError('Password is too common, please choose a stronger password')
        
        return v

class IPAddressValidation(SecureBaseModel):
    """Validation for IP addresses."""
    
    ip_address: str = Field(..., max_length=45)  # IPv6 max length
    
    @validator('ip_address')
    def validate_ip_format(cls, v):
        import ipaddress
        try:
            # This will raise ValueError if invalid
            ipaddress.ip_address(v)
            return v
        except ValueError:
            raise ValueError('Invalid IP address format')