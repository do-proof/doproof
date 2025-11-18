from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Body, Depends, HTTPException, status, Path, Query, Request
from bson import ObjectId
import math

from app.core.auth import get_current_user, require_recruiter, require_authenticated
from app.core.database import get_database
from app.core.security import (
    InputSanitizer, AuditLogger, CompanyIsolation, 
    audit_action, get_client_ip, SecurityError
)
from app.models.job import JobModel, JobStatus
from app.models.user import UserRole
from app.schemas.job_schemas import (
    JobCreate, JobUpdate, JobResponse, JobListResponse, JobFilters,
    StudentJobBrowseResponse, StudentJobFilters, JobWithRecommendation
)

router = APIRouter(tags=["jobs"], prefix="/jobs")

@router.get("", response_model=JobListResponse)
async def get_jobs(
    request: Request,
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(10, ge=1, le=100, description="Items per page"),
    status: Optional[JobStatus] = Query(None, description="Filter by job status"),
    employment_type: Optional[str] = Query(None, description="Filter by employment type"),
    location_type: Optional[str] = Query(None, description="Filter by location type"),
    city: Optional[str] = Query(None, description="Filter by city"),
    country: Optional[str] = Query(None, description="Filter by country"),
    min_salary: Optional[int] = Query(None, description="Minimum salary filter"),
    max_salary: Optional[int] = Query(None, description="Maximum salary filter"),
    search: Optional[str] = Query(None, description="Search in title and description"),
    current_user: dict = Depends(require_recruiter)
):
    """
    Get jobs with filtering and pagination.
    Only returns jobs for the current recruiter with proper data isolation.
    """
    db = get_database()
    
    # Sanitize search input if provided
    if search:
        try:
            search = InputSanitizer.sanitize_string(search, max_length=100)
        except SecurityError as e:
            raise HTTPException(status_code=400, detail=str(e))
    
    # Sanitize string filters
    if city:
        try:
            city = InputSanitizer.sanitize_string(city, max_length=50)
        except SecurityError as e:
            raise HTTPException(status_code=400, detail=str(e))
    
    if country:
        try:
            country = InputSanitizer.sanitize_string(country, max_length=50)
        except SecurityError as e:
            raise HTTPException(status_code=400, detail=str(e))
    
    # Apply data isolation filter
    filter_query = CompanyIsolation.get_isolation_filter(current_user)
    
    if status:
        filter_query["status"] = status
    if employment_type:
        filter_query["employment_type"] = employment_type
    if location_type:
        filter_query["location.type"] = location_type
    if city:
        filter_query["location.city"] = {"$regex": city, "$options": "i"}
    if country:
        filter_query["location.country"] = {"$regex": country, "$options": "i"}
    if min_salary or max_salary:
        salary_filter = {}
        if min_salary:
            salary_filter["$gte"] = min_salary
        if max_salary:
            salary_filter["$lte"] = max_salary
        filter_query["salary.min"] = salary_filter
    if search:
        filter_query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}}
        ]
    
    # Get total count
    total = await db.jobs.count_documents(filter_query)
    
    # Calculate pagination
    skip = (page - 1) * per_page
    total_pages = math.ceil(total / per_page)
    
    # Get jobs with pagination
    jobs_cursor = db.jobs.find(filter_query).skip(skip).limit(per_page).sort("created_at", -1)
    jobs = await jobs_cursor.to_list(length=per_page)
    
    return JobListResponse(
        jobs=jobs,
        total=total,
        page=page,
        per_page=per_page,
        total_pages=total_pages
    )

@router.get("/{job_id}", response_model=JobResponse)
async def get_job(
    request: Request,
    job_id: str = Path(..., description="Job ID"),
    current_user: dict = Depends(require_recruiter)
):
    """Get a specific job by ID with security validation."""
    db = get_database()
    
    # Validate and sanitize job ID
    try:
        job_object_id = InputSanitizer.validate_object_id(job_id)
    except SecurityError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    # Apply data isolation filter
    isolation_filter = CompanyIsolation.get_isolation_filter(current_user)
    isolation_filter["_id"] = job_object_id
    
    job = await db.jobs.find_one(isolation_filter)
    
    if job is None:
        # Log unauthorized access attempt
        ip_address = await get_client_ip(request)
        AuditLogger.log_action(
            user_id=str(current_user["_id"]),
            action="UNAUTHORIZED_JOB_ACCESS_ATTEMPT",
            resource_type="job",
            resource_id=job_id,
            ip_address=ip_address
        )
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Increment view count
    await db.jobs.update_one(
        {"_id": ObjectId(job_id)},
        {"$inc": {"view_count": 1}}
    )
    
    return job

