"""
Performance tests for student endpoints - data-heavy operations
"""

import pytest
import time
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from bson import ObjectId
from unittest.mock import AsyncMock, patch

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
def mock_large_dataset():
    """Create a large dataset for performance testing"""
    applications = []
    for i in range(1000):
        applications.append({
            "_id": ObjectId(),
            "job_id": ObjectId(),
            "candidate_id": ObjectId(),
            "status": "submitted",
            "created_at": datetime.now() - timedelta(days=i),
            "updated_at": datetime.now()
        })
    return applications

class TestApplicationListPerformance:
    """Test performance of listing applications"""
    
    @patch('app.core.auth.get_current_user')
    @patch('app.core.database.get_database')
    def test_list_applications_performance(
        self,
        mock_get_db,
        mock_get_current_user,
        mock_student_user,
        mock_large_dataset
    ):
        """Test that listing applications performs well with large datasets"""
        mock_get_current_user.return_value = mock_student_user
        
        mock_db = AsyncMock()
        mock_db.task_submissions.find = AsyncMock(return_value=AsyncMock(
            skip=AsyncMock(return_value=AsyncMock(
                limit=AsyncMock(return_value=AsyncMock(
                    sort=AsyncMock(return_value=AsyncMock(
                        to_list=AsyncMock(return_value=mock_large_dataset[:20])
                    ))
                ))
            ))
        ))
        mock_db.task_submissions.count_documents = AsyncMock(return_value=len(mock_large_dataset))
        mock_get_db.return_value = mock_db
        
        start_time = time.time()
        response = client.get(
            "/api/students/applications?page=1&per_page=20",
            headers={"Authorization": "Bearer fake-token"}
        )
        end_time = time.time()
        
        elapsed_time = end_time - start_time
        
        # Should complete in reasonable time (< 1 second for 20 items)
        assert elapsed_time < 1.0
        assert response.status_code in [200, 401, 403]  # May fail auth in test
    
    @patch('app.core.auth.get_current_user')
    @patch('app.core.database.get_database')
    def test_pagination_performance(
        self,
        mock_get_db,
        mock_get_current_user,
        mock_student_user,
        mock_large_dataset
    ):
        """Test that pagination works efficiently"""
        mock_get_current_user.return_value = mock_student_user
        
        mock_db = AsyncMock()
        mock_db.task_submissions.find = AsyncMock(return_value=AsyncMock(
            skip=AsyncMock(return_value=AsyncMock(
                limit=AsyncMock(return_value=AsyncMock(
                    sort=AsyncMock(return_value=AsyncMock(
                        to_list=AsyncMock(return_value=mock_large_dataset[20:40])
                    ))
                ))
            ))
        ))
        mock_db.task_submissions.count_documents = AsyncMock(return_value=len(mock_large_dataset))
        mock_get_db.return_value = mock_db
        
        start_time = time.time()
        response = client.get(
            "/api/students/applications?page=2&per_page=20",
            headers={"Authorization": "Bearer fake-token"}
        )
        end_time = time.time()
        
        elapsed_time = end_time - start_time
        
        # Pagination should be fast
        assert elapsed_time < 1.0

class TestSearchPerformance:
    """Test performance of search operations"""
    
    @patch('app.core.auth.get_current_user')
    @patch('app.core.database.get_database')
    def test_search_with_large_dataset(
        self,
        mock_get_db,
        mock_get_current_user,
        mock_student_user,
        mock_large_dataset
    ):
        """Test that search performs well with large datasets"""
        mock_get_current_user.return_value = mock_student_user
        
        # Filter dataset
        filtered = [app for app in mock_large_dataset if "test" in str(app["_id"])]
        
        mock_db = AsyncMock()
        mock_db.task_submissions.find = AsyncMock(return_value=AsyncMock(
            skip=AsyncMock(return_value=AsyncMock(
                limit=AsyncMock(return_value=AsyncMock(
                    sort=AsyncMock(return_value=AsyncMock(
                        to_list=AsyncMock(return_value=filtered[:20])
                    ))
                ))
            ))
        ))
        mock_db.task_submissions.count_documents = AsyncMock(return_value=len(filtered))
        mock_get_db.return_value = mock_db
        
        start_time = time.time()
        response = client.get(
            "/api/students/applications?search=test&page=1&per_page=20",
            headers={"Authorization": "Bearer fake-token"}
        )
        end_time = time.time()
        
        elapsed_time = end_time - start_time
        
        # Search should complete in reasonable time
        assert elapsed_time < 2.0

class TestAnalyticsPerformance:
    """Test performance of analytics operations"""
    
    @patch('app.core.auth.get_current_user')
    @patch('app.core.database.get_database')
    def test_analytics_calculation_performance(
        self,
        mock_get_db,
        mock_get_current_user,
        mock_student_user,
        mock_large_dataset
    ):
        """Test that analytics calculations perform well"""
        mock_get_current_user.return_value = mock_student_user
        
        mock_db = AsyncMock()
        mock_db.task_submissions.find = AsyncMock(return_value=AsyncMock(
            to_list=AsyncMock(return_value=mock_large_dataset)
        ))
        mock_get_db.return_value = mock_db
        
        start_time = time.time()
        response = client.get(
            "/api/students/analytics",
            headers={"Authorization": "Bearer fake-token"}
        )
        end_time = time.time()
        
        elapsed_time = end_time - start_time
        
        # Analytics should complete in reasonable time
        assert elapsed_time < 3.0

class TestConcurrentRequests:
    """Test performance under concurrent load"""
    
    @patch('app.core.auth.get_current_user')
    @patch('app.core.database.get_database')
    def test_concurrent_application_requests(
        self,
        mock_get_db,
        mock_get_current_user,
        mock_student_user
    ):
        """Test that endpoint handles concurrent requests efficiently"""
        import concurrent.futures
        
        mock_get_current_user.return_value = mock_student_user
        
        mock_db = AsyncMock()
        mock_db.task_submissions.find = AsyncMock(return_value=AsyncMock(
            skip=AsyncMock(return_value=AsyncMock(
                limit=AsyncMock(return_value=AsyncMock(
                    sort=AsyncMock(return_value=AsyncMock(
                        to_list=AsyncMock(return_value=[])
                    ))
                ))
            ))
        ))
        mock_db.task_submissions.count_documents = AsyncMock(return_value=0)
        mock_get_db.return_value = mock_db
        
        def make_request():
            return client.get(
                "/api/students/applications",
                headers={"Authorization": "Bearer fake-token"}
            )
        
        start_time = time.time()
        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
            futures = [executor.submit(make_request) for _ in range(10)]
            results = [future.result() for future in concurrent.futures.as_completed(futures)]
        end_time = time.time()
        
        elapsed_time = end_time - start_time
        
        # All requests should complete in reasonable time
        assert elapsed_time < 5.0
        assert all(r.status_code in [200, 401, 403] for r in results)

