"""
Rate limiting middleware specifically for student endpoints.
Provides more restrictive rate limiting for student operations.
"""

import time
import logging
from typing import Callable, Dict, Tuple
from fastapi import Request, Response, HTTPException, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

# Configure rate limiting logger
rate_limit_logger = logging.getLogger("rate_limit")
rate_limit_logger.setLevel(logging.WARNING)

class StudentRateLimiter:
    """Rate limiter with different limits for student endpoints."""
    
    def __init__(self):
        self.request_counts: Dict[str, list] = {}
        # Different rate limits for different endpoint types
        self.limits = {
            'default': (60, 100),  # 100 requests per 60 seconds
            'student_read': (60, 50),  # 50 requests per 60 seconds
            'student_write': (60, 20),  # 20 requests per 60 seconds
            'student_auth': (60, 10),  # 10 requests per 60 seconds
            'file_upload': (300, 10),  # 10 uploads per 5 minutes
        }
    
    def get_limit_type(self, path: str, method: str) -> str:
        """Determine rate limit type based on endpoint."""
        # Authentication endpoints
        if '/login' in path or '/register' in path or '/auth' in path:
            return 'student_auth'
        
        # File upload endpoints
        if '/upload' in path or method == 'POST' and '/file' in path:
            return 'file_upload'
        
        # Write operations (POST, PUT, PATCH, DELETE)
        if method in ['POST', 'PUT', 'PATCH', 'DELETE']:
            return 'student_write'
        
        # Read operations (GET)
        if method == 'GET':
            return 'student_read'
        
        return 'default'
    
    def is_rate_limited(
        self, 
        identifier: str, 
        limit_type: str = 'default'
    ) -> Tuple[bool, Dict[str, int]]:
        """Check if request should be rate limited."""
        current_time = time.time()
        window, max_requests = self.limits.get(limit_type, self.limits['default'])
        
        # Clean old entries
        if identifier in self.request_counts:
            self.request_counts[identifier] = [
                timestamp for timestamp in self.request_counts[identifier]
                if current_time - timestamp < window
            ]
        else:
            self.request_counts[identifier] = []
        
        # Count requests in current window
        request_count = len(self.request_counts[identifier])
        
        if request_count >= max_requests:
            return True, {
                'limit': max_requests,
                'window': window,
                'remaining': 0,
                'reset_at': current_time + window
            }
        
        # Add current request
        self.request_counts[identifier].append(current_time)
        
        return False, {
            'limit': max_requests,
            'window': window,
            'remaining': max_requests - request_count - 1,
            'reset_at': current_time + window
        }

class StudentRateLimitMiddleware(BaseHTTPMiddleware):
    """Middleware for rate limiting student endpoints."""
    
    def __init__(self, app: ASGIApp):
        super().__init__(app)
        self.rate_limiter = StudentRateLimiter()
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Only apply rate limiting to student endpoints
        if not request.url.path.startswith('/api/students'):
            return await call_next(request)
        
        # Get identifier (user ID if authenticated, IP otherwise)
        identifier = self.get_identifier(request)
        
        # Determine rate limit type
        limit_type = self.rate_limiter.get_limit_type(
            request.url.path,
            request.method
        )
        
        # Check rate limit
        is_limited, rate_info = self.rate_limiter.is_rate_limited(
            identifier,
            limit_type
        )
        
        if is_limited:
            rate_limit_logger.warning(
                f"Rate limit exceeded for {identifier} on {request.url.path}"
            )
            response = JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "detail": "Rate limit exceeded. Please try again later.",
                    "limit": rate_info['limit'],
                    "window_seconds": rate_info['window'],
                    "reset_at": rate_info['reset_at']
                }
            )
            # Add rate limit headers
            response.headers["X-RateLimit-Limit"] = str(rate_info['limit'])
            response.headers["X-RateLimit-Remaining"] = "0"
            response.headers["X-RateLimit-Reset"] = str(int(rate_info['reset_at']))
            return response
        
        # Process request
        response = await call_next(request)
        
        # Add rate limit headers to successful responses
        response.headers["X-RateLimit-Limit"] = str(rate_info['limit'])
        response.headers["X-RateLimit-Remaining"] = str(rate_info['remaining'])
        response.headers["X-RateLimit-Reset"] = str(int(rate_info['reset_at']))
        
        return response
    
    def get_identifier(self, request: Request) -> str:
        """Get identifier for rate limiting (user ID or IP)."""
        # Try to get user ID from token (if available)
        # For now, use IP address
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip
        
        return request.client.host if request.client else "unknown"

