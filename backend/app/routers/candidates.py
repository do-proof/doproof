from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Body, Depends, HTTPException, status, Path, Query
from bson import ObjectId
import math

from app.core.auth import get_current_user
from app.core.database import get_database
from app.schemas.candidate_schemas import (
    CandidateProfile, CandidateSearchFilters, CandidateListResponse,
    CandidateStats, CandidateMessage, CandidateInvitation,
    CandidateShortlist, CandidateShortlistResponse,
    CandidateComparison, ComparisonResult
)

router = APIRouter(tags=["candidates"], prefix="/candidates")

@router.get("", response_model=CandidateListResponse)
async def search_candidates(
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(10, ge=1, le=100, description="Items per page"),
    skills: Optional[List[str]] = Query(None, description="Filter by skills"),
    experience_min: Optional[int] = Query(None, ge=0, description="Minimum years of experience"),
    experience_max: Optional[int] = Query(None, ge=0, description="Maximum years of experience"),
    location: Optional[str] = Query(None, description="Filter by location"),
    remote_preference: Optional[str] = Query(None, description="Remote work preference"),
    availability: Optional[str] = Query(None, description="Availability status"),
    min_salary: Optional[int] = Query(None, description="Minimum salary expectation"),
    max_salary: Optional[int] = Query(None, description="Maximum salary expectation"),
    min_score: Optional[float] = Query(None, ge=0, le=100, description="Minimum average score"),
    max_score: Optional[float] = Query(None, ge=0, le=100, description="Maximum average score"),
    min_completeness: Optional[float] = Query(None, ge=0, le=100, description="Minimum profile completeness"),
    has_portfolio: Optional[bool] = Query(None, description="Has portfolio URL"),
    has_github: Optional[bool] = Query(None, description="Has GitHub URL"),
    active_since: Optional[datetime] = Query(None, description="Active since date"),
    search_query: Optional[str] = Query(None, description="Search in name, bio, skills"),
    current_user: dict = Depends(get_current_user)
):
    """Search and browse candidate profiles with advanced filtering."""
    db = get_database()
    
    # Build filter query
    filter_query = {"role": "student"}  # Only show candidates/students
    
    if skills:
        filter_query["skills"] = {"$in": skills}
    
    if experience_min is not None or experience_max is not None:
        exp_filter = {}
        if experience_min is not None:
            exp_filter["$gte"] = experience_min
        if experience_max is not None:
            exp_filter["$lte"] = experience_max
        filter_query["experience_years"] = exp_filter
    
    if location:
        filter_query["location"] = {"$regex": location, "$options": "i"}
    
    if remote_preference:
        filter_query["remote_preference"] = remote_preference
    
    if availability:
        filter_query["availability"] = availability
    
    if min_salary or max_salary:
        salary_filter = {}
        if min_salary:
            salary_filter["salary_expectation.min"] = {"$gte": min_salary}
        if max_salary:
            salary_filter["salary_expectation.max"] = {"$lte": max_salary}
        filter_query.update(salary_filter)
    
    if min_score is not None or max_score is not None:
        score_filter = {}
        if min_score is not None:
            score_filter["$gte"] = min_score
        if max_score is not None:
            score_filter["$lte"] = max_score
        filter_query["average_score"] = score_filter
    
    if min_completeness is not None:
        filter_query["profile_completeness"] = {"$gte": min_completeness}
    
    if has_portfolio is not None:
        if has_portfolio:
            filter_query["portfolio_url"] = {"$exists": True, "$ne": None, "$ne": ""}
        else:
            filter_query["$or"] = [
                {"portfolio_url": {"$exists": False}},
                {"portfolio_url": None},
                {"portfolio_url": ""}
            ]
    
    if has_github is not None:
        if has_github:
            filter_query["github_url"] = {"$exists": True, "$ne": None, "$ne": ""}
        else:
            filter_query["$or"] = [
                {"github_url": {"$exists": False}},
                {"github_url": None},
                {"github_url": ""}
            ]
    
    if active_since:
        filter_query["last_active"] = {"$gte": active_since}
    
    if search_query:
        filter_query["$or"] = [
            {"name": {"$regex": search_query, "$options": "i"}},
            {"bio": {"$regex": search_query, "$options": "i"}},
            {"skills": {"$regex": search_query, "$options": "i"}},
            {"title": {"$regex": search_query, "$options": "i"}}
        ]
    
    # Get total count
    total = await db.users.count_documents(filter_query)
    
    # Calculate pagination
    skip = (page - 1) * per_page
    total_pages = math.ceil(total / per_page)
    
    # Get candidates with pagination
    # Sort by profile completeness and last active date
    candidates_cursor = db.users.find(filter_query).skip(skip).limit(per_page).sort([
        ("profile_completeness", -1),
        ("last_active", -1)
    ])
    candidates = await candidates_cursor.to_list(length=per_page)
    
    # Enhance candidate data with DoProof-specific metrics
    enhanced_candidates = []
    for candidate in candidates:
        # Get submission statistics for this candidate
        submission_stats = await db.task_submissions.aggregate([
            {"$match": {"candidate_id": candidate["_id"]}},
            {"$group": {
                "_id": None,
                "total_submissions": {"$sum": 1},
                "completed_tasks": {
                    "$sum": {"$cond": [{"$eq": ["$status", "submitted"]}, 1, 0]}
                },
                "scores": {"$push": "$ai_evaluation.overall_score"}
            }}
        ]).to_list(length=1)
        
        if submission_stats:
            stats = submission_stats[0]
            valid_scores = [s for s in stats["scores"] if s is not None]
            candidate["total_submissions"] = stats["total_submissions"]
            candidate["completed_tasks"] = stats["completed_tasks"]
            candidate["average_score"] = sum(valid_scores) / len(valid_scores) if valid_scores else None
            candidate["best_score"] = max(valid_scores) if valid_scores else None
            candidate["task_completion_rate"] = (stats["completed_tasks"] / stats["total_submissions"]) * 100 if stats["total_submissions"] > 0 else 0
        else:
            candidate["total_submissions"] = 0
            candidate["completed_tasks"] = 0
            candidate["average_score"] = None
            candidate["best_score"] = None
            candidate["task_completion_rate"] = 0
        
        # Calculate profile completeness
        completeness_score = 0
        fields_to_check = ["name", "email", "bio", "location", "skills", "experience_years"]
        for field in fields_to_check:
            if candidate.get(field):
                completeness_score += 1
        candidate["profile_completeness"] = (completeness_score / len(fields_to_check)) * 100
        
        # Set joined date from created_at if available
        candidate["joined_date"] = candidate.get("created_at", datetime.now())
        
        enhanced_candidates.append(candidate)
    
    return CandidateListResponse(
        candidates=enhanced_candidates,
        total=total,
        page=page,
        per_page=per_page,
        total_pages=total_pages
    )

