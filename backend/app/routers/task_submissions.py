from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Body, Depends, HTTPException, status, Path, Query, Request
from bson import ObjectId
import math

from app.core.auth import get_current_user, require_recruiter
from app.core.database import get_database
from app.core.security import (
    InputSanitizer, AuditLogger, CompanyIsolation, 
    audit_action, get_client_ip, SecurityError
)
from app.models.task_submission import TaskSubmissionModel, SubmissionStatus
from app.models.user import UserRole
from app.schemas.task_submission_schemas import (
    TaskSubmissionCreate, TaskSubmissionUpdate, TaskSubmissionSubmit,
    RecruiterReviewCreate, TaskSubmissionResponse, TaskSubmissionListResponse,
    TaskSubmissionFilters, BulkStatusUpdate, SubmissionStats
)
from app.routers.notifications import notify_recruiter_review

router = APIRouter(tags=["task-submissions"], prefix="/task-submissions")

@router.get("", response_model=TaskSubmissionListResponse)
async def get_task_submissions(
    request: Request,
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(10, ge=1, le=100, description="Items per page"),
    job_id: Optional[str] = Query(None, description="Filter by job ID"),
    status: Optional[SubmissionStatus] = Query(None, description="Filter by status"),
    min_score: Optional[float] = Query(None, ge=0, le=100, description="Minimum AI score"),
    max_score: Optional[float] = Query(None, ge=0, le=100, description="Maximum AI score"),
    has_ai_evaluation: Optional[bool] = Query(None, description="Filter by AI evaluation presence"),
    has_recruiter_review: Optional[bool] = Query(None, description="Filter by recruiter review presence"),
    current_user: dict = Depends(require_recruiter)
):
    """Get task submissions with filtering and pagination for recruiter's jobs with security validation."""
    db = get_database()
    
    # Validate job_id if provided
    if job_id:
        try:
            InputSanitizer.validate_object_id(job_id)
        except SecurityError as e:
            raise HTTPException(status_code=400, detail=str(e))
    
    # Apply data isolation filter
    isolation_filter = CompanyIsolation.get_isolation_filter(current_user)
    
    # Get all job IDs for this recruiter with proper isolation
    recruiter_jobs = await db.jobs.find(
        isolation_filter,
        {"_id": 1}
    ).to_list(length=None)
    
    if not recruiter_jobs:
        return TaskSubmissionListResponse(
            submissions=[], total=0, page=page, per_page=per_page, total_pages=0
        )
    
    recruiter_job_ids = [job["_id"] for job in recruiter_jobs]
    
    # Build filter query
    filter_query = {"job_id": {"$in": recruiter_job_ids}}
    
    if job_id:
        # Already validated above
        filter_query["job_id"] = ObjectId(job_id)
    
    if status:
        filter_query["status"] = status
    
    if min_score is not None or max_score is not None:
        score_filter = {}
        if min_score is not None:
            score_filter["$gte"] = min_score
        if max_score is not None:
            score_filter["$lte"] = max_score
        filter_query["ai_evaluation.overall_score"] = score_filter
    
    if has_ai_evaluation is not None:
        if has_ai_evaluation:
            filter_query["ai_evaluation"] = {"$exists": True, "$ne": None}
        else:
            filter_query["ai_evaluation"] = {"$exists": False}
    
    if has_recruiter_review is not None:
        if has_recruiter_review:
            filter_query["recruiter_review"] = {"$exists": True, "$ne": None}
        else:
            filter_query["recruiter_review"] = {"$exists": False}
    
    # Get total count
    total = await db.task_submissions.count_documents(filter_query)
    
    # Calculate pagination
    skip = (page - 1) * per_page
    total_pages = math.ceil(total / per_page)
    
    # Get submissions with pagination
    submissions_cursor = db.task_submissions.find(filter_query).skip(skip).limit(per_page).sort("created_at", -1)
    submissions = await submissions_cursor.to_list(length=per_page)
    
    return TaskSubmissionListResponse(
        submissions=submissions,
        total=total,
        page=page,
        per_page=per_page,
        total_pages=total_pages
    )

