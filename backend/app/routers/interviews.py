from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Body, Depends, HTTPException, status, Path, Query
from bson import ObjectId
import math

from app.core.auth import get_current_user
from app.core.database import get_database
from app.models.interview import InterviewModel, InterviewStatus, InterviewType, InterviewRound
from app.schemas.interview_schemas import (
    InterviewCreate, InterviewUpdate, InterviewReschedule,
    InterviewerFeedbackCreate, InterviewFeedbackCreate,
    InterviewResponse, InterviewListResponse, InterviewFilters,
    InterviewCalendarResponse, InterviewStats, BulkInterviewAction
)

router = APIRouter(tags=["interviews"], prefix="/interviews")

@router.get("", response_model=InterviewListResponse)
async def get_interviews(
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(10, ge=1, le=100, description="Items per page"),
    job_id: Optional[str] = Query(None, description="Filter by job ID"),
    candidate_id: Optional[str] = Query(None, description="Filter by candidate ID"),
    interview_type: Optional[InterviewType] = Query(None, description="Filter by interview type"),
    interview_round: Optional[InterviewRound] = Query(None, description="Filter by interview round"),
    status: Optional[InterviewStatus] = Query(None, description="Filter by status"),
    date_from: Optional[datetime] = Query(None, description="Filter interviews from date"),
    date_to: Optional[datetime] = Query(None, description="Filter interviews to date"),
    current_user: dict = Depends(get_current_user)
):
    """Get interviews with filtering and pagination for recruiter's jobs."""
    db = get_database()
    
    # Get recruiter's job IDs
    recruiter_jobs = await db.jobs.find(
        {"recruiter_id": ObjectId(current_user["_id"])},
        {"_id": 1}
    ).to_list(length=None)
    
    if not recruiter_jobs:
        return InterviewListResponse(
            interviews=[], total=0, page=page, per_page=per_page, total_pages=0
        )
    
    recruiter_job_ids = [job["_id"] for job in recruiter_jobs]
    
    # Build filter query
    filter_query = {"job_id": {"$in": recruiter_job_ids}}
    
    if job_id:
        if not ObjectId.is_valid(job_id):
            raise HTTPException(status_code=400, detail="Invalid job ID format")
        filter_query["job_id"] = ObjectId(job_id)
    
    if candidate_id:
        if not ObjectId.is_valid(candidate_id):
            raise HTTPException(status_code=400, detail="Invalid candidate ID format")
        filter_query["candidate_id"] = ObjectId(candidate_id)
    
    if interview_type:
        filter_query["interview_type"] = interview_type
    
    if interview_round:
        filter_query["interview_round"] = interview_round
    
    if status:
        filter_query["status"] = status
    
    if date_from or date_to:
        date_filter = {}
        if date_from:
            date_filter["$gte"] = date_from
        if date_to:
            date_filter["$lte"] = date_to
        filter_query["scheduled_date"] = date_filter
    
    # Get total count
    total = await db.interviews.count_documents(filter_query)
    
    # Calculate pagination
    skip = (page - 1) * per_page
    total_pages = math.ceil(total / per_page)
    
    # Get interviews with pagination
    interviews_cursor = db.interviews.find(filter_query).skip(skip).limit(per_page).sort("scheduled_date", 1)
    interviews = await interviews_cursor.to_list(length=per_page)
    
    return InterviewListResponse(
        interviews=interviews,
        total=total,
        page=page,
        per_page=per_page,
        total_pages=total_pages
    )

@router.get("/{interview_id}", response_model=InterviewResponse)
async def get_interview(
    interview_id: str = Path(..., description="Interview ID"),
    current_user: dict = Depends(get_current_user)
):
    """Get a specific interview by ID."""
    db = get_database()
    
    if not ObjectId.is_valid(interview_id):
        raise HTTPException(status_code=400, detail="Invalid interview ID format")
    
    interview = await db.interviews.find_one({"_id": ObjectId(interview_id)})
    
    if interview is None:
        raise HTTPException(status_code=404, detail="Interview not found")
    
    # Verify the interview belongs to a job owned by this recruiter
    job = await db.jobs.find_one({
        "_id": interview["job_id"],
        "recruiter_id": ObjectId(current_user["_id"])
    })
    
    if job is None:
        raise HTTPException(status_code=403, detail="Access denied to this interview")
    
    return interview

