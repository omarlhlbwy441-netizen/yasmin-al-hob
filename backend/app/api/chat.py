"""
💬 Chat API
"""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import List

router = APIRouter()


class CreateRoomRequest(BaseModel):
    name: str
    type: str = "project"
    participants: List[str] = []


class SendMessageRequest(BaseModel):
    room_id: str
    content: str
    type: str = "text"


@router.post("/rooms")
async def create_room(request: CreateRoomRequest):
    """Create a chat room."""
    return {"id": "room_123", "name": request.name, "type": request.type}


@router.get("/rooms/{room_id}/messages")
async def get_messages(room_id: str, limit: int = 50):
    """Get room messages."""
    return {"room_id": room_id, "messages": [], "total": 0}


@router.post("/messages")
async def send_message(request: SendMessageRequest):
    """Send a message."""
    return {"id": "msg_123", "room_id": request.room_id, "content": request.content}
