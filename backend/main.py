import uvicorn
from app.main import app
from app.core.database import connect_to_database, close_database_connection

app.add_event_handler("startup", connect_to_database)
app.add_event_handler("shutdown", close_database_connection)

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=5000, reload=True)