@router.get("/{submission_id}", response_model=TaskSubmissionResponse)
async def get_task_submission(
    request: Request,
    submission_id: str = Path(..., description="Task submission ID"),
    current_user: dict = Depends(get_current_user)
):
    """Get a specific task submission by ID with security validation."""
    db = get_database()
    
    # Validate and sanitize submission ID
    try:
        submission_object_id = InputSanitizer.validate_object_id(submission_id)
    except SecurityError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    submission = await db.task_submissions.find_one({"_id": submission_object_id})
    
    if submission is None:
        raise HTTPException(status_code=404, detail="Task submission not found")
    
    # Check access permissions based on user role
    user_role = current_user.get("role")
    user_id = ObjectId(current_user["_id"])
    
    if user_role == UserRole.RECRUITER:
        # Verify the submission belongs to a job owned by this recruiter
        isolation_filter = CompanyIsolation.get_isolation_filter(current_user)
        isolation_filter["_id"] = submission["job_id"]
        
        job = await db.jobs.find_one(isolation_filter)
        
        if job is None:
            # Log unauthorized access attempt
            ip_address = await get_client_ip(request)
            AuditLogger.log_action(
                user_id=str(current_user["_id"]),
                action="UNAUTHORIZED_SUBMISSION_ACCESS_ATTEMPT",
                resource_type="task_submission",
                resource_id=submission_id,
                ip_address=ip_address
            )
            raise HTTPException(status_code=403, detail="Access denied to this submission")
    
    elif user_role == UserRole.STUDENT:
        # Students can only access their own submissions
        if submission["candidate_id"] != user_id:
            # Log unauthorized access attempt
            ip_address = await get_client_ip(request)
            AuditLogger.log_action(
                user_id=str(current_user["_id"]),
                action="UNAUTHORIZED_SUBMISSION_ACCESS_ATTEMPT",
                resource_type="task_submission",
                resource_id=submission_id,
                ip_address=ip_address
            )
            raise HTTPException(status_code=403, detail="Access denied to this submission")
    
    # Admin can access everything (no additional checks needed)
    
    return submission

@router.post("", response_model=TaskSubmissionResponse, status_code=status.HTTP_201_CREATED)
@audit_action("CREATE_TASK_SUBMISSION", "task_submission")
async def create_task_submission(
    request: Request,
    submission: TaskSubmissionCreate = Body(...),
    current_user: dict = Depends(get_current_user)
):
    """Create a new task submission (typically called by candidates) with security validation."""
    db = get_database()
    
    # Validate and sanitize job ID
    try:
        job_object_id = InputSanitizer.validate_object_id(submission.job_id)
    except SecurityError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    # Verify job exists and is active
    job = await db.jobs.find_one({
        "_id": job_object_id,
        "status": "active"
    })
    
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found or not active")
    
    # Check if user already has a submission for this job
    existing_submission = await db.task_submissions.find_one({
        "job_id": job_object_id,
        "candidate_id": ObjectId(current_user["_id"])
    })
    
    if existing_submission:
        raise HTTPException(
            status_code=400,
            detail="You already have a submission for this job"
        )
    
    # Prepare and sanitize submission data
    try:
        submission_dict = submission.dict(by_alias=True)
        
        # Sanitize any text fields if present
        if "cover_letter" in submission_dict and submission_dict["cover_letter"]:
            submission_dict["cover_letter"] = InputSanitizer.sanitize_string(
                submission_dict["cover_letter"], max_length=2000
            )
        
        submission_dict["job_id"] = job_object_id
        submission_dict["candidate_id"] = ObjectId(current_user["_id"])
        submission_dict["status"] = SubmissionStatus.IN_PROGRESS
        
    except SecurityError as e:
        raise HTTPException(status_code=400, detail=f"Input validation failed: {str(e)}")
    
    # Set timestamps
    now = datetime.now()
    submission_dict["started_at"] = now
    submission_dict["created_at"] = now
    submission_dict["updated_at"] = now
    submission_dict["time_spent"] = 0
    
    try:
        new_submission = await db.task_submissions.insert_one(submission_dict)
        created_submission = await db.task_submissions.find_one({"_id": new_submission.inserted_id})
        
        # Update job application count
        await db.jobs.update_one(
            {"_id": job_object_id},
            {"$inc": {"application_count": 1}}
        )
        
        return created_submission
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create task submission: {str(e)}"
        )

