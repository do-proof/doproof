"""
Tests for security features including data isolation, input sanitization, and audit logging.
"""

import pytest
from datetime import datetime
from bson import ObjectId

from app.core.security import (
    InputSanitizer, SecurityError, StudentDataIsolation, 
    CompanyIsolation, AuditLogger
)
from app.models.user import UserRole


class TestInputSanitizer:
    """Test input sanitization functionality."""
    
    def test_sanitize_string_basic(self):
        """Test basic string sanitization."""
        result = InputSanitizer.sanitize_string("Hello World")
        assert result == "Hello World"
    
    def test_sanitize_string_html_escape(self):
        """Test HTML escaping with dangerous patterns raises error."""
        # Dangerous patterns should raise SecurityError
        with pytest.raises(SecurityError):
            InputSanitizer.sanitize_string("<script>alert('xss')</script>")
        
        # Safe HTML should be escaped
        result = InputSanitizer.sanitize_string("<b>Hello</b>")
        assert "&lt;b&gt;" in result
        assert "<b>" not in result
    
    def test_sanitize_string_dangerous_pattern(self):
        """Test detection of dangerous patterns."""
        with pytest.raises(SecurityError):
            InputSanitizer.sanitize_string("<script>alert('xss')</script>", max_length=1000)
    
    def test_sanitize_string_max_length(self):
        """Test maximum length validation."""
        with pytest.raises(SecurityError):
            InputSanitizer.sanitize_string("a" * 1001, max_length=1000)
    
    def test_validate_email_valid(self):
        """Test valid email validation."""
        result = InputSanitizer.validate_email("test@example.com")
        assert result == "test@example.com"
    
    def test_validate_email_invalid(self):
        """Test invalid email validation."""
        with pytest.raises(SecurityError):
            InputSanitizer.validate_email("invalid-email")
    
    def test_sanitize_filename(self):
        """Test filename sanitization."""
        result = InputSanitizer.sanitize_filename("../../../etc/passwd")
        assert ".." not in result
        assert "/" not in result
        assert result == "etcpasswd"
    
    def test_validate_object_id_valid(self):
        """Test valid ObjectId validation."""
        valid_id = str(ObjectId())
        result = InputSanitizer.validate_object_id(valid_id)
        assert result == valid_id
    
    def test_validate_object_id_invalid(self):
        """Test invalid ObjectId validation."""
        with pytest.raises(SecurityError):
            InputSanitizer.validate_object_id("invalid-id")
    
    def test_sanitize_dict(self):
        """Test dictionary sanitization."""
        data = {
            "name": "John Doe",
            "bio": "<script>alert('xss')</script>",
            "skills": ["Python", "JavaScript"]
        }
        
        # This should raise an error due to dangerous pattern
        with pytest.raises(SecurityError):
            InputSanitizer.sanitize_dict(data)


class TestStudentDataIsolation:
    """Test student data isolation functionality."""
    
    def test_check_student_resource_access_own_resource(self):
        """Test student accessing their own resource."""
        user_id = str(ObjectId())
        current_user = {"_id": user_id, "role": UserRole.STUDENT}
        
        result = StudentDataIsolation.check_student_resource_access(
            current_user, user_id
        )
        assert result is True
    
    def test_check_student_resource_access_other_resource(self):
        """Test student accessing another student's resource."""
        user_id = str(ObjectId())
        other_user_id = str(ObjectId())
        current_user = {"_id": user_id, "role": UserRole.STUDENT}
        
        result = StudentDataIsolation.check_student_resource_access(
            current_user, other_user_id
        )
        assert result is False
    
    def test_check_student_resource_access_admin(self):
        """Test admin accessing any resource."""
        user_id = str(ObjectId())
        other_user_id = str(ObjectId())
        current_user = {"_id": user_id, "role": UserRole.ADMIN}
        
        result = StudentDataIsolation.check_student_resource_access(
            current_user, other_user_id
        )
        assert result is True
    
    def test_get_student_isolation_filter_student(self):
        """Test isolation filter for student."""
        user_id = ObjectId()
        current_user = {"_id": user_id, "role": UserRole.STUDENT}
        
        filter_result = StudentDataIsolation.get_student_isolation_filter(current_user)
        assert "candidate_id" in filter_result
        assert filter_result["candidate_id"] == user_id
    
    def test_get_student_isolation_filter_admin(self):
        """Test isolation filter for admin (no filter)."""
        user_id = ObjectId()
        current_user = {"_id": user_id, "role": UserRole.ADMIN}
        
        filter_result = StudentDataIsolation.get_student_isolation_filter(current_user)
        assert filter_result == {}
    
    def test_get_student_isolation_filter_recruiter(self):
        """Test isolation filter for recruiter (empty result)."""
        user_id = ObjectId()
        current_user = {"_id": user_id, "role": UserRole.RECRUITER}
        
        filter_result = StudentDataIsolation.get_student_isolation_filter(current_user)
        assert filter_result["_id"] is None


