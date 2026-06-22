"""
🚀 Deployments API
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
import uuid
from datetime import datetime

router = APIRouter()

deployments_db = {}


class DeployRequest(BaseModel):
    project_id: str
    environment: str = "staging"
    version: str = "1.0.0"


@router.get("/")
async def list_deployments(status: str = None, project_id: str = None):
    """List deployments."""
    deployments = list(deployments_db.values())
    if status:
        deployments = [d for d in deployments if d["status"] == status]
    if project_id:
        deployments = [d for d in deployments if d["project_id"] == project_id]
    return {"deployments": deployments}


@router.post("/")
async def create_deployment(request: DeployRequest):
    """Create a new deployment."""
    deployment_id = str(uuid.uuid4())
    deployment = {
        "id": deployment_id,
        "project_id": request.project_id,
        "environment": request.environment,
        "version": request.version,
        "status": "pending",
        "url": f"https://{request.project_id}.yasmin.app",
        "started_at": datetime.utcnow().isoformat(),
        "completed_at": None
    }
    deployments_db[deployment_id] = deployment
    return deployment
