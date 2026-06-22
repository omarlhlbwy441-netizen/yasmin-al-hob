"""
🌸 Yasmin FastAPI Application
Main entry point for the backend API
"""
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import socketio

from app.core.config import settings
from app.core.database import init_db
from app.core.middleware import setup_middleware
from app.api import projects, agents, deployments, auth, analytics, search, chat, plugin
from app.services.chat.server import sio, socket_app


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler."""
    # Startup
    await init_db()
    print("🌸 Yasmin API started")
    yield
    # Shutdown
    print("🌸 Yasmin API stopped")


app = FastAPI(
    title="Yasmin AI Builder API",
    description="Build apps, websites, games, and systems with parallel AI agents",
    version="3.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom middleware
setup_middleware(app)

# API Routes
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(projects.router, prefix="/api/v1/projects", tags=["Projects"])
app.include_router(agents.router, prefix="/api/v1/agents", tags=["Agents"])
app.include_router(deployments.router, prefix="/api/v1/deployments", tags=["Deployments"])
app.include_router(analytics.router, prefix="/api/v1/analytics", tags=["Analytics"])
app.include_router(search.router, prefix="/api/v1/search", tags=["Search"])
app.include_router(chat.router, prefix="/api/v1/chat", tags=["Chat"])
app.include_router(plugin.router, prefix="/api/v1/plugin", tags=["ChatGPT Plugin"])

# Mount Socket.io
app.mount("/ws", socket_app)


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "version": "3.0.0", "service": "yasmin-api"}


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "name": "Yasmin AI Builder",
        "version": "3.0.0",
        "docs": "/docs",
        "health": "/health"
    }


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler."""
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "type": type(exc).__name__}
    )
