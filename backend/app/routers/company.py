from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Body, Depends, HTTPException, status, Path, Query
from bson import ObjectId
import math

from app.core.auth import get_current_user
from app.core.database import get_database
from app.models.company import CompanyModel
from app.schemas.company_schemas import (
    CompanyCreate, CompanyUpdate, TeamMemberAdd, TeamMemberUpdate,
    CompanyResponse, CompanyListResponse, CompanyFilters, CompanyStats,
    CompanyBrandingUpdate, CompanyVerificationRequest, CompanyInviteRequest,
    CompanyPublicProfile
)

router = APIRouter(tags=["company"], prefix="/company")

@router.get("/profile", response_model=CompanyResponse)
async def get_company_profile(
    current_user: dict = Depends(get_current_user)
):
    """Get the company profile for the current user."""
    db = get_database()
    
    # Find company where user is owner or team member
    company = await db.companies.find_one({
        "$or": [
            {"owner_id": ObjectId(current_user["_id"])},
            {"team_members.user_id": ObjectId(current_user["_id"])}
        ]
    })
    
    if company is None:
        raise HTTPException(status_code=404, detail="Company profile not found")
    
    return company

@router.post("/profile", response_model=CompanyResponse, status_code=status.HTTP_201_CREATED)
async def create_company_profile(
    company: CompanyCreate = Body(...),
    current_user: dict = Depends(get_current_user)
):
    """Create a new company profile."""
    db = get_database()
    
    # Check if user already has a company
    existing_company = await db.companies.find_one({
        "$or": [
            {"owner_id": ObjectId(current_user["_id"])},
            {"team_members.user_id": ObjectId(current_user["_id"])}
        ]
    })
    
    if existing_company:
        raise HTTPException(
            status_code=400,
            detail="User already belongs to a company"
        )
    
    # Prepare company data
    company_dict = company.dict(by_alias=True)
    company_dict["owner_id"] = ObjectId(current_user["_id"])
    
    # Initialize team members with the owner
    company_dict["team_members"] = [{
        "user_id": ObjectId(current_user["_id"]),
        "name": current_user["name"],
        "email": current_user["email"],
        "role": "Owner",
        "permissions": ["all"],
        "joined_at": datetime.now(),
        "is_active": True
    }]
    
    # Set timestamps and defaults
    now = datetime.now()
    company_dict["created_at"] = now
    company_dict["updated_at"] = now
    company_dict["total_jobs_posted"] = 0
    company_dict["total_applications_received"] = 0
    company_dict["total_hires"] = 0
    company_dict["is_active"] = True
    company_dict["is_verified"] = False
    
    # Initialize nested objects if not provided
    if "branding" not in company_dict:
        company_dict["branding"] = {}
    if "social_links" not in company_dict:
        company_dict["social_links"] = {}
    if "benefits" not in company_dict:
        company_dict["benefits"] = {}
    if "recruitment_settings" not in company_dict:
        company_dict["recruitment_settings"] = {}
    
    try:
        new_company = await db.companies.insert_one(company_dict)
        created_company = await db.companies.find_one({"_id": new_company.inserted_id})
        
        # Update user's company_id
        await db.users.update_one(
            {"_id": ObjectId(current_user["_id"])},
            {"$set": {"company_id": str(new_company.inserted_id)}}
        )
        
        return created_company
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create company profile: {str(e)}"
        )

@router.put("/profile", response_model=CompanyResponse)
async def update_company_profile(
    company_update: CompanyUpdate = Body(...),
    current_user: dict = Depends(get_current_user)
):
    """Update company profile."""
    db = get_database()
    
    # Find company where user is owner or has admin permissions
    company = await db.companies.find_one({
        "$or": [
            {"owner_id": ObjectId(current_user["_id"])},
            {
                "team_members": {
                    "$elemMatch": {
                        "user_id": ObjectId(current_user["_id"]),
                        "permissions": {"$in": ["all", "manage_company"]}
                    }
                }
            }
        ]
    })
    
    if company is None:
        raise HTTPException(status_code=403, detail="Access denied to company profile")
    
    # Prepare update data
    update_data = {k: v for k, v in company_update.dict(by_alias=True).items() if v is not None}
    
    if update_data:
        update_data["updated_at"] = datetime.now()
        
        try:
            await db.companies.update_one(
                {"_id": company["_id"]},
                {"$set": update_data}
            )
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to update company profile: {str(e)}"
            )
    
    updated_company = await db.companies.find_one({"_id": company["_id"]})
    return updated_company

