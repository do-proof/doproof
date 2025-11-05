from datetime import datetime
from enum import Enum
from sqlalchemy import Column, String, DateTime, Integer, Enum as SQLEnum, ForeignKey
from app.models.common import BaseModel

class TaskDifficulty(str, Enum):
    EASY = "Easy"
    MEDIUM = "Medium"
    HARD = "Hard"

class TaskStatus(str, Enum):
    PENDING = "Pending"
    IN_PROGRESS = "In Progress"
    COMPLETED = "Completed"

class TaskModel(BaseModel):
    __tablename__ = "tasks"
    
    title = Column(String, nullable=False)
    startup = Column(String, nullable=False)
    description = Column(String, nullable=False)
    deadline = Column(DateTime, nullable=False)
    reward_points = Column(Integer, nullable=False)
    difficulty = Column(SQLEnum(TaskDifficulty), nullable=False)
    status = Column(SQLEnum(TaskStatus), default=TaskStatus.PENDING, nullable=False)
    progress = Column(Integer, default=0)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)