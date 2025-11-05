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
def mock_recruiter_user():
    return {
        "_id": ObjectId(),
        "email": "recruiter@example.com",
        "role": UserRole.RECRUITER
    }

@pytest.fixture
def mock_job():
    return {
        "_id": ObjectId(),
        "title": "Test Job",
        "description": "Test job description",
        "status": "active",
        "closing_date": datetime.now() + timedelta(days=30),
        "task": {
            "title": "Test Task",
            "description": "Complete this test task",
            "time_limit": 120,
            "submission_format": "code"
        },
        "application_count": 0
    }

@pytest.fixture
def mock_application():
    return {
        "_id": ObjectId(),
        "job_id": ObjectId(),
        "candidate_id": ObjectId(),
        "status": "in_progress",
        "started_at": datetime.now(),
        "created_at": datetime.now(),
        "updated_at": datetime.now(),
        "time_spent": 0
    }

class TestStudentEnrollment:
    
    @patch('app.routers.students.get_database')
    @patch('app.routers.students.require_any_authenticated')
    @patch('app.routers.students.get_client_ip')
    @patch('app.routers.students.AuditLogger')
    def test_enroll_in_job_success(self, mock_audit, mock_get_ip, mock_auth, mock_get_db, 
                                   mock_db, mock_student_user, mock_job):
        """Test successful job enrollment."""
        mock_auth.return_value = mock_student_user
        mock_get_db.return_value = mock_db
        mock_get_ip.return_value = "127.0.0.1"
        
        job_id = str(mock_job["_id"])
        
        # Mock database responses
        mock_db.jobs.find_one.return_value = mock_job
        mock_db.task_submissions.find_one.return_value = None  # No existing application
        mock_db.task_submissions.insert_one.return_value = AsyncMock(inserted_id=ObjectId())
        mock_db.task_submissions.find_one.return_value = {
            "_id": ObjectId(),
            "job_id": mock_job["_id"],
            "candidate_id": mock_student_user["_id"],
            "status": "in_progress",
            "started_at": datetime.now(),
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
            "time_spent": 0
        }
        mock_db.jobs.update_one.return_value = AsyncMock()
        
        enrollment_data = {
            "cover_letter": "I am interested in this position",
            "expected_completion_time": 90
        }
        
        response = client.post(f"/api/students/applications/{job_id}/enroll", json=enrollment_data)
        
        assert response.status_code == 201
        data = response.json()
        
        assert data["job_id"] == job_id
        assert data["status"] == "in_progress"
        assert "enrolled_at" in data
        assert "progress" in data
        
        # Verify database operations
        mock_db.task_submissions.insert_one.assert_called_once()
        mock_db.jobs.update_one.assert_called_once()
        mock_audit.log_action.assert_called_once()

    @patch('app.routers.students.get_database')
    @patch('app.routers.students.require_any_authenticated')
    def test_enroll_already_enrolled(self, mock_auth, mock_get_db, mock_db, mock_student_user, mock_job):
        """Test enrollment when already enrolled."""
        mock_auth.return_value = mock_student_user
        mock_get_db.return_value = mock_db
        
        job_id = str(mock_job["_id"])
        
        # Mock existing application
        mock_db.jobs.find_one.return_value = mock_job
        mock_db.task_submissions.find_one.return_value = {
            "_id": ObjectId(),
            "job_id": mock_job["_id"],
            "candidate_id": mock_student_user["_id"]
        }
        
        response = client.post(f"/api/students/applications/{job_id}/enroll", json={})
        
        assert response.status_code == 400
        assert "already enrolled" in response.json()["detail"]

    @patch('app.routers.students.get_database')
    @patch('app.routers.students.require_any_authenticated')
    def test_enroll_job_not_found(self, mock_auth, mock_get_db, mock_db, mock_student_user):
        """Test enrollment with non-existent job."""
        mock_auth.return_value = mock_student_user
        mock_get_db.return_value = mock_db
        
        job_id = str(ObjectId())
        mock_db.jobs.find_one.return_value = None
        
        response = client.post(f"/api/students/applications/{job_id}/enroll", json={})
        
        assert response.status_code == 404
        assert "Job not found" in response.json()["detail"]

    @patch('app.routers.students.get_database')
    @patch('app.routers.students.require_any_authenticated')
    def test_enroll_expired_job(self, mock_auth, mock_get_db, mock_db, mock_student_user, mock_job):
        """Test enrollment with expired job."""
        mock_auth.return_value = mock_student_user
        mock_get_db.return_value = mock_db
        
        # Set job as expired
        expired_job = {**mock_job, "closing_date": datetime.now() - timedelta(days=1)}
        mock_db.jobs.find_one.return_value = expired_job
        
        job_id = str(mock_job["_id"])
        response = client.post(f"/api/students/applications/{job_id}/enroll", json={})
        
        assert response.status_code == 400
        assert "deadline has passed" in response.json()["detail"]

    @patch('app.routers.students.get_database')
    @patch('app.routers.students.require_any_authenticated')
    def test_enroll_non_student_user(self, mock_auth, mock_get_db, mock_recruiter_user):
        """Test enrollment with non-student user."""
        mock_auth.return_value = mock_recruiter_user
        mock_get_db.return_value = AsyncMock()
        
        job_id = str(ObjectId())
        response = client.post(f"/api/students/applications/{job_id}/enroll", json={})
        
        assert response.status_code == 403
        assert "Only students can enroll" in response.json()["detail"]

