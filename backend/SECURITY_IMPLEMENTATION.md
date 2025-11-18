# Security Implementation Guide

## Overview

This document describes the comprehensive security implementation for the DoProof student features, including data isolation, input sanitization, audit logging, rate limiting, and CSRF protection.

## Security Features

### 1. Data Isolation

#### Student Data Isolation
- **Purpose**: Ensure students can only access their own data
- **Implementation**: `StudentDataIsolation` class in `app/core/security.py`
- **Key Methods**:
  - `check_student_resource_access()`: Validates if a student can access a specific resource
  - `get_student_isolation_filter()`: Returns MongoDB filter for student-specific queries
  - `ensure_student_owns_resource()`: Raises exception if student doesn't own resource

#### Company/Recruiter Data Isolation
- **Purpose**: Ensure recruiters can only access their company's data
- **Implementation**: `CompanyIsolation` class in `app/core/security.py`
- **Key Methods**:
  - `check_resource_access()`: Validates recruiter access to resources
  - `get_isolation_filter()`: Returns MongoDB filter for recruiter-specific queries

#### Usage Example
```python
from app.core.security import StudentDataIsolation

# In an endpoint
@router.get("/applications")
async def get_applications(current_user: dict = Depends(require_student())):
    db = get_database()
    
    # Apply data isolation filter
    isolation_filter = StudentDataIsolation.get_student_isolation_filter(current_user)
    
    # Query with isolation
    applications = await db.task_submissions.find(isolation_filter).to_list(None)
    return applications
```

### 2. Input Sanitization and Validation

#### InputSanitizer Class
- **Purpose**: Sanitize and validate all user inputs to prevent injection attacks
- **Implementation**: `InputSanitizer` class in `app/core/security.py`

#### Key Methods
- `sanitize_string()`: Removes dangerous content and HTML-escapes strings
- `validate_email()`: Validates email format
- `sanitize_filename()`: Removes path traversal attempts from filenames
- `validate_object_id()`: Validates MongoDB ObjectId format
- `sanitize_dict()`: Recursively sanitizes dictionary data

#### Dangerous Patterns Blocked
- `<script>` tags
- `javascript:` protocol
- Event handlers (`onclick`, `onload`, etc.)
- `<iframe>`, `<object>`, `<embed>` tags
- `<link>` and `<meta>` tags

#### Usage Example
```python
from app.core.security import InputSanitizer, SecurityError

try:
    # Sanitize user input
    safe_bio = InputSanitizer.sanitize_string(user_bio, max_length=2000)
    safe_email = InputSanitizer.validate_email(user_email)
    safe_filename = InputSanitizer.sanitize_filename(uploaded_filename)
except SecurityError as e:
    raise HTTPException(status_code=400, detail=str(e))
```

### 3. Audit Logging

#### AuditLogger Class
- **Purpose**: Track all security-sensitive operations for compliance and forensics
- **Implementation**: `AuditLogger` class in `app/core/security.py`
- **Storage**: Both file-based (`audit.log`) and database (`audit_logs` collection)

#### Logged Information
- User ID
- Action performed
- Resource type and ID
- IP address
- User agent
- Timestamp
- Status (success/failure)
- Error messages (if applicable)
- Additional details

#### Usage with Decorator
```python
from app.core.security import audit_action

@router.post("/applications/{job_id}/enroll")
@audit_action("STUDENT_ENROLL", "application")
async def enroll_in_job(
    request: Request,
    job_id: str,
    current_user: dict = Depends(require_student())
):
    # Function implementation
    pass
```

#### Manual Logging
```python
from app.core.security import AuditLogger

await AuditLogger.log_to_database(
    user_id=str(current_user["_id"]),
    action="PROFILE_UPDATE",
    resource_type="profile",
    resource_id=profile_id,
    details={"fields_updated": ["bio", "skills"]},
    ip_address=client_ip,
    user_agent=user_agent
)
```

