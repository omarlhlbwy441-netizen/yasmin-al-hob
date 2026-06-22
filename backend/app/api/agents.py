"""
🤖 Agents API
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import uuid
from datetime import datetime

router = APIRouter()

agents_db = {}


class CreateAgentRequest(BaseModel):
    name: str
    role: str
    project_id: str
    capabilities: List[str] = []


@router.get("/")
async def list_agents(project_id: str = None, status: str = None):
    """List agents."""
    agents = list(agents_db.values())
    if project_id:
        agents = [a for a in agents if a["project_id"] == project_id]
    if status:
        agents = [a for a in agents if a["status"] == status]
    return {"agents": agents}


@router.post("/")
async def create_agent(request: CreateAgentRequest):
    """Create a new agent."""
    agent_id = str(uuid.uuid4())
    agent = {
        "id": agent_id,
        "name": request.name,
        "role": request.role,
        "project_id": request.project_id,
        "status": "idle",
        "capabilities": request.capabilities,
        "created_at": datetime.utcnow().isoformat(),
        "last_active": datetime.utcnow().isoformat()
    }
    agents_db[agent_id] = agent
    return agent


@router.get("/{agent_id}")
async def get_agent(agent_id: str):
    """Get agent by ID."""
    if agent_id not in agents_db:
        raise HTTPException(status_code=404, detail="Agent not found")
    return agents_db[agent_id]


@router.post("/{agent_id}/run")
async def run_agent(agent_id: str, task: dict):
    """Run an agent task."""
    if agent_id not in agents_db:
        raise HTTPException(status_code=404, detail="Agent not found")

    agent = agents_db[agent_id]
    agent["status"] = "running"

    return {
        "success": True,
        "agent_id": agent_id,
        "output": f"Agent {agent['name']} executed: {task.get('description', 'No description')}",
        "execution_time": 2.5
    }