@router.put("/branding", response_model=CompanyResponse)
async def update_company_branding(
    branding: CompanyBrandingUpdate = Body(...),
    current_user: dict = Depends(get_current_user)
):
    """Update company branding."""
    db = get_database()
    
    # Find company where user has branding permissions
    company = await db.companies.find_one({
        "$or": [
            {"owner_id": ObjectId(current_user["_id"])},
            {
                "team_members": {
                    "$elemMatch": {
                        "user_id": ObjectId(current_user["_id"]),
                        "permissions": {"$in": ["all", "manage_company", "manage_branding"]}
                    }
                }
            }
        ]
    })
    
    if company is None:
        raise HTTPException(status_code=403, detail="Access denied to company branding")
    
    # Prepare branding update
    branding_data = {k: v for k, v in branding.dict().items() if v is not None}
    
    # Update nested branding object
    update_data = {}
    for key, value in branding_data.items():
        update_data[f"branding.{key}"] = value
    
    update_data["updated_at"] = datetime.now()
    
    try:
        await db.companies.update_one(
            {"_id": company["_id"]},
            {"$set": update_data}
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update company branding: {str(e)}"
        )
    
    updated_company = await db.companies.find_one({"_id": company["_id"]})
    return updated_company

@router.post("/team/invite", response_model=dict, status_code=status.HTTP_202_ACCEPTED)
async def invite_team_member(
    invite: CompanyInviteRequest = Body(...),
    current_user: dict = Depends(get_current_user)
):
    """Invite a new team member to the company."""
    db = get_database()
    
    # Find company where user is owner or has team management permissions
    company = await db.companies.find_one({
        "$or": [
            {"owner_id": ObjectId(current_user["_id"])},
            {
                "team_members": {
                    "$elemMatch": {
                        "user_id": ObjectId(current_user["_id"]),
                        "permissions": {"$in": ["all", "manage_team"]}
                    }
                }
            }
        ]
    })
    
    if company is None:
        raise HTTPException(status_code=403, detail="Access denied to team management")
    
    # Check if user is already a team member
    existing_member = next(
        (member for member in company.get("team_members", []) if member["email"] == invite.email),
        None
    )
    
    if existing_member:
        raise HTTPException(
            status_code=400,
            detail="User is already a team member"
        )
    
    # Create invitation record
    invitation_data = {
        "company_id": company["_id"],
        "invited_by": ObjectId(current_user["_id"]),
        "email": invite.email,
        "role": invite.role,
        "permissions": invite.permissions,
        "personal_message": invite.personal_message,
        "status": "pending",
        "invited_at": datetime.now(),
        "expires_at": datetime.now() + timedelta(days=7)
    }
    
    try:
        await db.team_invitations.insert_one(invitation_data)
        
        # TODO: Send actual invitation email
        
        return {
            "status": "sent",
            "message": f"Invitation sent to {invite.email}"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to send invitation: {str(e)}"
        )

@router.post("/team/add", response_model=CompanyResponse)
async def add_team_member(
    member: TeamMemberAdd = Body(...),
    current_user: dict = Depends(get_current_user)
):
    """Add a team member to the company (direct add, not invitation)."""
    db = get_database()
    
    # Find company where user is owner
    company = await db.companies.find_one({"owner_id": ObjectId(current_user["_id"])})
    
    if company is None:
        raise HTTPException(status_code=403, detail="Only company owner can directly add team members")
    
    # Validate user exists
    if not ObjectId.is_valid(member.user_id):
        raise HTTPException(status_code=400, detail="Invalid user ID format")
    
    user = await db.users.find_one({"_id": ObjectId(member.user_id)})
    
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if user is already a team member
    existing_member = next(
        (m for m in company.get("team_members", []) if str(m["user_id"]) == member.user_id),
        None
    )
    
    if existing_member:
        raise HTTPException(
            status_code=400,
            detail="User is already a team member"
        )
    
    # Add team member
    new_member = {
        "user_id": ObjectId(member.user_id),
        "name": user["name"],
        "email": user["email"],
        "role": member.role,
        "permissions": member.permissions,
        "joined_at": datetime.now(),
        "is_active": True
    }
    
    try:
        await db.companies.update_one(
            {"_id": company["_id"]},
            {
                "$push": {"team_members": new_member},
                "$set": {"updated_at": datetime.now()}
            }
        )
        
        # Update user's company_id
        await db.users.update_one(
            {"_id": ObjectId(member.user_id)},
            {"$set": {"company_id": str(company["_id"])}}
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to add team member: {str(e)}"
        )
    
    updated_company = await db.companies.find_one({"_id": company["_id"]})
    return updated_company

