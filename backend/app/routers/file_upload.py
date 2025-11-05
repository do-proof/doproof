"""
Secure file upload router for DoProof application.
Handles resume uploads, task submissions, and company media with security validation.
"""

import os
import uuid
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Request
from fastapi.responses import FileResponse
from bson import ObjectId

from app.core.auth import get_current_user, require_recruiter
from app.core.database import get_database
from app.core.security import (
    FileUploadSecurity, InputSanitizer, AuditLogger, 
    CompanyIsolation, get_client_ip, SecurityError, audit_action
)
from app.models.user import UserRole

router = APIRouter(tags=["file-upload"], prefix="/files")

# Configure upload directories
UPLOAD_BASE_DIR = "uploads"
RESUME_DIR = os.path.join(UPLOAD_BASE_DIR, "resumes")
SUBMISSION_DIR = os.path.join(UPLOAD_BASE_DIR, "submissions")
COMPANY_MEDIA_DIR = os.path.join(UPLOAD_BASE_DIR, "company")

# Ensure upload directories exist
for directory in [RESUME_DIR, SUBMISSION_DIR, COMPANY_MEDIA_DIR]:
    os.makedirs(directory, exist_ok=True)

@router.post("/resume")
@audit_action("UPLOAD_RESUME", "file")
async def upload_resume(
    request: Request,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """Upload a resume file with security validation."""
    
    # Validate file upload
    try:
        safe_filename = FileUploadSecurity.validate_resume_upload(
            filename=file.filename,
            file_size=file.size,
            file_type=file.content_type
        )
    except SecurityError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    # Generate unique filename
    file_extension = '.' + safe_filename.split('.')[-1].lower()
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(RESUME_DIR, unique_filename)
    
    try:
        # Save file
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        # Store file metadata in database
        db = get_database()
        file_metadata = {
            "user_id": ObjectId(current_user["_id"]),
            "original_filename": safe_filename,
            "stored_filename": unique_filename,
            "file_path": file_path,
            "file_size": file.size,
            "content_type": file.content_type,
            "upload_type": "resume",
            "created_at": datetime.utcnow()
        }
        
        result = await db.file_uploads.insert_one(file_metadata)
        
        # Log successful upload
        ip_address = await get_client_ip(request)
        await AuditLogger.log_to_database(
            user_id=str(current_user["_id"]),
            action="RESUME_UPLOADED",
            resource_type="file",
            resource_id=str(result.inserted_id),
            details={"filename": safe_filename, "size": file.size},
            ip_address=ip_address
        )
        
        return {
            "file_id": str(result.inserted_id),
            "filename": safe_filename,
            "size": file.size,
            "message": "Resume uploaded successfully"
        }
        
    except Exception as e:
        # Clean up file if database operation fails
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to upload resume: {str(e)}"
        )

