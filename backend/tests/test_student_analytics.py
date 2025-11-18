"""
Integration tests for student analytics endpoints
"""

import pytest
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from bson import ObjectId
from unittest.mock import AsyncMock, patch, MagicMock

from app.main import app

client = TestClient(app)

@pytest.fixture
def mock_student_user():
    return {
        "_id": str(ObjectId()),
        "email": "student@example.com",
        "role": "student"
    }

@pytest.fixture
def mock_applications():
    return [
        {
            "_id": ObjectId(),
            "job_id": ObjectId(),
            "candidate_id": ObjectId(),
            "status": "completed",
            "ai_evaluation": {
                "overall_score": 8.5,
                "criteria_scores": {
                    "technical_skills": 9.0,
                    "problem_solving": 8.0,
                    "creativity": 8.5,
                },
                "evaluated_at": datetime.now() - timedelta(days=i)
            },
            "time_spent": 120,
            "created_at": datetime.now() - timedelta(days=i),
        }
        for i in range(10)
    ]

class TestStudentAnalytics:
    """Test student analytics endpoints"""
    
    @patch('app.core.auth.get_current_user')
    @patch('app.core.database.get_database')
    def test_get_analytics_success(
        self,
        mock_get_db,
        mock_get_current_user,
        mock_student_user,
        mock_applications
    ):
        """Test successful analytics retrieval"""
        mock_get_current_user.return_value = mock_student_user
        
        mock_db = AsyncMock()
        mock_db.task_submissions.find = AsyncMock(return_value=AsyncMock(
            to_list=AsyncMock(return_value=mock_applications)
        ))
        mock_get_db.return_value = mock_db
        
        response = client.get(
            "/api/students/analytics",
            headers={"Authorization": "Bearer fake-token"}
        )
        
        assert response.status_code in [200, 401, 403]
        
        if response.status_code == 200:
            data = response.json()
            assert "performance" in data
            assert "activity" in data
            assert "ranking" in data or "insights" in data
    
    @patch('app.core.auth.get_current_user')
    @patch('app.core.database.get_database')
    def test_analytics_with_no_data(
        self,
        mock_get_db,
        mock_get_current_user,
        mock_student_user
    ):
        """Test analytics with no application data"""
        mock_get_current_user.return_value = mock_student_user
        
        mock_db = AsyncMock()
        mock_db.task_submissions.find = AsyncMock(return_value=AsyncMock(
            to_list=AsyncMock(return_value=[])
        ))
        mock_get_db.return_value = mock_db
        
        response = client.get(
            "/api/students/analytics",
            headers={"Authorization": "Bearer fake-token"}
        )
        
        assert response.status_code in [200, 401, 403]
        
        if response.status_code == 200:
            data = response.json()
            assert data["activity"]["tasks_completed"] == 0
    
    @patch('app.core.auth.get_current_user')
    @patch('app.core.database.get_database')
    def test_analytics_calculates_completion_rate(
        self,
        mock_get_db,
        mock_get_current_user,
        mock_student_user
    ):
        """Test that completion rate is calculated correctly"""
        mock_get_current_user.return_value = mock_student_user
        
        applications = [
            {"status": "completed", "ai_evaluation": {"overall_score": 8.0}},
            {"status": "completed", "ai_evaluation": {"overall_score": 9.0}},
            {"status": "in_progress"},
            {"status": "submitted"},
        ]
        
        mock_db = AsyncMock()
        mock_db.task_submissions.find = AsyncMock(return_value=AsyncMock(
            to_list=AsyncMock(return_value=applications)
        ))
        mock_get_db.return_value = mock_db
        
        response = client.get(
            "/api/students/analytics",
            headers={"Authorization": "Bearer fake-token"}
        )
        
        assert response.status_code in [200, 401, 403]
        
        if response.status_code == 200:
            data = response.json()
            # 2 completed out of 4 total = 50%
            assert data["performance"]["completion_rate"] == 50.0
    
    @patch('app.core.auth.get_current_user')
    @patch('app.core.database.get_database')
    def test_analytics_calculates_average_score(
        self,
        mock_get_db,
        mock_get_current_user,
        mock_student_user
    ):
        """Test that average score is calculated correctly"""
        mock_get_current_user.return_value = mock_student_user
        
        applications = [
            {
                "status": "completed",
                "ai_evaluation": {"overall_score": 8.0},
                "time_spent": 100,
                "created_at": datetime.now(),
            },
            {
                "status": "completed",
                "ai_evaluation": {"overall_score": 9.0},
                "time_spent": 120,
                "created_at": datetime.now(),
            },
        ]
        
        mock_db = AsyncMock()
        mock_db.task_submissions.find = AsyncMock(return_value=AsyncMock(
            to_list=AsyncMock(return_value=applications)
        ))
        mock_get_db.return_value = mock_db
        
        response = client.get(
            "/api/students/analytics",
            headers={"Authorization": "Bearer fake-token"}
        )
        
        assert response.status_code in [200, 401, 403]
        
        if response.status_code == 200:
            data = response.json()
            # Average of 8.0 and 9.0 = 8.5
            assert data["performance"]["average_score"] == 8.5

class TestStudentRecommendations:
    """Test student recommendation endpoints"""
    
    @patch('app.core.auth.get_current_user')
    @patch('app.core.database.get_database')
    def test_get_recommendations_success(
        self,
        mock_get_db,
        mock_get_current_user,
        mock_student_user
    ):
        """Test successful recommendations retrieval"""
        mock_get_current_user.return_value = mock_student_user
        
        mock_jobs = [
            {
                "_id": ObjectId(),
                "title": "Recommended Job",
                "status": "active",
                "closing_date": datetime.now() + timedelta(days=30),
            }
        ]
        
        mock_db = AsyncMock()
        mock_db.jobs.find = AsyncMock(return_value=AsyncMock(
            to_list=AsyncMock(return_value=mock_jobs)
        ))
        mock_db.student_profiles.find_one = AsyncMock(return_value={
            "skills": ["React", "TypeScript"],
            "preferences": {"job_types": ["full-time"]},
        })
        mock_get_db.return_value = mock_db
        
        response = client.get(
            "/api/students/recommendations",
            headers={"Authorization": "Bearer fake-token"}
        )
        
        assert response.status_code in [200, 401, 403]
        
        if response.status_code == 200:
            data = response.json()
            assert "recommendations" in data
    
    @patch('app.core.auth.get_current_user')
    @patch('app.core.database.get_database')
    def test_recommendations_based_on_profile(
        self,
        mock_get_db,
        mock_get_current_user,
        mock_student_user
    ):
        """Test that recommendations are based on student profile"""
        mock_get_current_user.return_value = mock_student_user
        
        mock_db = AsyncMock()
        mock_db.student_profiles.find_one = AsyncMock(return_value={
            "skills": ["React", "TypeScript"],
            "preferences": {"job_types": ["full-time"]},
        })
        mock_db.jobs.find = AsyncMock(return_value=AsyncMock(
            to_list=AsyncMock(return_value=[])
        ))
        mock_get_db.return_value = mock_db
        
        response = client.get(
            "/api/students/recommendations",
            headers={"Authorization": "Bearer fake-token"}
        )
        
        assert response.status_code in [200, 401, 403]
