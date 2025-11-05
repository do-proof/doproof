#!/usr/bin/env python3
"""
Database initialization script for SQLite migration
"""
import asyncio
from app.core.database import engine, Base
from app.models.user import UserModel
from app.models.task import TaskModel
from app.models.job import JobModel
from app.models.company import CompanyModel

async def init_database():
    """Initialize the database with all tables"""
    print("Creating database tables...")
    
    async with engine.begin() as conn:
        # Drop all tables (be careful in production!)
        await conn.run_sync(Base.metadata.drop_all)
        # Create all tables
        await conn.run_sync(Base.metadata.create_all)
    
    print("Database tables created successfully!")
    print("Tables created:")
    print("- users")
    print("- tasks") 
    print("- jobs")
    print("- companies")

if __name__ == "__main__":
    asyncio.run(init_database())