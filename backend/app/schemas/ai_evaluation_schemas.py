from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from app.models.ai_evaluation import (
    EvaluationStatus, EvaluationModel, CriterionEvaluation, 
    EvaluationInsight
)

class AIEvaluationTrigger(BaseModel):
    submission_id: str
    model_preference: Optional[EvaluationModel] = EvaluationModel.GPT4_EVALUATION_V1
    priority: Optional[str] = Field("normal", pattern="^(low|normal|high|urgent)$")

class AIEvaluationResponse(BaseModel):
    id: str = Field(..., alias="_id")
    submission_id: str
    job_id: str
    candidate_id: str
    status: EvaluationStatus
    model_used: EvaluationModel
    model_version: str
    overall_score: Optional[float]
    criteria_evaluations: Optional[List[CriterionEvaluation]]
    summary_feedback: Optional[str]
    detailed_feedback: Optional[str]
    insights: Optional[List[EvaluationInsight]]
    percentile_rank: Optional[float]
    comparison_group_size: Optional[int]
    processing_time_ms: Optional[int]
    tokens_used: Optional[int]
    cost_usd: Optional[float]
    error_message: Optional[str]
    retry_count: int
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    
    model_config = {
        "populate_by_name": True,
        "json_schema_extra": {
            "example": {
                "_id": "60d5ec9af682fbd12a0a38d7",
                "submission_id": "60d5ec9af682fbd12a0a38d8",
                "job_id": "60d5ec9af682fbd12a0a38d9",
                "candidate_id": "60d5ec9af682fbd12a0a38da",
                "status": "completed",
                "model_used": "gpt-4-evaluation-v1",
                "model_version": "1.0.0",
                "overall_score": 85.5,
                "criteria_evaluations": [
                    {
                        "name": "critical_thinking",
                        "score": 80,
                        "weight": 25,
                        "feedback": "Shows good analytical thinking",
                        "reasoning": "The candidate demonstrated strong problem decomposition skills"
                    }
                ],
                "summary_feedback": "Strong overall performance with excellent technical skills",
                "detailed_feedback": "The candidate showed exceptional understanding of API design principles...",
                "insights": [
                    {
                        "category": "strengths",
                        "title": "Technical Expertise",
                        "description": "Demonstrates deep understanding of RESTful principles",
                        "impact": "high"
                    }
                ],
                "percentile_rank": 85,
                "comparison_group_size": 150,
                "processing_time_ms": 2500,
                "tokens_used": 1200,
                "cost_usd": 0.024,
                "retry_count": 0,
                "started_at": "2023-06-21T17:00:00",
                "completed_at": "2023-06-21T17:02:30",
                "created_at": "2023-06-21T17:00:00",
                "updated_at": "2023-06-21T17:02:30"
            }
        }
    }

class AIEvaluationListResponse(BaseModel):
    evaluations: List[AIEvaluationResponse]
    total: int
    page: int
    per_page: int
    total_pages: int

class EvaluationFilters(BaseModel):
    job_id: Optional[str] = None
    candidate_id: Optional[str] = None
    status: Optional[EvaluationStatus] = None
    model_used: Optional[EvaluationModel] = None
    min_score: Optional[float] = Field(None, ge=0, le=100)
    max_score: Optional[float] = Field(None, ge=0, le=100)
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None

class EvaluationStats(BaseModel):
    total_evaluations: int
    by_status: dict
    by_model: dict
    average_score: Optional[float]
    average_processing_time_ms: Optional[float]
    total_cost_usd: Optional[float]
    success_rate: float

class BulkEvaluationTrigger(BaseModel):
    submission_ids: List[str]
    model_preference: Optional[EvaluationModel] = EvaluationModel.GPT4_EVALUATION_V1
    priority: Optional[str] = Field("normal", pattern="^(low|normal|high|urgent)$")

class EvaluationComparison(BaseModel):
    evaluation_ids: List[str]
    comparison_metrics: List[str] = ["overall_score", "criteria_scores"]
    
class ComparisonResult(BaseModel):
    evaluations: List[AIEvaluationResponse]
    comparison_data: dict
    ranking: List[dict]
    insights: List[str]