@router.put("/{submission_id}", response_model=TaskSubmissionResponse)
@audit_action("UPDATE_TASK_SUBMISSION", "task_submission")
async def update_task_submission(
    request: Request,
    submission_id: str = Path(..., description="Task submission ID"),
    submission_update: TaskSubmissionUpdate = Body(...),
    current_user: dict = Depends(get_current_user)
):
    """Update a task submission with security validation."""
    db = get_database()
    
    # Validate and sanitize submission ID
    try:
        submission_object_id = InputSanitizer.validate_object_id(submission_id)
    except SecurityError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    # Check if submission exists
    submission = await db.task_submissions.find_one({"_id": submission_object_id})
    
    if submission is None:
        raise HTTPException(status_code=404, detail="Task submission not found")
    
    # Check permissions - either the candidate who owns it or recruiter who owns the job
    if str(submission["candidate_id"]) == current_user["_id"]:
        # Candidate can only update their own in-progress submissions
        if submission["status"] != SubmissionStatus.IN_PROGRESS:
            raise HTTPException(
                status_code=400,
                detail="Cannot update submitted task"
            )
    else:
        # Check if current user is the recruiter for this job
        user_role = current_user.get("role")
        
        if user_role == UserRole.RECRUITER:
            isolation_filter = CompanyIsolation.get_isolation_filter(current_user)
            isolation_filter["_id"] = submission["job_id"]
            
            job = await db.jobs.find_one(isolation_filter)
            
            if job is None:
                # Log unauthorized access attempt
                ip_address = await get_client_ip(request)
                AuditLogger.log_action(
                    user_id=str(current_user["_id"]),
                    action="UNAUTHORIZED_SUBMISSION_UPDATE_ATTEMPT",
                    resource_type="task_submission",
                    resource_id=submission_id,
                    ip_address=ip_address
                )
                raise HTTPException(status_code=403, detail="Access denied to this submission")
        elif user_role != UserRole.ADMIN:
            # Only admin, recruiter, or candidate can update
            raise HTTPException(status_code=403, detail="Access denied to this submission")
    
    # Prepare and sanitize update data
    try:
        update_dict = submission_update.dict(by_alias=True, exclude_unset=True)
        update_data = {}
        
        for key, value in update_dict.items():
            if value is not None:
                # Sanitize text fields
                if key in ["cover_letter", "notes"] and isinstance(value, str):
                    max_len = 2000 if key == "cover_letter" else 1000
                    update_data[key] = InputSanitizer.sanitize_string(value, max_length=max_len)
                elif key == "submission" and isinstance(value, dict):
                    # Sanitize submission content
                    sanitized_submission = {}
                    for sub_key, sub_value in value.items():
                        if sub_key == "content" and isinstance(sub_value, str):
                            sanitized_submission[sub_key] = InputSanitizer.sanitize_string(sub_value, max_length=10000)
                        else:
                            sanitized_submission[sub_key] = sub_value
                    update_data[key] = sanitized_submission
                else:
                    update_data[key] = value
                    
    except SecurityError as e:
        raise HTTPException(status_code=400, detail=f"Input validation failed: {str(e)}")
    
    if update_data:
        update_data["updated_at"] = datetime.now()
        
        try:
            await db.task_submissions.update_one(
                {"_id": submission_object_id},
                {"$set": update_data}
            )
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to update task submission: {str(e)}"
            )
    
    updated_submission = await db.task_submissions.find_one({"_id": submission_object_id})
    return updated_submission