@router.post("", response_model=JobResponse, status_code=status.HTTP_201_CREATED)
@audit_action("CREATE_JOB", "job")
async def create_job(
    request: Request,
    job: JobCreate = Body(...),
    current_user: dict = Depends(require_recruiter)
):
    """Create a new job posting with task definition validation and input sanitization."""
    db = get_database()
    
    # Sanitize job input data
    try:
        job_dict = job.dict(by_alias=True)
        
        # Sanitize text fields
        job_dict["title"] = InputSanitizer.sanitize_string(job_dict["title"], max_length=200)
        job_dict["description"] = InputSanitizer.sanitize_string(job_dict["description"], max_length=5000)
        
        # Sanitize task fields
        if "task" in job_dict:
            task = job_dict["task"]
            task["title"] = InputSanitizer.sanitize_string(task["title"], max_length=200)
            task["description"] = InputSanitizer.sanitize_string(task["description"], max_length=2000)
            task["instructions"] = InputSanitizer.sanitize_string(task["instructions"], max_length=2000)
        
        # Sanitize location fields
        if "location" in job_dict and job_dict["location"]:
            location = job_dict["location"]
            if "city" in location and location["city"]:
                location["city"] = InputSanitizer.sanitize_string(location["city"], max_length=100)
            if "country" in location and location["country"]:
                location["country"] = InputSanitizer.sanitize_string(location["country"], max_length=100)
        
        job_dict["recruiter_id"] = ObjectId(current_user["_id"])
        
    except SecurityError as e:
        raise HTTPException(status_code=400, detail=f"Input validation failed: {str(e)}")
    
    # Set company_id from user profile (assuming user has company_id)
    if "company_id" in current_user:
        job_dict["company_id"] = ObjectId(current_user["company_id"])
    else:
        # For now, use recruiter_id as company_id if no company is set
        job_dict["company_id"] = ObjectId(current_user["_id"])
    
    # Set timestamps
    now = datetime.now()
    job_dict["created_at"] = now
    job_dict["updated_at"] = now
    job_dict["posted_date"] = now
    
    # Initialize counters
    job_dict["application_count"] = 0
    job_dict["submission_count"] = 0
    job_dict["view_count"] = 0
    
    # Set default status
    job_dict["status"] = JobStatus.DRAFT
    
    try:
        new_job = await db.jobs.insert_one(job_dict)
        created_job = await db.jobs.find_one({"_id": new_job.inserted_id})
        return created_job
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create job: {str(e)}"
        )

@router.put("/{job_id}", response_model=JobResponse)
@audit_action("UPDATE_JOB", "job")
async def update_job(
    request: Request,
    job_id: str = Path(..., description="Job ID"),
    job_update: JobUpdate = Body(...),
    current_user: dict = Depends(require_recruiter)
):
    """Update a job posting with status management and input validation."""
    db = get_database()
    
    # Validate and sanitize job ID
    try:
        job_object_id = InputSanitizer.validate_object_id(job_id)
    except SecurityError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    # Apply data isolation filter
    isolation_filter = CompanyIsolation.get_isolation_filter(current_user)
    isolation_filter["_id"] = job_object_id
    
    job = await db.jobs.find_one(isolation_filter)
    
    if job is None:
        # Log unauthorized access attempt
        ip_address = await get_client_ip(request)
        AuditLogger.log_action(
            user_id=str(current_user["_id"]),
            action="UNAUTHORIZED_JOB_UPDATE_ATTEMPT",
            resource_type="job",
            resource_id=job_id,
            ip_address=ip_address
        )
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Prepare and sanitize update data
    try:
        update_dict = job_update.dict(by_alias=True, exclude_unset=True)
        update_data = {}
        
        for key, value in update_dict.items():
            if value is not None:
                # Sanitize string fields
                if key in ["title", "description"] and isinstance(value, str):
                    max_len = 200 if key == "title" else 5000
                    update_data[key] = InputSanitizer.sanitize_string(value, max_length=max_len)
                elif key == "task" and isinstance(value, dict):
                    # Sanitize task fields
                    sanitized_task = {}
                    for task_key, task_value in value.items():
                        if task_key in ["title", "description", "instructions"] and isinstance(task_value, str):
                            max_len = 200 if task_key == "title" else 2000
                            sanitized_task[task_key] = InputSanitizer.sanitize_string(task_value, max_length=max_len)
                        else:
                            sanitized_task[task_key] = task_value
                    update_data[key] = sanitized_task
                elif key == "location" and isinstance(value, dict):
                    # Sanitize location fields
                    sanitized_location = {}
                    for loc_key, loc_value in value.items():
                        if loc_key in ["city", "country"] and isinstance(loc_value, str):
                            sanitized_location[loc_key] = InputSanitizer.sanitize_string(loc_value, max_length=100)
                        else:
                            sanitized_location[loc_key] = loc_value
                    update_data[key] = sanitized_location
                else:
                    update_data[key] = value
                    
    except SecurityError as e:
        raise HTTPException(status_code=400, detail=f"Input validation failed: {str(e)}")
    
    if update_data:
        update_data["updated_at"] = datetime.now()
        
        # Handle status changes
        if "status" in update_data:
            new_status = update_data["status"]
            current_status = job["status"]
            
            # If changing from draft to active, set posted_date
            if current_status == JobStatus.DRAFT and new_status == JobStatus.ACTIVE:
                update_data["posted_date"] = datetime.now()
        
        try:
            await db.jobs.update_one(
                {"_id": job_object_id},
                {"$set": update_data}
            )
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to update job: {str(e)}"
            )
    
    updated_job = await db.jobs.find_one({"_id": job_object_id})
    return updated_job

