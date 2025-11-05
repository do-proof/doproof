from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class DateRange(BaseModel):
    start_date: datetime
    end_date: datetime

class MetricFilter(BaseModel):
    date_range: Optional[DateRange] = None
    job_ids: Optional[List[str]] = None
    candidate_ids: Optional[List[str]] = None
    recruiter_ids: Optional[List[str]] = None
    company_id: Optional[str] = None

class TaskCompletionMetrics(BaseModel):
    total_tasks_assigned: int
    total_tasks_started: int
    total_tasks_completed: int
    total_tasks_submitted: int
    completion_rate: float
    submission_rate: float
    average_time_spent: Optional[float]  # in minutes
    median_time_spent: Optional[float]
    time_limit_exceeded_count: int
    time_limit_exceeded_rate: float

class AIEvaluationMetrics(BaseModel):
    total_evaluations: int
    average_overall_score: Optional[float]
    median_overall_score: Optional[float]
    score_distribution: Dict[str, int]  # score ranges to counts
    criteria_averages: Dict[str, float]
    top_performing_criteria: List[Dict[str, Any]]
    bottom_performing_criteria: List[Dict[str, Any]]
    evaluation_processing_time_avg: Optional[float]  # in milliseconds

class CriteriaPerformanceAnalysis(BaseModel):
    criterion_name: str
    average_score: float
    median_score: float
    score_distribution: Dict[str, int]
    weight_usage: float  # average weight assigned to this criterion
    correlation_with_overall: float
    top_performers: List[Dict[str, Any]]
    improvement_suggestions: List[str]

class CandidateRankingMetrics(BaseModel):
    total_candidates_evaluated: int
    top_10_percent_threshold: Optional[float]
    top_25_percent_threshold: Optional[float]
    median_score: Optional[float]
    score_variance: Optional[float]
    ranking_distribution: Dict[str, int]  # percentile ranges to counts

class JobPerformanceMetrics(BaseModel):
    job_id: str
    job_title: str
    total_applications: int
    total_submissions: int
    total_evaluations: int
    application_to_submission_rate: float
    submission_to_evaluation_rate: float
    average_score: Optional[float]
    top_score: Optional[float]
    candidate_quality_score: Optional[float]
    time_to_hire: Optional[float]  # in days
    cost_per_hire: Optional[float]

class RecruitmentFunnelMetrics(BaseModel):
    job_views: int
    applications_started: int
    applications_completed: int
    tasks_started: int
    tasks_submitted: int
    evaluations_completed: int
    interviews_scheduled: int
    interviews_completed: int
    offers_made: int
    offers_accepted: int
    
    # Conversion rates
    view_to_application_rate: float
    application_to_task_rate: float
    task_to_submission_rate: float
    submission_to_interview_rate: float
    interview_to_offer_rate: float
    offer_to_acceptance_rate: float

class TimeSeriesData(BaseModel):
    date: str
    value: float
    label: Optional[str] = None

class TrendAnalysis(BaseModel):
    metric_name: str
    time_series: List[TimeSeriesData]
    trend_direction: str  # "increasing", "decreasing", "stable"
    trend_strength: float  # 0-1, how strong the trend is
    seasonal_patterns: List[str]
    anomalies: List[Dict[str, Any]]

class CompetitiveAnalysis(BaseModel):
    industry_benchmarks: Dict[str, float]
    company_performance: Dict[str, float]
    performance_gaps: Dict[str, float]
    recommendations: List[str]

class AnalyticsResponse(BaseModel):
    task_completion: TaskCompletionMetrics
    ai_evaluation: AIEvaluationMetrics
    criteria_performance: List[CriteriaPerformanceAnalysis]
    candidate_ranking: CandidateRankingMetrics
    job_performance: List[JobPerformanceMetrics]
    recruitment_funnel: RecruitmentFunnelMetrics
    trends: List[TrendAnalysis]
    competitive_analysis: Optional[CompetitiveAnalysis]
    generated_at: datetime
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "task_completion": {
                    "total_tasks_assigned": 150,
                    "total_tasks_started": 120,
                    "total_tasks_completed": 95,
                    "total_tasks_submitted": 90,
                    "completion_rate": 79.17,
                    "submission_rate": 94.74,
                    "average_time_spent": 85.5,
                    "median_time_spent": 78.0,
                    "time_limit_exceeded_count": 15,
                    "time_limit_exceeded_rate": 12.5
                },
                "ai_evaluation": {
                    "total_evaluations": 90,
                    "average_overall_score": 76.8,
                    "median_overall_score": 78.5,
                    "score_distribution": {
                        "0-20": 2,
                        "21-40": 8,
                        "41-60": 25,
                        "61-80": 35,
                        "81-100": 20
                    },
                    "criteria_averages": {
                        "critical_thinking": 75.2,
                        "problem_solving": 78.9,
                        "creativity": 72.1,
                        "technical_skills": 80.5,
                        "communication": 74.8,
                        "attention_to_detail": 77.3
                    },
                    "evaluation_processing_time_avg": 2350.5
                },
                "recruitment_funnel": {
                    "job_views": 1250,
                    "applications_started": 200,
                    "applications_completed": 150,
                    "tasks_started": 120,
                    "tasks_submitted": 90,
                    "evaluations_completed": 90,
                    "interviews_scheduled": 25,
                    "interviews_completed": 20,
                    "offers_made": 5,
                    "offers_accepted": 3,
                    "view_to_application_rate": 16.0,
                    "application_to_task_rate": 80.0,
                    "task_to_submission_rate": 75.0,
                    "submission_to_interview_rate": 27.78,
                    "interview_to_offer_rate": 25.0,
                    "offer_to_acceptance_rate": 60.0
                },
                "generated_at": "2023-06-21T15:30:00"
            }
        }
    }

class CustomReportRequest(BaseModel):
    report_name: str
    metrics: List[str]
    filters: MetricFilter
    grouping: Optional[List[str]] = None  # Group by job, candidate, date, etc.
    visualization_type: Optional[str] = "table"  # table, chart, graph
    export_format: Optional[str] = "json"  # json, csv, pdf

class ReportResponse(BaseModel):
    report_id: str
    report_name: str
    data: Dict[str, Any]
    metadata: Dict[str, Any]
    generated_at: datetime
    expires_at: Optional[datetime]
    download_url: Optional[str]

class DashboardWidget(BaseModel):
    widget_id: str
    widget_type: str  # "metric", "chart", "table", "trend"
    title: str
    data: Dict[str, Any]
    position: Dict[str, int]  # x, y, width, height
    refresh_interval: Optional[int] = None  # in seconds

class DashboardConfig(BaseModel):
    dashboard_id: str
    name: str
    widgets: List[DashboardWidget]
    layout: str = "grid"
    auto_refresh: bool = False
    refresh_interval: int = 300  # 5 minutes default

class AlertRule(BaseModel):
    rule_id: str
    name: str
    metric: str
    condition: str  # "greater_than", "less_than", "equals", "percentage_change"
    threshold: float
    time_window: int  # in minutes
    notification_channels: List[str]  # email, slack, webhook
    is_active: bool = True

class AlertResponse(BaseModel):
    alert_id: str
    rule_id: str
    triggered_at: datetime
    metric_value: float
    threshold: float
    message: str
    severity: str  # "low", "medium", "high", "critical"
    acknowledged: bool = False