from fastapi import APIRouter, Body, Depends, HTTPException, status, Path
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.auth import get_current_user
from app.core.database import get_database
from app.models.task import TaskModel
from app.schemas.task import TaskCreate, TaskUpdate, TaskResponse

router = APIRouter(tags=["tasks"])

@router.get("/tasks", response_model=List[TaskResponse])
async def get_tasks(db: AsyncSession = Depends(get_database)):
    result = await db.execute(select(TaskModel))
    tasks = result.scalars().all()
    return tasks

@router.get("/tasks/{task_id}", response_model=TaskResponse)
async def get_task(task_id: int = Path(...), db: AsyncSession = Depends(get_database)):
    result = await db.execute(select(TaskModel).where(TaskModel.id == task_id))
    task = result.scalar_one_or_none()
    
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    return task

@router.post("/tasks", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    task: TaskCreate = Body(...),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_database)
):
    task_dict = task.dict()
    task_dict["created_by"] = current_user["id"]
    
    db_task = TaskModel(**task_dict)
    db.add(db_task)
    await db.commit()
    await db.refresh(db_task)
    
    return db_task

@router.put("/tasks/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: int = Path(...),
    task_update: TaskUpdate = Body(...),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_database)
):
    result = await db.execute(select(TaskModel).where(TaskModel.id == task_id))
    existing_task = result.scalar_one_or_none()
    
    if not existing_task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    if existing_task.created_by != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized to update this task")
    
    update_dict = task_update.dict(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(existing_task, key, value)
    
    await db.commit()
    await db.refresh(existing_task)
    
    return existing_task

@router.delete("/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_id: int = Path(...),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_database)
):
    result = await db.execute(select(TaskModel).where(TaskModel.id == task_id))
    existing_task = result.scalar_one_or_none()
    
    if not existing_task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    if existing_task.created_by != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized to delete this task")
    
    await db.delete(existing_task)
    await db.commit()
    
    return None