@router.get("/{candidate_id}", response_model=CandidateProfile)
async def get_candidate_profile(
    candidate_id: str = Path(..., description="Candidate ID"),
    current_user: dict = Depends(get_current_user)
):
    """Get detailed candidate profile."""
    db = get_database()
    
    if not ObjectId.is_valid(candidate_id):
        raise HTTPException(status_code=400, detail="Invalid candidate ID format")
    
    candidate = await db.users.find_one({
        "_id": ObjectId(candidate_id),
        "role": "student"
    })
    
    if candidate is None:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    # Get detailed submission statistics
    submission_stats = await db.task_submissions.aggregate([
        {"$match": {"candidate_id": ObjectId(candidate_id)}},
        {"$group": {
            "_id": None,
            "total_submissions": {"$sum": 1},
            "completed_tasks": {
                "$sum": {"$cond": [{"$eq": ["$status", "submitted"]}, 1, 0]}
            },
            "scores": {"$push": "$ai_evaluation.overall_score"}
        }}
    ]).to_list(length=1)
    
    if submission_stats:
        stats = submission_stats[0]
        valid_scores = [s for s in stats["scores"] if s is not None]
        candidate["total_submissions"] = stats["total_submissions"]
        candidate["completed_tasks"] = stats["completed_tasks"]
        candidate["average_score"] = sum(valid_scores) / len(valid_scores) if valid_scores else None
        candidate["best_score"] = max(valid_scores) if valid_scores else None
        candidate["task_completion_rate"] = (stats["completed_tasks"] / stats["total_submissions"]) * 100 if stats["total_submissions"] > 0 else 0
    else:
        candidate["total_submissions"] = 0
        candidate["completed_tasks"] = 0
        candidate["average_score"] = None
        candidate["best_score"] = None
        candidate["task_completion_rate"] = 0
    
    # Calculate profile completeness
    completeness_score = 0
    fields_to_check = ["name", "email", "bio", "location", "skills", "experience_years", "portfolio_url", "github_url"]
    for field in fields_to_check:
        if candidate.get(field):
            completeness_score += 1
    candidate["profile_completeness"] = (completeness_score / len(fields_to_check)) * 100
    
    # Set joined date
    candidate["joined_date"] = candidate.get("created_at", datetime.now())
    
    return candidate

