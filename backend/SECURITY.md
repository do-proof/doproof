# DoProof Security Implementation

This document outlines the comprehensive security measures implemented in the DoProof application backend.

## Overview

The security implementation includes:
- Role-based access control (RBAC)
- Data isolation between recruiters/companies
- Input sanitization and validation
- File upload security
- Audit logging
- Security middleware
- Rate limiting
- Security headers

## Security Components

### 1. Input Sanitization (`app/core/security.py`)

#### InputSanitizer Class
Provides comprehensive input validation and sanitization:

- **String Sanitization**: HTML escaping, dangerous pattern detection, length validation
- **Email Validation**: RFC-compliant email format validation
- **ObjectId Validation**: MongoDB ObjectId format validation
- **Filename Sanitization**: Path traversal prevention, safe character filtering

#### Dangerous Pattern Detection
Blocks potentially malicious content:
- Script tags (`<script>`)
- JavaScript URLs (`javascript:`)
- Event handlers (`onclick=`, `onload=`, etc.)
- Iframe, object, embed tags
- Meta and link tags

### 2. Role-Based Access Control

#### User Roles
- **STUDENT**: Can access own submissions and applications
- **RECRUITER**: Can access own jobs, submissions for their jobs, company data
- **ADMIN**: Full access to all resources

#### Access Control Implementation
- `RoleChecker` class for endpoint-level role validation
- `CompanyIsolation` class for data isolation
- Dependency injection for role requirements

### 3. Data Isolation

#### Company/Recruiter Isolation
- Recruiters can only access their own jobs and related data
- Students can only access their own submissions
- Automatic filtering based on user context

#### Isolation Filters
```python
# Recruiter filter
{"recruiter_id": ObjectId(user_id)}

# Student filter  
{"candidate_id": ObjectId(user_id)}

# Admin filter (no restrictions)
{}
```

### 4. File Upload Security

#### FileUploadSecurity Class
Validates file uploads with:

- **File Type Validation**: Whitelist of allowed MIME types
- **File Size Limits**: Configurable per file type
- **Filename Sanitization**: Path traversal prevention
- **Content Validation**: MIME type vs extension matching

#### File Type Restrictions
- **Resumes**: PDF, DOC, DOCX (max 5MB)
- **Images**: JPG, PNG, GIF (max 2MB)  
- **Submissions**: PDF, DOC, DOCX, TXT, ZIP (max 10MB)

### 5. Audit Logging

#### AuditLogger Class
Comprehensive logging of security-sensitive actions:

- **File Logging**: Local audit.log file
- **Database Logging**: Persistent audit trail in MongoDB
- **Action Tracking**: User actions, resource access, security events

#### Logged Events
- User registration/login
- Resource access attempts (authorized/unauthorized)
- File uploads/downloads
- Data modifications
- Security violations

### 6. Security Middleware

#### SecurityMiddleware
- **Rate Limiting**: IP-based request throttling
- **Security Headers**: XSS protection, clickjacking prevention
- **Request Logging**: All requests logged with timing
- **Error Handling**: Secure error responses

#### RequestValidationMiddleware  
- **Request Size Limits**: Prevents large payload attacks
- **Content Type Validation**: Ensures proper content types
- **Header Validation**: Validates required headers

### 7. Security Headers

Automatically added to all responses:
- `X-Frame-Options: DENY` - Prevents clickjacking
- `X-Content-Type-Options: nosniff` - Prevents MIME sniffing
- `X-XSS-Protection: 1; mode=block` - XSS protection
- `Referrer-Policy: strict-origin-when-cross-origin` - Referrer control
- `Content-Security-Policy` - Content restrictions

## API Security Features

### Authentication
- JWT token-based authentication
- Token expiration and refresh handling
- Account status validation (active/inactive)

### Authorization
- Endpoint-level role requirements
- Resource-level access control
- Data isolation enforcement

### Input Validation
- All string inputs sanitized
- ObjectId format validation
- Email format validation
- File upload validation

## Security Best Practices Implemented

### 1. Defense in Depth
Multiple layers of security controls:
- Input validation at API layer
- Business logic validation
- Database-level constraints
- File system protections

### 2. Principle of Least Privilege
- Users can only access resources they own or are authorized for
- Role-based permissions with minimal required access
- Automatic data filtering based on user context

### 3. Secure by Default
- All inputs sanitized by default
- Security headers added automatically
- Audit logging enabled for all sensitive operations
- File uploads restricted to safe types

### 4. Fail Securely
- Security errors logged but don't expose system details
- Unauthorized access attempts logged and blocked
- Graceful degradation on security failures

## Configuration

### Environment Variables
```bash
# JWT Configuration
JWT_SECRET=your-secret-key-here
ACCESS_TOKEN_EXPIRE_MINUTES=10080  # 7 days

# Database
DATABASE_URL=mongodb://localhost:27017/doproof

# CORS
FRONTEND_URL=http://localhost:3000
```

### Rate Limiting Configuration
```python
# In SecurityMiddleware
rate_limit_window = 60  # 1 minute window
max_requests_per_window = 100  # Max requests per IP
```

### File Upload Limits
```python
# Maximum file sizes (bytes)
MAX_RESUME_SIZE = 5 * 1024 * 1024    # 5MB
MAX_IMAGE_SIZE = 2 * 1024 * 1024     # 2MB  
MAX_SUBMISSION_SIZE = 10 * 1024 * 1024  # 10MB
```

## Security Testing

### Test Coverage
- Input sanitization tests
- Access control tests  
- File upload security tests
- Audit logging tests
- Middleware functionality tests

### Running Security Tests
```bash
# Run security-specific tests
python test_security_simple.py

# Run full test suite (when dependencies are fixed)
pytest backend/tests/test_security.py -v
```

## Security Monitoring

### Audit Logs
- Location: `audit.log` and `security.log`
- Database: `audit_logs` collection
- Retention: Configure based on compliance requirements

### Key Metrics to Monitor
- Failed authentication attempts
- Unauthorized access attempts
- File upload failures
- Rate limit violations
- Input validation failures

### Log Analysis
```bash
# View recent security events
tail -f security.log

# Search for specific events
grep "UNAUTHORIZED" audit.log

# Monitor rate limiting
grep "Rate limit exceeded" security.log
```

## Compliance Considerations

### Data Protection
- Input sanitization prevents XSS/injection attacks
- Data isolation ensures privacy between organizations
- Audit logging provides accountability trail
- Secure file handling prevents data leakage

### GDPR Compliance Features
- User data isolation
- Audit trail for data access
- Secure data deletion capabilities
- Data export functionality

## Security Incident Response

### Immediate Actions
1. Check audit logs for scope of incident
2. Identify affected users/resources
3. Block malicious IPs if necessary
4. Review and update security controls

### Investigation
1. Analyze audit logs and security logs
2. Identify attack vectors and vulnerabilities
3. Assess data exposure and impact
4. Document findings and remediation steps

## Future Security Enhancements

### Planned Improvements
- Advanced rate limiting with Redis
- Enhanced password policies
- Two-factor authentication
- API key management
- Advanced threat detection
- Automated security scanning

### Monitoring Enhancements
- Real-time security dashboards
- Automated alerting for security events
- Integration with SIEM systems
- Advanced log analysis and correlation

## Security Contact

For security-related issues or questions:
- Review this documentation
- Check audit logs for suspicious activity
- Implement additional security controls as needed
- Follow incident response procedures for security events