class TestCompanyIsolation:
    """Test company/recruiter data isolation functionality."""
    
    def test_check_resource_access_same_recruiter(self):
        """Test recruiter accessing their own resource."""
        user_id = str(ObjectId())
        current_user = {"id": user_id, "role": UserRole.RECRUITER}
        
        result = CompanyIsolation.check_resource_access(
            current_user, user_id
        )
        assert result is True
    
    def test_check_resource_access_different_recruiter(self):
        """Test recruiter accessing another recruiter's resource."""
        user_id = str(ObjectId())
        other_user_id = str(ObjectId())
        current_user = {"id": user_id, "role": UserRole.RECRUITER}
        
        result = CompanyIsolation.check_resource_access(
            current_user, other_user_id
        )
        assert result is False
    
    def test_check_resource_access_admin(self):
        """Test admin accessing any resource."""
        user_id = str(ObjectId())
        other_user_id = str(ObjectId())
        current_user = {"id": user_id, "role": UserRole.ADMIN}
        
        result = CompanyIsolation.check_resource_access(
            current_user, other_user_id
        )
        assert result is True
    
    def test_get_isolation_filter_recruiter(self):
        """Test isolation filter for recruiter."""
        user_id = str(ObjectId())
        current_user = {"id": user_id, "role": UserRole.RECRUITER}
        
        filter_result = CompanyIsolation.get_isolation_filter(current_user)
        assert "recruiter_id" in filter_result
        assert filter_result["recruiter_id"] == user_id
    
    def test_get_isolation_filter_admin(self):
        """Test isolation filter for admin (no filter)."""
        user_id = str(ObjectId())
        current_user = {"id": user_id, "role": UserRole.ADMIN}
        
        filter_result = CompanyIsolation.get_isolation_filter(current_user)
        assert filter_result == {}


class TestAuditLogger:
    """Test audit logging functionality."""
    
    def test_log_action_basic(self):
        """Test basic action logging."""
        # This should not raise any exceptions
        AuditLogger.log_action(
            user_id="test_user",
            action="TEST_ACTION",
            resource_type="test_resource",
            resource_id="test_id",
            ip_address="127.0.0.1"
        )
    
    def test_log_action_with_details(self):
        """Test action logging with details."""
        AuditLogger.log_action(
            user_id="test_user",
            action="TEST_ACTION",
            resource_type="test_resource",
            resource_id="test_id",
            details={"key": "value"},
            ip_address="127.0.0.1"
        )
    
    def test_log_action_failure(self):
        """Test logging failed actions."""
        AuditLogger.log_action(
            user_id="test_user",
            action="TEST_ACTION",
            resource_type="test_resource",
            status="failure",
            error_message="Test error",
            ip_address="127.0.0.1"
        )


# Integration tests would require database setup
@pytest.mark.asyncio
class TestSecurityIntegration:
    """Integration tests for security features."""
    
    async def test_audit_log_to_database(self):
        """Test logging to database."""
        # This would require database setup
        # Skipping for now as it needs proper test database configuration
        pass
    
    async def test_security_event_logging(self):
        """Test security event logging."""
        # This would require database setup
        pass
