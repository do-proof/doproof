#!/usr/bin/env python3
"""
Simple test script for security functions without FastAPI dependencies.
"""

import re
import html
from bson import ObjectId

class SecurityError(Exception):
    """Custom exception for security-related errors."""
    pass

class InputSanitizer:
    """Utility class for input sanitization and validation."""
    
    # Regex patterns for validation
    EMAIL_PATTERN = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
    
    # Dangerous patterns to block
    DANGEROUS_PATTERNS = [
        re.compile(r'<script[^>]*>.*?</script>', re.IGNORECASE | re.DOTALL),
        re.compile(r'javascript:', re.IGNORECASE),
        re.compile(r'on\w+\s*=', re.IGNORECASE),
        re.compile(r'<iframe[^>]*>.*?</iframe>', re.IGNORECASE | re.DOTALL),
    ]
    
    @classmethod
    def sanitize_string(cls, value: str, max_length: int = 1000) -> str:
        """Sanitize string input by removing dangerous content."""
        if not isinstance(value, str):
            raise SecurityError("Input must be a string")
        
        # Check length
        if len(value) > max_length:
            raise SecurityError(f"Input exceeds maximum length of {max_length}")
        
        # Check for dangerous patterns
        for pattern in cls.DANGEROUS_PATTERNS:
            if pattern.search(value):
                raise SecurityError("Input contains potentially dangerous content")
        
        # HTML escape the content
        sanitized = html.escape(value.strip())
        
        return sanitized
    
    @classmethod
    def validate_email(cls, email: str) -> str:
        """Validate and sanitize email address."""
        email = email.lower().strip()
        if not cls.EMAIL_PATTERN.match(email):
            raise SecurityError("Invalid email format")
        return email
    
    @classmethod
    def validate_object_id(cls, obj_id: str) -> ObjectId:
        """Validate and convert string to ObjectId."""
        if not ObjectId.is_valid(obj_id):
            raise SecurityError("Invalid object ID format")
        return ObjectId(obj_id)
    
    @classmethod
    def sanitize_filename(cls, filename: str) -> str:
        """Sanitize filename for safe storage."""
        # Remove path traversal attempts
        filename = filename.replace('..', '').replace('/', '').replace('\\', '')
        
        # Only allow alphanumeric, dots, hyphens, and underscores
        filename = re.sub(r'[^a-zA-Z0-9\.\-_]', '', filename)
        
        if not filename:
            raise SecurityError("Invalid filename")
        
        return filename

def test_input_sanitizer():
    """Test the InputSanitizer class."""
    print("Testing InputSanitizer...")
    
    # Test valid string sanitization
    try:
        result = InputSanitizer.sanitize_string("Hello World", max_length=20)
        assert result == "Hello World"
        print("✓ Valid string sanitization passed")
    except Exception as e:
        print(f"✗ Valid string sanitization failed: {e}")
    
    # Test HTML escaping
    try:
        result = InputSanitizer.sanitize_string("Hello <b>World</b>")
        assert "&lt;b&gt;" in result and "&lt;/b&gt;" in result
        print("✓ HTML escaping passed")
    except Exception as e:
        print(f"✗ HTML escaping failed: {e}")
    
    # Test dangerous pattern detection
    try:
        InputSanitizer.sanitize_string("<script>alert('xss')</script>")
        print("✗ Dangerous pattern detection failed - should have raised exception")
    except SecurityError:
        print("✓ Dangerous pattern detection passed")
    except Exception as e:
        print(f"✗ Dangerous pattern detection failed with unexpected error: {e}")
    
    # Test length validation
    try:
        InputSanitizer.sanitize_string("a" * 1001, max_length=1000)
        print("✗ Length validation failed - should have raised exception")
    except SecurityError:
        print("✓ Length validation passed")
    except Exception as e:
        print(f"✗ Length validation failed with unexpected error: {e}")
    
    # Test email validation
    try:
        result = InputSanitizer.validate_email("user@example.com")
        assert result == "user@example.com"
        print("✓ Valid email validation passed")
    except Exception as e:
        print(f"✗ Valid email validation failed: {e}")
    
    try:
        InputSanitizer.validate_email("invalid-email")
        print("✗ Invalid email validation failed - should have raised exception")
    except SecurityError:
        print("✓ Invalid email validation passed")
    except Exception as e:
        print(f"✗ Invalid email validation failed with unexpected error: {e}")
    
    # Test ObjectId validation
    try:
        valid_id = str(ObjectId())
        result = InputSanitizer.validate_object_id(valid_id)
        assert isinstance(result, ObjectId)
        print("✓ Valid ObjectId validation passed")
    except Exception as e:
        print(f"✗ Valid ObjectId validation failed: {e}")
    
    try:
        InputSanitizer.validate_object_id("invalid-id")
        print("✗ Invalid ObjectId validation failed - should have raised exception")
    except SecurityError:
        print("✓ Invalid ObjectId validation passed")
    except Exception as e:
        print(f"✗ Invalid ObjectId validation failed with unexpected error: {e}")
    
    # Test filename sanitization
    try:
        result = InputSanitizer.sanitize_filename("document.pdf")
        assert result == "document.pdf"
        print("✓ Valid filename sanitization passed")
    except Exception as e:
        print(f"✗ Valid filename sanitization failed: {e}")
    
    try:
        result = InputSanitizer.sanitize_filename("../../../etc/passwd")
        assert ".." not in result and "/" not in result
        print("✓ Dangerous filename sanitization passed")
    except Exception as e:
        print(f"✗ Dangerous filename sanitization failed: {e}")

if __name__ == "__main__":
    test_input_sanitizer()
    print("\nSecurity module core functionality test completed!")