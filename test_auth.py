#!/usr/bin/env python3
"""
Simple test script to verify the authentication system
"""
import requests
import json

BASE_URL = "http://localhost:5000/api"

def test_user_registration():
    """Test user registration"""
    print("Testing user registration...")
    
    user_data = {
        "name": "Test User",
        "email": "test@example.com",
        "password": "password123",
        "role": "student"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/users", json=user_data)
        print(f"Registration Status: {response.status_code}")
        if response.status_code == 201:
            print("✅ Registration successful!")
            return response.json()
        else:
            print(f"❌ Registration failed: {response.text}")
            return None
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to backend server")
        return None

def test_user_login():
    """Test user login"""
    print("\nTesting user login...")
    
    login_data = {
        "username": "test@example.com",
        "password": "password123"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/users/login", data=login_data)
        print(f"Login Status: {response.status_code}")
        if response.status_code == 200:
            print("✅ Login successful!")
            return response.json()
        else:
            print(f"❌ Login failed: {response.text}")
            return None
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to backend server")
        return None

def test_user_profile(token):
    """Test getting user profile"""
    print("\nTesting user profile...")
    
    headers = {
        "Authorization": f"Bearer {token}"
    }
    
    try:
        response = requests.get(f"{BASE_URL}/users/profile", headers=headers)
        print(f"Profile Status: {response.status_code}")
        if response.status_code == 200:
            print("✅ Profile retrieval successful!")
            print(f"User data: {response.json()}")
        else:
            print(f"❌ Profile retrieval failed: {response.text}")
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to backend server")

if __name__ == "__main__":
    print("🔐 Testing DoProof Authentication System")
    print("=" * 50)
    
    # Test registration
    user = test_user_registration()
    
    # Test login
    login_result = test_user_login()
    
    if login_result and "access_token" in login_result:
        # Test profile
        test_user_profile(login_result["access_token"])
    
    print("\n" + "=" * 50)
    print("Test completed!")