@router.put("/team/{user_id}", response_model=CompanyResponse)
async def update_team_member(
    user_id: str = Path(..., description="User ID of team member"),
    member_update: TeamMemberUpdate = Body(...),
    current_user: dict = Depends(get_current_user)
):
    """Update a team member's role and permissions."""
    db = get_database()
    
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=400, detail="Invalid user ID format")
    
    # Find company where user is owner or has team management permissions
    company = await db.companies.find_one({
        "$or": [
            {"owner_id": ObjectId(current_user["_id"])},
            {
                "team_members": {
                    "$elemMatch": {
                        "user_id": ObjectId(current_user["_id"]),
                        "permissions": {"$in": ["all", "manage_team"]}
                    }
                }
            }
        ]
    })
    
    if company is None:
        raise HTTPException(status_code=403, detail="Access denied to team management")
    
    # Check if target user is a team member
    member_exists = any(
        str(member["user_id"]) == user_id 
        for member in company.get("team_members", [])
    )
    
    if not member_exists:
        raise HTTPException(status_code=404, detail="Team member not found")
    
    # Cannot modify owner
    if str(company["owner_id"]) == user_id:
        raise HTTPException(status_code=400, detail="Cannot modify company owner")
    
    # Prepare update data
    update_fields = {}
    if member_update.role is not None:
        update_fields["team_members.$.role"] = member_update.role
    if member_update.permissions is not None:
        update_fields["team_members.$.permissions"] = member_update.permissions
    if member_update.is_active is not None:
        update_fields["team_members.$.is_active"] = member_update.is_active
    
    if update_fields:
        update_fields["updated_at"] = datetime.now()
        
        try:
            await db.companies.update_one(
                {
                    "_id": company["_id"],
                    "team_members.user_id": ObjectId(user_id)
                },
                {"$set": update_fields}
            )
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to update team member: {str(e)}"
            )
    
    updated_company = await db.companies.find_one({"_id": company["_id"]})
    return updated_company

@router.delete("/team/{user_id}", response_model=CompanyResponse)
async def remove_team_member(
    user_id: str = Path(..., description="User ID of team member"),
    current_user: dict = Depends(get_current_user)
):
    """Remove a team member from the company."""
    db = get_database()
    
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=400, detail="Invalid user ID format")
    
    # Find company where user is owner
    company = await db.companies.find_one({"owner_id": ObjectId(current_user["_id"])})
    
    if company is None:
        raise HTTPException(status_code=403, detail="Only company owner can remove team members")
    
    # Cannot remove owner
    if str(company["owner_id"]) == user_id:
        raise HTTPException(status_code=400, detail="Cannot remove company owner")
    
    # Check if target user is a team member
    member_exists = any(
        str(member["user_id"]) == user_id 
        for member in company.get("team_members", [])
    )
    
    if not member_exists:
        raise HTTPException(status_code=404, detail="Team member not found")
    
    try:
        await db.companies.update_one(
            {"_id": company["_id"]},
            {
                "$pull": {"team_members": {"user_id": ObjectId(user_id)}},
                "$set": {"updated_at": datetime.now()}
            }
        )
        
        # Remove company_id from user
        await db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$unset": {"company_id": ""}}
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to remove team member: {str(e)}"
        )
    
    updated_company = await db.companies.find_one({"_id": company["_id"]})
    return updated_company

@router.get("/public/{company_id}", response_model=CompanyPublicProfile)
async def get_public_company_profile(
    company_id: str = Path(..., description="Company ID")
):
    """Get public company profile (visible to candidates)."""
    db = get_database()
    
    if not ObjectId.is_valid(company_id):
        raise HTTPException(status_code=400, detail="Invalid company ID format")
    
    company = await db.companies.find_one({
        "_id": ObjectId(company_id),
        "is_active": True
    })
    
    if company is None:
        raise HTTPException(status_code=404, detail="Company not found")
    
    # Return only public information
    public_profile = {
        "_id": company["_id"],
        "name": company["name"],
        "description": company.get("description"),
        "tagline": company.get("tagline"),
        "website": company.get("website"),
        "industry": company["industry"],
        "company_size": company["company_size"],
        "company_stage": company["company_stage"],
        "founded_year": company.get("founded_year"),
        "locations": company.get("locations", []),
        "branding": company.get("branding", {}),
        "social_links": company.get("social_links", {}),
        "mission_statement": company.get("mission_statement"),
        "values": company.get("values", []),
        "culture_description": company.get("culture_description"),
        "benefits": company.get("benefits", {}),
        "total_jobs_posted": company.get("total_jobs_posted", 0),
        "is_verified": company.get("is_verified", False)
    }
    
    return public_profile