@router.delete("/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
@audit_action("DELETE_JOB", "job")
async def delete_job(
    request: Request,
    job_id: str = Path(..., description="Job ID"),
    current_user: dict = Depends(require_recruiter)
):
    """Delete a job posting with security validation."""
    db = get_database()
    
    # Validate and sanitize job ID
    try:
        job_object_id = InputSanitizer.validate_object_id(job_id)
    except SecurityError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    # Apply data isolation filter
    isolation_filter = CompanyIsolation.get_isolation_filter(current_user)
    isolation_filter["_id"] = job_object_id
    
    job = await db.jobs.find_one(isolation_filter)
    
    if job is None:
        # Log unauthorized access attempt
        ip_address = await get_client_ip(request)
        AuditLogger.log_action(
            user_id=str(current_user["_id"]),
            action="UNAUTHORIZED_JOB_DELETE_ATTEMPT",
            resource_type="job",
            resource_id=job_id,
            ip_address=ip_address
        )
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Check if job has applications - prevent deletion if it does
    if job.get("application_count", 0) > 0:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete job with existing applications. Set status to 'closed' instead."
        )
    
    try:
        await db.jobs.delete_one({"_id": job_object_id})
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete job: {str(e)}"
        )

@router.patch("/{job_id}/status", response_model=JobResponse)
@audit_action("UPDATE_JOB_STATUS", "job")
async def update_job_status(
    request: Request,
    job_id: str = Path(..., description="Job ID"),
    status: JobStatus = Body(..., embed=True),
    current_user: dict = Depends(require_recruiter)
):
    """Update job status specifically with security validation."""
    db = get_database()
    
    # Validate and sanitize job ID
    try:
        job_object_id = InputSanitizer.validate_object_id(job_id)
    except SecurityError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    # Apply data isolation filter
    isolation_filter = CompanyIsolation.get_isolation_filter(current_user)
    isolation_filter["_id"] = job_object_id
    
    job = await db.jobs.find_one(isolation_filter)
    
    if job is None:
        # Log unauthorized access attempt
        ip_address = await get_client_ip(request)
        AuditLogger.log_action(
            user_id=str(current_user["_id"]),
            action="UNAUTHORIZED_JOB_STATUS_UPDATE_ATTEMPT",
            resource_type="job",
            resource_id=job_id,
            ip_address=ip_address
        )
        raise HTTPException(status_code=404, detail="Job not found")
    
    update_data = {
        "status": status,
        "updated_at": datetime.now()
    }
    
    # If changing from draft to active, set posted_date
    if job["status"] == JobStatus.DRAFT and status == JobStatus.ACTIVE:
        update_data["posted_date"] = datetime.now()
    
    try:
        await db.jobs.update_one(
            {"_id": job_object_id},
            {"$set": update_data}
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update job status: {str(e)}"
        )
    
    updated_job = await db.jobs.find_one({"_id": job_object_id})
    return updated_job

