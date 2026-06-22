"""
💬 Yasmin Realtime Chat Service
Socket.io-based real-time communication between agents and users
"""
import asyncio
import json
import uuid
from typing import Dict, List, Optional, Callable, Any
from dataclasses import dataclass, field, asdict
from datetime import datetime
from enum import Enum
import redis.asyncio as redis
from functools import wraps


class MessageType(Enum):
    TEXT = "text"
    CODE = "code"
    IMAGE = "image"
    FILE = "file"
    SYSTEM = "system"
    AGENT_ACTION = "agent_action"
    TYPING = "typing"
    STATUS = "status"


class ChatRoomType(Enum):
    DIRECT = "direct"
    PROJECT = "project"
    AGENT_TEAM = "agent_team"
    BROADCAST = "broadcast"


@dataclass
class ChatMessage:
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    room_id: str = ""
    sender_id: str = ""
    sender_type: str = "user"  # user, agent, system
    sender_name: str = ""
    type: str = MessageType.TEXT.value
    content: str = ""
    metadata: Dict = field(default_factory=dict)
    timestamp: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    reply_to: Optional[str] = None
    edited: bool = False
    edited_at: Optional[str] = None
    reactions: Dict[str, List[str]] = field(default_factory=dict)

    def to_dict(self) -> Dict:
        return asdict(self)


@dataclass
class ChatRoom:
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    name: str = ""
    type: str = ChatRoomType.PROJECT.value
    participants: List[str] = field(default_factory=list)
    created_by: str = ""
    created_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    metadata: Dict = field(default_factory=dict)
    is_private: bool = False


