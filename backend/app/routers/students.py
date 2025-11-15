from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Body, Depends, HTTPException, status, Path, Query, Request
from bson import ObjectId
import math

from app.core.auth import get_current_user, require_any_authenticated
from app.core.database import get_database
from app.core.security import (
    InputSanitizer, AuditLogger, audit_action, get_client_ip, SecurityError,
    require_student, StudentDataIsolation
)
from app.models.task_submission import SubmissionStatus
from app.models.user import UserRole
from app.schemas.student_schemas import (
    EnrollmentRequest, StudentApplicationResponse, StudentApplicationsResponse,
    StudentApplicationSummary, ApplicationProgressUpdate, StudentSubmissionResponse,
    StudentProfile, StudentProfileUpdate, ProfileCompletenessAnalysis,
    PersonalInfo, SkillsInfo, ExperienceInfo, CareerPreferences, PortfolioInfo,
    NotificationPreferences, PrivacySettings
)

router = APIRouter(tags=["students"], prefix="/students")

@router.post("/applications/{job_id}/enroll", response_model=StudentApplicationResponse, status_code=status.HTTP_201_CREATED)
@audit_action("STUDENT_ENROLL", "application")
async def enroll_in_job(
    request: Request,
    job_id: str = Path(..., description="Job ID to enroll in"),
    enrollment_data: EnrollmentRequest = Body(...),
    current_user: dict = Depends(require_student())
):
    """Enroll a student in a job task."""
    db = get_database()
    ip_address = await get_client_ip(request)
    
    # Only students can enroll (already checked by require_student)
    if current_user.get("role") != UserRole.STUDENT:
        raise HTTPException(status_code=403, detail="Only students can enroll in jobs")
    
    # Log enrollment attempt
    AuditLogger.log_action(
        user_id=str(current_user["_id"]),
        action="STUDENT_ENROLL_ATTEMPT",
        resource_type="application",
        resource_id=job_id,
        details={"job_id": job_id},
        ip_address=ip_address
    )
    
    # Validate and sanitize job ID
    try:
        job_object_id = InputSanitizer.validate_object_id(job_id)
    except SecurityError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    # Verify job exists and is active
    job = await db.jobs.find_one({
        "_id": job_object_id,
        "status": "active"
    })
    
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found or not active")
    
    # Check if job has a deadline and if it's passed
    if job.get("closing_date") and datetime.now() > job["closing_date"]:
        raise HTTPException(status_code=400, detail="Job application deadline has passed")
    
    # Check if user already has a submission for this job
    existing_submission = await db.task_submissions.find_one({
        "job_id": job_object_id,
        "candidate_id": ObjectId(current_user["_id"])
    })
    
    if existing_submission:
        raise HTTPException(
            status_code=400,
            detail="You are already enrolled in this job"
        )
    
    # Prepare submission data for enrollment
    try:
        submission_dict = {
            "job_id": job_object_id,
            "candidate_id": ObjectId(current_user["_id"]),
            "status": SubmissionStatus.IN_PROGRESS,
            "started_at": datetime.now(),
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
            "time_spent": 0,
        }
        
        # Add optional fields if provided - sanitize all input
        if enrollment_data.cover_letter:
            submission_dict["cover_letter"] = InputSanitizer.sanitize_string(
                enrollment_data.cover_letter, max_length=2000
            )
        
        # Sanitize any other string fields
        if hasattr(enrollment_data, 'notes') and enrollment_data.notes:
            submission_dict["notes"] = InputSanitizer.sanitize_string(
                enrollment_data.notes, max_length=1000
            )
        
        if enrollment_data.expected_completion_time:
            submission_dict["expected_completion_time"] = enrollment_data.expected_completion_time
            
    except SecurityError as e:
        raise HTTPException(status_code=400, detail=f"Input validation failed: {str(e)}")
    
    try:
        # Create the submission/application
        new_submission = await db.task_submissions.insert_one(submission_dict)
        created_submission = await db.task_submissions.find_one({"_id": new_submission.inserted_id})
        
        # Update job application count
        await db.jobs.update_one(
            {"_id": job_object_id},
            {"$inc": {"application_count": 1}}
        )
        
        # Log the enrollment
        ip_address = await get_client_ip(request)
        AuditLogger.log_action(
            user_id=str(current_user["_id"]),
            action="JOB_ENROLLMENT",
            resource_type="job",
            resource_id=job_id,
            ip_address=ip_address
        )
        
        # Fetch job details for response
        job_details = await db.jobs.find_one({"_id": job_object_id})
        
        # Format response
        application_response = {
            "_id": str(created_submission["_id"]),
            "job_id": job_id,
            "student_id": str(current_user["_id"]),
            "status": created_submission["status"],
            "enrolled_at": created_submission["started_at"].isoformat(),
            "submission_id": str(created_submission["_id"]),
            "progress": {
                "time_spent": created_submission["time_spent"],
                "last_activity": created_submission["updated_at"].isoformat(),
                "completion_percentage": 0
            },
            "job": {
                "title": job_details["title"],
                "description": job_details["description"],
                "task": job_details["task"],
                "closing_date": job_details.get("closing_date").isoformat() if job_details.get("closing_date") else None
            },
            "created_at": created_submission["created_at"].isoformat(),
            "updated_at": created_submission["updated_at"].isoformat()
        }
        
        return application_response
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to enroll in job: {str(e)}"
        )

