import pytest
import asyncio
from httpx import AsyncClient
from motor.motor_asyncio import AsyncIOMotorClient
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import get_database
from app.core.config import settings
import os

# Test database configuration
TEST_DATABASE_URL = os.getenv("TEST_DATABASE_URL", "mongodb://localhost:27017/doproof_test")

@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture(scope="session")
async def test_db():
    """Create test database connection."""
    client = AsyncIOMotorClient(TEST_DATABASE_URL)
    db = client.get_database()
    yield db
    # Clean up after tests
    await client.drop_database(db.name)
    client.close()

@pytest.fixture
async def clean_db(test_db):
    """Clean database before each test."""
    # Drop all collections
    collections = await test_db.list_collection_names()
    for collection in collections:
        await test_db[collection].drop()
    yield test_db

@pytest.fixture
def override_get_database(test_db):
    """Override the get_database dependency."""
    def _override_get_database():
        return test_db
    return _override_get_database

@pytest.fixture
async def client(override_get_database):
    """Create test client with database override."""
    app.dependency_overrides[get_database] = override_get_database
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()

@pytest.fixture
async def test_user(clean_db):
    """Create a test user."""
    from bson import ObjectId
    user_data = {
        "_id": ObjectId("60d5ec9af682fbd12a0a38d6"),
        "name": "Test User",
        "email": "test@example.com",
        "password": "$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW",  # secret
        "role": "recruiter",
        "company": "Test Company",
        "is_active": True,
        "created_at": "2023-06-21T15:30:00"
    }
    await clean_db.users.insert_one(user_data)
    return user_data

@pytest.fixture
async def auth_headers(client, test_user):
    """Get authentication headers for test user."""
    login_data = {
        "username": test_user["email"],
        "password": "secret"
    }
    response = await client.post("/api/users/login", data=login_data)
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def sample_job_data():
    """Sample job data for testing."""
    return {
        "title": "Senior Software Engineer",
        "description": "We are looking for a senior software engineer with expertise in Python and FastAPI.",
        "requirements": ["5+ years experience", "Python expertise", "FastAPI knowledge"],
        "responsibilities": ["Lead development", "Mentor junior developers", "Code reviews"],
        "salary": {
            "min": 80000,
            "max": 120000,
            "currency": "USD"
        },
        "location": {
            "type": "hybrid",
            "city": "San Francisco",
            "country": "USA"
        },
        "employment_type": "full-time",
        "closing_date": "2024-12-31T23:59:59",
        "task": {
            "title": "API Design Challenge",
            "description": "Design a RESTful API for a social media platform",
            "instructions": "Create API endpoints with proper documentation. Focus on user management, posts, and comments.",
            "time_limit": 120,
            "submission_format": "text",
            "max_file_size": 10,
            "allowed_file_types": ["pdf", "txt", "md"]
        },
        "evaluation_criteria": {
            "critical_thinking": 25,
            "problem_solving": 30,
            "creativity": 15,
            "technical_skills": 20,
            "communication": 5,
            "attention_to_detail": 5
        }
    }