@router.post("", response_model=InterviewResponse, status_code=status.HTTP_201_CREATED)
async def create_interview(
    interview: InterviewCreate = Body(...),
    current_user: dict = Depends(get_current_user)
):
    """Create a new interview."""
    db = get_database()
    
    if not ObjectId.is_valid(interview.submission_id):
        raise HTTPException(status_code=400, detail="Invalid submission ID format")
    
    # Get the submission
    submission = await db.task_submissions.find_one({"_id": ObjectId(interview.submission_id)})
    
    if submission is None:
        raise HTTPException(status_code=404, detail="Task submission not found")
    
    # Verify the submission belongs to a job owned by this recruiter
    job = await db.jobs.find_one({
        "_id": submission["job_id"],
        "recruiter_id": ObjectId(current_user["_id"])
    })
    
    if job is None:
        raise HTTPException(status_code=403, detail="Access denied to this submission")
    
    # Check if submission is in a state that allows interview scheduling
    if submission["status"] not in ["evaluated", "reviewed", "shortlisted"]:
        raise HTTPException(
            status_code=400,
            detail="Submission must be evaluated or reviewed before scheduling interview"
        )
    
    # Validate interviewer IDs
    interviewer_ids = []
    for interviewer_id in interview.interviewers:
        if not ObjectId.is_valid(interviewer_id):
            raise HTTPException(status_code=400, detail=f"Invalid interviewer ID format: {interviewer_id}")
        interviewer_ids.append(ObjectId(interviewer_id))
    
    # Prepare interview data
    interview_dict = interview.dict(by_alias=True)
    interview_dict["submission_id"] = ObjectId(interview.submission_id)
    interview_dict["job_id"] = submission["job_id"]
    interview_dict["candidate_id"] = submission["candidate_id"]
    interview_dict["recruiter_id"] = ObjectId(current_user["_id"])
    interview_dict["interviewers"] = interviewer_ids
    interview_dict["status"] = InterviewStatus.SCHEDULED
    
    # Set timestamps
    now = datetime.now()
    interview_dict["created_at"] = now
    interview_dict["updated_at"] = now
    interview_dict["reminder_sent"] = False
    interview_dict["confirmation_sent"] = False
    interview_dict["reschedule_count"] = 0
    
    try:
        new_interview = await db.interviews.insert_one(interview_dict)
        created_interview = await db.interviews.find_one({"_id": new_interview.inserted_id})
        
        # TODO: Send calendar invitations and notifications
        
        return created_interview
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create interview: {str(e)}"
        )

@router.put("/{interview_id}", response_model=InterviewResponse)
async def update_interview(
    interview_id: str = Path(..., description="Interview ID"),
    interview_update: InterviewUpdate = Body(...),
    current_user: dict = Depends(get_current_user)
):
    """Update an interview."""
    db = get_database()
    
    if not ObjectId.is_valid(interview_id):
        raise HTTPException(status_code=400, detail="Invalid interview ID format")
    
    # Check if interview exists
    interview = await db.interviews.find_one({"_id": ObjectId(interview_id)})
    
    if interview is None:
        raise HTTPException(status_code=404, detail="Interview not found")
    
    # Verify the interview belongs to a job owned by this recruiter
    job = await db.jobs.find_one({
        "_id": interview["job_id"],
        "recruiter_id": ObjectId(current_user["_id"])
    })
    
    if job is None:
        raise HTTPException(status_code=403, detail="Access denied to this interview")
    
    # Prepare update data
    update_data = {k: v for k, v in interview_update.dict(by_alias=True).items() if v is not None}
    
    # Validate interviewer IDs if provided
    if "interviewers" in update_data:
        interviewer_ids = []
        for interviewer_id in update_data["interviewers"]:
            if not ObjectId.is_valid(interviewer_id):
                raise HTTPException(status_code=400, detail=f"Invalid interviewer ID format: {interviewer_id}")
            interviewer_ids.append(ObjectId(interviewer_id))
        update_data["interviewers"] = interviewer_ids
    
    if update_data:
        update_data["updated_at"] = datetime.now()
        
        try:
            await db.interviews.update_one(
                {"_id": ObjectId(interview_id)},
                {"$set": update_data}
            )
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to update interview: {str(e)}"
            )
    
    updated_interview = await db.interviews.find_one({"_id": ObjectId(interview_id)})
    return updated_interview

