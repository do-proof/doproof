"""
Enhanced security utilities for DoProof application.
Provides role-based access control, input sanitization, and audit logging.
"""

import re
import html
import logging
from datetime import datetime
from typing import List, Optional, Dict, Any
from functools import wraps
from fastapi import HTTPException, status, Depends, Request
from bson import ObjectId

from app.core.auth import get_current_user
from app.core.database import get_database
from app.models.user import UserRole

# Configure audit logger
audit_logger = logging.getLogger("audit")
audit_logger.setLevel(logging.INFO)
handler = logging.FileHandler("audit.log")
formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
handler.setFormatter(formatter)
audit_logger.addHandler(handler)

class SecurityError(Exception):
    """Custom exception for security-related errors."""
    pass

class InputSanitizer:
    """Utility class for input sanitization and validation."""
    
    # Regex patterns for validation
    EMAIL_PATTERN = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
    PHONE_PATTERN = re.compile(r'^\+?1?-?\.?\s?\(?([0-9]{3})\)?[-\.\s]?([0-9]{3})[-\.\s]?([0-9]{4})$')
    ALPHANUMERIC_PATTERN = re.compile(r'^[a-zA-Z0-9\s\-_\.]+$')
    
    # Dangerous patterns to block
    DANGEROUS_PATTERNS = [
        re.compile(r'<script[^>]*>.*?</script>', re.IGNORECASE | re.DOTALL),
        re.compile(r'javascript:', re.IGNORECASE),
        re.compile(r'on\w+\s*=', re.IGNORECASE),
        re.compile(r'<iframe[^>]*>.*?</iframe>', re.IGNORECASE | re.DOTALL),
        re.compile(r'<object[^>]*>.*?</object>', re.IGNORECASE | re.DOTALL),
        re.compile(r'<embed[^>]*>', re.IGNORECASE),
        re.compile(r'<link[^>]*>', re.IGNORECASE),
        re.compile(r'<meta[^>]*>', re.IGNORECASE),
    ]
    
    @classmethod
    def sanitize_string(cls, value: str, max_length: int = 1000) -> str:
        """Sanitize string input by removing dangerous content."""
        if not isinstance(value, str):
            raise SecurityError("Input must be a string")
        
        # Check length
        if len(value) > max_length:
            raise SecurityError(f"Input exceeds maximum length of {max_length}")
        
        # Check for dangerous patterns
        for pattern in cls.DANGEROUS_PATTERNS:
            if pattern.search(value):
                raise SecurityError("Input contains potentially dangerous content")
        
        # HTML escape the content
        sanitized = html.escape(value.strip())
        
        return sanitized
    
    @classmethod
    def validate_email(cls, email: str) -> str:
        """Validate and sanitize email address."""
        email = email.lower().strip()
        if not cls.EMAIL_PATTERN.match(email):
            raise SecurityError("Invalid email format")
        return email
    
    @classmethod
    def sanitize_filename(cls, filename: str) -> str:
        """Sanitize filename for safe storage."""
        # Remove path traversal attempts
        filename = filename.replace('..', '').replace('/', '').replace('\\', '')
        
        # Only allow alphanumeric, dots, hyphens, and underscores
        filename = re.sub(r'[^a-zA-Z0-9\.\-_]', '', filename)
        
        if not filename:
            raise SecurityError("Invalid filename")
        
        return filename
    
    @classmethod
    def validate_object_id(cls, object_id: str) -> str:
        """Validate MongoDB ObjectId format."""
        if not object_id:
            raise SecurityError("Object ID cannot be empty")
        
        # Check if it's a valid ObjectId format (24 hex characters)
        if not re.match(r'^[0-9a-fA-F]{24}$', object_id):
            raise SecurityError("Invalid Object ID format")
        
        return object_id
    
    @classmethod
    def sanitize_json(cls, data: dict, max_depth: int = 10) -> dict:
        """Recursively sanitize JSON data."""
        if max_depth <= 0:
            raise SecurityError("Maximum recursion depth exceeded")
        
        sanitized = {}
        for key, value in data.items():
            # Sanitize key
            sanitized_key = cls.sanitize_string(str(key), max_length=100)
            
            # Sanitize value based on type
            if isinstance(value, str):
                sanitized[sanitized_key] = cls.sanitize_string(value)
            elif isinstance(value, dict):
                sanitized[sanitized_key] = cls.sanitize_json(value, max_depth - 1)
            elif isinstance(value, list):
                sanitized[sanitized_key] = [
                    cls.sanitize_string(item) if isinstance(item, str) else item
                    for item in value[:100]  # Limit list size
                ]
            else:
                sanitized[sanitized_key] = value
        
        return sanitized
    
    @classmethod
    def sanitize_dict(cls, data: dict, max_depth: int = 10) -> dict:
        """Alias for sanitize_json for clarity."""
        return cls.sanitize_json(data, max_depth)

