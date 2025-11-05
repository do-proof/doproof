# DoProof Backend

This is the FastAPI backend for the DoProof application.

## Structure

```
backend/
├── app/
│   ├── core/           # Core configuration and utilities
│   │   ├── auth.py     # Authentication utilities
│   │   ├── config.py   # Application settings
│   │   └── database.py # Database connection
│   ├── models/         # Database models
│   ├── routers/        # API route handlers
│   ├── schemas/        # Pydantic schemas
│   └── main.py         # FastAPI application
├── main.py             # Application entry point
├── requirements.txt    # Python dependencies
└── env.example         # Environment variables template
```

## Setup

1. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Set up environment variables:**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

3. **Run the development server:**
   ```bash
   python -m uvicorn app.main:app --host 0.0.0.0 --port 5000 --reload
   ```

## API Documentation

Once the server is running, you can access:
- API documentation: http://localhost:5000/docs
- Alternative docs: http://localhost:5000/redoc

## Dependencies

- FastAPI - Web framework
- Uvicorn - ASGI server
- Motor - Async MongoDB driver
- Pydantic - Data validation
- Python-Jose - JWT handling
- Passlib - Password hashing