@router.post("/{interview_id}/reschedule", response_model=InterviewResponse)
async def reschedule_interview(
    interview_id: str = Path(..., description="Interview ID"),
    reschedule_data: InterviewReschedule = Body(...),
    current_user: dict = Depends(get_current_user)
):
    """Reschedule an interview."""
    db = get_database()
    
    if not ObjectId.is_valid(interview_id):
        raise HTTPException(status_code=400, detail="Invalid interview ID format")
    
    interview = await db.interviews.find_one({"_id": ObjectId(interview_id)})
    
    if interview is None:
        raise HTTPException(status_code=404, detail="Interview not found")
    
    # Verify the interview belongs to a job owned by this recruiter
    job = await db.jobs.find_one({
        "_id": interview["job_id"],
        "recruiter_id": ObjectId(current_user["_id"])
    })
    
    if job is None:
        raise HTTPException(status_code=403, detail="Access denied to this interview")
    
    # Can only reschedule scheduled interviews
    if interview["status"] != InterviewStatus.SCHEDULED:
        raise HTTPException(
            status_code=400,
            detail="Can only reschedule scheduled interviews"
        )
    
    # Update interview with new schedule
    update_data = {
        "original_date": interview.get("original_date", interview["scheduled_date"]),
        "scheduled_date": reschedule_data.new_scheduled_date,
        "reschedule_reason": reschedule_data.reason,
        "reschedule_count": interview.get("reschedule_count", 0) + 1,
        "status": InterviewStatus.RESCHEDULED,
        "reminder_sent": False,
        "confirmation_sent": False,
        "updated_at": datetime.now()
    }
    
    try:
        await db.interviews.update_one(
            {"_id": ObjectId(interview_id)},
            {"$set": update_data}
        )
        
        # TODO: Send reschedule notifications if requested
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to reschedule interview: {str(e)}"
        )
    
    updated_interview = await db.interviews.find_one({"_id": ObjectId(interview_id)})
    return updated_interview

@router.post("/{interview_id}/feedback", response_model=InterviewResponse)
async def add_interview_feedback(
    interview_id: str = Path(..., description="Interview ID"),
    feedback: InterviewFeedbackCreate = Body(...),
    current_user: dict = Depends(get_current_user)
):
    """Add feedback to a completed interview."""
    db = get_database()
    
    if not ObjectId.is_valid(interview_id):
        raise HTTPException(status_code=400, detail="Invalid interview ID format")
    
    interview = await db.interviews.find_one({"_id": ObjectId(interview_id)})
    
    if interview is None:
        raise HTTPException(status_code=404, detail="Interview not found")
    
    # Verify the interview belongs to a job owned by this recruiter
    job = await db.jobs.find_one({
        "_id": interview["job_id"],
        "recruiter_id": ObjectId(current_user["_id"])
    })
    
    if job is None:
        raise HTTPException(status_code=403, detail="Access denied to this interview")
    
    # Can only add feedback to completed interviews
    if interview["status"] != InterviewStatus.COMPLETED:
        raise HTTPException(
            status_code=400,
            detail="Can only add feedback to completed interviews"
        )
    
    # Prepare feedback data
    feedback_data = feedback.dict()
    feedback_data["interviewer_feedbacks"] = []  # Will be populated separately
    
    update_data = {
        "feedback": feedback_data,
        "updated_at": datetime.now()
    }
    
    try:
        await db.interviews.update_one(
            {"_id": ObjectId(interview_id)},
            {"$set": update_data}
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to add feedback: {str(e)}"
        )
    
    updated_interview = await db.interviews.find_one({"_id": ObjectId(interview_id)})
    return updated_interview