class AuditLogger:
    """Utility class for audit logging."""
    
    @staticmethod
    def log_action(
        user_id: str,
        action: str,
        resource_type: str,
        resource_id: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        status: str = "success",
        error_message: Optional[str] = None
    ):
        """Log security-sensitive actions to file."""
        log_entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "user_id": user_id,
            "action": action,
            "resource_type": resource_type,
            "resource_id": resource_id,
            "details": details or {},
            "ip_address": ip_address,
            "user_agent": user_agent,
            "status": status,
            "error_message": error_message
        }
        
        if status == "success":
            audit_logger.info(f"AUDIT: {log_entry}")
        else:
            audit_logger.warning(f"AUDIT_FAILURE: {log_entry}")
    
    @staticmethod
    async def log_to_database(
        user_id: str,
        action: str,
        resource_type: str,
        resource_id: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        status: str = "success",
        error_message: Optional[str] = None
    ):
        """Log audit entry to database for persistent storage."""
        from app.core.database import get_database
        
        try:
            db = get_database()
            
            audit_entry = {
                "user_id": user_id,
                "action": action,
                "resource_type": resource_type,
                "resource_id": resource_id,
                "details": details or {},
                "ip_address": ip_address,
                "user_agent": user_agent,
                "status": status,
                "error_message": error_message,
                "timestamp": datetime.utcnow()
            }
            
            await db.audit_logs.insert_one(audit_entry)
            
            # Also log to file
            AuditLogger.log_action(
                user_id, action, resource_type, resource_id, 
                details, ip_address, user_agent, status, error_message
            )
        except Exception as e:
            # If database logging fails, at least log to file
            audit_logger.error(f"Failed to log to database: {str(e)}")
            AuditLogger.log_action(
                user_id, action, resource_type, resource_id, 
                details, ip_address, user_agent, status, error_message
            )
    
    @staticmethod
    async def log_security_event(
        event_type: str,
        severity: str,
        description: str,
        ip_address: str,
        user_id: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        """Log security events (suspicious activities, violations, etc.)."""
        from app.core.database import get_database
        
        try:
            db = get_database()
            
            security_event = {
                "event_type": event_type,
                "severity": severity,
                "user_id": user_id,
                "ip_address": ip_address,
                "description": description,
                "details": details or {},
                "resolved": False,
                "timestamp": datetime.utcnow()
            }
            
            await db.security_events.insert_one(security_event)
            
            # Log to file based on severity
            if severity in ["high", "critical"]:
                audit_logger.error(f"SECURITY_EVENT: {security_event}")
            else:
                audit_logger.warning(f"SECURITY_EVENT: {security_event}")
        except Exception as e:
            audit_logger.error(f"Failed to log security event: {str(e)}")

class RoleChecker:
    """Role-based access control utilities."""
    
    def __init__(self, allowed_roles: List[UserRole]):
        self.allowed_roles = allowed_roles
    
    def __call__(self, current_user: dict = Depends(get_current_user)):
        user_role = current_user.get("role")
        if user_role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )
        return current_user

# Dependency functions for FastAPI
def require_recruiter_role():
    """Dependency to require recruiter role."""
    return RoleChecker([UserRole.RECRUITER, UserRole.ADMIN])

def require_admin_role():
    """Dependency to require admin role."""
    return RoleChecker([UserRole.ADMIN])

def require_any_authenticated():
    """Dependency to require any authenticated user."""
    return RoleChecker([UserRole.STUDENT, UserRole.RECRUITER, UserRole.ADMIN])

async def get_client_ip(request: Request) -> str:
    """Extract client IP address from request."""
    # Check for forwarded headers first (for reverse proxies)
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip
    
    # Fallback to direct client IP
    return request.client.host if request.client else "unknown"