@router.get("/applications", response_model=StudentApplicationsResponse)
async def get_student_applications(
    request: Request,
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(10, ge=1, le=100, description="Items per page"),
    status: Optional[List[str]] = Query(None, description="Filter by status"),
    job_id: Optional[str] = Query(None, description="Filter by job ID"),
    has_evaluation: Optional[bool] = Query(None, description="Filter by evaluation presence"),
    has_recruiter_review: Optional[bool] = Query(None, description="Filter by recruiter review presence"),
    min_score: Optional[float] = Query(None, ge=0, le=100, description="Minimum AI score"),
    max_score: Optional[float] = Query(None, ge=0, le=100, description="Maximum AI score"),
    current_user: dict = Depends(require_student())
):
    """Get all applications for the current student."""
    db = get_database()
    
    # Ensure student role (already checked by require_student, but double-check for safety)
    if current_user.get("role") != UserRole.STUDENT:
        raise HTTPException(status_code=403, detail="Only students can access applications")
    
    # Apply data isolation - students can only see their own applications
    isolation_filter = StudentDataIsolation.get_student_isolation_filter(current_user)
    
    # Build filter query
    filter_query = {"candidate_id": ObjectId(current_user["_id"])}
    
    if status:
        filter_query["status"] = {"$in": status}
    
    if job_id:
        try:
            job_object_id = InputSanitizer.validate_object_id(job_id)
            filter_query["job_id"] = job_object_id
        except SecurityError as e:
            raise HTTPException(status_code=400, detail=str(e))
    
    if has_evaluation is not None:
        if has_evaluation:
            filter_query["ai_evaluation"] = {"$exists": True, "$ne": None}
        else:
            filter_query["ai_evaluation"] = {"$exists": False}
    
    if has_recruiter_review is not None:
        if has_recruiter_review:
            filter_query["recruiter_review"] = {"$exists": True, "$ne": None}
        else:
            filter_query["recruiter_review"] = {"$exists": False}
    
    if min_score is not None or max_score is not None:
        score_filter = {}
        if min_score is not None:
            score_filter["$gte"] = min_score
        if max_score is not None:
            score_filter["$lte"] = max_score
        filter_query["ai_evaluation.overall_score"] = score_filter
    
    # Get total count
    total = await db.task_submissions.count_documents(filter_query)
    
    # Calculate pagination
    skip = (page - 1) * per_page
    total_pages = math.ceil(total / per_page)
    
    # Get applications with pagination
    applications_cursor = db.task_submissions.find(filter_query).skip(skip).limit(per_page).sort("created_at", -1)
    applications = await applications_cursor.to_list(length=per_page)
    
    # Fetch job details for each application
    job_ids = [app["job_id"] for app in applications]
    jobs = await db.jobs.find({"_id": {"$in": job_ids}}).to_list(length=None)
    jobs_dict = {str(job["_id"]): job for job in jobs}
    
    # Format applications with job details
    formatted_applications = []
    for app in applications:
        job_id = str(app["job_id"])
        job_details = jobs_dict.get(job_id)
        
        # Calculate completion percentage
        completion_percentage = 0
        if app["status"] == "submitted":
            completion_percentage = 100
        elif app["status"] == "in_progress":
            # Calculate based on time spent vs expected time
            expected_time = job_details.get("task", {}).get("time_limit", 120) if job_details else 120
            completion_percentage = min(100, (app.get("time_spent", 0) / expected_time) * 100)
        
        formatted_app = {
            "_id": str(app["_id"]),
            "job_id": job_id,
            "student_id": str(app["candidate_id"]),
            "status": app["status"],
            "enrolled_at": app["started_at"].isoformat(),
            "submission_id": str(app["_id"]),
            "progress": {
                "time_spent": app.get("time_spent", 0),
                "last_activity": app["updated_at"].isoformat(),
                "completion_percentage": completion_percentage
            },
            "created_at": app["created_at"].isoformat(),
            "updated_at": app["updated_at"].isoformat()
        }
        
        # Add job details if available
        if job_details:
            formatted_app["job"] = {
                "title": job_details["title"],
                "description": job_details["description"],
                "task": job_details["task"],
                "closing_date": job_details.get("closing_date").isoformat() if job_details.get("closing_date") else None
            }
        
        # Add evaluation if available
        if app.get("ai_evaluation"):
            formatted_app["evaluation"] = {
                "ai_score": app["ai_evaluation"]["overall_score"],
                "criteria_scores": app["ai_evaluation"]["criteria_scores"],
                "feedback": app["ai_evaluation"]["feedback"],
                "evaluated_at": app["ai_evaluation"]["evaluated_at"].isoformat()
            }
        
        # Add recruiter review if available
        if app.get("recruiter_review"):
            formatted_app["recruiter_review"] = {
                "decision": app["recruiter_review"]["decision"],
                "rating": app["recruiter_review"]["rating"],
                "notes": app["recruiter_review"]["notes"],
                "reviewed_at": app["recruiter_review"]["reviewed_at"].isoformat()
            }
        
        formatted_applications.append(formatted_app)
    
    # Calculate summary statistics
    summary = await calculate_application_summary(db, ObjectId(current_user["_id"]))
    
    return {
        "applications": formatted_applications,
        "summary": summary,
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": total_pages
    }

@router.get("/applications/summary", response_model=StudentApplicationSummary)
async def get_application_summary(
    current_user: dict = Depends(require_student())
):
    """Get summary statistics for student's applications."""
    db = get_database()
    
    if current_user.get("role") != UserRole.STUDENT:
        raise HTTPException(status_code=403, detail="Only students can access application summary")
    
    summary = await calculate_application_summary(db, ObjectId(current_user["_id"]))
    return summary

@router.get("/applications/recent", response_model=List[StudentApplicationResponse])
async def get_recent_applications(
    limit: int = Query(5, ge=1, le=20, description="Number of recent applications to return"),
    current_user: dict = Depends(require_student())
):
    """Get recent applications for the student."""
    db = get_database()
    
    if current_user.get("role") != UserRole.STUDENT:
        raise HTTPException(status_code=403, detail="Only students can access applications")
    
    # Get recent applications
    applications = await db.task_submissions.find(
        {"candidate_id": ObjectId(current_user["_id"])}
    ).sort("created_at", -1).limit(limit).to_list(length=limit)
    
    # Fetch job details
    job_ids = [app["job_id"] for app in applications]
    jobs = await db.jobs.find({"_id": {"$in": job_ids}}).to_list(length=None)
    jobs_dict = {str(job["_id"]): job for job in jobs}
    
    # Format applications
    formatted_applications = []
    for app in applications:
        job_id = str(app["job_id"])
        job_details = jobs_dict.get(job_id)
        
        completion_percentage = 0
        if app["status"] == "submitted":
            completion_percentage = 100
        elif app["status"] == "in_progress":
            expected_time = job_details.get("task", {}).get("time_limit", 120) if job_details else 120
            completion_percentage = min(100, (app.get("time_spent", 0) / expected_time) * 100)
        
        formatted_app = {
            "_id": str(app["_id"]),
            "job_id": job_id,
            "student_id": str(app["candidate_id"]),
            "status": app["status"],
            "enrolled_at": app["started_at"].isoformat(),
            "submission_id": str(app["_id"]),
            "progress": {
                "time_spent": app.get("time_spent", 0),
                "last_activity": app["updated_at"].isoformat(),
                "completion_percentage": completion_percentage
            },
            "created_at": app["created_at"].isoformat(),
            "updated_at": app["updated_at"].isoformat()
        }
        
        if job_details:
            formatted_app["job"] = {
                "title": job_details["title"],
                "description": job_details["description"],
                "task": job_details["task"],
                "closing_date": job_details.get("closing_date").isoformat() if job_details.get("closing_date") else None
            }
        
        formatted_applications.append(formatted_app)
    
    return formatted_applications