@router.post("/{interview_id}/complete", response_model=InterviewResponse)
async def complete_interview(
    interview_id: str = Path(..., description="Interview ID"),
    current_user: dict = Depends(get_current_user)
):
    """Mark an interview as completed."""
    db = get_database()
    
    if not ObjectId.is_valid(interview_id):
        raise HTTPException(status_code=400, detail="Invalid interview ID format")
    
    interview = await db.interviews.find_one({"_id": ObjectId(interview_id)})
    
    if interview is None:
        raise HTTPException(status_code=404, detail="Interview not found")
    
    # Verify the interview belongs to a job owned by this recruiter
    job = await db.jobs.find_one({
        "_id": interview["job_id"],
        "recruiter_id": ObjectId(current_user["_id"])
    })
    
    if job is None:
        raise HTTPException(status_code=403, detail="Access denied to this interview")
    
    # Can only complete scheduled or rescheduled interviews
    if interview["status"] not in [InterviewStatus.SCHEDULED, InterviewStatus.RESCHEDULED]:
        raise HTTPException(
            status_code=400,
            detail="Can only complete scheduled or rescheduled interviews"
        )
    
    update_data = {
        "status": InterviewStatus.COMPLETED,
        "completed_at": datetime.now(),
        "updated_at": datetime.now()
    }
    
    try:
        await db.interviews.update_one(
            {"_id": ObjectId(interview_id)},
            {"$set": update_data}
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to complete interview: {str(e)}"
        )
    
    updated_interview = await db.interviews.find_one({"_id": ObjectId(interview_id)})
    return updated_interview

@router.get("/calendar/{date}", response_model=InterviewCalendarResponse)
async def get_calendar_day(
    date: str = Path(..., description="Date in YYYY-MM-DD format"),
    current_user: dict = Depends(get_current_user)
):
    """Get interviews for a specific calendar day."""
    db = get_database()
    
    try:
        target_date = datetime.strptime(date, "%Y-%m-%d")
        start_of_day = target_date.replace(hour=0, minute=0, second=0, microsecond=0)
        end_of_day = start_of_day + timedelta(days=1)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    
    # Get recruiter's job IDs
    recruiter_jobs = await db.jobs.find(
        {"recruiter_id": ObjectId(current_user["_id"])},
        {"_id": 1}
    ).to_list(length=None)
    
    recruiter_job_ids = [job["_id"] for job in recruiter_jobs]
    
    # Get interviews for the day
    interviews = await db.interviews.find({
        "job_id": {"$in": recruiter_job_ids},
        "scheduled_date": {
            "$gte": start_of_day,
            "$lt": end_of_day
        }
    }).sort("scheduled_date", 1).to_list(length=None)
    
    # Calculate total duration
    total_duration = sum(interview.get("duration", 0) for interview in interviews)
    
    # TODO: Detect conflicts (overlapping interviews)
    conflicts = []
    
    return InterviewCalendarResponse(
        date=date,
        interviews=interviews,
        total_duration=total_duration,
        conflicts=conflicts
    )

