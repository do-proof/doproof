"""
Security middleware for DoProof application.
Handles request logging, rate limiting, and security headers.
"""

import time
import logging
from typing import Callable
from fastapi import Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

# Configure security logger
security_logger = logging.getLogger("security")
security_logger.setLevel(logging.INFO)
handler = logging.FileHandler("security.log")
formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
handler.setFormatter(formatter)
security_logger.addHandler(handler)

class SecurityMiddleware(BaseHTTPMiddleware):
    """Middleware for security enhancements."""
    
    def __init__(self, app: ASGIApp):
        super().__init__(app)
        self.request_counts = {}  # Simple in-memory rate limiting
        self.rate_limit_window = 60  # 1 minute window
        self.max_requests_per_window = 100  # Max requests per IP per window
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        start_time = time.time()
        
        # Get client IP
        client_ip = self.get_client_ip(request)
        
        # Rate limiting check
        if self.is_rate_limited(client_ip):
            security_logger.warning(f"Rate limit exceeded for IP: {client_ip}")
            return JSONResponse(
                status_code=429,
                content={"detail": "Rate limit exceeded. Please try again later."}
            )
        
        # Log request
        security_logger.info(
            f"Request: {request.method} {request.url.path} from {client_ip}"
        )
        
        # Process request
        try:
            response = await call_next(request)
        except Exception as e:
            security_logger.error(f"Request failed: {str(e)} for {client_ip}")
            raise
        
        # Add security headers
        self.add_security_headers(response)
        
        # Log response time
        process_time = time.time() - start_time
        security_logger.info(
            f"Response: {response.status_code} in {process_time:.4f}s for {client_ip}"
        )
        
        return response
    
    def get_client_ip(self, request: Request) -> str:
        """Extract client IP address."""
        # Check for forwarded headers first (for reverse proxies)
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip
        
        # Fallback to direct client IP
        return request.client.host if request.client else "unknown"
    
    def is_rate_limited(self, client_ip: str) -> bool:
        """Simple rate limiting implementation."""
        current_time = time.time()
        
        # Clean old entries
        self.request_counts = {
            ip: [(timestamp, count) for timestamp, count in requests 
                 if current_time - timestamp < self.rate_limit_window]
            for ip, requests in self.request_counts.items()
        }
        
        # Check current IP
        if client_ip not in self.request_counts:
            self.request_counts[client_ip] = []
        
        # Count requests in current window
        recent_requests = sum(
            count for timestamp, count in self.request_counts[client_ip]
            if current_time - timestamp < self.rate_limit_window
        )
        
        if recent_requests >= self.max_requests_per_window:
            return True
        
        # Add current request
        self.request_counts[client_ip].append((current_time, 1))
        return False
    
    def add_security_headers(self, response: Response) -> None:
        """Add security headers to response."""
        # Prevent clickjacking
        response.headers["X-Frame-Options"] = "DENY"
        
        # Prevent MIME type sniffing
        response.headers["X-Content-Type-Options"] = "nosniff"
        
        # XSS protection
        response.headers["X-XSS-Protection"] = "1; mode=block"
        
        # Referrer policy
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        
        # Content Security Policy (basic)
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: https:; "
            "font-src 'self' https:; "
            "connect-src 'self' https:; "
            "frame-ancestors 'none';"
        )
        
        # HSTS (only in production)
        # response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"

class RequestValidationMiddleware(BaseHTTPMiddleware):
    """Middleware for request validation and sanitization."""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Validate request size
        content_length = request.headers.get("content-length")
        if content_length:
            try:
                size = int(content_length)
                # 50MB max request size
                if size > 50 * 1024 * 1024:
                    return JSONResponse(
                        status_code=413,
                        content={"detail": "Request entity too large"}
                    )
            except ValueError:
                return JSONResponse(
                    status_code=400,
                    content={"detail": "Invalid content-length header"}
                )
        
        # Validate content type for POST/PUT requests
        if request.method in ["POST", "PUT", "PATCH"]:
            content_type = request.headers.get("content-type", "")
            allowed_types = [
                "application/json",
                "application/x-www-form-urlencoded",
                "multipart/form-data"
            ]
            
            if not any(allowed_type in content_type for allowed_type in allowed_types):
                return JSONResponse(
                    status_code=415,
                    content={"detail": "Unsupported media type"}
                )
        
        return await call_next(request)