@router.get("/applications/by-job/{job_id}")
async def get_application_by_job(
    job_id: str = Path(..., description="Job ID"),
    current_user: dict = Depends(require_student())
):
    """Get student's application for a specific job."""
    db = get_database()
    
    if current_user.get("role") != UserRole.STUDENT:
        raise HTTPException(status_code=403, detail="Only students can access applications")
    
    try:
        job_object_id = InputSanitizer.validate_object_id(job_id)
    except SecurityError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    application = await db.task_submissions.find_one({
        "job_id": job_object_id,
        "candidate_id": ObjectId(current_user["_id"])
    })
    
    if not application:
        return {"application": None}
    
    # Get job details
    job_details = await db.jobs.find_one({"_id": job_object_id})
    
    # Calculate completion percentage
    completion_percentage = 0
    if application["status"] == "submitted":
        completion_percentage = 100
    elif application["status"] == "in_progress":
        expected_time = job_details.get("task", {}).get("time_limit", 120) if job_details else 120
        completion_percentage = min(100, (application.get("time_spent", 0) / expected_time) * 100)
    
    formatted_app = {
        "_id": str(application["_id"]),
        "job_id": job_id,
        "student_id": str(application["candidate_id"]),
        "status": application["status"],
        "enrolled_at": application["started_at"].isoformat(),
        "submission_id": str(application["_id"]),
        "progress": {
            "time_spent": application.get("time_spent", 0),
            "last_activity": application["updated_at"].isoformat(),
            "completion_percentage": completion_percentage
        },
        "created_at": application["created_at"].isoformat(),
        "updated_at": application["updated_at"].isoformat()
    }
    
    if job_details:
        formatted_app["job"] = {
            "title": job_details["title"],
            "description": job_details["description"],
            "task": job_details["task"],
            "closing_date": job_details.get("closing_date").isoformat() if job_details.get("closing_date") else None
        }
    
    return {"application": formatted_app}

@router.patch("/applications/{application_id}/progress", response_model=StudentApplicationResponse)
async def update_application_progress(
    application_id: str = Path(..., description="Application ID"),
    progress_update: ApplicationProgressUpdate = Body(...),
    current_user: dict = Depends(require_student())
):
    """Update progress for a student's application."""
    db = get_database()
    
    if current_user.get("role") != UserRole.STUDENT:
        raise HTTPException(status_code=403, detail="Only students can update their applications")
    
    try:
        app_object_id = InputSanitizer.validate_object_id(application_id)
    except SecurityError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    # Find the application and verify ownership
    application = await db.task_submissions.find_one({
        "_id": app_object_id,
        "candidate_id": ObjectId(current_user["_id"])
    })
    
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    # Only allow progress updates for in-progress applications
    if application["status"] != "in_progress":
        raise HTTPException(status_code=400, detail="Can only update progress for in-progress applications")
    
    # Update the application
    update_data = {
        "time_spent": progress_update.time_spent,
        "updated_at": datetime.now()
    }
    
    await db.task_submissions.update_one(
        {"_id": app_object_id},
        {"$set": update_data}
    )
    
    # Get updated application
    updated_app = await db.task_submissions.find_one({"_id": app_object_id})
    job_details = await db.jobs.find_one({"_id": updated_app["job_id"]})
    
    # Calculate completion percentage
    expected_time = job_details.get("task", {}).get("time_limit", 120) if job_details else 120
    completion_percentage = min(100, (updated_app.get("time_spent", 0) / expected_time) * 100)
    
    formatted_app = {
        "_id": str(updated_app["_id"]),
        "job_id": str(updated_app["job_id"]),
        "student_id": str(updated_app["candidate_id"]),
        "status": updated_app["status"],
        "enrolled_at": updated_app["started_at"].isoformat(),
        "submission_id": str(updated_app["_id"]),
        "progress": {
            "time_spent": updated_app.get("time_spent", 0),
            "last_activity": updated_app["updated_at"].isoformat(),
            "completion_percentage": completion_percentage
        },
        "created_at": updated_app["created_at"].isoformat(),
        "updated_at": updated_app["updated_at"].isoformat()
    }
    
    if job_details:
        formatted_app["job"] = {
            "title": job_details["title"],
            "description": job_details["description"],
            "task": job_details["task"],
            "closing_date": job_details.get("closing_date").isoformat() if job_details.get("closing_date") else None
        }
    
    return formatted_app

