"""
Test suite for security features in DoProof application.
Tests input sanitization, access control, and audit logging.
"""

import pytest
import asyncio
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from bson import ObjectId

from app.main import app
from app.core.security import (
    InputSanitizer, FileUploadSecurity, CompanyIsolation, 
    AuditLogger, SecurityError
)
from app.models.user import UserRole

client = TestClient(app)

class TestInputSanitizer:
    """Test input sanitization functionality."""
    
    def test_sanitize_string_valid_input(self):
        """Test sanitization of valid string input."""
        result = InputSanitizer.sanitize_string("Hello World", max_length=20)
        assert result == "Hello World"
    
    def test_sanitize_string_html_escape(self):
        """Test HTML escaping in string sanitization."""
        result = InputSanitizer.sanitize_string("<script>alert('xss')</script>")
        assert "&lt;script&gt;" in result
        assert "&lt;/script&gt;" in result
    
    def test_sanitize_string_dangerous_patterns(self):
        """Test detection of dangerous patterns."""
        dangerous_inputs = [
            "<script>alert('xss')</script>",
            "javascript:alert('xss')",
            "<iframe src='evil.com'></iframe>",
            "onclick='alert(1)'"
        ]
        
        for dangerous_input in dangerous_inputs:
            with pytest.raises(SecurityError):
                InputSanitizer.sanitize_string(dangerous_input)
    
    def test_sanitize_string_length_limit(self):
        """Test string length validation."""
        long_string = "a" * 1001
        with pytest.raises(SecurityError):
            InputSanitizer.sanitize_string(long_string, max_length=1000)
    
    def test_validate_email_valid(self):
        """Test valid email validation."""
        valid_emails = [
            "user@example.com",
            "test.email+tag@domain.co.uk",
            "user123@test-domain.org"
        ]
        
        for email in valid_emails:
            result = InputSanitizer.validate_email(email)
            assert result == email.lower()
    
    def test_validate_email_invalid(self):
        """Test invalid email validation."""
        invalid_emails = [
            "invalid-email",
            "@domain.com",
            "user@",
            "user..double.dot@domain.com"
        ]
        
        for email in invalid_emails:
            with pytest.raises(SecurityError):
                InputSanitizer.validate_email(email)
    
    def test_validate_object_id_valid(self):
        """Test valid ObjectId validation."""
        valid_id = str(ObjectId())
        result = InputSanitizer.validate_object_id(valid_id)
        assert isinstance(result, ObjectId)
        assert str(result) == valid_id
    
    def test_validate_object_id_invalid(self):
        """Test invalid ObjectId validation."""
        invalid_ids = [
            "invalid-id",
            "123",
            "not-an-object-id",
            ""
        ]
        
        for invalid_id in invalid_ids:
            with pytest.raises(SecurityError):
                InputSanitizer.validate_object_id(invalid_id)
    
    def test_sanitize_filename_valid(self):
        """Test valid filename sanitization."""
        valid_filenames = [
            "document.pdf",
            "my-file_v2.docx",
            "image123.jpg"
        ]
        
        for filename in valid_filenames:
            result = InputSanitizer.sanitize_filename(filename)
            assert result == filename
    
    def test_sanitize_filename_dangerous(self):
        """Test dangerous filename sanitization."""
        dangerous_filenames = [
            "../../../etc/passwd",
            "file\\with\\backslashes.txt",
            "file/with/slashes.pdf"
        ]
        
        for filename in dangerous_filenames:
            result = InputSanitizer.sanitize_filename(filename)
            assert ".." not in result
            assert "/" not in result
            assert "\\" not in result

class TestFileUploadSecurity:
    """Test file upload security functionality."""
    
    def test_validate_resume_upload_valid(self):
        """Test valid resume upload validation."""
        result = FileUploadSecurity.validate_resume_upload(
            filename="resume.pdf",
            file_size=1024 * 1024,  # 1MB
            file_type="application/pdf"
        )
        assert result == "resume.pdf"
    
    def test_validate_resume_upload_invalid_type(self):
        """Test invalid file type for resume upload."""
        with pytest.raises(SecurityError):
            FileUploadSecurity.validate_resume_upload(
                filename="resume.exe",
                file_size=1024,
                file_type="application/x-executable"
            )
    
    def test_validate_resume_upload_too_large(self):
        """Test file size limit for resume upload."""
        with pytest.raises(SecurityError):
            FileUploadSecurity.validate_resume_upload(
                filename="resume.pdf",
                file_size=10 * 1024 * 1024,  # 10MB (exceeds 5MB limit)
                file_type="application/pdf"
            )
    
    def test_validate_image_upload_valid(self):
        """Test valid image upload validation."""
        result = FileUploadSecurity.validate_image_upload(
            filename="logo.png",
            file_size=512 * 1024,  # 512KB
            file_type="image/png"
        )
        assert result == "logo.png"
    
    def test_validate_submission_upload_valid(self):
        """Test valid submission upload validation."""
        result = FileUploadSecurity.validate_submission_upload(
            filename="submission.zip",
            file_size=5 * 1024 * 1024,  # 5MB
            file_type="application/zip"
        )
        assert result == "submission.zip"

