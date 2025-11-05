from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from app.models.task import TaskDifficulty, TaskStatus

class TaskCreate(BaseModel):
    title: str
    startup: str
    description: str
    deadline: datetime
    reward_points: int = Field(..., alias="rewardPoints")
    difficulty: TaskDifficulty

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    startup: Optional[str] = None
    description: Optional[str] = None
    deadline: Optional[datetime] = None
    reward_points: Optional[int] = Field(None, alias="rewardPoints")
    difficulty: Optional[TaskDifficulty] = None
    status: Optional[TaskStatus] = None
    progress: Optional[int] = None

class TaskResponse(BaseModel):
    id: str = Field(..., alias="_id")
    title: str
    startup: str
    description: str
    deadline: datetime
    reward_points: int = Field(..., alias="rewardPoints")
    difficulty: TaskDifficulty
    status: TaskStatus
    progress: int
    created_at: datetime
    created_by: str

    model_config = {
        "populate_by_name": True,
        "json_schema_extra": {
            "example": {
                "_id": "60d5ec9af682fbd12a0a38d7",
                "title": "Create Landing Page",
                "startup": "TechStartup",
                "description": "Design and implement a responsive landing page",
                "deadline": "2023-12-31T23:59:59",
                "rewardPoints": 100,
                "difficulty": "Medium",
                "status": "Pending",
                "progress": 0,
                "created_at": "2023-06-21T15:30:00",
                "created_by": "60d5ec9af682fbd12a0a38d6"
            }
        }
    }