@router.get("/stats/overview", response_model=InterviewStats)
async def get_interview_stats(
    job_id: Optional[str] = Query(None, description="Filter stats by job ID"),
    current_user: dict = Depends(get_current_user)
):
    """Get interview statistics for recruiter's jobs."""
    db = get_database()
    
    # Build match query for recruiter's jobs
    match_query = {"recruiter_id": ObjectId(current_user["_id"])}
    if job_id:
        if not ObjectId.is_valid(job_id):
            raise HTTPException(status_code=400, detail="Invalid job ID format")
        match_query["_id"] = ObjectId(job_id)
    
    # Get job IDs
    recruiter_jobs = await db.jobs.find(match_query, {"_id": 1}).to_list(length=None)
    recruiter_job_ids = [job["_id"] for job in recruiter_jobs]
    
    if not recruiter_job_ids:
        return InterviewStats(
            total_interviews=0,
            by_status={},
            by_type={},
            by_round={},
            average_duration=None,
            completion_rate=0.0,
            reschedule_rate=0.0,
            no_show_rate=0.0
        )
    
    # Aggregate interview stats
    pipeline = [
        {"$match": {"job_id": {"$in": recruiter_job_ids}}},
        {"$group": {
            "_id": None,
            "total_interviews": {"$sum": 1},
            "by_status": {"$push": "$status"},
            "by_type": {"$push": "$interview_type"},
            "by_round": {"$push": "$interview_round"},
            "durations": {"$push": "$duration"},
            "completed_count": {
                "$sum": {"$cond": [{"$eq": ["$status", "completed"]}, 1, 0]}
            },
            "rescheduled_count": {
                "$sum": {"$cond": [{"$gt": ["$reschedule_count", 0]}, 1, 0]}
            },
            "no_show_count": {
                "$sum": {"$cond": [{"$eq": ["$status", "no_show"]}, 1, 0]}
            }
        }}
    ]
    
    result = await db.interviews.aggregate(pipeline).to_list(length=1)
    
    if not result:
        return InterviewStats(
            total_interviews=0,
            by_status={},
            by_type={},
            by_round={},
            average_duration=None,
            completion_rate=0.0,
            reschedule_rate=0.0,
            no_show_rate=0.0
        )
    
    data = result[0]
    
    # Process counts
    status_counts = {}
    for status in data["by_status"]:
        status_counts[status] = status_counts.get(status, 0) + 1
    
    type_counts = {}
    for interview_type in data["by_type"]:
        type_counts[interview_type] = type_counts.get(interview_type, 0) + 1
    
    round_counts = {}
    for interview_round in data["by_round"]:
        round_counts[interview_round] = round_counts.get(interview_round, 0) + 1
    
    # Calculate averages and rates
    valid_durations = [d for d in data["durations"] if d is not None and d > 0]
    average_duration = sum(valid_durations) / len(valid_durations) if valid_durations else None
    
    total = data["total_interviews"]
    completion_rate = (data["completed_count"] / total) * 100 if total > 0 else 0.0
    reschedule_rate = (data["rescheduled_count"] / total) * 100 if total > 0 else 0.0
    no_show_rate = (data["no_show_count"] / total) * 100 if total > 0 else 0.0
    
    return InterviewStats(
        total_interviews=total,
        by_status=status_counts,
        by_type=type_counts,
        by_round=round_counts,
        average_duration=average_duration,
        completion_rate=completion_rate,
        reschedule_rate=reschedule_rate,
        no_show_rate=no_show_rate
    )

@router.delete("/{interview_id}", status_code=status.HTTP_204_NO_CONTENT)
async def cancel_interview(
    interview_id: str = Path(..., description="Interview ID"),
    current_user: dict = Depends(get_current_user)
):
    """Cancel an interview."""
    db = get_database()
    
    if not ObjectId.is_valid(interview_id):
        raise HTTPException(status_code=400, detail="Invalid interview ID format")
    
    interview = await db.interviews.find_one({"_id": ObjectId(interview_id)})
    
    if interview is None:
        raise HTTPException(status_code=404, detail="Interview not found")
    
    # Verify the interview belongs to a job owned by this recruiter
    job = await db.jobs.find_one({
        "_id": interview["job_id"],
        "recruiter_id": ObjectId(current_user["_id"])
    })
    
    if job is None:
        raise HTTPException(status_code=403, detail="Access denied to this interview")
    
    # Can only cancel scheduled or rescheduled interviews
    if interview["status"] not in [InterviewStatus.SCHEDULED, InterviewStatus.RESCHEDULED]:
        raise HTTPException(
            status_code=400,
            detail="Can only cancel scheduled or rescheduled interviews"
        )
    
    try:
        await db.interviews.update_one(
            {"_id": ObjectId(interview_id)},
            {"$set": {
                "status": InterviewStatus.CANCELLED,
                "updated_at": datetime.now()
            }}
        )
        
        # TODO: Send cancellation notifications
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to cancel interview: {str(e)}"
        )