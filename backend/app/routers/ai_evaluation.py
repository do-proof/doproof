from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Body, Depends, HTTPException, status, Path, Query
from bson import ObjectId
import math

from app.core.auth import get_current_user
from app.core.database import get_database
from app.models.ai_evaluation import AIEvaluationModel, EvaluationStatus, EvaluationModel
from app.schemas.ai_evaluation_schemas import (
    AIEvaluationTrigger, AIEvaluationResponse, AIEvaluationListResponse,
    EvaluationFilters, EvaluationStats, BulkEvaluationTrigger,
    EvaluationComparison, ComparisonResult
)

router = APIRouter(tags=["ai-evaluation"], prefix="/ai-evaluation")

@router.get("", response_model=AIEvaluationListResponse)
async def get_evaluations(
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(10, ge=1, le=100, description="Items per page"),
    job_id: Optional[str] = Query(None, description="Filter by job ID"),
    candidate_id: Optional[str] = Query(None, description="Filter by candidate ID"),
    status: Optional[EvaluationStatus] = Query(None, description="Filter by evaluation status"),
    model_used: Optional[EvaluationModel] = Query(None, description="Filter by AI model used"),
    min_score: Optional[float] = Query(None, ge=0, le=100, description="Minimum overall score"),
    max_score: Optional[float] = Query(None, ge=0, le=100, description="Maximum overall score"),
    current_user: dict = Depends(get_current_user)
):
    """Get AI evaluations with filtering and pagination for recruiter's jobs."""
    db = get_database()
    
    # Get recruiter's job IDs
    recruiter_jobs = await db.jobs.find(
        {"recruiter_id": ObjectId(current_user["_id"])},
        {"_id": 1}
    ).to_list(length=None)
    
    if not recruiter_jobs:
        return AIEvaluationListResponse(
            evaluations=[], total=0, page=page, per_page=per_page, total_pages=0
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
    
    if status:
        filter_query["status"] = status
    
    if model_used:
        filter_query["model_used"] = model_used
    
    if min_score is not None or max_score is not None:
        score_filter = {}
        if min_score is not None:
            score_filter["$gte"] = min_score
        if max_score is not None:
            score_filter["$lte"] = max_score
        filter_query["overall_score"] = score_filter
    
    # Get total count
    total = await db.ai_evaluations.count_documents(filter_query)
    
    # Calculate pagination
    skip = (page - 1) * per_page
    total_pages = math.ceil(total / per_page)
    
    # Get evaluations with pagination
    evaluations_cursor = db.ai_evaluations.find(filter_query).skip(skip).limit(per_page).sort("created_at", -1)
    evaluations = await evaluations_cursor.to_list(length=per_page)
    
    return AIEvaluationListResponse(
        evaluations=evaluations,
        total=total,
        page=page,
        per_page=per_page,
        total_pages=total_pages
    )

@router.get("/{evaluation_id}", response_model=AIEvaluationResponse)
async def get_evaluation(
    evaluation_id: str = Path(..., description="AI evaluation ID"),
    current_user: dict = Depends(get_current_user)
):
    """Get a specific AI evaluation by ID."""
    db = get_database()
    
    if not ObjectId.is_valid(evaluation_id):
        raise HTTPException(status_code=400, detail="Invalid evaluation ID format")
    
    evaluation = await db.ai_evaluations.find_one({"_id": ObjectId(evaluation_id)})
    
    if evaluation is None:
        raise HTTPException(status_code=404, detail="AI evaluation not found")
    
    # Verify the evaluation belongs to a job owned by this recruiter
    job = await db.jobs.find_one({
        "_id": evaluation["job_id"],
        "recruiter_id": ObjectId(current_user["_id"])
    })
    
    if job is None:
        raise HTTPException(status_code=403, detail="Access denied to this evaluation")
    
    return evaluation

@router.post("/trigger", response_model=dict, status_code=status.HTTP_202_ACCEPTED)
async def trigger_evaluation(
    trigger_data: AIEvaluationTrigger = Body(...),
    current_user: dict = Depends(get_current_user)
):
    """Trigger AI evaluation for a task submission."""
    db = get_database()
    
    if not ObjectId.is_valid(trigger_data.submission_id):
        raise HTTPException(status_code=400, detail="Invalid submission ID format")
    
    # Get the submission
    submission = await db.task_submissions.find_one({"_id": ObjectId(trigger_data.submission_id)})
    
    if submission is None:
        raise HTTPException(status_code=404, detail="Task submission not found")
    
    # Verify the submission belongs to a job owned by this recruiter
    job = await db.jobs.find_one({
        "_id": submission["job_id"],
        "recruiter_id": ObjectId(current_user["_id"])
    })
    
    if job is None:
        raise HTTPException(status_code=403, detail="Access denied to this submission")
    
    # Check if submission is in a state that can be evaluated
    if submission["status"] != "submitted":
        raise HTTPException(
            status_code=400,
            detail="Submission must be submitted before evaluation"
        )
    
    # Check if evaluation already exists
    existing_evaluation = await db.ai_evaluations.find_one({
        "submission_id": ObjectId(trigger_data.submission_id)
    })
    
    if existing_evaluation and existing_evaluation["status"] in ["completed", "in_progress"]:
        raise HTTPException(
            status_code=400,
            detail="Evaluation already exists or is in progress for this submission"
        )
    
    # Create evaluation record
    evaluation_data = {
        "submission_id": ObjectId(trigger_data.submission_id),
        "job_id": submission["job_id"],
        "candidate_id": submission["candidate_id"],
        "status": EvaluationStatus.PENDING,
        "model_used": trigger_data.model_preference,
        "model_version": "1.0.0",  # This would come from the actual AI service
        "retry_count": 0,
        "created_at": datetime.now(),
        "updated_at": datetime.now()
    }
    
    try:
        new_evaluation = await db.ai_evaluations.insert_one(evaluation_data)
        
        # TODO: Here you would typically:
        # 1. Add the evaluation to a background job queue
        # 2. Call the AI evaluation service asynchronously
        # 3. Update the submission status to "evaluated" when complete
        
        # For now, we'll just return the evaluation ID
        return {
            "evaluation_id": str(new_evaluation.inserted_id),
            "status": "queued",
            "message": "AI evaluation has been queued for processing"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to trigger evaluation: {str(e)}"
        )

@router.post("/bulk-trigger", response_model=dict, status_code=status.HTTP_202_ACCEPTED)
async def bulk_trigger_evaluations(
    bulk_trigger: BulkEvaluationTrigger = Body(...),
    current_user: dict = Depends(get_current_user)
):
    """Trigger AI evaluations for multiple task submissions."""
    db = get_database()
    
    # Validate submission IDs
    submission_ids = []
    for submission_id in bulk_trigger.submission_ids:
        if not ObjectId.is_valid(submission_id):
            raise HTTPException(status_code=400, detail=f"Invalid submission ID format: {submission_id}")
        submission_ids.append(ObjectId(submission_id))
    
    # Get recruiter's job IDs
    recruiter_jobs = await db.jobs.find(
        {"recruiter_id": ObjectId(current_user["_id"])},
        {"_id": 1}
    ).to_list(length=None)
    
    recruiter_job_ids = [job["_id"] for job in recruiter_jobs]
    
    # Get submissions that belong to recruiter's jobs and are submitted
    submissions = await db.task_submissions.find({
        "_id": {"$in": submission_ids},
        "job_id": {"$in": recruiter_job_ids},
        "status": "submitted"
    }).to_list(length=None)
    
    if not submissions:
        raise HTTPException(
            status_code=400,
            detail="No valid submitted submissions found for evaluation"
        )
    
    # Check for existing evaluations
    existing_evaluations = await db.ai_evaluations.find({
        "submission_id": {"$in": [sub["_id"] for sub in submissions]},
        "status": {"$in": ["completed", "in_progress"]}
    }).to_list(length=None)
    
    existing_submission_ids = {eval["submission_id"] for eval in existing_evaluations}
    
    # Filter out submissions that already have evaluations
    submissions_to_evaluate = [
        sub for sub in submissions 
        if sub["_id"] not in existing_submission_ids
    ]
    
    if not submissions_to_evaluate:
        raise HTTPException(
            status_code=400,
            detail="All submissions already have evaluations or are in progress"
        )
    
    # Create evaluation records
    evaluation_records = []
    for submission in submissions_to_evaluate:
        evaluation_data = {
            "submission_id": submission["_id"],
            "job_id": submission["job_id"],
            "candidate_id": submission["candidate_id"],
            "status": EvaluationStatus.PENDING,
            "model_used": bulk_trigger.model_preference,
            "model_version": "1.0.0",
            "retry_count": 0,
            "created_at": datetime.now(),
            "updated_at": datetime.now()
        }
        evaluation_records.append(evaluation_data)
    
    try:
        result = await db.ai_evaluations.insert_many(evaluation_records)
        
        # TODO: Add all evaluations to background job queue
        
        return {
            "queued_count": len(result.inserted_ids),
            "requested_count": len(bulk_trigger.submission_ids),
            "skipped_count": len(bulk_trigger.submission_ids) - len(result.inserted_ids),
            "evaluation_ids": [str(id) for id in result.inserted_ids],
            "status": "queued",
            "message": f"Queued {len(result.inserted_ids)} evaluations for processing"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to bulk trigger evaluations: {str(e)}"
        )

@router.post("/compare", response_model=ComparisonResult)
async def compare_evaluations(
    comparison: EvaluationComparison = Body(...),
    current_user: dict = Depends(get_current_user)
):
    """Compare multiple AI evaluations."""
    db = get_database()
    
    # Validate evaluation IDs
    evaluation_ids = []
    for eval_id in comparison.evaluation_ids:
        if not ObjectId.is_valid(eval_id):
            raise HTTPException(status_code=400, detail=f"Invalid evaluation ID format: {eval_id}")
        evaluation_ids.append(ObjectId(eval_id))
    
    # Get evaluations
    evaluations = await db.ai_evaluations.find({
        "_id": {"$in": evaluation_ids},
        "status": "completed"
    }).to_list(length=None)
    
    if len(evaluations) != len(evaluation_ids):
        raise HTTPException(
            status_code=400,
            detail="Some evaluations not found or not completed"
        )
    
    # Verify all evaluations belong to recruiter's jobs
    job_ids = [eval["job_id"] for eval in evaluations]
    recruiter_jobs = await db.jobs.count_documents({
        "_id": {"$in": job_ids},
        "recruiter_id": ObjectId(current_user["_id"])
    })
    
    if recruiter_jobs != len(set(job_ids)):
        raise HTTPException(status_code=403, detail="Access denied to some evaluations")
    
    # Build comparison data
    comparison_data = {}
    ranking = []
    
    for eval in evaluations:
        eval_id = str(eval["_id"])
        comparison_data[eval_id] = {}
        
        if "overall_score" in comparison.comparison_metrics:
            comparison_data[eval_id]["overall_score"] = eval.get("overall_score")
        
        if "criteria_scores" in comparison.comparison_metrics:
            if eval.get("criteria_evaluations"):
                criteria_scores = {}
                for criterion in eval["criteria_evaluations"]:
                    criteria_scores[criterion["name"]] = criterion["score"]
                comparison_data[eval_id]["criteria_scores"] = criteria_scores
        
        # Add to ranking
        ranking.append({
            "evaluation_id": eval_id,
            "candidate_id": str(eval["candidate_id"]),
            "overall_score": eval.get("overall_score", 0),
            "rank": 0  # Will be calculated below
        })
    
    # Sort by overall score and assign ranks
    ranking.sort(key=lambda x: x["overall_score"], reverse=True)
    for i, item in enumerate(ranking):
        item["rank"] = i + 1
    
    # Generate insights
    insights = []
    if len(evaluations) >= 2:
        scores = [eval.get("overall_score", 0) for eval in evaluations]
        avg_score = sum(scores) / len(scores)
        max_score = max(scores)
        min_score = min(scores)
        
        insights.append(f"Average score across {len(evaluations)} evaluations: {avg_score:.1f}")
        insights.append(f"Score range: {min_score:.1f} - {max_score:.1f}")
        
        if max_score - min_score > 20:
            insights.append("High variance in scores - consider reviewing evaluation criteria")
    
    return ComparisonResult(
        evaluations=evaluations,
        comparison_data=comparison_data,
        ranking=ranking,
        insights=insights
    )

@router.get("/stats/overview", response_model=EvaluationStats)
async def get_evaluation_stats(
    job_id: Optional[str] = Query(None, description="Filter stats by job ID"),
    current_user: dict = Depends(get_current_user)
):
    """Get AI evaluation statistics for recruiter's jobs."""
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
        return EvaluationStats(
            total_evaluations=0,
            by_status={},
            by_model={},
            average_score=None,
            average_processing_time_ms=None,
            total_cost_usd=None,
            success_rate=0.0
        )
    
    # Aggregate evaluation stats
    pipeline = [
        {"$match": {"job_id": {"$in": recruiter_job_ids}}},
        {"$group": {
            "_id": None,
            "total_evaluations": {"$sum": 1},
            "by_status": {"$push": "$status"},
            "by_model": {"$push": "$model_used"},
            "scores": {"$push": "$overall_score"},
            "processing_times": {"$push": "$processing_time_ms"},
            "costs": {"$push": "$cost_usd"},
            "success_count": {
                "$sum": {
                    "$cond": [{"$eq": ["$status", "completed"]}, 1, 0]
                }
            }
        }}
    ]
    
    result = await db.ai_evaluations.aggregate(pipeline).to_list(length=1)
    
    if not result:
        return EvaluationStats(
            total_evaluations=0,
            by_status={},
            by_model={},
            average_score=None,
            average_processing_time_ms=None,
            total_cost_usd=None,
            success_rate=0.0
        )
    
    data = result[0]
    
    # Process status counts
    status_counts = {}
    for status in data["by_status"]:
        status_counts[status] = status_counts.get(status, 0) + 1
    
    # Process model counts
    model_counts = {}
    for model in data["by_model"]:
        model_counts[model] = model_counts.get(model, 0) + 1
    
    # Calculate averages
    valid_scores = [score for score in data["scores"] if score is not None]
    average_score = sum(valid_scores) / len(valid_scores) if valid_scores else None
    
    valid_times = [time for time in data["processing_times"] if time is not None]
    average_processing_time_ms = sum(valid_times) / len(valid_times) if valid_times else None
    
    valid_costs = [cost for cost in data["costs"] if cost is not None]
    total_cost_usd = sum(valid_costs) if valid_costs else None
    
    success_rate = (data["success_count"] / data["total_evaluations"]) * 100 if data["total_evaluations"] > 0 else 0.0
    
    return EvaluationStats(
        total_evaluations=data["total_evaluations"],
        by_status=status_counts,
        by_model=model_counts,
        average_score=average_score,
        average_processing_time_ms=average_processing_time_ms,
        total_cost_usd=total_cost_usd,
        success_rate=success_rate
    )

@router.delete("/{evaluation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_evaluation(
    evaluation_id: str = Path(..., description="AI evaluation ID"),
    current_user: dict = Depends(get_current_user)
):
    """Delete an AI evaluation (only if failed or pending)."""
    db = get_database()
    
    if not ObjectId.is_valid(evaluation_id):
        raise HTTPException(status_code=400, detail="Invalid evaluation ID format")
    
    evaluation = await db.ai_evaluations.find_one({"_id": ObjectId(evaluation_id)})
    
    if evaluation is None:
        raise HTTPException(status_code=404, detail="AI evaluation not found")
    
    # Verify the evaluation belongs to a job owned by this recruiter
    job = await db.jobs.find_one({
        "_id": evaluation["job_id"],
        "recruiter_id": ObjectId(current_user["_id"])
    })
    
    if job is None:
        raise HTTPException(status_code=403, detail="Access denied to this evaluation")
    
    # Only allow deletion of failed or pending evaluations
    if evaluation["status"] not in ["failed", "pending"]:
        raise HTTPException(
            status_code=400,
            detail="Can only delete failed or pending evaluations"
        )
    
    try:
        await db.ai_evaluations.delete_one({"_id": ObjectId(evaluation_id)})
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete evaluation: {str(e)}"
        )