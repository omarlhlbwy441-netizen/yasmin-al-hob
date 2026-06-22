"""
🔌 Socket.io Event Handlers for Yasmin Chat
"""
from typing import Dict
import json


class SocketEventHandler:
    """Handle Socket.io events for real-time chat."""

    def __init__(self, sio, chat_service):
        self.sio = sio
        self.chat = chat_service
        self._setup_handlers()

    def _setup_handlers(self):
        """Register all event handlers."""

        @self.sio.event
        async def connect(sid, environ):
            """Handle new connection."""
            print(f"Client connected: {sid}")
            await self.sio.emit("connected", {"sid": sid, "status": "ok"}, room=sid)

        @self.sio.event
        async def disconnect(sid):
            """Handle disconnection."""
            print(f"Client disconnected: {sid}")
            # Find and remove user from all rooms
            # Implementation depends on your user tracking

        @self.sio.on("join_room")
        async def on_join_room(sid, data):
            """Join a chat room."""
            room_id = data.get("room_id")
            user_id = data.get("user_id")

            await self.sio.enter_room(sid, room_id)
            await self.chat.join_room(room_id, user_id, sid)

            # Send room history
            messages = await self.chat.get_messages(room_id, limit=50)
            await self.sio.emit("room_history", {
                "room_id": room_id,
                "messages": [m.to_dict() for m in messages]
            }, room=sid)

        @self.sio.on("leave_room")
        async def on_leave_room(sid, data):
            """Leave a chat room."""
            room_id = data.get("room_id")
            user_id = data.get("user_id")

            await self.sio.leave_room(sid, room_id)
            await self.chat.leave_room(room_id, user_id)

        @self.sio.on("send_message")
        async def on_send_message(sid, data):
            """Handle incoming message."""
            message = await self.chat.send_message(
                room_id=data["room_id"],
                sender_id=data["sender_id"],
                sender_type=data.get("sender_type", "user"),
                sender_name=data.get("sender_name", ""),
                content=data["content"],
                msg_type=data.get("type", "text"),
                metadata=data.get("metadata", {}),
                reply_to=data.get("reply_to")
            )

            # Broadcast to room
            await self.sio.emit("new_message", message.to_dict(), room=data["room_id"])

        @self.sio.on("typing")
        async def on_typing(sid, data):
            """Handle typing indicator."""
            await self.chat.set_typing(
                data["room_id"],
                data["user_id"],
                data.get("is_typing", True)
            )

            # Broadcast typing status
            typing_users = await self.chat.get_typing_users(data["room_id"])
            await self.sio.emit("typing_update", {
                "room_id": data["room_id"],
                "typing_users": typing_users
            }, room=data["room_id"], skip_sid=sid)

        @self.sio.on("reaction")
        async def on_reaction(sid, data):
            """Handle message reaction."""
            await self.chat.add_reaction(
                data["message_id"],
                data["user_id"],
                data["emoji"]
            )

            await self.sio.emit("reaction_update", {
                "message_id": data["message_id"],
                "user_id": data["user_id"],
                "emoji": data["emoji"]
            }, room=data.get("room_id"))

        @self.sio.on("edit_message")
        async def on_edit_message(sid, data):
            """Handle message edit."""
            message = await self.chat.edit_message(
                data["message_id"],
                data["new_content"]
            )

            if message:
                await self.sio.emit("message_edited", message.to_dict(), room=message.room_id)

        @self.sio.on("delete_message")
        async def on_delete_message(sid, data):
            """Handle message deletion."""
            success = await self.chat.delete_message(data["message_id"])

            if success:
                await self.sio.emit("message_deleted", {
                    "message_id": data["message_id"]
                }, room=data.get("room_id"))

        @self.sio.on("user_online")
        async def on_user_online(sid, data):
            """Track user online status."""
            await self.chat.set_user_online(
                data["user_id"],
                sid,
                data.get("metadata", {})
            )

        @self.sio.on("get_online_users")
        async def on_get_online_users(sid, data):
            """Get online users."""
            users = await self.chat.get_online_users()
            await self.sio.emit("online_users", {"users": users}, room=sid)