@router.post("/submission/{job_id}")
@audit_action("UPLOAD_SUBMISSION", "file")
async def upload_task_submission(
    request: Request,
    job_id: str,
    file: UploadFile = File(...),
    submission_id: str = Form(...),
    current_user: dict = Depends(get_current_user)
):
    """Upload a task submission file with security validation."""
    
    # Validate job ID and submission ID
    try:
        job_object_id = InputSanitizer.validate_object_id(job_id)
        submission_object_id = InputSanitizer.validate_object_id(submission_id)
    except SecurityError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    # Validate file upload
    try:
        safe_filename = FileUploadSecurity.validate_submission_upload(
            filename=file.filename,
            file_size=file.size,
            file_type=file.content_type
        )
    except SecurityError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    db = get_database()
    
    # Verify submission belongs to current user
    submission = await db.task_submissions.find_one({
        "_id": submission_object_id,
        "candidate_id": ObjectId(current_user["_id"]),
        "job_id": job_object_id
    })
    
    if not submission:
        ip_address = await get_client_ip(request)
        AuditLogger.log_action(
            user_id=str(current_user["_id"]),
            action="UNAUTHORIZED_SUBMISSION_UPLOAD_ATTEMPT",
            resource_type="file",
            resource_id=submission_id,
            ip_address=ip_address
        )
        raise HTTPException(status_code=404, detail="Submission not found")
    
    # Generate unique filename
    file_extension = '.' + safe_filename.split('.')[-1].lower()
    unique_filename = f"{submission_id}_{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(SUBMISSION_DIR, unique_filename)
    
    try:
        # Save file
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        # Update submission with file information
        await db.task_submissions.update_one(
            {"_id": submission_object_id},
            {
                "$set": {
                    "submission.file_url": file_path,
                    "submission.file_name": safe_filename,
                    "submission.file_size": file.size,
                    "submission.type": "file"
                }
            }
        )
        
        # Store file metadata
        file_metadata = {
            "user_id": ObjectId(current_user["_id"]),
            "submission_id": submission_object_id,
            "job_id": job_object_id,
            "original_filename": safe_filename,
            "stored_filename": unique_filename,
            "file_path": file_path,
            "file_size": file.size,
            "content_type": file.content_type,
            "upload_type": "submission",
            "created_at": datetime.utcnow()
        }
        
        result = await db.file_uploads.insert_one(file_metadata)
        
        # Log successful upload
        ip_address = await get_client_ip(request)
        await AuditLogger.log_to_database(
            user_id=str(current_user["_id"]),
            action="SUBMISSION_FILE_UPLOADED",
            resource_type="file",
            resource_id=str(result.inserted_id),
            details={
                "filename": safe_filename, 
                "size": file.size,
                "submission_id": submission_id,
                "job_id": job_id
            },
            ip_address=ip_address
        )
        
        return {
            "file_id": str(result.inserted_id),
            "filename": safe_filename,
            "size": file.size,
            "message": "Submission file uploaded successfully"
        }
        
    except Exception as e:
        # Clean up file if operation fails
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to upload submission file: {str(e)}"
        )

@router.post("/company/media")
@audit_action("UPLOAD_COMPANY_MEDIA", "file")
async def upload_company_media(
    request: Request,
    file: UploadFile = File(...),
    media_type: str = Form(...),  # logo, banner, etc.
    current_user: dict = Depends(require_recruiter)
):
    """Upload company media files with security validation."""
    
    # Validate media type
    allowed_media_types = ["logo", "banner", "gallery"]
    if media_type not in allowed_media_types:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid media type. Allowed: {allowed_media_types}"
        )
    
    # Validate file upload
    try:
        safe_filename = FileUploadSecurity.validate_image_upload(
            filename=file.filename,
            file_size=file.size,
            file_type=file.content_type
        )
    except SecurityError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    # Generate unique filename
    file_extension = '.' + safe_filename.split('.')[-1].lower()
    unique_filename = f"{media_type}_{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(COMPANY_MEDIA_DIR, unique_filename)
    
    try:
        # Save file
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        # Store file metadata
        db = get_database()
        file_metadata = {
            "user_id": ObjectId(current_user["_id"]),
            "company_id": ObjectId(current_user.get("company_id", current_user["_id"])),
            "original_filename": safe_filename,
            "stored_filename": unique_filename,
            "file_path": file_path,
            "file_size": file.size,
            "content_type": file.content_type,
            "upload_type": "company_media",
            "media_type": media_type,
            "created_at": datetime.utcnow()
        }
        
        result = await db.file_uploads.insert_one(file_metadata)
        
        # Log successful upload
        ip_address = await get_client_ip(request)
        await AuditLogger.log_to_database(
            user_id=str(current_user["_id"]),
            action="COMPANY_MEDIA_UPLOADED",
            resource_type="file",
            resource_id=str(result.inserted_id),
            details={
                "filename": safe_filename, 
                "size": file.size,
                "media_type": media_type
            },
            ip_address=ip_address
        )
        
        return {
            "file_id": str(result.inserted_id),
            "filename": safe_filename,
            "size": file.size,
            "media_type": media_type,
            "url": f"/api/files/company/{result.inserted_id}",
            "message": "Company media uploaded successfully"
        }
        
    except Exception as e:
        # Clean up file if operation fails
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to upload company media: {str(e)}"
        )

