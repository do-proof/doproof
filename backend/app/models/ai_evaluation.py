from datetime import datetime
from enum import Enum
from typing import Optional, List, Dict, Any
from pydantic import Field
from bson import ObjectId
from app.models.common import PyObjectId, BaseModel

class EvaluationStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"

class EvaluationModel(str, Enum):
    GPT4_EVALUATION_V1 = "gpt-4-evaluation-v1"
    GPT4_EVALUATION_V2 = "gpt-4-evaluation-v2"
    CLAUDE_EVALUATION_V1 = "claude-evaluation-v1"

class CriterionEvaluation(BaseModel):
    name: str
    score: float = Field(..., ge=0, le=100)
    weight: int = Field(..., ge=0, le=100)
    feedback: str
    reasoning: str

class EvaluationInsight(BaseModel):
    category: str  # e.g., "strengths", "weaknesses", "suggestions"
    title: str
    description: str
    impact: str = Field(..., pattern="^(high|medium|low)$")

class AIEvaluationModel(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    submission_id: PyObjectId
    job_id: PyObjectId
    candidate_id: PyObjectId
    
    # Evaluation metadata
    status: EvaluationStatus = EvaluationStatus.PENDING
    model_used: EvaluationModel
    model_version: str
    
    # Evaluation results
    overall_score: Optional[float] = Field(None, ge=0, le=100)
    criteria_evaluations: Optional[List[CriterionEvaluation]] = None
    
    # Detailed feedback
    summary_feedback: Optional[str] = None
    detailed_feedback: Optional[str] = None
    insights: Optional[List[EvaluationInsight]] = None
    
    # Ranking and comparison
    percentile_rank: Optional[float] = Field(None, ge=0, le=100)
    comparison_group_size: Optional[int] = None
    
    # Processing metadata
    processing_time_ms: Optional[int] = None
    tokens_used: Optional[int] = None
    cost_usd: Optional[float] = None
    
    # Error handling
    error_message: Optional[str] = None
    retry_count: int = 0
    
    # Timestamps
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    
    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {ObjectId: str},
        "json_schema_extra": {
            "example": {
                "submission_id": "507f1f77bcf86cd799439011",
                "job_id": "507f1f77bcf86cd799439012",
                "candidate_id": "507f1f77bcf86cd799439013",
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
                "cost_usd": 0.024
            }
        }
    }