@router.post("/{submission_id}/submit", response_model=TaskSubmissionResponse)
async def submit_task(
    submission_id: str = Path(..., description="Task submission ID"),
    submit_data: TaskSubmissionSubmit = Body(...),
    current_user: dict = Depends(get_current_user)
):
    """Submit a completed task."""
    db = get_database()
    
    if not ObjectId.is_valid(submission_id):
        raise HTTPException(status_code=400, detail="Invalid submission ID format")
    
    submission = await db.task_submissions.find_one({"_id": ObjectId(submission_id)})
    
    if submission is None:
        raise HTTPException(status_code=404, detail="Task submission not found")
    
    # Only the candidate can submit their own task
    if str(submission["candidate_id"]) != current_user["_id"]:
        raise HTTPException(status_code=403, detail="Access denied to this submission")
    
    # Can only submit in-progress tasks
    if submission["status"] != SubmissionStatus.IN_PROGRESS:
        raise HTTPException(
            status_code=400,
            detail="Task is not in progress or already submitted"
        )
    
    # Update submission with submitted data
    now = datetime.now()
    update_data = {
        "submission": submit_data.submission.dict(),
        "time_spent": submit_data.time_spent,
        "status": SubmissionStatus.SUBMITTED,
        "submitted_at": now,
        "updated_at": now
    }
    
    try:
        await db.task_submissions.update_one(
            {"_id": ObjectId(submission_id)},
            {"$set": update_data}
        )
        
        # Update job submission count
        await db.jobs.update_one(
            {"_id": submission["job_id"]},
            {"$inc": {"submission_count": 1}}
        )
        
        # TODO: Trigger AI evaluation here
        # This would typically be done via a background task or message queue
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to submit task: {str(e)}"
        )
    
    updated_submission = await db.task_submissions.find_one({"_id": ObjectId(submission_id)})
    return updated_submission

@router.post("/{submission_id}/review", response_model=TaskSubmissionResponse)
async def add_recruiter_review(
    submission_id: str = Path(..., description="Task submission ID"),
    review: RecruiterReviewCreate = Body(...),
    current_user: dict = Depends(get_current_user)
):
    """Add recruiter review to a task submission."""
    db = get_database()
    
    if not ObjectId.is_valid(submission_id):
        raise HTTPException(status_code=400, detail="Invalid submission ID format")
    
    submission = await db.task_submissions.find_one({"_id": ObjectId(submission_id)})
    
    if submission is None:
        raise HTTPException(status_code=404, detail="Task submission not found")
    
    # Verify the submission belongs to a job owned by this recruiter
    job = await db.jobs.find_one({
        "_id": submission["job_id"],
        "recruiter_id": ObjectId(current_user["_id"])
    })
    
    if job is None:
        raise HTTPException(status_code=403, detail="Access denied to this submission")
    
    # Can only review submitted or evaluated tasks
    if submission["status"] not in [SubmissionStatus.SUBMITTED, SubmissionStatus.EVALUATED]:
        raise HTTPException(
            status_code=400,
            detail="Task must be submitted or evaluated before review"
        )
    
    # Prepare review data
    review_data = review.dict()
    review_data["reviewed_at"] = datetime.now()
    review_data["reviewed_by"] = ObjectId(current_user["_id"])
    
    # Update status based on decision
    new_status = SubmissionStatus.REVIEWED
    if review.decision == "shortlist":
        new_status = SubmissionStatus.SHORTLISTED
    elif review.decision == "reject":
        new_status = SubmissionStatus.REJECTED
    
    update_data = {
        "recruiter_review": review_data,
        "status": new_status,
        "updated_at": datetime.now()
    }
    
    try:
        await db.task_submissions.update_one(
            {"_id": ObjectId(submission_id)},
            {"$set": update_data}
        )
        
        # Send notification to student about recruiter review
        await notify_recruiter_review(
            db=db,
            user_id=submission["candidate_id"],
            job_title=job["title"],
            decision=review.decision
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to add review: {str(e)}"
        )
    
    updated_submission = await db.task_submissions.find_one({"_id": ObjectId(submission_id)})
    return updated_submission

