from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Path, Request
from bson import ObjectId
import math

from app.core.auth import get_current_user, require_any_authenticated
from app.core.database import get_database
from app.core.security import (
    InputSanitizer, AuditLogger, audit_action, get_client_ip, SecurityError
)
from app.models.user import UserRole
from app.schemas.notification_schemas import (
    NotificationResponse, NotificationsResponse, NotificationCreate,
    NotificationUpdate, NotificationPreferencesUpdate, NotificationStats
)

router = APIRouter(tags=["notifications"], prefix="/notifications")

@router.get("", response_model=NotificationsResponse)
async def get_notifications(
    request: Request,
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(20, ge=1, le=100, description="Items per page"),
    unread_only: bool = Query(False, description="Show only unread notifications"),
    notification_type: Optional[str] = Query(None, description="Filter by notification type"),
    current_user: dict = Depends(require_any_authenticated)
):
    """Get notifications for the current user."""
    db = get_database()
    
    # Build filter query
    filter_query = {"user_id": ObjectId(current_user["_id"])}
    
    if unread_only:
        filter_query["read"] = False
    
    if notification_type:
        filter_query["type"] = notification_type
    
    # Get total count
    total = await db.notifications.count_documents(filter_query)
    
    # Calculate pagination
    skip = (page - 1) * per_page
    total_pages = math.ceil(total / per_page)
    
    # Get notifications with pagination
    notifications_cursor = db.notifications.find(filter_query).skip(skip).limit(per_page).sort("created_at", -1)
    notifications = await notifications_cursor.to_list(length=per_page)
    
    # Format notifications
    formatted_notifications = []
    for notification in notifications:
        formatted_notification = {
            "_id": str(notification["_id"]),
            "user_id": str(notification["user_id"]),
            "type": notification["type"],
            "title": notification["title"],
            "message": notification["message"],
            "data": notification.get("data", {}),
            "read": notification.get("read", False),
            "read_at": notification.get("read_at").isoformat() if notification.get("read_at") else None,
            "created_at": notification["created_at"].isoformat(),
            "expires_at": notification.get("expires_at").isoformat() if notification.get("expires_at") else None
        }
        formatted_notifications.append(formatted_notification)
    
    # Get unread count
    unread_count = await db.notifications.count_documents({
        "user_id": ObjectId(current_user["_id"]),
        "read": False
    })
    
    return {
        "notifications": formatted_notifications,
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": total_pages,
        "unread_count": unread_count
    }

@router.get("/stats", response_model=NotificationStats)
async def get_notification_stats(
    current_user: dict = Depends(require_any_authenticated)
):
    """Get notification statistics for the current user."""
    db = get_database()
    
    user_id = ObjectId(current_user["_id"])
    
    # Get total and unread counts
    total_count = await db.notifications.count_documents({"user_id": user_id})
    unread_count = await db.notifications.count_documents({"user_id": user_id, "read": False})
    
    # Get counts by type
    pipeline = [
        {"$match": {"user_id": user_id}},
        {"$group": {"_id": "$type", "count": {"$sum": 1}}}
    ]
    type_counts_cursor = db.notifications.aggregate(pipeline)
    type_counts = {doc["_id"]: doc["count"] async for doc in type_counts_cursor}
    
    # Get recent activity (last 7 days)
    recent_date = datetime.utcnow() - timedelta(days=7)
    recent_count = await db.notifications.count_documents({
        "user_id": user_id,
        "created_at": {"$gte": recent_date}
    })
    
    return {
        "total_count": total_count,
        "unread_count": unread_count,
        "type_counts": type_counts,
        "recent_count": recent_count
    }

@router.patch("/{notification_id}/read", response_model=NotificationResponse)
@audit_action("NOTIFICATION_READ", "notification")
async def mark_notification_read(
    request: Request,
    notification_id: str = Path(..., description="Notification ID"),
    current_user: dict = Depends(require_any_authenticated)
):
    """Mark a notification as read."""
    db = get_database()
    
    try:
        notification_object_id = InputSanitizer.validate_object_id(notification_id)
    except SecurityError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    # Find and verify ownership
    notification = await db.notifications.find_one({
        "_id": notification_object_id,
        "user_id": ObjectId(current_user["_id"])
    })
    
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    # Update notification
    await db.notifications.update_one(
        {"_id": notification_object_id},
        {
            "$set": {
                "read": True,
                "read_at": datetime.utcnow()
            }
        }
    )
    
    # Get updated notification
    updated_notification = await db.notifications.find_one({"_id": notification_object_id})
    
    return {
        "_id": str(updated_notification["_id"]),
        "user_id": str(updated_notification["user_id"]),
        "type": updated_notification["type"],
        "title": updated_notification["title"],
        "message": updated_notification["message"],
        "data": updated_notification.get("data", {}),
        "read": updated_notification["read"],
        "read_at": updated_notification.get("read_at").isoformat() if updated_notification.get("read_at") else None,
        "created_at": updated_notification["created_at"].isoformat(),
        "expires_at": updated_notification.get("expires_at").isoformat() if updated_notification.get("expires_at") else None
    }