def audit_action(action: str, resource_type: str):
    """Decorator for auditing actions with enhanced logging."""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Extract user and request from kwargs
            current_user = kwargs.get('current_user')
            request = kwargs.get('request')
            
            status = "success"
            error_message = None
            
            if current_user:
                user_id = str(current_user.get("_id") or current_user.get("id", "unknown"))
                ip_address = await get_client_ip(request) if request else None
                user_agent = request.headers.get("User-Agent") if request else None
                
                # Extract resource ID from path parameters
                resource_id = (kwargs.get('job_id') or kwargs.get('submission_id') or 
                             kwargs.get('interview_id') or kwargs.get('application_id'))
                
                try:
                    # Execute the function
                    result = await func(*args, **kwargs)
                    
                    # Log successful action to database
                    await AuditLogger.log_to_database(
                        user_id=user_id,
                        action=action,
                        resource_type=resource_type,
                        resource_id=resource_id,
                        ip_address=ip_address,
                        user_agent=user_agent,
                        status="success"
                    )
                    
                    return result
                    
                except Exception as e:
                    # Log failed action
                    status = "failure"
                    error_message = str(e)
                    
                    await AuditLogger.log_to_database(
                        user_id=user_id,
                        action=action,
                        resource_type=resource_type,
                        resource_id=resource_id,
                        ip_address=ip_address,
                        user_agent=user_agent,
                        status="failure",
                        error_message=error_message
                    )
                    
                    # Re-raise the exception
                    raise
            else:
                # No user context, just execute
                return await func(*args, **kwargs)
        
        return wrapper
    return decorator
class CompanyIsolation:
    """Ensure data isolation between companies/recruiters."""
    
    @staticmethod
    def check_resource_access(
        current_user: dict,
        resource_recruiter_id: str,
        resource_company_id: Optional[str] = None
    ) -> bool:
        """Check if user can access a resource based on company/recruiter isolation."""
        user_id = str(current_user.get("id", ""))
        user_role = current_user.get("role")
        user_company = current_user.get("company")
        
        # Admin can access everything
        if user_role == UserRole.ADMIN:
            return True
        
        # Recruiters can only access their own resources
        if user_role == UserRole.RECRUITER:
            # Check if it's the same recruiter
            if user_id == resource_recruiter_id:
                return True
            
            # Check if it's the same company (if company isolation is used)
            if user_company and resource_company_id and user_company == resource_company_id:
                return True
        
        return False
    
    @staticmethod
    def get_isolation_filter(current_user: dict) -> Dict[str, Any]:
        """Get filter for data isolation."""
        user_role = current_user.get("role")
        user_id = current_user.get("id")
        
        if user_role == UserRole.ADMIN:
            return {}  # Admin sees everything
        
        if user_role == UserRole.RECRUITER:
            return {"recruiter_id": user_id}
        
        # Students can only see their own data
        return {"candidate_id": user_id}

class StudentDataIsolation:
    """Ensure data isolation for students - they can only access their own data."""
    
    @staticmethod
    def check_student_resource_access(
        current_user: dict,
        resource_student_id: str
    ) -> bool:
        """Check if student can access a resource."""
        user_id = str(current_user.get("_id", ""))
        user_role = current_user.get("role")
        
        # Admin can access everything
        if user_role == UserRole.ADMIN:
            return True
        
        # Students can only access their own resources
        if user_role == UserRole.STUDENT:
            return user_id == resource_student_id
        
        return False
    
    @staticmethod
    def get_student_isolation_filter(current_user: dict) -> Dict[str, Any]:
        """Get filter for student data isolation."""
        user_role = current_user.get("role")
        user_id = current_user.get("_id")
        
        if user_role == UserRole.ADMIN:
            return {}  # Admin sees everything
        
        if user_role == UserRole.STUDENT:
            # Students can only see their own data
            return {"candidate_id": ObjectId(user_id) if isinstance(user_id, str) else user_id}
        
        # Recruiters don't have access to student-specific endpoints
        return {"_id": None}  # Return empty result
    
    @staticmethod
    def ensure_student_owns_resource(
        current_user: dict,
        resource: dict,
        resource_id_field: str = "candidate_id"
    ) -> None:
        """Ensure the student owns the resource, raise exception if not."""
        user_id = str(current_user.get("_id", ""))
        user_role = current_user.get("role")
        
        # Admin bypass
        if user_role == UserRole.ADMIN:
            return
        
        # Check ownership
        resource_owner_id = str(resource.get(resource_id_field, ""))
        if user_id != resource_owner_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. You can only access your own resources."
            )

# Dependency functions for student access control
def require_student():
    """Dependency to require student role."""
    return RoleChecker([UserRole.STUDENT, UserRole.ADMIN])

def require_student_strict():
    """Dependency to require student role only (no admin bypass)."""
    return RoleChecker([UserRole.STUDENT])
