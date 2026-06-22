"""
🚀 Socket.io Server Setup for Yasmin
"""
import socketio
from .service import chat
from .socket_handlers import SocketEventHandler


# Create Socket.io server with Redis adapter for scaling
sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins=["*"],
    ping_timeout=60,
    ping_interval=25,
    max_http_buffer_size=10_000_000,  # 10MB for file uploads
)

# Wrap with ASGI app
socket_app = socketio.ASGIApp(sio)

# Initialize handlers
handler = SocketEventHandler(sio, chat)


async def init_chat_service(redis_url: str = "redis://localhost:6379"):
    """Initialize chat service with Redis."""
    await chat.initialize(redis_url)