@router.patch("/mark-all-read", status_code=status.HTTP_204_NO_CONTENT)
@audit_action("NOTIFICATIONS_MARK_ALL_READ", "notification")
async def mark_all_notifications_read(
    request: Request,
    current_user: dict = Depends(require_any_authenticated)
):
    """Mark all notifications as read for the current user."""
    db = get_database()
    
    await db.notifications.update_many(
        {
            "user_id": ObjectId(current_user["_id"]),
            "read": False
        },
        {
            "$set": {
                "read": True,
                "read_at": datetime.utcnow()
            }
        }
    )

@router.delete("/{notification_id}", status_code=status.HTTP_204_NO_CONTENT)
@audit_action("NOTIFICATION_DELETE", "notification")
async def delete_notification(
    request: Request,
    notification_id: str = Path(..., description="Notification ID"),
    current_user: dict = Depends(require_any_authenticated)
):
    """Delete a notification."""
    db = get_database()
    
    try:
        notification_object_id = InputSanitizer.validate_object_id(notification_id)
    except SecurityError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    # Find and verify ownership
    notification = await db.notifications.find_one({
        "_id": notification_object_id,
        "user_id": ObjectId(current_user["_id"])
    })
    
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    # Delete notification
    await db.notifications.delete_one({"_id": notification_object_id})

@router.delete("/clear-all", status_code=status.HTTP_204_NO_CONTENT)
@audit_action("NOTIFICATIONS_CLEAR_ALL", "notification")
async def clear_all_notifications(
    request: Request,
    current_user: dict = Depends(require_any_authenticated)
):
    """Clear all notifications for the current user."""
    db = get_database()
    
    await db.notifications.delete_many({"user_id": ObjectId(current_user["_id"])})

# Internal function to create notifications (used by other services)
async def create_notification(
    db,
    user_id: ObjectId,
    notification_type: str,
    title: str,
    message: str,
    data: dict = None,
    expires_at: datetime = None
) -> str:
    """Create a new notification for a user."""
    
    notification_doc = {
        "user_id": user_id,
        "type": notification_type,
        "title": title,
        "message": message,
        "data": data or {},
        "read": False,
        "created_at": datetime.utcnow(),
        "expires_at": expires_at
    }
    
    result = await db.notifications.insert_one(notification_doc)
    return str(result.inserted_id)

# Notification creation functions for different types
async def notify_task_deadline(db, user_id: ObjectId, job_title: str, deadline: datetime):
    """Create a task deadline notification."""
    hours_until_deadline = int((deadline - datetime.utcnow()).total_seconds() / 3600)
    
    if hours_until_deadline <= 24:
        urgency = "urgent"
        time_text = f"{hours_until_deadline} hours"
    else:
        urgency = "normal"
        days = hours_until_deadline // 24
        time_text = f"{days} days"
    
    await create_notification(
        db=db,
        user_id=user_id,
        notification_type="deadline_reminder",
        title="Task Deadline Approaching",
        message=f"Your task '{job_title}' is due in {time_text}",
        data={
            "urgency": urgency,
            "deadline": deadline.isoformat(),
            "job_title": job_title
        }
    )

async def notify_evaluation_complete(db, user_id: ObjectId, job_title: str, score: float):
    """Create an evaluation complete notification."""
    await create_notification(
        db=db,
        user_id=user_id,
        notification_type="evaluation_result",
        title="AI Evaluation Complete",
        message=f"Your submission for '{job_title}' has been evaluated. Score: {score:.1f}/100",
        data={
            "job_title": job_title,
            "score": score
        }
    )

async def notify_recruiter_review(db, user_id: ObjectId, job_title: str, decision: str):
    """Create a recruiter review notification."""
    decision_text = {
        "shortlist": "You've been shortlisted!",
        "reject": "Application not selected",
        "pending": "Under review"
    }.get(decision, "Review completed")
    
    await create_notification(
        db=db,
        user_id=user_id,
        notification_type="recruiter_update",
        title="Recruiter Review Update",
        message=f"{decision_text} for '{job_title}'",
        data={
            "job_title": job_title,
            "decision": decision
        }
    )

async def notify_new_recommendation(db, user_id: ObjectId, job_title: str, match_score: float):
    """Create a new recommendation notification."""
    await create_notification(
        db=db,
        user_id=user_id,
        notification_type="new_recommendation",
        title="New Job Recommendation",
        message=f"We found a great match for you: '{job_title}' ({match_score:.0f}% match)",
        data={
            "job_title": job_title,
            "match_score": match_score
        }
    )

# Cleanup expired notifications (should be called periodically)
async def cleanup_expired_notifications(db):
    """Remove expired notifications."""
    await db.notifications.delete_many({
        "expires_at": {"$lt": datetime.utcnow()}
    })