@router.get("/{job_id}/metrics", response_model=dict)
async def get_job_metrics(
    request: Request,
    job_id: str = Path(..., description="Job ID"),
    current_user: dict = Depends(require_recruiter)
):
    """Get detailed metrics for a specific job with security validation."""
    db = get_database()
    
    # Validate and sanitize job ID
    try:
        job_object_id = InputSanitizer.validate_object_id(job_id)
    except SecurityError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    # Apply data isolation filter
    isolation_filter = CompanyIsolation.get_isolation_filter(current_user)
    isolation_filter["_id"] = job_object_id
    
    job = await db.jobs.find_one(isolation_filter)
    
    if job is None:
        # Log unauthorized access attempt
        ip_address = await get_client_ip(request)
        AuditLogger.log_action(
            user_id=str(current_user["_id"]),
            action="UNAUTHORIZED_JOB_METRICS_ACCESS_ATTEMPT",
            resource_type="job",
            resource_id=job_id,
            ip_address=ip_address
        )
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Calculate additional metrics
    days_active = 0
    if job["status"] == JobStatus.ACTIVE and job.get("posted_date"):
        days_active = (datetime.now() - job["posted_date"]).days
    
    # Calculate conversion rates
    application_to_submission_rate = 0
    if job["application_count"] > 0:
        application_to_submission_rate = (job["submission_count"] / job["application_count"]) * 100
    
    view_to_application_rate = 0
    if job["view_count"] > 0:
        view_to_application_rate = (job["application_count"] / job["view_count"]) * 100
    
    return {
        "job_id": str(job["_id"]),
        "title": job["title"],
        "status": job["status"],
        "days_active": days_active,
        "view_count": job["view_count"],
        "application_count": job["application_count"],
        "submission_count": job["submission_count"],
        "view_to_application_rate": round(view_to_application_rate, 2),
        "application_to_submission_rate": round(application_to_submission_rate, 2),
        "posted_date": job.get("posted_date"),
        "closing_date": job.get("closing_date")
    }

# Student-specific endpoints
@router.get("/student/browse", response_model=StudentJobBrowseResponse)
async def browse_jobs_for_students(
    request: Request,
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(10, ge=1, le=100, description="Items per page"),
    search: Optional[str] = Query(None, description="Search in title, description, and company"),
    difficulty: Optional[List[str]] = Query(None, description="Filter by difficulty levels"),
    category: Optional[List[str]] = Query(None, description="Filter by job categories"),
    employment_type: Optional[List[str]] = Query(None, description="Filter by employment types"),
    location_type: Optional[str] = Query(None, description="Filter by location type"),
    city: Optional[str] = Query(None, description="Filter by city"),
    country: Optional[str] = Query(None, description="Filter by country"),
    min_salary: Optional[int] = Query(None, description="Minimum salary filter"),
    max_salary: Optional[int] = Query(None, description="Maximum salary filter"),
    min_reward: Optional[int] = Query(None, description="Minimum reward points"),
    max_reward: Optional[int] = Query(None, description="Maximum reward points"),
    deadline_within: Optional[int] = Query(None, description="Jobs with deadline within X days"),
    exclude_applied: Optional[bool] = Query(False, description="Exclude jobs already applied to"),
    current_user: dict = Depends(require_authenticated)
):
    """
    Browse jobs for students with filtering, search, and recommendations.
    Only shows active jobs that students can apply to.
    """
    db = get_database()
    
    # Sanitize search input if provided
    if search:
        try:
            search = InputSanitizer.sanitize_string(search, max_length=100)
        except SecurityError as e:
            raise HTTPException(status_code=400, detail=str(e))
    
    # Sanitize string filters
    if city:
        try:
            city = InputSanitizer.sanitize_string(city, max_length=50)
        except SecurityError as e:
            raise HTTPException(status_code=400, detail=str(e))
    
    if country:
        try:
            country = InputSanitizer.sanitize_string(country, max_length=50)
        except SecurityError as e:
            raise HTTPException(status_code=400, detail=str(e))
    
    # Base filter - only active jobs
    filter_query = {
        "status": "active",
        "$or": [
            {"closing_date": {"$exists": False}},
            {"closing_date": {"$gte": datetime.now()}}
        ]
    }
    
    # Apply search filter
    if search:
        filter_query["$and"] = [
            filter_query.get("$and", []),
            {
                "$or": [
                    {"title": {"$regex": search, "$options": "i"}},
                    {"description": {"$regex": search, "$options": "i"}},
                    {"requirements": {"$regex": search, "$options": "i"}},
                    {"responsibilities": {"$regex": search, "$options": "i"}}
                ]
            }
        ]
    
    # Apply employment type filter
    if employment_type:
        filter_query["employment_type"] = {"$in": employment_type}
    
    # Apply location filters
    if location_type:
        filter_query["location.type"] = location_type
    if city:
        filter_query["location.city"] = {"$regex": city, "$options": "i"}
    if country:
        filter_query["location.country"] = {"$regex": country, "$options": "i"}
    
    # Apply salary filters
    if min_salary or max_salary:
        salary_filter = {}
        if min_salary:
            salary_filter["$gte"] = min_salary
        if max_salary:
            salary_filter["$lte"] = max_salary
        filter_query["salary.min"] = salary_filter
    
    # Apply deadline filter
    if deadline_within:
        deadline_date = datetime.now() + timedelta(days=deadline_within)
        filter_query["closing_date"] = {"$lte": deadline_date}
    
    # Exclude jobs already applied to if requested
    if exclude_applied and current_user.get("role") == UserRole.STUDENT:
        # Get list of job IDs the student has already applied to
        applied_jobs = await db.task_submissions.find(
            {"candidate_id": ObjectId(current_user["_id"])},
            {"job_id": 1}
        ).to_list(length=None)
        
        applied_job_ids = [submission["job_id"] for submission in applied_jobs]
        if applied_job_ids:
            filter_query["_id"] = {"$nin": applied_job_ids}
    
    # Get total count
    total = await db.jobs.count_documents(filter_query)
    
    # Calculate pagination
    skip = (page - 1) * per_page
    total_pages = math.ceil(total / per_page)
    
    # Get jobs with pagination
    jobs_cursor = db.jobs.find(filter_query).skip(skip).limit(per_page).sort("posted_date", -1)
    jobs = await jobs_cursor.to_list(length=per_page)
    
    # Convert to JobWithRecommendation format
    jobs_with_recommendations = []
    for job in jobs:
        job_dict = dict(job)
        job_dict["id"] = str(job_dict.pop("_id"))
        
        # Add basic recommendation data (can be enhanced with ML later)
        job_dict["match_score"] = None
        job_dict["match_reasons"] = None
        job_dict["is_recommended"] = False
        job_dict["skill_gaps"] = None
        
        jobs_with_recommendations.append(job_dict)
    
    return StudentJobBrowseResponse(
        jobs=jobs_with_recommendations,
        total=total,
        page=page,
        per_page=per_page,
        total_pages=total_pages,
        recommendations=None  # Can be populated with ML recommendations later
    )

