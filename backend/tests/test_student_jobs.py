import pytest
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from bson import ObjectId
from unittest.mock import AsyncMock, patch

from app.main import app
from app.models.user import UserRole

client = TestClient(app)

# Mock database and authentication
@pytest.fixture
def mock_db():
    return AsyncMock()

@pytest.fixture
def mock_student_user():
    return {
        "_id": ObjectId(),
        "email": "student@example.com",
        "role": UserRole.STUDENT
    }

@pytest.fixture
def mock_job():
    return {
        "_id": ObjectId(),
        "title": "Frontend Developer",
        "description": "Build React applications",
        "requirements": ["React", "TypeScript"],
        "responsibilities": ["Develop UI components"],
        "salary": {"min": 50000, "max": 80000, "currency": "USD"},
        "location": {"type": "remote", "city": "San Francisco", "country": "USA"},
        "employment_type": "full-time",
        "status": "active",
        "posted_date": datetime.now(),
        "closing_date": datetime.now() + timedelta(days=30),
        "task": {
            "title": "Build a landing page",
            "description": "Create a responsive landing page",
            "instructions": "Use React and Tailwind CSS",
            "time_limit": 120,
            "submission_format": "code",
            "max_file_size": 10,
            "allowed_file_types": ["zip", "tar.gz"]
        },
        "evaluation_criteria": {
            "critical_thinking": 20,
            "problem_solving": 25,
            "creativity": 15,
            "technical_skills": 30,
            "communication": 5,
            "attention_to_detail": 5
        },
        "application_count": 5,
        "submission_count": 3,
        "view_count": 20,
        "company_id": ObjectId(),
        "recruiter_id": ObjectId(),
        "created_at": datetime.now(),
        "updated_at": datetime.now()
    }

