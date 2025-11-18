"""
Security and audit endpoints for administrators.
"""

from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Path
from bson import ObjectId
import math

from app.core.auth import get_current_user, require_admin
from app.core.database import get_database
from app.core.security import InputSanitizer, SecurityError
from app.models.user import UserRole
from app.schemas.security_schemas import (
    AuditLogQuery, SecurityEventQuery, AuditLogResponse, 
    SecurityEventResponse, DataAccessRequest, DataAccessResponse
)

router = APIRouter(tags=["security"], prefix="/security")


@router.get("/audit-logs", response_model=dict)
async def get_audit_logs(
    user_id: Optional[str] = Query(None, description="Filter by user ID"),
    action: Optional[str] = Query(None, description="Filter by action"),
    resource_type: Optional[str] = Query(None, description="Filter by resource type"),
    resource_id: Optional[str] = Query(None, description="Filter by resource ID"),
    date_from: Optional[datetime] = Query(None, description="Filter from date"),
    date_to: Optional[datetime] = Query(None, description="Filter to date"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status"),
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(50, ge=1, le=100, description="Items per page"),
    current_user: dict = Depends(require_admin)
):
    """Get audit logs (admin only)."""
    db = get_database()
    
    # Build filter query
    filter_query = {}
    
    if user_id:
        try:
            InputSanitizer.validate_object_id(user_id)
            filter_query["user_id"] = user_id
        except SecurityError:
            # If not ObjectId, treat as string
            filter_query["user_id"] = user_id
    
    if action:
        filter_query["action"] = action
    
    if resource_type:
        filter_query["resource_type"] = resource_type
    
    if resource_id:
        filter_query["resource_id"] = resource_id
    
    if date_from or date_to:
        date_filter = {}
        if date_from:
            date_filter["$gte"] = date_from
        if date_to:
            date_filter["$lte"] = date_to
        filter_query["timestamp"] = date_filter
    
    if status_filter:
        filter_query["status"] = status_filter
    
    # Get total count
    total = await db.audit_logs.count_documents(filter_query)
    
    # Calculate pagination
    skip = (page - 1) * per_page
    total_pages = math.ceil(total / per_page) if total > 0 else 0
    
    # Get audit logs
    logs_cursor = db.audit_logs.find(filter_query).skip(skip).limit(per_page).sort("timestamp", -1)
    logs = await logs_cursor.to_list(length=per_page)
    
    # Format response
    formatted_logs = []
    for log in logs:
        formatted_logs.append({
            "_id": str(log["_id"]),
            "user_id": log["user_id"],
            "action": log["action"],
            "resource_type": log["resource_type"],
            "resource_id": log.get("resource_id"),
            "details": log.get("details", {}),
            "ip_address": log.get("ip_address"),
            "user_agent": log.get("user_agent"),
            "status": log.get("status", "success"),
            "error_message": log.get("error_message"),
            "timestamp": log["timestamp"].isoformat()
        })
    
    return {
        "logs": formatted_logs,
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": total_pages
    }


@router.get("/security-events", response_model=dict)
async def get_security_events(
    event_type: Optional[str] = Query(None, description="Filter by event type"),
    severity: Optional[str] = Query(None, description="Filter by severity"),
    user_id: Optional[str] = Query(None, description="Filter by user ID"),
    ip_address: Optional[str] = Query(None, description="Filter by IP address"),
    resolved: Optional[bool] = Query(None, description="Filter by resolved status"),
    date_from: Optional[datetime] = Query(None, description="Filter from date"),
    date_to: Optional[datetime] = Query(None, description="Filter to date"),
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(50, ge=1, le=100, description="Items per page"),
    current_user: dict = Depends(require_admin)
):
    """Get security events (admin only)."""
    db = get_database()
    
    # Build filter query
    filter_query = {}
    
    if event_type:
        filter_query["event_type"] = event_type
    
    if severity:
        filter_query["severity"] = severity
    
    if user_id:
        filter_query["user_id"] = user_id
    
    if ip_address:
        filter_query["ip_address"] = ip_address
    
    if resolved is not None:
        filter_query["resolved"] = resolved
    
    if date_from or date_to:
        date_filter = {}
        if date_from:
            date_filter["$gte"] = date_from
        if date_to:
            date_filter["$lte"] = date_to
        filter_query["timestamp"] = date_filter
    
    # Get total count
    total = await db.security_events.count_documents(filter_query)
    
    # Calculate pagination
    skip = (page - 1) * per_page
    total_pages = math.ceil(total / per_page) if total > 0 else 0
    
    # Get security events
    events_cursor = db.security_events.find(filter_query).skip(skip).limit(per_page).sort("timestamp", -1)
    events = await events_cursor.to_list(length=per_page)
    
    # Format response
    formatted_events = []
    for event in events:
        formatted_events.append({
            "_id": str(event["_id"]),
            "event_type": event["event_type"],
            "severity": event["severity"],
            "user_id": event.get("user_id"),
            "ip_address": event["ip_address"],
            "description": event["description"],
            "details": event.get("details", {}),
            "resolved": event["resolved"],
            "resolved_at": event.get("resolved_at").isoformat() if event.get("resolved_at") else None,
            "resolved_by": event.get("resolved_by"),
            "timestamp": event["timestamp"].isoformat()
        })
    
    return {
        "events": formatted_events,
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": total_pages
    }


@router.patch("/security-events/{event_id}/resolve", response_model=dict)
async def resolve_security_event(
    event_id: str = Path(..., description="Security event ID"),
    current_user: dict = Depends(require_admin)
):
    """Mark a security event as resolved (admin only)."""
    db = get_database()
    
    try:
        event_object_id = InputSanitizer.validate_object_id(event_id)
    except SecurityError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    # Find the event
    event = await db.security_events.find_one({"_id": event_object_id})
    
    if not event:
        raise HTTPException(status_code=404, detail="Security event not found")
    
    # Update the event
    await db.security_events.update_one(
        {"_id": event_object_id},
        {
            "$set": {
                "resolved": True,
                "resolved_at": datetime.utcnow(),
                "resolved_by": str(current_user["_id"])
            }
        }
    )
    
    return {
        "message": "Security event marked as resolved",
        "event_id": event_id
    }


@router.get("/audit-logs/user/{user_id}", response_model=dict)
async def get_user_audit_logs(
    user_id: str = Path(..., description="User ID"),
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(50, ge=1, le=100, description="Items per page"),
    current_user: dict = Depends(require_admin)
):
    """Get audit logs for a specific user (admin only)."""
    db = get_database()
    
    try:
        InputSanitizer.validate_object_id(user_id)
    except SecurityError:
        # If not ObjectId, treat as string
        pass
    
    # Get audit logs for the user
    filter_query = {"user_id": user_id}
    
    total = await db.audit_logs.count_documents(filter_query)
    skip = (page - 1) * per_page
    total_pages = math.ceil(total / per_page) if total > 0 else 0
    
    logs_cursor = db.audit_logs.find(filter_query).skip(skip).limit(per_page).sort("timestamp", -1)
    logs = await logs_cursor.to_list(length=per_page)
    
    # Format response
    formatted_logs = []
    for log in logs:
        formatted_logs.append({
            "_id": str(log["_id"]),
            "user_id": log["user_id"],
            "action": log["action"],
            "resource_type": log["resource_type"],
            "resource_id": log.get("resource_id"),
            "details": log.get("details", {}),
            "ip_address": log.get("ip_address"),
            "user_agent": log.get("user_agent"),
            "status": log.get("status", "success"),
            "error_message": log.get("error_message"),
            "timestamp": log["timestamp"].isoformat()
        })
    
    return {
        "logs": formatted_logs,
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": total_pages,
        "user_id": user_id
    }


@router.get("/stats", response_model=dict)
async def get_security_stats(
    current_user: dict = Depends(require_admin)
):
    """Get security statistics (admin only)."""
    db = get_database()
    
    # Get audit log stats
    total_audit_logs = await db.audit_logs.count_documents({})
    failed_actions = await db.audit_logs.count_documents({"status": "failure"})
    
    # Get security event stats
    total_security_events = await db.security_events.count_documents({})
    unresolved_events = await db.security_events.count_documents({"resolved": False})
    critical_events = await db.security_events.count_documents({"severity": "critical", "resolved": False})
    high_events = await db.security_events.count_documents({"severity": "high", "resolved": False})
    
    # Get recent activity (last 24 hours)
    from datetime import timedelta
    yesterday = datetime.utcnow() - timedelta(days=1)
    
    recent_audit_logs = await db.audit_logs.count_documents({"timestamp": {"$gte": yesterday}})
    recent_security_events = await db.security_events.count_documents({"timestamp": {"$gte": yesterday}})
    recent_failed_actions = await db.audit_logs.count_documents({
        "timestamp": {"$gte": yesterday},
        "status": "failure"
    })
    
    # Get top actions
    top_actions_pipeline = [
        {"$group": {"_id": "$action", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 10}
    ]
    top_actions_cursor = db.audit_logs.aggregate(top_actions_pipeline)
    top_actions = await top_actions_cursor.to_list(length=10)
    
    # Get top users by activity
    top_users_pipeline = [
        {"$group": {"_id": "$user_id", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 10}
    ]
    top_users_cursor = db.audit_logs.aggregate(top_users_pipeline)
    top_users = await top_users_cursor.to_list(length=10)
    
    return {
        "audit_logs": {
            "total": total_audit_logs,
            "failed_actions": failed_actions,
            "recent_24h": recent_audit_logs,
            "recent_failures_24h": recent_failed_actions,
            "top_actions": [{"action": a["_id"], "count": a["count"]} for a in top_actions],
            "top_users": [{"user_id": u["_id"], "count": u["count"]} for u in top_users]
        },
        "security_events": {
            "total": total_security_events,
            "unresolved": unresolved_events,
            "critical_unresolved": critical_events,
            "high_unresolved": high_events,
            "recent_24h": recent_security_events
        }
    }