@router.post("/verification", response_model=dict, status_code=status.HTTP_202_ACCEPTED)
async def request_company_verification(
    verification: CompanyVerificationRequest = Body(...),
    current_user: dict = Depends(get_current_user)
):
    """Request company verification."""
    db = get_database()
    
    if not ObjectId.is_valid(verification.company_id):
        raise HTTPException(status_code=400, detail="Invalid company ID format")
    
    # Verify user has access to the company
    company = await db.companies.find_one({
        "_id": ObjectId(verification.company_id),
        "$or": [
            {"owner_id": ObjectId(current_user["_id"])},
            {
                "team_members": {
                    "$elemMatch": {
                        "user_id": ObjectId(current_user["_id"]),
                        "permissions": {"$in": ["all", "manage_company"]}
                    }
                }
            }
        ]
    })
    
    if company is None:
        raise HTTPException(status_code=403, detail="Access denied to company")
    
    # Check if already verified
    if company.get("is_verified"):
        raise HTTPException(status_code=400, detail="Company is already verified")
    
    # Create verification request
    verification_request = {
        "company_id": ObjectId(verification.company_id),
        "requested_by": ObjectId(current_user["_id"]),
        "verification_documents": verification.verification_documents,
        "contact_person": verification.contact_person,
        "contact_email": verification.contact_email,
        "additional_info": verification.additional_info,
        "status": "pending",
        "requested_at": datetime.now()
    }
    
    try:
        await db.verification_requests.insert_one(verification_request)
        
        # TODO: Notify admin team about verification request
        
        return {
            "status": "submitted",
            "message": "Verification request submitted successfully"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to submit verification request: {str(e)}"
        )

@router.get("/stats", response_model=CompanyStats)
async def get_company_stats(
    current_user: dict = Depends(get_current_user)
):
    """Get company statistics overview."""
    db = get_database()
    
    # Get total companies
    total_companies = await db.companies.count_documents({"is_active": True})
    
    # Get verified companies
    verified_companies = await db.companies.count_documents({
        "is_active": True,
        "is_verified": True
    })
    
    # Get active companies (with recent activity)
    thirty_days_ago = datetime.now() - timedelta(days=30)
    active_companies = await db.companies.count_documents({
        "is_active": True,
        "updated_at": {"$gte": thirty_days_ago}
    })
    
    # Aggregate statistics
    pipeline = [
        {"$match": {"is_active": True}},
        {"$group": {
            "_id": None,
            "by_industry": {"$push": "$industry"},
            "by_size": {"$push": "$company_size"},
            "by_stage": {"$push": "$company_stage"},
            "total_jobs": {"$sum": "$total_jobs_posted"},
            "total_applications": {"$sum": "$total_applications_received"}
        }}
    ]
    
    result = await db.companies.aggregate(pipeline).to_list(length=1)
    
    if not result:
        return CompanyStats(
            total_companies=0,
            by_industry={},
            by_size={},
            by_stage={},
            verified_companies=0,
            active_companies=0,
            average_jobs_per_company=0.0,
            average_applications_per_company=0.0
        )
    
    data = result[0]
    
    # Process industry counts
    industry_counts = {}
    for industry in data["by_industry"]:
        industry_counts[industry] = industry_counts.get(industry, 0) + 1
    
    # Process size counts
    size_counts = {}
    for size in data["by_size"]:
        size_counts[size] = size_counts.get(size, 0) + 1
    
    # Process stage counts
    stage_counts = {}
    for stage in data["by_stage"]:
        stage_counts[stage] = stage_counts.get(stage, 0) + 1
    
    # Calculate averages
    average_jobs_per_company = data["total_jobs"] / total_companies if total_companies > 0 else 0.0
    average_applications_per_company = data["total_applications"] / total_companies if total_companies > 0 else 0.0
    
    return CompanyStats(
        total_companies=total_companies,
        by_industry=industry_counts,
        by_size=size_counts,
        by_stage=stage_counts,
        verified_companies=verified_companies,
        active_companies=active_companies,
        average_jobs_per_company=average_jobs_per_company,
        average_applications_per_company=average_applications_per_company
    )

@router.delete("/profile", status_code=status.HTTP_204_NO_CONTENT)
async def delete_company_profile(
    current_user: dict = Depends(get_current_user)
):
    """Delete company profile (owner only)."""
    db = get_database()
    
    # Find company where user is owner
    company = await db.companies.find_one({"owner_id": ObjectId(current_user["_id"])})
    
    if company is None:
        raise HTTPException(status_code=403, detail="Only company owner can delete company profile")
    
    # Check if company has active jobs
    active_jobs = await db.jobs.count_documents({
        "company_id": company["_id"],
        "status": {"$in": ["active", "draft"]}
    })
    
    if active_jobs > 0:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete company with active job postings"
        )
    
    try:
        # Remove company_id from all team members
        team_member_ids = [member["user_id"] for member in company.get("team_members", [])]
        if team_member_ids:
            await db.users.update_many(
                {"_id": {"$in": team_member_ids}},
                {"$unset": {"company_id": ""}}
            )
        
        # Delete company
        await db.companies.delete_one({"_id": company["_id"]})
        
        # TODO: Clean up related data (invitations, verification requests, etc.)
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete company profile: {str(e)}"
        )