@router.post("/bulk-update", response_model=dict)
async def bulk_update_status(
    bulk_update: BulkStatusUpdate = Body(...),
    current_user: dict = Depends(get_current_user)
):
    """Bulk update status for multiple submissions."""
    db = get_database()
    
    # Validate submission IDs
    submission_ids = []
    for submission_id in bulk_update.submission_ids:
        if not ObjectId.is_valid(submission_id):
            raise HTTPException(status_code=400, detail=f"Invalid submission ID format: {submission_id}")
        submission_ids.append(ObjectId(submission_id))
    
    # Get recruiter's job IDs
    recruiter_jobs = await db.jobs.find(
        {"recruiter_id": ObjectId(current_user["_id"])},
        {"_id": 1}
    ).to_list(length=None)
    
    recruiter_job_ids = [job["_id"] for job in recruiter_jobs]
    
    # Update submissions that belong to recruiter's jobs
    update_data = {
        "status": bulk_update.status,
        "updated_at": datetime.now()
    }
    
    if bulk_update.notes:
        update_data["bulk_update_notes"] = bulk_update.notes
    
    try:
        result = await db.task_submissions.update_many(
            {
                "_id": {"$in": submission_ids},
                "job_id": {"$in": recruiter_job_ids}
            },
            {"$set": update_data}
        )
        
        return {
            "updated_count": result.modified_count,
            "requested_count": len(submission_ids),
            "status": "success"
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to bulk update submissions: {str(e)}"
        )

@router.get("/stats/overview", response_model=SubmissionStats)
async def get_submission_stats(
    job_id: Optional[str] = Query(None, description="Filter stats by job ID"),
    current_user: dict = Depends(get_current_user)
):
    """Get submission statistics for recruiter's jobs."""
    db = get_database()
    
    # Build match query for recruiter's jobs
    match_query = {"recruiter_id": ObjectId(current_user["_id"])}
    if job_id:
        if not ObjectId.is_valid(job_id):
            raise HTTPException(status_code=400, detail="Invalid job ID format")
        match_query["_id"] = ObjectId(job_id)
    
    # Get job IDs
    recruiter_jobs = await db.jobs.find(match_query, {"_id": 1, "title": 1}).to_list(length=None)
    recruiter_job_ids = [job["_id"] for job in recruiter_jobs]
    
    if not recruiter_job_ids:
        return SubmissionStats(
            total_submissions=0,
            by_status={},
            by_job={},
            average_score=None,
            average_time_spent=None,
            completion_rate=0.0
        )
    
    # Aggregate submission stats
    pipeline = [
        {"$match": {"job_id": {"$in": recruiter_job_ids}}},
        {"$group": {
            "_id": None,
            "total_submissions": {"$sum": 1},
            "by_status": {"$push": "$status"},
            "by_job": {"$push": "$job_id"},
            "scores": {"$push": "$ai_evaluation.overall_score"},
            "time_spent": {"$push": "$time_spent"},
            "completed_count": {
                "$sum": {
                    "$cond": [
                        {"$in": ["$status", ["submitted", "evaluated", "reviewed", "shortlisted"]]},
                        1, 0
                    ]
                }
            }
        }}
    ]
    
    result = await db.task_submissions.aggregate(pipeline).to_list(length=1)
    
    if not result:
        return SubmissionStats(
            total_submissions=0,
            by_status={},
            by_job={},
            average_score=None,
            average_time_spent=None,
            completion_rate=0.0
        )
    
    data = result[0]
    
    # Process status counts
    status_counts = {}
    for status in data["by_status"]:
        status_counts[status] = status_counts.get(status, 0) + 1
    
    # Process job counts
    job_counts = {}
    job_title_map = {job["_id"]: job["title"] for job in recruiter_jobs}
    for job_id in data["by_job"]:
        job_title = job_title_map.get(job_id, str(job_id))
        job_counts[job_title] = job_counts.get(job_title, 0) + 1
    
    # Calculate averages
    valid_scores = [score for score in data["scores"] if score is not None]
    average_score = sum(valid_scores) / len(valid_scores) if valid_scores else None
    
    valid_times = [time for time in data["time_spent"] if time is not None and time > 0]
    average_time_spent = sum(valid_times) / len(valid_times) if valid_times else None
    
    completion_rate = (data["completed_count"] / data["total_submissions"]) * 100 if data["total_submissions"] > 0 else 0.0
    
    return SubmissionStats(
        total_submissions=data["total_submissions"],
        by_status=status_counts,
        by_job=job_counts,
        average_score=average_score,
        average_time_spent=average_time_spent,
        completion_rate=completion_rate
    )