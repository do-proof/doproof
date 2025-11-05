import pytest
from httpx import AsyncClient
from bson import ObjectId
from datetime import datetime, timedelta

class TestTaskSubmissionsEndpoints:
    """Test suite for task submission management endpoints."""

    async def test_create_task_submission_success(self, client: AsyncClient, auth_headers, clean_db):
        """Test successful task submission creation."""
        # First create a job
        job_data = {
            "_id": ObjectId("60d5ec9af682fbd12a0a38d1"),
            "title": "Software Engineer",
            "status": "active",
            "task": {
                "title": "Coding Challenge",
                "description": "Implement a REST API",
                "time_limit": 120,
                "submission_format": "text"
            },
            "recruiter_id": ObjectId("60d5ec9af682fbd12a0a38d6")
        }
        await clean_db.jobs.insert_one(job_data)
        
        submission_data = {
            "job_id": str(job_data["_id"]),
            "submission": {
                "type": "text",
                "content": "Here is my API implementation..."
            }
        }
        
        response = await client.post(
            "/api/task-submissions",
            json=submission_data,
            headers=auth_headers
        )
        
        assert response.status_code == 201
        data = response.json()
        
        assert data["job_id"] == submission_data["job_id"]
        assert data["status"] == "submitted"
        assert data["submission"]["content"] == submission_data["submission"]["content"]
        assert "id" in data
        assert "submitted_at" in data

    async def test_create_submission_invalid_job(self, client: AsyncClient, auth_headers):
        """Test submission creation with invalid job ID."""
        submission_data = {
            "job_id": str(ObjectId()),
            "submission": {
                "type": "text",
                "content": "Test submission"
            }
        }
        
        response = await client.post(
            "/api/task-submissions",
            json=submission_data,
            headers=auth_headers
        )
        
        assert response.status_code == 404
        assert "Job not found" in response.text

    async def test_get_submissions_by_job(self, client: AsyncClient, auth_headers, clean_db):
        """Test getting submissions filtered by job."""
        # Create job and submissions
        job_id = ObjectId("60d5ec9af682fbd12a0a38d1")
        job_data = {
            "_id": job_id,
            "title": "Software Engineer",
            "status": "active",
            "recruiter_id": ObjectId("60d5ec9af682fbd12a0a38d6")
        }
        await clean_db.jobs.insert_one(job_data)
        
        # Create multiple submissions
        submissions = []
        for i in range(3):
            submission = {
                "_id": ObjectId(),
                "job_id": job_id,
                "candidate_id": ObjectId(),
                "status": "submitted",
                "submission": {"type": "text", "content": f"Submission {i+1}"},
                "submitted_at": datetime.now(),
                "created_at": datetime.now()
            }
            submissions.append(submission)
        
        await clean_db.task_submissions.insert_many(submissions)
        
        response = await client.get(
            f"/api/task-submissions?job_id={str(job_id)}",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert len(data["submissions"]) == 3
        assert data["total"] == 3

    async def test_get_submission_by_id(self, client: AsyncClient, auth_headers, clean_db):
        """Test getting a specific submission by ID."""
        # Create job and submission
        job_id = ObjectId("60d5ec9af682fbd12a0a38d1")
        submission_id = ObjectId("60d5ec9af682fbd12a0a38d2")
        
        job_data = {
            "_id": job_id,
            "title": "Software Engineer",
            "recruiter_id": ObjectId("60d5ec9af682fbd12a0a38d6")
        }
        await clean_db.jobs.insert_one(job_data)
        
        submission_data = {
            "_id": submission_id,
            "job_id": job_id,
            "candidate_id": ObjectId("60d5ec9af682fbd12a0a38d3"),
            "status": "submitted",
            "submission": {
                "type": "text",
                "content": "My solution to the problem..."
            },
            "time_spent": 90,
            "submitted_at": datetime.now(),
            "created_at": datetime.now()
        }
        await clean_db.task_submissions.insert_one(submission_data)
        
        response = await client.get(
            f"/api/task-submissions/{str(submission_id)}",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["id"] == str(submission_id)
        assert data["submission"]["content"] == "My solution to the problem..."
        assert data["time_spent"] == 90

    async def test_update_submission_status(self, client: AsyncClient, auth_headers, clean_db):
        """Test updating submission status."""
        # Create job and submission
        job_id = ObjectId("60d5ec9af682fbd12a0a38d1")
        submission_id = ObjectId("60d5ec9af682fbd12a0a38d2")
        
        job_data = {
            "_id": job_id,
            "title": "Software Engineer",
            "recruiter_id": ObjectId("60d5ec9af682fbd12a0a38d6")
        }
        await clean_db.jobs.insert_one(job_data)
        
        submission_data = {
            "_id": submission_id,
            "job_id": job_id,
            "candidate_id": ObjectId("60d5ec9af682fbd12a0a38d3"),
            "status": "submitted",
            "submission": {"type": "text", "content": "Test"},
            "created_at": datetime.now()
        }
        await clean_db.task_submissions.insert_one(submission_data)
        
        update_data = {"status": "shortlisted"}
        
        response = await client.patch(
            f"/api/task-submissions/{str(submission_id)}/status",
            json=update_data,
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["status"] == "shortlisted"
        assert "updated_at" in data

    async def test_add_recruiter_review(self, client: AsyncClient, auth_headers, clean_db):
        """Test adding recruiter review to submission."""
        # Create job and submission
        job_id = ObjectId("60d5ec9af682fbd12a0a38d1")
        submission_id = ObjectId("60d5ec9af682fbd12a0a38d2")
        
        job_data = {
            "_id": job_id,
            "title": "Software Engineer",
            "recruiter_id": ObjectId("60d5ec9af682fbd12a0a38d6")
        }
        await clean_db.jobs.insert_one(job_data)
        
        submission_data = {
            "_id": submission_id,
            "job_id": job_id,
            "candidate_id": ObjectId("60d5ec9af682fbd12a0a38d3"),
            "status": "evaluated",
            "submission": {"type": "text", "content": "Test"},
            "ai_evaluation": {
                "overall_score": 85,
                "criteria_scores": {
                    "critical_thinking": 80,
                    "problem_solving": 90
                }
            },
            "created_at": datetime.now()
        }
        await clean_db.task_submissions.insert_one(submission_data)
        
        review_data = {
            "rating": 4,
            "notes": "Good solution, well structured code",
            "decision": "shortlist"
        }
        
        response = await client.post(
            f"/api/task-submissions/{str(submission_id)}/review",
            json=review_data,
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["recruiter_review"]["rating"] == 4
        assert data["recruiter_review"]["notes"] == review_data["notes"]
        assert data["recruiter_review"]["decision"] == "shortlist"
        assert "reviewed_at" in data["recruiter_review"]

    async def test_get_submissions_with_filters(self, client: AsyncClient, auth_headers, clean_db):
        """Test getting submissions with various filters."""
        # Create job
        job_id = ObjectId("60d5ec9af682fbd12a0a38d1")
        job_data = {
            "_id": job_id,
            "title": "Software Engineer",
            "recruiter_id": ObjectId("60d5ec9af682fbd12a0a38d6")
        }
        await clean_db.jobs.insert_one(job_data)
        
        # Create submissions with different statuses and scores
        submissions = [
            {
                "_id": ObjectId(),
                "job_id": job_id,
                "candidate_id": ObjectId(),
                "status": "evaluated",
                "ai_evaluation": {"overall_score": 95},
                "created_at": datetime.now()
            },
            {
                "_id": ObjectId(),
                "job_id": job_id,
                "candidate_id": ObjectId(),
                "status": "evaluated",
                "ai_evaluation": {"overall_score": 75},
                "created_at": datetime.now()
            },
            {
                "_id": ObjectId(),
                "job_id": job_id,
                "candidate_id": ObjectId(),
                "status": "submitted",
                "created_at": datetime.now()
            }
        ]
        await clean_db.task_submissions.insert_many(submissions)
        
        # Filter by status
        response = await client.get(
            f"/api/task-submissions?job_id={str(job_id)}&status=evaluated",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data["submissions"]) == 2
        
        # Filter by minimum score
        response = await client.get(
            f"/api/task-submissions?job_id={str(job_id)}&min_score=80",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data["submissions"]) == 1
        assert data["submissions"][0]["ai_evaluation"]["overall_score"] == 95

    async def test_bulk_status_update(self, client: AsyncClient, auth_headers, clean_db):
        """Test bulk status update for multiple submissions."""
        # Create job and submissions
        job_id = ObjectId("60d5ec9af682fbd12a0a38d1")
        job_data = {
            "_id": job_id,
            "title": "Software Engineer",
            "recruiter_id": ObjectId("60d5ec9af682fbd12a0a38d6")
        }
        await clean_db.jobs.insert_one(job_data)
        
        submission_ids = [ObjectId(), ObjectId(), ObjectId()]
        submissions = []
        for sub_id in submission_ids:
            submission = {
                "_id": sub_id,
                "job_id": job_id,
                "candidate_id": ObjectId(),
                "status": "evaluated",
                "created_at": datetime.now()
            }
            submissions.append(submission)
        
        await clean_db.task_submissions.insert_many(submissions)
        
        bulk_update_data = {
            "submission_ids": [str(sid) for sid in submission_ids[:2]],
            "status": "shortlisted"
        }
        
        response = await client.patch(
            "/api/task-submissions/bulk-status",
            json=bulk_update_data,
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["updated_count"] == 2
        assert len(data["updated_submissions"]) == 2

    async def test_submission_file_upload(self, client: AsyncClient, auth_headers, clean_db):
        """Test file submission upload."""
        # Create job that accepts file submissions
        job_id = ObjectId("60d5ec9af682fbd12a0a38d1")
        job_data = {
            "_id": job_id,
            "title": "Software Engineer",
            "status": "active",
            "task": {
                "submission_format": "file",
                "allowed_file_types": ["pdf", "txt"],
                "max_file_size": 5242880  # 5MB
            },
            "recruiter_id": ObjectId("60d5ec9af682fbd12a0a38d6")
        }
        await clean_db.jobs.insert_one(job_data)
        
        # Mock file upload
        files = {"file": ("test.txt", b"Test file content", "text/plain")}
        data = {"job_id": str(job_id)}
        
        response = await client.post(
            "/api/task-submissions/upload",
            files=files,
            data=data,
            headers=auth_headers
        )
        
        assert response.status_code == 201
        response_data = response.json()
        
        assert response_data["submission"]["type"] == "file"
        assert response_data["submission"]["file_name"] == "test.txt"
        assert "file_url" in response_data["submission"]

    async def test_submission_access_control(self, client: AsyncClient, clean_db):
        """Test that recruiters can only access submissions for their jobs."""
        # Create two recruiters
        recruiter1_id = ObjectId("60d5ec9af682fbd12a0a38d1")
        recruiter2_id = ObjectId("60d5ec9af682fbd12a0a38d2")
        
        users = [
            {
                "_id": recruiter1_id,
                "email": "recruiter1@example.com",
                "password": "$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW",
                "full_name": "Recruiter One",
                "is_active": True
            },
            {
                "_id": recruiter2_id,
                "email": "recruiter2@example.com",
                "password": "$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW",
                "full_name": "Recruiter Two",
                "is_active": True
            }
        ]
        await clean_db.users.insert_many(users)
        
        # Get auth headers for both recruiters
        login_data1 = {"username": "recruiter1@example.com", "password": "secret"}
        response1 = await client.post("/api/users/login", data=login_data1)
        headers1 = {"Authorization": f"Bearer {response1.json()['access_token']}"}
        
        login_data2 = {"username": "recruiter2@example.com", "password": "secret"}
        response2 = await client.post("/api/users/login", data=login_data2)
        headers2 = {"Authorization": f"Bearer {response2.json()['access_token']}"}
        
        # Create job for recruiter 1
        job_id = ObjectId("60d5ec9af682fbd12a0a38d3")
        job_data = {
            "_id": job_id,
            "title": "Software Engineer",
            "recruiter_id": recruiter1_id
        }
        await clean_db.jobs.insert_one(job_data)
        
        # Create submission for recruiter 1's job
        submission_id = ObjectId("60d5ec9af682fbd12a0a38d4")
        submission_data = {
            "_id": submission_id,
            "job_id": job_id,
            "candidate_id": ObjectId(),
            "status": "submitted",
            "submission": {"type": "text", "content": "Test"},
            "created_at": datetime.now()
        }
        await clean_db.task_submissions.insert_one(submission_data)
        
        # Recruiter 2 should not be able to access recruiter 1's submission
        response = await client.get(
            f"/api/task-submissions/{str(submission_id)}",
            headers=headers2
        )
        assert response.status_code == 404
        
        # Recruiter 1 should be able to access their submission
        response = await client.get(
            f"/api/task-submissions/{str(submission_id)}",
            headers=headers1
        )
        assert response.status_code == 200

    async def test_submission_time_tracking(self, client: AsyncClient, auth_headers, clean_db):
        """Test submission time tracking functionality."""
        # Create job with time limit
        job_id = ObjectId("60d5ec9af682fbd12a0a38d1")
        job_data = {
            "_id": job_id,
            "title": "Software Engineer",
            "status": "active",
            "task": {
                "time_limit": 120  # 2 hours
            },
            "recruiter_id": ObjectId("60d5ec9af682fbd12a0a38d6")
        }
        await clean_db.jobs.insert_one(job_data)
        
        # Start submission (simulate candidate starting task)
        start_data = {"job_id": str(job_id)}
        
        response = await client.post(
            "/api/task-submissions/start",
            json=start_data,
            headers=auth_headers
        )
        
        assert response.status_code == 201
        data = response.json()
        
        assert data["status"] == "in_progress"
        assert "started_at" in data
        submission_id = data["id"]
        
        # Submit after some time
        submission_data = {
            "submission": {
                "type": "text",
                "content": "My solution..."
            },
            "time_spent": 90  # 1.5 hours
        }
        
        response = await client.patch(
            f"/api/task-submissions/{submission_id}/submit",
            json=submission_data,
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["status"] == "submitted"
        assert data["time_spent"] == 90
        assert "submitted_at" in data