"""
📁 Projects API
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import uuid
from datetime import datetime

router = APIRouter()

projects_db = {}


class CreateProjectRequest(BaseModel):
    name: str
    description: str = ""
    type: str = "web"
    template: Optional[str] = None


class ProjectResponse(BaseModel):
    id: str
    name: str
    description: str
    type: str
    status: str
    created_at: str
    updated_at: str


@router.get("/", response_model=List[ProjectResponse])
async def list_projects(status: str = None, type: str = None, limit: int = 20):
    """List all projects."""
    projects = list(projects_db.values())
    if status:
        projects = [p for p in projects if p["status"] == status]
    if type:
        projects = [p for p in projects if p["type"] == type]
    return projects[:limit]


@router.post("/", response_model=ProjectResponse)
async def create_project(request: CreateProjectRequest):
    """Create a new project."""
    project_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    project = {
        "id": project_id,
        "name": request.name,
        "description": request.description,
        "type": request.type,
        "status": "draft",
        "created_at": now,
        "updated_at": now
    }
    projects_db[project_id] = project
    return project


@router.get("/{project_id}")
async def get_project(project_id: str):
    """Get project by ID."""
    if project_id not in projects_db:
        raise HTTPException(status_code=404, detail="Project not found")
    return projects_db[project_id]


@router.delete("/{project_id}")
async def delete_project(project_id: str):
    """Delete a project."""
    if project_id not in projects_db:
        raise HTTPException(status_code=404, detail="Project not found")
    del projects_db[project_id]
    return {"status": "deleted"}