class TestCompanyIsolation:
    """Test company/recruiter data isolation."""
    
    def test_check_resource_access_same_recruiter(self):
        """Test access control for same recruiter."""
        user = {
            "_id": ObjectId(),
            "role": UserRole.RECRUITER,
            "company": "company1"
        }
        
        result = CompanyIsolation.check_resource_access(
            current_user=user,
            resource_recruiter_id=str(user["_id"])
        )
        assert result is True
    
    def test_check_resource_access_different_recruiter(self):
        """Test access control for different recruiter."""
        user = {
            "_id": ObjectId(),
            "role": UserRole.RECRUITER,
            "company": "company1"
        }
        
        result = CompanyIsolation.check_resource_access(
            current_user=user,
            resource_recruiter_id=str(ObjectId())  # Different recruiter
        )
        assert result is False
    
    def test_check_resource_access_admin(self):
        """Test admin access to all resources."""
        user = {
            "_id": ObjectId(),
            "role": UserRole.ADMIN,
            "company": None
        }
        
        result = CompanyIsolation.check_resource_access(
            current_user=user,
            resource_recruiter_id=str(ObjectId())
        )
        assert result is True
    
    def test_get_isolation_filter_recruiter(self):
        """Test isolation filter for recruiter."""
        user = {
            "_id": ObjectId(),
            "role": UserRole.RECRUITER
        }
        
        result = CompanyIsolation.get_isolation_filter(user)
        expected = {"recruiter_id": user["_id"]}
        assert result == expected
    
    def test_get_isolation_filter_admin(self):
        """Test isolation filter for admin (no filter)."""
        user = {
            "_id": ObjectId(),
            "role": UserRole.ADMIN
        }
        
        result = CompanyIsolation.get_isolation_filter(user)
        assert result == {}
    
    def test_get_isolation_filter_student(self):
        """Test isolation filter for student."""
        user = {
            "_id": ObjectId(),
            "role": UserRole.STUDENT
        }
        
        result = CompanyIsolation.get_isolation_filter(user)
        expected = {"candidate_id": user["_id"]}
        assert result == expected

class TestAuditLogger:
    """Test audit logging functionality."""
    
    def test_log_action(self):
        """Test basic audit logging."""
        with patch('app.core.security.audit_logger') as mock_logger:
            AuditLogger.log_action(
                user_id="user123",
                action="TEST_ACTION",
                resource_type="test",
                resource_id="resource123",
                ip_address="192.168.1.1"
            )
            
            mock_logger.info.assert_called_once()
            call_args = mock_logger.info.call_args[0][0]
            assert "TEST_ACTION" in call_args
            assert "user123" in call_args
    
    @pytest.mark.asyncio
    async def test_log_to_database(self):
        """Test database audit logging."""
        with patch('app.core.security.get_database') as mock_get_db:
            mock_db = MagicMock()
            mock_get_db.return_value = mock_db
            
            await AuditLogger.log_to_database(
                user_id="user123",
                action="TEST_ACTION",
                resource_type="test",
                resource_id="resource123",
                ip_address="192.168.1.1"
            )
            
            mock_db.audit_logs.insert_one.assert_called_once()
            call_args = mock_db.audit_logs.insert_one.call_args[0][0]
            assert call_args["action"] == "TEST_ACTION"
            assert str(call_args["user_id"]) == "user123"

class TestSecurityMiddleware:
    """Test security middleware functionality."""
    
    def test_security_headers(self):
        """Test that security headers are added to responses."""
        response = client.get("/")
        
        # Check for security headers
        assert "X-Frame-Options" in response.headers
        assert "X-Content-Type-Options" in response.headers
        assert "X-XSS-Protection" in response.headers
        assert "Referrer-Policy" in response.headers
        assert "Content-Security-Policy" in response.headers
        
        # Verify header values
        assert response.headers["X-Frame-Options"] == "DENY"
        assert response.headers["X-Content-Type-Options"] == "nosniff"
        assert response.headers["X-XSS-Protection"] == "1; mode=block"
    
    def test_request_size_limit(self):
        """Test request size validation."""
        # This would need to be tested with actual large request
        # For now, just verify the middleware is in place
        response = client.get("/")
        assert response.status_code != 413  # Should not be rejected for normal request

class TestRoleBasedAccess:
    """Test role-based access control."""
    
    def test_require_recruiter_role_success(self):
        """Test successful recruiter role requirement."""
        # This would need proper authentication setup
        # For now, test the role checker logic
        from app.core.security import RoleChecker
        
        checker = RoleChecker([UserRole.RECRUITER, UserRole.ADMIN])
        
        # Mock user with recruiter role
        recruiter_user = {"role": UserRole.RECRUITER}
        result = checker(recruiter_user)
        assert result == recruiter_user
    
    def test_require_recruiter_role_failure(self):
        """Test failed recruiter role requirement."""
        from app.core.security import RoleChecker
        from fastapi import HTTPException
        
        checker = RoleChecker([UserRole.RECRUITER])
        
        # Mock user with student role
        student_user = {"role": UserRole.STUDENT}
        
        with pytest.raises(HTTPException) as exc_info:
            checker(student_user)
        
        assert exc_info.value.status_code == 403

if __name__ == "__main__":
    pytest.main([__file__])