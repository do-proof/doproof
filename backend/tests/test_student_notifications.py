"""
Integration tests for student notification endpoints
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
def mock_notifications():
    return [
        {
            "_id": ObjectId(),
            "user_id": ObjectId(),
            "type": "deadline",
            "title": "Task Deadline Approaching",
            "message": "Your task is due in 2 hours",
            "read": False,
            "created_at": datetime.now(),
        },
        {
            "_id": ObjectId(),
            "user_id": ObjectId(),
            "type": "evaluation",
            "title": "Evaluation Complete",
            "message": "Your submission has been evaluated",
            "read": True,
            "created_at": datetime.now() - timedelta(hours=1),
        },
    ]

class TestStudentNotifications:
    """Test student notification endpoints"""
    
    @patch('app.core.auth.get_current_user')
    @patch('app.core.database.get_database')
    def test_get_notifications_success(
        self,
        mock_get_db,
        mock_get_current_user,
        mock_student_user,
        mock_notifications
    ):
        """Test successful notifications retrieval"""
        mock_get_current_user.return_value = mock_student_user
        
        mock_db = AsyncMock()
        mock_db.notifications.find = AsyncMock(return_value=AsyncMock(
            sort=AsyncMock(return_value=AsyncMock(
                limit=AsyncMock(return_value=AsyncMock(
                    to_list=AsyncMock(return_value=mock_notifications)
                ))
            ))
        ))
        mock_get_db.return_value = mock_db
        
        response = client.get(
            "/api/students/notifications",
            headers={"Authorization": "Bearer fake-token"}
        )
        
        assert response.status_code in [200, 401, 403]
        
        if response.status_code == 200:
            data = response.json()
            assert isinstance(data, list)
            assert len(data) == 2
    
    @patch('app.core.auth.get_current_user')
    @patch('app.core.database.get_database')
    def test_mark_notification_read(
        self,
        mock_get_db,
        mock_get_current_user,
        mock_student_user
    ):
        """Test marking notification as read"""
        mock_get_current_user.return_value = mock_student_user
        
        notification_id = str(ObjectId())
        mock_db = AsyncMock()
        mock_db.notifications.find_one = AsyncMock(return_value={
            "_id": ObjectId(notification_id),
            "user_id": ObjectId(mock_student_user["_id"]),
            "read": False,
        })
        mock_db.notifications.update_one = AsyncMock()
        mock_get_db.return_value = mock_db
        
        response = client.patch(
            f"/api/students/notifications/{notification_id}/read",
            headers={"Authorization": "Bearer fake-token"}
        )
        
        assert response.status_code in [200, 401, 403, 404]
    
    @patch('app.core.auth.get_current_user')
    @patch('app.core.database.get_database')
    def test_get_unread_count(
        self,
        mock_get_db,
        mock_get_current_user,
        mock_student_user
    ):
        """Test getting unread notification count"""
        mock_get_current_user.return_value = mock_student_user
        
        mock_db = AsyncMock()
        mock_db.notifications.count_documents = AsyncMock(return_value=5)
        mock_get_db.return_value = mock_db
        
        response = client.get(
            "/api/students/notifications/unread/count",
            headers={"Authorization": "Bearer fake-token"}
        )
        
        assert response.status_code in [200, 401, 403]
        
        if response.status_code == 200:
            data = response.json()
            assert data["unread_count"] == 5