@router.delete("/applications/{application_id}", status_code=status.HTTP_204_NO_CONTENT)
@audit_action("STUDENT_APPLICATION_WITHDRAW", "application")
async def withdraw_application(
    request: Request,
    application_id: str = Path(..., description="Application ID"),
    current_user: dict = Depends(require_student())
):
    """Withdraw/cancel a student's application."""
    db = get_database()
    ip_address = await get_client_ip(request)
    
    if current_user.get("role") != UserRole.STUDENT:
        raise HTTPException(status_code=403, detail="Only students can withdraw their applications")
    
    try:
        app_object_id = InputSanitizer.validate_object_id(application_id)
    except SecurityError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    # Find the application and verify ownership
    application = await db.task_submissions.find_one({
        "_id": app_object_id,
        "candidate_id": ObjectId(current_user["_id"])
    })
    
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    # Verify ownership using data isolation
    StudentDataIsolation.ensure_student_owns_resource(
        current_user,
        application,
        resource_id_field="candidate_id"
    )
    
    # Only allow withdrawal for applications that haven't been submitted
    if application["status"] in ["submitted", "evaluated", "reviewed", "shortlisted"]:
        raise HTTPException(status_code=400, detail="Cannot withdraw application that has been submitted")
    
    # Delete the application
    await db.task_submissions.delete_one({"_id": app_object_id})
    
    # Update job application count
    await db.jobs.update_one(
        {"_id": application["job_id"]},
        {"$inc": {"application_count": -1}}
    )
    
    # Log withdrawal action
    AuditLogger.log_action(
        user_id=str(current_user["_id"]),
        action="STUDENT_APPLICATION_WITHDRAW",
        resource_type="application",
        resource_id=application_id,
        details={
            "job_id": str(application.get("job_id")),
            "status": application.get("status")
        },
        ip_address=ip_address
    )

# Helper function to calculate application summary
async def calculate_application_summary(db, student_id: ObjectId) -> dict:
    """Calculate summary statistics for a student's applications."""
    
    # Get all applications for the student
    applications = await db.task_submissions.find(
        {"candidate_id": student_id}
    ).to_list(length=None)
    
    if not applications:
        return {
            "total": 0,
            "by_status": {},
            "completion_rate": 0.0,
            "average_score": 0.0,
            "recent_activity": {
                "applications": 0,
                "submissions": 0,
                "evaluations": 0
            }
        }
    
    # Calculate statistics
    total = len(applications)
    by_status = {}
    scores = []
    completed_count = 0
    
    # Count recent activity (last 7 days)
    recent_date = datetime.now() - timedelta(days=7)
    recent_applications = 0
    recent_submissions = 0
    recent_evaluations = 0
    
    for app in applications:
        # Status counts
        status = app["status"]
        by_status[status] = by_status.get(status, 0) + 1
        
        # Completion tracking
        if status in ["submitted", "evaluated", "reviewed", "shortlisted", "completed"]:
            completed_count += 1
        
        # Score tracking
        if app.get("ai_evaluation") and app["ai_evaluation"].get("overall_score"):
            scores.append(app["ai_evaluation"]["overall_score"])
        
        # Recent activity
        if app["created_at"] >= recent_date:
            recent_applications += 1
        
        if app.get("submitted_at") and app["submitted_at"] >= recent_date:
            recent_submissions += 1
        
        if (app.get("ai_evaluation") and 
            app["ai_evaluation"].get("evaluated_at") and 
            app["ai_evaluation"]["evaluated_at"] >= recent_date):
            recent_evaluations += 1
    
    completion_rate = (completed_count / total) * 100 if total > 0 else 0.0
    average_score = sum(scores) / len(scores) if scores else 0.0
    
    return {
        "total": total,
        "by_status": by_status,
        "completion_rate": completion_rate,
        "average_score": average_score,
        "recent_activity": {
            "applications": recent_applications,
            "submissions": recent_submissions,
            "evaluations": recent_evaluations
        }
    }
@r
outer.get("/analytics", response_model=dict)
@audit_action("STUDENT_ANALYTICS_VIEW", "analytics")
async def get_student_analytics(
    request: Request,
    time_range: str = Query("month", description="Time range for analytics"),
    categories: Optional[List[str]] = Query(None, description="Filter by categories"),
    include_comparisons: bool = Query(True, description="Include peer comparisons"),
    include_predictions: bool = Query(False, description="Include performance predictions"),
    current_user: dict = Depends(require_student())
):
    """Get comprehensive analytics data for a student."""
    db = get_database()
    
    # Only students can view their own analytics
    if current_user.get("role") != UserRole.STUDENT:
        raise HTTPException(status_code=403, detail="Only students can view analytics")
    
    student_id = ObjectId(current_user["_id"])
    
    # Calculate date range
    now = datetime.utcnow()
    if time_range == "week":
        start_date = now - timedelta(days=7)
    elif time_range == "month":
        start_date = now - timedelta(days=30)
    elif time_range == "quarter":
        start_date = now - timedelta(days=90)
    elif time_range == "year":
        start_date = now - timedelta(days=365)
    else:
        start_date = datetime(2020, 1, 1)  # All time
    
    # Get student's task submissions
    submission_query = {
        "candidate_id": student_id,
        "created_at": {"$gte": start_date}
    }
    
    if categories:
        # Filter by job categories (would need to join with jobs collection)
        pass
    
    submissions = await db.task_submissions.find(submission_query).to_list(None)
    
    # Calculate performance metrics
    total_submissions = len(submissions)
    completed_submissions = [s for s in submissions if s.get("status") in ["evaluated", "reviewed", "shortlisted"]]
    completion_rate = len(completed_submissions) / max(total_submissions, 1)
    
    # Calculate average score
    scored_submissions = [s for s in submissions if s.get("ai_evaluation", {}).get("overall_score")]
    average_score = sum(s["ai_evaluation"]["overall_score"] for s in scored_submissions) / max(len(scored_submissions), 1) if scored_submissions else 0
    
    # Generate score trend data
    score_trend = []
    for i in range(7):  # Last 7 data points
        date = now - timedelta(days=i*7)
        week_submissions = [s for s in scored_submissions if datetime.fromisoformat(s["created_at"].replace('Z', '+00:00')) >= date - timedelta(days=7) and datetime.fromisoformat(s["created_at"].replace('Z', '+00:00')) < date]
        avg_score = sum(s["ai_evaluation"]["overall_score"] for s in week_submissions) / max(len(week_submissions), 1) if week_submissions else 0
        score_trend.append({
            "date": date.strftime("%Y-%m-%d"),
            "value": avg_score
        })
    
    score_trend.reverse()
    
    # Calculate activity metrics
    total_time_spent = sum(s.get("time_spent", 0) for s in submissions)
    
    # Calculate streak (simplified)
    streak_days = 0
    current_date = now.date()
    for i in range(30):  # Check last 30 days
        check_date = current_date - timedelta(days=i)
        day_submissions = [s for s in submissions if datetime.fromisoformat(s["created_at"].replace('Z', '+00:00')).date() == check_date]
        if day_submissions:
            streak_days = i + 1
        else:
            break
    
    # Generate weekly activity data
    weekly_activity = []
    for i in range(7):
        date = now - timedelta(days=i)
        day_submissions = [s for s in submissions if datetime.fromisoformat(s["created_at"].replace('Z', '+00:00')).date() == date.date()]
        weekly_activity.append({
            "date": date.strftime("%Y-%m-%d"),
            "value": len(day_submissions)
        })
    
    weekly_activity.reverse()
    
    # Calculate ranking (simplified - would need more complex logic in production)
    all_students_count = await db.users.count_documents({"role": UserRole.STUDENT})
    estimated_rank = max(1, int(all_students_count * (1 - completion_rate * 0.5 - (average_score / 100) * 0.5)))
    percentile = max(0, min(100, int((1 - estimated_rank / all_students_count) * 100)))
    
    # Generate insights
    strengths = []
    improvement_areas = []
    recommendations = []
    
    if average_score >= 80:
        strengths.append("Consistently high-quality submissions")
    if completion_rate >= 0.8:
        strengths.append("Excellent task completion rate")
    if streak_days >= 7:
        strengths.append("Strong consistency and dedication")
    
    if average_score < 70:
        improvement_areas.append("Focus on submission quality")
        recommendations.append("Review feedback from previous submissions")
    if completion_rate < 0.6:
        improvement_areas.append("Task completion consistency")
        recommendations.append("Set daily goals for task progress")
    if total_time_spent / max(total_submissions, 1) > 300:  # More than 5 hours per task
        improvement_areas.append("Time management efficiency")
        recommendations.append("Practice time-boxed development")
    
    return {
        "performance": {
            "completion_rate": completion_rate,
            "average_score": average_score,
            "score_trend": score_trend,
            "skill_progression": [],  # Would be calculated from detailed evaluation data
            "category_performance": []  # Would be calculated by joining with job categories
        },
        "activity": {
            "tasks_completed": total_submissions,
            "total_time_spent": total_time_spent,
            "streak_days": streak_days,
            "last_activity": submissions[0]["created_at"] if submissions else now.isoformat(),
            "weekly_activity": weekly_activity,
            "monthly_activity": []  # Could be calculated similarly
        },
        "ranking": {
            "overall_rank": estimated_rank,
            "category_ranks": {},
            "percentile": percentile,
            "total_students": all_students_count,
            "rank_change": 0  # Would need historical data
        },
        "insights": {
            "strengths": strengths,
            "improvement_areas": improvement_areas,
            "recommendations": recommendations,
            "next_milestones": []
        },
        "goals": {
            "current_goals": [],
            "suggested_goals": [
                {
                    "title": "Improve Average Score",
                    "description": "Reach an average score of 85+",
                    "target_value": 85,
                    "timeframe": "30 days"
                },
                {
                    "title": "Complete More Tasks",
                    "description": "Complete 5 more tasks this month",
                    "target_value": total_submissions + 5,
                    "timeframe": "30 days"
                }
            ]
        }
    }

