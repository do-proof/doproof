"""
Database indexing for performance optimization
Creates indexes for frequently queried fields in student-related collections
"""

from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo import ASCENDING, DESCENDING, TEXT
import logging

logger = logging.getLogger(__name__)


async def create_student_indexes(db: AsyncIOMotorDatabase):
    """
    Create indexes for student-related queries to improve performance
    """
    try:
        # Jobs collection indexes
        await db.jobs.create_index([("status", ASCENDING)])
        await db.jobs.create_index([("closing_date", DESCENDING)])
        await db.jobs.create_index([("posted_date", DESCENDING)])
        await db.jobs.create_index([("recruiter_id", ASCENDING)])
        await db.jobs.create_index([("company_id", ASCENDING)])
        await db.jobs.create_index([
            ("status", ASCENDING),
            ("closing_date", DESCENDING)
        ])
        # Text index for search functionality
        await db.jobs.create_index([
            ("title", TEXT),
            ("description", TEXT),
            ("requirements", TEXT)
        ], name="job_search_text")
        
        # Compound index for filtering
        await db.jobs.create_index([
            ("status", ASCENDING),
            ("employment_type", ASCENDING),
            ("location.type", ASCENDING)
        ], name="job_filters")
        
        logger.info("Created indexes for jobs collection")
        
        # Task submissions collection indexes
        await db.task_submissions.create_index([("candidate_id", ASCENDING)])
        await db.task_submissions.create_index([("job_id", ASCENDING)])
        await db.task_submissions.create_index([("status", ASCENDING)])
        await db.task_submissions.create_index([("created_at", DESCENDING)])
        await db.task_submissions.create_index([("updated_at", DESCENDING)])
        
        # Compound index for student's applications
        await db.task_submissions.create_index([
            ("candidate_id", ASCENDING),
            ("status", ASCENDING),
            ("created_at", DESCENDING)
        ], name="student_applications")
        
        # Compound index for recruiter's submissions
        await db.task_submissions.create_index([
            ("job_id", ASCENDING),
            ("status", ASCENDING),
            ("created_at", DESCENDING)
        ], name="job_submissions")
        
        # Index for evaluation queries
        await db.task_submissions.create_index([
            ("status", ASCENDING),
            ("ai_evaluation.overall_score", DESCENDING)
        ], name="evaluation_scores")
        
        logger.info("Created indexes for task_submissions collection")
        
        # Student profiles collection indexes
        await db.student_profiles.create_index([("user_id", ASCENDING)], unique=True)
        await db.student_profiles.create_index([("skills", ASCENDING)])
        await db.student_profiles.create_index([("profile_completeness", DESCENDING)])
        await db.student_profiles.create_index([("updated_at", DESCENDING)])
        
        # Text index for profile search
        await db.student_profiles.create_index([
            ("personal_info.first_name", TEXT),
            ("personal_info.last_name", TEXT),
            ("skills", TEXT)
        ], name="profile_search_text")
        
        logger.info("Created indexes for student_profiles collection")
        
        # Notifications collection indexes
        await db.notifications.create_index([("user_id", ASCENDING)])
        await db.notifications.create_index([("read", ASCENDING)])
        await db.notifications.create_index([("created_at", DESCENDING)])
        await db.notifications.create_index([
            ("user_id", ASCENDING),
            ("read", ASCENDING),
            ("created_at", DESCENDING)
        ], name="user_notifications")
        
        # TTL index for auto-deletion of old notifications (90 days)
        await db.notifications.create_index(
            [("created_at", ASCENDING)],
            expireAfterSeconds=90 * 24 * 60 * 60,
            name="notification_ttl"
        )
        
        logger.info("Created indexes for notifications collection")
        
        # Users collection indexes
        await db.users.create_index([("email", ASCENDING)], unique=True)
        await db.users.create_index([("role", ASCENDING)])
        await db.users.create_index([("created_at", DESCENDING)])
        
        logger.info("Created indexes for users collection")
        
        # Saved searches collection indexes (if exists)
        await db.saved_searches.create_index([("user_id", ASCENDING)])
        await db.saved_searches.create_index([("created_at", DESCENDING)])
        await db.saved_searches.create_index([
            ("user_id", ASCENDING),
            ("created_at", DESCENDING)
        ], name="user_saved_searches")
        
        logger.info("Created indexes for saved_searches collection")
        
        # Analytics/metrics collection indexes (if exists)
        await db.student_analytics.create_index([("student_id", ASCENDING)])
        await db.student_analytics.create_index([("date", DESCENDING)])
        await db.student_analytics.create_index([
            ("student_id", ASCENDING),
            ("date", DESCENDING)
        ], name="student_analytics_timeline")
        
        logger.info("Created indexes for student_analytics collection")
        
        logger.info("All student-related indexes created successfully")
        
    except Exception as e:
        logger.error(f"Error creating indexes: {str(e)}")
        raise


async def drop_student_indexes(db: AsyncIOMotorDatabase):
    """
    Drop all student-related indexes (useful for testing or rebuilding)
    """
    try:
        # Drop custom indexes but keep _id indexes
        collections = [
            "jobs",
            "task_submissions",
            "student_profiles",
            "notifications",
            "users",
            "saved_searches",
            "student_analytics"
        ]
        
        for collection_name in collections:
            collection = db[collection_name]
            indexes = await collection.index_information()
            
            for index_name in indexes:
                if index_name != "_id_":
                    await collection.drop_index(index_name)
                    logger.info(f"Dropped index {index_name} from {collection_name}")
        
        logger.info("All student-related indexes dropped successfully")
        
    except Exception as e:
        logger.error(f"Error dropping indexes: {str(e)}")
        raise


async def list_indexes(db: AsyncIOMotorDatabase):
    """
    List all indexes in student-related collections
    """
    collections = [
        "jobs",
        "task_submissions",
        "student_profiles",
        "notifications",
        "users",
        "saved_searches",
        "student_analytics"
    ]
    
    for collection_name in collections:
        collection = db[collection_name]
        indexes = await collection.index_information()
        
        logger.info(f"\nIndexes for {collection_name}:")
        for index_name, index_info in indexes.items():
            logger.info(f"  - {index_name}: {index_info.get('key', [])}")


async def analyze_query_performance(db: AsyncIOMotorDatabase):
    """
    Analyze query performance and suggest optimizations
    """
    # Example: Check if indexes are being used
    explain_result = await db.task_submissions.find({
        "candidate_id": "some_id",
        "status": "in_progress"
    }).explain()
    
    logger.info(f"Query execution stats: {explain_result}")
    
    # Check index usage
    if "executionStats" in explain_result:
        total_docs = explain_result["executionStats"].get("totalDocsExamined", 0)
        returned_docs = explain_result["executionStats"].get("nReturned", 0)
        
        if total_docs > returned_docs * 10:
            logger.warning(
                f"Query is scanning too many documents ({total_docs}) "
                f"for {returned_docs} results. Consider adding an index."
            )
