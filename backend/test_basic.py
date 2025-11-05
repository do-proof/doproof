#!/usr/bin/env python3
"""
Basic test script to verify job endpoints work
"""
import asyncio
from fastapi.testclient import TestClient
from app.main import app

def test_basic_endpoints():
    """Test basic endpoint functionality"""
    client = TestClient(app)
    
    # Test root endpoint
    response = client.get("/")
    print(f"Root endpoint: {response.status_code} - {response.json()}")
    
    # Test jobs endpoint without auth (should fail)
    response = client.get("/api/jobs")
    print(f"Jobs endpoint without auth: {response.status_code}")
    
    print("Basic endpoint tests completed!")

if __name__ == "__main__":
    test_basic_endpoints()