@router.get("/analytics/skills", response_model=dict)
@audit_action("STUDENT_SKILLS_VIEW", "analytics")
async def get_student_skill_progression(
    request: Request,
    current_user: dict = Depends(require_student())
):
    """Get detailed skill progression data for a student."""
    db = get_database()
    
    if current_user.get("role") != UserRole.STUDENT:
        raise HTTPException(status_code=403, detail="Only students can view skill progression")
    
    student_id = ObjectId(current_user["_id"])
    
    # Get submissions with AI evaluations
    submissions = await db.task_submissions.find({
        "candidate_id": student_id,
        "ai_evaluation": {"$exists": True}
    }).to_list(None)
    
    # Calculate skill progression (simplified)
    skills_data = []
    skill_categories = {
        "Technical Skills": ["technical_skills"],
        "Problem Solving": ["problem_solving"],
        "Communication": ["communication"],
        "Creativity": ["creativity"],
        "Critical Thinking": ["critical_thinking"],
        "Attention to Detail": ["attention_to_detail"]
    }
    
    for skill_name, criteria_keys in skill_categories.items():
        scores = []
        for submission in submissions:
            criteria_scores = submission.get("ai_evaluation", {}).get("criteria_scores", {})
            skill_scores = [criteria_scores.get(key, 0) for key in criteria_keys if key in criteria_scores]
            if skill_scores:
                scores.append(sum(skill_scores) / len(skill_scores) * 10)  # Convert to 0-100 scale
        
        current_level = sum(scores) / len(scores) if scores else 0
        previous_level = sum(scores[:-3]) / len(scores[:-3]) if len(scores) > 3 else current_level * 0.8
        
        skills_data.append({
            "skill": skill_name,
            "category": "Core Skills",
            "current_level": current_level,
            "previous_level": previous_level,
            "improvement": current_level - previous_level,
            "tasks_completed": len(scores),
            "last_updated": datetime.utcnow().isoformat()
        })
    
    return {"skills": skills_data}

@router.get("/analytics/ranking", response_model=dict)
@audit_action("STUDENT_RANKING_VIEW", "analytics")
async def get_student_ranking(
    request: Request,
    current_user: dict = Depends(require_student())
):
    """Get student ranking and peer comparison data."""
    db = get_database()
    
    if current_user.get("role") != UserRole.STUDENT:
        raise HTTPException(status_code=403, detail="Only students can view ranking")
    
    student_id = ObjectId(current_user["_id"])
    
    # Get all students' performance data (simplified)
    all_students = await db.users.find({"role": UserRole.STUDENT}).to_list(None)
    total_students = len(all_students)
    
    # Calculate student's performance score (simplified)
    student_submissions = await db.task_submissions.find({"candidate_id": student_id}).to_list(None)
    student_score = 0
    
    if student_submissions:
        completed = [s for s in student_submissions if s.get("status") in ["evaluated", "reviewed"]]
        completion_rate = len(completed) / len(student_submissions)
        
        scored = [s for s in student_submissions if s.get("ai_evaluation", {}).get("overall_score")]
        avg_score = sum(s["ai_evaluation"]["overall_score"] for s in scored) / len(scored) if scored else 0
        
        student_score = completion_rate * 50 + (avg_score / 100) * 50
    
    # Estimate ranking (in production, this would be calculated more accurately)
    estimated_rank = max(1, int(total_students * (1 - student_score / 100)))
    percentile = max(0, min(100, int((1 - estimated_rank / total_students) * 100)))
    
    return {
        "overall_rank": estimated_rank,
        "category_ranks": {
            "Frontend": estimated_rank + 5,
            "Backend": estimated_rank - 2,
            "Mobile": estimated_rank + 10
        },
        "percentile": percentile,
        "total_students": total_students,
        "rank_change": 0  # Would need historical data
    }