@router.post("/message", response_model=dict, status_code=status.HTTP_202_ACCEPTED)
async def send_candidate_message(
    message_data: CandidateMessage = Body(...),
    current_user: dict = Depends(get_current_user)
):
    """Send a message to a candidate."""
    db = get_database()
    
    if not ObjectId.is_valid(message_data.recipient_id):
        raise HTTPException(status_code=400, detail="Invalid recipient ID format")
    
    # Verify recipient exists and is a candidate
    recipient = await db.users.find_one({
        "_id": ObjectId(message_data.recipient_id),
        "role": "student"
    })
    
    if recipient is None:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    # If job_id is provided, verify it belongs to the recruiter
    if message_data.job_id:
        if not ObjectId.is_valid(message_data.job_id):
            raise HTTPException(status_code=400, detail="Invalid job ID format")
        
        job = await db.jobs.find_one({
            "_id": ObjectId(message_data.job_id),
            "recruiter_id": ObjectId(current_user["_id"])
        })
        
        if job is None:
            raise HTTPException(status_code=403, detail="Access denied to this job")
    
    # Create message record
    message_record = {
        "sender_id": ObjectId(current_user["_id"]),
        "recipient_id": ObjectId(message_data.recipient_id),
        "subject": message_data.subject,
        "message": message_data.message,
        "job_id": ObjectId(message_data.job_id) if message_data.job_id else None,
        "include_job_details": message_data.include_job_details,
        "sent_at": datetime.now(),
        "read": False
    }
    
    try:
        await db.messages.insert_one(message_record)
        
        # TODO: Send actual email/notification to candidate
        
        return {
            "status": "sent",
            "message": "Message sent successfully to candidate"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to send message: {str(e)}"
        )

@router.post("/invite", response_model=dict, status_code=status.HTTP_202_ACCEPTED)
async def invite_candidates_to_job(
    invitation: CandidateInvitation = Body(...),
    current_user: dict = Depends(get_current_user)
):
    """Invite multiple candidates to apply for a job."""
    db = get_database()
    
    # Validate job ID
    if not ObjectId.is_valid(invitation.job_id):
        raise HTTPException(status_code=400, detail="Invalid job ID format")
    
    # Verify job belongs to recruiter
    job = await db.jobs.find_one({
        "_id": ObjectId(invitation.job_id),
        "recruiter_id": ObjectId(current_user["_id"])
    })
    
    if job is None:
        raise HTTPException(status_code=403, detail="Access denied to this job")
    
    # Validate candidate IDs
    candidate_ids = []
    for candidate_id in invitation.candidate_ids:
        if not ObjectId.is_valid(candidate_id):
            raise HTTPException(status_code=400, detail=f"Invalid candidate ID format: {candidate_id}")
        candidate_ids.append(ObjectId(candidate_id))
    
    # Verify candidates exist
    candidates = await db.users.find({
        "_id": {"$in": candidate_ids},
        "role": "student"
    }).to_list(length=None)
    
    if len(candidates) != len(candidate_ids):
        raise HTTPException(status_code=400, detail="Some candidates not found")
    
    # Create invitation records
    invitation_records = []
    for candidate in candidates:
        invitation_record = {
            "job_id": ObjectId(invitation.job_id),
            "candidate_id": candidate["_id"],
            "recruiter_id": ObjectId(current_user["_id"]),
            "personal_message": invitation.personal_message,
            "sent_at": datetime.now(),
            "status": "sent",
            "opened": False,
            "applied": False
        }
        invitation_records.append(invitation_record)
    
    try:
        result = await db.job_invitations.insert_many(invitation_records)
        
        # TODO: Send actual invitations via email/notification
        
        return {
            "status": "sent",
            "invited_count": len(result.inserted_ids),
            "message": f"Invitations sent to {len(result.inserted_ids)} candidates"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to send invitations: {str(e)}"
        )