class ChatService:
    """Real-time chat service with Redis pub/sub for multi-instance scaling."""

    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    async def initialize(self, redis_url: str = "redis://localhost:6379"):
        """Initialize Redis connection."""
        if self._initialized:
            return

        self.redis = redis.from_url(redis_url, decode_responses=True)
        self.pubsub = self.redis.pubsub()
        self.rooms: Dict[str, ChatRoom] = {}
        self.messages: Dict[str, List[ChatMessage]] = {}
        self.online_users: Dict[str, Dict] = {}
        self.typing_indicators: Dict[str, set] = {}
        self._callbacks: Dict[str, List[Callable]] = {}
        self._initialized = True

        # Subscribe to all chat channels
        await self.pubsub.subscribe("chat:broadcast")
        asyncio.create_task(self._listen_redis())

    async def _listen_redis(self):
        """Listen for Redis pub/sub messages."""
        async for message in self.pubsub.listen():
            if message["type"] == "message":
                data = json.loads(message["data"])
                await self._handle_redis_message(data)

    async def _handle_redis_message(self, data: Dict):
        """Handle incoming Redis messages."""
        event_type = data.get("event")
        if event_type in self._callbacks:
            for callback in self._callbacks[event_type]:
                try:
                    await callback(data["payload"])
                except Exception as e:
                    print(f"Callback error: {e}")

    def on(self, event: str, callback: Callable):
        """Register event callback."""
        if event not in self._callbacks:
            self._callbacks[event] = []
        self._callbacks[event].append(callback)

    async def create_room(
        self, name: str, room_type: ChatRoomType = ChatRoomType.PROJECT,
        created_by: str = "", participants: List[str] = None, is_private: bool = False
    ) -> ChatRoom:
        """Create a new chat room."""
        room = ChatRoom(
            name=name,
            type=room_type.value,
            participants=participants or [],
            created_by=created_by,
            is_private=is_private
        )
        self.rooms[room.id] = room
        self.messages[room.id] = []

        # Persist to Redis
        await self.redis.hset("chat:rooms", room.id, json.dumps(room.__dict__))

        # Notify
        await self._publish("room_created", {"room": room.__dict__})
        return room

    async def join_room(self, room_id: str, user_id: str, socket_id: str = None):
        """Join a chat room."""
        if room_id not in self.rooms:
            raise ValueError(f"Room {room_id} not found")

        room = self.rooms[room_id]
        if user_id not in room.participants:
            room.participants.append(user_id)

        # Track socket
        if socket_id:
            await self.redis.hset(f"chat:room:{room_id}:sockets", user_id, socket_id)

        # System message
        await self.send_message(
            room_id=room_id,
            sender_id="system",
            sender_type="system",
            sender_name="System",
            content=f"{user_id} joined the room",
            msg_type=MessageType.SYSTEM
        )

    async def leave_room(self, room_id: str, user_id: str):
        """Leave a chat room."""
        if room_id in self.rooms:
            room = self.rooms[room_id]
            if user_id in room.participants:
                room.participants.remove(user_id)

            await self.redis.hdel(f"chat:room:{room_id}:sockets", user_id)

            await self.send_message(
                room_id=room_id,
                sender_id="system",
                sender_type="system",
                sender_name="System",
                content=f"{user_id} left the room",
                msg_type=MessageType.SYSTEM
            )

    async def send_message(
        self, room_id: str, sender_id: str, sender_type: str = "user",
        sender_name: str = "", content: str = "", msg_type: MessageType = MessageType.TEXT,
        metadata: Dict = None, reply_to: str = None
    ) -> ChatMessage:
        """Send a message to a room."""
        message = ChatMessage(
            room_id=room_id,
            sender_id=sender_id,
            sender_type=sender_type,
            sender_name=sender_name,
            type=msg_type.value,
            content=content,
            metadata=metadata or {},
            reply_to=reply_to
        )

        # Store message
        if room_id not in self.messages:
            self.messages[room_id] = []
        self.messages[room_id].append(message)

        # Persist to Redis (last 100 messages)
        await self.redis.lpush(f"chat:room:{room_id}:messages", json.dumps(message.to_dict()))
        await self.redis.ltrim(f"chat:room:{room_id}:messages", 0, 99)

        # Publish to Redis for multi-instance
        await self._publish("new_message", {"message": message.to_dict()})

        return message

    async def get_messages(self, room_id: str, limit: int = 50, offset: int = 0) -> List[ChatMessage]:
        """Get messages from a room."""
        messages = self.messages.get(room_id, [])
        return messages[offset:offset + limit]

    async def edit_message(self, message_id: str, new_content: str) -> Optional[ChatMessage]:
        """Edit a message."""
        for room_messages in self.messages.values():
            for msg in room_messages:
                if msg.id == message_id:
                    msg.content = new_content
                    msg.edited = True
                    msg.edited_at = datetime.utcnow().isoformat()
                    await self._publish("message_edited", {"message": msg.to_dict()})
                    return msg
        return None

    async def delete_message(self, message_id: str) -> bool:
        """Delete a message."""
        for room_id, room_messages in self.messages.items():
            for i, msg in enumerate(room_messages):
                if msg.id == message_id:
                    room_messages.pop(i)
                    await self._publish("message_deleted", {"message_id": message_id, "room_id": room_id})
                    return True
        return False

    async def add_reaction(self, message_id: str, user_id: str, emoji: str):
        """Add a reaction to a message."""
        for room_messages in self.messages.values():
            for msg in room_messages:
                if msg.id == message_id:
                    if emoji not in msg.reactions:
                        msg.reactions[emoji] = []
                    if user_id not in msg.reactions[emoji]:
                        msg.reactions[emoji].append(user_id)
                    await self._publish("reaction_added", {
                        "message_id": message_id,
                        "user_id": user_id,
                        "emoji": emoji
                    })
                    return True
        return False

    async def set_typing(self, room_id: str, user_id: str, is_typing: bool):
        """Set typing indicator."""
        key = f"{room_id}:{user_id}"
        if is_typing:
            if room_id not in self.typing_indicators:
                self.typing_indicators[room_id] = set()
            self.typing_indicators[room_id].add(user_id)
        else:
            if room_id in self.typing_indicators:
                self.typing_indicators[room_id].discard(user_id)

        await self._publish("typing", {
            "room_id": room_id,
            "user_id": user_id,
            "is_typing": is_typing
        })

    async def get_typing_users(self, room_id: str) -> List[str]:
        """Get users currently typing in a room."""
        return list(self.typing_indicators.get(room_id, set()))

    async def set_user_online(self, user_id: str, socket_id: str, metadata: Dict = None):
        """Set user as online."""
        self.online_users[user_id] = {
            "socket_id": socket_id,
            "metadata": metadata or {},
            "last_seen": datetime.utcnow().isoformat()
        }
        await self.redis.hset("chat:online", user_id, json.dumps(self.online_users[user_id]))
        await self._publish("user_online", {"user_id": user_id})

    async def set_user_offline(self, user_id: str):
        """Set user as offline."""
        if user_id in self.online_users:
            del self.online_users[user_id]
        await self.redis.hdel("chat:online", user_id)
        await self._publish("user_offline", {"user_id": user_id})

    async def get_online_users(self) -> Dict[str, Dict]:
        """Get all online users."""
        return self.online_users.copy()

    async def _publish(self, event: str, payload: Dict):
        """Publish event to Redis."""
        await self.redis.publish("chat:broadcast", json.dumps({
            "event": event,
            "payload": payload,
            "timestamp": datetime.utcnow().isoformat()
        }))

    async def get_room_info(self, room_id: str) -> Optional[Dict]:
        """Get room information."""
        room = self.rooms.get(room_id)
        if room:
            return {
                **room.__dict__,
                "message_count": len(self.messages.get(room_id, [])),
                "online_participants": [
                    u for u in room.participants
                    if u in self.online_users
                ]
            }
        return None

    async def search_messages(self, room_id: str, query: str, limit: int = 20) -> List[ChatMessage]:
        """Search messages in a room."""
        messages = self.messages.get(room_id, [])
        results = [m for m in messages if query.lower() in m.content.lower()]
        return results[:limit]


chat = ChatService()