class TestStudentApplications:
    
    @patch('app.routers.students.get_database')
    @patch('app.routers.students.require_any_authenticated')
    def test_get_applications_success(self, mock_auth, mock_get_db, mock_db, mock_student_user):
        """Test getting student applications."""
        mock_auth.return_value = mock_student_user
        mock_get_db.return_value = mock_db
        
        # Mock applications
        mock_applications = [
            {
                "_id": ObjectId(),
                "job_id": ObjectId(),
                "candidate_id": mock_student_user["_id"],
                "status": "in_progress",
                "started_at": datetime.now(),
                "created_at": datetime.now(),
                "updated_at": datetime.now(),
                "time_spent": 30
            }
        ]
        
        mock_job = {
            "_id": mock_applications[0]["job_id"],
            "title": "Test Job",
            "description": "Test Description",
            "task": {"time_limit": 120}
        }
        
        mock_db.task_submissions.count_documents.return_value = 1
        mock_db.task_submissions.find.return_value.skip.return_value.limit.return_value.sort.return_value.to_list.return_value = mock_applications
        mock_db.jobs.find.return_value.to_list.return_value = [mock_job]
        
        response = client.get("/api/students/applications")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "applications" in data
        assert "summary" in data
        assert data["total"] == 1
        assert len(data["applications"]) == 1

    @patch('app.routers.students.get_database')
    @patch('app.routers.students.require_any_authenticated')
    def test_get_applications_with_filters(self, mock_auth, mock_get_db, mock_db, mock_student_user):
        """Test getting applications with filters."""
        mock_auth.return_value = mock_student_user
        mock_get_db.return_value = mock_db
        
        mock_db.task_submissions.count_documents.return_value = 0
        mock_db.task_submissions.find.return_value.skip.return_value.limit.return_value.sort.return_value.to_list.return_value = []
        mock_db.jobs.find.return_value.to_list.return_value = []
        
        response = client.get("/api/students/applications?status=in_progress&has_evaluation=true")
        
        assert response.status_code == 200
        
        # Verify filter was applied
        call_args = mock_db.task_submissions.count_documents.call_args[0][0]
        assert "status" in call_args
        assert "ai_evaluation" in call_args

    @patch('app.routers.students.get_database')
    @patch('app.routers.students.require_any_authenticated')
    def test_get_application_summary(self, mock_auth, mock_get_db, mock_db, mock_student_user):
        """Test getting application summary."""
        mock_auth.return_value = mock_student_user
        mock_get_db.return_value = mock_db
        
        # Mock applications for summary calculation
        mock_db.task_submissions.find.return_value.to_list.return_value = [
            {
                "_id": ObjectId(),
                "candidate_id": mock_student_user["_id"],
                "status": "completed",
                "created_at": datetime.now(),
                "ai_evaluation": {"overall_score": 85}
            }
        ]
        
        response = client.get("/api/students/applications/summary")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "total" in data
        assert "by_status" in data
        assert "completion_rate" in data
        assert "average_score" in data
        assert "recent_activity" in data

    @patch('app.routers.students.get_database')
    @patch('app.routers.students.require_any_authenticated')
    def test_get_application_by_job(self, mock_auth, mock_get_db, mock_db, mock_student_user):
        """Test getting application by job ID."""
        mock_auth.return_value = mock_student_user
        mock_get_db.return_value = mock_db
        
        job_id = str(ObjectId())
        mock_application = {
            "_id": ObjectId(),
            "job_id": ObjectId(job_id),
            "candidate_id": mock_student_user["_id"],
            "status": "in_progress",
            "started_at": datetime.now(),
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
            "time_spent": 45
        }
        
        mock_job = {
            "_id": ObjectId(job_id),
            "title": "Test Job",
            "description": "Test Description",
            "task": {"time_limit": 120}
        }
        
        mock_db.task_submissions.find_one.return_value = mock_application
        mock_db.jobs.find_one.return_value = mock_job
        
        response = client.get(f"/api/students/applications/by-job/{job_id}")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "application" in data
        assert data["application"]["job_id"] == job_id

    @patch('app.routers.students.get_database')
    @patch('app.routers.students.require_any_authenticated')
    def test_get_application_by_job_not_found(self, mock_auth, mock_get_db, mock_db, mock_student_user):
        """Test getting application by job ID when not found."""
        mock_auth.return_value = mock_student_user
        mock_get_db.return_value = mock_db
        
        job_id = str(ObjectId())
        mock_db.task_submissions.find_one.return_value = None
        
        response = client.get(f"/api/students/applications/by-job/{job_id}")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["application"] is None

