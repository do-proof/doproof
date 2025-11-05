# MongoDB to SQLite Migration Guide

This guide explains the changes made to migrate from MongoDB to SQLite.

## Changes Made

### 1. Dependencies Updated
- Removed: `motor` (MongoDB async driver)
- Added: `sqlalchemy` and `aiosqlite` (SQLite async support)

### 2. Database Configuration
- Updated `app/core/database.py` to use SQLAlchemy with async SQLite
- Changed connection string format in `.env` files

### 3. Models Updated
- Converted Pydantic models to SQLAlchemy models
- Changed from MongoDB ObjectId to integer primary keys
- JSON columns used for complex nested data structures

### 4. Authentication Updated
- Updated `app/core/auth.py` to work with SQLAlchemy queries
- Changed user ID handling from ObjectId to integer

### 5. Routers Updated
- Updated database queries from MongoDB syntax to SQLAlchemy
- Changed dependency injection to use SQLAlchemy sessions

## Setup Instructions

1. Install new dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Initialize the database:
   ```bash
   python init_db.py
   ```

3. Start the application:
   ```bash
   python main.py
   ```

## Key Differences

### Before (MongoDB)
```python
# Query
user = await db.users.find_one({"email": email})

# Insert
result = await db.users.insert_one(user_dict)
```

### After (SQLite/SQLAlchemy)
```python
# Query
result = await db.execute(select(UserModel).where(UserModel.email == email))
user = result.scalar_one_or_none()

# Insert
db_user = UserModel(**user_dict)
db.add(db_user)
await db.commit()
```

## Notes

- Complex nested objects are stored as JSON in SQLite
- Primary keys are now integers instead of ObjectIds
- All async operations use SQLAlchemy's async session
- Database file will be created as `doproof.db` in the backend directory