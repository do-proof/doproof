"""
Audit log model for tracking security-sensitive operations.
"""

from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field
from bson import ObjectId


class AuditLogModel(BaseModel):
    """Model for audit log entries."""
    
    id: Optional[str] = Field(None, alias="_id")
    user_id: str = Field(..., description="ID of the user performing the action")
    action: str = Field(..., description="Action performed (e.g., 'STUDENT_ENROLL', 'PROFILE_UPDATE')")
    resource_type: str = Field(..., description="Type of resource affected (e.g., 'application', 'profile')")
    resource_id: Optional[str] = Field(None, description="ID of the affected resource")
    details: Dict[str, Any] = Field(default_factory=dict, description="Additional details about the action")
    ip_address: Optional[str] = Field(None, description="IP address of the client")
    user_agent: Optional[str] = Field(None, description="User agent string")
    status: str = Field(default="success", description="Status of the action (success, failure, error)")
    error_message: Optional[str] = Field(None, description="Error message if action failed")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Timestamp of the action")
    
    class Config:
        populate_by_name = True
        json_encoders = {
            ObjectId: str,
            datetime: lambda v: v.isoformat()
        }


class SecurityEventModel(BaseModel):
    """Model for security events (suspicious activities, violations, etc.)."""
    
    id: Optional[str] = Field(None, alias="_id")
    event_type: str = Field(..., description="Type of security event")
    severity: str = Field(..., description="Severity level (low, medium, high, critical)")
    user_id: Optional[str] = Field(None, description="User ID if applicable")
    ip_address: str = Field(..., description="IP address of the source")
    description: str = Field(..., description="Description of the security event")
    details: Dict[str, Any] = Field(default_factory=dict, description="Additional event details")
    resolved: bool = Field(default=False, description="Whether the event has been resolved")
    resolved_at: Optional[datetime] = Field(None, description="When the event was resolved")
    resolved_by: Optional[str] = Field(None, description="Who resolved the event")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Timestamp of the event")
    
    class Config:
        populate_by_name = True
        json_encoders = {
            ObjectId: str,
            datetime: lambda v: v.isoformat()
        }