#### Security Event Logging
```python
await AuditLogger.log_security_event(
    event_type="RATE_LIMIT_ABUSE",
    severity="high",
    description="Repeated rate limit violations",
    ip_address=client_ip,
    user_id=user_id,
    details={"violations": 10, "endpoint": "/api/students/applications"}
)
```

### 4. Rate Limiting

#### StudentRateLimiter
- **Purpose**: Prevent abuse and ensure fair resource usage
- **Implementation**: `StudentRateLimitMiddleware` in `app/middleware/rate_limiting.py`

#### Rate Limits by Endpoint Type
- **Default**: 100 requests per 60 seconds
- **Student Read**: 50 requests per 60 seconds
- **Student Write**: 20 requests per 60 seconds
- **Authentication**: 10 requests per 60 seconds
- **File Upload**: 10 uploads per 5 minutes
- **Analytics**: 30 requests per 60 seconds
- **Profile Updates**: 15 requests per 60 seconds

#### Features
- Per-IP rate limiting
- Different limits for different endpoint types
- Violation tracking
- Security event logging for repeated violations
- Rate limit headers in responses

#### Response Headers
```
X-RateLimit-Limit: 50
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1699564800
```

### 5. CSRF Protection

#### CSRFProtectionMiddleware
- **Purpose**: Prevent Cross-Site Request Forgery attacks
- **Implementation**: `CSRFProtectionMiddleware` in `app/middleware/csrf.py`

#### Protected Methods
- POST
- PUT
- PATCH
- DELETE

#### Exempt Paths
- `/api/users/login`
- `/api/users/register`
- `/api/health`

#### Token Management
- Tokens generated on GET requests
- Tokens validated on state-changing requests
- 1-hour token expiration
- Session-based token storage

#### Usage in Frontend
```javascript
// Get CSRF token from response header
const csrfToken = response.headers.get('X-CSRF-Token');

// Include in subsequent requests
fetch('/api/students/applications', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${authToken}`,
    'X-CSRF-Token': csrfToken,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(data)
});
```

### 6. Role-Based Access Control (RBAC)

#### RoleChecker Class
- **Purpose**: Enforce role-based access to endpoints
- **Implementation**: `RoleChecker` class in `app/core/security.py`

#### Available Dependencies
```python
from app.core.security import (
    require_student,        # Student or Admin
    require_student_strict, # Student only (no admin bypass)
    require_recruiter_role, # Recruiter or Admin
    require_admin_role,     # Admin only
    require_any_authenticated  # Any authenticated user
)
```

#### Usage Example
```python
@router.get("/applications")
async def get_applications(
    current_user: dict = Depends(require_student())
):
    # Only students and admins can access
    pass
