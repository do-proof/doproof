from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import users, tasks, jobs, students, notifications, websocket, security
from app.core.config import settings
from app.core.database import connect_to_database, close_database_connection
from app.middleware.security import SecurityMiddleware, RequestValidationMiddleware
from app.middleware.rate_limiting import StudentRateLimitMiddleware
from app.middleware.csrf import CSRFProtectionMiddleware

app = FastAPI(
    title="DoProof API",
    description="API for DoProof application",
    version="0.1.0"
)

@app.on_event("startup")
async def startup_event():
    await connect_to_database()

@app.on_event("shutdown")
async def shutdown_event():
    await close_database_connection()

# Add security middleware (order matters - add from innermost to outermost)
app.add_middleware(RequestValidationMiddleware)
app.add_middleware(CSRFProtectionMiddleware)
app.add_middleware(StudentRateLimitMiddleware)
app.add_middleware(SecurityMiddleware)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(users.router, prefix="/api")
app.include_router(tasks.router, prefix="/api")
app.include_router(jobs.router, prefix="/api")
app.include_router(students.router, prefix="/api")
app.include_router(notifications.router, prefix="/api")
app.include_router(security.router, prefix="/api")
app.include_router(websocket.router)

@app.get("/")
async def root():
    return {"message": "Welcome to DoProof API"}

@app.get("/api/health")
@app.head("/api/health")
async def health_check():
    """Health check endpoint for monitoring."""
    return {
        "status": "healthy",
        "service": "DoProof API",
        "version": "0.1.0"
    }