@router.post("/shortlists", response_model=CandidateShortlistResponse, status_code=status.HTTP_201_CREATED)
async def create_candidate_shortlist(
    shortlist: CandidateShortlist = Body(...),
    current_user: dict = Depends(get_current_user)
):
    """Create a candidate shortlist."""
    db = get_database()
    
    # Validate candidate IDs
    candidate_ids = []
    for candidate_id in shortlist.candidate_ids:
        if not ObjectId.is_valid(candidate_id):
            raise HTTPException(status_code=400, detail=f"Invalid candidate ID format: {candidate_id}")
        candidate_ids.append(ObjectId(candidate_id))
    
    # If job_id is provided, verify it belongs to the recruiter
    if shortlist.job_id:
        if not ObjectId.is_valid(shortlist.job_id):
            raise HTTPException(status_code=400, detail="Invalid job ID format")
        
        job = await db.jobs.find_one({
            "_id": ObjectId(shortlist.job_id),
            "recruiter_id": ObjectId(current_user["_id"])
        })
        
        if job is None:
            raise HTTPException(status_code=403, detail="Access denied to this job")
    
    # Create shortlist record
    shortlist_data = {
        "name": shortlist.name,
        "description": shortlist.description,
        "candidate_ids": candidate_ids,
        "job_id": ObjectId(shortlist.job_id) if shortlist.job_id else None,
        "recruiter_id": ObjectId(current_user["_id"]),
        "created_at": datetime.now(),
        "updated_at": datetime.now()
    }
    
    try:
        new_shortlist = await db.candidate_shortlists.insert_one(shortlist_data)
        created_shortlist = await db.candidate_shortlists.find_one({"_id": new_shortlist.inserted_id})
        
        return created_shortlist
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create shortlist: {str(e)}"
        )

@router.get("/shortlists", response_model=List[CandidateShortlistResponse])
async def get_candidate_shortlists(
    job_id: Optional[str] = Query(None, description="Filter by job ID"),
    current_user: dict = Depends(get_current_user)
):
    """Get candidate shortlists for the recruiter."""
    db = get_database()
    
    filter_query = {"recruiter_id": ObjectId(current_user["_id"])}
    
    if job_id:
        if not ObjectId.is_valid(job_id):
            raise HTTPException(status_code=400, detail="Invalid job ID format")
        filter_query["job_id"] = ObjectId(job_id)
    
    shortlists = await db.candidate_shortlists.find(filter_query).sort("created_at", -1).to_list(length=None)
    
    return shortlists

