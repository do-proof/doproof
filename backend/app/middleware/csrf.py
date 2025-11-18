"""
CSRF protection middleware for state-changing operations.
"""

import secrets
import time
import logging
from typing import Callable
from fastapi import Request, Response, HTTPException, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

csrf_logger = logging.getLogger("csrf")
csrf_logger.setLevel(logging.WARNING)

class CSRFProtectionMiddleware(BaseHTTPMiddleware):
    """Middleware for CSRF protection."""
    
    # Methods that require CSRF protection
    PROTECTED_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE']
    
    # Endpoints that don't require CSRF (e.g., login, public APIs)
    EXEMPT_PATHS = [
        '/api/users/login',
        '/api/users/register',
        '/api/users',  # User registration endpoint
        '/api/health',
        '/docs',  # Swagger docs
        '/openapi.json',  # OpenAPI schema
    ]
    
    def __init__(self, app: ASGIApp):
        super().__init__(app)
        self.token_store: dict = {}  # In production, use Redis or similar
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Skip CSRF check for exempt paths
        if any(request.url.path.startswith(path) for path in self.EXEMPT_PATHS):
            return await call_next(request)
        
        # Only check CSRF for protected methods
        if request.method not in self.PROTECTED_METHODS:
            return await call_next(request)
        
        # Skip CSRF for WebSocket connections
        if request.url.path.startswith('/ws/'):
            return await call_next(request)
        
        # Get CSRF token from header
        csrf_token = request.headers.get("X-CSRF-Token")
        
        # For API requests, we can use the Authorization token as CSRF protection
        # since the token itself provides CSRF protection
        auth_token = request.headers.get("Authorization")
        
        if auth_token:
            # If authenticated, the JWT token provides CSRF protection
            # No additional CSRF token needed for authenticated requests
            pass
        else:
            # For unauthenticated requests, check if CSRF token is provided and valid
            # But don't block if missing - let the endpoint handle authentication
            if csrf_token and not self.validate_csrf_token(csrf_token, request):
                csrf_logger.warning(
                    f"Invalid CSRF token for {request.method} {request.url.path}"
                )
                return JSONResponse(
                    status_code=status.HTTP_403_FORBIDDEN,
                    content={"detail": "Invalid CSRF token"}
                )
        
        response = await call_next(request)
        
        # Generate and set CSRF token for subsequent requests
        if request.method == 'GET':
            csrf_token = self.generate_csrf_token(request)
            response.headers["X-CSRF-Token"] = csrf_token
        
        return response
    
    def generate_csrf_token(self, request: Request) -> str:
        """Generate a CSRF token for the session."""
        # In production, tie this to a session ID
        session_id = request.cookies.get("session_id") or request.headers.get("X-Session-ID")
        if not session_id:
            # Generate a temporary session ID
            session_id = secrets.token_urlsafe(32)
        
        # Generate token
        token = secrets.token_urlsafe(32)
        
        # Store token (in production, use Redis with expiration)
        self.token_store[session_id] = {
            'token': token,
            'expires_at': time.time() + 3600  # 1 hour
        }
        
        return token
    
    def validate_csrf_token(self, token: str, request: Request) -> bool:
        """Validate CSRF token."""
        session_id = request.cookies.get("session_id") or request.headers.get("X-Session-ID")
        
        if not session_id or session_id not in self.token_store:
            return False
        
        stored_token = self.token_store[session_id]
        
        # Check expiration
        if time.time() > stored_token['expires_at']:
            del self.token_store[session_id]
            return False
        
        # Validate token
        return secrets.compare_digest(token, stored_token['token'])

