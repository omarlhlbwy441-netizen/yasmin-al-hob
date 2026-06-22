"""
📊 Analytics API
"""
from fastapi import APIRouter
from typing import Dict

router = APIRouter()


@router.get("/dashboard")
async def get_dashboard():
    """Get analytics dashboard data."""
    return {
        "total_projects": 42,
        "total_agents": 128,
        "active_deployments": 15,
        "total_users": 256,
        "metrics": {
            "requests_per_minute": 1200,
            "avg_response_time": 45,
            "error_rate": 0.02
        }
    }


@router.get("/projects/{project_id}")
async def get_project_analytics(project_id: str):
    """Get project-specific analytics."""
    return {
        "project_id": project_id,
        "deployments": 12,
        "builds": 45,
        "success_rate": 0.95,
        "avg_build_time": 120
    }