@router.post("/compare", response_model=ComparisonResult)
async def compare_candidates(
    comparison: CandidateComparison = Body(...),
    current_user: dict = Depends(get_current_user)
):
    """Compare multiple candidates side by side."""
    db = get_database()
    
    # Validate candidate IDs
    candidate_ids = []
    for candidate_id in comparison.candidate_ids:
        if not ObjectId.is_valid(candidate_id):
            raise HTTPException(status_code=400, detail=f"Invalid candidate ID format: {candidate_id}")
        candidate_ids.append(ObjectId(candidate_id))
    
    # Get candidates
    candidates = await db.users.find({
        "_id": {"$in": candidate_ids},
        "role": "student"
    }).to_list(length=None)
    
    if len(candidates) != len(candidate_ids):
        raise HTTPException(status_code=400, detail="Some candidates not found")
    
    # Enhance candidates with submission data
    enhanced_candidates = []
    for candidate in candidates:
        # Get submission statistics
        submission_stats = await db.task_submissions.aggregate([
            {"$match": {"candidate_id": candidate["_id"]}},
            {"$group": {
                "_id": None,
                "total_submissions": {"$sum": 1},
                "completed_tasks": {
                    "$sum": {"$cond": [{"$eq": ["$status", "submitted"]}, 1, 0]}
                },
                "scores": {"$push": "$ai_evaluation.overall_score"}
            }}
        ]).to_list(length=1)
        
        if submission_stats:
            stats = submission_stats[0]
            valid_scores = [s for s in stats["scores"] if s is not None]
            candidate["total_submissions"] = stats["total_submissions"]
            candidate["completed_tasks"] = stats["completed_tasks"]
            candidate["average_score"] = sum(valid_scores) / len(valid_scores) if valid_scores else None
            candidate["best_score"] = max(valid_scores) if valid_scores else None
        else:
            candidate["total_submissions"] = 0
            candidate["completed_tasks"] = 0
            candidate["average_score"] = None
            candidate["best_score"] = None
        
        enhanced_candidates.append(candidate)
    
    # Build comparison matrix
    comparison_matrix = {}
    for criterion in comparison.comparison_criteria:
        comparison_matrix[criterion] = {}
        for candidate in enhanced_candidates:
            candidate_id = str(candidate["_id"])
            if criterion == "skills":
                comparison_matrix[criterion][candidate_id] = candidate.get("skills", [])
            elif criterion == "experience":
                comparison_matrix[criterion][candidate_id] = candidate.get("experience_years", 0)
            elif criterion == "scores":
                comparison_matrix[criterion][candidate_id] = {
                    "average": candidate.get("average_score"),
                    "best": candidate.get("best_score"),
                    "total_submissions": candidate.get("total_submissions", 0)
                }
            elif criterion == "availability":
                comparison_matrix[criterion][candidate_id] = candidate.get("availability")
    
    # Generate recommendations
    recommendations = []
    if "scores" in comparison.comparison_criteria:
        scores = [(c.get("average_score", 0), c["name"]) for c in enhanced_candidates if c.get("average_score")]
        if scores:
            best_candidate = max(scores, key=lambda x: x[0])
            recommendations.append(f"Highest average score: {best_candidate[1]} ({best_candidate[0]:.1f})")
    
    if "experience" in comparison.comparison_criteria:
        exp_candidates = [(c.get("experience_years", 0), c["name"]) for c in enhanced_candidates]
        most_experienced = max(exp_candidates, key=lambda x: x[0])
        recommendations.append(f"Most experienced: {most_experienced[1]} ({most_experienced[0]} years)")
    
    # Find best matches based on multiple criteria
    best_matches = []
    for candidate in enhanced_candidates:
        match_score = 0
        factors = []
        
        if candidate.get("average_score"):
            match_score += candidate["average_score"] / 100 * 0.4
            factors.append(f"Score: {candidate['average_score']:.1f}")
        
        if candidate.get("experience_years"):
            match_score += min(candidate["experience_years"] / 10, 1) * 0.3
            factors.append(f"Experience: {candidate['experience_years']} years")
        
        if candidate.get("skills"):
            match_score += min(len(candidate["skills"]) / 10, 1) * 0.3
            factors.append(f"Skills: {len(candidate['skills'])}")
        
        best_matches.append({
            "candidate_id": str(candidate["_id"]),
            "name": candidate["name"],
            "match_score": match_score,
            "factors": factors
        })
    
    # Sort by match score
    best_matches.sort(key=lambda x: x["match_score"], reverse=True)
    
    return ComparisonResult(
        candidates=enhanced_candidates,
        comparison_matrix=comparison_matrix,
        recommendations=recommendations,
        best_matches=best_matches
    )

