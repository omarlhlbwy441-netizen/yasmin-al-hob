"""
🔐 Authentication API
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel

router = APIRouter()


class LoginRequest(BaseModel):
    email: str
    password: str


class RegisterRequest(BaseModel):
    email: str
    password: str
    name: str


@router.post("/login")
async def login(request: LoginRequest):
    """User login."""
    return {"access_token": "mock_token", "token_type": "bearer"}


@router.post("/register")
async def register(request: RegisterRequest):
    """User registration."""
    return {"id": "user_123", "email": request.email, "name": request.name}


@router.post("/logout")
async def logout():
    """User logout."""
    return {"status": "logged_out"}


@router.get("/me")
async def get_current_user():
    """Get current user."""
    return {"id": "user_123", "email": "user@yasmin.ai", "name": "Yasmin User"}