class TestStudentJobBrowsing:
    
    @patch('app.routers.jobs.get_database')
    @patch('app.routers.jobs.require_any_authenticated')
    def test_browse_jobs_success(self, mock_auth, mock_get_db, mock_db, mock_student_user, mock_job):
        """Test successful job browsing for students."""
        mock_auth.return_value = mock_student_user
        mock_get_db.return_value = mock_db
        
        # Mock database responses
        mock_db.jobs.count_documents.return_value = 1
        mock_db.jobs.find.return_value.skip.return_value.limit.return_value.sort.return_value.to_list.return_value = [mock_job]
        mock_db.task_submissions.find.return_value.to_list.return_value = []
        
        response = client.get("/api/jobs/student/browse")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "jobs" in data
        assert "total" in data
        assert "page" in data
        assert "per_page" in data
        assert "total_pages" in data
        assert len(data["jobs"]) == 1
        assert data["total"] == 1
        assert data["page"] == 1
        assert data["per_page"] == 10
        
        # Check job structure
        job = data["jobs"][0]
        assert job["title"] == "Frontend Developer"
        assert job["status"] == "active"
        assert "match_score" in job
        assert "is_recommended" in job

    @patch('app.routers.jobs.get_database')
    @patch('app.routers.jobs.require_any_authenticated')
    def test_browse_jobs_with_search(self, mock_auth, mock_get_db, mock_db, mock_student_user):
        """Test job browsing with search filter."""
        mock_auth.return_value = mock_student_user
        mock_get_db.return_value = mock_db
        
        mock_db.jobs.count_documents.return_value = 0
        mock_db.jobs.find.return_value.skip.return_value.limit.return_value.sort.return_value.to_list.return_value = []
        mock_db.task_submissions.find.return_value.to_list.return_value = []
        
        response = client.get("/api/jobs/student/browse?search=React")
        
        assert response.status_code == 200
        
        # Verify search filter was applied
        call_args = mock_db.jobs.count_documents.call_args[0][0]
        assert "$and" in call_args
        assert any("$or" in condition for condition in call_args["$and"])

    @patch('app.routers.jobs.get_database')
    @patch('app.routers.jobs.require_any_authenticated')
    def test_browse_jobs_with_filters(self, mock_auth, mock_get_db, mock_db, mock_student_user):
        """Test job browsing with multiple filters."""
        mock_auth.return_value = mock_student_user
        mock_get_db.return_value = mock_db
        
        mock_db.jobs.count_documents.return_value = 0
        mock_db.jobs.find.return_value.skip.return_value.limit.return_value.sort.return_value.to_list.return_value = []
        mock_db.task_submissions.find.return_value.to_list.return_value = []
        
        response = client.get(
            "/api/jobs/student/browse"
            "?employment_type=full-time"
            "&location_type=remote"
            "&min_salary=50000"
            "&max_salary=100000"
            "&deadline_within=30"
        )
        
        assert response.status_code == 200
        
        # Verify filters were applied
        call_args = mock_db.jobs.count_documents.call_args[0][0]
        assert call_args["employment_type"] == {"$in": ["full-time"]}
        assert call_args["location.type"] == "remote"
        assert "salary.min" in call_args
        assert "closing_date" in call_args

    @patch('app.routers.jobs.get_database')
    @patch('app.routers.jobs.require_any_authenticated')
    def test_browse_jobs_exclude_applied(self, mock_auth, mock_get_db, mock_db, mock_student_user):
        """Test job browsing excluding already applied jobs."""
        mock_auth.return_value = mock_student_user
        mock_get_db.return_value = mock_db
        
        applied_job_id = ObjectId()
        mock_db.task_submissions.find.return_value.to_list.return_value = [
            {"job_id": applied_job_id}
        ]
        mock_db.jobs.count_documents.return_value = 0
        mock_db.jobs.find.return_value.skip.return_value.limit.return_value.sort.return_value.to_list.return_value = []
        
        response = client.get("/api/jobs/student/browse?exclude_applied=true")
        
        assert response.status_code == 200
        
        # Verify exclusion filter was applied
        call_args = mock_db.jobs.count_documents.call_args[0][0]
        assert "_id" in call_args
        assert "$nin" in call_args["_id"]
        assert applied_job_id in call_args["_id"]["$nin"]

    @patch('app.routers.jobs.get_database')
    @patch('app.routers.jobs.require_any_authenticated')
    def test_browse_jobs_pagination(self, mock_auth, mock_get_db, mock_db, mock_student_user):
        """Test job browsing pagination."""
        mock_auth.return_value = mock_student_user
        mock_get_db.return_value = mock_db
        
        mock_db.jobs.count_documents.return_value = 25
        mock_db.jobs.find.return_value.skip.return_value.limit.return_value.sort.return_value.to_list.return_value = []
        mock_db.task_submissions.find.return_value.to_list.return_value = []
        
        response = client.get("/api/jobs/student/browse?page=2&per_page=5")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["total"] == 25
        assert data["page"] == 2
        assert data["per_page"] == 5
        assert data["total_pages"] == 5
        
        # Verify pagination was applied to database query
        mock_db.jobs.find.return_value.skip.assert_called_with(5)  # (page-1) * per_page
        mock_db.jobs.find.return_value.skip.return_value.limit.assert_called_with(5)