@router.post("/{job_id}/view")
async def increment_job_view(
    request: Request,
    job_id: str = Path(..., description="Job ID"),
    current_user: dict = Depends(require_authenticated)
):
    """Increment view count for a job when a student views it."""
    db = get_database()
    
    # Validate and sanitize job ID
    try:
        job_object_id = InputSanitizer.validate_object_id(job_id)
    except SecurityError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    # Check if job exists and is active
    job = await db.jobs.find_one({
        "_id": job_object_id,
        "status": "active"
    })
    
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found or not active")
    
    # Increment view count
    try:
        await db.jobs.update_one(
            {"_id": job_object_id},
            {"$inc": {"view_count": 1}}
        )
        
        # Log the view for analytics (optional)
        ip_address = await get_client_ip(request)
        AuditLogger.log_action(
            user_id=str(current_user["_id"]),
            action="JOB_VIEW",
            resource_type="job",
            resource_id=job_id,
            ip_address=ip_address
        )
        
        return {"success": True, "message": "View count incremented"}
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to increment view count: {str(e)}"
        )

@router.get("/student/categories", response_model=List[str])
async def get_job_categories(
    current_user: dict = Depends(require_authenticated)
):
    """Get available job categories for filtering."""
    # This could be enhanced to be dynamic based on actual job data
    # For now, return common categories
    categories = [
        "Frontend Development",
        "Backend Development", 
        "Full Stack Development",
        "Mobile Development",
        "DevOps",
        "Data Science",
        "Machine Learning",
        "UI/UX Design",
        "Product Management",
        "Quality Assurance",
        "Cybersecurity",
        "Cloud Computing",
        "Database Administration",
        "System Administration"
    ]
    
    return categories

@router.get("/student/difficulties", response_model=List[str])
async def get_job_difficulties(
    current_user: dict = Depends(require_authenticated)
):
    """Get available difficulty levels for filtering."""
    return ["Easy", "Medium", "Hard"]