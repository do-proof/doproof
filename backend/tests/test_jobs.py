import pytest
from httpx import AsyncClient
from bson import ObjectId
from datetime import datetime, timedelta

class TestJobsEndpoints:
    """Test suite for job management endpoints."""

    async def test_create_job_success(self, client: AsyncClient, auth_headers, sample_job_data):
        """Test successful job creation."""
        response = await client.post(
            "/api/jobs",
            json=sample_job_data,
            headers=auth_headers
        )
        
        assert response.status_code == 201
        data = response.json()
        
        assert data["title"] == sample_job_data["title"]
        assert data["description"] == sample_job_data["description"]
        assert data["status"] == "draft"
        assert data["application_count"] == 0
        assert data["submission_count"] == 0
        assert data["view_count"] == 0
        assert "id" in data
        assert "created_at" in data
        assert "updated_at" in data

    async def test_create_job_invalid_criteria_weights(self, client: AsyncClient, auth_headers, sample_job_data):
        """Test job creation with invalid evaluation criteria weights."""
        # Modify criteria to not sum to 100
        sample_job_data["evaluation_criteria"]["critical_thinking"] = 50
        
        response = await client.post(
            "/api/jobs",
            json=sample_job_data,
            headers=auth_headers
        )
        
        assert response.status_code == 422
        assert "Evaluation criteria weights must sum to 100" in response.text

    async def test_create_job_past_closing_date(self, client: AsyncClient, auth_headers, sample_job_data):
        """Test job creation with past closing date."""
        sample_job_data["closing_date"] = "2020-01-01T00:00:00"
        
        response = await client.post(
            "/api/jobs",
            json=sample_job_data,
            headers=auth_headers
        )
        
        assert response.status_code == 422
        assert "Closing date must be in the future" in response.text

    async def test_create_job_unauthorized(self, client: AsyncClient, sample_job_data):
        """Test job creation without authentication."""
        response = await client.post("/api/jobs", json=sample_job_data)
        assert response.status_code == 401

    async def test_get_jobs_empty_list(self, client: AsyncClient, auth_headers):
        """Test getting jobs when none exist."""
        response = await client.get("/api/jobs", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["jobs"] == []
        assert data["total"] == 0
        assert data["page"] == 1
        assert data["per_page"] == 10
        assert data["total_pages"] == 0

    async def test_get_jobs_with_pagination(self, client: AsyncClient, auth_headers, sample_job_data):
        """Test getting jobs with pagination."""
        # Create multiple jobs
        for i in range(15):
            job_data = sample_job_data.copy()
            job_data["title"] = f"Job {i+1}"
            await client.post("/api/jobs", json=job_data, headers=auth_headers)
        
        # Test first page
        response = await client.get("/api/jobs?page=1&per_page=10", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        
        assert len(data["jobs"]) == 10
        assert data["total"] == 15
        assert data["page"] == 1
        assert data["per_page"] == 10
        assert data["total_pages"] == 2
        
        # Test second page
        response = await client.get("/api/jobs?page=2&per_page=10", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        
        assert len(data["jobs"]) == 5
        assert data["page"] == 2

    async def test_get_jobs_with_filters(self, client: AsyncClient, auth_headers, sample_job_data):
        """Test getting jobs with various filters."""
        # Create jobs with different statuses
        job1_data = sample_job_data.copy()
        job1_data["title"] = "Active Job"
        response1 = await client.post("/api/jobs", json=job1_data, headers=auth_headers)
        job1_id = response1.json()["id"]
        
        job2_data = sample_job_data.copy()
        job2_data["title"] = "Draft Job"
        await client.post("/api/jobs", json=job2_data, headers=auth_headers)
        
        # Update first job to active
        await client.patch(f"/api/jobs/{job1_id}/status", json={"status": "active"}, headers=auth_headers)
        
        # Filter by status
        response = await client.get("/api/jobs?status=active", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data["jobs"]) == 1
        assert data["jobs"][0]["title"] == "Active Job"
        
        # Filter by employment type
        response = await client.get("/api/jobs?employment_type=full-time", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data["jobs"]) == 2
        
        # Search by title
        response = await client.get("/api/jobs?search=Active", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data["jobs"]) == 1
        assert data["jobs"][0]["title"] == "Active Job"

    async def test_get_job_by_id(self, client: AsyncClient, auth_headers, sample_job_data):
        """Test getting a specific job by ID."""
        # Create a job
        response = await client.post("/api/jobs", json=sample_job_data, headers=auth_headers)
        job_id = response.json()["id"]
        
        # Get the job
        response = await client.get(f"/api/jobs/{job_id}", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        
        assert data["id"] == job_id
        assert data["title"] == sample_job_data["title"]
        assert data["view_count"] == 1  # Should increment view count

    async def test_get_job_not_found(self, client: AsyncClient, auth_headers):
        """Test getting a non-existent job."""
        fake_id = str(ObjectId())
        response = await client.get(f"/api/jobs/{fake_id}", headers=auth_headers)
        assert response.status_code == 404

    async def test_get_job_invalid_id(self, client: AsyncClient, auth_headers):
        """Test getting a job with invalid ID format."""
        response = await client.get("/api/jobs/invalid-id", headers=auth_headers)
        assert response.status_code == 400

    async def test_update_job_success(self, client: AsyncClient, auth_headers, sample_job_data):
        """Test successful job update."""
        # Create a job
        response = await client.post("/api/jobs", json=sample_job_data, headers=auth_headers)
        job_id = response.json()["id"]
        
        # Update the job
        update_data = {
            "title": "Updated Job Title",
            "description": "Updated description",
            "status": "active"
        }
        
        response = await client.put(f"/api/jobs/{job_id}", json=update_data, headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        
        assert data["title"] == "Updated Job Title"
        assert data["description"] == "Updated description"
        assert data["status"] == "active"
        assert "posted_date" in data  # Should be set when changing to active

    async def test_update_job_status_only(self, client: AsyncClient, auth_headers, sample_job_data):
        """Test updating only job status."""
        # Create a job
        response = await client.post("/api/jobs", json=sample_job_data, headers=auth_headers)
        job_id = response.json()["id"]
        
        # Update status
        response = await client.patch(f"/api/jobs/{job_id}/status", json={"status": "active"}, headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        
        assert data["status"] == "active"
        assert "posted_date" in data

    async def test_update_job_not_found(self, client: AsyncClient, auth_headers):
        """Test updating a non-existent job."""
        fake_id = str(ObjectId())
        update_data = {"title": "Updated Title"}
        
        response = await client.put(f"/api/jobs/{fake_id}", json=update_data, headers=auth_headers)
        assert response.status_code == 404

    async def test_delete_job_success(self, client: AsyncClient, auth_headers, sample_job_data):
        """Test successful job deletion."""
        # Create a job
        response = await client.post("/api/jobs", json=sample_job_data, headers=auth_headers)
        job_id = response.json()["id"]
        
        # Delete the job
        response = await client.delete(f"/api/jobs/{job_id}", headers=auth_headers)
        assert response.status_code == 204
        
        # Verify job is deleted
        response = await client.get(f"/api/jobs/{job_id}", headers=auth_headers)
        assert response.status_code == 404

    async def test_delete_job_with_applications(self, client: AsyncClient, auth_headers, sample_job_data, clean_db):
        """Test deleting a job with applications should fail."""
        # Create a job
        response = await client.post("/api/jobs", json=sample_job_data, headers=auth_headers)
        job_id = response.json()["id"]
        
        # Simulate job having applications
        await clean_db.jobs.update_one(
            {"_id": ObjectId(job_id)},
            {"$set": {"application_count": 5}}
        )
        
        # Try to delete the job
        response = await client.delete(f"/api/jobs/{job_id}", headers=auth_headers)
        assert response.status_code == 400
        assert "Cannot delete job with existing applications" in response.text

    async def test_delete_job_not_found(self, client: AsyncClient, auth_headers):
        """Test deleting a non-existent job."""
        fake_id = str(ObjectId())
        response = await client.delete(f"/api/jobs/{fake_id}", headers=auth_headers)
        assert response.status_code == 404

    async def test_get_job_metrics(self, client: AsyncClient, auth_headers, sample_job_data, clean_db):
        """Test getting job metrics."""
        # Create a job
        response = await client.post("/api/jobs", json=sample_job_data, headers=auth_headers)
        job_id = response.json()["id"]
        
        # Update job with some metrics
        await clean_db.jobs.update_one(
            {"_id": ObjectId(job_id)},
            {
                "$set": {
                    "status": "active",
                    "view_count": 100,
                    "application_count": 20,
                    "submission_count": 15,
                    "posted_date": datetime.now()
                }
            }
        )
        
        # Get metrics
        response = await client.get(f"/api/jobs/{job_id}/metrics", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        
        assert data["job_id"] == job_id
        assert data["view_count"] == 100
        assert data["application_count"] == 20
        assert data["submission_count"] == 15
        assert data["view_to_application_rate"] == 20.0  # 20/100 * 100
        assert data["application_to_submission_rate"] == 75.0  # 15/20 * 100
        assert "days_active" in data

    async def test_job_isolation_between_users(self, client: AsyncClient, sample_job_data, clean_db):
        """Test that users can only access their own jobs."""
        # Create two users
        user1_data = {
            "_id": ObjectId("60d5ec9af682fbd12a0a38d1"),
            "email": "user1@example.com",
            "password": "$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW",
            "full_name": "User One",
            "is_active": True
        }
        
        user2_data = {
            "_id": ObjectId("60d5ec9af682fbd12a0a38d2"),
            "email": "user2@example.com",
            "password": "$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW",
            "full_name": "User Two",
            "is_active": True
        }
        
        await clean_db.users.insert_many([user1_data, user2_data])
        
        # Get auth headers for both users
        login_data1 = {"username": "user1@example.com", "password": "secret"}
        response1 = await client.post("/api/users/login", data=login_data1)
        headers1 = {"Authorization": f"Bearer {response1.json()['access_token']}"}
        
        login_data2 = {"username": "user2@example.com", "password": "secret"}
        response2 = await client.post("/api/users/login", data=login_data2)
        headers2 = {"Authorization": f"Bearer {response2.json()['access_token']}"}
        
        # User 1 creates a job
        response = await client.post("/api/jobs", json=sample_job_data, headers=headers1)
        job_id = response.json()["id"]
        
        # User 2 should not be able to access User 1's job
        response = await client.get(f"/api/jobs/{job_id}", headers=headers2)
        assert response.status_code == 404
        
        # User 2 should not see User 1's job in their job list
        response = await client.get("/api/jobs", headers=headers2)
        assert response.status_code == 200
        assert len(response.json()["jobs"]) == 0

    async def test_job_validation_edge_cases(self, client: AsyncClient, auth_headers, sample_job_data):
        """Test various validation edge cases."""
        # Test empty title
        invalid_data = sample_job_data.copy()
        invalid_data["title"] = ""
        response = await client.post("/api/jobs", json=invalid_data, headers=auth_headers)
        assert response.status_code == 422
        
        # Test empty requirements
        invalid_data = sample_job_data.copy()
        invalid_data["requirements"] = []
        response = await client.post("/api/jobs", json=invalid_data, headers=auth_headers)
        assert response.status_code == 422
        
        # Test invalid time limit
        invalid_data = sample_job_data.copy()
        invalid_data["task"]["time_limit"] = -1
        response = await client.post("/api/jobs", json=invalid_data, headers=auth_headers)
        assert response.status_code == 422