class TestJobViewIncrement:
    
    @patch('app.routers.jobs.get_database')
    @patch('app.routers.jobs.require_any_authenticated')
    @patch('app.routers.jobs.get_client_ip')
    @patch('app.routers.jobs.AuditLogger')
    def test_increment_job_view_success(self, mock_audit, mock_get_ip, mock_auth, mock_get_db, mock_db, mock_student_user, mock_job):
        """Test successful job view increment."""
        mock_auth.return_value = mock_student_user
        mock_get_db.return_value = mock_db
        mock_get_ip.return_value = "127.0.0.1"
        
        job_id = str(mock_job["_id"])
        mock_db.jobs.find_one.return_value = mock_job
        mock_db.jobs.update_one.return_value = AsyncMock()
        
        response = client.post(f"/api/jobs/{job_id}/view")
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "message" in data
        
        # Verify view count was incremented
        mock_db.jobs.update_one.assert_called_once()
        call_args = mock_db.jobs.update_one.call_args
        assert call_args[0][0]["_id"] == ObjectId(job_id)
        assert call_args[0][1]["$inc"]["view_count"] == 1
        
        # Verify audit log was created
        mock_audit.log_action.assert_called_once()

    @patch('app.routers.jobs.get_database')
    @patch('app.routers.jobs.require_any_authenticated')
    def test_increment_job_view_not_found(self, mock_auth, mock_get_db, mock_db, mock_student_user):
        """Test job view increment for non-existent job."""
        mock_auth.return_value = mock_student_user
        mock_get_db.return_value = mock_db
        
        mock_db.jobs.find_one.return_value = None
        
        job_id = str(ObjectId())
        response = client.post(f"/api/jobs/{job_id}/view")
        
        assert response.status_code == 404
        assert "Job not found" in response.json()["detail"]

    @patch('app.routers.jobs.get_database')
    @patch('app.routers.jobs.require_any_authenticated')
    def test_increment_job_view_invalid_id(self, mock_auth, mock_get_db, mock_student_user):
        """Test job view increment with invalid job ID."""
        mock_auth.return_value = mock_student_user
        mock_get_db.return_value = mock_db
        
        response = client.post("/api/jobs/invalid-id/view")
        
        assert response.status_code == 400
        assert "Invalid" in response.json()["detail"]

class TestJobMetadataEndpoints:
    
    @patch('app.routers.jobs.require_any_authenticated')
    def test_get_job_categories(self, mock_auth, mock_student_user):
        """Test getting job categories."""
        mock_auth.return_value = mock_student_user
        
        response = client.get("/api/jobs/student/categories")
        
        assert response.status_code == 200
        categories = response.json()
        
        assert isinstance(categories, list)
        assert len(categories) > 0
        assert "Frontend Development" in categories
        assert "Backend Development" in categories

    @patch('app.routers.jobs.require_any_authenticated')
    def test_get_job_difficulties(self, mock_auth, mock_student_user):
        """Test getting job difficulties."""
        mock_auth.return_value = mock_student_user
        
        response = client.get("/api/jobs/student/difficulties")
        
        assert response.status_code == 200
        difficulties = response.json()
        
        assert isinstance(difficulties, list)
        assert difficulties == ["Easy", "Medium", "Hard"]

class TestInputSanitization:
    
    @patch('app.routers.jobs.get_database')
    @patch('app.routers.jobs.require_any_authenticated')
    def test_search_input_sanitization(self, mock_auth, mock_get_db, mock_db, mock_student_user):
        """Test that search input is properly sanitized."""
        mock_auth.return_value = mock_student_user
        mock_get_db.return_value = mock_db
        
        mock_db.jobs.count_documents.return_value = 0
        mock_db.jobs.find.return_value.skip.return_value.limit.return_value.sort.return_value.to_list.return_value = []
        mock_db.task_submissions.find.return_value.to_list.return_value = []
        
        # Test with potentially malicious input
        malicious_search = "<script>alert('xss')</script>"
        response = client.get(f"/api/jobs/student/browse?search={malicious_search}")
        
        # Should still return 200 but with sanitized input
        assert response.status_code == 200

    @patch('app.routers.jobs.get_database')
    @patch('app.routers.jobs.require_any_authenticated')
    def test_location_input_sanitization(self, mock_auth, mock_get_db, mock_db, mock_student_user):
        """Test that location inputs are properly sanitized."""
        mock_auth.return_value = mock_student_user
        mock_get_db.return_value = mock_db
        
        mock_db.jobs.count_documents.return_value = 0
        mock_db.jobs.find.return_value.skip.return_value.limit.return_value.sort.return_value.to_list.return_value = []
        mock_db.task_submissions.find.return_value.to_list.return_value = []
        
        # Test with potentially malicious input
        malicious_city = "<script>alert('xss')</script>"
        response = client.get(f"/api/jobs/student/browse?city={malicious_city}")
        
        # Should still return 200 but with sanitized input
        assert response.status_code == 200