@router.post("/analytics/goals", status_code=status.HTTP_201_CREATED)
@audit_action("STUDENT_GOAL_CREATE", "goal")
async def create_performance_goal(
    request: Request,
    goal_data: dict = Body(...),
    current_user: dict = Depends(require_student())
):
    """Create a new performance goal for the student."""
    db = get_database()
    
    if current_user.get("role") != UserRole.STUDENT:
        raise HTTPException(status_code=403, detail="Only students can create goals")
    
    # Sanitize input
    sanitized_data = InputSanitizer.sanitize_dict(goal_data)
    
    goal = {
        "student_id": ObjectId(current_user["_id"]),
        "title": sanitized_data.get("title"),
        "description": sanitized_data.get("description"),
        "target_value": sanitized_data.get("target_value"),
        "current_value": 0,
        "deadline": sanitized_data.get("deadline"),
        "category": sanitized_data.get("category"),
        "status": "active",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    result = await db.performance_goals.insert_one(goal)
    
    return {"message": "Goal created successfully", "goal_id": str(result.inserted_id)}
# Profile
 Management Endpoints

@router.get("/profile", response_model=StudentProfile)
@audit_action("STUDENT_PROFILE_VIEW", "profile")
async def get_student_profile(
    request: Request,
    current_user: dict = Depends(require_student())
):
    """Get the student's profile information."""
    db = get_database()
    
    # Only students can access their profile
    if current_user.get("role") != UserRole.STUDENT:
        raise HTTPException(status_code=403, detail="Only students can access profile")
    
    student_id = ObjectId(current_user["_id"])
    
    # Get or create student profile
    profile = await db.student_profiles.find_one({"user_id": student_id})
    
    if profile is None:
        # Create default profile
        default_profile = {
            "user_id": student_id,
            "personal_info": {
                "first_name": current_user.get("name", "").split(" ")[0] if current_user.get("name") else "",
                "last_name": " ".join(current_user.get("name", "").split(" ")[1:]) if current_user.get("name") and len(current_user.get("name", "").split(" ")) > 1 else "",
                "bio": "",
                "phone": "",
                "location": {}
            },
            "skills": {
                "technical_skills": [],
                "soft_skills": [],
                "certifications": [],
                "languages": []
            },
            "experience": {
                "level": "entry",
                "years_of_experience": 0,
                "previous_roles": [],
                "education": []
            },
            "preferences": {
                "job_types": [],
                "industries": [],
                "work_arrangement": "any",
                "salary_expectation": {},
                "availability": "immediate"
            },
            "portfolio": {
                "resume_url": "",
                "portfolio_url": "",
                "github_url": "",
                "linkedin_url": "",
                "website_url": ""
            },
            "notification_preferences": {
                "email_notifications": True,
                "push_notifications": True,
                "deadline_reminders": True,
                "evaluation_results": True,
                "recruiter_updates": True,
                "new_recommendations": True
            },
            "privacy_settings": {
                "profile_visibility": "recruiters",
                "show_performance_stats": True,
                "allow_recruiter_contact": True,
                "show_salary_expectations": False
            },
            "profile_completeness": 0.0,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        # Calculate initial completeness
        default_profile["profile_completeness"] = _calculate_profile_completeness(default_profile)
        
        result = await db.student_profiles.insert_one(default_profile)
        profile = await db.student_profiles.find_one({"_id": result.inserted_id})
    
    return profile

@router.put("/profile", response_model=StudentProfile)
@audit_action("STUDENT_PROFILE_UPDATE", "profile")
async def update_student_profile(
    request: Request,
    profile_update: StudentProfileUpdate = Body(...),
    current_user: dict = Depends(require_student())
):
    """Update the student's profile information."""
    db = get_database()
    
    # Only students can update their profile
    if current_user.get("role") != UserRole.STUDENT:
        raise HTTPException(status_code=403, detail="Only students can update profile")
    
    student_id = ObjectId(current_user["_id"])
    
    # Get existing profile
    existing_profile = await db.student_profiles.find_one({"user_id": student_id})
    
    if existing_profile is None:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    # Verify profile ownership
    if str(existing_profile.get("user_id")) != str(current_user["_id"]):
        raise HTTPException(status_code=403, detail="Access denied. You can only update your own profile.")
    
    # Sanitize and prepare update data
    update_data = {}
    ip_address = await get_client_ip(request)
    
    try:
        if profile_update.personal_info:
            personal_dict = profile_update.personal_info.model_dump(exclude_none=True)
            sanitized_personal = {}
            for key, value in personal_dict.items():
                if isinstance(value, str):
                    sanitized_personal[key] = InputSanitizer.sanitize_string(value, max_length=500)
                else:
                    sanitized_personal[key] = value
            update_data["personal_info"] = {**existing_profile.get("personal_info", {}), **sanitized_personal}
        
        if profile_update.skills:
            skills_dict = profile_update.skills.model_dump(exclude_none=True)
            sanitized_skills = {}
            for key, value in skills_dict.items():
                if isinstance(value, str):
                    sanitized_skills[key] = InputSanitizer.sanitize_string(value, max_length=200)
                elif isinstance(value, list):
                    sanitized_skills[key] = [
                        InputSanitizer.sanitize_string(item, max_length=100) if isinstance(item, str) else item
                        for item in value[:50]  # Limit to 50 items
                    ]
                else:
                    sanitized_skills[key] = value
            update_data["skills"] = {**existing_profile.get("skills", {}), **sanitized_skills}
        
        if profile_update.experience:
            experience_dict = profile_update.experience.model_dump(exclude_none=True)
            sanitized_experience = {}
            for key, value in experience_dict.items():
                if isinstance(value, str):
                    sanitized_experience[key] = InputSanitizer.sanitize_string(value, max_length=1000)
                elif isinstance(value, list):
                    sanitized_experience[key] = [
                        InputSanitizer.sanitize_json(item) if isinstance(item, dict) else item
                        for item in value[:20]  # Limit to 20 items
                    ]
                else:
                    sanitized_experience[key] = value
            update_data["experience"] = {**existing_profile.get("experience", {}), **sanitized_experience}
        
        if profile_update.preferences:
            preferences_dict = profile_update.preferences.model_dump(exclude_none=True)
            sanitized_preferences = {}
            for key, value in preferences_dict.items():
                if isinstance(value, str):
                    sanitized_preferences[key] = InputSanitizer.sanitize_string(value, max_length=200)
                else:
                    sanitized_preferences[key] = value
            update_data["preferences"] = {**existing_profile.get("preferences", {}), **sanitized_preferences}
        
        if profile_update.portfolio:
            portfolio_dict = profile_update.portfolio.model_dump(exclude_none=True)
            sanitized_portfolio = {}
            for key, value in portfolio_dict.items():
                if isinstance(value, str):
                    # URLs need special handling
                    if 'url' in key.lower():
                        sanitized_portfolio[key] = InputSanitizer.sanitize_string(value, max_length=500)
                    else:
                        sanitized_portfolio[key] = InputSanitizer.sanitize_string(value, max_length=1000)
                elif isinstance(value, list):
                    sanitized_portfolio[key] = [
                        InputSanitizer.sanitize_string(item, max_length=500) if isinstance(item, str) else item
                        for item in value[:20]  # Limit to 20 items
                    ]
                else:
                    sanitized_portfolio[key] = value
            update_data["portfolio"] = {**existing_profile.get("portfolio", {}), **sanitized_portfolio}
    except SecurityError as e:
        raise HTTPException(status_code=400, detail=f"Input validation failed: {str(e)}")
    
    if profile_update.notification_preferences:
        update_data["notification_preferences"] = profile_update.notification_preferences.model_dump()
    
    if profile_update.privacy_settings:
        update_data["privacy_settings"] = profile_update.privacy_settings.model_dump()
    
    # Update timestamp
    update_data["updated_at"] = datetime.utcnow()
    
    # Calculate new completeness score
    updated_profile = {**existing_profile, **update_data}
    update_data["profile_completeness"] = _calculate_profile_completeness(updated_profile)
    
    # Update the profile
    await db.student_profiles.update_one(
        {"user_id": student_id},
        {"$set": update_data}
    )
    
    # Log profile update
    AuditLogger.log_action(
        user_id=str(current_user["_id"]),
        action="STUDENT_PROFILE_UPDATE",
        resource_type="profile",
        resource_id=str(existing_profile.get("_id")),
        details={"updated_fields": list(update_data.keys())},
        ip_address=ip_address
    )
    
    # Return updated profile
    updated_profile = await db.student_profiles.find_one({"user_id": student_id})
    return updated_profile

@router.get("/profile/completeness", response_model=ProfileCompletenessAnalysis)
@audit_action("STUDENT_PROFILE_COMPLETENESS", "profile")
async def get_profile_completeness(
    request: Request,
    current_user: dict = Depends(require_student())
):
    """Get detailed profile completeness analysis and suggestions."""
    db = get_database()
    
    # Only students can access their profile completeness
    if current_user.get("role") != UserRole.STUDENT:
        raise HTTPException(status_code=403, detail="Only students can access profile completeness")
    
    student_id = ObjectId(current_user["_id"])
    
    # Get profile
    profile = await db.student_profiles.find_one({"user_id": student_id})
    
    if profile is None:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    # Calculate detailed completeness analysis
    analysis = _analyze_profile_completeness(profile)
    
    return analysis

def _calculate_profile_completeness(profile: dict) -> float:
    """Calculate profile completeness percentage."""
    total_weight = 0
    completed_weight = 0
    
    # Personal info (20% weight)
    personal_weight = 20
    personal_fields = ["first_name", "last_name", "bio", "phone"]
    personal_completed = sum(1 for field in personal_fields if profile.get("personal_info", {}).get(field))
    personal_score = (personal_completed / len(personal_fields)) * personal_weight
    
    # Location (5% weight)
    location_weight = 5
    location = profile.get("personal_info", {}).get("location", {})
    location_score = location_weight if location.get("city") and location.get("country") else 0
    
    # Skills (25% weight)
    skills_weight = 25
    skills = profile.get("skills", {})
    skills_completed = 0
    if skills.get("technical_skills"): skills_completed += 1
    if skills.get("soft_skills"): skills_completed += 1
    if skills.get("certifications"): skills_completed += 1
    if skills.get("languages"): skills_completed += 1
    skills_score = (skills_completed / 4) * skills_weight
    
    # Experience (20% weight)
    experience_weight = 20
    experience = profile.get("experience", {})
    experience_completed = 0
    if experience.get("level"): experience_completed += 1
    if experience.get("years_of_experience") is not None: experience_completed += 1
    if experience.get("previous_roles"): experience_completed += 1
    if experience.get("education"): experience_completed += 1
    experience_score = (experience_completed / 4) * experience_weight
    
    # Preferences (15% weight)
    preferences_weight = 15
    preferences = profile.get("preferences", {})
    preferences_completed = 0
    if preferences.get("job_types"): preferences_completed += 1
    if preferences.get("industries"): preferences_completed += 1
    if preferences.get("work_arrangement"): preferences_completed += 1
    if preferences.get("salary_expectation"): preferences_completed += 1
    preferences_score = (preferences_completed / 4) * preferences_weight
    
    # Portfolio (15% weight)
    portfolio_weight = 15
    portfolio = profile.get("portfolio", {})
    portfolio_completed = sum(1 for url in portfolio.values() if url)
    portfolio_score = min((portfolio_completed / 3) * portfolio_weight, portfolio_weight)  # At least 3 URLs for full score
    
    total_score = personal_score + location_score + skills_score + experience_score + preferences_score + portfolio_score
    
    return round(total_score, 1)

def _analyze_profile_completeness(profile: dict) -> dict:
    """Analyze profile completeness and provide suggestions."""
    overall_score = _calculate_profile_completeness(profile)
    
    # Calculate section scores
    section_scores = {}
    missing_fields = []
    suggestions = []
    
    # Personal info analysis
    personal_info = profile.get("personal_info", {})
    personal_completed = 0
    personal_total = 5  # first_name, last_name, bio, phone, location
    
    if personal_info.get("first_name"): personal_completed += 1
    else: 
        missing_fields.append("first_name")
        suggestions.append("Add your first name to personalize your profile")
    
    if personal_info.get("last_name"): personal_completed += 1
    else: 
        missing_fields.append("last_name")
        suggestions.append("Add your last name for professional identification")
    
    if personal_info.get("bio"): personal_completed += 1
    else: 
        missing_fields.append("bio")
        suggestions.append("Write a compelling bio to introduce yourself to recruiters")
    
    if personal_info.get("phone"): personal_completed += 1
    else: 
        missing_fields.append("phone")
        suggestions.append("Add your phone number for direct recruiter contact")
    
    location = personal_info.get("location", {})
    if location.get("city") and location.get("country"): personal_completed += 1
    else: 
        missing_fields.append("location")
        suggestions.append("Add your location to help recruiters find local opportunities")
    
    section_scores["personal_info"] = (personal_completed / personal_total) * 100
    
    # Skills analysis
    skills = profile.get("skills", {})
    skills_completed = 0
    skills_total = 4
    
    if skills.get("technical_skills"): skills_completed += 1
    else: 
        missing_fields.append("technical_skills")
        suggestions.append("List your technical skills to match with relevant jobs")
    
    if skills.get("soft_skills"): skills_completed += 1
    else: 
        missing_fields.append("soft_skills")
        suggestions.append("Add soft skills to showcase your interpersonal abilities")
    
    if skills.get("certifications"): skills_completed += 1
    else: 
        missing_fields.append("certifications")
        suggestions.append("Include certifications to validate your expertise")
    
    if skills.get("languages"): skills_completed += 1
    else: 
        missing_fields.append("languages")
        suggestions.append("Add language proficiencies for international opportunities")
    
    section_scores["skills"] = (skills_completed / skills_total) * 100
    
    # Experience analysis
    experience = profile.get("experience", {})
    experience_completed = 0
    experience_total = 4
    
    if experience.get("level"): experience_completed += 1
    else: 
        missing_fields.append("experience_level")
        suggestions.append("Set your experience level to get appropriate job matches")
    
    if experience.get("years_of_experience") is not None: experience_completed += 1
    else: 
        missing_fields.append("years_of_experience")
        suggestions.append("Specify your years of experience")
    
    if experience.get("previous_roles"): experience_completed += 1
    else: 
        missing_fields.append("previous_roles")
        suggestions.append("List your previous roles to show career progression")
    
    if experience.get("education"): experience_completed += 1
    else: 
        missing_fields.append("education")
        suggestions.append("Add your educational background")
    
    section_scores["experience"] = (experience_completed / experience_total) * 100
    
    # Preferences analysis
    preferences = profile.get("preferences", {})
    preferences_completed = 0
    preferences_total = 4
    
    if preferences.get("job_types"): preferences_completed += 1
    else: 
        missing_fields.append("job_types")
        suggestions.append("Select preferred job types for better recommendations")
    
    if preferences.get("industries"): preferences_completed += 1
    else: 
        missing_fields.append("industries")
        suggestions.append("Choose preferred industries to focus your job search")
    
    if preferences.get("work_arrangement"): preferences_completed += 1
    else: 
        missing_fields.append("work_arrangement")
        suggestions.append("Set your work arrangement preference (remote, onsite, hybrid)")
    
    if preferences.get("salary_expectation"): preferences_completed += 1
    else: 
        missing_fields.append("salary_expectation")
        suggestions.append("Add salary expectations to help recruiters match your requirements")
    
    section_scores["preferences"] = (preferences_completed / preferences_total) * 100
    
    # Portfolio analysis
    portfolio = profile.get("portfolio", {})
    portfolio_completed = sum(1 for url in portfolio.values() if url)
    portfolio_total = 5
    
    if not portfolio.get("resume_url"): 
        missing_fields.append("resume_url")
        suggestions.append("Upload your resume for recruiter review")
    
    if not portfolio.get("portfolio_url"): 
        missing_fields.append("portfolio_url")
        suggestions.append("Add a portfolio URL to showcase your work")
    
    if not portfolio.get("github_url"): 
        missing_fields.append("github_url")
        suggestions.append("Link your GitHub profile to show your code")
    
    if not portfolio.get("linkedin_url"): 
        missing_fields.append("linkedin_url")
        suggestions.append("Connect your LinkedIn profile for professional networking")
    
    section_scores["portfolio"] = (portfolio_completed / portfolio_total) * 100
    
    return {
        "overall_score": overall_score,
        "section_scores": section_scores,
        "missing_fields": missing_fields[:10],  # Limit to top 10 suggestions
        "suggestions": suggestions[:10]
    }
@rou
ter.get("/submissions", response_model=List[StudentSubmissionResponse])
@audit_action("STUDENT_SUBMISSIONS_VIEW", "submissions")
async def get_student_submissions(
    request: Request,
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(20, ge=1, le=100, description="Items per page"),
    status: Optional[List[str]] = Query(None, description="Filter by status"),
    job_id: Optional[str] = Query(None, description="Filter by job ID"),
    date_from: Optional[datetime] = Query(None, description="Filter submissions from date"),
    date_to: Optional[datetime] = Query(None, description="Filter submissions to date"),
    has_evaluation: Optional[bool] = Query(None, description="Filter by evaluation presence"),
    has_recruiter_review: Optional[bool] = Query(None, description="Filter by recruiter review presence"),
    min_score: Optional[float] = Query(None, ge=0, le=100, description="Minimum AI score"),
    max_score: Optional[float] = Query(None, ge=0, le=100, description="Maximum AI score"),
    sort_by: str = Query("created_at", descr