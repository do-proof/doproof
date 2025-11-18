"""
Script to create database indexes for performance optimization
Run this script after database setup or when deploying to production
"""

import asyncio
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.core.database import get_database
from app.core.database_indexes import create_student_indexes, list_indexes
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)


async def main():
    """
    Main function to create all indexes
    """
    try:
        logger.info("Starting index creation...")
        
        # Get database connection
        db = await get_database()
        
        # Create indexes
        await create_student_indexes(db)
        
        # List all indexes
        logger.info("\nListing all created indexes:")
        await list_indexes(db)
        
        logger.info("\nIndex creation completed successfully!")
        
    except Exception as e:
        logger.error(f"Error creating indexes: {str(e)}")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