@router.get("/stats/overview", response_model=CandidateStats)
async def get_candidate_stats(
    current_user: dict = Depends(get_current_user)
):
    """Get candidate statistics and insights."""
    db = get_database()
    
    # Get all candidates
    total_candidates = await db.users.count_documents({"role": "student"})
    
    # Get candidates active in the last 30 days
    thirty_days_ago = datetime.now() - timedelta(days=30)
    active_candidates = await db.users.count_documents({
        "role": "student",
        "last_active": {"$gte": thirty_days_ago}
    })
    
    # Get new candidates this month
    start_of_month = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    new_candidates_this_month = await db.users.count_documents({
        "role": "student",
        "created_at": {"$gte": start_of_month}
    })
    
    # Aggregate statistics
    pipeline = [
        {"$match": {"role": "student"}},
        {"$group": {
            "_id": None,
            "by_experience": {"$push": "$experience_years"},
            "by_location": {"$push": "$location"},
            "by_skills": {"$push": "$skills"},
            "by_availability": {"$push": "$availability"}
        }}
    ]
    
    result = await db.users.aggregate(pipeline).to_list(length=1)
    
    if not result:
        return CandidateStats(
            total_candidates=0,
            by_experience_level={},
            by_location={},
            by_skills={},
            by_availability={},
            average_score=None,
            active_candidates=0,
            new_candidates_this_month=0
        )
    
    data = result[0]
    
    # Process experience levels
    experience_levels = {}
    for exp in data["by_experience"]:
        if exp is None:
            level = "Not specified"
        elif exp < 1:
            level = "Entry level (0-1 years)"
        elif exp < 3:
            level = "Junior (1-3 years)"
        elif exp < 5:
            level = "Mid-level (3-5 years)"
        elif exp < 10:
            level = "Senior (5-10 years)"
        else:
            level = "Expert (10+ years)"
        experience_levels[level] = experience_levels.get(level, 0) + 1
    
    # Process locations
    location_counts = {}
    for location in data["by_location"]:
        if location:
            # Extract city/country from location string
            location_parts = location.split(",")
            key = location_parts[0].strip() if location_parts else location
            location_counts[key] = location_counts.get(key, 0) + 1
    
    # Process skills
    skill_counts = {}
    for skills_list in data["by_skills"]:
        if skills_list:
            for skill in skills_list:
                skill_counts[skill] = skill_counts.get(skill, 0) + 1
    
    # Process availability
    availability_counts = {}
    for availability in data["by_availability"]:
        if availability:
            availability_counts[availability] = availability_counts.get(availability, 0) + 1
    
    # Get average score across all candidates
    score_pipeline = [
        {"$match": {"role": "student"}},
        {"$lookup": {
            "from": "task_submissions",
            "localField": "_id",
            "foreignField": "candidate_id",
            "as": "submissions"
        }},
        {"$unwind": {"path": "$submissions", "preserveNullAndEmptyArrays": True}},
        {"$group": {
            "_id": "$_id",
            "scores": {"$push": "$submissions.ai_evaluation.overall_score"}
        }},
        {"$project": {
            "average_score": {
                "$avg": {
                    "$filter": {
                        "input": "$scores",
                        "cond": {"$ne": ["$$this", None]}
                    }
                }
            }
        }},
        {"$group": {
            "_id": None,
            "overall_average": {"$avg": "$average_score"}
        }}
    ]
    
    score_result = await db.users.aggregate(score_pipeline).to_list(length=1)
    average_score = score_result[0]["overall_average"] if score_result and score_result[0]["overall_average"] else None
    
    return CandidateStats(
        total_candidates=total_candidates,
        by_experience_level=experience_levels,
        by_location=dict(list(location_counts.items())[:10]),  # Top 10 locations
        by_skills=dict(list(skill_counts.items())[:20]),  # Top 20 skills
        by_availability=availability_counts,
        average_score=average_score,
        active_candidates=active_candidates,
        new_candidates_this_month=new_candidates_this_month
    )