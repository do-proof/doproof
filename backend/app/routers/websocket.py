from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException
from typing import Dict, List
import json
import asyncio
from datetime import datetime
from bson import ObjectId

from app.core.auth import get_current_user_websocket
from app.core.database import get_database
from app.schemas.notification_schemas import RealtimeNotification

router = APIRouter()

class ConnectionManager:
    def __init__(self):
        # Store active connections by user_id
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)

    def disconnect(self, websocket: WebSocket, user_id: str):
        if user_id in self.active_connections:
            self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]

    async def send_personal_message(self, message: str, user_id: str):
        if user_id in self.active_connections:
            # Send to all connections for this user (multiple tabs/devices)
            disconnected_connections = []
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_text(message)
                except:
                    # Connection is broken, mark for removal
                    disconnected_connections.append(connection)
            
            # Remove broken connections
            for connection in disconnected_connections:
                self.active_connections[user_id].remove(connection)
            
            # Clean up empty user entries
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]

    async def broadcast_to_users(self, message: str, user_ids: List[str]):
        for user_id in user_ids:
            await self.send_personal_message(message, user_id)

    def get_connected_users(self) -> List[str]:
        return list(self.active_connections.keys())

# Global connection manager instance
manager = ConnectionManager()

@router.websocket("/ws/notifications/{user_id}")
async def websocket_notifications(websocket: WebSocket, user_id: str):
    """WebSocket endpoint for real-time notifications."""
    
    # Validate user_id format
    if not ObjectId.is_valid(user_id):
        await websocket.close(code=1008, reason="Invalid user ID format")
        return
    
    # TODO: Add proper authentication for WebSocket
    # For now, we'll trust the user_id parameter
    # In production, you'd want to validate the user's token
    
    await manager.connect(websocket, user_id)
    
    try:
        # Send initial connection confirmation
        await websocket.send_text(json.dumps({
            "type": "connection_established",
            "message": "Connected to notification stream",
            "timestamp": datetime.utcnow().isoformat()
        }))
        
        # Keep connection alive and handle incoming messages
        while True:
            try:
                # Wait for messages from client (like ping/pong for keepalive)
                data = await websocket.receive_text()
                message = json.loads(data)
                
                if message.get("type") == "ping":
                    await websocket.send_text(json.dumps({
                        "type": "pong",
                        "timestamp": datetime.utcnow().isoformat()
                    }))
                elif message.get("type") == "mark_read":
                    # Handle marking notifications as read
                    notification_id = message.get("notification_id")
                    if notification_id:
                        # TODO: Mark notification as read in database
                        await websocket.send_text(json.dumps({
                            "type": "notification_marked_read",
                            "notification_id": notification_id,
                            "timestamp": datetime.utcnow().isoformat()
                        }))
                        
            except WebSocketDisconnect:
                break
            except json.JSONDecodeError:
                # Invalid JSON, ignore
                continue
            except Exception as e:
                # Log error but don't disconnect
                print(f"WebSocket error for user {user_id}: {e}")
                continue
                
    except WebSocketDisconnect:
        pass
    finally:
        manager.disconnect(websocket, user_id)

# Function to send notification to user via WebSocket
async def send_realtime_notification(user_id: str, notification: RealtimeNotification):
    """Send a real-time notification to a specific user."""
    message = json.dumps({
        "type": "notification",
        "data": notification.dict()
    })
    await manager.send_personal_message(message, user_id)

# Function to broadcast notification to multiple users
async def broadcast_notification(user_ids: List[str], notification: RealtimeNotification):
    """Broadcast a notification to multiple users."""
    message = json.dumps({
        "type": "notification",
        "data": notification.dict()
    })
    await manager.broadcast_to_users(message, user_ids)

# Health check endpoint for WebSocket connections
@router.get("/ws/health")
async def websocket_health():
    """Get WebSocket connection health information."""
    return {
        "connected_users": len(manager.active_connections),
        "total_connections": sum(len(connections) for connections in manager.active_connections.values()),
        "active_user_ids": manager.get_connected_users()
    }

# Function to integrate with notification creation
async def notify_user_realtime(db, user_id: ObjectId, notification_type: str, title: str, message: str, data: dict = None):
    """Create a notification and send it via WebSocket if user is connected."""
    
    # Create notification in database
    from app.routers.notifications import create_notification
    notification_id = await create_notification(
        db=db,
        user_id=user_id,
        notification_type=notification_type,
        title=title,
        message=message,
        data=data or {}
    )
    
    # Send real-time notification if user is connected
    realtime_notification = RealtimeNotification(
        id=notification_id,
        type=notification_type,
        title=title,
        message=message,
        data=data or {},
        created_at=datetime.utcnow().isoformat()
    )
    
    await send_realtime_notification(str(user_id), realtime_notification)
    
    return notification_id