@router.get("/download/{file_id}")
async def download_file(
    request: Request,
    file_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Download a file with access control."""
    
    # Validate file ID
    try:
        file_object_id = InputSanitizer.validate_object_id(file_id)
    except SecurityError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    db = get_database()
    
    # Get file metadata
    file_metadata = await db.file_uploads.find_one({"_id": file_object_id})
    
    if not file_metadata:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Check access permissions
    user_role = current_user.get("role")
    user_id = ObjectId(current_user["_id"])
    
    # Users can access their own files
    if file_metadata["user_id"] == user_id:
        access_granted = True
    # Recruiters can access submission files for their jobs
    elif user_role == UserRole.RECRUITER and file_metadata.get("upload_type") == "submission":
        # Check if the submission belongs to recruiter's job
        if "job_id" in file_metadata:
            job = await db.jobs.find_one({
                "_id": file_metadata["job_id"],
                "recruiter_id": user_id
            })
            access_granted = bool(job)
        else:
            access_granted = False
    # Admins can access everything
    elif user_role == UserRole.ADMIN:
        access_granted = True
    else:
        access_granted = False
    
    if not access_granted:
        # Log unauthorized access attempt
        ip_address = await get_client_ip(request)
        AuditLogger.log_action(
            user_id=str(current_user["_id"]),
            action="UNAUTHORIZED_FILE_ACCESS_ATTEMPT",
            resource_type="file",
            resource_id=file_id,
            ip_address=ip_address
        )
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Check if file exists on disk
    file_path = file_metadata["file_path"]
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found on disk")
    
    # Log file access
    ip_address = await get_client_ip(request)
    await AuditLogger.log_to_database(
        user_id=str(current_user["_id"]),
        action="FILE_DOWNLOADED",
        resource_type="file",
        resource_id=file_id,
        details={"filename": file_metadata["original_filename"]},
        ip_address=ip_address
    )
    
    return FileResponse(
        path=file_path,
        filename=file_metadata["original_filename"],
        media_type=file_metadata["content_type"]
    )

@router.delete("/{file_id}")
@audit_action("DELETE_FILE", "file")
async def delete_file(
    request: Request,
    file_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a file with access control."""
    
    # Validate file ID
    try:
        file_object_id = InputSanitizer.validate_object_id(file_id)
    except SecurityError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    db = get_database()
    
    # Get file metadata
    file_metadata = await db.file_uploads.find_one({"_id": file_object_id})
    
    if not file_metadata:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Check if user owns the file or is admin
    user_role = current_user.get("role")
    user_id = ObjectId(current_user["_id"])
    
    if file_metadata["user_id"] != user_id and user_role != UserRole.ADMIN:
        # Log unauthorized access attempt
        ip_address = await get_client_ip(request)
        AuditLogger.log_action(
            user_id=str(current_user["_id"]),
            action="UNAUTHORIZED_FILE_DELETE_ATTEMPT",
            resource_type="file",
            resource_id=file_id,
            ip_address=ip_address
        )
        raise HTTPException(status_code=403, detail="Access denied")
    
    try:
        # Delete file from disk
        file_path = file_metadata["file_path"]
        if os.path.exists(file_path):
            os.remove(file_path)
        
        # Delete metadata from database
        await db.file_uploads.delete_one({"_id": file_object_id})
        
        # Log successful deletion
        ip_address = await get_client_ip(request)
        await AuditLogger.log_to_database(
            user_id=str(current_user["_id"]),
            action="FILE_DELETED",
            resource_type="file",
            resource_id=file_id,
            details={"filename": file_metadata["original_filename"]},
            ip_address=ip_address
        )
        
        return {"message": "File deleted successfully"}
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete file: {str(e)}"
        )