```

### 7. Security Headers

#### SecurityMiddleware
- **Purpose**: Add security headers to all responses
- **Implementation**: `SecurityMiddleware` in `app/middleware/security.py`

#### Headers Added
- `X-Frame-Options: DENY` - Prevents clickjacking
- `X-Content-Type-Options: nosniff` - Prevents MIME sniffing
- `X-XSS-Protection: 1; mode=block` - XSS protection
- `Referrer-Policy: strict-origin-when-cross-origin` - Referrer control
- `Content-Security-Policy` - Content restrictions

### 8. Admin Security Endpoints

#### Available Endpoints
- `GET /api/security/audit-logs` - View audit logs
- `GET /api/security/security-events` - View security events
- `PATCH /api/security/security-events/{id}/resolve` - Resolve security event
- `GET /api/security/audit-logs/user/{user_id}` - User-specific audit logs
- `GET /api/security/stats` - Security statistics

#### Access Control
All security endpoints require admin role.

## Security Best Practices

### For Developers

1. **Always Use Data Isolation**
   ```python
   # Good
   filter_query = StudentDataIsolation.get_student_isolation_filter(current_user)
   data = await db.collection.find(filter_query).to_list(None)
   
   # Bad
   data = await db.collection.find({}).to_list(None)  # No isolation!
   ```

2. **Sanitize All User Inputs**
   ```python
   # Good
   safe_input = InputSanitizer.sanitize_string(user_input, max_length=1000)
   
   # Bad
   unsafe_input = user_input  # Direct use without sanitization!
   ```

3. **Use Audit Logging for Sensitive Operations**
   ```python
   # Good
   @audit_action("SENSITIVE_OPERATION", "resource_type")
   async def sensitive_operation(...):
       pass
   
   # Or manually
   await AuditLogger.log_to_database(...)
   ```

4. **Verify Resource Ownership**
   ```python
   # Good
   StudentDataIsolation.ensure_student_owns_resource(
       current_user, resource, "candidate_id"
   )
   
   # Bad
   # No ownership check before allowing access
   ```

5. **Use Appropriate Role Dependencies**
   ```python
   # Good - Specific role requirement
   @router.post("/admin-only")
   async def admin_endpoint(current_user: dict = Depends(require_admin_role)):
       pass
   
   # Bad - Too permissive
   @router.post("/admin-only")
   async def admin_endpoint(current_user: dict = Depends(get_current_user)):
       pass
   ```

### For Security Audits

1. **Check Audit Logs Regularly**
   - Review failed actions
   - Look for suspicious patterns
   - Monitor high-privilege operations

2. **Monitor Security Events**
   - Resolve critical events immediately
   - Investigate repeated violations
   - Track IP addresses with multiple violations

3. **Review Rate Limit Violations**
   - Identify potential abuse
   - Adjust limits if needed
   - Block persistent violators

4. **Validate Data Isolation**
   - Ensure all student endpoints use isolation filters
   - Test cross-user access attempts
   - Verify admin bypass works correctly

## Testing Security Features

### Unit Tests
```bash
pytest backend/tests/test_security.py -v
```

### Integration Tests
```bash
# Test data isolation
pytest backend/tests/test_student_endpoints.py::test_data_isolation -v

# Test input sanitization
pytest backend/tests/test_security.py::TestInputSanitizer -v

# Test rate limiting
pytest backend/tests/test_rate_limiting.py -v
```

### Manual Security Testing

1. **Test Data Isolation**
   - Create two student accounts
   - Try to access other student's data
   - Verify 403 Forbidden response

2. **Test Input Sanitization**
   - Submit XSS payloads
   - Try SQL injection patterns
   - Attempt path traversal

3. **Test Rate Limiting**
   - Make rapid requests
   - Verify rate limit headers
   - Check 429 responses

4. **Test CSRF Protection**
   - Make POST request without CSRF token
   - Verify 403 Forbidden response
   - Test with valid token

## Security Incident Response

### If Security Event Detected

1. **Immediate Actions**
   - Check security events dashboard
   - Identify affected users/resources
   - Block malicious IPs if needed

2. **Investigation**
   - Review audit logs
   - Check user activity patterns
   - Identify attack vector

3. **Remediation**
   - Patch vulnerabilities
   - Update security rules
   - Notify affected users if needed

4. **Documentation**
   - Document incident details
   - Record remediation steps
   - Update security procedures

## Compliance and Regulations

### GDPR Compliance
- Audit logs track data access
- Users can request data deletion
- Privacy settings control data visibility

### Data Retention
- Audit logs: 90 days
- Security events: 1 year
- User data: Until account deletion

### Access Control
- Role-based access control
- Principle of least privilege
- Regular access reviews

## Future Enhancements

1. **Advanced Threat Detection**
   - Machine learning for anomaly detection
   - Behavioral analysis
   - Automated threat response

2. **Enhanced Monitoring**
   - Real-time security dashboard
   - Automated alerts
   - Integration with SIEM systems

3. **Additional Security Features**
   - Two-factor authentication
   - IP whitelisting
   - Geolocation-based access control
   - Advanced bot detection

## Support and Contact

For security concerns or questions:
- Email: security@doproof.com
- Security incidents: security-incidents@doproof.com
- Documentation: https://docs.doproof.com/security