class TestApplicationProgress:
    
    @patch('app.routers.students.get_database')
    @patch('app.routers.students.require_any_authenticated')
    def test_update_progress_success(self, mock_auth, mock_get_db, mock_db, mock_student_user, mock_application):
        """Test successful progress update."""
        mock_auth.return_value = mock_student_user
        mock_get_db.return_value = mock_db
        
        application_id = str(mock_application["_id"])
        mock_application["candidate_id"] = mock_student_user["_id"]
        
        mock_db.task_submissions.find_one.return_value = mock_application
        mock_db.task_submissions.update_one.return_value = AsyncMock()
        
        # Mock updated application
        updated_app = {**mock_application, "time_spent": 60}
        mock_db.task_submissions.find_one.return_value = updated_app
        
        mock_job = {
            "_id": mock_application["job_id"],
            "task": {"time_limit": 120}
        }
        mock_db.jobs.find_one.return_value = mock_job
        
        progress_data = {"time_spent": 60}
        response = client.patch(f"/api/students/applications/{application_id}/progress", json=progress_data)
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["progress"]["time_spent"] == 60
        mock_db.task_submissions.update_one.assert_called_once()

    @patch('app.routers.students.get_database')
    @patch('app.routers.students.require_any_authenticated')
    def test_update_progress_not_in_progress(self, mock_auth, mock_get_db, mock_db, mock_student_user, mock_application):
        """Test progress update for non-in-progress application."""
        mock_auth.return_value = mock_student_user
        mock_get_db.return_value = mock_db
        
        application_id = str(mock_application["_id"])
        mock_application["candidate_id"] = mock_student_user["_id"]
        mock_application["status"] = "submitted"
        
        mock_db.task_submissions.find_one.return_value = mock_application
        
        progress_data = {"time_spent": 60}
        response = client.patch(f"/api/students/applications/{application_id}/progress", json=progress_data)
        
        assert response.status_code == 400
        assert "in-progress applications" in response.json()["detail"]

class TestApplicationWithdrawal:
    
    @patch('app.routers.students.get_database')
    @patch('app.routers.students.require_any_authenticated')
    def test_withdraw_application_success(self, mock_auth, mock_get_db, mock_db, mock_student_user, mock_application):
        """Test successful application withdrawal."""
        mock_auth.return_value = mock_student_user
        mock_get_db.return_value = mock_db
        
        application_id = str(mock_application["_id"])
        mock_application["candidate_id"] = mock_student_user["_id"]
        mock_application["status"] = "in_progress"
        
        mock_db.task_submissions.find_one.return_value = mock_application
        mock_db.task_submissions.delete_one.return_value = AsyncMock()
        mock_db.jobs.update_one.return_value = AsyncMock()
        
        response = client.delete(f"/api/students/applications/{application_id}")
        
        assert response.status_code == 204
        mock_db.task_submissions.delete_one.assert_called_once()
        mock_db.jobs.update_one.assert_called_once()

    @patch('app.routers.students.get_database')
    @patch('app.routers.students.require_any_authenticated')
    def test_withdraw_submitted_application(self, mock_auth, mock_get_db, mock_db, mock_student_user, mock_application):
        """Test withdrawal of submitted application (should fail)."""
        mock_auth.return_value = mock_student_user
        mock_get_db.return_value = mock_db
        
        application_id = str(mock_application["_id"])
        mock_application["candidate_id"] = mock_student_user["_id"]
        mock_application["status"] = "submitted"
        
        mock_db.task_submissions.find_one.return_value = mock_application
        
        response = client.delete(f"/api/students/applications/{application_id}")
        
        assert response.status_code == 400
        assert "Cannot withdraw application" in response.json()["detail"]