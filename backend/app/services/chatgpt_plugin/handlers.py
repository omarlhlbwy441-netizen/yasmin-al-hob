"""
🤖 ChatGPT Plugin Backend Handlers
Handles plugin requests from ChatGPT
"""
from fastapi import APIRouter, Depends, HTTPException, Request
from typing import Dict, List, Optional
from pydantic import BaseModel
from datetime import datetime
import uuid


router = APIRouter(prefix="/plugin", tags=["ChatGPT Plugin"])


class CreateProjectRequest(BaseModel):
    name: str
    description: str = ""
    type: str = "web"
    template: Optional[str] = None
    config: Optional[Dict] = {}


class CreateAgentRequest(BaseModel):
    name: str
    role: str
    capabilities: List[str] = []
    config: Optional[Dict] = {}


class DeployRequest(BaseModel):
    environment: str = "staging"
    version: Optional[str] = None
    config: Optional[Dict] = {}


class RunAgentRequest(BaseModel):
    task: str
    parameters: Optional[Dict] = {}
    timeout: int = 300


class GenerateCodeRequest(BaseModel):
    description: str
    framework: str
    language: Optional[str] = None
    context: Optional[str] = None


# Mock data for demonstration
projects_db = {}
agents_db = {}
deployments_db = {}


@router.get("/projects")
async def list_projects(status: str = None, type: str = None, limit: int = 20):
    """List all projects."""
    projects = list(projects_db.values())
    if status:
        projects = [p for p in projects if p["status"] == status]
    if type:
        projects = [p for p in projects if p["type"] == type]
    return {"projects": projects[:limit], "total": len(projects)}


@router.post("/projects")
async def create_project(request: CreateProjectRequest):
    """Create a new project."""
    project_id = str(uuid.uuid4())
    project = {
        "id": project_id,
        "name": request.name,
        "description": request.description,
        "type": request.type,
        "status": "draft",
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
        "agents_count": 0,
        "deployments_count": 0
    }
    projects_db[project_id] = project
    return project


@router.get("/projects/{project_id}")
async def get_project(project_id: str):
    """Get project details."""
    if project_id not in projects_db:
        raise HTTPException(status_code=404, detail="Project not found")
    return projects_db[project_id]


@router.delete("/projects/{project_id}")
async def delete_project(project_id: str):
    """Delete a project."""
    if project_id not in projects_db:
        raise HTTPException(status_code=404, detail="Project not found")
    del projects_db[project_id]
    return {"status": "deleted"}


@router.get("/projects/{project_id}/agents")
async def list_agents(project_id: str):
    """List agents in a project."""
    agents = [a for a in agents_db.values() if a["project_id"] == project_id]
    return {"agents": agents}


@router.post("/projects/{project_id}/agents")
async def create_agent(project_id: str, request: CreateAgentRequest):
    """Create a new agent."""
    if project_id not in projects_db:
        raise HTTPException(status_code=404, detail="Project not found")

    agent_id = str(uuid.uuid4())
    agent = {
        "id": agent_id,
        "name": request.name,
        "role": request.role,
        "status": "idle",
        "project_id": project_id,
        "capabilities": request.capabilities,
        "created_at": datetime.utcnow().isoformat(),
        "last_active": datetime.utcnow().isoformat()
    }
    agents_db[agent_id] = agent
    projects_db[project_id]["agents_count"] += 1
    return agent


@router.post("/projects/{project_id}/deploy")
async def deploy_project(project_id: str, request: DeployRequest):
    """Deploy a project."""
    if project_id not in projects_db:
        raise HTTPException(status_code=404, detail="Project not found")

    deployment_id = str(uuid.uuid4())
    deployment = {
        "id": deployment_id,
        "project_id": project_id,
        "status": "pending",
        "environment": request.environment,
        "url": f"https://{project_id}.yasmin.app",
        "started_at": datetime.utcnow().isoformat()
    }
    deployments_db[deployment_id] = deployment
    projects_db[project_id]["deployments_count"] += 1
    return deployment


@router.post("/agents/{agent_id}/run")
async def run_agent(agent_id: str, request: RunAgentRequest):
    """Execute an agent task."""
    if agent_id not in agents_db:
        raise HTTPException(status_code=404, detail="Agent not found")

    agent = agents_db[agent_id]
    agent["status"] = "running"
    agent["last_active"] = datetime.utcnow().isoformat()

    # Simulate agent execution
    return {
        "success": True,
        "output": f"Agent {agent['name']} executed task: {request.task}",
        "artifacts": [],
        "execution_time": 2.5
    }


@router.post("/code/generate")
async def generate_code(request: GenerateCodeRequest):
    """Generate code using AI."""
    return {
        "files": [
            {
                "path": f"src/App.{request.framework}",
                "content": f"// Generated {request.framework} code\n// {request.description}"
            }
        ],
        "explanation": f"Generated code for {request.framework} based on: {request.description}",
        "dependencies": ["react", "react-dom"] if request.framework == "react" else []
    }


@router.get("/deployments")
async def list_deployments(status: str = None, project_id: str = None):
    """List deployments."""
    deployments = list(deployments_db.values())
    if status:
        deployments = [d for d in deployments if d["status"] == status]
    if project_id:
        deployments = [d for d in deployments if d["project_id"] == project_id]
    return {"deployments": deployments}
