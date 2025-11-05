from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

# Notification response schema
class NotificationResponse(BaseModel):
    id: str = Field(..., alias="_id")
    user_id: str
    type: str = Field(..., description="Type of notification")
    title: str = Field(..., description="Notification title")
    message: str = Field(..., description="Notification message")
    data: Dict[str, Any] = Field(default_factory=dict, description="Additional notification data")
    read: bool = Field(default=False, description="Whether notification has been read")
    read_at: Optional[str] = Field(None, description="When notification was read")
    created_at: str = Field(..., description="When notification was created")
    expires_at: Optional[str] = Field(None, description="When notification expires")
    
    model_config = {
        "populate_by_name": True,
        "json_schema_extra": {
            "example": {
                "_id": "60d5ec9af682fbd12a0a38d7",
                "user_id": "60d5ec9af682fbd12a0a38d8",
                "type": "deadline_reminder",
                "title": "Task Deadline Approaching",
                "message": "Your task 'Frontend Developer' is due in 2 hours",
                "data": {
                    "urgency": "urgent",
                    "deadline": "2023-12-31T23:59:59Z",
                    "job_title": "Frontend Developer"
                },
                "read": False,
                "read_at": None,
                "created_at": "2023-12-31T21:59:59Z",
                "expires_at": "2024-01-07T21:59:59Z"
            }
        }
    }

# Notifications list response
class NotificationsResponse(BaseModel):
    notifications: List[NotificationResponse]
    total: int = Field(..., ge=0, description="Total number of notifications")
    page: int = Field(..., ge=1, description="Current page number")
    per_page: int = Field(..., ge=1, description="Items per page")
    total_pages: int = Field(..., ge=0, description="Total number of pages")
    unread_count: int = Field(..., ge=0, description="Number of unread notifications")
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "notifications": [
                    {
                        "_id": "60d5ec9af682fbd12a0a38d7",
                        "user_id": "60d5ec9af682fbd12a0a38d8",
                        "type": "deadline_reminder",
                        "title": "Task Deadline Approaching",
                        "message": "Your task 'Frontend Developer' is due in 2 hours",
                        "data": {"urgency": "urgent"},
                        "read": False,
                        "read_at": None,
                        "created_at": "2023-12-31T21:59:59Z",
                        "expires_at": "2024-01-07T21:59:59Z"
                    }
                ],
                "total": 15,
                "page": 1,
                "per_page": 20,
                "total_pages": 1,
                "unread_count": 5
            }
        }
    }

# Notification creation schema
class NotificationCreate(BaseModel):
    type: str = Field(..., description="Type of notification")
    title: str = Field(..., max_length=200, description="Notification title")
    message: str = Field(..., max_length=1000, description="Notification message")
    data: Optional[Dict[str, Any]] = Field(None, description="Additional notification data")
    expires_at: Optional[datetime] = Field(None, description="When notification expires")
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "type": "deadline_reminder",
                "title": "Task Deadline Approaching",
                "message": "Your task 'Frontend Developer' is due in 2 hours",
                "data": {
                    "urgency": "urgent",
                    "job_title": "Frontend Developer"
                },
                "expires_at": "2024-01-07T21:59:59Z"
            }
        }
    }

# Notification update schema
class NotificationUpdate(BaseModel):
    read: Optional[bool] = Field(None, description="Mark as read/unread")
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "read": True
            }
        }
    }

# Notification preferences update schema
class NotificationPreferencesUpdate(BaseModel):
    email_notifications: Optional[bool] = None
    push_notifications: Optional[bool] = None
    deadline_reminders: Optional[bool] = None
    evaluation_results: Optional[bool] = None
    recruiter_updates: Optional[bool] = None
    new_recommendations: Optional[bool] = None
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "email_notifications": True,
                "deadline_reminders": True,
                "evaluation_results": True,
                "recruiter_updates": False,
                "new_recommendations": True
            }
        }
    }

# Notification statistics
class NotificationStats(BaseModel):
    total_count: int = Field(..., ge=0, description="Total notifications")
    unread_count: int = Field(..., ge=0, description="Unread notifications")
    type_counts: Dict[str, int] = Field(..., description="Count by notification type")
    recent_count: int = Field(..., ge=0, description="Recent notifications (last 7 days)")
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "total_count": 25,
                "unread_count": 5,
                "type_counts": {
                    "deadline_reminder": 8,
                    "evaluation_result": 10,
                    "recruiter_update": 5,
                    "new_recommendation": 2
                },
                "recent_count": 3
            }
        }
    }

# Real-time notification for WebSocket
class RealtimeNotification(BaseModel):
    id: str
    type: str
    title: str
    message: str
    data: Dict[str, Any] = Field(default_factory=dict)
    created_at: str
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "id": "60d5ec9af682fbd12a0a38d7",
                "type": "evaluation_result",
                "title": "AI Evaluation Complete",
                "message": "Your submission has been evaluated. Score: 85.5/100",
                "data": {
                    "job_title": "Frontend Developer",
                    "score": 85.5
                },
                "created_at": "2023-12-31T21:59:59Z"
            }
        }
    }